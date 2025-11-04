-- ============================================
-- WORK ORDER CHANGE TRACKING - AUDIT LOG
-- ============================================
-- Tabla para rastrear todos los cambios en Work Orders
CREATE TABLE work_order_changes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    -- Relación con Work Order
    work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
    -- Tipo de cambio
    change_type TEXT NOT NULL,
    -- 'technician_added', 'technician_removed', 'technician_role_changed', 
    -- 'material_added', 'material_removed', 'material_quantity_changed',
    -- 'material_notes_changed', 'status_changed', 'work_order_reopened'
    -- Detalles del cambio
    entity_type TEXT,
    -- 'technician', 'material', 'work_order'
    entity_id UUID,
    -- ID del técnico o material afectado
    entity_name TEXT,
    -- Nombre del técnico o material para referencia rápida
    -- Valores anteriores y nuevos (JSON para flexibilidad)
    old_value TEXT,
    new_value TEXT,
    -- Metadatos adicionales
    notes TEXT,
    -- Notas adicionales sobre el cambio
    -- Auditoría (guardamos el email directamente en lugar de FK)
    changed_by UUID,
    -- Usuario que hizo el cambio
    changed_by_email TEXT,
    -- Email del usuario (desnormalizado para evitar problemas con auth.users)
    -- Índices para búsquedas rápidas
    CONSTRAINT valid_change_type CHECK (
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
    )
);
-- ============================================
-- ÍNDICES
-- ============================================
CREATE INDEX idx_work_order_changes_wo ON work_order_changes(work_order_id);
CREATE INDEX idx_work_order_changes_type ON work_order_changes(change_type);
CREATE INDEX idx_work_order_changes_entity ON work_order_changes(entity_type, entity_id);
CREATE INDEX idx_work_order_changes_created ON work_order_changes(created_at DESC);
CREATE INDEX idx_work_order_changes_user ON work_order_changes(changed_by);
-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE work_order_changes ENABLE ROW LEVEL SECURITY;
-- Política: Permitir lectura para usuarios autenticados
CREATE POLICY "Enable read access for authenticated users" ON work_order_changes FOR
SELECT TO authenticated USING (true);
-- Política: Permitir inserción para usuarios autenticados
CREATE POLICY "Enable insert for authenticated users" ON work_order_changes FOR
INSERT TO authenticated WITH CHECK (true);
-- ============================================
-- FUNCIONES AUXILIARES
-- ============================================
-- Función para obtener el historial de cambios de un Work Order
CREATE OR REPLACE FUNCTION get_work_order_history(wo_id UUID) RETURNS TABLE (
        id UUID,
        created_at TIMESTAMP WITH TIME ZONE,
        change_type TEXT,
        entity_type TEXT,
        entity_name TEXT,
        old_value TEXT,
        new_value TEXT,
        notes TEXT,
        changed_by_email TEXT
    ) AS $$ BEGIN RETURN QUERY
SELECT woc.id,
    woc.created_at,
    woc.change_type,
    woc.entity_type,
    woc.entity_name,
    woc.old_value,
    woc.new_value,
    woc.notes,
    woc.changed_by_email
FROM work_order_changes woc
WHERE woc.work_order_id = wo_id
ORDER BY woc.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- ============================================
-- TRIGGERS AUTOMÁTICOS (Opcional)
-- ============================================
-- Trigger para registrar cambios de estado automáticamente
CREATE OR REPLACE FUNCTION log_work_order_status_change() RETURNS TRIGGER AS $$ BEGIN IF OLD.status IS DISTINCT
FROM NEW.status THEN
INSERT INTO work_order_changes (
        work_order_id,
        change_type,
        entity_type,
        old_value,
        new_value,
        changed_by
    )
VALUES (
        NEW.id,
        'status_changed',
        'work_order',
        OLD.status,
        NEW.status,
        auth.uid() -- Usuario actual de Supabase
    );
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
CREATE TRIGGER work_order_status_change_trigger
AFTER
UPDATE ON work_orders FOR EACH ROW EXECUTE FUNCTION log_work_order_status_change();
-- ============================================
-- VISTAS ÚTILES
-- ============================================
-- Vista con resumen de cambios por Work Order
CREATE OR REPLACE VIEW work_order_change_summary AS
SELECT work_order_id,
    COUNT(*) as total_changes,
    COUNT(DISTINCT change_type) as change_types_count,
    MIN(created_at) as first_change,
    MAX(created_at) as last_change,
    COUNT(DISTINCT changed_by) as users_involved
FROM work_order_changes
GROUP BY work_order_id;
-- ============================================
-- COMENTARIOS
-- ============================================
COMMENT ON TABLE work_order_changes IS 'Audit log for all changes made to work orders';
COMMENT ON COLUMN work_order_changes.change_type IS 'Type of change: technician_added, material_quantity_changed, etc.';
COMMENT ON COLUMN work_order_changes.entity_type IS 'Type of entity affected: technician, material, work_order';
COMMENT ON COLUMN work_order_changes.entity_id IS 'ID of the affected technician or material';
COMMENT ON COLUMN work_order_changes.old_value IS 'Previous value (for updates)';
COMMENT ON COLUMN work_order_changes.new_value IS 'New value (for updates)';