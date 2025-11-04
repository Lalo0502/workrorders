"use client";

import { useState, useEffect } from "react";
import {
  WorkOrder,
  Client,
  ClientLocation,
  Technician,
  Material,
} from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Combobox } from "@/components/ui/combobox";
import {
  MapPin,
  Trash2,
  AlertCircle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Check,
  Loader2,
} from "lucide-react";
import { getClients } from "@/lib/supabase/clients";
import { getClientLocations } from "@/lib/supabase/client-locations";
import { getTechnicians } from "@/lib/supabase/technicians";
import { getMaterials } from "@/lib/supabase/materials";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface SelectedTechnician {
  technician_id: string;
  role?: string;
}

interface SelectedMaterial {
  material_id: string;
  quantity: number;
  notes?: string;
}

interface WorkOrderWizardFormProps {
  data: Partial<WorkOrder>;
  onChange: (data: Partial<WorkOrder>) => void;
  onTechniciansChange: (technicians: SelectedTechnician[]) => void;
  onMaterialsChange: (materials: SelectedMaterial[]) => void;
  onComplete: () => void;
  isSaving?: boolean;
}

const wizardSteps = [
  { label: "Basic Info", description: "Title and details" },
  { label: "Location", description: "Client and address" },
  { label: "Schedule", description: "Date and time" },
  { label: "Team", description: "Assign technicians" },
  { label: "Materials", description: "Add materials" },
];

