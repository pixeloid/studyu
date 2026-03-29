-- Add category to extras for separating regular extras from catering
ALTER TABLE extras ADD COLUMN category TEXT NOT NULL DEFAULT 'extra'
  CHECK (category IN ('extra', 'catering'));

-- Update existing catering packages
UPDATE extras SET category = 'catering'
WHERE name IN ('Alap csomag', 'Közepes csomag', 'Teljes csomag');
