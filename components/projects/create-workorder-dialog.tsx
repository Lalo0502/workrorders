"use client";

import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText, ExternalLink } from "lucide-react";

interface CreateWorkOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  projectName: string;
}

export function CreateWorkOrderDialog({
  open,
  onOpenChange,
  projectId,
  projectName,
}: CreateWorkOrderDialogProps) {
  const router = useRouter();

  const handleCreate = () => {
    // Navigate to work orders page with project pre-selected
    router.push(`/dashboard/workorders?project_id=${projectId}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Create New Work Order
          </DialogTitle>
          <DialogDescription>
            A new work order will be created for project "
            <span className="font-semibold">{projectName}</span>"
          </DialogDescription>
        </DialogHeader>

        <div className="bg-muted p-4 rounded-lg space-y-2">
          <p className="text-sm text-muted-foreground">
            You will be redirected to the Work Orders page where you can:
          </p>
          <ul className="text-sm space-y-1 ml-4 list-disc text-muted-foreground">
            <li>Complete all work order details</li>
            <li>Assign technicians</li>
            <li>Add materials</li>
            <li>The project will be pre-selected</li>
          </ul>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate}>
            <ExternalLink className="h-4 w-4 mr-2" />
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
