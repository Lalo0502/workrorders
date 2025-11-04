"use client";

import {
  Building2,
  Mail,
  MapPin,
  MoreVertical,
  Pencil,
  Phone,
  Trash,
  Eye,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Client } from "@/types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card } from "@/components/ui/card";

interface ClientCardListProps {
  clients: Client[];
  onEdit: (client: Client) => void;
  onDelete: (client: Client) => void;
}

export function ClientCardList({
  clients,
  onEdit,
  onDelete,
}: ClientCardListProps) {
  const router = useRouter();

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {clients.map((client) => (
        <Card
          key={client.id}
          className="group relative overflow-hidden transition-all hover:shadow-lg hover:border-primary/50"
        >
          <div className="p-6">
            {/* Header with Avatar and Actions */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 ring-2 ring-primary/10">
                  <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-lg font-bold text-primary">
                    {getInitials(client.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-lg leading-none mb-1.5">
                    {client.name}
                  </h3>
                  {client.industry && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      {client.industry}
                    </p>
                  )}
                </div>
              </div>

              {/* Actions Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreVertical className="h-4 w-4" />
                    <span className="sr-only">Actions</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() =>
                      router.push(`/dashboard/clients/${client.id}`)
                    }
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onEdit(client)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
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

            {/* Status Badge */}
            <div className="mb-4">
              <Badge
                variant={client.active ? "default" : "secondary"}
                className={
                  client.active
                    ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20 hover:bg-emerald-500/20"
                    : "bg-slate-100 text-slate-600 border-slate-200"
                }
              >
                {client.active ? "Active" : "Inactive"}
              </Badge>
            </div>

            {/* Contact Information */}
            <div className="space-y-2.5">
              {client.email && (
                <a
                  href={`mailto:${client.email}`}
                  className="flex items-center gap-2.5 text-sm text-muted-foreground hover:text-primary transition-colors group/link"
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center group-hover/link:bg-primary/10 transition-colors">
                    <Mail className="h-4 w-4" />
                  </div>
                  <span className="truncate">{client.email}</span>
                </a>
              )}

              {client.phone && (
                <a
                  href={`tel:${client.phone}`}
                  className="flex items-center gap-2.5 text-sm text-muted-foreground hover:text-primary transition-colors group/link"
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center group-hover/link:bg-primary/10 transition-colors">
                    <Phone className="h-4 w-4" />
                  </div>
                  <span className="truncate">{client.phone}</span>
                </a>
              )}

              {client.address && (
                <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <span className="truncate">{client.address}</span>
                </div>
              )}
            </div>

            {/* View Details Button */}
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-4 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => router.push(`/dashboard/clients/${client.id}`)}
            >
              <Eye className="mr-2 h-4 w-4" />
              View Full Details
            </Button>
          </div>

          {/* Decorative gradient */}
          <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-primary/50 via-primary to-primary/50 opacity-0 group-hover:opacity-100 transition-opacity" />
        </Card>
      ))}
    </div>
  );
}
