"use client";

import { useState, useEffect } from "react";
import {
  WorkOrder,
  Client,
  ClientLocation,
  Technician,
  Material,
} from "@/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  ClipboardList,
  MapPin,
  Users,
  Package,
  Calendar,
  X,
  Plus,
  Trash2,
} from "lucide-react";
import { getClients } from "@/lib/supabase/clients";
import { getClientLocations } from "@/lib/supabase/client-locations";
import { getTechnicians } from "@/lib/supabase/technicians";
import { getMaterials } from "@/lib/supabase/materials";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface SelectedTechnician {
  technician_id: string;
  role?: string;
}

interface SelectedMaterial {
  material_id: string;
  quantity: number;
  notes?: string;
}

interface WorkOrderFormProps {
  data: Partial<WorkOrder>;
  onChange: (data: Partial<WorkOrder>) => void;
  onTechniciansChange: (technicians: SelectedTechnician[]) => void;
  onMaterialsChange: (materials: SelectedMaterial[]) => void;
}

export function WorkOrderForm({
  data,
  onChange,
  onTechniciansChange,
  onMaterialsChange,
}: WorkOrderFormProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [locations, setLocations] = useState<ClientLocation[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [loadingTechnicians, setLoadingTechnicians] = useState(true);
  const [loadingMaterials, setLoadingMaterials] = useState(true);
  const [useManualAddress, setUseManualAddress] = useState(false);

  // Selected technicians and materials
  const [selectedTechnicians, setSelectedTechnicians] = useState<
    SelectedTechnician[]
  >([]);
  const [selectedMaterials, setSelectedMaterials] = useState<
    SelectedMaterial[]
  >([]);

  useEffect(() => {
    loadClients();
    loadTechnicians();
    loadMaterials();
  }, []);

  useEffect(() => {
    if (data.client_id) {
      loadLocations(data.client_id);
    } else {
      setLocations([]);
      onChange({
        client_location_id: null,
        manual_address: "",
        manual_city: "",
        manual_state: "",
        manual_zip_code: "",
        poc_name: "",
        poc_email: "",
        poc_phone: "",
        poc_title: "",
      });
    }
  }, [data.client_id]);

  useEffect(() => {
    if (data.client_location_id && !useManualAddress) {
      const location = locations.find(
        (loc) => loc.id === data.client_location_id
      );
      if (location) {
        // Auto-populate POC from location
        onChange({
          poc_name: location.poc_name || "",
          poc_email: location.poc_email || "",
          poc_phone: location.poc_phone || "",
          poc_title: location.poc_title || "",
        });
      }
    }
  }, [data.client_location_id, useManualAddress, locations]);

  const loadClients = async () => {
    try {
      setLoadingClients(true);
      const data = await getClients();
      setClients(data);
    } catch (error) {
      console.error("Error loading clients:", error);
    } finally {
      setLoadingClients(false);
    }
  };

  const loadLocations = async (clientId: string) => {
    try {
      setLoadingLocations(true);
      const data = await getClientLocations(clientId);
      setLocations(data);
    } catch (error) {
      console.error("Error loading locations:", error);
    } finally {
      setLoadingLocations(false);
    }
  };

  const loadTechnicians = async () => {
    try {
      setLoadingTechnicians(true);
      const data = await getTechnicians();
      setTechnicians(data.filter((t) => t.active)); // Only active technicians
    } catch (error) {
      console.error("Error loading technicians:", error);
    } finally {
      setLoadingTechnicians(false);
    }
  };

  const loadMaterials = async () => {
    try {
      setLoadingMaterials(true);
      const data = await getMaterials();
      setMaterials(data);
    } catch (error) {
      console.error("Error loading materials:", error);
    } finally {
      setLoadingMaterials(false);
    }
  };

  const handleAddTechnician = (technicianId: string) => {
    if (!selectedTechnicians.find((t) => t.technician_id === technicianId)) {
      const newTechnicians = [
        ...selectedTechnicians,
        { technician_id: technicianId },
      ];
      setSelectedTechnicians(newTechnicians);
      onTechniciansChange(newTechnicians);
    }
  };

  const handleRemoveTechnician = (technicianId: string) => {
    const newTechnicians = selectedTechnicians.filter(
      (t) => t.technician_id !== technicianId
    );
    setSelectedTechnicians(newTechnicians);
    onTechniciansChange(newTechnicians);
  };

  const handleTechnicianRoleChange = (technicianId: string, role: string) => {
    const newTechnicians = selectedTechnicians.map((t) =>
      t.technician_id === technicianId ? { ...t, role } : t
    );
    setSelectedTechnicians(newTechnicians);
    onTechniciansChange(newTechnicians);
  };

  const handleAddMaterial = (materialId: string) => {
    if (!selectedMaterials.find((m) => m.material_id === materialId)) {
      const newMaterials = [
        ...selectedMaterials,
        { material_id: materialId, quantity: 1 },
      ];
      setSelectedMaterials(newMaterials);
      onMaterialsChange(newMaterials);
    }
  };

  const handleRemoveMaterial = (materialId: string) => {
    const newMaterials = selectedMaterials.filter(
      (m) => m.material_id !== materialId
    );
    setSelectedMaterials(newMaterials);
    onMaterialsChange(newMaterials);
  };

  const handleMaterialQuantityChange = (
    materialId: string,
    quantity: number
  ) => {
    const newMaterials = selectedMaterials.map((m) =>
      m.material_id === materialId ? { ...m, quantity } : m
    );
    setSelectedMaterials(newMaterials);
    onMaterialsChange(newMaterials);
  };

  const handleMaterialNotesChange = (materialId: string, notes: string) => {
    const newMaterials = selectedMaterials.map((m) =>
      m.material_id === materialId ? { ...m, notes } : m
    );
    setSelectedMaterials(newMaterials);
    onMaterialsChange(newMaterials);
  };

  const handleChange = (field: keyof WorkOrder, value: any) => {
    onChange({ [field]: value });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Basic Information
          </CardTitle>
          <CardDescription>General work order details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Network installation at main office"
              value={data.title || ""}
              onChange={(e) => handleChange("title", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe the work order details..."
              rows={4}
              value={data.description || ""}
              onChange={(e) => handleChange("description", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priority *</Label>
              <Select
                value={data.priority || "medium"}
                onValueChange={(value) => handleChange("priority", value)}
              >
                <SelectTrigger id="priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="work_type">Work Type *</Label>
              <Select
                value={data.work_type || "other"}
                onValueChange={(value) => handleChange("work_type", value)}
              >
                <SelectTrigger id="work_type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="installation">Installation</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="repair">Repair</SelectItem>
                  <SelectItem value="inspection">Inspection</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Location & Contact */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Location & Contact
          </CardTitle>
          <CardDescription>Select client and location</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="client_id">Client *</Label>
            <Select
              value={data.client_id || ""}
              onValueChange={(value) => handleChange("client_id", value)}
              disabled={loadingClients}
            >
              <SelectTrigger id="client_id">
                <SelectValue
                  placeholder={
                    loadingClients ? "Loading clients..." : "Select a client..."
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {data.client_id && (
            <>
              <div className="space-y-2">
                <Label htmlFor="client_location_id">Location</Label>
                <Select
                  value={data.client_location_id || ""}
                  onValueChange={(value) => {
                    handleChange("client_location_id", value);
                    setUseManualAddress(false);
                  }}
                  disabled={loadingLocations || locations.length === 0}
                >
                  <SelectTrigger id="client_location_id">
                    <SelectValue
                      placeholder={
                        loadingLocations
                          ? "Loading locations..."
                          : locations.length === 0
                          ? "No locations available"
                          : "Select a location..."
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((location) => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.location_name}
                        {location.is_primary && " (Primary)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setUseManualAddress(!useManualAddress);
                    if (!useManualAddress) {
                      handleChange("client_location_id", null);
                    }
                  }}
                >
                  {useManualAddress ? "Use Location" : "Use Manual Address"}
                </Button>
              </div>

              {useManualAddress && (
                <>
                  <div className="space-y-2">
                    <Label>Address</Label>
                    <Input
                      placeholder="Street and number"
                      value={data.manual_address || ""}
                      onChange={(e) =>
                        handleChange("manual_address", e.target.value)
                      }
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>City</Label>
                      <Input
                        placeholder="City"
                        value={data.manual_city || ""}
                        onChange={(e) =>
                          handleChange("manual_city", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>State</Label>
                      <Input
                        placeholder="State"
                        value={data.manual_state || ""}
                        onChange={(e) =>
                          handleChange("manual_state", e.target.value)
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>ZIP Code</Label>
                      <Input
                        placeholder="ZIP"
                        value={data.manual_zip_code || ""}
                        onChange={(e) =>
                          handleChange("manual_zip_code", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Country</Label>
                      <Input
                        placeholder="Country"
                        value={data.manual_country || ""}
                        onChange={(e) =>
                          handleChange("manual_country", e.target.value)
                        }
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="border-t pt-4 mt-4">
                <h4 className="font-medium mb-3">Point of Contact (POC)</h4>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input
                        placeholder="Contact name"
                        value={data.poc_name || ""}
                        onChange={(e) =>
                          handleChange("poc_name", e.target.value)
                        }
                        disabled={
                          !useManualAddress && !!data.client_location_id
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Title/Position</Label>
                      <Input
                        placeholder="Manager, etc."
                        value={data.poc_title || ""}
                        onChange={(e) =>
                          handleChange("poc_title", e.target.value)
                        }
                        disabled={
                          !useManualAddress && !!data.client_location_id
                        }
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        type="email"
                        placeholder="email@example.com"
                        value={data.poc_email || ""}
                        onChange={(e) =>
                          handleChange("poc_email", e.target.value)
                        }
                        disabled={
                          !useManualAddress && !!data.client_location_id
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input
                        type="tel"
                        placeholder="+1 (123) 456-7890"
                        value={data.poc_phone || ""}
                        onChange={(e) =>
                          handleChange("poc_phone", e.target.value)
                        }
                        disabled={
                          !useManualAddress && !!data.client_location_id
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Scheduling */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Scheduling
          </CardTitle>
          <CardDescription>Execution date and time</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="scheduled_date">Scheduled Date</Label>
            <Input
              id="scheduled_date"
              type="date"
              value={data.scheduled_date || ""}
              onChange={(e) => handleChange("scheduled_date", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="scheduled_start_time">Start Time</Label>
              <Input
                id="scheduled_start_time"
                type="time"
                value={data.scheduled_start_time || ""}
                onChange={(e) =>
                  handleChange("scheduled_start_time", e.target.value)
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="scheduled_end_time">End Time</Label>
              <Input
                id="scheduled_end_time"
                type="time"
                value={data.scheduled_end_time || ""}
                onChange={(e) =>
                  handleChange("scheduled_end_time", e.target.value)
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assigned Technicians */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Assigned Technicians
          </CardTitle>
          <CardDescription>
            Assign technicians to this work order
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Selected Technicians List */}
          {selectedTechnicians.length > 0 && (
            <div className="space-y-2">
              {selectedTechnicians.map((selected) => {
                const technician = technicians.find(
                  (t) => t.id === selected.technician_id
                );
                if (!technician) return null;

                return (
                  <div
                    key={technician.id}
                    className="flex items-center gap-3 p-3 border rounded-lg"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={technician.photo_url || undefined}
                        alt={technician.name}
                      />
                      <AvatarFallback>
                        {technician.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">{technician.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {technician.email}
                      </p>
                    </div>
                    <Input
                      placeholder="Role (optional)"
                      value={selected.role || ""}
                      onChange={(e) =>
                        handleTechnicianRoleChange(
                          technician.id,
                          e.target.value
                        )
                      }
                      className="w-32"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveTechnician(technician.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Add Technician Dropdown */}
          <div className="space-y-2">
            <Label>Add Technician</Label>
            <Select
              value=""
              onValueChange={handleAddTechnician}
              disabled={loadingTechnicians}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    loadingTechnicians ? "Loading..." : "Select a technician..."
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {technicians
                  .filter(
                    (t) =>
                      !selectedTechnicians.find((s) => s.technician_id === t.id)
                  )
                  .map((technician) => (
                    <SelectItem key={technician.id} value={technician.id}>
                      {technician.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {selectedTechnicians.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No technicians assigned yet
            </p>
          )}
        </CardContent>
      </Card>

      {/* Materials */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Materials
          </CardTitle>
          <CardDescription>
            Materials needed for this work order
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Selected Materials List */}
          {selectedMaterials.length > 0 && (
            <div className="space-y-3">
              {selectedMaterials.map((selected) => {
                const material = materials.find(
                  (m) => m.id === selected.material_id
                );
                if (!material) return null;

                return (
                  <div
                    key={material.id}
                    className="p-3 border rounded-lg space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium">{material.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {material.sku && `SKU: ${material.sku}`}
                          {material.category && ` • ${material.category}`}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveMaterial(material.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Quantity</Label>
                        <Input
                          type="number"
                          min="1"
                          step="0.01"
                          value={selected.quantity}
                          onChange={(e) =>
                            handleMaterialQuantityChange(
                              material.id,
                              parseFloat(e.target.value) || 1
                            )
                          }
                          className="h-8"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Unit</Label>
                        <Input
                          value={material.unit_of_measure}
                          disabled
                          className="h-8 bg-muted"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Notes (optional)</Label>
                      <Input
                        placeholder="Add notes about this material..."
                        value={selected.notes || ""}
                        onChange={(e) =>
                          handleMaterialNotesChange(material.id, e.target.value)
                        }
                        className="h-8"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Add Material Dropdown */}
          <div className="space-y-2">
            <Label>Add Material</Label>
            <Select
              value=""
              onValueChange={handleAddMaterial}
              disabled={loadingMaterials}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    loadingMaterials ? "Loading..." : "Select a material..."
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {materials
                  .filter(
                    (m) =>
                      !selectedMaterials.find((s) => s.material_id === m.id)
                  )
                  .map((material) => (
                    <SelectItem key={material.id} value={material.id}>
                      {material.name} {material.sku && `(${material.sku})`}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {selectedMaterials.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No materials added yet
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
