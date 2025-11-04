"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  MapPin,
  Building2,
  User,
  Mail,
  Phone,
  Briefcase,
  Star,
  MapPinned,
  FileText,
  Globe,
} from "lucide-react";
import { ClientLocation } from "@/types";

interface LocationDetailsDialogProps {
  location: ClientLocation | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LocationDetailsDialog({
  location,
  open,
  onOpenChange,
}: LocationDetailsDialogProps) {
  if (!location) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-2xl flex items-center gap-2">
                <Building2 className="h-6 w-6 text-primary" />
                {location.location_name}
              </DialogTitle>
              <DialogDescription className="mt-2">
                Complete location information
              </DialogDescription>
            </div>
            {location.is_primary && (
              <Badge variant="default" className="ml-4">
                <Star className="mr-1 h-3 w-3" />
                Primary Location
              </Badge>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Address Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-primary">
              <MapPin className="h-4 w-4" />
              Address Information
            </div>
            <div className="pl-6 space-y-2">
              {location.address && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground">
                    Street Address
                  </div>
                  <div className="text-sm">{location.address}</div>
                </div>
              )}
              <div className="grid grid-cols-3 gap-4">
                {location.city && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">
                      City
                    </div>
                    <div className="text-sm">{location.city}</div>
                  </div>
                )}
                {location.state && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">
                      State
                    </div>
                    <div className="text-sm">{location.state}</div>
                  </div>
                )}
                {location.zip_code && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">
                      ZIP Code
                    </div>
                    <div className="text-sm">{location.zip_code}</div>
                  </div>
                )}
              </div>
              {location.country && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground">
                    Country
                  </div>
                  <div className="text-sm">{location.country}</div>
                </div>
              )}
              {!location.address &&
                !location.city &&
                !location.state &&
                !location.zip_code && (
                  <div className="text-sm text-muted-foreground italic">
                    No address information available
                  </div>
                )}
            </div>
          </div>

          {/* Point of Contact Section */}
          {(location.poc_name ||
            location.poc_email ||
            location.poc_phone ||
            location.poc_title) && (
            <>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                  <User className="h-4 w-4" />
                  Point of Contact
                </div>
                <div className="pl-6 space-y-3">
                  {location.poc_name && (
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">
                        Name
                      </div>
                      <div className="text-sm font-semibold">
                        {location.poc_name}
                      </div>
                    </div>
                  )}
                  {location.poc_title && (
                    <div>
                      <div className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                        <Briefcase className="h-3.5 w-3.5" />
                        Title
                      </div>
                      <div className="text-sm">{location.poc_title}</div>
                    </div>
                  )}
                  {location.poc_email && (
                    <div>
                      <div className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5" />
                        Email
                      </div>
                      <a
                        href={`mailto:${location.poc_email}`}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        {location.poc_email}
                      </a>
                    </div>
                  )}
                  {location.poc_phone && (
                    <div>
                      <div className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5" />
                        Phone
                      </div>
                      <a
                        href={`tel:${location.poc_phone}`}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        {location.poc_phone}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Additional Information */}
          {location.notes && (
            <>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                  <FileText className="h-4 w-4" />
                  Notes
                </div>
                <div className="pl-6">
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {location.notes}
                  </p>
                </div>
              </div>
            </>
          )}

          {/* Metadata */}
          <Separator />
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <MapPinned className="h-4 w-4" />
              Location Status
            </div>
            <div className="pl-6 grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium text-muted-foreground">
                  Status
                </div>
                <Badge variant={location.active ? "default" : "secondary"}>
                  {location.active ? "Active" : "Inactive"}
                </Badge>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">
                  Type
                </div>
                <Badge variant={location.is_primary ? "default" : "outline"}>
                  {location.is_primary ? "Primary" : "Secondary"}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
