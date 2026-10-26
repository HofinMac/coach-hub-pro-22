-- Group lesson invitations
--
-- A coach invites app clients and/or plain e-mail addresses to a slot (typically a
-- group lesson). App clients answer in the app; everyone gets an e-mail with
-- "Jdu / Nejdu" links (/pozvanka/<token>) that work without signing in.
-- Accepting takes a seat: app clients get a confirmed slot_booking, e-mail guests
-- are counted in coach_slots.booked_count. Capacity is enforced.
-- Invitations are never deleted (withdrawn instead), so e-mail limits can't be
-- reset by deleting and re-inviting.

CREATE TABLE public.slot_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_id uuid NOT NULL REFERENCES public.coach_slots(id) ON DELETE CASCADE,
  coach_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  name text NOT NULL DEFAULT '',
  token uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'withdrawn')),
  booking_id uuid REFERENCES public.slot_bookings(id) ON DELETE SET NULL,
  responded_at timestamptz,
  email_sent_at timestamptz,
  email_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (client_id IS NOT NULL OR email IS NOT NULL)
);

CREATE UNIQUE INDEX slot_invitations_client_uq ON public.slot_invitations (slot_id, client_id) WHERE client_id IS NOT NULL;
CREATE UNIQUE INDEX slot_invitations_email_uq ON public.slot_invitations (slot_id, lower(email)) WHERE client_id IS NULL;
CREATE INDEX slot_invitations_slot_idx ON public.slot_invitations (slot_id);
CREATE INDEX slot_invitations_coach_idx ON public.slot_invitations (coach_id, created_at);

ALTER TABLE public.slot_invitations ENABLE ROW LEVEL SECURITY;

-- Written only through the functions below. Coaches can read the token on purpose:
-- they may record an answer given in person or by phone.
CREATE POLICY "Coaches read own invitations" ON public.slot_invitations
  FOR SELECT TO authenticated USING (coach_id = auth.uid());

CREATE POLICY "Clients read own invitations" ON public.slot_invitations
  FOR SELECT TO authenticated USING (client_id = auth.uid());

-- ─── Booking notifications can be suppressed for invitation responses ───────

CREATE OR REPLACE FUNCTION private.notify_booking_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _slot public.coach_slots%ROWTYPE;
  _when text;
  _tag text := 'booking-' || NEW.id;
BEGIN
  -- Bookings created/cancelled by an invitation response notify the coach from
  -- respond_to_slot_invitation() instead.
  IF current_setting('app.suppress_booking_notify', true) = 'on' THEN
    RETURN NULL;
  END IF;
  IF TG_OP = 'UPDATE' AND NEW.status IS NOT DISTINCT FROM OLD.status THEN
    RETURN NULL;
  END IF;

  SELECT * INTO _slot FROM public.coach_slots WHERE id = NEW.slot_id;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;
  _when := private.format_when(_slot.start_time);

  IF TG_OP = 'INSERT' THEN
    IF NEW.status = 'pending' THEN
      PERFORM public.enqueue_notification(_slot.coach_id, 'newBooking', 'Nová žádost o rezervaci',
        private.display_name(NEW.client_id) || ' · ' || _when, '/calendar', _tag);
    ELSIF NEW.status = 'confirmed' THEN
      PERFORM public.enqueue_notification(NEW.client_id, 'newBooking', 'Nový termín tréninku',
        'Trenér vás zapsal na ' || _when, '/klient/kalendar', _tag);
    END IF;
  ELSIF NEW.status = 'confirmed' THEN
    PERFORM public.enqueue_notification(NEW.client_id, 'newBooking', 'Rezervace potvrzena',
      'Trénink ' || _when, '/klient/kalendar', _tag);
  ELSIF NEW.status = 'rejected' THEN
    PERFORM public.enqueue_notification(NEW.client_id, 'cancelledBooking', 'Rezervace zamítnuta',
      'Termín ' || _when || ' trenér nepotvrdil', '/klient/kalendar', _tag);
  ELSIF NEW.status = 'cancelled' THEN
    IF auth.uid() = NEW.client_id THEN
      PERFORM public.enqueue_notification(_slot.coach_id, 'cancelledBooking', 'Klient zrušil rezervaci',
        private.display_name(NEW.client_id) || ' · ' || _when, '/calendar', _tag);
    ELSE
      PERFORM public.enqueue_notification(NEW.client_id, 'cancelledBooking', 'Trénink byl zrušen',
        'Termín ' || _when || ' se neuskuteční', '/klient/kalendar', _tag);
    END IF;
  END IF;
  RETURN NULL;
