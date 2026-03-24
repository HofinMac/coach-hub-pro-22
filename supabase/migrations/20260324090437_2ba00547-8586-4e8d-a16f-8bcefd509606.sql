
-- Coach availability slots
CREATE TABLE public.coach_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  slot_type text NOT NULL DEFAULT 'individual',
  capacity int NOT NULL DEFAULT 1,
  booked_count int NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'available',
  recurrence_rule jsonb,
  recurrence_parent_id uuid REFERENCES public.coach_slots(id) ON DELETE SET NULL,
  notes text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.coach_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches can manage own slots"
  ON public.coach_slots FOR ALL
  TO authenticated
  USING (coach_id = auth.uid() OR get_user_role(auth.uid()) = 'admin')
  WITH CHECK (coach_id = auth.uid() OR get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Clients can read available slots"
  ON public.coach_slots FOR SELECT
  TO authenticated
  USING (status IN ('available', 'partially_booked'));

-- Slot bookings
CREATE TABLE public.slot_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_id uuid NOT NULL REFERENCES public.coach_slots(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'confirmed',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(slot_id, client_id)
);

ALTER TABLE public.slot_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can book slots"
  ON public.slot_bookings FOR INSERT
  TO authenticated
  WITH CHECK (client_id = auth.uid());

CREATE POLICY "Users can read own bookings"
  ON public.slot_bookings FOR SELECT
  TO authenticated
  USING (client_id = auth.uid() OR get_user_role(auth.uid()) IN ('coach', 'admin'));

CREATE POLICY "Users can cancel own bookings"
  ON public.slot_bookings FOR UPDATE
  TO authenticated
  USING (client_id = auth.uid() OR get_user_role(auth.uid()) IN ('coach', 'admin'));

-- Slot share log
CREATE TABLE public.slot_share_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slot_ids uuid[] NOT NULL DEFAULT '{}',
  share_type text NOT NULL DEFAULT 'all_clients',
  recipient_ids uuid[],
  external_emails text[],
  message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.slot_share_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches can manage own share logs"
  ON public.slot_share_log FOR ALL
  TO authenticated
  USING (coach_id = auth.uid() OR get_user_role(auth.uid()) = 'admin')
  WITH CHECK (coach_id = auth.uid() OR get_user_role(auth.uid()) = 'admin');

-- Add slot reminder settings to user_settings
ALTER TABLE public.user_settings
  ADD COLUMN IF NOT EXISTS slot_reminder_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS slot_reminder_frequency text NOT NULL DEFAULT 'weekly';
