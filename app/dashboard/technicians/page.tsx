"use client";

import { useState, useEffect } from "react";
import { Plus, LayoutGrid, List, RefreshCw, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/page-header";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { DataTable } from "@/components/shared/data-table";
import { TechnicianForm } from "@/components/technicians/technician-form";
import { TechnicianDetailDialog } from "@/components/technicians/technician-detail-dialog";
import { TechnicianCard } from "@/components/technicians/technician-card";
import { createTechnicianColumns } from "@/components/technicians/technician-columns";
import { Technician } from "@/types";
import {
  getTechnicians,
  createTechnician,
  updateTechnician,
  deleteTechnician,
} from "@/lib/supabase/technicians";
import { useToast } from "@/hooks/use-toast";

export default function TechniciansPage() {
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTechnician, setSelectedTechnician] =
    useState<Technician | null>(null);
  const [technicianToDelete, setTechnicianToDelete] =
    useState<Technician | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadTechnicians();
  }, []);

  async function loadTechnicians() {
    try {
      setLoading(true);
      const data = await getTechnicians();
      setTechnicians(data);
    } catch (error) {
      console.error("Error loading technicians:", error);
      toast({
        title: "Error",
        description: "Failed to load technicians",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(data: any) {
    try {
      await createTechnician(data);
      toast({
        title: "Success",
        description: "Technician created successfully",
      });
      setCreateDialogOpen(false);
      loadTechnicians();
    } catch (error) {
      console.error("Error creating technician:", error);
      toast({
        title: "Error",
        description: "Failed to create technician",
        variant: "destructive",
      });
    }
  }

  async function handleUpdate(data: any) {
    if (!selectedTechnician) return;

    try {
      await updateTechnician(selectedTechnician.id, data);
      toast({
        title: "Success",
        description: "Technician updated successfully",
      });
      setEditDialogOpen(false);
      setSelectedTechnician(null);
      loadTechnicians();
    } catch (error) {
      console.error("Error updating technician:", error);
      toast({
        title: "Error",
        description: "Failed to update technician",
        variant: "destructive",
      });
    }
  }

  function handleView(technician: Technician) {
    setSelectedTechnician(technician);
    setDetailDialogOpen(true);
  }

  function handleEdit(technician: Technician) {
    setSelectedTechnician(technician);
    setEditDialogOpen(true);
  }

  function handleDelete(technician: Technician) {
    setTechnicianToDelete(technician);
    setDeleteDialogOpen(true);
  }

  async function handleDeleteConfirm() {
    if (!technicianToDelete) return;

    try {
      await deleteTechnician(technicianToDelete.id);
      toast({
        title: "Success",
        description: "Technician deleted successfully",
      });
      setDeleteDialogOpen(false);
      setTechnicianToDelete(null);
      loadTechnicians();
    } catch (error) {
      console.error("Error deleting technician:", error);
      toast({
        title: "Error",
        description: "Failed to delete technician",
        variant: "destructive",
      });
    }
  }

  const columns = createTechnicianColumns({
    onView: handleView,
    onEdit: handleEdit,
    onDelete: handleDelete,
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <PageHeader
          icon={Users}
          title="Technicians"
          description="Manage your technical staff"
        />
        <div className="flex items-center gap-2">
          <Tabs
            value={viewMode}
            onValueChange={(v) => setViewMode(v as "cards" | "table")}
          >
            <TabsList>
              <TabsTrigger value="cards" className="gap-2">
                <LayoutGrid className="h-4 w-4" />
                <span className="hidden sm:inline">Cards</span>
              </TabsTrigger>
              <TabsTrigger value="table" className="gap-2">
                <List className="h-4 w-4" />
                <span className="hidden sm:inline">Table</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Button
            variant="outline"
            size="icon"
            onClick={loadTechnicians}
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            onClick={() => setCreateDialogOpen(true)}
            title="New Technician"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {viewMode === "table" ? (
        <DataTable columns={columns} data={technicians} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-64 rounded-lg border bg-card animate-pulse"
              />
            ))
          ) : technicians.length === 0 ? (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              No technicians registered
            </div>
          ) : (
            technicians.map((technician) => (
              <TechnicianCard
                key={technician.id}
                technician={technician}
                onView={handleView}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))
          )}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Technician</DialogTitle>
            <DialogDescription>
              Enter the information for the new technician
            </DialogDescription>
          </DialogHeader>
          <TechnicianForm
            onSubmit={handleCreate}
            onCancel={() => setCreateDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Technician</DialogTitle>
            <DialogDescription>
              Update the technician's information
            </DialogDescription>
          </DialogHeader>
          <TechnicianForm
            technician={
              editDialogOpen && selectedTechnician
                ? selectedTechnician
                : undefined
            }
            onSubmit={handleUpdate}
            onCancel={() => {
              setEditDialogOpen(false);
              setSelectedTechnician(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <TechnicianDetailDialog
        technician={selectedTechnician}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              technician{" "}
              <span className="font-semibold">{technicianToDelete?.name}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
