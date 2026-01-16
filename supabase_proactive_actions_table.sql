
-- Table for proactive actions
CREATE TABLE public.proactive_actions (
  id UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
  user_id TEXT NOT NULL,
  skill_names TEXT[] NOT NULL, -- Array of skill names that this action uses
  action_type TEXT NOT NULL, -- 'reminder', 'analysis', 'summary', 'insight'
  schedule_config JSONB NOT NULL, -- {times: ["09:00", "18:00"], timezone, days} OR {interval_hours: 3, timezone}
  delivery_channel TEXT NOT NULL, -- 'email', 'sms', 'whatsapp'
  instruction_prompt TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_run_at TIMESTAMP WITH TIME ZONE NULL,
  next_run_at TIMESTAMP WITH TIME ZONE NOT NULL,
  success_count INTEGER NOT NULL DEFAULT 0,
  failure_count INTEGER NOT NULL DEFAULT 0,
  last_message_sent TEXT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT proactive_actions_pkey PRIMARY KEY (id),
  CONSTRAINT proactive_actions_user_fkey FOREIGN KEY (user_id) REFERENCES public.users(workos_user_id) ON DELETE CASCADE,
  CONSTRAINT proactive_actions_action_type_check CHECK (action_type IN ('reminder', 'analysis', 'summary', 'insight')),
  CONSTRAINT proactive_actions_delivery_channel_check CHECK (delivery_channel IN ('email', 'sms', 'whatsapp')),
  CONSTRAINT proactive_actions_skill_names_check CHECK (array_length(skill_names, 1) > 0)
);

-- Index for faster lookups by user
CREATE INDEX idx_proactive_actions_user ON public.proactive_actions USING BTREE (user_id);

-- Index for active actions
CREATE INDEX idx_proactive_actions_active ON public.proactive_actions USING BTREE (is_active) WHERE is_active = TRUE;

-- Index for scheduling queries
CREATE INDEX idx_proactive_actions_next_run ON public.proactive_actions USING BTREE (next_run_at) WHERE is_active = TRUE;

-- Index for skill lookups using GIN for array searching
CREATE INDEX idx_proactive_actions_skills ON public.proactive_actions USING GIN (skill_names);

-- Enable RLS
ALTER TABLE public.proactive_actions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own proactive actions
CREATE POLICY "Users can view their proactive actions"
  ON public.proactive_actions
  FOR SELECT
  USING (
    user_id = current_setting('request.jwt.claims', true)::json->>'sub'
  );

-- Policy: Users can insert their own proactive actions
CREATE POLICY "Users can insert their proactive actions"
  ON public.proactive_actions
  FOR INSERT
  WITH CHECK (
    user_id = current_setting('request.jwt.claims', true)::json->>'sub'
  );

-- Policy: Users can update their own proactive actions
CREATE POLICY "Users can update their proactive actions"
  ON public.proactive_actions
  FOR UPDATE
  USING (
    user_id = current_setting('request.jwt.claims', true)::json->>'sub'
  );

-- Policy: Users can delete their own proactive actions
CREATE POLICY "Users can delete their proactive actions"
  ON public.proactive_actions
  FOR DELETE
  USING (
    user_id = current_setting('request.jwt.claims', true)::json->>'sub'
  );
