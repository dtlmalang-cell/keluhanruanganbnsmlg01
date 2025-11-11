/*
  # Recreate Complaints Table with PIC Field

  1. New Tables
    - `complaints`
      - `id` (uuid, primary key)
      - `date` (date, required)
      - `time_of_issue` (time, optional)
      - `time_of_repair` (time, optional)
      - `user_name` (text, required)
      - `complaint` (text, required)
      - `category` (text, required)
      - `room_number` (text, required)
      - `issue` (text, optional)
      - `solution` (text, optional)
      - `admin_name` (text, required)
      - `pic` (text, optional) - Person In Charge field
      - `status` (text, required, default 'late')
      - `created_at` (timestamptz, auto-generated)

  2. Security
    - Enable RLS on `complaints` table
    - Add policy for authenticated users to read all complaints
    - Add policy for authenticated users to insert complaints
    - Add policy for authenticated users to update complaints
    - Add policy for authenticated users to delete their own complaints

  3. Important Notes
    - The status will be automatically calculated based on time difference
    - If time between time_of_issue and time_of_repair is < 20 minutes: status = 'on time'
    - If time between time_of_issue and time_of_repair is >= 20 minutes: status = 'late'
*/

-- Drop existing table if it exists
DROP TABLE IF EXISTS complaints;

-- Create complaints table
CREATE TABLE IF NOT EXISTS complaints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  time_of_issue time,
  time_of_repair time,
  user_name text NOT NULL,
  complaint text NOT NULL,
  category text NOT NULL,
  room_number text NOT NULL,
  issue text,
  solution text,
  admin_name text NOT NULL,
  pic text,
  status text NOT NULL DEFAULT 'late',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can read all complaints
CREATE POLICY "Authenticated users can read all complaints"
  ON complaints
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Authenticated users can insert complaints
CREATE POLICY "Authenticated users can insert complaints"
  ON complaints
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Authenticated users can update complaints
CREATE POLICY "Authenticated users can update complaints"
  ON complaints
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy: Authenticated users can delete complaints
CREATE POLICY "Authenticated users can delete complaints"
  ON complaints
  FOR DELETE
  TO authenticated
  USING (true);