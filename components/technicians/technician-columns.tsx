"use client";

import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Eye, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Technician } from "@/types";

interface TechnicianColumnsProps {
  onView: (technician: Technician) => void;
  onEdit: (technician: Technician) => void;
  onDelete: (technician: Technician) => void;
}

export const createTechnicianColumns = ({
  onView,
  onEdit,
  onDelete,
}: TechnicianColumnsProps): ColumnDef<Technician>[] => [
  {
    accessorKey: "photo_url",
    header: "Foto",
    cell: ({ row }) => {
      const technician = row.original;
      const initials = technician.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

      return (
        <Avatar className="h-10 w-10">
          <AvatarImage src={technician.photo_url || ""} alt={technician.name} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
      );
    },
  },
  {
    accessorKey: "name",
    header: "Nombre",
    cell: ({ row }) => {
      const technician = row.original;
      return (
        <Button
          variant="link"
          className="p-0 h-auto font-medium"
          onClick={() => onView(technician)}
        >
          {technician.name}
        </Button>
      );
    },
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => {
      const email = row.getValue("email") as string;
      return <div className="text-sm">{email || "—"}</div>;
    },
  },
  {
    accessorKey: "phone",
    header: "Phone",
    cell: ({ row }) => {
      const phone = row.getValue("phone") as string;
      return <div className="text-sm">{phone || "—"}</div>;
    },
  },
  {
    accessorKey: "hire_date",
    header: "Hire Date",
    cell: ({ row }) => {
      const date = row.getValue("hire_date") as string;
      if (!date) return <div className="text-sm text-muted-foreground">—</div>;

      return (
        <div className="text-sm">
          {new Date(date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </div>
      );
    },
  },
  {
    accessorKey: "active",
    header: "Status",
    cell: ({ row }) => {
      const active = row.getValue("active") as boolean;
      return (
        <Badge variant={active ? "default" : "secondary"}>
          {active ? "Active" : "Inactive"}
        </Badge>
      );
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const technician = row.original;

      return (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => onView(technician)}>
            <Eye className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onView(technician)}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(technician)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(technician)}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];
