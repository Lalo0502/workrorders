"use client";

import { Badge } from "@/components/ui/badge";
import { FolderIcon, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ProjectRowProps {
  project: any;
  onOpen: (project: any) => void;
  onEdit: (project: any) => void;
  onDelete: (project: any) => void;
  workOrderCount?: number;
}

const statusConfig = {
  active: {
    label: "Activo",
    color: "text-green-600",
    dotColor: "bg-green-500",
  },
  completed: {
    label: "Completado",
    color: "text-blue-600",
    dotColor: "bg-blue-500",
  },
  on_hold: {
    label: "En Espera",
    color: "text-yellow-600",
    dotColor: "bg-yellow-500",
  },
  cancelled: {
    label: "Cancelado",
    color: "text-red-600",
    dotColor: "bg-red-500",
  },
};

const folderColors = {
  active: "text-yellow-500",
  completed: "text-blue-500",
  on_hold: "text-orange-500",
  cancelled: "text-gray-400",
};

export function ProjectRow({
  project,
  onOpen,
  onEdit,
  onDelete,
  workOrderCount = 0,
}: ProjectRowProps) {
  const status =
    statusConfig[project.status as keyof typeof statusConfig] ||
    statusConfig.active;

  const folderColor =
    folderColors[project.status as keyof typeof folderColors] ||
    folderColors.active;

  const getRelativeDate = () => {
    if (project.start_date) {
      return formatDistanceToNow(new Date(project.start_date), {
        addSuffix: true,
        locale: es,
      });
    }
    if (project.created_at) {
      return formatDistanceToNow(new Date(project.created_at), {
        addSuffix: true,
        locale: es,
      });
    }
    return "-";
  };

  return (
    <div
      className="group flex items-center gap-4 px-4 py-2.5 hover:bg-accent/50 cursor-pointer border-b border-border/40 transition-colors"
      onClick={() => onOpen(project)}
    >
      {/* Folder Icon */}
      <div className="flex-shrink-0">
        <FolderIcon className={cn("h-8 w-8", folderColor)} />
      </div>

      {/* Project Name & Description */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-sm truncate">{project.name}</h3>
          <div
            className={cn(
              "h-2 w-2 rounded-full flex-shrink-0",
              status.dotColor
            )}
          />
        </div>
        {project.description && (
          <p className="text-xs text-muted-foreground truncate">
            {project.description}
          </p>
        )}
      </div>

      {/* Client */}
      <div className="hidden md:flex flex-col items-start w-40 flex-shrink-0">
        <span className="text-xs text-muted-foreground">Cliente</span>
        <span className="text-sm truncate w-full">
          {project.clients?.name || "-"}
        </span>
      </div>

      {/* Work Orders Count */}
      <div className="hidden lg:flex flex-col items-center w-24 flex-shrink-0">
        <span className="text-xs text-muted-foreground">Items</span>
        <Badge variant="secondary" className="text-xs">
          {workOrderCount} WOs
        </Badge>
      </div>

      {/* Date Modified */}
      <div className="hidden xl:flex flex-col items-end w-32 flex-shrink-0">
        <span className="text-xs text-muted-foreground">Modificado</span>
        <span className="text-xs">{getRelativeDate()}</span>
      </div>

      {/* Status */}
      <div className="hidden sm:flex flex-col items-end w-28 flex-shrink-0">
        <span className="text-xs text-muted-foreground">Estado</span>
        <span className={cn("text-xs font-medium", status.color)}>
          {status.label}
        </span>
      </div>

      {/* Actions */}
      <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onOpen(project);
              }}
            >
              <FolderIcon className="h-4 w-4 mr-2" />
              Abrir
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onEdit(project);
              }}
            >
              <Pencil className="h-4 w-4 mr-2" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onDelete(project);
              }}
              className="text-red-600"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
