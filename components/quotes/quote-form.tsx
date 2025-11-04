"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Save, Send, X, Plus, Trash2, DollarSign } from "lucide-react";
import {
  createQuote,
  updateQuote,
  calculateQuoteTotals,
  addQuoteItem,
  deleteQuoteItem,
  createQuoteLog,
} from "@/lib/supabase/quotes";
import { getClients } from "@/lib/supabase/clients";
import { getProjects } from "@/lib/supabase/projects";
import { getMaterials } from "@/lib/supabase/materials";
import {
  getWorkOrderById,
  getWorkOrderMaterialsWithDetails,
  getWorkOrders,
} from "@/lib/supabase/workorders";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";
import { QuoteItemsTable } from "./quote-items-table";

interface QuoteFormProps {
  mode: "create" | "edit";
  initialData?: any;
  fromWorkOrderId?: string;
  preselectedClientId?: string;
}

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

export function QuoteForm({
  mode,
  initialData,
  fromWorkOrderId,
  preselectedClientId,
}: QuoteFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [workOrders, setWorkOrders] = useState<any[]>([]);

  // Form State
  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(
    initialData?.description || ""
  );
  const [clientId, setClientId] = useState(initialData?.client_id || "");
  const [projectId, setProjectId] = useState(initialData?.project_id || "");
  const [workOrderId, setWorkOrderId] = useState("");
  const [status, setStatus] = useState(initialData?.status || "draft");

  // Auto-calculate dates: today + 60 days
  const today = new Date();
  const sixtyDaysLater = new Date(today);
  sixtyDaysLater.setDate(today.getDate() + 60);

  const [issueDate, setIssueDate] = useState<string>(
    initialData?.issue_date || format(today, "yyyy-MM-dd")
  );
  const [validUntil, setValidUntil] = useState<string>(
    initialData?.valid_until || format(sixtyDaysLater, "yyyy-MM-dd")
  );
  const [internalNotes, setInternalNotes] = useState(
    initialData?.internal_notes || ""
  );

  // Pricing State
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [applyTax, setApplyTax] = useState(initialData?.apply_tax ?? true);
  const [taxRate, setTaxRate] = useState(initialData?.tax_rate || 8.25);
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">(
    initialData?.discount_type || "percentage"
  );
  const [discountValue, setDiscountValue] = useState(
    initialData?.discount_value || 0
  );

  // Calculated totals
  const totals = calculateQuoteTotals(
    items as any,
    applyTax,
    taxRate,
    discountType,
    discountValue
  );

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Load existing items in edit mode
    if (mode === "edit" && initialData?.items) {
      const formattedItems = initialData.items.map(
        (item: any, index: number) => ({
          id: item.id,
          item_type: item.item_type,
          material_id: item.material_id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          subtotal: item.subtotal,
          notes: item.notes,
          display_order: index,
        })
      );
      setItems(formattedItems);
    }
  }, [mode, initialData]);

  useEffect(() => {
    // Filter projects by selected client
    if (clientId) {
      loadProjects(clientId);
      loadWorkOrders(clientId);
    } else {
      setProjects([]);
      setProjectId("");
      setWorkOrders([]);
      setWorkOrderId("");
    }
  }, [clientId]);

  useEffect(() => {
    // Pre-fill from work order if provided
    if (fromWorkOrderId && mode === "create") {
      loadWorkOrderData(fromWorkOrderId);
    }
  }, [fromWorkOrderId, mode]);

  useEffect(() => {
    // Pre-select client if provided
    if (preselectedClientId && mode === "create") {
      setClientId(preselectedClientId);
    }
  }, [preselectedClientId, mode]);

  const loadData = async () => {
    try {
      const [clientsData, materialsData] = await Promise.all([
        getClients(),
        getMaterials(),
      ]);
      setClients(clientsData);
      setMaterials(materialsData);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load data");
    }
  };

  const loadProjects = async (clientId: string) => {
    try {
      const allProjects = await getProjects();
      const filtered = allProjects.filter((p: any) => p.client_id === clientId);
      setProjects(filtered);
    } catch (error) {
      console.error("Error loading projects:", error);
    }
  };

  const loadWorkOrders = async (clientId: string) => {
    try {
      const allWOs = await getWorkOrders();
      // Filter WOs by client and that don't have a quote assigned
      const filtered = allWOs.filter(
        (wo: any) => wo.client_id === clientId && !wo.quote_id
      );
      setWorkOrders(filtered);
    } catch (error) {
      console.error("Error loading work orders:", error);
    }
  };

  const loadWorkOrderData = async (workOrderId: string) => {
    try {
      // Load work order details
      const { data: wo, error: woError } = await supabase
        .from("work_orders")
        .select("*")
        .eq("id", workOrderId)
        .single();

      if (woError || !wo) {
        console.error("Error loading work order:", woError);
        toast.error("Failed to load work order data");
        return;
      }

      // Pre-fill form with WO data
      setTitle(`Quote for WO-${wo.wo_number}`);
      setDescription(wo.description || "");
      setClientId(wo.client_id);

      // Load WO materials and convert to quote items
      const woMaterials = await getWorkOrderMaterialsWithDetails(workOrderId);
      if (woMaterials && woMaterials.length > 0) {
        const quoteItems: QuoteItem[] = woMaterials.map(
          (wom: any, index: number) => ({
            item_type: "material" as const,
            material_id: wom.material_id,
            description:
              wom.materials?.name || wom.materials?.description || "",
            quantity: wom.quantity,
            unit_price: wom.materials?.unit_price || 0,
            subtotal: wom.quantity * (wom.materials?.unit_price || 0),
            notes: wom.notes || "",
            display_order: index,
          })
        );
        setItems(quoteItems);
      }

      // Auto-link the quote to this WO after creation
      toast.success("Work order data loaded successfully");
    } catch (error) {
      console.error("Error loading work order data:", error);
      toast.error("Failed to load work order data");
    }
  };

  const handleAddItem = (item: QuoteItem) => {
    setItems([...items, { ...item, display_order: items.length }]);
  };

  const handleUpdateItem = (index: number, updatedItem: QuoteItem) => {
    const newItems = [...items];
    newItems[index] = updatedItem;
    setItems(newItems);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSave = async (sendToClient: boolean = false) => {
    // Validation
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!clientId) {
      toast.error("Client is required");
      return;
    }
    if (items.length === 0) {
      toast.error("Add at least one item to the quote");
      return;
    }

    try {
      setLoading(true);

      const quoteData = {
        title,
        description,
        client_id: clientId,
        project_id: projectId || undefined,
        status: sendToClient ? "sent" : status,
        issue_date: issueDate,
        valid_until: validUntil || undefined,
        subtotal: totals.subtotal,
        tax_rate: taxRate,
        tax_amount: totals.taxAmount,
        discount_type: discountValue > 0 ? discountType : undefined,
        discount_value: discountValue,
        discount_amount: totals.discountAmount,
        total: totals.total,
        apply_tax: applyTax,
        internal_notes: internalNotes,
      };

      if (mode === "create") {
        const newQuote: any = await createQuote(quoteData as any);

        // Save quote items
        if (items.length > 0) {
          for (const item of items) {
            await addQuoteItem({
              quote_id: newQuote.id,
              item_type: item.item_type,
              material_id: item.material_id,
              description: item.description,
              quantity: item.quantity,
              unit_price: item.unit_price,
              subtotal: item.subtotal,
              notes: item.notes,
              display_order: item.display_order,
            } as any);
          }
        }

        // Log quote creation
        await createQuoteLog({
          quote_id: newQuote.id,
          action: "created",
          notes: `Quote created with ${items.length} item(s)`,
        });

        // If created from a work order OR if a work order was selected, associate it
        const woIdToAssociate = fromWorkOrderId || workOrderId;
        if (woIdToAssociate) {
          await supabase
            .from("work_orders")
            .update({ quote_id: newQuote.id } as any)
            .eq("id", woIdToAssociate);

          // Update quote status to converted
          await supabase
            .from("quotes")
            .update({ status: "converted" } as any)
            .eq("id", newQuote.id);

          await createQuoteLog({
            quote_id: newQuote.id,
            action: "converted_to_wo",
            notes: `Quote associated with work order`,
          });

          toast.success("Quote created and associated with work order!");
        } else {
          toast.success(
            sendToClient
              ? "Quote created and sent!"
              : "Quote created successfully!"
          );
        }

        router.push(`/dashboard/quotes/${newQuote.quote_number}`);
      } else {
        // Track what changed
        const changes: Array<{
          field_name: string;
          old_value: string;
          new_value: string;
        }> = [];

        if (title !== initialData.title) {
          changes.push({
            field_name: "title",
            old_value: initialData.title,
            new_value: title,
          });
        }
        if (description !== initialData.description) {
          changes.push({
            field_name: "description",
            old_value: initialData.description || "",
            new_value: description,
          });
        }
        if (clientId !== initialData.client_id) {
          const oldClient = clients.find((c) => c.id === initialData.client_id);
          const newClient = clients.find((c) => c.id === clientId);
          changes.push({
            field_name: "client_id",
            old_value: oldClient?.name || "None",
            new_value: newClient?.name || "None",
          });
        }
        if (projectId !== initialData.project_id) {
          const oldProject = projects.find(
            (p) => p.id === initialData.project_id
          );
          const newProject = projects.find((p) => p.id === projectId);
          changes.push({
            field_name: "project_id",
            old_value: oldProject?.name || "None",
            new_value: newProject?.name || "None",
          });
        }
        if (issueDate !== initialData.issue_date) {
          changes.push({
            field_name: "issue_date",
            old_value: initialData.issue_date,
            new_value: issueDate,
          });
        }
        if (validUntil !== initialData.valid_until) {
          changes.push({
            field_name: "valid_until",
            old_value: initialData.valid_until || "",
            new_value: validUntil,
          });
        }
        if (applyTax !== initialData.apply_tax) {
          changes.push({
            field_name: "apply_tax",
            old_value: initialData.apply_tax ? "Yes" : "No",
            new_value: applyTax ? "Yes" : "No",
          });
        }
        if (taxRate !== initialData.tax_rate) {
          changes.push({
            field_name: "tax_rate",
            old_value: initialData.tax_rate?.toString() || "0",
            new_value: taxRate.toString(),
          });
        }
        if (discountValue !== initialData.discount_value) {
          changes.push({
            field_name: "discount_value",
            old_value: initialData.discount_value?.toString() || "0",
            new_value: discountValue.toString(),
          });
        }
        // Only log discount type change if there's actually a discount
        if (discountValue > 0 || initialData.discount_value > 0) {
          const oldType = initialData.discount_type || "percentage";
          const newType = discountType || "percentage";
          if (oldType !== newType) {
            changes.push({
              field_name: "discount_type",
              old_value: oldType,
              new_value: newType,
            });
          }
        }
        if (internalNotes !== initialData.internal_notes) {
          changes.push({
            field_name: "internal_notes",
            old_value: initialData.internal_notes || "",
            new_value: internalNotes,
          });
        }

        await updateQuote(initialData.id, quoteData as any);

        // Log all changes
        if (changes.length > 0) {
          for (const change of changes) {
            await createQuoteLog({
              quote_id: initialData.id,
              action: "updated",
              field_name: change.field_name,
              old_value: change.old_value,
              new_value: change.new_value,
              notes: `${change.field_name} changed`,
            });
          }
        }

        // Update quote items (delete all and re-create)
        // TODO: Implement better item update logic
        if (items.length > 0) {
          // Track item changes with details
          const oldItems = initialData.items || [];
          const newItems = items;

          // Find new items (items without id)
          const addedItems = newItems.filter((item) => !item.id);

          // Log each added item with description
          for (const item of addedItems) {
            const itemName =
              item.item_type === "material"
                ? materials.find((m) => m.id === item.material_id)?.name ||
                  item.description
                : item.description;

            await createQuoteLog({
              quote_id: initialData.id,
              action: "item_added",
              field_name: "items",
              new_value: `${itemName} (Qty: ${item.quantity})`,
              notes: `Added item: ${itemName}`,
            });
          }

          // Find removed items (old items not in new items)
          const removedItems = oldItems.filter(
            (oldItem: any) =>
              !newItems.find((newItem) => newItem.id === oldItem.id)
          );

          // Log each removed item with description
          for (const item of removedItems) {
            const itemName =
              item.item_type === "material"
                ? materials.find((m: any) => m.id === item.material_id)?.name ||
                  item.description
                : item.description;

            await createQuoteLog({
              quote_id: initialData.id,
              action: "item_removed",
              field_name: "items",
              old_value: `${itemName} (Qty: ${item.quantity})`,
              notes: `Removed item: ${itemName}`,
            });
          }

          // For now, we'll just add new items
          // In production, you'd want to handle updates/deletes properly
          for (const item of items) {
            if (!item.id) {
              await addQuoteItem({
                quote_id: initialData.id,
                item_type: item.item_type,
                material_id: item.material_id,
                description: item.description,
                quantity: item.quantity,
                unit_price: item.unit_price,
                subtotal: item.subtotal,
                notes: item.notes,
                display_order: item.display_order,
              } as any);
            }
          }
        }

        toast.success(
          sendToClient
            ? "Quote updated and sent!"
            : "Quote updated successfully!"
        );
        router.push(`/dashboard/quotes/${initialData.quote_number}`);
      }
    } catch (error) {
      console.error("Error saving quote:", error);
      toast.error("Failed to save quote");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Main Form - Left Side */}
      <div className="lg:col-span-8 space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {mode === "edit" && (
              <div className="space-y-2">
                <Label>Quote Number</Label>
                <Input value={initialData?.quote_number} disabled />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="title">
                Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                placeholder="Quote title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description of the quote"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Client & Project */}
        <Card>
          <CardHeader>
            <CardTitle>Client & Project</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="client">
                Client <span className="text-red-500">*</span>
              </Label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="project">Project (Optional)</Label>
              <Select
                value={projectId}
                onValueChange={setProjectId}
                disabled={!clientId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="workorder">Work Order (Optional)</Label>
              <Select
                value={workOrderId}
                onValueChange={setWorkOrderId}
                disabled={!clientId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a work order" />
                </SelectTrigger>
                <SelectContent>
                  {workOrders.map((wo) => (
                    <SelectItem key={wo.id} value={wo.id}>
                      {wo.wo_number} - {wo.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Dates */}
        <Card>
          <CardHeader>
            <CardTitle>Dates & Validity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="issue-date">
                  Issue Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="issue-date"
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="valid-until">Valid Until</Label>
                <Input
                  id="valid-until"
                  type="date"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quote Items */}
        <Card>
          <CardHeader>
            <CardTitle>Quote Items</CardTitle>
          </CardHeader>
          <CardContent>
            <QuoteItemsTable
              items={items}
              materials={materials}
              onAddItem={handleAddItem}
              onUpdateItem={handleUpdateItem}
              onRemoveItem={handleRemoveItem}
            />
          </CardContent>
        </Card>

        {/* Internal Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Internal Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Internal notes (not visible to client)"
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              rows={3}
            />
          </CardContent>
        </Card>
      </div>

      {/* Pricing Summary - Right Sidebar */}
      <div className="lg:col-span-4">
        <div className="sticky top-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Pricing Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Subtotal */}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">
                  ${totals.subtotal.toFixed(2)}
                </span>
              </div>

              <Separator />

              {/* Tax */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="apply-tax"
                    checked={applyTax}
                    onCheckedChange={(checked) =>
                      setApplyTax(checked as boolean)
                    }
                  />
                  <Label htmlFor="apply-tax" className="text-sm cursor-pointer">
                    Apply Tax
                  </Label>
                </div>
                {applyTax && (
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={taxRate}
                      onChange={(e) => setTaxRate(parseFloat(e.target.value))}
                      className="w-20"
                    />
                    <span className="text-sm text-muted-foreground">%</span>
                    <span className="ml-auto text-sm font-medium">
                      ${totals.taxAmount.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>

              <Separator />

              {/* Discount */}
              <div className="space-y-2">
                <Label className="text-sm">Discount</Label>
                <div className="flex gap-2">
                  <Select
                    value={discountType}
                    onValueChange={(value: "percentage" | "fixed") =>
                      setDiscountType(value)
                    }
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">%</SelectItem>
                      <SelectItem value="fixed">$</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={discountValue}
                    onChange={(e) =>
                      setDiscountValue(parseFloat(e.target.value) || 0)
                    }
                    placeholder="0"
                  />
                </div>
                {discountValue > 0 && (
                  <div className="flex justify-between text-sm text-red-600">
                    <span>Discount Amount</span>
                    <span>-${totals.discountAmount.toFixed(2)}</span>
                  </div>
                )}
              </div>

              <Separator />

              {/* Total */}
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-primary">${totals.total.toFixed(2)}</span>
              </div>

              <Separator />

              {/* Item Count */}
              <div className="text-sm text-muted-foreground text-center">
                {items.length} item{items.length !== 1 ? "s" : ""}
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="space-y-2">
            <Button
              className="w-full"
              onClick={() => handleSave(false)}
              disabled={loading}
            >
              <Save className="h-4 w-4 mr-2" />
              {mode === "create" ? "Save Draft" : "Save Changes"}
            </Button>
            <Button
              className="w-full"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
