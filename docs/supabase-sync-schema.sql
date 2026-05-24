create table campaigns (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  document jsonb not null,
  version integer not null default 1,
  updated_at timestamptz not null default now()
);

create table campaign_events (
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
