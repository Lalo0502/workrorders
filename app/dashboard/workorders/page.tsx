"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, RefreshCw, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { DataTable } from "@/components/shared/data-table";
import { PageHeader } from "@/components/shared/page-header";
import { createWorkOrderColumns } from "@/components/workorders/workorder-columns";
import { getWorkOrders, deleteWorkOrder } from "@/lib/supabase/workorders";
import { WorkOrder } from "@/types";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent } from "@/components/ui/card";
import {
  AdvancedFilterSort,
  MultiFilterConfig,
  SortOption,
} from "@/components/shared/advanced-filter-sort";
import { Pagination } from "@/components/shared/pagination";

export default function WorkOrdersPage() {
  const router = useRouter();
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(
    null
  );
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { toast } = useToast();

  // Search and Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>(
    {}
  );
  const [sortBy, setSortBy] = useState("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    loadWorkOrders();
  }, []);

  const loadWorkOrders = async () => {
    try {
      setLoading(true);
      const data = await getWorkOrders();
      setWorkOrders(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not load work orders",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter Configuration
  const filterConfigs: MultiFilterConfig[] = [
    {
      key: "status",
      label: "Status",
      options: [
        { value: "draft", label: "Draft" },
        { value: "scheduled", label: "Scheduled" },
        { value: "in_progress", label: "In Progress" },
        { value: "on_hold", label: "On Hold" },
        { value: "completed", label: "Completed" },
        { value: "cancelled", label: "Cancelled" },
      ],
    },
    {
      key: "priority",
      label: "Priority",
      options: [
        { value: "low", label: "Low" },
        { value: "medium", label: "Medium" },
        { value: "high", label: "High" },
        { value: "urgent", label: "Urgent" },
      ],
    },
    {
      key: "work_type",
      label: "Work Type",
      options: [
        { value: "installation", label: "Installation" },
        { value: "maintenance", label: "Maintenance" },
        { value: "repair", label: "Repair" },
        { value: "inspection", label: "Inspection" },
        { value: "other", label: "Other" },
      ],
    },
  ];

  // Sort Options
  const sortOptions: SortOption[] = [
    { value: "wo_number", label: "WO Number" },
    { value: "title", label: "Title" },
    { value: "scheduled_date", label: "Scheduled Date" },
    { value: "priority", label: "Priority" },
    { value: "status", label: "Status" },
  ];

  // Filtered and Sorted Data
  const filteredAndSortedData = useMemo(() => {
    let filtered = [...workOrders];

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (wo) =>
          wo.wo_number.toLowerCase().includes(query) ||
          wo.title.toLowerCase().includes(query) ||
          wo.description?.toLowerCase().includes(query)
      );
    }

    // Apply filters
    Object.entries(activeFilters).forEach(([key, values]) => {
      if (values.length > 0) {
        filtered = filtered.filter((wo) =>
          values.includes(wo[key as keyof WorkOrder] as string)
        );
      }
    });

    // Apply sorting
    if (sortBy) {
      filtered.sort((a, b) => {
        const aValue = a[sortBy as keyof WorkOrder];
        const bValue = b[sortBy as keyof WorkOrder];

        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;

        if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
        if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [workOrders, searchQuery, activeFilters, sortBy, sortDirection]);

  // Paginated Data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredAndSortedData.slice(startIndex, endIndex);
  }, [filteredAndSortedData, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredAndSortedData.length / pageSize);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeFilters, sortBy, sortDirection]);

  const handleView = (workOrder: WorkOrder) => {
    router.push(`/dashboard/workorders/${workOrder.wo_number}`);
  };

  const handleEdit = (workOrder: WorkOrder) => {
    router.push(`/dashboard/workorders/${workOrder.wo_number}/edit`);
  };

  const handleDelete = (workOrder: WorkOrder) => {
    setSelectedWorkOrder(workOrder);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!selectedWorkOrder) return;

    try {
      await deleteWorkOrder(selectedWorkOrder.id);
      toast({
        title: "Orden eliminada",
        description: "La orden de trabajo se eliminó correctamente",
      });
      loadWorkOrders();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar la orden de trabajo",
        variant: "destructive",
      });
    } finally {
      setShowDeleteDialog(false);
      setSelectedWorkOrder(null);
    }
  };

  const handleFilterChange = (key: string, values: string[]) => {
    setActiveFilters((prev) => ({
      ...prev,
      [key]: values,
    }));
  };

  const handleClearFilters = () => {
    setActiveFilters({});
    setSearchQuery("");
    setSortBy("");
    setSortDirection("asc");
  };

  const handleSortChange = (newSortBy: string, direction: "asc" | "desc") => {
    setSortBy(newSortBy);
    setSortDirection(direction);
  };

  const columns = createWorkOrderColumns({
    onView: handleView,
    onEdit: handleEdit,
    onDelete: handleDelete,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <PageHeader
          icon={ClipboardList}
          title="Work Orders"
          description="Manage and track all work orders"
        />
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={loadWorkOrders}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Link href="/dashboard/workorders/new">
            <Button size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Advanced Filter & Search */}
      <AdvancedFilterSort
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search by WO#, title or description..."
        filters={filterConfigs}
        activeFilters={activeFilters}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
        sortOptions={sortOptions}
        sortBy={sortBy}
        sortDirection={sortDirection}
        onSortChange={handleSortChange}
      />

      {/* Data Table */}
      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center h-96">
            <div className="flex flex-col items-center gap-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              <p className="text-sm text-muted-foreground">
                Loading work orders...
              </p>
            </div>
          </CardContent>
        </Card>
      ) : filteredAndSortedData.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-96">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">No results found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchQuery ||
                Object.values(activeFilters).some((v) => v.length > 0)
                  ? "Try adjusting your search filters"
                  : "No work orders available"}
              </p>
              {(searchQuery ||
                Object.values(activeFilters).some((v) => v.length > 0)) && (
                <Button variant="outline" onClick={handleClearFilters}>
                  Clear filters
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardContent className="p-0">
              <DataTable columns={columns} data={paginatedData} />
            </CardContent>
          </Card>

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={filteredAndSortedData.length}
            onPageChange={setCurrentPage}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setCurrentPage(1);
            }}
            pageSizeOptions={[10, 20, 30, 50, 100]}
          />
        </>
      )}

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              work order{" "}
              <span className="font-semibold">
                {selectedWorkOrder?.wo_number}
              </span>
              .
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
