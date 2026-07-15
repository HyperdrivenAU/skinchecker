do $$ begin
  create type plus_subscription_status as enum (
    'incomplete',
    'trialing',
    'active',
    'past_due',
    'cancelled',
    'unpaid'
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type plus_plan_interval as enum ('month', 'year');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type lesion_status as enum (
    'active',
    'archived',
    'removed',
    'doctor_checked'
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type lesion_body_side as enum (
    'front',
    'back',
    'left',
    'right',
    'head',
    'other'
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type stored_file_kind as enum (
    'lesion_photo',
    'report_pdf'
  );
exception
  when duplicate_object then null;
end $$;

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  given_name text,
  surname text,
  stripe_customer_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists user_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  email text,
  stripe_customer_id text,
  stripe_subscription_id text unique,
  stripe_checkout_session_id text unique,
  stripe_price_id text,
  plan_interval plus_plan_interval,
  status plus_subscription_status not null default 'incomplete',
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  cancelled_at timestamptz,
  raw_event jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists user_subscriptions_user_status_idx
  on user_subscriptions (user_id, status);

create index if not exists user_subscriptions_email_idx
  on user_subscriptions (email);

create table if not exists lesions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null,
  body_side lesion_body_side not null default 'front',
  body_region text not null,
  marker_x numeric,
  marker_y numeric,
  first_noticed_date date,
  monitoring_frequency_days integer,
  status lesion_status not null default 'active',
  notes text,
  doctor_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists lesions_user_status_idx
  on lesions (user_id, status, created_at desc);

create table if not exists lesion_entries (
  id uuid primary key default gen_random_uuid(),
  lesion_id uuid not null references lesions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  taken_at timestamptz not null default now(),
  photo_file_id uuid,
  report_file_id uuid,
  ai_traffic_light text,
  ai_headline text,
  ai_summary text,
  ai_recommendation text,
  skin_score_total integer,
  skin_score_grade text,
  user_notes text,
  shared_or_exported boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists lesion_entries_lesion_taken_idx
  on lesion_entries (lesion_id, taken_at desc);

create table if not exists stored_files (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lesion_id uuid references lesions(id) on delete cascade,
  lesion_entry_id uuid references lesion_entries(id) on delete cascade,
  kind stored_file_kind not null,
  bucket text not null default 'skinchecker-plus',
  object_path text not null,
  content_type text,
  size_bytes bigint,
  created_at timestamptz not null default now()
);

create unique index if not exists stored_files_bucket_path_idx
  on stored_files (bucket, object_path);

alter table lesion_entries
  drop constraint if exists lesion_entries_photo_file_id_fkey,
  add constraint lesion_entries_photo_file_id_fkey
    foreign key (photo_file_id) references stored_files(id) on delete set null;

alter table lesion_entries
  drop constraint if exists lesion_entries_report_file_id_fkey,
  add constraint lesion_entries_report_file_id_fkey
    foreign key (report_file_id) references stored_files(id) on delete set null;

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on profiles;
create trigger profiles_set_updated_at
before update on profiles
for each row execute function set_updated_at();

drop trigger if exists user_subscriptions_set_updated_at on user_subscriptions;
create trigger user_subscriptions_set_updated_at
before update on user_subscriptions
for each row execute function set_updated_at();

drop trigger if exists lesions_set_updated_at on lesions;
create trigger lesions_set_updated_at
before update on lesions
for each row execute function set_updated_at();

drop trigger if exists lesion_entries_set_updated_at on lesion_entries;
create trigger lesion_entries_set_updated_at
before update on lesion_entries
for each row execute function set_updated_at();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'skinchecker-plus',
  'skinchecker-plus',
  false,
  15728640,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

alter table profiles enable row level security;
alter table user_subscriptions enable row level security;
alter table lesions enable row level security;
alter table lesion_entries enable row level security;
alter table stored_files enable row level security;

drop policy if exists "Users can read own profile" on profiles;
create policy "Users can read own profile"
on profiles for select
using (auth.uid() = id);

drop policy if exists "Users can update own profile" on profiles;
create policy "Users can update own profile"
on profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "Users can read own subscriptions" on user_subscriptions;
create policy "Users can read own subscriptions"
on user_subscriptions for select
using (auth.uid() = user_id);

drop policy if exists "Users can read own lesions" on lesions;
create policy "Users can read own lesions"
on lesions for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own lesions" on lesions;
create policy "Users can insert own lesions"
on lesions for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own lesions" on lesions;
create policy "Users can update own lesions"
on lesions for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can read own lesion entries" on lesion_entries;
create policy "Users can read own lesion entries"
on lesion_entries for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own lesion entries" on lesion_entries;
create policy "Users can insert own lesion entries"
on lesion_entries for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can read own stored files" on stored_files;
create policy "Users can read own stored files"
on stored_files for select
using (auth.uid() = user_id);
