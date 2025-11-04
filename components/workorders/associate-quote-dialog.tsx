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
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { getQuotes } from "@/lib/supabase/quotes";
import { supabase } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface AssociateQuoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workOrderId: string;
  clientId: string;
  onSuccess: () => void;
}

const statusConfig = {
  draft: { label: "Draft", color: "bg-gray-100 text-gray-800" },
  sent: { label: "Sent", color: "bg-blue-100 text-blue-800" },
  approved: { label: "Approved", color: "bg-green-100 text-green-800" },
  rejected: { label: "Rejected", color: "bg-red-100 text-red-800" },
  converted: { label: "Converted", color: "bg-purple-100 text-purple-800" },
};

export function AssociateQuoteDialog({
  open,
  onOpenChange,
  workOrderId,
  clientId,
  onSuccess,
}: AssociateQuoteDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [selectedQuote, setSelectedQuote] = useState<string>("");
  const [associating, setAssociating] = useState(false);

  useEffect(() => {
    if (open) {
      loadAvailableQuotes();
    }
  }, [open, clientId]);

  const loadAvailableQuotes = async () => {
    try {
      setLoading(true);
      const allQuotes = await getQuotes();

      // Filter quotes: same client and not already associated with a WO
      const availableQuotes = allQuotes.filter((quote: any) => {
        return quote.client_id === clientId && !quote.work_order_id;
      });

      setQuotes(availableQuotes);
    } catch (error) {
      console.error("Error loading quotes:", error);
      toast({
        title: "Error",
        description: "Failed to load available quotes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAssociate = async () => {
    if (!selectedQuote) {
      toast({
        title: "Error",
        description: "Please select a quote",
        variant: "destructive",
      });
      return;
    }

    try {
      setAssociating(true);

      // Update work order with quote_id
      const { error: woError } = await supabase
        .from("work_orders")
        .update({ quote_id: selectedQuote } as any)
        .eq("id", workOrderId);

      if (woError) throw woError;

      // Update quote status to converted
      const { error: quoteError } = await supabase
        .from("quotes")
        .update({ status: "converted" } as any)
        .eq("id", selectedQuote);

      if (quoteError) throw quoteError;

      toast({
        title: "Quote Associated",
        description:
          "Quote has been successfully associated with this work order",
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error associating quote:", error);
      toast({
        title: "Error",
        description: "Failed to associate quote",
        variant: "destructive",
      });
    } finally {
      setAssociating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Associate Existing Quote</DialogTitle>
          <DialogDescription>
            Select a quote from the same client to associate with this work
            order. Only quotes that are not already associated are shown.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : quotes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No available quotes found for this client
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="quote">Select Quote</Label>
              <Select value={selectedQuote} onValueChange={setSelectedQuote}>
                <SelectTrigger id="quote">
                  <SelectValue placeholder="Choose a quote..." />
                </SelectTrigger>
                <SelectContent>
                  {quotes.map((quote) => (
                    <SelectItem key={quote.id} value={quote.id}>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {quote.quote_number}
                        </span>
                        <span className="text-muted-foreground">-</span>
                        <span>{quote.title}</span>
                        <Badge
                          variant="secondary"
                          className={
                            statusConfig[
                              quote.status as keyof typeof statusConfig
                            ]?.color
                          }
                        >
                          {
                            statusConfig[
                              quote.status as keyof typeof statusConfig
                            ]?.label
                          }
                        </Badge>
                        <span className="text-muted-foreground ml-auto">
                          ${quote.total?.toFixed(2) || "0.00"}
                        </span>
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
            disabled={associating}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAssociate}
            disabled={!selectedQuote || associating}
          >
            {associating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Associating...
              </>
            ) : (
              "Associate Quote"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
