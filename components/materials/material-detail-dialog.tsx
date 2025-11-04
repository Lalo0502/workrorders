"use client";

import { Material } from "@/types";
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
  Package,
  FileText,
  Wrench,
  MapPin,
  DollarSign,
  Truck,
  Tag,
  Hash,
  Ruler,
} from "lucide-react";

interface MaterialDetailDialogProps {
  material: Material | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MaterialDetailDialog({
  material,
  open,
  onOpenChange,
}: MaterialDetailDialogProps) {
  if (!material) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <DialogTitle className="text-2xl">{material.name}</DialogTitle>
              <DialogDescription>
                {material.description || "No description provided"}
              </DialogDescription>
            </div>
            <Badge variant="secondary" className="ml-4">
              {material.category}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Identification Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Identification
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {material.sku && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">SKU</p>
                  <p className="text-sm font-medium">{material.sku}</p>
                </div>
              )}
              {material.part_number && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Part Number</p>
                  <p className="text-sm font-medium">{material.part_number}</p>
                </div>
              )}
              {material.subcategory && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Subcategory</p>
                  <p className="text-sm font-medium">{material.subcategory}</p>
                </div>
              )}
              {material.type && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Type</p>
                  <p className="text-sm font-medium">{material.type}</p>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Product Details Section */}
          {(material.brand ||
            material.manufacturer ||
            material.model ||
            material.specifications) && (
            <>
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Product Details
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {material.brand && (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Brand</p>
                      <p className="text-sm font-medium">{material.brand}</p>
                    </div>
                  )}
                  {material.manufacturer && (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">
                        Manufacturer
                      </p>
                      <p className="text-sm font-medium">
                        {material.manufacturer}
                      </p>
                    </div>
                  )}
                  {material.model && (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Model</p>
                      <p className="text-sm font-medium">{material.model}</p>
                    </div>
                  )}
                </div>
                {material.specifications && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">
                      Specifications
                    </p>
                    <p className="text-sm font-medium whitespace-pre-wrap">
                      {material.specifications}
                    </p>
                  </div>
                )}
              </div>
              <Separator />
            </>
          )}

          {/* Inventory Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Inventory Information
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Unit of Measure</p>
                <p className="text-sm font-medium">
                  {material.unit_of_measure}
                </p>
              </div>
              {material.location && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="text-sm font-medium">{material.location}</p>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Pricing Section */}
          {(material.unit_cost || material.unit_price || material.supplier) && (
            <>
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Pricing & Supplier
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {material.unit_cost !== null &&
                    material.unit_cost !== undefined && (
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">
                          Unit Cost
                        </p>
                        <p className="text-sm font-medium">
                          ${material.unit_cost.toFixed(2)}
                        </p>
                      </div>
                    )}
                  {material.unit_price !== null &&
                    material.unit_price !== undefined && (
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">
                          Unit Price
                        </p>
                        <p className="text-sm font-medium">
                          ${material.unit_price.toFixed(2)}
                        </p>
                      </div>
                    )}
                  {material.supplier && (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Supplier</p>
                      <p className="text-sm font-medium">{material.supplier}</p>
                    </div>
                  )}
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Notes Section */}
          {material.notes && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Notes
              </h3>
              <p className="text-sm whitespace-pre-wrap">{material.notes}</p>
            </div>
          )}

          {/* Metadata */}
          <div className="pt-4 border-t">
            <div className="flex justify-between text-xs text-muted-foreground">
              <div>
                Created: {new Date(material.created_at).toLocaleDateString()}
              </div>
              {material.updated_at && (
                <div>
                  Updated: {new Date(material.updated_at).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
