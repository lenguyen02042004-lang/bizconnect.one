-- Add personal_profile_id to saved_contacts if not exists
ALTER TABLE public.saved_contacts 
ADD COLUMN IF NOT EXISTS personal_profile_id uuid REFERENCES public.personal_profiles(id) ON DELETE CASCADE;

-- Create function to sync businesses
CREATE OR REPLACE FUNCTION public.sync_businesses_to_saved_contacts()
RETURNS trigger AS $$
BEGIN
  UPDATE public.saved_contacts
  SET 
    business_name = NEW.name,
    phone = NEW.phone,
    email = NEW.email,
    website = NEW.website,
    logo_url = NEW.logo_url,
    province = NEW.province,
    country_name = (SELECT name FROM public.countries WHERE code = NEW.country_code LIMIT 1),
    updated_at = now()
  WHERE business_id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for businesses
DROP TRIGGER IF EXISTS trg_sync_businesses_to_saved_contacts ON public.businesses;
CREATE TRIGGER trg_sync_businesses_to_saved_contacts
AFTER UPDATE ON public.businesses
FOR EACH ROW
WHEN (OLD.name IS DISTINCT FROM NEW.name OR OLD.phone IS DISTINCT FROM NEW.phone OR OLD.email IS DISTINCT FROM NEW.email OR OLD.website IS DISTINCT FROM NEW.website OR OLD.logo_url IS DISTINCT FROM NEW.logo_url OR OLD.province IS DISTINCT FROM NEW.province OR OLD.country_code IS DISTINCT FROM NEW.country_code)
EXECUTE FUNCTION public.sync_businesses_to_saved_contacts();

-- Create function to sync personal_profiles
CREATE OR REPLACE FUNCTION public.sync_personal_profiles_to_saved_contacts()
RETURNS trigger AS $$
BEGIN
  UPDATE public.saved_contacts
  SET 
    business_name = NEW.full_name,
    business_slug = NEW.slug,
    phone = NEW.phone,
    email = NEW.email,
    logo_url = NEW.avatar_url,
    updated_at = now()
  WHERE personal_profile_id = NEW.id OR (business_id IS NULL AND business_slug = OLD.slug);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for personal_profiles
DROP TRIGGER IF EXISTS trg_sync_personal_profiles_to_saved_contacts ON public.personal_profiles;
CREATE TRIGGER trg_sync_personal_profiles_to_saved_contacts
AFTER UPDATE ON public.personal_profiles
FOR EACH ROW
WHEN (OLD.full_name IS DISTINCT FROM NEW.full_name OR OLD.slug IS DISTINCT FROM NEW.slug OR OLD.phone IS DISTINCT FROM NEW.phone OR OLD.email IS DISTINCT FROM NEW.email OR OLD.avatar_url IS DISTINCT FROM NEW.avatar_url)
EXECUTE FUNCTION public.sync_personal_profiles_to_saved_contacts();

-- Backfill personal_profile_id for existing personal cards in saved_contacts
UPDATE public.saved_contacts
SET personal_profile_id = (SELECT id FROM public.personal_profiles WHERE slug = saved_contacts.business_slug LIMIT 1)
WHERE business_id IS NULL AND personal_profile_id IS NULL;
