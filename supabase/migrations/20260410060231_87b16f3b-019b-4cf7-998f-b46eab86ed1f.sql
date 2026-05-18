-- Drop old select policy
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Allow authenticated users to read all profiles (for leaderboard)
CREATE POLICY "Authenticated users can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);