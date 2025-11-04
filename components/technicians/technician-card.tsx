"use client";

import { Technician } from "@/types";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Mail,
  Phone,
  Calendar,
  MoreVertical,
  Eye,
  Pencil,
  Trash2,
} from "lucide-react";

interface TechnicianCardProps {
  technician: Technician;
  onView: (technician: Technician) => void;
  onEdit: (technician: Technician) => void;
  onDelete: (technician: Technician) => void;
}

export function TechnicianCard({
  technician,
  onView,
  onEdit,
  onDelete,
}: TechnicianCardProps) {
  const initials = technician.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-4">
          <div
            className="flex items-center gap-3 flex-1"
            onClick={() => onView(technician)}
          >
            <Avatar className="h-16 w-16">
              <AvatarImage
                src={technician.photo_url || ""}
                alt={technician.name}
              />
              <AvatarFallback className="text-lg">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg truncate group-hover:text-primary transition-colors">
                {technician.name}
              </h3>
              <Badge
                variant={technician.active ? "default" : "secondary"}
                className="mt-1"
              >
                {technician.active ? "Active" : "Inactive"}
              </Badge>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
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

        <div className="space-y-2 text-sm">
          {technician.email && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="h-4 w-4 flex-shrink-0" />
              <a
                href={`mailto:${technician.email}`}
                className="hover:text-primary truncate"
                onClick={(e) => e.stopPropagation()}
              >
                {technician.email}
              </a>
            </div>
          )}
          {technician.phone && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="h-4 w-4 flex-shrink-0" />
              <a
                href={`tel:${technician.phone}`}
                className="hover:text-primary"
                onClick={(e) => e.stopPropagation()}
              >
                {technician.phone}
              </a>
            </div>
          )}
          {technician.hire_date && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4 flex-shrink-0" />
              <span>
                Since{" "}
                {new Date(technician.hire_date).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                })}
              </span>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="pt-0">
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => onView(technician)}
        >
          <Eye className="mr-2 h-4 w-4" />
          View Details
        </Button>
      </CardFooter>
    </Card>
  );
}
