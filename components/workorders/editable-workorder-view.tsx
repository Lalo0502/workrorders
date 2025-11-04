"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Edit3,
  Save,
  X,
  Calendar,
  MapPin,
  FileText,
  Plus,
  Trash2,
  Users,
  Package,
  Building2,
  Mail,
  Phone,
  User,
  Briefcase,
  Clock,
  MapPinned,
  ClipboardList,
  AlignLeft,
  Wrench,
  AlertCircle,
  CalendarDays,
  Timer,
  TimerOff,
} from "lucide-react";
import {
  WorkOrder,
  Technician,
  Material,
  Client,
  ClientLocation,
} from "@/types";
import { Combobox } from "@/components/ui/combobox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/lib/supabase/client";

interface WorkOrderTechnician {
  technician_id: string;
  role?: string;
  technicians?: Technician;
}

interface WorkOrderMaterial {
  material_id: string;
  quantity: number;
  notes?: string;
  materials?: Material;
}

interface EditableWorkOrderViewProps {
  workOrder: WorkOrder;
  workOrderTechnicians: WorkOrderTechnician[];
  workOrderMaterials: WorkOrderMaterial[];
  client: Client | null;
  location: ClientLocation | null;
  onSave: (data: {
    workOrderData: Partial<WorkOrder>;
    technicians?: Array<{ technician_id: string; role?: string }>;
    materials?: Array<{
      material_id: string;
      quantity: number;
      notes?: string;
    }>;
  }) => Promise<void>;
}

