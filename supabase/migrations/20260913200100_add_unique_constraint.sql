-- Add unique constraint for personal profiles in saved_contacts
ALTER TABLE public.saved_contacts
ADD CONSTRAINT saved_contacts_user_id_personal_profile_id_key UNIQUE (user_id, personal_profile_id);
