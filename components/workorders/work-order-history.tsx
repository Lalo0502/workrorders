"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, History } from "lucide-react";
import { getWorkOrderChanges } from "@/lib/supabase/work-order-changes";
import { WorkOrderChange } from "@/types";

interface WorkOrderHistoryProps {
  workOrderId: string;
  refreshTrigger?: number; // Add this to force refresh
  compact?: boolean; // Add this to render without Card wrapper
}

const changeTypeLabels: Record<WorkOrderChange["change_type"], string> = {
  status_changed: "Status Changed",
  field_updated: "Field Updated",
  work_order_reopened: "Work Order Reopened",
  work_order_completed: "Work Order Completed",
  work_order_cancelled: "Work Order Cancelled",
  technician_added: "Technician Added",
  technician_removed: "Technician Removed",
  technician_role_changed: "Technician Role Changed",
  material_added: "Material Added",
  material_removed: "Material Removed",
  material_quantity_changed: "Material Quantity Changed",
  material_notes_changed: "Material Notes Updated",
};

const changeTypeColors: Record<WorkOrderChange["change_type"], string> = {
  status_changed: "bg-blue-100 text-blue-800",
  field_updated: "bg-purple-100 text-purple-800",
  work_order_reopened: "bg-orange-100 text-orange-800",
  work_order_completed: "bg-green-100 text-green-800",
  work_order_cancelled: "bg-red-100 text-red-800",
  technician_added: "bg-green-100 text-green-800",
  technician_removed: "bg-red-100 text-red-800",
  technician_role_changed: "bg-yellow-100 text-yellow-800",
  material_added: "bg-green-100 text-green-800",
  material_removed: "bg-red-100 text-red-800",
  material_quantity_changed: "bg-yellow-100 text-yellow-800",
  material_notes_changed: "bg-gray-100 text-gray-800",
};

export function WorkOrderHistory({
  workOrderId,
  refreshTrigger,
  compact = false,
}: WorkOrderHistoryProps) {
  const [changes, setChanges] = useState<WorkOrderChange[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadHistory() {
      setLoading(true);
      setError(null);

      try {
        const data = await getWorkOrderChanges(workOrderId);
        setChanges(data);
      } catch (err: any) {
        setError(err.message || "Error al cargar historial");
      }

      setLoading(false);
    }

    loadHistory();
  }, [workOrderId, refreshTrigger]); // Add refreshTrigger to dependencies

  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${day}/${month}/${year} a las ${hours}:${minutes}`;
  }

  function getChangeDescription(change: WorkOrderChange): string {
    switch (change.change_type) {
      case "status_changed":
        return `Status changed from "${change.old_value}" to "${change.new_value}"`;

      case "work_order_reopened":
        return change.notes || "Work order reopened";

      case "work_order_completed":
        return "Work order completed";

      case "work_order_cancelled":
        return change.notes
          ? `Work order cancelled: ${change.notes}`
          : "Work order cancelled";

      case "technician_added":
        return `${change.entity_name} added as ${
          change.new_value || "technician"
        }`;

      case "technician_removed":
        return `${change.entity_name} removed (was ${
          change.old_value || "technician"
        })`;

      case "technician_role_changed":
        return `${change.entity_name} role changed from "${change.old_value}" to "${change.new_value}"`;

      case "material_added":
        return `${change.entity_name} added (quantity: ${change.new_value})`;

      case "material_removed":
        return `${change.entity_name} removed (quantity: ${change.old_value})`;

      case "material_quantity_changed":
        return `${change.entity_name} quantity changed from ${change.old_value} to ${change.new_value}`;

      case "material_notes_changed":
        return `${change.entity_name} notes updated`;

      case "field_updated":
        // entity_name contains the field label (e.g., "Title", "Priority")
        // old_value and new_value contain the previous and new values
        if (change.old_value && change.new_value) {
          return `${change.entity_name} changed from "${change.old_value}" to "${change.new_value}"`;
        } else if (change.new_value) {
          return `${change.entity_name} set to "${change.new_value}"`;
        } else if (change.old_value) {
          return `${change.entity_name} removed (was "${change.old_value}")`;
        }
        return `${change.entity_name} updated`;

      default:
        return "Change recorded";
    }
  }

  // Content renderer for changes list
  const changesContent = (
    <div className="space-y-4">
      {changes.map((change, index) => (
        <div
          key={change.id}
          className="flex items-start gap-4 pb-4 border-b last:border-b-0 last:pb-0"
        >
          {/* Timeline dot */}
          <div className="flex flex-col items-center">
            <div className="h-2 w-2 rounded-full bg-gray-300 mt-2" />
            {index < changes.length - 1 && (
              <div className="w-px h-full bg-gray-200 mt-2" />
            )}
          </div>

          {/* Change content */}
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={changeTypeColors[change.change_type]}>
                {changeTypeLabels[change.change_type]}
              </Badge>
              <span className="text-xs text-gray-500">
                {formatDate(change.created_at)}
              </span>
            </div>

            <p className="text-sm text-gray-700">
              {getChangeDescription(change)}
            </p>

            {change.changed_by_email && (
              <p className="text-xs text-gray-500">
                Por: {change.changed_by_email}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  if (loading) {
    if (compact) {
      return (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      );
    }
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Change History
          </CardTitle>
          <CardDescription>
            Record of all modifications to this work order
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    if (compact) {
      return <p className="text-sm text-red-600 py-4">{error}</p>;
    }
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Change History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-600">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (changes.length === 0) {
    if (compact) {
      return (
        <p className="text-sm text-gray-500 py-4">No changes recorded yet.</p>
      );
    }
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Change History
          </CardTitle>
          <CardDescription>
            Record of all modifications to this work order
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">No changes recorded yet.</p>
        </CardContent>
      </Card>
    );
  }

  // Compact mode - just render the content
  if (compact) {
    return changesContent;
  }

  // Full mode - render with Card wrapper
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Change History
        </CardTitle>
        <CardDescription>
          {changes.length}{" "}
          {changes.length === 1 ? "change recorded" : "changes recorded"}
        </CardDescription>
      </CardHeader>
      <CardContent>{changesContent}</CardContent>
    </Card>
  );
}
