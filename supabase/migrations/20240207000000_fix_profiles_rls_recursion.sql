-- Fix infinite recursion in profiles RLS policy

-- First, create a security definer function to check admin status
-- This avoids the recursion by not going through RLS
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon;

-- Drop the problematic policy
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

-- Recreate it using the security definer function
CREATE POLICY "Admins can view all profiles"
ON profiles
FOR SELECT
USING (public.is_admin());

-- Also fix similar patterns in other tables that reference profiles
-- Fix time_slots admin policy
DROP POLICY IF EXISTS "Admins can manage time_slots" ON time_slots;
CREATE POLICY "Admins can manage time_slots"
ON time_slots
FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Fix opening_hours admin policy
DROP POLICY IF EXISTS "Admins can manage opening_hours" ON opening_hours;
CREATE POLICY "Admins can manage opening_hours"
ON opening_hours
FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Fix special_dates admin policy
DROP POLICY IF EXISTS "Admins can manage special_dates" ON special_dates;
CREATE POLICY "Admins can manage special_dates"
ON special_dates
FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Fix extras admin policy
DROP POLICY IF EXISTS "Admins can manage extras" ON extras;
CREATE POLICY "Admins can manage extras"
ON extras
FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Fix internal_blocks admin policy
DROP POLICY IF EXISTS "Admins can manage internal_blocks" ON internal_blocks;
CREATE POLICY "Admins can manage internal_blocks"
ON internal_blocks
FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Fix settings admin policy
DROP POLICY IF EXISTS "Admins can manage settings" ON settings;
CREATE POLICY "Admins can manage settings"
ON settings
FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Fix bookings admin policies
DROP POLICY IF EXISTS "Admins can view all bookings" ON bookings;
CREATE POLICY "Admins can view all bookings"
ON bookings
FOR SELECT
USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can manage all bookings" ON bookings;
CREATE POLICY "Admins can manage all bookings"
ON bookings
FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());
