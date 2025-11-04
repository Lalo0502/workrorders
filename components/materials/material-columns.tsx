"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Material } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Pencil,
  Trash,
  Package,
  DollarSign,
  Barcode,
  Tag,
  CheckCircle2,
  XCircle,
  Box,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MaterialColumnsProps {
  onView: (material: Material) => void;
  onEdit: (material: Material) => void;
  onDelete: (material: Material) => void;
}

const categoryConfig: Record<
  string,
  { icon: typeof Package; color: string; bgColor: string }
> = {
  Cable: { icon: Box, color: "text-blue-600", bgColor: "bg-blue-50" },
  Equipment: {
    icon: Package,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
  },
  Tools: { icon: Package, color: "text-orange-600", bgColor: "bg-orange-50" },
  Consumables: { icon: Tag, color: "text-green-600", bgColor: "bg-green-50" },
  Hardware: { icon: Package, color: "text-gray-600", bgColor: "bg-gray-50" },
  Software: {
    icon: Package,
    color: "text-indigo-600",
    bgColor: "bg-indigo-50",
  },
  Services: { icon: Package, color: "text-pink-600", bgColor: "bg-pink-50" },
  Other: { icon: Package, color: "text-slate-600", bgColor: "bg-slate-50" },
};

export const createMaterialColumns = ({
  onView,
  onEdit,
  onDelete,
}: MaterialColumnsProps): ColumnDef<Material>[] => [
  {
    accessorKey: "name",
    header: "Material",
    cell: ({ row }) => {
      const material = row.original;
      const categoryData =
        categoryConfig[material.category] || categoryConfig["Other"];
      const CategoryIcon = categoryData.icon;

      return (
        <button
          onClick={() => onView(material)}
          className="flex items-start gap-3 text-left hover:opacity-80 transition-opacity w-full group"
        >
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-lg",
              categoryData.bgColor
            )}
          >
            <CategoryIcon className={cn("h-5 w-5", categoryData.color)} />
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="font-semibold group-hover:underline">
              {material.name}
            </span>
            {material.sku && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Barcode className="h-3 w-3" />
                {material.sku}
              </div>
            )}
            {(material.brand || material.model) && (
              <span className="text-xs text-muted-foreground">
                {material.brand}
                {material.model && ` - ${material.model}`}
              </span>
            )}
          </div>
        </button>
      );
    },
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => {
      const material = row.original;
      if (!material.description) {
        return (
          <span className="text-xs text-muted-foreground italic">
            No description
          </span>
        );
      }
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <p className="text-sm max-w-[300px] line-clamp-2 cursor-default">
                {material.description}
              </p>
            </TooltipTrigger>
            <TooltipContent className="max-w-sm">
              <p>{material.description}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    },
  },
  {
    accessorKey: "category",
    header: "Category",
    cell: ({ row }) => {
      const material = row.original;
      return (
        <div className="flex flex-col gap-1">
          <Badge variant="secondary" className="w-fit">
            {material.category}
          </Badge>
          {material.subcategory && (
            <span className="text-xs text-muted-foreground">
              {material.subcategory}
            </span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "unit_of_measure",
    header: "Unit",
    cell: ({ row }) => {
      const material = row.original;
      return (
        <div className="flex items-center gap-1">
          <Box className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-sm font-medium">
            {material.unit_of_measure}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "unit_price",
    header: "Pricing",
    cell: ({ row }) => {
      const material = row.original;
      const hasPrice = material.unit_price != null;
      const hasCost = material.unit_cost != null;

      if (!hasPrice && !hasCost) {
        return (
          <span className="text-xs text-muted-foreground italic">
            No pricing
          </span>
        );
      }

      return (
        <div className="flex flex-col gap-0.5">
          {hasPrice && (
            <div className="flex items-center gap-1">
              <DollarSign className="h-3.5 w-3.5 text-green-600" />
              <span className="text-sm font-semibold text-green-600">
                ${material.unit_price!.toFixed(2)}
              </span>
            </div>
          )}
          {hasCost && (
            <span className="text-xs text-muted-foreground">
              Cost: ${material.unit_cost!.toFixed(2)}
            </span>
          )}
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
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className={cn(
                  "inline-flex items-center gap-2 px-3 py-1.5 rounded-full cursor-default",
                  active
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-gray-50 text-gray-700 border border-gray-200"
                )}
              >
                {active ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : (
                  <XCircle className="h-3.5 w-3.5" />
                )}
                <span className="text-xs font-medium">
                  {active ? "Active" : "Inactive"}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{active ? "Currently available" : "Not available"}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const material = row.original;

      return (
        <div className="flex items-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onEdit(material)}
                >
                  <Pencil className="h-4 w-4" />
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
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => onDelete(material)}
                >
                  <Trash className="h-4 w-4" />
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
