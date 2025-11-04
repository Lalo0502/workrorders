"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Calendar,
  User,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  Plus,
  Loader2,
  FolderOpen,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { getProjectWorkOrders } from "@/lib/supabase/projects";
import { toast } from "sonner";

interface ProjectExplorerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: any | null;
}

const workOrderStatusConfig = {
  pending: {
    label: "Pendiente",
    color: "bg-yellow-100 text-yellow-800",
    icon: Clock,
  },
  in_progress: {
    label: "En Progreso",
    color: "bg-blue-100 text-blue-800",
    icon: Clock,
  },
  completed: {
    label: "Completado",
    color: "bg-green-100 text-green-800",
    icon: CheckCircle2,
  },
  cancelled: {
    label: "Cancelado",
    color: "bg-red-100 text-red-800",
    icon: XCircle,
  },
};

export function ProjectExplorerDialog({
  open,
  onOpenChange,
  project,
}: ProjectExplorerDialogProps) {
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header con Breadcrumb */}
        <DialogHeader>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <FolderOpen className="h-4 w-4" />
            <span>Projects</span>
            <span>/</span>
            <span className="text-foreground font-medium">{project.name}</span>
          </div>
          <DialogTitle className="text-2xl flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            {project.name}
          </DialogTitle>
        </DialogHeader>

        {/* Project Info Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4">
          {project.clients && (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Cliente</p>
                <p className="text-sm font-medium">{project.clients.name}</p>
              </div>
            </div>
          )}

          {project.start_date && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Inicio</p>
                <p className="text-sm font-medium">
                  {format(new Date(project.start_date), "PP", { locale: es })}
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Work Orders</p>
              <p className="text-sm font-medium">{workOrders.length}</p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Work Orders Section */}
        <div className="flex-1 overflow-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg">
              Work Orders ({workOrders.length})
            </h3>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Nueva Work Order
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : workOrders.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">
                  No hay work orders en este proyecto
                </p>
                <Button variant="outline" size="sm" className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Primera Work Order
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {workOrders.map((wo) => {
                const statusInfo =
                  workOrderStatusConfig[
                    wo.status as keyof typeof workOrderStatusConfig
                  ] || workOrderStatusConfig.pending;
                const StatusIcon = statusInfo.icon;

                return (
                  <Card
                    key={wo.id}
                    className="hover:shadow-md transition-shadow cursor-pointer group"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        {/* File Icon */}
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>

                        {/* WO Info */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm line-clamp-2 mb-1 group-hover:text-primary transition-colors">
                            {wo.title}
                          </h4>
                          {wo.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                              {wo.description}
                            </p>
                          )}
                          <Badge className={`${statusInfo.color} text-xs`}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusInfo.label}
                          </Badge>
                          {wo.due_date && (
                            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(wo.due_date), "PP", {
                                locale: es,
                              })}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
