-- Add missing RLS policies for enterprise tables
-- Fixes: L-07, L-08, L-09

-- super_admins table policies (if it exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'super_admins') THEN
    ALTER TABLE super_admins ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "super_admins_select" ON super_admins;
    DROP POLICY IF EXISTS "super_admins_all" ON super_admins;
    
    CREATE POLICY "super_admins_select" ON super_admins
      FOR SELECT USING (auth.uid() = user_id);
    
    CREATE POLICY "super_admins_all" ON super_admins
      FOR ALL USING (true);
  END IF;
END $$;

-- badges table policies (if it exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'badges') THEN
    ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "badges_select_tenant" ON badges;
    DROP POLICY IF EXISTS "badges_insert_tenant" ON badges;
    
    CREATE POLICY "badges_select_tenant" ON badges
      FOR SELECT USING (tenant_id = auth_tenant_id());
    
    CREATE POLICY "badges_insert_tenant" ON badges
      FOR INSERT WITH CHECK (tenant_id = auth_tenant_id());
  END IF;
END $$;

-- challenges table policies (if it exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'challenges') THEN
    ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "challenges_select_tenant" ON challenges;
    DROP POLICY IF EXISTS "challenges_insert_tenant" ON challenges;
    DROP POLICY IF EXISTS "challenges_update_tenant" ON challenges;
    
    CREATE POLICY "challenges_select_tenant" ON challenges
      FOR SELECT USING (tenant_id = auth_tenant_id());
    
    CREATE POLICY "challenges_insert_tenant" ON challenges
      FOR INSERT WITH CHECK (tenant_id = auth_tenant_id());
    
    CREATE POLICY "challenges_update_tenant" ON challenges
      FOR UPDATE USING (tenant_id = auth_tenant_id());
  END IF;
END $$;

-- member_challenge_progress table policies (if it exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'member_challenge_progress') THEN
    ALTER TABLE member_challenge_progress ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "member_challenge_select_tenant" ON member_challenge_progress;
    DROP POLICY IF EXISTS "member_challenge_select_member" ON member_challenge_progress;
    DROP POLICY IF EXISTS "member_challenge_insert_tenant" ON member_challenge_progress;
    DROP POLICY IF EXISTS "member_challenge_insert_member" ON member_challenge_progress;
    DROP POLICY IF EXISTS "member_challenge_update" ON member_challenge_progress;
    
    CREATE POLICY "member_challenge_select_tenant" ON member_challenge_progress
      FOR SELECT USING (tenant_id = auth_tenant_id());
    
    CREATE POLICY "member_challenge_select_member" ON member_challenge_progress
      FOR SELECT USING (member_id = auth_member_id());
    
    CREATE POLICY "member_challenge_insert_tenant" ON member_challenge_progress
      FOR INSERT WITH CHECK (tenant_id = auth_tenant_id());
    
    CREATE POLICY "member_challenge_insert_member" ON member_challenge_progress
      FOR INSERT WITH CHECK (member_id = auth_member_id());
    
    CREATE POLICY "member_challenge_update" ON member_challenge_progress
      FOR UPDATE USING (member_id = auth_member_id() OR tenant_id = auth_tenant_id());
  END IF;
END $$;
