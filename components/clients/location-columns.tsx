"use client";

import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Pencil, Trash, Star, Eye } from "lucide-react";

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
import { ClientLocation } from "@/types";
import { DataTableColumnHeader } from "@/components/shared/data-table-column-header";

interface LocationColumnsProps {
  onEdit: (location: ClientLocation) => void;
  onDelete: (location: ClientLocation) => void;
  onSetPrimary: (location: ClientLocation) => void;
  onViewDetails?: (location: ClientLocation) => void;
}

export function getLocationColumns({
  onEdit,
  onDelete,
  onSetPrimary,
  onViewDetails,
}: LocationColumnsProps): ColumnDef<ClientLocation>[] {
  return [
    {
      accessorKey: "location_name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Location" />
      ),
      cell: ({ row }) => {
        const isPrimary = row.getValue("is_primary") as boolean;
        return (
          <div className="flex items-center gap-2">
            <span className="font-medium">{row.getValue("location_name")}</span>
            {isPrimary && (
              <Badge variant="default" className="text-xs">
                <Star className="mr-1 h-3 w-3" />
                Primary
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "address",
      header: "Address",
      cell: ({ row }) => {
        const location = row.original;
        const fullAddress = [
          location.address,
          location.city,
          location.state,
          location.zip_code,
        ]
          .filter(Boolean)
          .join(", ");
        return (
          <div className="text-sm text-muted-foreground">
            {fullAddress || "—"}
          </div>
        );
      },
    },
    {
      accessorKey: "poc_name",
      header: "Point of Contact",
      cell: ({ row }) => {
        const location = row.original;
        return (
          <div className="space-y-1">
            <div className="font-medium">{location.poc_name || "—"}</div>
            {location.poc_title && (
              <div className="text-xs text-muted-foreground">
                {location.poc_title}
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "poc_email",
      header: "Contact Info",
      cell: ({ row }) => {
        const location = row.original;
        return (
          <div className="space-y-1 text-sm">
            {location.poc_email && (
              <div className="text-muted-foreground">{location.poc_email}</div>
            )}
            {location.poc_phone && (
              <div className="text-muted-foreground">{location.poc_phone}</div>
            )}
            {!location.poc_email && !location.poc_phone && "—"}
          </div>
        );
      },
    },
    {
      id: "is_primary",
      accessorKey: "is_primary",
      header: "",
      cell: () => null,
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const location = row.original;
        const isPrimary = location.is_primary;

        return (
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
              {onViewDetails && (
                <DropdownMenuItem onClick={() => onViewDetails(location)}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
              )}
              {!isPrimary && (
                <DropdownMenuItem onClick={() => onSetPrimary(location)}>
                  <Star className="mr-2 h-4 w-4" />
                  Set as Primary
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => onEdit(location)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(location)}
                className="text-destructive"
              >
                <Trash className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
