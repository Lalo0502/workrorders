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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Edit,
  Play,
  CheckCircle,
  XCircle,
  Calendar,
  MapPin,
  Users,
  Package,
  Clock,
  FileText,
  Loader2,
  Camera,
  Eye,
  PenTool,
  RotateCcw,
  Download,
  Building2,
  Wrench,
  ChevronDown,
  ChevronUp,
  History,
  X,
  Plus,
  Link as LinkIcon,
} from "lucide-react";
import Link from "next/link";
import {
  WorkOrder,
  Client,
  ClientLocation,
  Technician,
  Material,
} from "@/types";
import {
  getWorkOrderByNumber,
  getWorkOrderTechniciansWithDetails,
  getWorkOrderMaterialsWithDetails,
  startWorkOrder,
  cancelWorkOrder,
  reopenWorkOrder,
  updateWorkOrder,
} from "@/lib/supabase/workorders";
import { getClientById } from "@/lib/supabase/clients";
import { getClientLocationById } from "@/lib/supabase/client-locations";
import { getQuoteByWorkOrderId } from "@/lib/supabase/quotes";
import { useToast } from "@/hooks/use-toast";
import { WorkOrderHistory } from "@/components/workorders/work-order-history";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CancelWorkOrderDialog } from "@/components/workorders/cancel-work-order-dialog";
import { ReopenWorkOrderDialog } from "@/components/workorders/reopen-work-order-dialog";
import { AssociateQuoteDialog } from "@/components/workorders/associate-quote-dialog";
import { generateWorkOrderPDF } from "@/lib/pdf/work-order-pdf";
import { EditableWorkOrderView } from "@/components/workorders/editable-workorder-view";
import { logWorkOrderUpdate } from "@/lib/supabase/work-order-changes";
import { supabase } from "@/lib/supabase/client";

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
  material_id: string;
  quantity: number;
  notes?: string;
  materials?: Material;
}

const statusConfig = {
  draft: {
    label: "Draft",
    color: "bg-gray-500",
    icon: FileText,
  },
  scheduled: {
    label: "Scheduled",
    color: "bg-blue-500",
    icon: Calendar,
  },
  in_progress: {
    label: "In Progress",
    color: "bg-yellow-500",
    icon: Play,
  },
  on_hold: {
    label: "On Hold",
    color: "bg-purple-500",
    icon: Clock,
  },
  completed: {
    label: "Completed",
    color: "bg-green-500",
    icon: CheckCircle,
  },
  cancelled: {
    label: "Cancelled",
    color: "bg-red-500",
    icon: XCircle,
  },
};

const priorityConfig = {
  low: { label: "Low", color: "bg-blue-100 text-blue-800" },
  medium: { label: "Medium", color: "bg-yellow-100 text-yellow-800" },
  high: { label: "High", color: "bg-orange-100 text-orange-800" },
  urgent: { label: "Urgent", color: "bg-red-100 text-red-800" },
};

