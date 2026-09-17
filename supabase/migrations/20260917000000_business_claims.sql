-- Add is_claimed to businesses
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS is_claimed BOOLEAN NOT NULL DEFAULT true;

-- Business Claims table
CREATE TABLE IF NOT EXISTS public.business_claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    proof_text TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.business_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own claims" ON public.business_claims
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own claims" ON public.business_claims
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Admin can view all claims, handled by service role in Edge Functions or admin app

-- Contact Submissions table
CREATE TABLE IF NOT EXISTS public.contact_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    company TEXT,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert contact submissions" ON public.contact_submissions
    FOR INSERT WITH CHECK (true);
