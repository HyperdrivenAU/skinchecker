# Supabase Clinic Directory

Supabase is the source of truth for the clinic directory, clinic applications,
clinic search impressions, click events, clinic email events and Stripe
subscription state.

## Required Environment Variables

Add these to `.env.local` locally and to the Vercel project:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Stripe billing will use:

```env
STRIPE_STANDARD_PRICE_ID=
STRIPE_FOUNDATION_PRICE_ID=
STRIPE_SECRET_KEY=
STRIPE_PLUS_MONTHLY_PRICE_ID=
STRIPE_PLUS_YEARLY_PRICE_ID=
STRIPE_WEBHOOK_SECRET=
```

The `SUPABASE_SERVICE_ROLE_KEY` must only be used on the server. Do not expose it
through a `NEXT_PUBLIC_` variable.

## Applying The Migration

Apply the SQL files in `supabase/migrations` in filename order through the
Supabase SQL editor, or through the Supabase CLI if the project is linked
locally.

This migration enables PostGIS and creates:

- `clinics`
- `clinic_applications`
- `clinic_subscriptions`
- `clinic_search_impressions`
- `clinic_click_events`
- `clinic_email_events`
- `profiles`
- `user_subscriptions`
- `lesions`
- `lesion_entries`
- `stored_files`
- private `skinchecker-plus` storage bucket
- `nearby_active_clinics(...)` RPC function

Clinic coordinates are stored as `latitude` and `longitude`, with a generated
`location geography(point, 4326)` column. The `clinics_location_gist_idx` GiST
index supports fast radius searches.

The RPC uses `ST_DWithin` and `ST_Distance` to find the closest Preferred
Partners inside the configured radius, ordered by distance. If no Preferred
Partner exists inside that radius, it falls back to free listings inside the
same radius, also ordered by distance.

It also enables RLS and allows public reads only for active, displayed,
non-Do-Not-Contact free/preferred clinic listings. Server-side app writes use the
service-role key through the Next.js route handlers.

## Data Privacy

Clinic impression and marketing tables must not contain patient names, email
addresses, phone numbers, dates of birth, lesion images or medical reports.
Only postcode/broad search location, report ID where available, and risk category
metadata are stored for clinic analytics.

## Stripe Webhook

Create a Stripe webhook endpoint pointing to:

```txt
https://your-domain.com/api/stripe/webhook
```

Subscribe at minimum to:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

Store the webhook signing secret in `STRIPE_WEBHOOK_SECRET`.
