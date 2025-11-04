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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ReopenWorkOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (clearEvidence: boolean) => Promise<void>;
  workOrderNumber: string;
  hasEvidence: boolean;
}

export function ReopenWorkOrderDialog({
  open,
  onOpenChange,
  onConfirm,
  workOrderNumber,
  hasEvidence,
}: ReopenWorkOrderDialogProps) {
  const [clearEvidence, setClearEvidence] = useState("keep");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    try {
      setIsSubmitting(true);
      await onConfirm(clearEvidence === "clear");
      onOpenChange(false);
      setClearEvidence("keep"); // Reset
    } catch (error) {
      console.error("Error reopening work order:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Reopen Work Order</DialogTitle>
          <DialogDescription>
            Reopen {workOrderNumber} and change status back to "In Progress"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This work order will be reopened and can be modified and completed
              again.
            </AlertDescription>
          </Alert>

          {hasEvidence && (
            <div className="space-y-3">
              <Label>What should we do with existing evidence?</Label>
              <RadioGroup
                value={clearEvidence}
                onValueChange={setClearEvidence}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="keep" id="keep" />
                  <Label htmlFor="keep" className="font-normal cursor-pointer">
                    Keep existing evidence (photos, notes, signature)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="clear" id="clear" />
                  <Label htmlFor="clear" className="font-normal cursor-pointer">
                    Clear all evidence and start fresh
                  </Label>
                </div>
              </RadioGroup>
              <p className="text-sm text-muted-foreground">
                {clearEvidence === "keep"
                  ? "Previous evidence will remain visible. New evidence can be added when completing again."
                  : "All photos, notes, and signature will be permanently deleted."}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Reopening...
              </>
            ) : (
              "Reopen Work Order"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
