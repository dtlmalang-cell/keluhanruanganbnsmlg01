/*
  # Add admin and status columns to complaints table

  1. Changes
    - Add `admin_name` column to track who submitted the report
    - Add `status` column with values 'late' or 'ontime' (defaults to 'late')
    - Add update policy so authenticated users can update complaint status
    
  2. Security
    - Add policy for authenticated users to update complaints (for status changes)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'complaints' AND column_name = 'admin_name'
  ) THEN
    ALTER TABLE complaints ADD COLUMN admin_name text NOT NULL DEFAULT '';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'complaints' AND column_name = 'status'
  ) THEN
    ALTER TABLE complaints ADD COLUMN status text NOT NULL DEFAULT 'late';
  END IF;
END $$;

CREATE POLICY "Authenticated users can update complaints"
  ON complaints
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