export default function WorkOrderDetailPage({ params }: PageProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [location, setLocation] = useState<ClientLocation | null>(null);
  const [technicians, setTechnicians] = useState<WorkOrderTechnician[]>([]);
  const [materials, setMaterials] = useState<WorkOrderMaterial[]>([]);
  const [associatedQuote, setAssociatedQuote] = useState<any>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showReopenDialog, setShowReopenDialog] = useState(false);
  const [showAssociateQuoteDialog, setShowAssociateQuoteDialog] =
    useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [historyRefreshTrigger, setHistoryRefreshTrigger] = useState(0);
  const [showChangeHistory, setShowChangeHistory] = useState(false);

  useEffect(() => {
    loadWorkOrderData();
  }, [params.wo_number]);

  const loadWorkOrderData = async () => {
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
      setWorkOrder(wo);

      // Load client
      if (wo.client_id) {
        const clientData = await getClientById(wo.client_id);
        setClient(clientData);
      }

      // Load location
      if (wo.client_location_id) {
        const locationData = await getClientLocationById(wo.client_location_id);
        setLocation(locationData);
      }

      // Load technicians with details
      try {
        const techData = await getWorkOrderTechniciansWithDetails(wo.id);
        setTechnicians(techData);
      } catch (error) {
        console.error("Error loading technicians:", error);
        setTechnicians([]);
      }

      // Load materials with details
      try {
        const matData = await getWorkOrderMaterialsWithDetails(wo.id);
        setMaterials(matData);
      } catch (error) {
        console.error("Error loading materials:", error);
        setMaterials([]);
      }

      // Load associated quote if exists
      try {
        const quote = await getQuoteByWorkOrderId(wo.id);
        setAssociatedQuote(quote);
      } catch (error) {
        console.error("Error loading associated quote:", error);
        setAssociatedQuote(null);
      }

      // Parse photos if they are JSON strings
      if (wo.photos_before && typeof wo.photos_before === "string") {
        try {
          wo.photos_before = JSON.parse(wo.photos_before);
        } catch (e) {
          console.error("Error parsing photos_before:", e);
          wo.photos_before = [];
        }
      }

      if (wo.photos_after && typeof wo.photos_after === "string") {
        try {
          wo.photos_after = JSON.parse(wo.photos_after);
        } catch (e) {
          console.error("Error parsing photos_after:", e);
          wo.photos_after = [];
        }
      }
    } catch (error) {
      console.error("Error loading work order:", error);
      toast({
        title: "Error",
        description: "Failed to load work order details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStartWork = async () => {
    if (!workOrder) return;

    try {
      setIsTransitioning(true);
      await startWorkOrder(workOrder.id);
      toast({
        title: "Work Started",
        description: "Work order status changed to In Progress",
      });

      // Actualizar solo el estado local
      setWorkOrder((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          status: "in_progress",
          actual_start_date: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      });

      // Refrescar historial
      setHistoryRefreshTrigger((prev) => prev + 1);
    } catch (error) {
      console.error("Error starting work:", error);
      toast({
        title: "Error",
        description: "Failed to start work order",
        variant: "destructive",
      });
    } finally {
      setIsTransitioning(false);
    }
  };

  const handleCompleteWork = () => {
    // Navigate to execution page
    router.push(`/dashboard/workorders/${params.wo_number}/execute`);
  };

  const handleCancelWork = () => {
    setShowCancelDialog(true);
  };

  const handleConfirmCancel = async (reason: string) => {
    if (!workOrder) return;

    try {
      await cancelWorkOrder(workOrder.id, reason);
      toast({
        title: "Work Order Cancelled",
        description: "The work order has been cancelled",
      });

      // Actualizar solo el estado local
      setWorkOrder((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          status: "cancelled",
          updated_at: new Date().toISOString(),
        };
      });

      // Refrescar historial
      setHistoryRefreshTrigger((prev) => prev + 1);
    } catch (error) {
      console.error("Error cancelling work:", error);
      toast({
        title: "Error",
        description: "Failed to cancel work order",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleEditWork = () => {
    // Ya no navegamos a edit page, editamos inline
    // Esta función ya no es necesaria pero la dejamos para no romper código existente
  };

  const handleUpdateWorkOrder = async (data: {
    workOrderData: Partial<WorkOrder>;
    technicians?: Array<{ technician_id: string; role?: string }>;
    materials?: Array<{
      material_id: string;
      quantity: number;
      notes?: string;
    }>;
  }) => {
    if (!workOrder) return;

    try {
      // Guardar estado anterior para el audit log
      const oldData = { ...workOrder };

      // Actualizar work order
      await updateWorkOrder(workOrder.id, data.workOrderData);

      // Registrar cambios en el historial
      await logWorkOrderUpdate(workOrder.id, oldData, data.workOrderData);

      // Si hay technicians, actualizar
      if (data.technicians !== undefined) {
        const { data: existingTechs } = await supabase
          .from("work_order_technicians")
          .select("*")
          .eq("work_order_id", workOrder.id);

        // Eliminar technicians existentes
        await supabase
          .from("work_order_technicians")
          .delete()
          .eq("work_order_id", workOrder.id);

        // Insertar nuevos technicians (solo los que tienen technician_id)
        const validTechs = data.technicians.filter((t) => t.technician_id);
        if (validTechs.length > 0) {
          await supabase.from("work_order_technicians").insert(
            validTechs.map((t) => ({
              work_order_id: workOrder.id,
              technician_id: t.technician_id,
              role: t.role || null,
            }))
          );
        }
      }

      // Si hay materials, actualizar
      if (data.materials !== undefined) {
        // Eliminar materials existentes
        await supabase
          .from("work_order_materials")
          .delete()
          .eq("work_order_id", workOrder.id);

        // Insertar nuevos materials (solo los que tienen material_id y quantity > 0)
        const validMats = data.materials.filter(
          (m) => m.material_id && m.quantity > 0
        );
        if (validMats.length > 0) {
          await supabase.from("work_order_materials").insert(
            validMats.map((m) => ({
              work_order_id: workOrder.id,
              material_id: m.material_id,
              quantity: m.quantity,
              notes: m.notes || null,
            }))
          );
        }
      }

      toast({
        title: "Changes Saved! ✅",
        description: "Work order has been updated successfully",
      });

      // Actualizar estado local del work order con los nuevos datos
      setWorkOrder((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          ...data.workOrderData,
          updated_at: new Date().toISOString(),
        };
      });

      // Si se actualizaron los technicians, recargar solo esos datos
      if (data.technicians !== undefined) {
        const techData = await getWorkOrderTechniciansWithDetails(workOrder.id);
        setTechnicians(techData);
      }

      // Si se actualizaron los materials, recargar solo esos datos
      if (data.materials !== undefined) {
        const matData = await getWorkOrderMaterialsWithDetails(workOrder.id);
        setMaterials(matData);
      }

      // Refrescar solo el historial de cambios
      setHistoryRefreshTrigger((prev) => prev + 1);
    } catch (error) {
      console.error("Error updating work order:", error);
      toast({
        title: "Error",
        description: "Failed to update work order",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleReopenWork = () => {
    setShowReopenDialog(true);
  };

  const handleDownloadPDF = async () => {
    if (!workOrder) return;

    try {
      await generateWorkOrderPDF({
        workOrder,
        client,
        location,
        technicians: technicians as any,
        materials: materials as any,
      });

      toast({
        title: "PDF Generated",
        description: "The PDF has been downloaded successfully",
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleConfirmReopen = async (clearEvidence: boolean) => {
    if (!workOrder) return;

    try {
      await reopenWorkOrder(workOrder.id, clearEvidence);
      toast({
        title: "Work Order Reopened",
        description: clearEvidence
          ? "The work order has been reopened. Previous evidence was cleared."
          : "The work order has been reopened. Previous evidence was kept.",
      });

      // Actualizar solo el estado local
      setWorkOrder((prev) => {
        if (!prev) return prev;
        const updated: WorkOrder = {
          ...prev,
          status: "scheduled",
          updated_at: new Date().toISOString(),
        };

        // Si se limpia evidencia, limpiar fotos y fechas
        if (clearEvidence) {
          updated.photos_before = [];
          updated.photos_after = [];
          updated.actual_start_date = null;
          updated.actual_end_date = null;
        }

        return updated;
      });

      // Refrescar historial
      setHistoryRefreshTrigger((prev) => prev + 1);
    } catch (error) {
      console.error("Error reopening work:", error);
      toast({
        title: "Error",
        description: "Failed to reopen work order",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleUnlinkQuote = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (
      !confirm(
        "Are you sure you want to unlink this quote from the work order?"
      )
    ) {
      return;
    }

    try {
      // Update work order to remove quote_id
      const { error } = await supabase
        .from("work_orders")
        .update({ quote_id: null } as any)
        .eq("id", workOrder!.id);

      if (error) throw error;

      // Update quote status back to approved
      await supabase
        .from("quotes")
        .update({ status: "approved" } as any)
        .eq("id", associatedQuote.id);

      toast({
        title: "Quote Unlinked",
        description: "Quote has been unlinked from this work order",
      });

      loadWorkOrderData(); // Reload to update UI
    } catch (error) {
      console.error("Error unlinking quote:", error);
      toast({
        title: "Error",
        description: "Failed to unlink quote",
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

  const status = statusConfig[workOrder.status];
  const StatusIcon = status.icon;
  const priority = priorityConfig[workOrder.priority];

  return (
    <div className="container mx-auto p-6 space-y-6 scrollbar-hide">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/workorders">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{workOrder.wo_number}</h1>
              <Badge className={status.color}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {status.label}
              </Badge>
              <Badge className={priority.color}>{priority.label}</Badge>
            </div>
            <p className="text-muted-foreground mt-1">{workOrder.title}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Download PDF Button - Always visible */}
          <Button variant="outline" size="icon" onClick={handleDownloadPDF}>
            <Download className="h-4 w-4" />
          </Button>

          {workOrder.status === "scheduled" && (
            <Button
              size="icon"
              onClick={handleStartWork}
              disabled={isTransitioning}
            >
              {isTransitioning ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>
          )}

          {workOrder.status === "in_progress" && (
            <Button size="icon" onClick={handleCompleteWork}>
              <CheckCircle className="h-4 w-4" />
            </Button>
          )}

          {(workOrder.status === "draft" ||
            workOrder.status === "scheduled" ||
            workOrder.status === "in_progress") && (
            <Button
              variant="destructive"
              size="icon"
              onClick={handleCancelWork}
            >
              <XCircle className="h-4 w-4" />
            </Button>
          )}

          {(workOrder.status === "completed" ||
            workOrder.status === "cancelled") && (
            <Button variant="outline" size="icon" onClick={handleReopenWork}>
              <RotateCcw className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Associated Quote Badges */}
      {!loading && (
        <div className="flex items-center gap-2">
          {associatedQuote ? (
            <Badge
              variant="outline"
              className="cursor-pointer hover:bg-purple-50 border-purple-300 text-purple-700 pr-1"
              onClick={() =>
                router.push(`/dashboard/quotes/${associatedQuote.quote_number}`)
              }
            >
              <FileText className="h-3 w-3 mr-1" />
              {associatedQuote.quote_number}
              <button
                onClick={handleUnlinkQuote}
                className="ml-1 hover:bg-purple-100 rounded-full p-0.5"
                title="Unlink Quote"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ) : (
            <>
              <Badge
                variant="outline"
                className="cursor-pointer hover:bg-green-50 border-green-300 text-green-700"
                onClick={() =>
                  router.push(
                    `/dashboard/quotes/new?from_wo=${workOrder?.id}&client=${workOrder?.client_id}`
                  )
                }
              >
                <Plus className="h-3 w-3 mr-1" />
                Create Quote
              </Badge>
              <Badge
                variant="outline"
                className="cursor-pointer hover:bg-blue-50 border-blue-300 text-blue-700"
                onClick={() => setShowAssociateQuoteDialog(true)}
              >
                <LinkIcon className="h-3 w-3 mr-1" />
                Associate Quote
              </Badge>
            </>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Editable */}
        <div className="lg:col-span-2 space-y-6">
          {/* Editable Work Order Details */}
          <EditableWorkOrderView
            workOrder={workOrder}
            workOrderTechnicians={technicians}
            workOrderMaterials={materials}
            client={client}
            location={location}
            onSave={handleUpdateWorkOrder}
          />

          {/* Work Evidence - Only show if completed */}
          {workOrder.status === "completed" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Work Evidence & Completion
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Technician Notes */}
                {workOrder.technician_notes && (
                  <div className="space-y-3">
                    <h3 className="font-semibold flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Technician Notes
                    </h3>
                    <div className="bg-muted p-4 rounded-lg">
                      <p className="text-sm whitespace-pre-wrap">
                        {workOrder.technician_notes}
                      </p>
                    </div>
                  </div>
                )}

                {!workOrder.technician_notes && (
                  <div className="space-y-3">
                    <h3 className="font-semibold flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Technician Notes
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      No notes provided
                    </p>
                  </div>
                )}

                <Separator />

                {/* Photos Before & After - Side by side */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Photos Before */}
                  <div className="space-y-3">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Camera className="h-4 w-4" />
                      Before
                    </h3>
                    {workOrder.photos_before &&
                    workOrder.photos_before.length > 0 ? (
                      <div className="grid grid-cols-2 gap-4">
                        {workOrder.photos_before.map((photo, index) => (
                          <a
                            key={index}
                            href={photo}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group relative"
                          >
                            <img
                              src={photo}
                              alt={`Before ${index + 1}`}
                              className="w-full h-32 object-cover rounded-lg border hover:opacity-75 transition-opacity"
                            />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="bg-black/50 rounded-full p-2">
                                <Eye className="h-4 w-4 text-white" />
                              </div>
                            </div>
                          </a>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No photos available
                      </p>
                    )}
                  </div>

                  {/* Photos After */}
                  <div className="space-y-3">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Camera className="h-4 w-4" />
                      After
                    </h3>
                    {workOrder.photos_after &&
                    workOrder.photos_after.length > 0 ? (
                      <div className="grid grid-cols-2 gap-4">
                        {workOrder.photos_after.map((photo, index) => (
                          <a
                            key={index}
                            href={photo}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group relative"
                          >
                            <img
                              src={photo}
                              alt={`After ${index + 1}`}
                              className="w-full h-32 object-cover rounded-lg border hover:opacity-75 transition-opacity"
                            />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="bg-black/50 rounded-full p-2">
                                <Eye className="h-4 w-4 text-white" />
                              </div>
                            </div>
                          </a>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No photos available
                      </p>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Client Signature */}
                {workOrder.client_signature && (
                  <div className="space-y-3">
                    <h3 className="font-semibold flex items-center gap-2">
                      <PenTool className="h-4 w-4" />
                      Client Signature
                    </h3>
                    <div className="border rounded-lg p-4 bg-white">
                      <img
                        src={workOrder.client_signature}
                        alt="Client Signature"
                        className="h-24 mx-auto"
                      />
                      {workOrder.client_signature_name && (
                        <p className="text-center text-sm font-medium mt-2">
                          {workOrder.client_signature_name}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Schedule Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Schedule
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Wrench className="h-3.5 w-3.5" />
                  Work Type
                </Label>
                <div className="flex items-center gap-2 h-9 px-3 rounded-lg bg-muted/50">
                  <p className="font-medium text-sm capitalize">
                    {workOrder.work_type.replace("_", " ")}
                  </p>
                </div>
              </div>

              {workOrder.scheduled_date && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    Scheduled Date
                  </Label>
                  <div className="flex items-center gap-2 min-h-[2.25rem] px-3 rounded-lg bg-muted/50">
                    <p className="font-medium text-sm">
                      {new Date(workOrder.scheduled_date).toLocaleDateString(
                        "en-US",
                        {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        }
                      )}
                    </p>
                  </div>
                </div>
              )}

              {(workOrder.scheduled_start_time ||
                workOrder.scheduled_end_time) && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    Time Window
                  </Label>
                  <div className="flex items-center gap-2 h-9 px-3 rounded-lg bg-muted/50">
                    <p className="font-medium text-sm">
                      {workOrder.scheduled_start_time || "??"}
                      {" - "}
                      {workOrder.scheduled_end_time || "??"}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Project Info - Show if assigned to a project */}
          {(workOrder as any).projects && (
            <Card>
              <CardContent className="pt-6 space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5" />
                      Project Name
                    </Label>
                    {(workOrder as any).projects.status && (
                      <Badge variant="outline" className="capitalize text-xs">
                        {(workOrder as any).projects.status}
                      </Badge>
                    )}
                  </div>
                  <Link
                    href={`/dashboard/projects/${
                      (workOrder as any).projects.id
                    }`}
                    className="flex items-center gap-2 min-h-[2.25rem] px-3 rounded-lg bg-primary/5 hover:bg-primary/10 transition-colors border border-primary/20"
                  >
                    <span className="font-medium text-sm text-primary">
                      {(workOrder as any).projects.name}
                    </span>
                  </Link>
                </div>
                {(workOrder as any).projects.description && (
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5" />
                      Description
                    </Label>
                    <div className="min-h-[2.25rem] px-3 py-2 rounded-lg bg-muted/50">
                      <p className="text-sm">
                        {(workOrder as any).projects.description}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="rounded-full bg-primary p-1">
                      <CheckCircle className="h-3 w-3 text-primary-foreground" />
                    </div>
                    <div className="w-px h-full bg-border mt-1" />
                  </div>
                  <div className="pb-4">
                    <p className="font-medium">Created</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(workOrder.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>

                {workOrder.actual_start_date && (
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="rounded-full bg-primary p-1">
                        <Play className="h-3 w-3 text-primary-foreground" />
                      </div>
                      <div className="w-px h-full bg-border mt-1" />
                    </div>
                    <div className="pb-4">
                      <p className="font-medium">Started</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(workOrder.actual_start_date).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}

                {workOrder.actual_end_date && (
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="rounded-full bg-primary p-1">
                        <CheckCircle className="h-3 w-3 text-primary-foreground" />
                      </div>
                    </div>
                    <div>
                      <p className="font-medium">Completed</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(workOrder.actual_end_date).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Meta Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  Created
                </Label>
                <div className="flex items-center gap-2 min-h-[2.25rem] px-3 rounded-lg bg-muted/50">
                  <p className="font-medium text-sm">
                    {new Date(workOrder.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  Last Updated
                </Label>
                <div className="flex items-center gap-2 min-h-[2.25rem] px-3 rounded-lg bg-muted/50">
                  <p className="font-medium text-sm">
                    {new Date(workOrder.updated_at).toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Change History - Collapsible */}
          <Card>
            <CardHeader
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => setShowChangeHistory(!showChangeHistory)}
            >
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Change History
                </div>
                {showChangeHistory ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </CardTitle>
            </CardHeader>
            {showChangeHistory && (
              <CardContent className="max-h-[500px] overflow-y-auto pt-0 scrollbar-hide">
                <WorkOrderHistory
                  workOrderId={workOrder.id}
                  refreshTrigger={historyRefreshTrigger}
                  compact={true}
                />
              </CardContent>
            )}
          </Card>
        </div>
      </div>

      {/* Cancel Dialog */}
      <CancelWorkOrderDialog
        open={showCancelDialog}
        onOpenChange={setShowCancelDialog}
        onConfirm={handleConfirmCancel}
        workOrderNumber={workOrder.wo_number}
      />

      {/* Reopen Dialog */}
      <ReopenWorkOrderDialog
        open={showReopenDialog}
        onOpenChange={setShowReopenDialog}
        onConfirm={handleConfirmReopen}
        workOrderNumber={workOrder.wo_number}
        hasEvidence={
          !!(
            workOrder.photos_before?.length ||
            workOrder.photos_after?.length ||
            workOrder.technician_notes ||
            workOrder.client_signature
          )
        }
      />

      {/* Associate Quote Dialog */}
      {workOrder && (
        <AssociateQuoteDialog
          open={showAssociateQuoteDialog}
          onOpenChange={setShowAssociateQuoteDialog}
          workOrderId={workOrder.id}
          clientId={workOrder.client_id}
          onSuccess={() => {
            setShowAssociateQuoteDialog(false);
            loadWorkOrderData();
          }}
        />
      )}
    </div>
  );
}