export function WorkOrderWizardForm({
  data,
  onChange,
  onTechniciansChange,
  onMaterialsChange,
  onComplete,
  isSaving = false,
}: WorkOrderWizardFormProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [clients, setClients] = useState<Client[]>([]);
  const [locations, setLocations] = useState<ClientLocation[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [loadingTechnicians, setLoadingTechnicians] = useState(true);
  const [loadingMaterials, setLoadingMaterials] = useState(true);
  const [useManualAddress, setUseManualAddress] = useState(false);

  const [selectedTechnicians, setSelectedTechnicians] = useState<
    SelectedTechnician[]
  >([]);
  const [selectedMaterials, setSelectedMaterials] = useState<
    SelectedMaterial[]
  >([]);

  const [errors, setErrors] = useState<Record<string, string>>({});

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
    }
  }, [data.client_id]);

  useEffect(() => {
    if (data.client_location_id && !useManualAddress) {
      const location = locations.find((l) => l.id === data.client_location_id);
      if (location) {
        onChange({
          ...data,
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
      const clientsData = await getClients();
      setClients(clientsData);
    } catch (error) {
      console.error("Error loading clients:", error);
    } finally {
      setLoadingClients(false);
    }
  };

  const loadLocations = async (clientId: string) => {
    try {
      setLoadingLocations(true);
      const locationsData = await getClientLocations(clientId);
      setLocations(locationsData);
    } catch (error) {
      console.error("Error loading locations:", error);
    } finally {
      setLoadingLocations(false);
    }
  };

  const loadTechnicians = async () => {
    try {
      setLoadingTechnicians(true);
      const techniciansData = await getTechnicians();
      setTechnicians(techniciansData.filter((t) => t.active));
    } catch (error) {
      console.error("Error loading technicians:", error);
    } finally {
      setLoadingTechnicians(false);
    }
  };

  const loadMaterials = async () => {
    try {
      setLoadingMaterials(true);
      const materialsData = await getMaterials();
      setMaterials(materialsData);
    } catch (error) {
      console.error("Error loading materials:", error);
    } finally {
      setLoadingMaterials(false);
    }
  };

  const handleChange = (field: keyof WorkOrder, value: any) => {
    onChange({ ...data, [field]: value });
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleTechnicianAdd = (technicianId: string) => {
    const newTechnicians = [
      ...selectedTechnicians,
      { technician_id: technicianId },
    ];
    setSelectedTechnicians(newTechnicians);
    onTechniciansChange(newTechnicians);
  };

  const handleTechnicianRemove = (technicianId: string) => {
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

  const handleMaterialAdd = (materialId: string) => {
    const newMaterials = [
      ...selectedMaterials,
      { material_id: materialId, quantity: 1 },
    ];
    setSelectedMaterials(newMaterials);
    onMaterialsChange(newMaterials);
  };

  const handleMaterialRemove = (materialId: string) => {
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

  const validateStep = (step: number) => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 0: // Basic Info
        if (!data.title?.trim()) newErrors.title = "Title is required";
        if (!data.priority) newErrors.priority = "Priority is required";
        if (!data.work_type) newErrors.work_type = "Work type is required";
        break;
      case 1: // Location
        if (!data.client_id) newErrors.client_id = "Client is required";
        if (!useManualAddress && !data.client_location_id) {
          newErrors.client_location_id = "Location is required";
        }
        if (useManualAddress && !data.manual_address?.trim()) {
          newErrors.manual_address = "Address is required";
        }
        break;
      case 2: // Schedule
        if (!data.scheduled_date) {
          newErrors.scheduled_date = "Scheduled date is required";
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCompletedSteps((prev) => new Set(prev).add(currentStep));
      setCurrentStep((prev) => Math.min(prev + 1, wizardSteps.length - 1));
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleGoToStep = (step: number) => {
    // Permitir navegación libre a cualquier paso
    setCurrentStep(step);
  };

  const handleComplete = () => {
    // Validar todos los pasos obligatorios
    const step0Valid = validateStep(0);
    const step1Valid = validateStep(1);
    const step2Valid = validateStep(2);

    if (!step0Valid) {
      setCurrentStep(0);
      return;
    }
    if (!step1Valid) {
      setCurrentStep(1);
      return;
    }
    if (!step2Valid) {
      setCurrentStep(2);
      return;
    }

    // Todos los pasos obligatorios están completos
    onComplete();
  };

  const selectedLocation = locations.find(
    (l) => l.id === data.client_location_id
  );

  return (
    <div className="space-y-6">
      {/* Horizontal Progress Stepper */}
      <div className="relative">
        <div className="flex items-center justify-between">
          {wizardSteps.map((step, index) => {
            const isActive = index === currentStep;
            const isCompleted = completedSteps.has(index);

            return (
              <div key={index} className="flex-1 flex items-center">
                <button
                  onClick={() => handleGoToStep(index)}
                  className="flex flex-col items-center gap-2 transition-all cursor-pointer hover:scale-105"
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                      isActive
                        ? "bg-primary text-primary-foreground ring-4 ring-primary/20 scale-110"
                        : isCompleted
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {isCompleted ? <Check className="h-5 w-5" /> : index + 1}
                  </div>
                  <div className="text-center">
                    <div
                      className={`text-xs font-medium ${
                        isActive
                          ? "text-primary font-semibold"
                          : "text-muted-foreground"
                      }`}
                    >
                      {step.label}
                    </div>
                  </div>
                </button>
                {index < wizardSteps.length - 1 && (
                  <div
                    className={`flex-1 h-[2px] mx-2 transition-colors ${
                      completedSteps.has(index) ? "bg-primary" : "bg-muted"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {wizardSteps[currentStep].label}
          </CardTitle>
          {wizardSteps[currentStep].description && (
            <p className="text-sm text-muted-foreground">
              {wizardSteps[currentStep].description}
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {/* STEP 0: Basic Information */}
          {currentStep === 0 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">
                  Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  value={data.title || ""}
                  onChange={(e) => handleChange("title", e.target.value)}
                  placeholder="e.g., Network installation at main office"
                  className={errors.title ? "border-destructive" : ""}
                />
                {errors.title && (
                  <p className="text-sm text-destructive">{errors.title}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={data.description || ""}
                  onChange={(e) => handleChange("description", e.target.value)}
                  placeholder="Describe the work order details..."
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priority">
                    Priority <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={data.priority || ""}
                    onValueChange={(value) => handleChange("priority", value)}
                  >
                    <SelectTrigger
                      className={errors.priority ? "border-destructive" : ""}
                    >
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.priority && (
                    <p className="text-sm text-destructive">
                      {errors.priority}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="work_type">
                    Work Type <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={data.work_type || ""}
                    onValueChange={(value) => handleChange("work_type", value)}
                  >
                    <SelectTrigger
                      className={errors.work_type ? "border-destructive" : ""}
                    >
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="installation">Installation</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="repair">Repair</SelectItem>
                      <SelectItem value="inspection">Inspection</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.work_type && (
                    <p className="text-sm text-destructive">
                      {errors.work_type}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 1: Location & Contact */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="client">
                  Client <span className="text-destructive">*</span>
                </Label>
                <Combobox
                  options={clients.map((client) => ({
                    value: client.id,
                    label: client.name,
                  }))}
                  value={data.client_id || ""}
                  onValueChange={(value) => handleChange("client_id", value)}
                  placeholder={
                    loadingClients ? "Loading..." : "Select a client"
                  }
                  searchPlaceholder="Search clients..."
                  emptyMessage="No clients found."
                  disabled={loadingClients}
                  className={errors.client_id ? "border-destructive" : ""}
                />
                {errors.client_id && (
                  <p className="text-sm text-destructive">{errors.client_id}</p>
                )}
              </div>

              {data.client_id && (
                <>
                  <div className="flex items-center justify-between py-2">
                    <Label>Address</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setUseManualAddress(!useManualAddress)}
                    >
                      {useManualAddress ? "Use Location" : "Use Manual Address"}
                    </Button>
                  </div>

                  {!useManualAddress ? (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="location">
                          Location <span className="text-destructive">*</span>
                        </Label>
                        <Combobox
                          options={locations.map((location) => ({
                            value: location.id,
                            label: location.location_name,
                            extra: location.is_primary ? (
                              <Badge variant="secondary" className="text-xs">
                                Primary
                              </Badge>
                            ) : undefined,
                          }))}
                          value={data.client_location_id || ""}
                          onValueChange={(value) =>
                            handleChange("client_location_id", value)
                          }
                          placeholder={
                            loadingLocations
                              ? "Loading..."
                              : "Select a location"
                          }
                          searchPlaceholder="Search locations..."
                          emptyMessage="No locations found."
                          disabled={loadingLocations}
                          className={
                            errors.client_location_id
                              ? "border-destructive"
                              : ""
                          }
                        />
                        {errors.client_location_id && (
                          <p className="text-sm text-destructive">
                            {errors.client_location_id}
                          </p>
                        )}
                      </div>

                      {selectedLocation && (
                        <Alert>
                          <MapPin className="h-4 w-4" />
                          <AlertDescription>
                            <div className="text-sm space-y-1">
                              <p className="font-medium">
                                {selectedLocation.location_name}
                              </p>
                              {selectedLocation.address && (
                                <p>{selectedLocation.address}</p>
                              )}
                              {selectedLocation.city && (
                                <p>
                                  {selectedLocation.city}
                                  {selectedLocation.state &&
                                    `, ${selectedLocation.state}`}{" "}
                                  {selectedLocation.zip_code}
                                </p>
                              )}
                            </div>
                          </AlertDescription>
                        </Alert>
                      )}
                    </>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="manual_address">
                          Address <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="manual_address"
                          value={data.manual_address || ""}
                          onChange={(e) =>
                            handleChange("manual_address", e.target.value)
                          }
                          placeholder="123 Main St"
                          className={
                            errors.manual_address ? "border-destructive" : ""
                          }
                        />
                        {errors.manual_address && (
                          <p className="text-sm text-destructive">
                            {errors.manual_address}
                          </p>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="manual_city">City</Label>
                          <Input
                            id="manual_city"
                            value={data.manual_city || ""}
                            onChange={(e) =>
                              handleChange("manual_city", e.target.value)
                            }
                            placeholder="City"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="manual_state">State</Label>
                          <Input
                            id="manual_state"
                            value={data.manual_state || ""}
                            onChange={(e) =>
                              handleChange("manual_state", e.target.value)
                            }
                            placeholder="State"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="manual_zip_code">ZIP Code</Label>
                          <Input
                            id="manual_zip_code"
                            value={data.manual_zip_code || ""}
                            onChange={(e) =>
                              handleChange("manual_zip_code", e.target.value)
                            }
                            placeholder="12345"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="manual_country">Country</Label>
                          <Input
                            id="manual_country"
                            value={data.manual_country || ""}
                            onChange={(e) =>
                              handleChange("manual_country", e.target.value)
                            }
                            placeholder="USA"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* POC Section */}
                  <div className="pt-4 border-t">
                    <Label className="text-base">Point of Contact</Label>
                    <p className="text-sm text-muted-foreground mb-4">
                      {!useManualAddress && data.client_location_id
                        ? "Auto-filled from location"
                        : "Enter contact information"}
                    </p>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="poc_name">Name</Label>
                        <Input
                          id="poc_name"
                          value={data.poc_name || ""}
                          onChange={(e) =>
                            handleChange("poc_name", e.target.value)
                          }
                          placeholder="John Doe"
                          disabled={
                            !useManualAddress && !!data.client_location_id
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="poc_title">Title</Label>
                        <Input
                          id="poc_title"
                          value={data.poc_title || ""}
                          onChange={(e) =>
                            handleChange("poc_title", e.target.value)
                          }
                          placeholder="IT Manager"
                          disabled={
                            !useManualAddress && !!data.client_location_id
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="poc_email">Email</Label>
                        <Input
                          id="poc_email"
                          type="email"
                          value={data.poc_email || ""}
                          onChange={(e) =>
                            handleChange("poc_email", e.target.value)
                          }
                          placeholder="john@example.com"
                          disabled={
                            !useManualAddress && !!data.client_location_id
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="poc_phone">Phone</Label>
                        <Input
                          id="poc_phone"
                          type="tel"
                          value={data.poc_phone || ""}
                          onChange={(e) =>
                            handleChange("poc_phone", e.target.value)
                          }
                          placeholder="(555) 123-4567"
                          disabled={
                            !useManualAddress && !!data.client_location_id
                          }
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* STEP 2: Scheduling */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="scheduled_date">
                  Scheduled Date <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="scheduled_date"
                  type="date"
                  value={data.scheduled_date || ""}
                  onChange={(e) =>
                    handleChange("scheduled_date", e.target.value)
                  }
                  className={errors.scheduled_date ? "border-destructive" : ""}
                />
                {errors.scheduled_date && (
                  <p className="text-sm text-destructive">
                    {errors.scheduled_date}
                  </p>
                )}
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

              {data.scheduled_date && (
                <Alert>
                  <Calendar className="h-4 w-4" />
                  <AlertDescription>
                    <p className="font-medium">
                      {new Date(data.scheduled_date).toLocaleDateString(
                        "en-US",
                        {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }
                      )}
                    </p>
                    {(data.scheduled_start_time || data.scheduled_end_time) && (
                      <p className="text-sm text-muted-foreground">
                        {data.scheduled_start_time || "00:00"} -{" "}
                        {data.scheduled_end_time || "00:00"}
                      </p>
                    )}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* STEP 3: Assigned Technicians */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Add Technician</Label>
                <Combobox
                  options={technicians
                    .filter(
                      (tech) =>
                        !selectedTechnicians.some(
                          (st) => st.technician_id === tech.id
                        )
                    )
                    .map((tech) => ({
                      value: tech.id,
                      label: tech.name,
                    }))}
                  value=""
                  onValueChange={handleTechnicianAdd}
                  placeholder={
                    loadingTechnicians
                      ? "Loading..."
                      : "Select a technician to add"
                  }
                  searchPlaceholder="Search technicians..."
                  emptyMessage="No available technicians."
                  disabled={loadingTechnicians}
                />
              </div>

              {selectedTechnicians.length > 0 ? (
                <div className="space-y-3">
                  <Label>Selected Technicians</Label>
                  {selectedTechnicians.map((selected) => {
                    const tech = technicians.find(
                      (t) => t.id === selected.technician_id
                    );
                    if (!tech) return null;

                    return (
                      <div
                        key={tech.id}
                        className="flex items-center gap-3 p-3 border rounded-lg"
                      >
                        <Avatar className="h-10 w-10">
                          <AvatarImage
                            src={tech.photo_url || undefined}
                            alt={tech.name}
                          />
                          <AvatarFallback>
                            {tech.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{tech.name}</p>
                          <p className="text-sm text-muted-foreground truncate">
                            {tech.email}
                          </p>
                        </div>
                        <div className="w-32">
                          <Input
                            placeholder="Role (optional)"
                            value={selected.role || ""}
                            onChange={(e) =>
                              handleTechnicianRoleChange(
                                tech.id,
                                e.target.value
                              )
                            }
                            className="text-sm"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleTechnicianRemove(tech.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No technicians assigned yet. You can skip this step or add
                    technicians now.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* STEP 4: Materials */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Add Material</Label>
                <Combobox
                  options={materials
                    .filter(
                      (mat) =>
                        !selectedMaterials.some(
                          (sm) => sm.material_id === mat.id
                        )
                    )
                    .map((mat) => ({
                      value: mat.id,
                      label: `${mat.name}${mat.sku ? ` (${mat.sku})` : ""}`,
                    }))}
                  value=""
                  onValueChange={handleMaterialAdd}
                  placeholder={
                    loadingMaterials ? "Loading..." : "Select a material to add"
                  }
                  searchPlaceholder="Search materials..."
                  emptyMessage="No available materials."
                  disabled={loadingMaterials}
                />
              </div>

              {selectedMaterials.length > 0 ? (
                <div className="space-y-3">
                  <Label>Selected Materials</Label>
                  {selectedMaterials.map((selected) => {
                    const mat = materials.find(
                      (m) => m.id === selected.material_id
                    );
                    if (!mat) return null;

                    return (
                      <div
                        key={mat.id}
                        className="p-3 border rounded-lg space-y-3"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium">{mat.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {mat.sku && `SKU: ${mat.sku}`}
                              {mat.category && ` • ${mat.category}`}
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleMaterialRemove(mat.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Quantity</Label>
                            <Input
                              type="number"
                              min="0.01"
                              step="0.01"
                              value={selected.quantity}
                              onChange={(e) =>
                                handleMaterialQuantityChange(
                                  mat.id,
                                  parseFloat(e.target.value) || 1
                                )
                              }
                              className="text-sm"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Unit</Label>
                            <Input
                              value={mat.unit_of_measure || "units"}
                              disabled
                              className="text-sm bg-muted"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs">Notes (optional)</Label>
                          <Input
                            placeholder="Add notes about this material..."
                            value={selected.notes || ""}
                            onChange={(e) =>
                              handleMaterialNotesChange(mat.id, e.target.value)
                            }
                            className="text-sm"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No materials added yet. You can skip this step or add
                    materials now.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-6 border-t mt-6">
          <div>
            {currentStep > 0 && (
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevious}
                disabled={isSaving}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
            )}
          </div>
          <div>
            {currentStep < wizardSteps.length - 1 ? (
              <Button type="button" onClick={handleNext} disabled={isSaving}>
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleComplete}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Review & Create
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
