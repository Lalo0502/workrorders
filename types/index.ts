/**
 * Central type exports
 * 
 * This is a barrel file that re-exports all types from their respective modules.
 * This maintains backward compatibility while organizing types into logical files.
 */

// Client types
export type { Client, ClientLocation } from './client';

// Project types
export type { Project, ProjectStatus } from './project';

// Work Order types
export type {
  WorkOrder,
  WorkOrderTechnician,
  WorkOrderMaterial,
  WorkOrderChange,
  WorkOrderStatus,
  WorkOrderPriority,
  WorkOrderType,
  WorkOrderChangeType,
} from './work-order';

// Material types
export type {
  Material,
  MaterialCategory,
  MaterialUnitOfMeasure,
} from './material';

// Technician types
export type { Technician } from './technician';
