-- =====================================================================
-- Migration 002 — add staging_path to file_processing_jobs
-- Needed so the compression worker knows where to read the raw
-- uploaded PDF from before writing the final compressed copy.
-- =====================================================================

alter table file_processing_jobs
    add column staging_path text;

comment on column file_processing_jobs.staging_path is
    'Path in the "theses" storage bucket where the raw, uncompressed
     upload lives (e.g. staging/{tenant_id}/{uuid}.pdf). Cleared/ignored
     once compression completes and theses.file_url is set.';