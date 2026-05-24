create table if not exists campaigns (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  document jsonb not null,
  version integer not null default 1,
  updated_at timestamptz not null default now()
);

create table if not exists campaign_events (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  type text not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create or replace function save_campaign_document(
  table_id uuid,
  base_version integer,
  next_document jsonb
) returns campaigns
language plpgsql
set search_path = public
as $$
declare
  saved campaigns;
begin
  update campaigns
  set
    document = next_document,
    version = version + 1,
    updated_at = now()
  where id = table_id
    and (base_version is null or version = base_version)
  returning * into saved;

  if saved.id is null then
    raise exception 'campaign version conflict';
  end if;

  return saved;
end;
$$;

-- Data API access for the browser client. This MVP is table-code based and
-- anonymous, so these policies are intentionally open to the anon role. Do not
-- treat Storyteller notes as cryptographically private until auth/RLS is added.
alter table campaigns enable row level security;
alter table campaign_events enable row level security;

grant usage on schema public to anon, authenticated;
grant select, insert, update on campaigns to anon, authenticated;
grant select, insert on campaign_events to anon, authenticated;
grant execute on function save_campaign_document(uuid, integer, jsonb) to anon, authenticated;

drop policy if exists "anonymous campaigns can be read" on campaigns;
create policy "anonymous campaigns can be read"
on campaigns for select
to anon, authenticated
using (true);

drop policy if exists "anonymous campaigns can be created" on campaigns;
create policy "anonymous campaigns can be created"
on campaigns for insert
to anon, authenticated
with check (true);

drop policy if exists "anonymous campaigns can be updated" on campaigns;
create policy "anonymous campaigns can be updated"
on campaigns for update
to anon, authenticated
using (true)
with check (true);

drop policy if exists "anonymous campaign events can be read" on campaign_events;
create policy "anonymous campaign events can be read"
on campaign_events for select
to anon, authenticated
using (true);

drop policy if exists "anonymous campaign events can be created" on campaign_events;
create policy "anonymous campaign events can be created"
on campaign_events for insert
to anon, authenticated
with check (true);

-- Enable Realtime for the MVP live table view. The DO blocks make this script
-- safe to rerun if Supabase already added either table to the publication.
do $$
begin
  alter publication supabase_realtime add table campaigns;
exception
  when duplicate_object then null;
end;
$$;

do $$
begin
  alter publication supabase_realtime add table campaign_events;
exception
  when duplicate_object then null;
end;
$$;