END;
$$;

-- ─── Invite ─────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.invite_to_slot(_slot_id uuid, _client_ids uuid[], _emails text[])
RETURNS SETOF public.slot_invitations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _slot public.coach_slots%ROWTYPE;
  _client uuid;
  _email text;
  _existing_client uuid;
  _coach_name text;
  _ids uuid[] := '{}';
  _new_id uuid;
BEGIN
  SELECT * INTO _slot FROM public.coach_slots WHERE id = _slot_id;
  IF NOT FOUND OR _slot.coach_id <> auth.uid() THEN
    RAISE EXCEPTION 'SLOT_NOT_FOUND' USING ERRCODE = 'P0002';
  END IF;
  IF _slot.status NOT IN ('available', 'partially_booked', 'booked') OR _slot.start_time <= now() THEN
    RAISE EXCEPTION 'SLOT_CLOSED' USING ERRCODE = 'P0001';
  END IF;
  IF nullif(btrim(_slot.manual_client_name), '') IS NOT NULL THEN
    RAISE EXCEPTION 'SLOT_MANUALLY_OCCUPIED' USING ERRCODE = 'P0001';
  END IF;

  -- Abuse limits: e-mails go out from our domain.
  IF coalesce(array_length(_client_ids, 1), 0) + coalesce(array_length(_emails, 1), 0)
     + (SELECT count(*) FROM public.slot_invitations WHERE slot_id = _slot_id) > 50 THEN
    RAISE EXCEPTION 'TOO_MANY_INVITATIONS' USING ERRCODE = 'P0001';
  END IF;
  -- (withdrawn rows count too)
  IF (SELECT count(*) FROM public.slot_invitations
        WHERE coach_id = auth.uid() AND email IS NOT NULL AND created_at > now() - interval '1 day')
     + coalesce(array_length(_emails, 1), 0) + coalesce(array_length(_client_ids, 1), 0) > 200 THEN
    RAISE EXCEPTION 'DAILY_LIMIT' USING ERRCODE = 'P0001';
  END IF;

  _coach_name := private.display_name(auth.uid());

  FOREACH _client IN ARRAY coalesce(_client_ids, '{}') LOOP
    IF NOT public.is_my_client(_client) THEN
      RAISE EXCEPTION 'NOT_YOUR_CLIENT' USING ERRCODE = '42501';
    END IF;
    INSERT INTO public.slot_invitations (slot_id, coach_id, client_id, name, email)
    SELECT _slot_id, auth.uid(), _client, private.display_name(_client), nullif(p.email, '')
    FROM public.profiles p WHERE p.id = _client
    ON CONFLICT DO NOTHING
    RETURNING id INTO _new_id;
    IF _new_id IS NOT NULL THEN
      _ids := _ids || _new_id;
      PERFORM public.enqueue_notification(_client, 'newBooking', 'Pozvánka na lekci',
        _coach_name || ' · ' || private.format_when(_slot.start_time), '/klient/kalendar', 'invitation-' || _new_id);
    END IF;
    _new_id := NULL;
  END LOOP;

  FOREACH _email IN ARRAY coalesce(_emails, '{}') LOOP
    _email := lower(btrim(_email));
    CONTINUE WHEN _email = '';
    IF _email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' THEN
      RAISE EXCEPTION 'INVALID_EMAIL: %', _email USING ERRCODE = '22023';
    END IF;
    -- An address that belongs to one of the coach's clients becomes an app invitation.
    SELECT id INTO _existing_client FROM public.profiles
      WHERE lower(email) = _email AND assigned_coach_id = auth.uid() LIMIT 1;
    IF _existing_client IS NOT NULL THEN
      INSERT INTO public.slot_invitations (slot_id, coach_id, client_id, name, email)
      VALUES (_slot_id, auth.uid(), _existing_client, private.display_name(_existing_client), _email)
      ON CONFLICT DO NOTHING RETURNING id INTO _new_id;
    ELSE
      INSERT INTO public.slot_invitations (slot_id, coach_id, email, name)
      VALUES (_slot_id, auth.uid(), _email, split_part(_email, '@', 1))
      ON CONFLICT DO NOTHING RETURNING id INTO _new_id;
    END IF;
    IF _new_id IS NOT NULL THEN
      _ids := _ids || _new_id;
      IF _existing_client IS NOT NULL THEN
        PERFORM public.enqueue_notification(_existing_client, 'newBooking', 'Pozvánka na lekci',
          _coach_name || ' · ' || private.format_when(_slot.start_time), '/klient/kalendar', 'invitation-' || _new_id);
      END IF;
    END IF;
    _new_id := NULL;
    _existing_client := NULL;
  END LOOP;

  RETURN QUERY SELECT * FROM public.slot_invitations WHERE id = ANY(_ids) ORDER BY created_at;
