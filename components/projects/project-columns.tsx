"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Project } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import {
  Pencil,
  Trash,
  FolderKanban,
  Calendar,
  User,
  CheckCircle2,
  Clock,
  Pause,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow, isPast, isFuture } from "date-fns";
import { es } from "date-fns/locale";

interface ProjectColumnsProps {
  onView: (project: any) => void;
  onEdit: (project: any) => void;
  onDelete: (project: any) => void;
}

// Status configuration
const statusConfig: Record<
  string,
  { label: string; color: string; icon: typeof CheckCircle2; variant: any }
> = {
  active: {
    label: "Activo",
    color: "text-green-600",
    icon: Clock,
    variant: "default",
  },
  completed: {
    label: "Completado",
    color: "text-blue-600",
    icon: CheckCircle2,
    variant: "secondary",
  },
  on_hold: {
    label: "En Espera",
    color: "text-yellow-600",
    icon: Pause,
    variant: "outline",
  },
  cancelled: {
    label: "Cancelado",
    color: "text-red-600",
    icon: XCircle,
    variant: "destructive",
  },
};

// Format relative date
const formatRelativeDate = (dateString: string | null | undefined) => {
  if (!dateString) return null;

  const date = new Date(dateString);
  const now = new Date();

  // If date is in the past
  if (isPast(date) && date.toDateString() !== now.toDateString()) {
    return {
      text: `Hace ${formatDistanceToNow(date, { locale: es })}`,
      isPast: true,
    };
  }

  // If date is in the future
  if (isFuture(date)) {
    return {
      text: `En ${formatDistanceToNow(date, { locale: es })}`,
      isPast: false,
    };
  }

  return {
    text: "Hoy",
    isPast: false,
  };
};

export const createProjectColumns = ({
  onView,
  onEdit,
  onDelete,
}: ProjectColumnsProps): ColumnDef<any>[] => [
  {
    accessorKey: "name",
    header: "Proyecto",
    cell: ({ row }) => {
      const project = row.original;
      return (
        <button
          onClick={() => onView(project)}
          className="flex items-start gap-3 text-left hover:opacity-80 transition-opacity w-full group"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50">
            <FolderKanban className="h-5 w-5 text-purple-600" />
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="font-semibold group-hover:underline">
              {project.name}
            </span>
            {project.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 max-w-[300px]">
                {project.description}
              </p>
            )}
          </div>
        </button>
      );
    },
  },
  {
    accessorKey: "client_id",
    header: "Cliente",
    cell: ({ row }) => {
      const project = row.original;
      const client = project.clients;

      if (!client) {
        return (
          <span className="text-xs text-muted-foreground italic">
            Sin cliente
          </span>
        );
      }

      return (
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
            <User className="h-4 w-4 text-blue-600" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium">{client.name}</span>
            {client.email && (
              <span className="text-xs text-muted-foreground">
                {client.email}
              </span>
            )}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Estado",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      const config = statusConfig[status] || statusConfig.active;
      const StatusIcon = config.icon;

      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className={cn(
                  "inline-flex items-center gap-2 px-3 py-1.5 rounded-full cursor-default",
                  status === "active" &&
                    "bg-green-50 text-green-700 border border-green-200",
                  status === "completed" &&
                    "bg-blue-50 text-blue-700 border border-blue-200",
                  status === "on_hold" &&
                    "bg-yellow-50 text-yellow-700 border border-yellow-200",
                  status === "cancelled" &&
                    "bg-red-50 text-red-700 border border-red-200"
                )}
              >
                <StatusIcon className="h-3.5 w-3.5" />
                <span className="text-xs font-medium">{config.label}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Estado del proyecto</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    },
  },
  {
    accessorKey: "start_date",
    header: "Fechas",
    cell: ({ row }) => {
      const project = row.original;
      const startDate = project.start_date;
      const endDate = project.end_date;
      const estimatedDate = project.estimated_completion_date;

      if (!startDate && !endDate && !estimatedDate) {
        return (
          <span className="text-xs text-muted-foreground italic">
            Sin fechas
          </span>
        );
      }

      const startRelative = formatRelativeDate(startDate);
      const endRelative = formatRelativeDate(endDate || estimatedDate);

      return (
        <div className="flex flex-col gap-1">
          {startDate && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1.5 text-xs">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">Inicio:</span>
                    <span className="font-medium">{startRelative?.text}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{format(new Date(startDate), "PPP", { locale: es })}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {(endDate || estimatedDate) && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1.5 text-xs">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {endDate ? "Fin:" : "Est:"}
                    </span>
                    <span
                      className={cn(
                        "font-medium",
                        endRelative?.isPast && "text-red-600"
                      )}
                    >
                      {endRelative?.text}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {format(new Date(endDate || estimatedDate!), "PPP", {
                      locale: es,
                    })}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      );
    },
  },
  {
    id: "actions",
    header: "Acciones",
    cell: ({ row }) => {
      const project = row.original;

      return (
        <div className="flex items-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onEdit(project)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Editar</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => onDelete(project)}
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Eliminar</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      );
    },
  },
];
