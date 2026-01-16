
-- Table to track shared skills between users
create table public.shared_skills (
  id uuid not null default extensions.uuid_generate_v4(),
  skill_name text not null,
  owner_workos_user_id text not null,
  shared_with_workos_user_id text not null,
  owner_arca_folder text not null,
  shared_with_arca_folder text not null,
  arca_table_name text not null,
  status text not null default 'pending', -- 'pending', 'accepted', 'rejected'
  invite_token text not null,
  invite_sent_at timestamp with time zone null default now(),
  invite_accepted_at timestamp with time zone null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint shared_skills_pkey primary key (id),
  constraint shared_skills_owner_fkey foreign key (owner_workos_user_id) references public.users(workos_user_id) on delete cascade,
  constraint shared_skills_shared_with_fkey foreign key (shared_with_workos_user_id) references public.users(workos_user_id) on delete cascade,
  constraint shared_skills_invite_token_key unique (invite_token),
  constraint shared_skills_status_check check (status in ('pending', 'accepted', 'rejected'))
) tablespace pg_default;

-- Index for faster lookups by owner
create index idx_shared_skills_owner on public.shared_skills using btree (owner_workos_user_id) tablespace pg_default;

-- Index for faster lookups by shared_with user
create index idx_shared_skills_shared_with on public.shared_skills using btree (shared_with_workos_user_id) tablespace pg_default;

-- Index for faster invite token lookups
create index idx_shared_skills_invite_token on public.shared_skills using btree (invite_token) tablespace pg_default;

-- Index for status filtering
create index idx_shared_skills_status on public.shared_skills using btree (status) tablespace pg_default;

-- Composite unique constraint to prevent duplicate shares
create unique index idx_shared_skills_unique_share on public.shared_skills using btree (owner_workos_user_id, shared_with_workos_user_id, skill_name) where status = 'accepted';

-- Table to log all sync operations for shared skills
create table public.shared_skill_sync_log (
  id uuid not null default extensions.uuid_generate_v4(),
  shared_skill_id uuid not null,
  action text not null, -- 'create', 'update', 'delete'
  performed_by_workos_user_id text not null,
  synced_to_workos_user_id text not null,
  arca_operation text null, -- JSON string of the operation details
  success boolean not null default true,
  error_message text null,
  created_at timestamp with time zone null default now(),
  constraint shared_skill_sync_log_pkey primary key (id),
  constraint shared_skill_sync_log_shared_skill_fkey foreign key (shared_skill_id) references public.shared_skills(id) on delete cascade,
  constraint shared_skill_sync_log_performed_by_fkey foreign key (performed_by_workos_user_id) references public.users(workos_user_id) on delete cascade,
  constraint shared_skill_sync_log_synced_to_fkey foreign key (synced_to_workos_user_id) references public.users(workos_user_id) on delete cascade
) tablespace pg_default;

-- Index for faster lookups by shared_skill_id
create index idx_sync_log_shared_skill on public.shared_skill_sync_log using btree (shared_skill_id) tablespace pg_default;

-- Index for faster lookups by timestamp
create index idx_sync_log_created_at on public.shared_skill_sync_log using btree (created_at desc) tablespace pg_default;

-- Add RLS (Row Level Security) policies - optional but recommended
alter table public.shared_skills enable row level security;
alter table public.shared_skill_sync_log enable row level security;

-- Policy: Users can view shared skills where they are owner or recipient
create policy "Users can view their shared skills"
  on public.shared_skills
  for select
  using (
    owner_workos_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
    or shared_with_workos_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
  );

-- Policy: Users can view sync logs for their shared skills
create policy "Users can view sync logs for their shared skills"
  on public.shared_skill_sync_log
  for select
  using (
    performed_by_workos_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
    or synced_to_workos_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
  );
