"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Loader2,
  Save,
  Users,
  Package,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { WorkOrder, Technician, Material } from "@/types";
import {
  getWorkOrderByNumber,
  getWorkOrderTechniciansWithDetails,
  getWorkOrderMaterialsWithDetails,
  assignTechnician,
  removeTechnician,
  addMaterial,
  removeMaterial,
  updateMaterial,
} from "@/lib/supabase/workorders";
import { getTechnicians } from "@/lib/supabase/technicians";
import { getMaterials } from "@/lib/supabase/materials";
import {
  logTechnicianAdded,
  logTechnicianRemoved,
  logTechnicianRoleChanged,
  logMaterialAdded,
  logMaterialRemoved,
  logMaterialQuantityChanged,
} from "@/lib/supabase/work-order-changes";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown, X, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageProps {
  params: {
    wo_number: string;
  };
}

interface WorkOrderTechnician {
  technician_id: string;
  role?: string;
  technicians?: Technician;
}

interface WorkOrderMaterial {
  id: string;
  material_id: string;
  quantity: number;
  notes?: string;
  materials?: Material;
}

export default function EditWorkOrderPage({ params }: PageProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);

  // Current assignments
  const [assignedTechnicians, setAssignedTechnicians] = useState<
    WorkOrderTechnician[]
  >([]);
  const [assignedMaterials, setAssignedMaterials] = useState<
    WorkOrderMaterial[]
  >([]);

  // Available options
  const [allTechnicians, setAllTechnicians] = useState<Technician[]>([]);
  const [allMaterials, setAllMaterials] = useState<Material[]>([]);

  // UI state
  const [technicianOpen, setTechnicianOpen] = useState(false);
  const [materialOpen, setMaterialOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, [params.wo_number]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load work order
      const wo = await getWorkOrderByNumber(params.wo_number);
      if (!wo) {
        toast({
          title: "Error",
          description: "Work Order not found",
          variant: "destructive",
        });
        router.push("/dashboard/workorders");
        return;
      }

      // Check if editable
      if (!["draft", "scheduled", "in_progress"].includes(wo.status)) {
        toast({
          title: "Cannot Edit",
          description: "This work order cannot be edited in its current status",
          variant: "destructive",
        });
        router.push(`/dashboard/workorders/${params.wo_number}`);
        return;
      }

      setWorkOrder(wo);

      // Load current assignments
      const [techs, mats] = await Promise.all([
        getWorkOrderTechniciansWithDetails(wo.id),
        getWorkOrderMaterialsWithDetails(wo.id),
      ]);
      setAssignedTechnicians(techs);
      setAssignedMaterials(mats);

      // Load all available options
      const [allTechs, allMats] = await Promise.all([
        getTechnicians(),
        getMaterials(),
      ]);
      setAllTechnicians(allTechs.filter((t) => t.active));
      setAllMaterials(allMats.filter((m) => m.active));
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: "Error",
        description: "Failed to load work order data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Technician handlers
  const handleAddTechnician = async (technicianId: string) => {
    if (!workOrder) return;

    // Check if already assigned
    if (assignedTechnicians.find((t) => t.technician_id === technicianId)) {
      toast({
        title: "Already Assigned",
        description: "This technician is already assigned to this work order",
        variant: "destructive",
      });
      return;
    }

    try {
      await assignTechnician(workOrder.id, technicianId);

      // Find technician name for logging
      const technician = allTechnicians.find((t) => t.id === technicianId);
      if (technician) {
        await logTechnicianAdded(workOrder.id, technicianId, technician.name);
      }

      toast({
        title: "Technician Added",
        description: "Technician has been assigned to this work order",
      });
      loadData(); // Reload to get fresh data
    } catch (error) {
      console.error("Error adding technician:", error);
      toast({
        title: "Error",
        description: "Failed to assign technician",
        variant: "destructive",
      });
    }
  };

  const handleRemoveTechnician = async (technicianId: string) => {
    if (!workOrder) return;

    try {
      // Find technician for logging before removal
      const technician = assignedTechnicians.find(
        (t) => t.technician_id === technicianId
      );

      await removeTechnician(workOrder.id, technicianId);

      if (technician?.technicians) {
        await logTechnicianRemoved(
          workOrder.id,
          technicianId,
          technician.technicians.name
        );
      }

      toast({
        title: "Technician Removed",
        description: "Technician has been removed from this work order",
      });
      loadData();
    } catch (error) {
      console.error("Error removing technician:", error);
      toast({
        title: "Error",
        description: "Failed to remove technician",
        variant: "destructive",
      });
    }
  };

  const handleUpdateTechnicianRole = async (
    technicianId: string,
    role: string
  ) => {
    if (!workOrder) return;

    try {
      // Find current role for logging
      const technician = assignedTechnicians.find(
        (t) => t.technician_id === technicianId
      );
      const oldRole = technician?.role;

      // Remove and re-add with new role
      await removeTechnician(workOrder.id, technicianId);
      await assignTechnician(workOrder.id, technicianId, role);

      if (technician?.technicians) {
        await logTechnicianRoleChanged(
          workOrder.id,
          technicianId,
          technician.technicians.name,
          oldRole,
          role
        );
      }

      toast({
        title: "Role Updated",
        description: "Technician role has been updated",
      });
      loadData();
    } catch (error) {
      console.error("Error updating role:", error);
      toast({
        title: "Error",
        description: "Failed to update technician role",
        variant: "destructive",
      });
    }
  };

  // Material handlers
  const handleAddMaterial = async (materialId: string) => {
    if (!workOrder) return;

    // Check if already assigned
    if (assignedMaterials.find((m) => m.material_id === materialId)) {
      toast({
        title: "Already Added",
        description: "This material is already in this work order",
        variant: "destructive",
      });
      return;
    }

    try {
      await addMaterial(workOrder.id, materialId, 1);

      // Find material name for logging
      const material = allMaterials.find((m) => m.id === materialId);
      if (material) {
        await logMaterialAdded(workOrder.id, materialId, material.name, 1);
      }

      toast({
        title: "Material Added",
        description: "Material has been added to this work order",
      });
      loadData();
    } catch (error) {
      console.error("Error adding material:", error);
      toast({
        title: "Error",
        description: "Failed to add material",
        variant: "destructive",
      });
    }
  };

  const handleRemoveMaterial = async (materialRecordId: string) => {
    try {
      // Find material for logging before removal
      const material = assignedMaterials.find((m) => m.id === materialRecordId);

      await removeMaterial(materialRecordId);

      if (material?.materials) {
        await logMaterialRemoved(
          workOrder!.id,
          material.material_id,
          material.materials.name,
          material.quantity
        );
      }

      toast({
        title: "Material Removed",
        description: "Material has been removed from this work order",
      });
      loadData();
    } catch (error) {
      console.error("Error removing material:", error);
      toast({
        title: "Error",
        description: "Failed to remove material",
        variant: "destructive",
      });
    }
  };

  const handleUpdateMaterialQuantity = async (
    materialRecordId: string,
    quantity: number,
    notes?: string
  ) => {
    if (quantity <= 0) return;

    try {
      // Find material for logging
      const material = assignedMaterials.find((m) => m.id === materialRecordId);
      const oldQuantity = material?.quantity;

      await updateMaterial(materialRecordId, quantity, notes);

      if (material?.materials && oldQuantity !== undefined) {
        await logMaterialQuantityChanged(
          workOrder!.id,
          material.material_id,
          material.materials.name,
          oldQuantity,
          quantity
        );
      }

      toast({
        title: "Quantity Updated",
        description: "Material quantity has been updated",
      });
      loadData();
    } catch (error) {
      console.error("Error updating quantity:", error);
      toast({
        title: "Error",
        description: "Failed to update material quantity",
        variant: "destructive",
      });
    }
  };

  const handleUpdateMaterialNotes = async (
    materialRecordId: string,
    quantity: number,
    notes: string
  ) => {
    try {
      await updateMaterial(materialRecordId, quantity, notes);
      toast({
        title: "Notes Updated",
        description: "Material notes have been updated",
      });
    } catch (error) {
      console.error("Error updating notes:", error);
      toast({
        title: "Error",
        description: "Failed to update material notes",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!workOrder) {
    return null;
  }

  return (
    <div className="container mx-auto p-6 max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/workorders/${params.wo_number}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Edit Work Order</h1>
            <p className="text-muted-foreground mt-1">
              {workOrder.wo_number} - {workOrder.title}
            </p>
          </div>
        </div>
        <Badge
          variant={
            workOrder.status === "draft"
              ? "secondary"
              : workOrder.status === "scheduled"
              ? "default"
              : "outline"
          }
        >
          {workOrder.status}
        </Badge>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          You can modify technicians and materials for this work order. Changes
          are saved immediately.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6">
        {/* Assigned Technicians */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Assigned Technicians
                </CardTitle>
                <CardDescription>
                  Manage technicians assigned to this work order
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add Technician */}
            <div>
              <Label>Add Technician</Label>
              <Popover open={technicianOpen} onOpenChange={setTechnicianOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={technicianOpen}
                    className="w-full justify-between"
                  >
                    Select technician...
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Search technicians..." />
                    <CommandEmpty>No technician found.</CommandEmpty>
                    <CommandGroup>
                      {allTechnicians
                        .filter(
                          (tech) =>
                            !assignedTechnicians.find(
                              (at) => at.technician_id === tech.id
                            )
                        )
                        .map((tech) => (
                          <CommandItem
                            key={tech.id}
                            value={tech.name}
                            onSelect={() => {
                              handleAddTechnician(tech.id);
                              setTechnicianOpen(false);
                            }}
                          >
                            {tech.name}
                          </CommandItem>
                        ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <Separator />

            {/* Current Technicians */}
            <div className="space-y-3">
              {assignedTechnicians.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No technicians assigned yet
                </p>
              ) : (
                assignedTechnicians.map((tech) => (
                  <div
                    key={tech.technician_id}
                    className="flex items-center gap-3 p-3 border rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium">
                        {tech.technicians?.name || "Unknown"}
                      </p>
                      <div className="mt-2">
                        <Label className="text-xs">Role (optional)</Label>
                        <Input
                          placeholder="e.g., Lead, Assistant"
                          value={tech.role || ""}
                          onChange={(e) =>
                            handleUpdateTechnicianRole(
                              tech.technician_id,
                              e.target.value
                            )
                          }
                          className="mt-1"
                        />
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveTechnician(tech.technician_id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Materials */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Materials
                </CardTitle>
                <CardDescription>
                  Manage materials for this work order
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add Material */}
            <div>
              <Label>Add Material</Label>
              <Popover open={materialOpen} onOpenChange={setMaterialOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={materialOpen}
                    className="w-full justify-between"
                  >
                    Select material...
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Search materials..." />
                    <CommandEmpty>No material found.</CommandEmpty>
                    <CommandGroup>
                      {allMaterials
                        .filter(
                          (mat) =>
                            !assignedMaterials.find(
                              (am) => am.material_id === mat.id
                            )
                        )
                        .map((mat) => (
                          <CommandItem
                            key={mat.id}
                            value={mat.name}
                            onSelect={() => {
                              handleAddMaterial(mat.id);
                              setMaterialOpen(false);
                            }}
                          >
                            <div>
                              <p>{mat.name}</p>
                              {mat.sku && (
                                <p className="text-xs text-muted-foreground">
                                  SKU: {mat.sku}
                                </p>
                              )}
                            </div>
                          </CommandItem>
                        ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <Separator />

            {/* Current Materials */}
            <div className="space-y-3">
              {assignedMaterials.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No materials added yet
                </p>
              ) : (
                assignedMaterials.map((mat) => (
                  <div
                    key={mat.id}
                    className="flex flex-col gap-3 p-3 border rounded-lg"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium">
                          {mat.materials?.name || "Unknown Material"}
                        </p>
                        {mat.materials?.sku && (
                          <p className="text-sm text-muted-foreground">
                            SKU: {mat.materials.sku}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveMaterial(mat.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Quantity</Label>
                        <Input
                          type="number"
                          min="1"
                          value={mat.quantity}
                          onChange={(e) =>
                            handleUpdateMaterialQuantity(
                              mat.id,
                              parseInt(e.target.value) || 1,
                              mat.notes || undefined
                            )
                          }
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Unit</Label>
                        <Input
                          value={mat.materials?.unit_of_measure || "units"}
                          disabled
                          className="mt-1"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Notes (optional)</Label>
                      <Textarea
                        placeholder="Add notes about this material..."
                        value={mat.notes || ""}
                        onChange={(e) =>
                          handleUpdateMaterialNotes(
                            mat.id,
                            mat.quantity,
                            e.target.value
                          )
                        }
                        className="mt-1"
                        rows={2}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={() =>
            router.push(`/dashboard/workorders/${params.wo_number}`)
          }
        >
          Done
        </Button>
      </div>
    </div>
  );
}
