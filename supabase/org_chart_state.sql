-- Run once in Supabase → SQL Editor (adjust policies if you add auth later).

create table if not exists public.org_chart_state (
  id text primary key default 'default',
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.org_chart_state enable row level security;

-- Anonymous access scoped to the single shared org row (suitable only for internal/trusted deployments).
create policy "org_chart_select_default"
  on public.org_chart_state for select
  using (id = 'default');

create policy "org_chart_insert_default"
  on public.org_chart_state for insert
  with check (id = 'default');

create policy "org_chart_update_default"
  on public.org_chart_state for update
  using (id = 'default')
  with check (id = 'default');
