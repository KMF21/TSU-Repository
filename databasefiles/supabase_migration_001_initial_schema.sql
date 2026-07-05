-- =====================================================================
-- TSU Digital Repository — Initial Schema
-- KMF Global / KMF Enterprise
-- Stack: Supabase (Postgres) + Clerk (Auth, synced via webhook)
-- =====================================================================
-- Design principles locked in for this build:
--   1. Single "admin" role (no supervisor/library split)
--   2. PDF-only submissions, server-side compression pipeline
--   3. Two access tiers (open / restricted) — embargo field reserved, unused
--   4. Plagiarism/similarity fields reserved for future upsell, unused
--   5. Multi-tenant schema, single-tenant UI (TSU hardcoded at launch)
--   6. RLS enforced at the database level, not just in application code
--   7. Full audit trail on every admin action
-- =====================================================================

create extension if not exists "pgcrypto";   -- for gen_random_uuid()
create extension if not exists "pg_trgm";    -- supports fast ILIKE / fuzzy search

-- ---------------------------------------------------------------------
-- ENUM TYPES
-- ---------------------------------------------------------------------

create type user_role as enum ('student', 'admin');

create type degree_type as enum ('bsc', 'msc', 'ma', 'med', 'phd', 'other');

create type thesis_status as enum ('pending', 'approved', 'rejected', 'published');

create type access_level as enum ('open', 'restricted');

create type file_job_status as enum ('queued', 'compressing', 'done', 'failed');

-- ---------------------------------------------------------------------
-- TENANTS  (multi-tenant foundation; single row for TSU at launch)
-- ---------------------------------------------------------------------

