"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";
import { createProjectLog } from "@/lib/supabase/project-logs";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface AddWorkOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  onSuccess: () => void;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: {
    label: "Pending",
    color: "bg-yellow-100 text-yellow-800",
  },
  in_progress: {
    label: "In Progress",
    color: "bg-blue-100 text-blue-800",
  },
  completed: {
    label: "Completed",
    color: "bg-green-100 text-green-800",
  },
  cancelled: {
    label: "Cancelled",
    color: "bg-red-100 text-red-800",
  },
};

export function AddWorkOrderDialog({
  open,
  onOpenChange,
  projectId,
  onSuccess,
}: AddWorkOrderDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [selectedWorkOrders, setSelectedWorkOrders] = useState<Set<string>>(
    new Set()
  );
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      loadAvailableWorkOrders();
    }
  }, [open, projectId]);

  const loadAvailableWorkOrders = async () => {
    try {
      setLoading(true);

      // Get work orders that don't have a project assigned or are not in this project
      const { data, error } = await supabase
        .from("work_orders")
        .select(
          `
          *,
          clients:client_id (
            name
          )
        `
        )
        .or(`project_id.is.null,project_id.neq.${projectId}`)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setWorkOrders(data || []);
    } catch (error) {
      console.error("Error loading work orders:", error);
      toast.error("Error loading work orders");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleWorkOrder = (workOrderId: string) => {
    const newSelection = new Set(selectedWorkOrders);
    if (newSelection.has(workOrderId)) {
      newSelection.delete(workOrderId);
    } else {
      newSelection.add(workOrderId);
    }
    setSelectedWorkOrders(newSelection);
  };

  const handleSubmit = async () => {
    if (selectedWorkOrders.size === 0) {
      toast.error("Select at least one work order");
      return;
    }

    try {
      setSubmitting(true);

      // Update all selected work orders to assign them to this project
      const updates = Array.from(selectedWorkOrders).map((woId) =>
        supabase
          .from("work_orders")
          // @ts-ignore - Supabase types not updated
          .update({ project_id: projectId })
          .eq("id", woId)
      );

      const results = await Promise.all(updates);

      const hasErrors = results.some((result: any) => result.error);
      if (hasErrors) {
        throw new Error("Error assigning some work orders");
      }

      // Create log entries for each added work order
      const logPromises = Array.from(selectedWorkOrders).map((woId) => {
        const workOrder = workOrders.find((wo) => wo.id === woId);
        return createProjectLog({
          project_id: projectId,
          action: "work_order_added",
          field_name: "work_order",
          old_value: "",
          new_value: workOrder?.title || `Work Order #${workOrder?.wo_number}`,
        });
      });

      await Promise.all(logPromises);

      toast.success(
        `${selectedWorkOrders.size} work order(s) added successfully`
      );
      onSuccess();
      onOpenChange(false);
      setSelectedWorkOrders(new Set());
    } catch (error) {
      console.error("Error adding work orders:", error);
      toast.error("Error adding work orders");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredWorkOrders = workOrders.filter(
    (wo) =>
      wo.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      wo.wo_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      wo.clients?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Add Work Orders to Project</DialogTitle>
          <DialogDescription>
            Select existing work orders to add to this project
          </DialogDescription>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by title, number or client..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>

        {/* Work Orders List */}
        <div className="flex-1 overflow-auto border rounded-md">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredWorkOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mb-2" />
              <p className="text-sm">
                {workOrders.length === 0
                  ? "No work orders available"
                  : "No work orders found"}
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredWorkOrders.map((wo) => (
                <div
                  key={wo.id}
                  className={`flex items-start gap-3 p-4 cursor-pointer hover:bg-accent transition-colors ${
                    selectedWorkOrders.has(wo.id) ? "bg-accent" : ""
                  }`}
                  onClick={() => handleToggleWorkOrder(wo.id)}
                >
                  <input
                    type="checkbox"
                    checked={selectedWorkOrders.has(wo.id)}
                    onChange={() => handleToggleWorkOrder(wo.id)}
                    className="mt-1"
                  />
                  <FileText className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{wo.title}</p>
                        <p className="text-sm text-muted-foreground">
                          #{wo.wo_number}
                        </p>
                      </div>
                      <Badge
                        className={
                          statusConfig[wo.status]?.color ||
                          "bg-gray-100 text-gray-800"
                        }
                      >
                        {statusConfig[wo.status]?.label || wo.status}
                      </Badge>
                    </div>
                    {wo.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {wo.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      {wo.clients && <span>Client: {wo.clients.name}</span>}
                      {wo.created_at && (
                        <span>
                          Created:{" "}
                          {format(new Date(wo.created_at), "PP", {
                            locale: es,
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || selectedWorkOrders.size === 0}
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Adding...
              </>
            ) : (
              `Add ${
                selectedWorkOrders.size > 0
                  ? `(${selectedWorkOrders.size})`
                  : ""
              }`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
