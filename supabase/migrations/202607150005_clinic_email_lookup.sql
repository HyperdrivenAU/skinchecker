alter table clinics
  add column if not exists email_source text,
  add column if not exists email_status text not null default 'unknown',
  add column if not exists email_last_checked_at timestamptz,
  add column if not exists email_lookup_url text;

create index if not exists clinics_email_status_idx
  on clinics (email_status, source, sales_status);