create table tenants (
    id          uuid primary key default gen_random_uuid(),
    name        text not null,
    slug        text not null unique,
    created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- USERS  (synced from Clerk via webhook on sign-up / sign-in)
-- ---------------------------------------------------------------------

create table users (
    id              uuid primary key default gen_random_uuid(),
    clerk_id        text not null unique,
    tenant_id       uuid not null references tenants(id) on delete cascade,
    full_name       text not null,
    email           text not null unique,
    role            user_role not null default 'student',
    matric_number   text,
    created_at      timestamptz not null default now()
);

create index idx_users_tenant on users(tenant_id);
create index idx_users_clerk_id on users(clerk_id);

-- ---------------------------------------------------------------------
-- DEPARTMENTS
-- ---------------------------------------------------------------------

create table departments (
    id          uuid primary key default gen_random_uuid(),
    tenant_id   uuid not null references tenants(id) on delete cascade,
    faculty     text not null,
    name        text not null,
    created_at  timestamptz not null default now(),
    unique (tenant_id, name)
);

create index idx_departments_tenant on departments(tenant_id);

-- ---------------------------------------------------------------------
-- PROGRAMMES
-- ---------------------------------------------------------------------

create table programmes (
    id              uuid primary key default gen_random_uuid(),
    tenant_id       uuid not null references tenants(id) on delete cascade,
    department_id   uuid not null references departments(id) on delete cascade,
    name            text not null,
    degree_type     degree_type not null,
    created_at      timestamptz not null default now()
);

create index idx_programmes_tenant on programmes(tenant_id);
create index idx_programmes_department on programmes(department_id);

-- ---------------------------------------------------------------------
-- THESES  (the core entity)
-- ---------------------------------------------------------------------

create table theses (
    id                      uuid primary key default gen_random_uuid(),
    tenant_id               uuid not null references tenants(id) on delete cascade,

    title                   text not null,
    abstract                text not null,
    keywords                text[] not null default '{}',

    author_id               uuid not null references users(id) on delete restrict,
    co_authors              text[],

    department_id           uuid not null references departments(id) on delete restrict,
    programme_id            uuid not null references programmes(id) on delete restrict,
    degree_type             degree_type not null,   -- denormalized for fast filtering
    year                    int not null,

    supervisor_name         text not null,

    file_url                text,
    file_size_bytes         bigint,
    original_filename       text,

    status                  thesis_status not null default 'pending',
    rejection_reason        text,

    access_level            access_level not null default 'restricted',
    embargo_until           date,                    -- reserved, unused at launch

    similarity_score        numeric,                 -- reserved for plagiarism upsell
    similarity_report_url   text,                     -- reserved for plagiarism upsell

    view_count              int not null default 0,
    download_count          int not null default 0,

    submitted_at            timestamptz not null default now(),
    reviewed_at              timestamptz,
    reviewed_by              uuid references users(id),
    published_at             timestamptz,

    search_vector           tsvector generated always as (
                                 setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
                                 setweight(to_tsvector('english', coalesce(abstract, '')), 'B') ||
                                 setweight(to_tsvector('english', array_to_string(coalesce(keywords, '{}'), ' ')), 'A')
                             ) stored
);

create index idx_theses_tenant on theses(tenant_id);
create index idx_theses_author on theses(author_id);
create index idx_theses_department on theses(department_id);
create index idx_theses_programme on theses(programme_id);
create index idx_theses_status on theses(status);
create index idx_theses_access_level on theses(access_level);
create index idx_theses_year on theses(year);
create index idx_theses_search_vector on theses using gin(search_vector);

-- ---------------------------------------------------------------------
-- FILE PROCESSING JOBS  (backs the automatic compression pipeline)
-- ---------------------------------------------------------------------

create table file_processing_jobs (
    id                      uuid primary key default gen_random_uuid(),
    thesis_id               uuid not null references theses(id) on delete cascade,
    status                  file_job_status not null default 'queued',
    original_size_bytes     bigint not null,
    compressed_size_bytes   bigint,
    error_message           text,
    created_at              timestamptz not null default now(),
    completed_at            timestamptz
);

create index idx_file_jobs_thesis on file_processing_jobs(thesis_id);
create index idx_file_jobs_status on file_processing_jobs(status);

-- ---------------------------------------------------------------------
-- AUDIT LOG  (every admin action, permanently traceable)
-- ---------------------------------------------------------------------

create table audit_log (
    id              uuid primary key default gen_random_uuid(),
    actor_id        uuid not null references users(id),
    action          text not null,
    target_table    text not null,
    target_id       uuid not null,
    metadata        jsonb not null default '{}',
    created_at      timestamptz not null default now()
);

create index idx_audit_log_actor on audit_log(actor_id);
create index idx_audit_log_target on audit_log(target_table, target_id);

-- =====================================================================
-- ROW LEVEL SECURITY
-- =====================================================================

alter table tenants enable row level security;
alter table users enable row level security;
alter table departments enable row level security;
alter table programmes enable row level security;
alter table theses enable row level security;
alter table file_processing_jobs enable row level security;
alter table audit_log enable row level security;

-- Helper: current user's row, resolved from Clerk JWT claim (auth.jwt() ->> 'sub')
-- Assumes Clerk user id is passed through as the JWT "sub" claim.
create or replace function current_app_user()
returns users as $$
    select * from users where clerk_id = (auth.jwt() ->> 'sub') limit 1;
$$ language sql stable security definer;

-- ---- departments / programmes: readable by anyone within the tenant, writable by admins only
create policy "departments_read_all" on departments
    for select using (true);

create policy "departments_admin_write" on departments
    for all using (
        exists (select 1 from current_app_user() u where u.role = 'admin' and u.tenant_id = departments.tenant_id)
    );

create policy "programmes_read_all" on programmes
    for select using (true);

create policy "programmes_admin_write" on programmes
    for all using (
        exists (select 1 from current_app_user() u where u.role = 'admin' and u.tenant_id = programmes.tenant_id)
    );

-- ---- users: a user can read/update their own row; admins can read all users in their tenant
create policy "users_self_read" on users
    for select using (clerk_id = (auth.jwt() ->> 'sub'));

create policy "users_admin_read_tenant" on users
    for select using (
        exists (select 1 from current_app_user() u where u.role = 'admin' and u.tenant_id = users.tenant_id)
    );

create policy "users_self_update" on users
    for update using (clerk_id = (auth.jwt() ->> 'sub'));

-- ---- theses: public can see published+open; author sees own; admin sees all in tenant
create policy "theses_public_read_open" on theses
    for select using (status = 'published' and access_level = 'open');

create policy "theses_author_read_own" on theses
    for select using (
        author_id = (select id from current_app_user())
    );

create policy "theses_admin_read_all" on theses
    for select using (
        exists (select 1 from current_app_user() u where u.role = 'admin' and u.tenant_id = theses.tenant_id)
    );

create policy "theses_author_insert" on theses
    for insert with check (
        author_id = (select id from current_app_user())
    );

create policy "theses_admin_update" on theses
    for update using (
        exists (select 1 from current_app_user() u where u.role = 'admin' and u.tenant_id = theses.tenant_id)
    );

-- ---- file_processing_jobs: admin + owning author only
create policy "file_jobs_admin_all" on file_processing_jobs
    for all using (
        exists (
            select 1 from theses t
            join current_app_user() u on u.role = 'admin' and u.tenant_id = t.tenant_id
            where t.id = file_processing_jobs.thesis_id
        )
    );

create policy "file_jobs_author_read" on file_processing_jobs
    for select using (
        exists (
            select 1 from theses t
            where t.id = file_processing_jobs.thesis_id
            and t.author_id = (select id from current_app_user())
        )
    );

-- ---- audit_log: admin read-only within tenant, writes happen via server-side service role only
create policy "audit_log_admin_read" on audit_log
    for select using (
        exists (
            select 1 from current_app_user() u
            where u.role = 'admin'
            and u.id = audit_log.actor_id
        )
    );

-- =====================================================================
-- DUBLIN CORE VIEW  (feeds the OAI-PMH endpoint — open, published records only)
-- =====================================================================

create view dublin_core_records as
select
    t.id                                    as record_id,
    t.title                                 as dc_title,
    u.full_name                             as dc_creator,
    t.supervisor_name                       as dc_contributor,
    d.name                                  as dc_publisher_department,
    ten.name                                as dc_publisher_institution,
    t.year                                  as dc_date,
    t.degree_type::text                     as dc_type,
    'application/pdf'                       as dc_format,
    t.abstract                              as dc_description,
    array_to_string(t.keywords, '; ')       as dc_subject,
    t.file_url                              as dc_identifier,
    t.published_at                          as dc_date_issued
from theses t
join users u on u.id = t.author_id
join departments d on d.id = t.department_id
join tenants ten on ten.id = t.tenant_id
where t.status = 'published'
  and t.access_level = 'open';

-- =====================================================================
-- SEED: baseline tenant row for TSU
-- =====================================================================

insert into tenants (name, slug) values ('Taraba State University', 'tsu');
