/*
  # Classroom Complaints Management System

  1. New Tables
    - `complaints`
      - `id` (uuid, primary key) - Unique identifier for each complaint
      - `date` (date) - Date of the complaint
      - `user_name` (text) - Name of the person reporting the complaint
      - `complaint` (text) - Description of the problem
      - `category` (text) - Type of issue (webcam, Audio, ATK, Computer, BINUSMAYA, Software, Wacom, Room)
      - `room_number` (text) - Location where the problem occurred
      - `created_at` (timestamptz) - Timestamp when the complaint was submitted
      
  2. Security
    - Enable RLS on `complaints` table
    - Add policy for anyone to insert complaints (public submission)
    - Add policy for anyone to view complaints (public access)
    
  3. Notes
    - This system allows public access for ease of use in classroom environments
    - All complaints are visible to everyone for transparency
    - Date defaults to current date for convenience
*/

CREATE TABLE IF NOT EXISTS complaints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL DEFAULT CURRENT_DATE,
  user_name text NOT NULL,
  complaint text NOT NULL,
  category text NOT NULL,
  room_number text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit complaints"
  ON complaints
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can view complaints"
  ON complaints
  FOR SELECT
  TO anon, authenticated
  USING (true);
