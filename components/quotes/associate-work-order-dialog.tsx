"use client";

import { useState, useEffect } from "react";
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
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { getWorkOrders } from "@/lib/supabase/workorders";
import { supabase } from "@/lib/supabase/client";
import { createQuoteLog } from "@/lib/supabase/quotes";
import { RefreshCw, FileText } from "lucide-react";
import { toast } from "sonner";

interface AssociateWorkOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quoteId: string;
  quoteNumber: string;
  clientId: string;
  onSuccess: () => void;
}

export function AssociateWorkOrderDialog({
  open,
  onOpenChange,
  quoteId,
  quoteNumber,
  clientId,
  onSuccess,
}: AssociateWorkOrderDialogProps) {
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [selectedWO, setSelectedWO] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [loadingWOs, setLoadingWOs] = useState(false);

  useEffect(() => {
    if (open) {
      loadWorkOrders();
    }
  }, [open, clientId]);

  const loadWorkOrders = async () => {
    try {
      setLoadingWOs(true);
      const allWOs = await getWorkOrders();

      // Filter: same client and not already associated with another quote
      const availableWOs = allWOs.filter(
        (wo: any) => wo.client_id === clientId && !wo.quote_id
      );

      setWorkOrders(availableWOs);
    } catch (error) {
      console.error("Error loading work orders:", error);
      toast.error("Failed to load work orders");
    } finally {
      setLoadingWOs(false);
    }
  };

  const handleAssociate = async () => {
    if (!selectedWO) {
      toast.error("Please select a work order");
      return;
    }

    try {
      setLoading(true);

      // Update work order with quote_id
      const { error } = await supabase
        .from("work_orders")
        .update({ quote_id: quoteId })
        .eq("id", selectedWO);

      if (error) throw error;

      // Update quote status to converted
      await supabase
        .from("quotes")
        .update({ status: "converted" })
        .eq("id", quoteId);

      // Log the association
      const woData = workOrders.find((wo) => wo.id === selectedWO);
      await createQuoteLog({
        quote_id: quoteId,
        action: "converted_to_wo",
        notes: `Quote associated with Work Order ${woData?.wo_number}`,
      });

      toast.success("Work Order associated successfully!");
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error associating work order:", error);
      toast.error("Failed to associate work order");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Associate Existing Work Order</DialogTitle>
          <DialogDescription>
            Select an existing work order to associate with quote {quoteNumber}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {loadingWOs ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : workOrders.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                No available work orders found for this client
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Only work orders from the same client that aren't already
                associated with a quote are shown
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="work-order">Select Work Order</Label>
              <Select value={selectedWO} onValueChange={setSelectedWO}>
                <SelectTrigger id="work-order">
                  <SelectValue placeholder="Choose a work order..." />
                </SelectTrigger>
                <SelectContent>
                  {workOrders.map((wo) => (
                    <SelectItem key={wo.id} value={wo.id}>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{wo.wo_number}</span>
                        <span className="text-muted-foreground">-</span>
                        <span>{wo.title}</span>
                        <Badge variant="secondary" className="ml-2 text-xs">
                          {wo.status}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAssociate}
            disabled={loading || !selectedWO || workOrders.length === 0}
          >
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Associating...
              </>
            ) : (
              "Associate Work Order"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
