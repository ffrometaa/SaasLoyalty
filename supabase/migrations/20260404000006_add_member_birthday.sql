-- Add birthday field to members table
-- Required for birthday_month campaign segment

ALTER TABLE members ADD COLUMN IF NOT EXISTS birthday DATE;

COMMENT ON COLUMN members.birthday IS 'Member date of birth — used for birthday_month campaign segment';
