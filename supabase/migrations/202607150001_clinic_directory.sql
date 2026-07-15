create extension if not exists pgcrypto;
create extension if not exists postgis;

do $$ begin
  create type clinic_relationship_status as enum (
    'free',
    'preferred',
    'suspended',
    'do_not_contact',
    'inactive'
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type clinic_listing_type as enum ('free', 'preferred');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type clinic_application_path as enum (
    'claim_existing',
    'register_new'
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type clinic_application_status as enum (
    'submitted',
    'awaiting_payment',
    'awaiting_admin_review',
    'approved',
    'rejected'
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type clinic_subscription_status as enum (
    'not_started',
    'completed_awaiting_approval',
    'active',
    'cancelled',
    'failed'
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type clinic_click_action as enum (
    'website',
    'booking',
    'phone',
    'profile'
  );
exception
  when duplicate_object then null;
end $$;

create table if not exists clinics (
  id uuid primary key default gen_random_uuid(),
  legacy_clinic_id text unique,
  clinic_uuid uuid unique default gen_random_uuid(),
  clinic_name text not null,
  clinic_type text,
  relationship_status clinic_relationship_status not null default 'free',
  active boolean not null default true,
  display_in_app boolean not null default true,
  address text,
  address_line_1 text,
  address_line_2 text,
  suburb text,
  state text,
  postcode text,
  country text not null default 'Australia',
  latitude double precision,
  longitude double precision,
  location geography(point, 4326) generated always as (
    case
      when latitude is not null and longitude is not null
      then st_setsrid(st_makepoint(longitude, latitude), 4326)::geography
      else null
    end
  ) stored,
  google_place_id text,
  phone text,
  email text,
  website text,
  booking_url text,
  contact_person text,
  contact_role text,
  contact_mobile text,
  contact_email text,
  services_offered text[] not null default '{}',
  accepting_new_patients boolean,
  billing_type text,
  typical_skin_check_fee text,
  referral_fee text,
  referral_code text,
  priority_level integer not null default 0,
  display_booking_button boolean not null default false,
  public_notes text,
  internal_notes text,
  last_contacted_date date,
  next_follow_up_date date,
  sales_status text,
  source text,
  google_rating numeric,
  google_reviews integer,
  last_verified date,
  logo_or_image_url text,
  booking_enabled boolean not null default false,
  priority integer not null default 0,
  claimed boolean not null default false,
  subscription_plan text,
  stripe_customer_id text,
  stripe_subscription_id text,
  do_not_contact boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists clinics_status_idx
  on clinics (active, display_in_app, relationship_status);

create index if not exists clinics_postcode_idx
  on clinics (postcode);

create index if not exists clinics_location_gist_idx
  on clinics using gist (location)
  where location is not null;

create table if not exists clinic_applications (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid references clinics(id) on delete set null,
  application_path clinic_application_path not null,
  status clinic_application_status not null default 'submitted',
  requested_plan text not null,
  clinic_name text not null,
  legacy_clinic_id text,
  contact_first_name text not null,
  contact_last_name text not null,
  contact_role text not null,
  contact_email text not null,
  contact_mobile text not null,
  clinic_phone text,
  clinic_email text,
  clinic_website text,
  booking_url text,
  clinic_address text not null,
  services_offered text,
  billing_type text,
  logo_upload_name text,
  authorised boolean not null default false,
  accepted_terms boolean not null default false,
  accepted_privacy boolean not null default false,
  stripe_checkout_session_id text,
  stripe_customer_id text,
  stripe_subscription_id text,
  payment_status clinic_subscription_status not null default 'not_started',
  admin_approved_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists clinic_applications_status_idx
  on clinic_applications (status, payment_status, created_at desc);

create table if not exists clinic_subscriptions (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid references clinics(id) on delete cascade,
  application_id uuid references clinic_applications(id) on delete set null,
  status clinic_subscription_status not null default 'not_started',
  stripe_customer_id text,
  stripe_subscription_id text unique,
  stripe_price_id text,
  plan_code text,
  started_at timestamptz,
  current_period_end timestamptz,
  cancelled_at timestamptz,
  failed_payment_status text,
  raw_event jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists clinic_subscriptions_clinic_idx
  on clinic_subscriptions (clinic_id, status);

create table if not exists clinic_search_impressions (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid references clinics(id) on delete set null,
  clinic_uuid uuid,
  search_timestamp timestamptz not null default now(),
  user_postcode text,
  approximate_search_latitude double precision,
  approximate_search_longitude double precision,
  distance_km numeric,
  listing_type_shown clinic_listing_type not null,
  relationship_status_at_time clinic_relationship_status,
  preferred_partner_status_at_time boolean not null default false,
  search_radius_km numeric not null,
  search_result_position integer not null,
  skinchecker_report_id text,
  skin_score_range_or_risk_category text,
  website_clicked boolean not null default false,
  booking_link_clicked boolean not null default false,
  phone_clicked boolean not null default false,
  profile_viewed boolean not null default false,
  impression_notification_email_sent boolean not null default false,
  impression_notification_email_sent_date timestamptz,
  upgrade_email_sent boolean not null default false,
  upgrade_email_sent_date timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists clinic_search_impressions_clinic_idx
  on clinic_search_impressions (clinic_id, search_timestamp desc);

create index if not exists clinic_search_impressions_postcode_idx
  on clinic_search_impressions (user_postcode, search_timestamp desc);

create table if not exists clinic_click_events (
  id uuid primary key default gen_random_uuid(),
  impression_id uuid references clinic_search_impressions(id) on delete cascade,
  clinic_id uuid references clinics(id) on delete set null,
  action clinic_click_action not null,
  created_at timestamptz not null default now()
);

create index if not exists clinic_click_events_impression_idx
  on clinic_click_events (impression_id, created_at desc);

create table if not exists clinic_email_events (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid references clinics(id) on delete set null,
  impression_id uuid references clinic_search_impressions(id) on delete set null,
  email_type text not null,
  recipient text,
  provider_message_id text,
  status text not null default 'queued',
  error_message text,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists clinic_email_events_throttle_idx
  on clinic_email_events (clinic_id, email_type, sent_at desc);

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists clinics_set_updated_at on clinics;
create trigger clinics_set_updated_at
before update on clinics
for each row execute function set_updated_at();

drop trigger if exists clinic_applications_set_updated_at on clinic_applications;
create trigger clinic_applications_set_updated_at
before update on clinic_applications
for each row execute function set_updated_at();

drop trigger if exists clinic_subscriptions_set_updated_at on clinic_subscriptions;
create trigger clinic_subscriptions_set_updated_at
before update on clinic_subscriptions
for each row execute function set_updated_at();

create or replace function nearby_active_clinics(
  search_lat double precision,
  search_lng double precision,
  radius_km double precision,
  max_rows integer default 100
)
returns table (
  id uuid,
  legacy_clinic_id text,
  clinic_uuid uuid,
  clinic_name text,
  clinic_type text,
  relationship_status clinic_relationship_status,
  active boolean,
  display_in_app boolean,
  address text,
  address_line_1 text,
  address_line_2 text,
  suburb text,
  state text,
  postcode text,
  country text,
  latitude double precision,
  longitude double precision,
  google_place_id text,
  phone text,
  email text,
  website text,
  booking_url text,
  contact_person text,
  contact_role text,
  contact_mobile text,
  contact_email text,
  services_offered text[],
  accepting_new_patients boolean,
  billing_type text,
  typical_skin_check_fee text,
  referral_fee text,
  referral_code text,
  priority_level integer,
  display_booking_button boolean,
  public_notes text,
  internal_notes text,
  last_contacted_date date,
  next_follow_up_date date,
  sales_status text,
  source text,
  google_rating numeric,
  google_reviews integer,
  last_verified date,
  logo_or_image_url text,
  booking_enabled boolean,
  priority integer,
  claimed boolean,
  subscription_plan text,
  distance_km double precision
)
language sql
stable
as $$
  with search as (
    select st_setsrid(st_makepoint(search_lng, search_lat), 4326)::geography as point
  ),
  eligible as (
    select
      c.*,
      st_distance(c.location, search.point) / 1000 as distance_km
    from clinics c
    cross join search
    where
      c.active = true
      and c.display_in_app = true
      and c.do_not_contact = false
      and c.relationship_status in ('free', 'preferred')
      and c.location is not null
      and st_dwithin(c.location, search.point, radius_km * 1000)
  ),
  preferred as (
    select *
    from eligible
    where relationship_status = 'preferred'
  ),
  selected as (
    select *
    from preferred
    union all
    select *
    from eligible
    where
      relationship_status = 'free'
      and not exists (select 1 from preferred)
  )
  select
    c.id,
    c.legacy_clinic_id,
    c.clinic_uuid,
    c.clinic_name,
    c.clinic_type,
    c.relationship_status,
    c.active,
    c.display_in_app,
    c.address,
    c.address_line_1,
    c.address_line_2,
    c.suburb,
    c.state,
    c.postcode,
    c.country,
    c.latitude,
    c.longitude,
    c.google_place_id,
    c.phone,
    c.email,
    c.website,
    c.booking_url,
    c.contact_person,
    c.contact_role,
    c.contact_mobile,
    c.contact_email,
    c.services_offered,
    c.accepting_new_patients,
    c.billing_type,
    c.typical_skin_check_fee,
    c.referral_fee,
    c.referral_code,
    c.priority_level,
    c.display_booking_button,
    c.public_notes,
    c.internal_notes,
    c.last_contacted_date,
    c.next_follow_up_date,
    c.sales_status,
    c.source,
    c.google_rating,
    c.google_reviews,
    c.last_verified,
    c.logo_or_image_url,
    c.booking_enabled,
    c.priority,
    c.claimed,
    c.subscription_plan,
    c.distance_km
  from selected c
  order by c.distance_km asc, c.priority desc, c.clinic_name asc
  limit max_rows;
$$;

alter table clinics enable row level security;
alter table clinic_applications enable row level security;
alter table clinic_subscriptions enable row level security;
alter table clinic_search_impressions enable row level security;
alter table clinic_click_events enable row level security;
alter table clinic_email_events enable row level security;

drop policy if exists "Public can read active displayed clinics" on clinics;
create policy "Public can read active displayed clinics"
on clinics for select
using (
  active = true
  and display_in_app = true
  and do_not_contact = false
  and relationship_status in ('free', 'preferred')
);
