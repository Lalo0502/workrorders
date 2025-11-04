"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FolderKanban,
  User,
  Calendar,
  FileText,
  MoreVertical,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface ProjectCardProps {
  project: any;
  onOpen: (project: any) => void;
  onEdit: (project: any) => void;
  onDelete: (project: any) => void;
  workOrderCount?: number;
}

const statusConfig = {
  active: {
    label: "Activo",
    color: "bg-green-500",
    textColor: "text-green-700",
    bgLight: "bg-green-50",
  },
  completed: {
    label: "Completado",
    color: "bg-blue-500",
    textColor: "text-blue-700",
    bgLight: "bg-blue-50",
  },
  on_hold: {
    label: "En Espera",
    color: "bg-yellow-500",
    textColor: "text-yellow-700",
    bgLight: "bg-yellow-50",
  },
  cancelled: {
    label: "Cancelado",
    color: "bg-red-500",
    textColor: "text-red-700",
    bgLight: "bg-red-50",
  },
};

export function ProjectCard({
  project,
  onOpen,
  onEdit,
  onDelete,
  workOrderCount = 0,
}: ProjectCardProps) {
  const status =
    statusConfig[project.status as keyof typeof statusConfig] ||
    statusConfig.active;

  return (
    <Card
      className="group relative hover:shadow-lg transition-all duration-200 cursor-pointer border-2 hover:border-primary/50"
      onClick={() => onOpen(project)}
    >
      <CardContent className="p-6">
        {/* Actions Menu */}
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
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
                <FolderKanban className="h-4 w-4 mr-2" />
                Abrir Proyecto
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(project);
                }}
              >
                <FileText className="h-4 w-4 mr-2" />
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
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Folder Icon */}
        <div className="flex flex-col items-center space-y-4">
          <div
            className={`w-24 h-24 rounded-2xl ${status.bgLight} flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}
          >
            <FolderKanban className={`h-12 w-12 ${status.textColor}`} />
          </div>

          {/* Project Name */}
          <div className="text-center w-full">
            <h3 className="font-semibold text-lg line-clamp-2 mb-1">
              {project.name}
            </h3>
            {project.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {project.description}
              </p>
            )}
          </div>

          {/* Status Badge */}
          <Badge className={`${status.color} text-white`}>{status.label}</Badge>

          {/* Info Grid */}
          <div className="w-full space-y-2 text-sm">
            {/* Client */}
            {project.clients && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{project.clients.name}</span>
              </div>
            )}

            {/* Work Orders Count */}
            <div className="flex items-center gap-2 text-muted-foreground">
              <FileText className="h-4 w-4 flex-shrink-0" />
              <span>
                {workOrderCount}{" "}
                {workOrderCount === 1 ? "Work Order" : "Work Orders"}
              </span>
            </div>

            {/* Date */}
            {project.start_date && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">
                  {format(new Date(project.start_date), "PP", { locale: es })}
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
