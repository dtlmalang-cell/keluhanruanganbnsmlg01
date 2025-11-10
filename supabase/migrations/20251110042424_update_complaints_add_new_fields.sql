/*
  # Update Complaints Structure with New Fields

  1. Table Updates
    - Add `time_of_issue` (time) - Time when the issue occurred
    - Add `time_of_repair` (time) - Time when the repair was completed
    - Add `issue` (text) - Brief issue description/title
    - Add `solution` (text) - Description of the solution applied
    
  2. Notes
    - All new columns are nullable to maintain compatibility with existing data
    - Time fields allow tracking of issue occurrence and repair completion
    - Issue field provides a brief title/summary separate from detailed complaint
    - Solution field tracks what was done to resolve the issue
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'complaints' AND column_name = 'time_of_issue'
  ) THEN
    ALTER TABLE complaints ADD COLUMN time_of_issue time;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'complaints' AND column_name = 'time_of_repair'
  ) THEN
    ALTER TABLE complaints ADD COLUMN time_of_repair time;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'complaints' AND column_name = 'issue'
  ) THEN
    ALTER TABLE complaints ADD COLUMN issue text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'complaints' AND column_name = 'solution'
  ) THEN
    ALTER TABLE complaints ADD COLUMN solution text;
  END IF;
END $$;
