# Peakly Integrations

## 1) Supabase

- Create a Supabase project.
- In Authentication > Providers, enable Google.
- Add redirect URL: `http://localhost:3000/auth/callback` (and production URL).
- Run SQL from:
  - `supabase/migrations/20260426_init.sql` (auth + alerts base)
  - `supabase/migrations/20260426_data_pipeline.sql` (data pipeline tables)
- Fill `.env.local` from `.env.example`.

## 2) Lemon Squeezy

- Create a product/variant for **Pro 9EUR/month**.
- Set `LEMON_SQUEEZY_STORE_ID` and `LEMON_SQUEEZY_VARIANT_ID`.
- Add webhook URL: `https://your-domain.com/api/lemon/webhook`.
- Use same webhook secret in `LEMON_SQUEEZY_WEBHOOK_SECRET`.

## 3) Resend

- Verify sending domain (replace `alerts@your-domain.com` in `app/api/alerts/trigger/route.ts`).
- Set `RESEND_API_KEY`.

## 4) Data pipeline (multi-source)

- Run:
  - `python scripts/pipeline.py`
- Sources are in `scripts/sources/`.
- The pipeline writes to Supabase tables:
  - `tools`
  - `api_cache`
  - `fetch_log`
  - `score_history`

## 5) Trigger alerts

- Call `POST /api/alerts/trigger` with header:
  - `x-trigger-secret: <ALERTS_CRON_SECRET>`
- Configure a cron job (Vercel Cron / GitHub Actions / external scheduler).
