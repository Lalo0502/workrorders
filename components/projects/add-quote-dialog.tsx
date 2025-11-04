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
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface AddQuoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
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

export function AddQuoteDialog({
  open,
  onOpenChange,
  projectId,
  clientId,
  onSuccess,
}: AddQuoteDialogProps) {
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

      // Filter quotes: same client and not already associated with a project
      const availableQuotes = allQuotes.filter((quote: any) => {
        return quote.client_id === clientId && !quote.project_id;
      });

      setQuotes(availableQuotes);
    } catch (error) {
      console.error("Error loading quotes:", error);
      toast.error("Failed to load available quotes");
    } finally {
      setLoading(false);
    }
  };

  const handleAssociate = async () => {
    if (!selectedQuote) {
      toast.error("Please select a quote");
      return;
    }

    try {
      setAssociating(true);

      // Update quote with project_id
      const { error } = await supabase
        .from("quotes")
        .update({ project_id: projectId } as any)
        .eq("id", selectedQuote);

      if (error) throw error;

      toast.success("Quote associated with project successfully!");
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error associating quote:", error);
      toast.error("Failed to associate quote");
    } finally {
      setAssociating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Existing Quote</DialogTitle>
          <DialogDescription>
            Select a quote from the same client to associate with this project.
            Only quotes that are not already associated are shown.
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
              "Add Quote"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