END;
$$;

REVOKE ALL ON FUNCTION public.invite_to_slot(uuid, uuid[], text[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.invite_to_slot(uuid, uuid[], text[]) TO authenticated;

-- ─── Read / respond by token (works without signing in) ─────────────────────

CREATE OR REPLACE FUNCTION public.get_slot_invitation(_token uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'status', i.status,
    'name', i.name,
    'coach_name', private.display_name(s.coach_id),
    'start_time', s.start_time,
    'end_time', s.end_time,
    'slot_type', s.slot_type,
    'notes', coalesce(s.notes, ''),
    'closed', s.status NOT IN ('available', 'partially_booked', 'booked') OR s.start_time <= now(),
    'full', i.status <> 'accepted' AND s.booked_count >= s.capacity
  )
  FROM public.slot_invitations i
  JOIN public.coach_slots s ON s.id = i.slot_id
  WHERE i.token = _token AND i.status <> 'withdrawn'
$$;

REVOKE ALL ON FUNCTION public.get_slot_invitation(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_slot_invitation(uuid) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.respond_to_slot_invitation(_token uuid, _accept boolean)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _inv public.slot_invitations%ROWTYPE;
  _slot public.coach_slots%ROWTYPE;
  _booking public.slot_bookings%ROWTYPE;
  _booking_id uuid;
  _delta integer := 0;
  _who text;
  _tag text;
BEGIN
  SELECT * INTO _inv FROM public.slot_invitations WHERE token = _token FOR UPDATE;
  IF NOT FOUND OR _inv.status = 'withdrawn' THEN
    RAISE EXCEPTION 'INVITATION_NOT_FOUND' USING ERRCODE = 'P0002';
  END IF;
  SELECT * INTO _slot FROM public.coach_slots WHERE id = _inv.slot_id FOR UPDATE;
  IF _slot.status NOT IN ('available', 'partially_booked', 'booked') OR _slot.start_time <= now() THEN
    RAISE EXCEPTION 'SLOT_CLOSED' USING ERRCODE = 'P0001';
  END IF;
  -- An app client who moved to another coach can't use the old coach's invitation.
  IF _inv.client_id IS NOT NULL
     AND public.get_assigned_coach_id(_inv.client_id) IS DISTINCT FROM _slot.coach_id THEN
    RAISE EXCEPTION 'INVITATION_NOT_FOUND' USING ERRCODE = 'P0002';
  END IF;

  IF (_accept AND _inv.status = 'accepted') OR (NOT _accept AND _inv.status = 'declined') THEN
    RETURN public.get_slot_invitation(_token);
  END IF;

  PERFORM set_config('app.suppress_booking_notify', 'on', true);

  IF _accept THEN
    IF nullif(btrim(_slot.manual_client_name), '') IS NOT NULL THEN
      RAISE EXCEPTION 'SLOT_CLOSED' USING ERRCODE = 'P0001';
    END IF;
    IF _inv.client_id IS NOT NULL THEN
      SELECT * INTO _booking FROM public.slot_bookings
        WHERE slot_id = _slot.id AND client_id = _inv.client_id FOR UPDATE;
      -- A pending/confirmed booking already holds a seat.
      IF NOT FOUND OR _booking.status NOT IN ('pending', 'confirmed') THEN
        _delta := 1;
      END IF;
    ELSE
      _delta := 1;
    END IF;
    IF _delta = 1 AND _slot.booked_count >= _slot.capacity THEN
      RAISE EXCEPTION 'SLOT_FULL' USING ERRCODE = 'P0001';
    END IF;
    IF _inv.client_id IS NOT NULL THEN
      INSERT INTO public.slot_bookings (slot_id, client_id, status)
      VALUES (_slot.id, _inv.client_id, 'confirmed')
      ON CONFLICT (slot_id, client_id) DO UPDATE SET status = 'confirmed'
      RETURNING id INTO _booking_id;
    END IF;
    UPDATE public.slot_invitations
    SET status = 'accepted', responded_at = now(), booking_id = coalesce(_booking_id, booking_id)
    WHERE id = _inv.id;
  ELSE
    IF _inv.client_id IS NOT NULL THEN
      -- Only a booking that still holds a seat releases one.
      UPDATE public.slot_bookings SET status = 'cancelled'
      WHERE slot_id = _slot.id AND client_id = _inv.client_id AND status IN ('pending', 'confirmed')
      RETURNING id INTO _booking_id;
      IF _booking_id IS NOT NULL THEN _delta := -1; END IF;
    ELSIF _inv.status = 'accepted' THEN
      _delta := -1;
    END IF;
    UPDATE public.slot_invitations SET status = 'declined', responded_at = now() WHERE id = _inv.id;
  END IF;

  IF _delta <> 0 THEN
    UPDATE public.coach_slots
    SET booked_count = greatest(booked_count + _delta, 0),
        status = CASE
          WHEN nullif(btrim(manual_client_name), '') IS NOT NULL THEN status
          WHEN greatest(booked_count + _delta, 0) >= capacity THEN 'booked'
          WHEN greatest(booked_count + _delta, 0) > 0 THEN 'partially_booked'
          ELSE 'available'
        END
    WHERE id = _slot.id;
  END IF;

  PERFORM set_config('app.suppress_booking_notify', 'off', true);

  -- One push per invitation per 5 minutes, however often the answer flips.
  _tag := 'invitation-' || _inv.id;
  IF NOT EXISTS (
    SELECT 1 FROM public.notification_events
    WHERE user_id = _slot.coach_id AND tag = _tag AND created_at > now() - interval '5 minutes'
  ) THEN
    _who := coalesce(nullif(_inv.name, ''), _inv.email, 'Pozvaný');
    PERFORM public.enqueue_notification(_slot.coach_id,
      CASE WHEN _accept THEN 'newBooking' ELSE 'cancelledBooking' END,
      CASE WHEN _accept THEN 'Pozvánka přijata' ELSE 'Pozvánka odmítnuta' END,
      _who || ' · ' || private.format_when(_slot.start_time), '/calendar', _tag);
  END IF;

  RETURN public.get_slot_invitation(_token);
END;
$$;

REVOKE ALL ON FUNCTION public.respond_to_slot_invitation(uuid, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.respond_to_slot_invitation(uuid, boolean) TO anon, authenticated;

-- Client app: own invitations with slot details (the client may not be allowed to
-- read the slot row itself).
CREATE OR REPLACE FUNCTION public.get_my_slot_invitations()
RETURNS TABLE (
  id uuid, token uuid, status text, start_time timestamptz, end_time timestamptz,
  slot_type text, notes text, coach_name text, closed boolean, full boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT i.id, i.token, i.status, s.start_time, s.end_time, s.slot_type, coalesce(s.notes, ''),
         private.display_name(s.coach_id),
         s.status NOT IN ('available', 'partially_booked', 'booked') OR s.start_time <= now(),
         i.status <> 'accepted' AND s.booked_count >= s.capacity
  FROM public.slot_invitations i
  JOIN public.coach_slots s ON s.id = i.slot_id
  WHERE i.client_id = auth.uid() AND i.status <> 'withdrawn' AND s.end_time > now() - interval '1 day'
  ORDER BY s.start_time
$$;

REVOKE ALL ON FUNCTION public.get_my_slot_invitations() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_slot_invitations() TO authenticated;

-- ─── Withdraw (coach) ───────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.withdraw_slot_invitation(_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.slot_invitations SET status = 'withdrawn'
  WHERE id = _id AND coach_id = auth.uid() AND status IN ('pending', 'declined');
  IF NOT FOUND THEN
    RAISE EXCEPTION 'CANNOT_WITHDRAW' USING ERRCODE = 'P0001';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.withdraw_slot_invitation(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.withdraw_slot_invitation(uuid) TO authenticated;

-- ─── Keep invitations in sync when the booking is cancelled elsewhere ───────
-- (client cancels in the app, coach rejects/cancels in the calendar)

CREATE OR REPLACE FUNCTION private.sync_invitation_on_booking_cancel()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IN ('cancelled', 'rejected') AND OLD.status IN ('pending', 'confirmed') THEN
    UPDATE public.slot_invitations SET status = 'declined', responded_at = now()
    WHERE slot_id = NEW.slot_id AND client_id = NEW.client_id AND status = 'accepted';
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER slot_bookings_sync_invitation AFTER UPDATE OF status ON public.slot_bookings
  FOR EACH ROW EXECUTE FUNCTION private.sync_invitation_on_booking_cancel();