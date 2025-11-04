-- ============================================
-- MIGRATION: Add 'field_updated' to change_type constraint
-- ============================================
-- Description: Allows logging of individual field updates in work orders
-- Date: 2025-11-01
-- Drop the existing constraint
ALTER TABLE work_order_changes DROP CONSTRAINT IF EXISTS valid_change_type;
-- Add the new constraint with field_updated
ALTER TABLE work_order_changes
ADD CONSTRAINT valid_change_type CHECK (
        change_type IN (
            'technician_added',
            'technician_removed',
            'technician_role_changed',
            'material_added',
            'material_removed',
            'material_quantity_changed',
            'material_notes_changed',
            'status_changed',
            'field_updated',
            'work_order_reopened',
            'work_order_cancelled',
            'work_order_completed'
        )
    );
-- Update comments
COMMENT ON CONSTRAINT valid_change_type ON work_order_changes IS 'Valid change types including field_updated for inline edits';