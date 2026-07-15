-- Client-initiated slot booking/cancellation.
-- These run SECURITY DEFINER because a client has no RLS write access to
-- coach_slots (only the owning coach/admin does) but must be able to bump
-- booked_count/status atomically when booking or cancelling.

CREATE OR REPLACE FUNCTION public.book_coach_slot(_slot_id uuid)
RETURNS public.slot_bookings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _slot public.coach_slots%ROWTYPE;
  _assigned_coach_id uuid;
  _new_count int;
  _new_status text;
  _booking public.slot_bookings%ROWTYPE;
BEGIN
  SELECT assigned_coach_id INTO _assigned_coach_id FROM public.profiles WHERE id = auth.uid();

  SELECT * INTO _slot FROM public.coach_slots WHERE id = _slot_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'SLOT_NOT_FOUND' USING ERRCODE = 'P0002';
  END IF;

  IF _assigned_coach_id IS NULL OR _slot.coach_id <> _assigned_coach_id THEN
    RAISE EXCEPTION 'NOT_YOUR_COACH' USING ERRCODE = 'P0001';
  END IF;

  IF _slot.status NOT IN ('available', 'partially_booked') THEN
    RAISE EXCEPTION 'SLOT_NOT_BOOKABLE' USING ERRCODE = 'P0001';
  END IF;

  IF _slot.booked_count >= _slot.capacity THEN
    RAISE EXCEPTION 'SLOT_FULL' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.slot_bookings (slot_id, client_id, status)
  VALUES (_slot_id, auth.uid(), 'pending')
  RETURNING * INTO _booking;

  _new_count := _slot.booked_count + 1;
  _new_status := CASE WHEN _new_count >= _slot.capacity THEN 'booked' ELSE 'partially_booked' END;

  UPDATE public.coach_slots
  SET booked_count = _new_count, status = _new_status
  WHERE id = _slot_id;

  RETURN _booking;
END;
$$;

GRANT EXECUTE ON FUNCTION public.book_coach_slot(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.cancel_client_booking(_booking_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _booking public.slot_bookings%ROWTYPE;
  _slot public.coach_slots%ROWTYPE;
  _new_count int;
  _new_status text;
BEGIN
  SELECT * INTO _booking FROM public.slot_bookings WHERE id = _booking_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'BOOKING_NOT_FOUND' USING ERRCODE = 'P0002';
  END IF;

  IF _booking.client_id <> auth.uid() THEN
    RAISE EXCEPTION 'NOT_YOUR_BOOKING' USING ERRCODE = 'P0001';
  END IF;

  IF _booking.status NOT IN ('pending', 'confirmed') THEN
    RAISE EXCEPTION 'BOOKING_NOT_CANCELLABLE' USING ERRCODE = 'P0001';
  END IF;

  UPDATE public.slot_bookings SET status = 'cancelled' WHERE id = _booking_id;

  SELECT * INTO _slot FROM public.coach_slots WHERE id = _booking.slot_id FOR UPDATE;

  -- Only release capacity back if the coach hasn't already closed out the slot
  IF FOUND AND _slot.status IN ('available', 'partially_booked', 'booked') THEN
    _new_count := GREATEST(0, _slot.booked_count - 1);
    _new_status := CASE WHEN _new_count = 0 THEN 'available' ELSE 'partially_booked' END;
    UPDATE public.coach_slots SET booked_count = _new_count, status = _new_status WHERE id = _slot.id;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.cancel_client_booking(uuid) TO authenticated;
