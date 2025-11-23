-- Create locations from existing events
-- Run this in your Supabase SQL Editor

-- First, ensure the locations table exists
CREATE TABLE IF NOT EXISTS public.locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text
);

-- Add description column if it doesn't exist (for existing tables)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'locations' AND column_name = 'description') THEN
        ALTER TABLE public.locations ADD COLUMN description text;
        RAISE NOTICE 'Added description column to locations table';
    ELSE
        RAISE NOTICE 'Description column already exists in locations table';
    END IF;
END $$;

-- Enable RLS on locations table
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

-- Locations policies: Allow admins to manage locations
CREATE POLICY "Admins can manage locations" ON public.locations
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Insert all webapp locations first (to ensure complete coverage)
INSERT INTO public.locations (name, description) VALUES
('Port Moresby, Papua New Guinea', 'Capital city of Papua New Guinea'),
('Lae, Papua New Guinea', 'Second largest city in Papua New Guinea'),
('Madang, Papua New Guinea', 'Coastal city known for diving and marine life'),
('Mount Hagen, Papua New Guinea', 'Highlands city in Western Highlands Province'),
('Goroka, Papua New Guinea', 'City in Eastern Highlands Province'),
('Rabaul, Papua New Guinea', 'Volcanic city in East New Britain Province'),
('Wewak, Papua New Guinea', 'Coastal city in East Sepik Province'),
('Popondetta, Papua New Guinea', 'Capital of Oro Province'),
('Arawa, Papua New Guinea', 'Capital of Bougainville Region'),
('Kavieng, Papua New Guinea', 'Capital of New Ireland Province'),
('Daru, Papua New Guinea', 'Town in Western Province'),
('Vanimo, Papua New Guinea', 'Border town in Sandaun Province'),
('Kimbe, Papua New Guinea', 'Capital of West New Britain Province'),
('Mendi, Papua New Guinea', 'Capital of Southern Highlands Province'),
('Kundiawa, Papua New Guinea', 'Town in Chimbu Province'),
('Lorengau, Papua New Guinea', 'Capital of Manus Province'),
('Wabag, Papua New Guinea', 'Capital of Enga Province'),
('Kokopo, Papua New Guinea', 'Town near Rabaul, East New Britain Province'),
('Buka, Papua New Guinea', 'Town in Bougainville Region'),
('Alotau, Papua New Guinea', 'Capital of Milne Bay Province')
ON CONFLICT (name) DO NOTHING;

-- Insert any additional unique locations from existing events (for custom locations)
INSERT INTO public.locations (name, description)
SELECT DISTINCT
  e.location as name,
  'Custom location in Papua New Guinea' as description
FROM public.events e
WHERE e.location IS NOT NULL
  AND e.location != ''
  AND NOT EXISTS (
    SELECT 1 FROM public.locations l WHERE l.name = e.location
  );

-- Verify the locations were created
SELECT 'Locations created:' as status, COUNT(*) as count FROM public.locations;

-- Show all locations
SELECT name, description FROM public.locations ORDER BY name;
