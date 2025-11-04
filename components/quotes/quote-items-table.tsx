"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Edit, Package } from "lucide-react";
import { toast } from "sonner";

interface QuoteItem {
  id?: string;
  item_type: "material" | "custom";
  material_id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  notes?: string;
  display_order: number;
}

interface QuoteItemsTableProps {
  items: QuoteItem[];
  materials: any[];
  onAddItem: (item: QuoteItem) => void;
  onUpdateItem: (index: number, item: QuoteItem) => void;
  onRemoveItem: (index: number) => void;
}

export function QuoteItemsTable({
  items,
  materials,
  onAddItem,
  onUpdateItem,
  onRemoveItem,
}: QuoteItemsTableProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [itemType, setItemType] = useState<"material" | "custom">("material");
  const [selectedMaterialId, setSelectedMaterialId] = useState("");
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState(0);
  const [notes, setNotes] = useState("");

  const handleOpenAddDialog = (type: "material" | "custom") => {
    resetForm();
    setItemType(type);
    setShowAddDialog(true);
  };

  const handleOpenEditDialog = (index: number) => {
    const item = items[index];
    setEditingIndex(index);
    setItemType(item.item_type);
    setSelectedMaterialId(item.material_id || "");
    setDescription(item.description);
    setQuantity(item.quantity);
    setUnitPrice(item.unit_price);
    setNotes(item.notes || "");
    setShowAddDialog(true);
  };

  const resetForm = () => {
    setEditingIndex(null);
    setItemType("material");
    setSelectedMaterialId("");
    setDescription("");
    setQuantity(1);
    setUnitPrice(0);
    setNotes("");
  };

  const handleMaterialChange = (materialId: string) => {
    setSelectedMaterialId(materialId);
    const material = materials.find((m) => m.id === materialId);
    if (material) {
      setDescription(material.name);
      setUnitPrice(material.unit_price || 0);
    }
  };

  const handleSaveItem = () => {
    if (!description.trim()) {
      toast.error("Description is required");
      return;
    }
    if (quantity <= 0) {
      toast.error("Quantity must be greater than 0");
      return;
    }
    if (unitPrice < 0) {
      toast.error("Unit price cannot be negative");
      return;
    }

    const subtotal = quantity * unitPrice;

    const item: QuoteItem = {
      item_type: itemType,
      material_id: itemType === "material" ? selectedMaterialId : undefined,
      description,
      quantity,
      unit_price: unitPrice,
      subtotal,
      notes,
      display_order:
        editingIndex !== null
          ? items[editingIndex].display_order
          : items.length,
    };

    if (editingIndex !== null) {
      onUpdateItem(editingIndex, item);
      toast.success("Item updated");
    } else {
      onAddItem(item);
      toast.success("Item added");
    }

    setShowAddDialog(false);
    resetForm();
  };

  const handleRemove = (index: number) => {
    if (confirm("Are you sure you want to remove this item?")) {
      onRemoveItem(index);
      toast.success("Item removed");
    }
  };

  return (
    <div className="space-y-4">
      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => handleOpenAddDialog("material")}
        >
          <Package className="h-4 w-4 mr-2" />
          Add from Materials
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => handleOpenAddDialog("custom")}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Custom Item
        </Button>
      </div>

      {/* Items Table */}
      {items.length === 0 ? (
        <div className="border border-dashed rounded-lg p-8 text-center">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No items added yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Add items from your materials catalog or create custom items
          </p>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{item.description}</div>
                      {item.notes && (
                        <div className="text-xs text-muted-foreground">
                          {item.notes}
                        </div>
                      )}
                      {item.item_type === "material" && (
                        <div className="text-xs text-blue-600 mt-1">
                          From catalog
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">
                    ${item.unit_price.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    ${item.subtotal.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenEditDialog(index)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemove(index)}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Add/Edit Item Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingIndex !== null ? "Edit Item" : "Add Item"}
            </DialogTitle>
            <DialogDescription>
              {itemType === "material"
                ? "Select a material from your catalog"
                : "Create a custom item"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {itemType === "material" && editingIndex === null && (
              <div className="space-y-2">
                <Label>Material</Label>
                <Select
                  value={selectedMaterialId}
                  onValueChange={handleMaterialChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a material" />
                  </SelectTrigger>
                  <SelectContent>
                    {materials.map((material) => (
                      <SelectItem key={material.id} value={material.id}>
                        <div className="flex justify-between items-center gap-4">
                          <span>{material.name}</span>
                          <span className="text-muted-foreground text-sm">
                            ${material.unit_price?.toFixed(2) || "0.00"}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Item description"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Quantity</Label>
                <Input
                  type="number"
                  min="1"
                  step="1"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                />
              </div>

              <div className="space-y-2">
                <Label>Unit Price ($)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={unitPrice}
                  onChange={(e) =>
                    setUnitPrice(parseFloat(e.target.value) || 0)
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notes (Optional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes about this item"
                rows={2}
              />
            </div>

            {/* Subtotal Preview */}
            <div className="bg-muted p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Subtotal</span>
                <span className="text-lg font-bold">
                  ${(quantity * unitPrice).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowAddDialog(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleSaveItem}>
              {editingIndex !== null ? "Update Item" : "Add Item"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
