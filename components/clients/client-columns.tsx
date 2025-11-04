"use client";

import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Pencil, Trash, Eye, Mail, Phone, Building2 } from "lucide-react";
import { useRouter } from "next/navigation";

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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Client } from "@/types";
import { DataTableColumnHeader } from "@/components/shared/data-table-column-header";

interface ClientColumnsProps {
  onEdit: (client: Client) => void;
  onDelete: (client: Client) => void;
}

export function getClientColumns({
  onEdit,
  onDelete,
}: ClientColumnsProps): ColumnDef<Client>[] {
  return [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Client" />
      ),
      cell: ({ row }) => {
        const name = row.getValue("name") as string;
        const industry = row.original.industry;
        const initials = name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2);

        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-semibold">{name}</span>
              {industry && (
                <span className="text-xs text-muted-foreground">{industry}</span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "email",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Contact" />
      ),
      cell: ({ row }) => {
        const email = row.getValue("email") as string;
        const phone = row.original.phone;

        return (
          <div className="flex flex-col gap-1">
            {email ? (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                <a
                  href={`mailto:${email}`}
                  className="text-muted-foreground hover:text-foreground hover:underline"
                >
                  {email}
                </a>
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">—</span>
            )}
            {phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                <a
                  href={`tel:${phone}`}
                  className="text-muted-foreground hover:text-foreground hover:underline"
                >
                  {phone}
                </a>
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "address",
      header: "Location",
      cell: ({ row }) => {
        const address = row.getValue("address") as string;
        return address ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Building2 className="h-3.5 w-3.5" />
            <span className="max-w-[200px] truncate">{address}</span>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        );
      },
    },
    {
      accessorKey: "active",
      header: "Status",
      cell: ({ row }) => {
        const isActive = row.getValue("active") as boolean;
        return (
          <Badge
            variant={isActive ? "default" : "secondary"}
            className={isActive ? "bg-green-500 hover:bg-green-600" : ""}
          >
            {isActive ? "Active" : "Inactive"}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const client = row.original;
        const router = useRouter();

        return (
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/dashboard/clients/${client.id}`)}
            >
              <Eye className="mr-2 h-4 w-4" />
              View
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => router.push(`/dashboard/clients/${client.id}`)}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onEdit(client)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDelete(client)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];
}
