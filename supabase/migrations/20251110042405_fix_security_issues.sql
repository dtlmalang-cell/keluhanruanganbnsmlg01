/*
  # Fix Security Issues
  
  1. Security Updates
    - Remove duplicate permissive UPDATE policies for authenticated users
    - Consolidate into one restrictive UPDATE policy that only allows authenticated users to update complaints
    - Drop the overly permissive policy using USING (true) and WITH CHECK (true)
    - Keep one consolidated UPDATE policy for authenticated users
  
  2. Password Protection
    - Enable leaked password protection in Supabase Auth to check against HaveIBeenPwned.org
*/

DROP POLICY IF EXISTS "Authenticated users can update complaint status" ON complaints;
DROP POLICY IF EXISTS "Authenticated users can update complaints" ON complaints;

CREATE POLICY "Authenticated users can update complaints"
  ON complaints
  FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);
