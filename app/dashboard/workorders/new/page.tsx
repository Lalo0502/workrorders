"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Download } from "lucide-react";
import Link from "next/link";
import { ModernWorkOrderForm } from "@/components/workorders/modern-workorder-form";
import { WorkOrder } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { createCompleteWorkOrder } from "@/lib/supabase/workorders";
import { supabase } from "@/lib/supabase/client";

interface SelectedTechnician {
  technician_id: string;
  role?: string;
}

interface SelectedMaterial {
  material_id: string;
  quantity: number;
  notes?: string;
}

export default function NewWorkOrderPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<WorkOrder>>({
    title: "",
    description: "",
    status: "draft",
    priority: "medium",
    work_type: "other",
    client_id: "",
    client_location_id: null,
    manual_address: "",
    manual_city: "",
    manual_state: "",
    manual_zip_code: "",
    manual_country: "",
    poc_name: "",
    poc_email: "",
    poc_phone: "",
    poc_title: "",
    scheduled_date: null,
    scheduled_start_time: null,
    scheduled_end_time: null,
  });

  const [selectedTechnicians, setSelectedTechnicians] = useState<
    SelectedTechnician[]
  >([]);
  const [selectedMaterials, setSelectedMaterials] = useState<
    SelectedMaterial[]
  >([]);

  const handleFormChange = (data: Partial<WorkOrder>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const handleSaveDraft = async () => {
    try {
      setIsSaving(true);

      // Preparar los datos para guardar como draft
      const workOrderData = {
        ...formData,
        status: "draft" as const,
      } as Omit<WorkOrder, "id" | "created_at" | "updated_at" | "wo_number">;

      const workOrder = await createCompleteWorkOrder(
        workOrderData,
        selectedTechnicians,
        selectedMaterials
      );

      toast({
        title: "Draft saved",
        description: "Your work order has been saved as a draft.",
      });

      // Redirigir a la lista
      router.push("/dashboard/workorders");
    } catch (error) {
      console.error("Error saving draft:", error);
      toast({
        title: "Error",
        description: "Failed to save draft. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    router.push("/dashboard/workorders");
  };

  const handleComplete = async () => {
    try {
      setIsSaving(true);

      // Preparar los datos para crear la orden
      const workOrderData = {
        ...formData,
        status: "scheduled" as const, // Cambiar a scheduled cuando se crea
      } as Omit<WorkOrder, "id" | "created_at" | "updated_at" | "wo_number">;

      const workOrder = await createCompleteWorkOrder(
        workOrderData,
        selectedTechnicians,
        selectedMaterials
      );

      // If a quote was selected, update the quote status to converted
      if (formData.quote_id) {
        await supabase
          .from("quotes")
          .update({ status: "converted" } as any)
          .eq("id", formData.quote_id);
      }

      toast({
        title: "Work Order Created! 🎉",
        description: `${workOrder.wo_number} has been created successfully.`,
      });

      // Redirigir al detalle de la WO recién creada
      router.push(`/dashboard/workorders/${workOrder.wo_number}`);
    } catch (error) {
      console.error("Error creating work order:", error);
      toast({
        title: "Error",
        description: "Failed to create work order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Modern Header */}
      <div className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/workorders">
              <Button variant="ghost" size="icon" className="rounded-full">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Create Work Order
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Follow the guided steps to create a complete work order
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => router.push("/dashboard/workorders")}
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="container mx-auto px-6 py-8 max-w-5xl">
        <ModernWorkOrderForm
          data={formData}
          onChange={handleFormChange}
          onTechniciansChange={setSelectedTechnicians}
          onMaterialsChange={setSelectedMaterials}
          onComplete={handleComplete}
          isSaving={isSaving}
        />
      </div>
    </div>
  );
}
