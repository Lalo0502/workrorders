"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

interface CancelWorkOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => Promise<void>;
  workOrderNumber: string;
}

export function CancelWorkOrderDialog({
  open,
  onOpenChange,
  onConfirm,
  workOrderNumber,
}: CancelWorkOrderDialogProps) {
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (!reason.trim()) return;

    try {
      setIsSubmitting(true);
      await onConfirm(reason);
      setReason("");
      onOpenChange(false);
    } catch (error) {
      console.error("Error cancelling work order:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Cancel Work Order</DialogTitle>
          <DialogDescription>
            Are you sure you want to cancel work order{" "}
            <span className="font-semibold">{workOrderNumber}</span>? Please
            provide a reason.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="reason">Cancellation Reason *</Label>
            <Textarea
              id="reason"
              placeholder="Explain why this work order is being cancelled..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              disabled={isSubmitting}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Keep Work Order
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!reason.trim() || isSubmitting}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Cancel Work Order
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
