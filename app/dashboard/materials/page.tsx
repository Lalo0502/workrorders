"use client";

import { useEffect, useState, useMemo } from "react";
import { Material } from "@/types";
import {
  getMaterials,
  createMaterial,
  updateMaterial,
  deleteMaterial,
} from "@/lib/supabase/materials";
import { DataTable } from "@/components/shared/data-table";
import { PageHeader } from "@/components/shared/page-header";
import {
  AdvancedFilterSort,
  MultiFilterConfig,
  SortOption,
} from "@/components/shared/advanced-filter-sort";
import { Pagination } from "@/components/shared/pagination";
import { createMaterialColumns } from "@/components/materials/material-columns";
import { MaterialForm } from "@/components/materials/material-form";
import { MaterialDetailDialog } from "@/components/materials/material-detail-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Package, Plus } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
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

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(
    null
  );
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [materialToDelete, setMaterialToDelete] = useState<Material | null>(
    null
  );

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
    loadMaterials();
  }, []);

  const loadMaterials = async () => {
    try {
      setLoading(true);
      const data = await getMaterials();
      setMaterials(data);
    } catch (error) {
      console.error("Error loading materials:", error);
      toast.error("Failed to load materials");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (data: any) => {
    try {
      await createMaterial({ ...data, active: true });
      toast.success("Material created successfully");
      loadMaterials();
    } catch (error) {
      console.error("Error creating material:", error);
      toast.error("Failed to create material");
    }
  };

  const handleUpdate = async (data: any) => {
    if (!selectedMaterial) return;
    try {
      await updateMaterial(selectedMaterial.id, data);
      toast.success("Material updated successfully");
      setSelectedMaterial(null); // Clear selection after update
      loadMaterials();
    } catch (error) {
      console.error("Error updating material:", error);
      toast.error("Failed to update material");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!materialToDelete) return;
    try {
      await deleteMaterial(materialToDelete.id);
      toast.success("Material deleted successfully");
      setDeleteDialogOpen(false);
      setMaterialToDelete(null);
      loadMaterials();
    } catch (error) {
      console.error("Error deleting material:", error);
      toast.error("Failed to delete material");
    }
  };

  const handleView = (material: Material) => {
    setSelectedMaterial(material);
    setDetailDialogOpen(true);
  };

  const handleEdit = (material: Material) => {
    setSelectedMaterial(material);
  };

  const handleDelete = (material: Material) => {
    setMaterialToDelete(material);
    setDeleteDialogOpen(true);
  };

  // Filter Configuration
  const filterConfigs: MultiFilterConfig[] = [
    {
      key: "category",
      label: "Categoría",
      options: [
        { value: "network", label: "Red" },
        { value: "cable", label: "Cable" },
        { value: "connector", label: "Conector" },
        { value: "tool", label: "Herramienta" },
        { value: "equipment", label: "Equipo" },
        { value: "other", label: "Otro" },
      ],
    },
    {
      key: "active",
      label: "Estado",
      options: [
        { value: "true", label: "Activo" },
        { value: "false", label: "Inactivo" },
      ],
    },
  ];

  // Sort Options
  const sortOptions: SortOption[] = [
    { value: "name", label: "Nombre" },
    { value: "sku", label: "SKU" },
    { value: "category", label: "Categoría" },
    { value: "unit_of_measure", label: "Unidad de Medida" },
  ];

  // Filtered and Sorted Data
  const filteredAndSortedData = useMemo(() => {
    let filtered = [...materials];

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (material) =>
          material.name.toLowerCase().includes(query) ||
          material.sku?.toLowerCase().includes(query) ||
          material.description?.toLowerCase().includes(query)
      );
    }

    // Apply filters
    Object.entries(activeFilters).forEach(([key, values]) => {
      if (values.length > 0) {
        if (key === "active") {
          filtered = filtered.filter((material) =>
            values.includes(material.active.toString())
          );
        } else {
          filtered = filtered.filter((material) =>
            values.includes(material[key as keyof Material] as string)
          );
        }
      }
    });

    // Apply sorting
    if (sortBy) {
      filtered.sort((a, b) => {
        const aValue = a[sortBy as keyof Material];
        const bValue = b[sortBy as keyof Material];

        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;

        if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
        if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [materials, searchQuery, activeFilters, sortBy, sortDirection]);

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

  const columns = createMaterialColumns({
    onView: handleView,
    onEdit: handleEdit,
    onDelete: handleDelete,
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header with Add Material Form */}
      <div className="flex items-center justify-between mb-6">
        <PageHeader
          icon={Package}
          title="Materials"
          description="Catalog of parts, materials and equipment"
        />
        <MaterialForm onSubmit={handleCreate} />
      </div>

      {/* Advanced Filter & Search */}
      <div className="mb-6">
        <AdvancedFilterSort
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Buscar por nombre, SKU o descripción..."
          filters={filterConfigs}
          activeFilters={activeFilters}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
          sortOptions={sortOptions}
          sortBy={sortBy}
          sortDirection={sortDirection}
          onSortChange={handleSortChange}
        />
      </div>

      {/* Materials Table */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <Card>
            <CardContent className="flex items-center justify-center h-96">
              <div className="flex flex-col items-center gap-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                <p className="text-sm text-muted-foreground">
                  Loading materials...
                </p>
              </div>
            </CardContent>
          </Card>
        ) : filteredAndSortedData.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Package className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {materials.length === 0
                  ? "No materials yet"
                  : "No materials found"}
              </h3>
              <p className="text-muted-foreground text-center max-w-sm">
                {materials.length === 0
                  ? "Get started by clicking 'Add Material' button above."
                  : "Try adjusting your search or filters."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <DataTable columns={columns} data={paginatedData} />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Pagination */}
      {!loading && filteredAndSortedData.length > 0 && (
        <div className="mt-6">
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
        </div>
      )}

      {/* Detail Dialog */}
      <MaterialDetailDialog
        material={selectedMaterial}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
      />

      {/* Edit Dialog */}
      {selectedMaterial && (
        <MaterialForm material={selectedMaterial} onSubmit={handleUpdate} />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              material "{materialToDelete?.name}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
