"use client";

import { useState } from "react";
import { WorkOrder } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  FileText,
  Users,
  MapPin,
  Calendar,
  Package,
  FolderKanban,
} from "lucide-react";
import { Combobox } from "@/components/ui/combobox";
import { useEffect } from "react";
import { getClients } from "@/lib/supabase/clients";
import { getClientLocations } from "@/lib/supabase/client-locations";
import { getTechnicians } from "@/lib/supabase/technicians";
import { getMaterials } from "@/lib/supabase/materials";
import { getProjects } from "@/lib/supabase/projects";
import { getQuotes } from "@/lib/supabase/quotes";
import { Client, ClientLocation, Technician, Material, Project } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trash2 } from "lucide-react";

interface SelectedTechnician {
  technician_id: string;
  role?: string;
}

interface SelectedMaterial {
  material_id: string;
  quantity: number;
  notes?: string;
}

interface ModernWorkOrderFormProps {
  data: Partial<WorkOrder>;
  onChange: (data: Partial<WorkOrder>) => void;
  onTechniciansChange: (technicians: SelectedTechnician[]) => void;
  onMaterialsChange: (materials: SelectedMaterial[]) => void;
  onComplete: () => void;
  isSaving: boolean;
}

const steps = [
  {
    id: 1,
    title: "Basic Info",
    description: "Work order details",
    icon: FileText,
  },
  {
    id: 2,
    title: "Project & Quote",
    description: "Link existing items",
    icon: FolderKanban,
  },
  {
    id: 3,
    title: "Client & Location",
    description: "Who and where",
    icon: MapPin,
  },
  {
    id: 4,
    title: "Schedule",
    description: "When to perform",
    icon: Calendar,
  },
  {
    id: 5,
    title: "Team",
    description: "Assign technicians",
    icon: Users,
  },
  {
    id: 6,
    title: "Materials",
    description: "Required parts",
    icon: Package,
  },
];

