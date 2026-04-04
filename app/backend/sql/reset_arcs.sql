-- Quick reset script for arc and scene data
-- Useful during development when iterating on arc generation

-- Delete all scenes (must delete first due to foreign key)
DELETE FROM scenes;

-- Delete all arcs
DELETE FROM arcs;

-- Verify deletion
SELECT 'Arcs deleted: ' || COUNT(*) FROM arcs;
SELECT 'Scenes deleted: ' || COUNT(*) FROM scenes;
