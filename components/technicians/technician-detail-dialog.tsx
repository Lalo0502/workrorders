"use client";

import { Technician } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Mail, Phone, Calendar, User } from "lucide-react";

interface TechnicianDetailDialogProps {
  technician: Technician | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TechnicianDetailDialog({
  technician,
  open,
  onOpenChange,
}: TechnicianDetailDialogProps) {
  if (!technician) return null;

  const initials = technician.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage
                src={technician.photo_url || ""}
                alt={technician.name}
              />
              <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <DialogTitle className="text-2xl">{technician.name}</DialogTitle>
              <DialogDescription className="mt-2">
                <Badge variant={technician.active ? "default" : "secondary"}>
                  {technician.active ? "Active" : "Inactive"}
                </Badge>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Separator />

        {/* Contact Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <User className="h-5 w-5" />
            Contact Information
          </h3>

          <div className="grid grid-cols-1 gap-4">
            {technician.email && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <a
                    href={`mailto:${technician.email}`}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    {technician.email}
                  </a>
                </div>
              </div>
            )}

            {technician.phone && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Phone</p>
                  <a
                    href={`tel:${technician.phone}`}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    {technician.phone}
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Work Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Work Information
          </h3>

          <div className="grid grid-cols-1 gap-3">
            {technician.hire_date && (
              <div className="flex justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm font-medium">Hire Date</span>
                <span className="text-sm">
                  {new Date(technician.hire_date).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
            )}

            <div className="flex justify-between p-3 rounded-lg bg-muted/50">
              <span className="text-sm font-medium">Status</span>
              <Badge variant={technician.active ? "default" : "secondary"}>
                {technician.active ? "Active" : "Inactive"}
              </Badge>
            </div>
          </div>
        </div>

        <Separator />

        {/* Metadata */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>
            Created:{" "}
            {new Date(technician.created_at).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
          <p>
            Last updated:{" "}
            {new Date(technician.updated_at).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
