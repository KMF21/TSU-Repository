-- =====================================================================
-- 006 — updated_at for OAI-PMH datestamps
-- Run this in the Supabase SQL Editor BEFORE deploying the OAI endpoint.
-- =====================================================================
-- OAI-PMH harvesters (BASE, CORE) decide what to re-fetch by comparing each
-- record's datestamp. Without a real "last modified" value, an admin
-- correcting an abstract after publication would never reach them.
--
-- This must NOT change on every page view or download, otherwise every
-- record would look modified constantly and harvesters would re-fetch the
-- whole archive. So the trigger only bumps updated_at when a field that is
-- actually part of the harvested record changes. The view/download counter
-- RPCs only touch view_count / download_count and are therefore ignored.

alter table theses add column if not exists updated_at timestamptz;

update theses
set updated_at = coalesce(published_at, reviewed_at, submitted_at, now())
where updated_at is null;

alter table theses
    alter column updated_at set default now(),
    alter column updated_at set not null;

create or replace function theses_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
    if (new.title, new.abstract, new.keywords, new.year, new.supervisor_name,
        new.department_id, new.programme_id, new.degree_type, new.status,
        new.access_level, new.file_url, new.co_authors)
       is distinct from
       (old.title, old.abstract, old.keywords, old.year, old.supervisor_name,
        old.department_id, old.programme_id, old.degree_type, old.status,
        old.access_level, old.file_url, old.co_authors)
    then
        new.updated_at := now();
    end if;
    return new;
end;
$$;

drop trigger if exists trg_theses_touch_updated_at on theses;

create trigger trg_theses_touch_updated_at
    before update on theses
    for each row
    execute function theses_touch_updated_at();

create index if not exists idx_theses_updated_at on theses (updated_at, id);

-- Quick check after running (should return a row with a timestamp, not null):
-- select id, updated_at from theses order by updated_at desc limit 3;
