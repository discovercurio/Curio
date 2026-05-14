/*
  # Create collectibles table

  1. New Tables
    - `collectibles`
      - `id` (uuid, primary key) - Unique identifier for each collectible
      - `name` (text) - Name of the collectible item
      - `type` (text) - Type of collectible (Card, Coin, Comic, Other)
      - `grade` (text, optional) - Grade assigned to the item
      - `grading_company` (text, optional) - Company that graded the item
      - `value` (numeric) - Current estimated value
      - `initial_value` (numeric) - Value when first added to collection
      - `description` (text) - Description of the collectible
      - `image_url` (text, optional) - URL to item image
      - `date_added` (timestamptz) - Date when item was added to collection
      - `last_updated` (timestamptz) - Last time the record was updated
      - `user_id` (uuid, optional) - Reference to user who owns the item
      - `market_data` (jsonb, optional) - Market performance data
      
  2. Security
    - Enable RLS on `collectibles` table
    - Add policies for authenticated users to manage their own collectibles
    
  3. Important Notes
    - `initial_value` captures the item's value at the time it was added
    - This allows tracking price appreciation/depreciation over time
    - Market data stored as JSONB for flexibility
*/

CREATE TABLE IF NOT EXISTS collectibles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL,
  grade text,
  grading_company text,
  value numeric NOT NULL DEFAULT 0,
  initial_value numeric NOT NULL DEFAULT 0,
  description text DEFAULT '',
  image_url text,
  date_added timestamptz DEFAULT now(),
  last_updated timestamptz DEFAULT now(),
  user_id uuid,
  market_data jsonb
);

ALTER TABLE collectibles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own collectibles"
  ON collectibles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own collectibles"
  ON collectibles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own collectibles"
  ON collectibles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own collectibles"
  ON collectibles FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_collectibles_user_id ON collectibles(user_id);
CREATE INDEX IF NOT EXISTS idx_collectibles_date_added ON collectibles(date_added DESC);