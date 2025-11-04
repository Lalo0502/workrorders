"use client";

import { ColumnDef } from "@tanstack/react-table";
import {
  Edit,
  Trash2,
  Clock,
  AlertCircle,
  MapPin,
  Building2,
  Calendar,
  User,
  FileText,
  CheckCircle2,
  XCircle,
  Pause,
  PlayCircle,
  FileEdit,
  Eye,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { WorkOrder } from "@/types";
import { cn } from "@/lib/utils";
import { generateWorkOrderPDF } from "@/lib/pdf/work-order-pdf";
import {
  getWorkOrderMaterialsWithDetails,
  getWorkOrderTechniciansWithDetails,
} from "@/lib/supabase/workorders";
import { getClientById } from "@/lib/supabase/clients";
import { getClientLocationById } from "@/lib/supabase/client-locations";
import { toast } from "sonner";

interface WorkOrderColumnsProps {
  onView: (workOrder: WorkOrder) => void;
  onEdit: (workOrder: WorkOrder) => void;
  onDelete: (workOrder: WorkOrder) => void;
}

const statusConfig = {
  draft: {
    label: "Draft",
    variant: "secondary" as const,
    color: "bg-gray-500",
    textColor: "text-gray-700",
    bgColor: "bg-gray-50",
    icon: FileEdit,
  },
  scheduled: {
    label: "Scheduled",
    variant: "default" as const,
    color: "bg-blue-500",
    textColor: "text-blue-700",
    bgColor: "bg-blue-50",
    icon: Calendar,
  },
  in_progress: {
    label: "In Progress",
    variant: "default" as const,
    color: "bg-yellow-500",
    textColor: "text-yellow-700",
    bgColor: "bg-yellow-50",
    icon: PlayCircle,
  },
  on_hold: {
    label: "On Hold",
    variant: "secondary" as const,
    color: "bg-orange-500",
    textColor: "text-orange-700",
    bgColor: "bg-orange-50",
    icon: Pause,
  },
  completed: {
    label: "Completed",
    variant: "default" as const,
    color: "bg-green-500",
    textColor: "text-green-700",
    bgColor: "bg-green-50",
    icon: CheckCircle2,
  },
  cancelled: {
    label: "Cancelled",
    variant: "destructive" as const,
    color: "bg-red-500",
    textColor: "text-red-700",
    bgColor: "bg-red-50",
    icon: XCircle,
  },
};

const priorityConfig = {
  low: {
    label: "Low",
    variant: "outline" as const,
    color: "text-gray-600",
    bgColor: "bg-gray-100",
    pulse: false,
  },
  medium: {
    label: "Medium",
    variant: "secondary" as const,
    color: "text-blue-600",
    bgColor: "bg-blue-100",
    pulse: false,
  },
  high: {
    label: "High",
    variant: "default" as const,
    color: "text-orange-600",
    bgColor: "bg-orange-100",
    pulse: false,
  },
  urgent: {
    label: "Urgent",
    variant: "destructive" as const,
    color: "text-red-600",
    bgColor: "bg-red-100",
    pulse: true,
  },
};

const workTypeConfig = {
  installation: {
    label: "Installation",
    icon: Building2,
    color: "text-purple-600",
  },
  maintenance: {
    label: "Maintenance",
    icon: Clock,
    color: "text-blue-600",
  },
  repair: { label: "Repair", icon: AlertCircle, color: "text-orange-600" },
  inspection: { label: "Inspection", icon: Eye, color: "text-green-600" },
  other: { label: "Other", icon: FileText, color: "text-gray-600" },
};

// Helper function to get initials from name
const getInitials = (name: string): string => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

// Helper function to format date relative
const formatRelativeDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return `${Math.abs(diffDays)} day${
      Math.abs(diffDays) !== 1 ? "s" : ""
    } ago`;
  } else if (diffDays === 0) {
    return "Today";
  } else if (diffDays === 1) {
    return "Tomorrow";
  } else if (diffDays <= 7) {
    return `In ${diffDays} days`;
  } else {
    return date.toLocaleDateString("en-US", {
      day: "2-digit",
      month: "short",
    });
  }
};

