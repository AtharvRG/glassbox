-- 1. Table to track the high-level execution (e.g., "Competitor Search: Nike")
create table executions (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  status text default 'running', -- 'running', 'completed', 'failed'
  metadata jsonb default '{}'::jsonb -- Stores high-level context like user_id or environment
);

-- 2. Table to track the individual logic steps
create table steps (
  id uuid default gen_random_uuid() primary key,
  execution_id uuid references executions(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  step_name text not null,
  step_order int not null,
  input jsonb,
  output jsonb,
  reasoning text, -- The core "X-Ray" feature: Why did this happen?
  status text default 'success',
  duration_ms int
);

-- 3. Enable Realtime (Optional but good for dashboards)
alter publication supabase_realtime add table executions;
alter publication supabase_realtime add table steps;

-- 4. Disable RLS for this specific demo to prevent "Permission Denied" errors
-- In a production app, we would add specific policies here.
alter table executions enable row level security;
create policy "Public Access" on executions for all using (true);

alter table steps enable row level security;
create policy "Public Access" on steps for all using (true);