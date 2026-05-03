-- New profile fields for chatbot configuration and widget installation
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS services_offered  text[]   DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS service_area      text,
  ADD COLUMN IF NOT EXISTS sms_alert_number  text,
  ADD COLUMN IF NOT EXISTS business_hours    jsonb,
  ADD COLUMN IF NOT EXISTS website_url              text,
  ADD COLUMN IF NOT EXISTS website_platform         text,
  ADD COLUMN IF NOT EXISTS widget_install_preference text;

-- primary_color already exists; no change needed