export const createWorkOrderColumns = ({
  onView,
  onEdit,
  onDelete,
}: WorkOrderColumnsProps): ColumnDef<WorkOrder>[] => [
  {
    accessorKey: "wo_number",
    header: "Work Order",
    cell: ({ row }) => {
      const workOrder = row.original;
      const status = workOrder.status as keyof typeof statusConfig;
      const StatusIcon = statusConfig[status].icon;

      return (
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-lg",
              statusConfig[status].bgColor
            )}
          >
            <StatusIcon
              className={cn("h-5 w-5", statusConfig[status].textColor)}
            />
          </div>
          <div className="flex flex-col">
            <Button
              variant="link"
              className="p-0 h-auto font-semibold text-primary text-left"
              onClick={() => onView(workOrder)}
            >
              {workOrder.wo_number}
            </Button>
            <span className="text-xs text-muted-foreground">
              {workOrder.work_type &&
                workTypeConfig[
                  workOrder.work_type as keyof typeof workTypeConfig
                ]?.label}
            </span>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "title",
    header: "Details",
    cell: ({ row }) => {
      const workOrder = row.original;
      return (
        <div className="flex flex-col gap-1 max-w-[350px]">
          <div className="font-medium text-sm line-clamp-1">
            {row.getValue("title")}
          </div>
          {workOrder.description && (
            <div className="text-xs text-muted-foreground line-clamp-2">
              {workOrder.description}
            </div>
          )}
          {workOrder.manual_address && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <MapPin className="h-3 w-3" />
              <span className="line-clamp-1">{workOrder.manual_address}</span>
            </div>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as keyof typeof statusConfig;
      const config = statusConfig[status];
      const StatusIcon = config.icon;

      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className={cn(
                  "inline-flex items-center gap-2 px-3 py-1.5 rounded-full border cursor-default",
                  config.bgColor,
                  "border-transparent"
                )}
              >
                <StatusIcon className={cn("h-3.5 w-3.5", config.textColor)} />
                <span className={cn("text-xs font-medium", config.textColor)}>
                  {config.label}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Status: {config.label}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    },
  },
  {
    accessorKey: "priority",
    header: "Priority",
    cell: ({ row }) => {
      const priority = row.getValue("priority") as keyof typeof priorityConfig;
      const config = priorityConfig[priority];

      return (
        <div className="flex items-center gap-2">
          <Badge
            variant={config.variant}
            className={cn("gap-1.5", config.pulse && "animate-pulse")}
          >
            {priority === "urgent" && <AlertCircle className="h-3 w-3" />}
            {config.label}
          </Badge>
        </div>
      );
    },
  },
  {
    accessorKey: "scheduled_date",
    header: "Schedule",
    cell: ({ row }) => {
      const date = row.getValue("scheduled_date") as string;
      const workOrder = row.original;

      if (!date)
        return (
          <span className="text-xs text-muted-foreground italic">
            Unscheduled
          </span>
        );

      const fullDate = new Date(date).toLocaleDateString("en-US", {
        weekday: "short",
        day: "2-digit",
        month: "short",
        year: "numeric",
      });

      const relativeDate = formatRelativeDate(date);
      const isOverdue =
        new Date(date) < new Date() && workOrder.status !== "completed";

      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex flex-col gap-1">
                <div
                  className={cn(
                    "flex items-center gap-1.5 text-sm font-medium",
                    isOverdue ? "text-red-600" : "text-foreground"
                  )}
                >
                  <Calendar className="h-3.5 w-3.5" />
                  {relativeDate}
                </div>
                {workOrder.scheduled_start_time && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {workOrder.scheduled_start_time}
                  </div>
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{fullDate}</p>
              {workOrder.scheduled_start_time && (
                <p>{workOrder.scheduled_start_time}</p>
              )}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    },
  },
  {
    id: "technicians",
    header: "Technicians",
    cell: ({ row }) => {
      const workOrder = row.original as any;
      const technicians = workOrder.work_order_technicians || [];

      if (technicians.length === 0) {
        return (
          <div className="flex items-center gap-1 text-xs text-muted-foreground italic">
            <User className="h-3 w-3" />
            Unassigned
          </div>
        );
      }

      const displayTechnicians = technicians.slice(0, 3);
      const remaining = technicians.length - 3;

      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1 cursor-default">
                <div className="flex -space-x-2">
                  {displayTechnicians.map((tech: any) => (
                    <Avatar
                      key={tech.id}
                      className="h-8 w-8 border-2 border-background"
                    >
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">
                        {getInitials(tech.technicians?.name || "?")}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                </div>
                {remaining > 0 && (
                  <span className="text-xs text-muted-foreground ml-1">
                    +{remaining}
                  </span>
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <div className="flex flex-col gap-1">
                {technicians.map((tech: any) => (
                  <p key={tech.id} className="text-sm">
                    {tech.technicians?.name || "No name"}
                  </p>
                ))}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    },
  },
  {
    id: "project",
    header: "Project",
    cell: ({ row }) => {
      const workOrder = row.original as any;
      const project = workOrder.projects;

      if (!project) {
        return (
          <div className="flex items-center gap-1 text-xs text-muted-foreground italic">
            <Building2 className="h-3 w-3" />
            No project
          </div>
        );
      }

      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2 cursor-default max-w-[200px]">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
                  <Building2 className="h-4 w-4 text-blue-600" />
                </div>
                <span className="text-sm font-medium truncate">
                  {project.name}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Project: {project.name}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    },
  },
  {
    id: "actions",
    header: () => <div className="text-center">Actions</div>,
    cell: ({ row }) => {
      const workOrder = row.original;

      const handleDownload = async () => {
        try {
          const [client, location, technicians, materials] = await Promise.all([
            workOrder.client_id
              ? getClientById(workOrder.client_id)
              : Promise.resolve(null),
            workOrder.client_location_id
              ? getClientLocationById(workOrder.client_location_id)
              : Promise.resolve(null),
            getWorkOrderTechniciansWithDetails(workOrder.id) as any,
            getWorkOrderMaterialsWithDetails(workOrder.id) as any,
          ]);

          await generateWorkOrderPDF({
            workOrder,
            client,
            location,
            technicians,
            materials,
          } as any);

          toast.success("PDF generated");
        } catch (error) {
          console.error("Error generating WO PDF from table:", error);
          toast.error("Failed to generate PDF");
        }
      };

      return (
        <div className="flex items-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:bg-green-50 hover:text-green-600"
                  onClick={handleDownload}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Download PDF</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:bg-blue-50 hover:text-blue-600"
                  onClick={() => onEdit(workOrder)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Edit</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:bg-red-50 hover:text-red-600"
                  onClick={() => onDelete(workOrder)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Delete</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      );
    },
  },
];
