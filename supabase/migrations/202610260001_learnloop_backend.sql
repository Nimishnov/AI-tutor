create table public.learning_workspaces (
  user_id uuid primary key references auth.users (id) on delete cascade,
  state jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.learning_workspaces enable row level security;

revoke all on table public.learning_workspaces from public, anon, authenticated;
grant select, insert, update on table public.learning_workspaces to authenticated;

create policy "Users can read their own workspace"
  on public.learning_workspaces
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert their own workspace"
  on public.learning_workspaces
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update their own workspace"
  on public.learning_workspaces
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table public.tutor_daily_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  usage_date date not null,
  request_count integer not null check (request_count >= 0),
  primary key (user_id, usage_date)
);

alter table public.tutor_daily_usage enable row level security;
revoke all on table public.tutor_daily_usage from public, anon, authenticated;

create or replace function public.consume_tutor_daily_quota(
  p_user_id uuid,
  p_daily_limit integer
)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_consumed boolean;
begin
  if p_user_id is null or p_daily_limit is null or p_daily_limit <= 0 then
    return false;
  end if;

  insert into public.tutor_daily_usage (user_id, usage_date, request_count)
  values (p_user_id, (now() at time zone 'utc')::date, 1)
  on conflict (user_id, usage_date) do update
    set request_count = public.tutor_daily_usage.request_count + 1
    where public.tutor_daily_usage.request_count < p_daily_limit
  returning true into v_consumed;

  return coalesce(v_consumed, false);
end;
$$;

revoke all on function public.consume_tutor_daily_quota(uuid, integer)
  from public, anon, authenticated;
grant execute on function public.consume_tutor_daily_quota(uuid, integer)
  to service_role;
