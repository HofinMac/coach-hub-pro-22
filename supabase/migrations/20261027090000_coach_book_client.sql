-- Coaches book their own app clients straight into their slots (agreed in person),
-- also for a whole recurring series. The client gets one push: the regular
-- "Nový termín tréninku" for a single slot, or a summary for several.

CREATE OR REPLACE FUNCTION public.coach_book_client(_slot_ids uuid[], _client_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _slot public.coach_slots%ROWTYPE;
  _booking public.slot_bookings%ROWTYPE;
  _id uuid;
  _booked integer := 0;
  _first timestamptz;
  _many boolean := coalesce(array_length(_slot_ids, 1), 0) > 1;
BEGIN
  IF NOT public.is_my_client(_client_id) THEN
    RAISE EXCEPTION 'NOT_YOUR_CLIENT' USING ERRCODE = '42501';
  END IF;
  IF coalesce(array_length(_slot_ids, 1), 0) > 100 THEN
    RAISE EXCEPTION 'TOO_MANY_SLOTS' USING ERRCODE = 'P0001';
  END IF;

  -- Per-slot pushes would flood the client for a series; send one summary instead.
  IF _many THEN
    PERFORM set_config('app.suppress_booking_notify', 'on', true);
  END IF;

  FOREACH _id IN ARRAY _slot_ids LOOP
    SELECT * INTO _slot FROM public.coach_slots WHERE id = _id FOR UPDATE;
    IF NOT FOUND OR _slot.coach_id <> auth.uid() THEN
      RAISE EXCEPTION 'SLOT_NOT_FOUND' USING ERRCODE = 'P0002';
    END IF;
    SELECT * INTO _booking FROM public.slot_bookings
      WHERE slot_id = _id AND client_id = _client_id FOR UPDATE;
    IF FOUND AND _booking.status = 'confirmed' THEN
      CONTINUE; -- already booked
    END IF;

    IF _slot.status NOT IN ('available', 'partially_booked')
       OR nullif(btrim(_slot.manual_client_name), '') IS NOT NULL THEN
      RAISE EXCEPTION 'SLOT_NOT_BOOKABLE' USING ERRCODE = 'P0001';
    END IF;

    IF FOUND AND _booking.status = 'pending' THEN
      -- already holds a seat
      UPDATE public.slot_bookings SET status = 'confirmed' WHERE id = _booking.id;
    ELSE
      IF _slot.booked_count >= _slot.capacity THEN
        RAISE EXCEPTION 'SLOT_FULL' USING ERRCODE = 'P0001';
      END IF;
      INSERT INTO public.slot_bookings (slot_id, client_id, status)
      VALUES (_id, _client_id, 'confirmed')
      ON CONFLICT (slot_id, client_id) DO UPDATE SET status = 'confirmed';
      UPDATE public.coach_slots
      SET booked_count = booked_count + 1,
          status = CASE WHEN booked_count + 1 >= capacity THEN 'booked' ELSE 'partially_booked' END
      WHERE id = _id;
    END IF;

    _booked := _booked + 1;
    IF _first IS NULL OR _slot.start_time < _first THEN _first := _slot.start_time; END IF;
  END LOOP;

  IF _many THEN
    PERFORM set_config('app.suppress_booking_notify', 'off', true);
    IF _booked > 0 THEN
      PERFORM public.enqueue_notification(_client_id, 'newBooking', 'Nové termíny tréninků',
        'Trenér vás zapsal na ' || _booked || ' tréninků, první ' || private.format_when(_first),
        '/klient/kalendar', 'bulk-booking-' || extract(epoch FROM now())::bigint);
    END IF;
  END IF;

  RETURN _booked;
END;
$$;

REVOKE ALL ON FUNCTION public.coach_book_client(uuid[], uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.coach_book_client(uuid[], uuid) TO authenticated;
