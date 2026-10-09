-- =====================================================================
-- 007 — Author vs uploader, matric privacy, and the "depositor" role
-- Run this in the Supabase SQL Editor BEFORE deploying the matching code.
-- =====================================================================
-- Until now, a thesis's author was simply whoever was signed in when they
-- submitted it. That breaks as soon as someone uploads on another person's
-- behalf: the wrong name is published (and sent to Google Scholar / BASE /
-- CORE) and the student's matric number overwrites the uploader's own.
--
-- The model after this migration:
--   theses.author_id          = the ACCOUNT that uploaded the record (the
--                               "owner" in RLS terms: sees it in their
--                               dashboard). Unchanged, so every existing
--                               policy keeps working.
--   theses.author_name        = the real author's name, as it should be
--                               published. Public.
--   theses.submitted_on_behalf= true when the uploader is not the author.
--   thesis_author_private     = the author's matric number. PRIVATE: kept in
--                               its own RLS-protected table so it can never
--                               be read through the public API, which can
--                               read every column of a published thesis.

-- ---------------------------------------------------------------------
-- 1. New role. (Not referenced anywhere else in this file on purpose: a new
--    enum value cannot be used in the same transaction that adds it.)
-- ---------------------------------------------------------------------
alter type user_role add value if not exists 'depositor';

-- ---------------------------------------------------------------------
-- 2. Author columns on theses
-- ---------------------------------------------------------------------
alter table theses add column if not exists author_name text;
alter table theses add column if not exists submitted_on_behalf boolean not null default false;

-- Backfill: every existing thesis was submitted by its own author.
update theses t
set author_name = u.full_name
from users u
where u.id = t.author_id
  and t.author_name is null;

alter table theses alter column author_name set not null;

-- ---------------------------------------------------------------------
-- 3. Private author details (matric number)
-- ---------------------------------------------------------------------
create table if not exists thesis_author_private (
    thesis_id      uuid primary key references theses(id) on delete cascade,
    matric_number  text,
    created_at     timestamptz not null default now()
);

alter table thesis_author_private enable row level security;

-- Readable by admins in the same tenant, and by the account that uploaded it.
create policy "thesis_private_read" on thesis_author_private
    for select using (
        exists (
            select 1
            from theses t
            where t.id = thesis_author_private.thesis_id
              and (
                    t.author_id = (select id from current_app_user())
                 or exists (
                        select 1 from current_app_user() u
                        where u.role::text = 'admin' and u.tenant_id = t.tenant_id
                    )
              )
        )
    );

-- Only the uploader can create it (at submission time)...
create policy "thesis_private_insert" on thesis_author_private
    for insert with check (
        exists (
            select 1 from theses t
            where t.id = thesis_author_private.thesis_id
              and t.author_id = (select id from current_app_user())
        )
    );

-- ...and only admins can correct it afterwards.
create policy "thesis_private_admin_update" on thesis_author_private
    for update using (
        exists (
            select 1
            from theses t
            join current_app_user() u on u.role::text = 'admin' and u.tenant_id = t.tenant_id
            where t.id = thesis_author_private.thesis_id
        )
    );

-- Backfill from the matric numbers already stored on user profiles.
insert into thesis_author_private (thesis_id, matric_number)
select t.id, u.matric_number
from theses t
join users u on u.id = t.author_id
on conflict (thesis_id) do nothing;

-- ---------------------------------------------------------------------
-- 4. Keep OAI datestamps honest: a corrected author name is a change that
--    harvesters must pick up. (Replaces the function from migration 006.)
-- ---------------------------------------------------------------------
create or replace function theses_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
    if (new.title, new.abstract, new.keywords, new.year, new.supervisor_name,
        new.department_id, new.programme_id, new.degree_type, new.status,
        new.access_level, new.file_url, new.co_authors, new.author_name)
       is distinct from
       (old.title, old.abstract, old.keywords, old.year, old.supervisor_name,
        old.department_id, old.programme_id, old.degree_type, old.status,
        old.access_level, old.file_url, old.co_authors, old.author_name)
    then
        new.updated_at := now();
    end if;
    return new;
end;
$$;

-- Checks after running:
-- select id, author_name, submitted_on_behalf from theses limit 3;       -- names filled in
-- select count(*) from thesis_author_private;                            -- = number of theses
