-- ============================================
-- WORK ORDERS MODULE - DATABASE SCHEMA
-- ============================================
-- Tabla principal de Work Orders
CREATE TABLE work_orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    -- Información básica
    wo_number TEXT NOT NULL UNIQUE,
    -- WO-2025-0001 (auto-generado)
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'draft',
    -- draft, scheduled, in_progress, on_hold, completed, cancelled
    priority TEXT NOT NULL DEFAULT 'medium',
    -- low, medium, high, urgent
    work_type TEXT NOT NULL DEFAULT 'other',
    -- installation, maintenance, repair, inspection, other
    -- Relaciones
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
    project_id UUID,
    -- Sin FK constraint por ahora, se agregará cuando exista la tabla projects
    client_location_id UUID REFERENCES client_locations(id) ON DELETE
    SET NULL,
        -- Dirección manual (cuando no se usa client_location)
        manual_address TEXT,
        manual_city TEXT,
        manual_state TEXT,
        manual_zip_code TEXT,
        manual_country TEXT,
        -- POC (Point of Contact) - Auto-poblado desde client_location o manual
        poc_name TEXT,
        poc_email TEXT,
        poc_phone TEXT,
        poc_title TEXT,
        -- Fechas programadas
        scheduled_date DATE,
        scheduled_start_time TIME,
        scheduled_end_time TIME,
        -- Fechas reales de ejecución
        actual_start_date TIMESTAMP WITH TIME ZONE,
        actual_end_date TIMESTAMP WITH TIME ZONE,
        -- Evidencias y cierre
        photos_before TEXT [],
        -- Array de URLs de fotos (Supabase Storage)
        photos_after TEXT [],
        -- Array de URLs de fotos (Supabase Storage)
        technician_notes TEXT,
        client_signature TEXT,
        -- URL de la firma digital (Supabase Storage)
        client_signature_name TEXT,
        -- Nombre de quien firma
        -- Auditoría
        created_by UUID REFERENCES auth.users(id),
        completed_by UUID REFERENCES technicians(id)
);
-- Tabla de relación Work Order - Técnicos (many-to-many)
-- Una WO puede tener múltiples técnicos asignados
CREATE TABLE work_order_technicians (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
    technician_id UUID NOT NULL REFERENCES technicians(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    role TEXT,
    -- lead, assistant, etc. (opcional)
    UNIQUE(work_order_id, technician_id)
);
-- Tabla de relación Work Order - Materiales
-- Materiales usados en la WO (sin precios, solo cantidades)
CREATE TABLE work_order_materials (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
    material_id UUID NOT NULL REFERENCES materials(id) ON DELETE RESTRICT,
    quantity DECIMAL(10, 2) NOT NULL DEFAULT 1,
    notes TEXT,
    -- Notas sobre ese material específico en esta WO
    added_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    added_by UUID REFERENCES auth.users(id)
);
-- ============================================
-- ÍNDICES
-- ============================================
CREATE INDEX idx_work_orders_client ON work_orders(client_id);
-- CREATE INDEX idx_work_orders_project ON work_orders(project_id); -- Descomentar cuando projects exista
CREATE INDEX idx_work_orders_location ON work_orders(client_location_id);
CREATE INDEX idx_work_orders_status ON work_orders(status);
CREATE INDEX idx_work_orders_priority ON work_orders(priority);
CREATE INDEX idx_work_orders_scheduled_date ON work_orders(scheduled_date);
CREATE INDEX idx_work_orders_wo_number ON work_orders(wo_number);
CREATE INDEX idx_work_orders_created_at ON work_orders(created_at);
CREATE INDEX idx_work_order_technicians_wo ON work_order_technicians(work_order_id);
CREATE INDEX idx_work_order_technicians_tech ON work_order_technicians(technician_id);
CREATE INDEX idx_work_order_materials_wo ON work_order_materials(work_order_id);
CREATE INDEX idx_work_order_materials_material ON work_order_materials(material_id);
-- ============================================
-- FUNCIÓN: Generar número de WO automático
-- ============================================
CREATE OR REPLACE FUNCTION generate_wo_number() RETURNS TRIGGER AS $$
DECLARE next_number INTEGER;
year_prefix TEXT;
BEGIN year_prefix := TO_CHAR(NOW(), 'YYYY');
-- Buscar el último número del año actual
SELECT COALESCE(
        MAX(
            CAST(
                SUBSTRING(
                    wo_number
                    FROM 9
                ) AS INTEGER
            )
        ),
        0
    ) + 1 INTO next_number
FROM work_orders
WHERE wo_number LIKE 'WO-' || year_prefix || '-%';
-- Generar nuevo número: WO-2025-0001
NEW.wo_number := 'WO-' || year_prefix || '-' || LPAD(next_number::TEXT, 4, '0');
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- ============================================
-- TRIGGER: Auto-generar WO number
-- ============================================
CREATE TRIGGER generate_wo_number_trigger BEFORE
INSERT ON work_orders FOR EACH ROW
    WHEN (NEW.wo_number IS NULL) EXECUTE FUNCTION generate_wo_number();
-- ============================================
-- TRIGGER: Actualizar updated_at
-- ============================================
CREATE TRIGGER update_work_orders_updated_at BEFORE
UPDATE ON work_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_order_technicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_order_materials ENABLE ROW LEVEL SECURITY;
-- Políticas: Usuarios autenticados tienen acceso completo
CREATE POLICY "Enable all access for authenticated users" ON work_orders FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all access for authenticated users" ON work_order_technicians FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all access for authenticated users" ON work_order_materials FOR ALL TO authenticated USING (true);
-- ============================================
-- DATOS DE EJEMPLO (OPCIONAL)
-- ============================================
-- Los puedes usar para pruebas iniciales
-- INSERT INTO work_orders (title, description, status, priority, work_type, client_id)
-- VALUES 
--   ('Instalación de red', 'Instalación completa de red en oficinas principales', 'draft', 'high', 'installation', 'client-uuid-here'),
--   ('Mantenimiento preventivo', 'Revisión trimestral de equipos', 'scheduled', 'medium', 'maintenance', 'client-uuid-here');