export function ModernWorkOrderForm({
  data,
  onChange,
  onTechniciansChange,
  onMaterialsChange,
  onComplete,
  isSaving,
}: ModernWorkOrderFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedTechnicians, setSelectedTechnicians] = useState<
    SelectedTechnician[]
  >([]);
  const [selectedMaterials, setSelectedMaterials] = useState<
    SelectedMaterial[]
  >([]);

  // Data loading
  const [clients, setClients] = useState<Client[]>([]);
  const [locations, setLocations] = useState<ClientLocation[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [loadingLocations, setLoadingLocations] = useState(false);

  useEffect(() => {
    loadAllData();
  }, []);

  useEffect(() => {
    if (data.client_id) {
      loadClientLocations(data.client_id);
    } else {
      // Limpiar ubicaciones si no hay cliente seleccionado
      setLocations([]);
    }
  }, [data.client_id]);

  const loadAllData = async () => {
    try {
      const [clientsData, techsData, matsData, projectsData, quotesData] =
        await Promise.all([
          getClients(),
          getTechnicians(),
          getMaterials(),
          getProjects(),
          getQuotes(),
        ]);
      setClients(clientsData);
      setTechnicians(techsData);
      setMaterials(matsData);
      setProjects(projectsData);
      // Filter quotes that don't have a work order assigned
      setQuotes(quotesData.filter((q: any) => !q.work_order_id));
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoadingClients(false);
    }
  };

  const loadClientLocations = async (clientId: string) => {
    try {
      setLoadingLocations(true);
      const data = await getClientLocations(clientId);
      setLocations(data);
    } catch (error) {
      console.error("Error loading locations:", error);
      setLocations([]);
    } finally {
      setLoadingLocations(false);
    }
  };

  const handleLocationChange = (locationId: string) => {
    // Encontrar la ubicación seleccionada
    const selectedLocation = locations.find((l) => l.id === locationId);

    if (selectedLocation) {
      // Auto-completar los campos de dirección
      onChange({
        client_location_id: locationId,
        manual_address: selectedLocation.address || "",
        manual_city: selectedLocation.city || "",
        manual_state: selectedLocation.state || "",
        manual_zip_code: selectedLocation.zip_code || "",
        manual_country: selectedLocation.country || "USA",
        poc_name: selectedLocation.poc_name || "",
        poc_email: selectedLocation.poc_email || "",
        poc_phone: selectedLocation.poc_phone || "",
        poc_title: selectedLocation.poc_title || "",
      });
    } else {
      onChange({ client_location_id: locationId });
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const isStepComplete = (stepId: number): boolean => {
    switch (stepId) {
      case 1:
        return !!(data.title && data.work_type);
      case 2:
        return true; // Project is optional
      case 3:
        return !!data.client_id;
      case 4:
        return !!data.scheduled_date;
      case 5:
        return selectedTechnicians.length > 0;
      case 6:
        return true; // Materials are optional
      default:
        return false;
    }
  };

  const canProceed = isStepComplete(currentStep);

  return (
    <div className="space-y-8">
      {/* Progress Steps */}
      <div className="relative">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted =
              currentStep > step.id || isStepComplete(step.id);

            return (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center gap-2 flex-1">
                  {/* Step Circle */}
                  <button
                    onClick={() => setCurrentStep(step.id)}
                    className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${
                      isActive
                        ? "bg-primary text-primary-foreground border-primary scale-110 shadow-lg"
                        : isCompleted
                        ? "bg-primary/20 text-primary border-primary"
                        : "bg-background text-muted-foreground border-muted"
                    }`}
                  >
                    {isCompleted && !isActive ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </button>

                  {/* Step Label */}
                  <div className="text-center">
                    <p
                      className={`text-sm font-semibold ${
                        isActive ? "text-primary" : "text-muted-foreground"
                      }`}
                    >
                      {step.title}
                    </p>
                    <p className="text-xs text-muted-foreground hidden sm:block">
                      {step.description}
                    </p>
                  </div>
                </div>

                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div className="flex-1 h-0.5 bg-muted mx-2 mb-12">
                    <div
                      className={`h-full transition-all ${
                        isCompleted ? "bg-primary" : "bg-muted"
                      }`}
                      style={{
                        width: isCompleted ? "100%" : "0%",
                      }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Form Content */}
      <Card className="border-2">
        <CardContent className="p-8">
          {/* Step 1: Basic Info */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-in fade-in-50">
              <div>
                <h2 className="text-2xl font-bold mb-2">Basic Information</h2>
                <p className="text-muted-foreground">
                  Let's start with the essential details of this work order.
                </p>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">
                    Work Order Title <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="title"
                    placeholder="e.g., Network Installation - Building A"
                    value={data.title || ""}
                    onChange={(e) => onChange({ title: e.target.value })}
                    className="text-lg"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe the work to be performed..."
                    value={data.description || ""}
                    onChange={(e) => onChange({ description: e.target.value })}
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="work_type">
                      Work Type <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={data.work_type || ""}
                      onValueChange={(value: any) =>
                        onChange({ work_type: value })
                      }
                    >
                      <SelectTrigger id="work_type">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="installation">
                          🔧 Installation
                        </SelectItem>
                        <SelectItem value="maintenance">
                          🛠️ Maintenance
                        </SelectItem>
                        <SelectItem value="repair">🔨 Repair</SelectItem>
                        <SelectItem value="inspection">
                          🔍 Inspection
                        </SelectItem>
                        <SelectItem value="other">📋 Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority Level</Label>
                    <Select
                      value={data.priority || "medium"}
                      onValueChange={(value: any) =>
                        onChange({ priority: value })
                      }
                    >
                      <SelectTrigger id="priority">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">
                          <span className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-blue-50">
                              Low
                            </Badge>
                          </span>
                        </SelectItem>
                        <SelectItem value="medium">
                          <span className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-yellow-50">
                              Medium
                            </Badge>
                          </span>
                        </SelectItem>
                        <SelectItem value="high">
                          <span className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-orange-50">
                              High
                            </Badge>
                          </span>
                        </SelectItem>
                        <SelectItem value="urgent">
                          <span className="flex items-center gap-2">
                            <Badge variant="destructive">Urgent</Badge>
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Project & Quote */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in-50">
              <div>
                <h2 className="text-2xl font-bold mb-2">
                  Link Project & Quote
                </h2>
                <p className="text-muted-foreground">
                  Optionally link this work order to an existing project or
                  quote.
                </p>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="project">Project (Optional)</Label>
                  <Combobox
                    options={[
                      { label: "No Project", value: "" },
                      ...projects.map((p) => ({
                        label: p.name,
                        value: p.id,
                      })),
                    ]}
                    value={data.project_id || ""}
                    onValueChange={(value: string) => {
                      onChange({ project_id: value || null });
                    }}
                    placeholder="Select project..."
                    emptyMessage="No projects found"
                    searchPlaceholder="Search projects..."
                  />
                </div>

                {data.project_id && (
                  <div className="animate-in fade-in-50">
                    {(() => {
                      const selectedProject = projects.find(
                        (p) => p.id === data.project_id
                      );
                      if (!selectedProject) return null;

                      return (
                        <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg">
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-white rounded-lg">
                              <FolderKanban className="h-5 w-5 text-blue-600" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-blue-900">
                                {selectedProject.name}
                              </h4>
                              {selectedProject.description && (
                                <p className="text-sm text-blue-700 mt-1">
                                  {selectedProject.description}
                                </p>
                              )}
                              <div className="flex items-center gap-2 mt-2">
                                <Badge
                                  variant={
                                    selectedProject.status === "active"
                                      ? "default"
                                      : selectedProject.status === "completed"
                                      ? "secondary"
                                      : "outline"
                                  }
                                  className="text-xs"
                                >
                                  {selectedProject.status}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="quote">Quote (Optional)</Label>
                  <Combobox
                    options={[
                      { label: "No Quote", value: "" },
                      ...quotes.map((q) => ({
                        label: `${q.quote_number} - ${q.title}`,
                        value: q.id,
                      })),
                    ]}
                    value={data.quote_id || ""}
                    onValueChange={(value: string) => {
                      onChange({ quote_id: value || null });
                    }}
                    placeholder="Select quote..."
                    emptyMessage="No quotes available"
                    searchPlaceholder="Search quotes..."
                  />
                </div>

                {data.quote_id && (
                  <div className="animate-in fade-in-50">
                    {(() => {
                      const selectedQuote = quotes.find(
                        (q) => q.id === data.quote_id
                      );
                      if (!selectedQuote) return null;

                      return (
                        <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-lg">
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-white rounded-lg">
                              <FileText className="h-5 w-5 text-purple-600" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-purple-900">
                                {selectedQuote.quote_number}
                              </h4>
                              <p className="text-sm text-purple-700 mt-1">
                                {selectedQuote.title}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge
                                  variant="secondary"
                                  className="text-xs bg-purple-100 text-purple-800"
                                >
                                  {selectedQuote.status}
                                </Badge>
                                <span className="text-sm font-semibold text-purple-900">
                                  ${selectedQuote.total?.toFixed(2) || "0.00"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <p className="text-sm text-slate-700">
                    💡 <strong>Tip:</strong> Linking work orders to projects
                    helps with organization and tracking. You can also link a
                    quote to automatically convert it and associate pricing
                    details. Skip this step if not applicable.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Client & Location */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-in fade-in-50">
              <div>
                <h2 className="text-2xl font-bold mb-2">Client & Location</h2>
                <p className="text-muted-foreground">
                  Select the client and work location for this order.
                </p>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="client">
                    Client <span className="text-red-500">*</span>
                  </Label>
                  <Combobox
                    options={clients.map((c) => ({
                      label: c.name,
                      value: c.id,
                    }))}
                    value={data.client_id || ""}
                    onValueChange={(value: string) => {
                      onChange({ client_id: value, client_location_id: null });
                    }}
                    placeholder="Select client..."
                    emptyMessage="No clients found"
                    searchPlaceholder="Search clients..."
                  />
                </div>

                {data.client_id && (
                  <div className="space-y-2 animate-in fade-in-50">
                    <Label htmlFor="location">Work Location</Label>
                    <Combobox
                      options={locations.map((l) => ({
                        label: l.location_name,
                        value: l.id,
                      }))}
                      value={data.client_location_id || ""}
                      onValueChange={handleLocationChange}
                      placeholder="Select location..."
                      emptyMessage="No locations found"
                      searchPlaceholder="Search locations..."
                    />
                    <p className="text-xs text-muted-foreground">
                      💡 Address will auto-fill when you select a location
                    </p>
                  </div>
                )}

                {data.client_id && (
                  <div className="space-y-4 pt-4 border-t animate-in fade-in-50">
                    <h3 className="font-semibold text-sm">
                      Manual Address (Optional)
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <Label htmlFor="manual_address">Street Address</Label>
                        <Input
                          id="manual_address"
                          placeholder="123 Main St"
                          value={data.manual_address || ""}
                          onChange={(e) =>
                            onChange({ manual_address: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="manual_city">City</Label>
                        <Input
                          id="manual_city"
                          placeholder="City"
                          value={data.manual_city || ""}
                          onChange={(e) =>
                            onChange({ manual_city: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="manual_state">State</Label>
                        <Input
                          id="manual_state"
                          placeholder="State"
                          value={data.manual_state || ""}
                          onChange={(e) =>
                            onChange({ manual_state: e.target.value })
                          }
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 4: Schedule */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-in fade-in-50">
              <div>
                <h2 className="text-2xl font-bold mb-2">Schedule Work</h2>
                <p className="text-muted-foreground">
                  When should this work be performed?
                </p>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="scheduled_date">
                    Scheduled Date <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="scheduled_date"
                    type="date"
                    value={data.scheduled_date || ""}
                    onChange={(e) =>
                      onChange({ scheduled_date: e.target.value })
                    }
                    className="text-lg"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start_time">Start Time</Label>
                    <Input
                      id="start_time"
                      type="time"
                      value={data.scheduled_start_time || ""}
                      onChange={(e) =>
                        onChange({ scheduled_start_time: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end_time">End Time</Label>
                    <Input
                      id="end_time"
                      type="time"
                      value={data.scheduled_end_time || ""}
                      onChange={(e) =>
                        onChange({ scheduled_end_time: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-900">
                    💡 <strong>Tip:</strong> Make sure to coordinate with the
                    client and technicians before setting the schedule.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Technicians */}
          {currentStep === 5 && (
            <div className="space-y-6 animate-in fade-in-50">
              <div>
                <h2 className="text-2xl font-bold mb-2">Assign Team</h2>
                <p className="text-muted-foreground">
                  Who will perform this work order?
                </p>
              </div>

              <Separator />

              <div className="space-y-4">
                {/* Technician Selection */}
                <div className="space-y-3">
                  {selectedTechnicians.map((selected, index) => {
                    const tech = technicians.find(
                      (t) => t.id === selected.technician_id
                    );
                    if (!tech) return null;

                    return (
                      <div
                        key={index}
                        className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg border"
                      >
                        <Avatar>
                          <AvatarImage src={tech.photo_url || undefined} />
                          <AvatarFallback>
                            {tech.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-semibold">{tech.name}</p>
                          <Input
                            placeholder="Role (e.g., Lead Technician)"
                            value={selected.role || ""}
                            onChange={(e) => {
                              const updated = [...selectedTechnicians];
                              updated[index].role = e.target.value;
                              setSelectedTechnicians(updated);
                              onTechniciansChange(updated);
                            }}
                            className="mt-2 text-sm"
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            const updated = selectedTechnicians.filter(
                              (_, i) => i !== index
                            );
                            setSelectedTechnicians(updated);
                            onTechniciansChange(updated);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    );
                  })}

                  {/* Add Technician */}
                  <Combobox
                    options={technicians
                      .filter(
                        (t) =>
                          !selectedTechnicians.some(
                            (st) => st.technician_id === t.id
                          )
                      )
                      .map((t) => ({
                        label: t.name,
                        value: t.id,
                      }))}
                    value=""
                    onValueChange={(value: string) => {
                      const updated = [
                        ...selectedTechnicians,
                        { technician_id: value, role: "" },
                      ];
                      setSelectedTechnicians(updated);
                      onTechniciansChange(updated);
                    }}
                    placeholder="➕ Add technician..."
                    emptyMessage="No more technicians available"
                  />
                </div>

                {selectedTechnicians.length === 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <p className="text-sm text-amber-900">
                      ⚠️ At least one technician should be assigned to this work
                      order.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 6: Materials */}
          {currentStep === 6 && (
            <div className="space-y-6 animate-in fade-in-50">
              <div>
                <h2 className="text-2xl font-bold mb-2">Materials & Parts</h2>
                <p className="text-muted-foreground">
                  What materials are needed? (Optional)
                </p>
              </div>

              <Separator />

              <div className="space-y-4">
                {/* Materials List */}
                <div className="space-y-3">
                  {selectedMaterials.map((selected, index) => {
                    const mat = materials.find(
                      (m) => m.id === selected.material_id
                    );
                    if (!mat) return null;

                    return (
                      <div
                        key={index}
                        className="p-4 bg-slate-50 rounded-lg border space-y-3"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold">{mat.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {mat.sku && `SKU: ${mat.sku}`}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              const updated = selectedMaterials.filter(
                                (_, i) => i !== index
                              );
                              setSelectedMaterials(updated);
                              onMaterialsChange(updated);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs">Quantity</Label>
                            <Input
                              type="number"
                              min="1"
                              value={selected.quantity}
                              onChange={(e) => {
                                const updated = [...selectedMaterials];
                                updated[index].quantity =
                                  parseInt(e.target.value) || 1;
                                setSelectedMaterials(updated);
                                onMaterialsChange(updated);
                              }}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Unit</Label>
                            <Input
                              value={mat.unit_of_measure}
                              disabled
                              className="mt-1 bg-muted"
                            />
                          </div>
                        </div>

                        <div>
                          <Label className="text-xs">Notes</Label>
                          <Textarea
                            placeholder="Additional notes..."
                            value={selected.notes || ""}
                            onChange={(e) => {
                              const updated = [...selectedMaterials];
                              updated[index].notes = e.target.value;
                              setSelectedMaterials(updated);
                              onMaterialsChange(updated);
                            }}
                            rows={2}
                            className="mt-1"
                          />
                        </div>
                      </div>
                    );
                  })}

                  {/* Add Material */}
                  <Combobox
                    options={materials
                      .filter(
                        (m) =>
                          !selectedMaterials.some(
                            (sm) => sm.material_id === m.id
                          )
                      )
                      .map((m) => ({
                        label: `${m.name} ${m.sku ? `(${m.sku})` : ""}`,
                        value: m.id,
                      }))}
                    value=""
                    onValueChange={(value: string) => {
                      const updated = [
                        ...selectedMaterials,
                        { material_id: value, quantity: 1, notes: "" },
                      ];
                      setSelectedMaterials(updated);
                      onMaterialsChange(updated);
                    }}
                    placeholder="➕ Add material..."
                    emptyMessage="No more materials available"
                  />
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <p className="text-sm text-slate-700">
                    💡 <strong>Note:</strong> Materials can be added later if
                    needed. Click "Create Work Order" to finish.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-4">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 1 || isSaving}
          size="lg"
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Step {currentStep} of {steps.length}
          </span>
        </div>

        <Button
          onClick={handleNext}
          disabled={!canProceed || isSaving}
          size="lg"
          className="min-w-[140px]"
        >
          {currentStep === steps.length ? (
            <>
              <Check className="mr-2 h-4 w-4" />
              Create Order
            </>
          ) : (
            <>
              Next
              <ChevronRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>

      {/* Progress Indicator */}
      <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
        <div
          className="bg-primary h-full transition-all duration-300"
          style={{ width: `${(currentStep / steps.length) * 100}%` }}
        />
      </div>
    </div>
  );
}
