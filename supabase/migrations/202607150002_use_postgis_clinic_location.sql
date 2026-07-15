create extension if not exists postgis;

drop index if exists clinics_location_earth_idx;

alter table clinics
  add column if not exists location geography(point, 4326) generated always as (
    case
      when latitude is not null and longitude is not null
      then st_setsrid(st_makepoint(longitude, latitude), 4326)::geography
      else null
    end
  ) stored;

create index if not exists clinics_location_gist_idx
  on clinics using gist (location)
  where location is not null;

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