export function EditableWorkOrderView({
  workOrder,
  workOrderTechnicians,
  workOrderMaterials,
  client,
  location,
  onSave,
}: EditableWorkOrderViewProps) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Available data for dropdowns
  const [clients, setClients] = useState<Client[]>([]);
  const [locations, setLocations] = useState<ClientLocation[]>([]);
  const [allTechnicians, setAllTechnicians] = useState<Technician[]>([]);
  const [allMaterials, setAllMaterials] = useState<Material[]>([]);

  // Form data
  const [formData, setFormData] = useState<Partial<WorkOrder>>({
    title: workOrder.title,
    description: workOrder.description || "",
    work_type: workOrder.work_type,
    priority: workOrder.priority,
    scheduled_date: workOrder.scheduled_date || null,
    scheduled_start_time: workOrder.scheduled_start_time || null,
    scheduled_end_time: workOrder.scheduled_end_time || null,
    poc_name: workOrder.poc_name || "",
    poc_email: workOrder.poc_email || "",
    poc_phone: workOrder.poc_phone || "",
    poc_title: workOrder.poc_title || "",
    client_id: workOrder.client_id,
    client_location_id: workOrder.client_location_id || null,
    manual_address: workOrder.manual_address || "",
    manual_city: workOrder.manual_city || "",
    manual_state: workOrder.manual_state || "",
    manual_zip_code: workOrder.manual_zip_code || "",
  });

  const [technicians, setTechnicians] = useState<
    Array<{ technician_id: string; role?: string }>
  >(
    workOrderTechnicians.map((wt) => ({
      technician_id: wt.technician_id,
      role: wt.role || "",
    }))
  );

  const [materials, setMaterials] = useState<
    Array<{ material_id: string; quantity: number; notes?: string }>
  >(
    workOrderMaterials.map((wm) => ({
      material_id: wm.material_id,
      quantity: wm.quantity,
      notes: wm.notes || "",
    }))
  );

  // Load data for dropdowns
  useEffect(() => {
    const loadData = async () => {
      console.log("🔄 Loading data for edit mode...");

      // Load clients
      const { data: clientsData, error: clientsError } = await supabase
        .from("clients")
        .select("*")
        .eq("active", true)
        .order("name");

      console.log("👥 Clients loaded:", clientsData?.length || 0, clientsError);
      if (clientsData) setClients(clientsData);

      // Load locations for selected client
      if (formData.client_id) {
        const { data: locationsData, error: locationsError } = await supabase
          .from("client_locations")
          .select("*")
          .eq("client_id", formData.client_id)
          .eq("active", true)
          .order("location_name");

        console.log(
          "📍 Locations loaded:",
          locationsData?.length || 0,
          locationsError
        );
        if (locationsData) setLocations(locationsData);
      }

      // Load technicians
      const { data: techniciansData, error: techniciansError } = await supabase
        .from("technicians")
        .select("*")
        .eq("active", true)
        .order("name");

      console.log(
        "🔧 Technicians loaded:",
        techniciansData?.length || 0,
        techniciansError
      );
      if (techniciansData) setAllTechnicians(techniciansData);

      // Load materials
      const { data: materialsData, error: materialsError } = await supabase
        .from("materials")
        .select("*")
        .eq("active", true)
        .order("name");

      console.log(
        "📦 Materials loaded:",
        materialsData?.length || 0,
        materialsError
      );
      if (materialsData) setAllMaterials(materialsData);
    };

    if (isEditMode) {
      loadData();
    }
  }, [isEditMode, formData.client_id]);
  const handleSave = async () => {
    try {
      setIsSaving(true);
      await onSave({
        workOrderData: formData,
        technicians,
        materials,
      });
      setIsEditMode(false);
    } catch (error) {
      console.error("Error saving:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset all form data
    setFormData({
      title: workOrder.title,
      description: workOrder.description || "",
      work_type: workOrder.work_type,
      priority: workOrder.priority,
      scheduled_date: workOrder.scheduled_date || null,
      scheduled_start_time: workOrder.scheduled_start_time || null,
      scheduled_end_time: workOrder.scheduled_end_time || null,
      poc_name: workOrder.poc_name || "",
      poc_email: workOrder.poc_email || "",
      poc_phone: workOrder.poc_phone || "",
      poc_title: workOrder.poc_title || "",
      client_id: workOrder.client_id,
      client_location_id: workOrder.client_location_id || null,
      manual_address: workOrder.manual_address || "",
      manual_city: workOrder.manual_city || "",
      manual_state: workOrder.manual_state || "",
      manual_zip_code: workOrder.manual_zip_code || "",
    });

    setTechnicians(
      workOrderTechnicians.map((wt) => ({
        technician_id: wt.technician_id,
        role: wt.role || "",
      }))
    );

    setMaterials(
      workOrderMaterials.map((wm) => ({
        material_id: wm.material_id,
        quantity: wm.quantity,
        notes: wm.notes || "",
      }))
    );

    setIsEditMode(false);
  };

  const addTechnician = () => {
    setTechnicians([...technicians, { technician_id: "", role: "" }]);
  };

  const removeTechnician = (index: number) => {
    setTechnicians(technicians.filter((_, i) => i !== index));
  };

  const updateTechnician = (index: number, field: string, value: string) => {
    const updated = [...technicians];
    updated[index] = { ...updated[index], [field]: value };
    setTechnicians(updated);
  };

  const addMaterial = () => {
    setMaterials([...materials, { material_id: "", quantity: 1, notes: "" }]);
  };

  const removeMaterial = (index: number) => {
    setMaterials(materials.filter((_, i) => i !== index));
  };

  const updateMaterial = (index: number, field: string, value: any) => {
    const updated = [...materials];
    updated[index] = { ...updated[index], [field]: value };
    setMaterials(updated);
  };

  const getTechnicianName = (techId: string) => {
    const tech =
      allTechnicians.find((t) => t.id === techId) ||
      workOrderTechnicians.find((wt) => wt.technician_id === techId)
        ?.technicians;
    if (!tech) return "Unknown";
    return tech.name;
  };

  const getMaterialName = (matId: string) => {
    const mat =
      allMaterials.find((m) => m.id === matId) ||
      workOrderMaterials.find((wm) => wm.material_id === matId)?.materials;
    return mat?.name || "Unknown";
  };

  const priorityLabels: Record<string, { label: string; variant: any }> = {
    low: { label: "Low", variant: "outline" },
    medium: { label: "Medium", variant: "secondary" },
    high: { label: "High", variant: "default" },
    urgent: { label: "Urgent", variant: "destructive" },
  };

  const workTypeLabels: Record<string, string> = {
    installation: "Installation",
    maintenance: "Maintenance",
    repair: "Repair",
    inspection: "Inspection",
    emergency: "Emergency",
    other: "Other",
  };

  return (
    <div className="space-y-6">
      {/* Edit Mode Toggle */}
      <Card className={isEditMode ? "border-primary border-2" : ""}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              {workOrder.title}
            </CardTitle>
            {!isEditMode ? (
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsEditMode(true)}
              >
                <Edit3 className="h-4 w-4" />
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="gap-2"
                >
                  <Save className="h-4 w-4" />
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCancel}
                  disabled={isSaving}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
          {isEditMode && (
            <p className="text-sm text-muted-foreground mt-2">
              ✏️ Edit mode is active. Make your changes and click "Save Changes"
              when done.
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Description */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
              <AlignLeft className="h-3.5 w-3.5" />
              Description
            </Label>
            {isEditMode ? (
              <Textarea
                value={formData.description || ""}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Work order description..."
                rows={4}
              />
            ) : (
              <div className="min-h-[2.75rem] px-3 py-2.5 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {workOrder.description || "No description"}
                </p>
              </div>
            )}
          </div>

          <Separator />

          {/* Work Type & Priority */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Wrench className="h-3.5 w-3.5" />
                Work Type
              </Label>
              {isEditMode ? (
                <Select
                  value={formData.work_type || ""}
                  onValueChange={(value: any) =>
                    setFormData({ ...formData, work_type: value })
                  }
                >
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="installation">
                      🔧 Installation
                    </SelectItem>
                    <SelectItem value="maintenance">🛠️ Maintenance</SelectItem>
                    <SelectItem value="repair">🔨 Repair</SelectItem>
                    <SelectItem value="inspection">🔍 Inspection</SelectItem>
                    <SelectItem value="other">📋 Other</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex items-center gap-2 h-11 px-3 rounded-lg bg-muted/50">
                  <p className="font-medium text-sm">
                    {workTypeLabels[workOrder.work_type] || workOrder.work_type}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5" />
                Priority
              </Label>
              {isEditMode ? (
                <Select
                  value={formData.priority || ""}
                  onValueChange={(value: any) =>
                    setFormData({ ...formData, priority: value })
                  }
                >
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex items-center gap-2 h-11 px-3 rounded-lg bg-muted/50">
                  <Badge variant={priorityLabels[workOrder.priority]?.variant}>
                    {priorityLabels[workOrder.priority]?.label ||
                      workOrder.priority}
                  </Badge>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Schedule */}
      <Card className={isEditMode ? "border-primary border-2" : ""}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5" />
                Scheduled Date
              </Label>
              {isEditMode ? (
                <Input
                  type="date"
                  value={formData.scheduled_date || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, scheduled_date: e.target.value })
                  }
                  className="h-11"
                />
              ) : (
                <div className="flex items-center gap-2 h-11 px-3 rounded-lg bg-muted/50">
                  <span className="font-medium text-sm">
                    {workOrder.scheduled_date
                      ? new Date(workOrder.scheduled_date).toLocaleDateString(
                          "en-US",
                          {
                            weekday: "short",
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          }
                        )
                      : "Not scheduled"}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Timer className="h-3.5 w-3.5" />
                Start Time
              </Label>
              {isEditMode ? (
                <Input
                  type="time"
                  value={formData.scheduled_start_time || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      scheduled_start_time: e.target.value,
                    })
                  }
                  className="h-11"
                />
              ) : (
                <div className="flex items-center gap-2 h-11 px-3 rounded-lg bg-muted/50">
                  <span className="font-medium text-sm">
                    {workOrder.scheduled_start_time || "Not set"}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                <TimerOff className="h-3.5 w-3.5" />
                End Time
              </Label>
              {isEditMode ? (
                <Input
                  type="time"
                  value={formData.scheduled_end_time || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      scheduled_end_time: e.target.value,
                    })
                  }
                  className="h-11"
                />
              ) : (
                <div className="flex items-center gap-2 h-11 px-3 rounded-lg bg-muted/50">
                  <span className="font-medium text-sm">
                    {workOrder.scheduled_end_time || "Not set"}
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Point of Contact */}
      <Card className={isEditMode ? "border-primary border-2" : ""}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Point of Contact
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" />
                Name
              </Label>
              {isEditMode ? (
                <Input
                  value={formData.poc_name || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, poc_name: e.target.value })
                  }
                  placeholder="Contact name"
                  className="h-11"
                />
              ) : (
                <div className="flex items-center gap-2 h-11 px-3 rounded-lg bg-muted/50">
                  <span className="font-medium text-sm">
                    {workOrder.poc_name || "Not specified"}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Briefcase className="h-3.5 w-3.5" />
                Title
              </Label>
              {isEditMode ? (
                <Input
                  value={formData.poc_title || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, poc_title: e.target.value })
                  }
                  placeholder="Contact title"
                  className="h-11"
                />
              ) : (
                <div className="flex items-center gap-2 h-11 px-3 rounded-lg bg-muted/50">
                  <span className="font-medium text-sm">
                    {workOrder.poc_title || "Not specified"}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" />
                Email
              </Label>
              {isEditMode ? (
                <Input
                  type="email"
                  value={formData.poc_email || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, poc_email: e.target.value })
                  }
                  placeholder="email@example.com"
                  className="h-11"
                />
              ) : (
                <div className="flex items-center gap-2 h-11 px-3 rounded-lg bg-muted/50">
                  <span className="font-medium text-sm">
                    {workOrder.poc_email || "Not specified"}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" />
                Phone
              </Label>
              {isEditMode ? (
                <Input
                  type="tel"
                  value={formData.poc_phone || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, poc_phone: e.target.value })
                  }
                  placeholder="(555) 123-4567"
                  className="h-11"
                />
              ) : (
                <div className="flex items-center gap-2 h-11 px-3 rounded-lg bg-muted/50">
                  <span className="font-medium text-sm">
                    {workOrder.poc_phone || "Not specified"}
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Client & Location */}
      <Card className={isEditMode ? "border-primary border-2" : ""}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Client & Location
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5" />
                Client
              </Label>
              {isEditMode ? (
                <Select
                  value={formData.client_id || ""}
                  onValueChange={(value) => {
                    setFormData({
                      ...formData,
                      client_id: value,
                      client_location_id: null,
                    });
                    setLocations([]);
                  }}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select a client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground">
                        No active clients found
                      </div>
                    ) : (
                      clients.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex items-center gap-2 h-11 px-3 rounded-lg bg-muted/50">
                  <span className="font-medium text-sm">
                    {client?.name || "No client"}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                <MapPinned className="h-3.5 w-3.5" />
                Location (Optional)
              </Label>
              {isEditMode ? (
                <Select
                  value={formData.client_location_id || "none"}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      client_location_id: value === "none" ? null : value,
                    })
                  }
                  disabled={!formData.client_id || locations.length === 0}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue
                      placeholder={
                        locations.length === 0
                          ? "No locations available"
                          : "Select a location"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      No location (use manual address)
                    </SelectItem>
                    {locations.map((loc) => (
                      <SelectItem key={loc.id} value={loc.id}>
                        {loc.location_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex items-center gap-2 h-11 px-3 rounded-lg bg-muted/50">
                  <span className="font-medium text-sm">
                    {location?.location_name || "No location selected"}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Manual Address Fields */}
          {isEditMode && (
            <>
              <Separator />
              <p className="text-sm text-muted-foreground">
                Manual Address (optional - fill if no location selected)
              </p>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  Address
                </Label>
                <Input
                  value={formData.manual_address || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, manual_address: e.target.value })
                  }
                  placeholder="Street address"
                  className="h-11"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input
                    value={formData.manual_city || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, manual_city: e.target.value })
                    }
                    placeholder="City"
                  />
                </div>

                <div className="space-y-2">
                  <Label>State</Label>
                  <Input
                    value={formData.manual_state || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, manual_state: e.target.value })
                    }
                    placeholder="State"
                  />
                </div>

                <div className="space-y-2">
                  <Label>ZIP Code</Label>
                  <Input
                    value={formData.manual_zip_code || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        manual_zip_code: e.target.value,
                      })
                    }
                    placeholder="ZIP"
                  />
                </div>
              </div>
            </>
          )}

          {!isEditMode && workOrder.manual_address && (
            <>
              <Separator />
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  Address
                </Label>
                <div className="flex items-center gap-2 min-h-[2.75rem] px-3 rounded-lg bg-muted/50">
                  <p className="text-sm font-medium">
                    {workOrder.manual_address}
                    {workOrder.manual_city && `, ${workOrder.manual_city}`}
                    {workOrder.manual_state && `, ${workOrder.manual_state}`}
                    {workOrder.manual_zip_code &&
                      ` ${workOrder.manual_zip_code}`}
                  </p>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Technicians */}
      <Card className={isEditMode ? "border-primary border-2" : ""}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Technicians
            </CardTitle>
            {isEditMode && (
              <Button
                variant="outline"
                size="sm"
                onClick={addTechnician}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Add
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {technicians.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="rounded-full bg-muted p-3 mb-3">
                <Users className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                No technicians assigned
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {technicians.map((tech, index) => (
                <div
                  key={index}
                  className={`relative flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                    isEditMode
                      ? "border-dashed border-muted-foreground/30 bg-muted/30"
                      : "border-border bg-muted/50 hover:border-primary/50"
                  }`}
                >
                  {!isEditMode && (
                    <Avatar className="h-12 w-12 border-2 border-background shadow-sm">
                      <AvatarImage
                        src={
                          allTechnicians.find(
                            (t) => t.id === tech.technician_id
                          )?.photo_url ||
                          workOrderTechnicians.find(
                            (wt) => wt.technician_id === tech.technician_id
                          )?.technicians?.photo_url ||
                          ""
                        }
                      />
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {getTechnicianName(tech.technician_id)
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                  )}

                  <div className="flex-1 min-w-0">
                    {isEditMode ? (
                      <div className="space-y-2">
                        <Select
                          value={tech.technician_id}
                          onValueChange={(value) =>
                            updateTechnician(index, "technician_id", value)
                          }
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="Select technician" />
                          </SelectTrigger>
                          <SelectContent>
                            {allTechnicians.length === 0 ? (
                              <div className="p-2 text-sm text-muted-foreground">
                                No active technicians found
                              </div>
                            ) : (
                              allTechnicians.map((t) => (
                                <SelectItem key={t.id} value={t.id}>
                                  {t.name}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>

                        <Input
                          value={tech.role || ""}
                          onChange={(e) =>
                            updateTechnician(index, "role", e.target.value)
                          }
                          placeholder="Role (e.g., Lead, Assistant)"
                          className="h-9"
                        />
                      </div>
                    ) : (
                      <>
                        <p className="font-semibold text-sm truncate">
                          {getTechnicianName(tech.technician_id)}
                        </p>
                        {tech.role ? (
                          <div className="flex items-center gap-1.5 mt-1">
                            <Briefcase className="h-3 w-3 text-muted-foreground" />
                            <p className="text-xs text-muted-foreground truncate">
                              {tech.role}
                            </p>
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground mt-1">
                            No role specified
                          </p>
                        )}
                      </>
                    )}
                  </div>

                  {isEditMode && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeTechnician(index)}
                      className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 absolute top-2 right-2"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Materials */}
      <Card className={isEditMode ? "border-primary border-2" : ""}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Materials & Parts
            </CardTitle>
            {isEditMode && (
              <Button
                variant="outline"
                size="sm"
                onClick={addMaterial}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Material
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {materials.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No materials assigned
            </p>
          ) : (
            <div className="space-y-3">
              {materials.map((mat, index) => (
                <div key={index} className="p-3 rounded-lg border space-y-2">
                  {isEditMode ? (
                    <>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-2">
                          <Select
                            value={mat.material_id}
                            onValueChange={(value) =>
                              updateMaterial(index, "material_id", value)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select material" />
                            </SelectTrigger>
                            <SelectContent>
                              {allMaterials.length === 0 ? (
                                <div className="p-2 text-sm text-muted-foreground">
                                  No active materials found
                                </div>
                              ) : (
                                allMaterials.map((m) => (
                                  <SelectItem key={m.id} value={m.id}>
                                    {m.name} ({m.sku || "No SKU"})
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min="1"
                            value={mat.quantity}
                            onChange={(e) =>
                              updateMaterial(
                                index,
                                "quantity",
                                parseInt(e.target.value) || 1
                              )
                            }
                            placeholder="Qty"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeMaterial(index)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <Input
                        value={mat.notes || ""}
                        onChange={(e) =>
                          updateMaterial(index, "notes", e.target.value)
                        }
                        placeholder="Notes (optional)"
                      />
                    </>
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <p className="font-medium">
                          {getMaterialName(mat.material_id)}
                        </p>
                        <Badge variant="secondary">Qty: {mat.quantity}</Badge>
                      </div>
                      {mat.notes && (
                        <p className="text-sm text-muted-foreground">
                          {mat.notes}
                        </p>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
