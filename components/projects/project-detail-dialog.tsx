"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getProjectWorkOrders } from "@/lib/supabase/projects";
import {
  Calendar,
  User,
  Clock,
  CheckCircle2,
  Pause,
  XCircle,
  FileText,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";

interface ProjectDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: any | null;
}

const statusConfig = {
  active: {
    label: "Activo",
    color: "bg-green-100 text-green-800",
    icon: Clock,
  },
  completed: {
    label: "Completado",
    color: "bg-blue-100 text-blue-800",
    icon: CheckCircle2,
  },
  on_hold: {
    label: "En Espera",
    color: "bg-yellow-100 text-yellow-800",
    icon: Pause,
  },
  cancelled: {
    label: "Cancelado",
    color: "bg-red-100 text-red-800",
    icon: XCircle,
  },
};

const workOrderStatusConfig = {
  pending: { label: "Pendiente", color: "bg-yellow-100 text-yellow-800" },
  in_progress: { label: "En Progreso", color: "bg-blue-100 text-blue-800" },
  completed: { label: "Completado", color: "bg-green-100 text-green-800" },
  cancelled: { label: "Cancelado", color: "bg-red-100 text-red-800" },
};

export function ProjectDetailDialog({
  open,
  onOpenChange,
  project,
}: ProjectDetailDialogProps) {
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (project && open) {
      loadWorkOrders();
    }
  }, [project, open]);

  const loadWorkOrders = async () => {
    if (!project) return;

    try {
      setLoading(true);
      const data = await getProjectWorkOrders(project.id);
      setWorkOrders(data);
    } catch (error) {
      console.error("Error loading work orders:", error);
      toast.error("Error al cargar work orders");
    } finally {
      setLoading(false);
    }
  };

  if (!project) return null;

  const StatusIcon =
    statusConfig[project.status as keyof typeof statusConfig]?.icon || Clock;
  const statusInfo =
    statusConfig[project.status as keyof typeof statusConfig] ||
    statusConfig.active;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{project.name}</DialogTitle>
          <DialogDescription>
            Detalles del proyecto y work orders asociadas
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status Badge */}
          <div className="flex items-center gap-2">
            <Badge className={`${statusInfo.color} flex items-center gap-1`}>
              <StatusIcon className="h-3 w-3" />
              {statusInfo.label}
            </Badge>
          </div>

          {/* Project Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Info Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Información General
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {project.description && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Descripción
                    </p>
                    <p className="text-sm">{project.description}</p>
                  </div>
                )}

                {project.clients && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Cliente
                    </p>
                    <p className="text-sm font-medium">
                      {project.clients.name}
                    </p>
                    {project.clients.email && (
                      <p className="text-sm text-muted-foreground">
                        {project.clients.email}
                      </p>
                    )}
                    {project.clients.phone && (
                      <p className="text-sm text-muted-foreground">
                        {project.clients.phone}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Dates Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Fechas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {project.start_date && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Fecha de Inicio
                    </p>
                    <p className="text-sm font-medium">
                      {format(new Date(project.start_date), "PPP", {
                        locale: es,
                      })}
                    </p>
                  </div>
                )}

                {project.end_date && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Fecha de Fin
                    </p>
                    <p className="text-sm font-medium">
                      {format(new Date(project.end_date), "PPP", {
                        locale: es,
                      })}
                    </p>
                  </div>
                )}

                {project.estimated_completion_date && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Fecha Estimada de Finalización
                    </p>
                    <p className="text-sm font-medium">
                      {format(
                        new Date(project.estimated_completion_date),
                        "PPP",
                        {
                          locale: es,
                        }
                      )}
                    </p>
                  </div>
                )}

                {!project.start_date &&
                  !project.end_date &&
                  !project.estimated_completion_date && (
                    <p className="text-sm text-muted-foreground">
                      No hay fechas registradas
                    </p>
                  )}
              </CardContent>
            </Card>
          </div>

          <Separator />

          {/* Work Orders Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                Work Orders Asociadas
                {!loading && (
                  <Badge variant="secondary">{workOrders.length}</Badge>
                )}
              </h3>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : workOrders.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground text-center">
                    No hay work orders asociadas a este proyecto
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {workOrders.map((wo) => {
                  const woStatus =
                    workOrderStatusConfig[
                      wo.status as keyof typeof workOrderStatusConfig
                    ] || workOrderStatusConfig.pending;

                  return (
                    <Card key={wo.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold">{wo.title}</h4>
                              <Badge className={woStatus.color}>
                                {woStatus.label}
                              </Badge>
                            </div>
                            {wo.description && (
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {wo.description}
                              </p>
                            )}
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              {wo.created_at && (
                                <span>
                                  Creado:{" "}
                                  {format(new Date(wo.created_at), "PP", {
                                    locale: es,
                                  })}
                                </span>
                              )}
                              {wo.due_date && (
                                <span>
                                  Vence:{" "}
                                  {format(new Date(wo.due_date), "PP", {
                                    locale: es,
                                  })}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
