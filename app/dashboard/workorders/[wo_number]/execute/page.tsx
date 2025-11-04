"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Upload,
  X,
  Camera,
  FileText,
  PenTool,
  CheckCircle,
  Loader2,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { WorkOrder } from "@/types";
import {
  getWorkOrderByNumber,
  completeWorkOrder,
} from "@/lib/supabase/workorders";
import { uploadWorkOrderFiles, uploadSignature } from "@/lib/supabase/storage";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PageProps {
  params: {
    wo_number: string;
  };
}

export default function ExecuteWorkOrderPage({ params }: PageProps) {
  const router = useRouter();
  const { toast } = useToast();
  const signatureCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);

  // Form data
  const [photosBefore, setPhotosBefore] = useState<File[]>([]);
  const [photosAfter, setPhotosAfter] = useState<File[]>([]);
  const [existingPhotosBefore, setExistingPhotosBefore] = useState<string[]>(
    []
  );
  const [existingPhotosAfter, setExistingPhotosAfter] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [clientName, setClientName] = useState("");
  const [hasSignature, setHasSignature] = useState(false);
  const [existingSignature, setExistingSignature] = useState<string | null>(
    null
  );
  const [hasDrawnNewSignature, setHasDrawnNewSignature] = useState(false);

  useEffect(() => {
    loadWorkOrder();
  }, [params.wo_number]);

  // Load existing signature into canvas
  useEffect(() => {
    if (existingSignature && signatureCanvasRef.current) {
      const canvas = signatureCanvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const img = new Image();
      img.crossOrigin = "anonymous"; // Enable CORS
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
      img.onerror = () => {
        console.error("Failed to load signature image");
      };
      img.src = existingSignature;
    }
  }, [existingSignature]);

  const loadWorkOrder = async () => {
    try {
      setLoading(true);
      const wo = await getWorkOrderByNumber(params.wo_number);

      if (!wo) {
        toast({
          title: "Error",
          description: "Work Order not found",
          variant: "destructive",
        });
        router.push("/dashboard/workorders");
        return;
      }

      if (wo.status !== "in_progress") {
        toast({
          title: "Invalid Status",
          description: "This work order is not in progress",
          variant: "destructive",
        });
        router.push(`/dashboard/workorders/${params.wo_number}`);
        return;
      }

      setWorkOrder(wo);

      // Load existing evidence if any
      if (wo.photos_before && Array.isArray(wo.photos_before)) {
        setExistingPhotosBefore(wo.photos_before);
      }

      if (wo.photos_after && Array.isArray(wo.photos_after)) {
        setExistingPhotosAfter(wo.photos_after);
      }

      if (wo.technician_notes) {
        setNotes(wo.technician_notes);
      }

      if (wo.client_signature) {
        setExistingSignature(wo.client_signature);
        setHasSignature(true);
      }

      if (wo.client_signature_name) {
        setClientName(wo.client_signature_name);
      }
    } catch (error) {
      console.error("Error loading work order:", error);
      toast({
        title: "Error",
        description: "Failed to load work order",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "before" | "after"
  ) => {
    const files = Array.from(e.target.files || []);
    if (type === "before") {
      setPhotosBefore((prev) => [...prev, ...files]);
    } else {
      setPhotosAfter((prev) => [...prev, ...files]);
    }
  };

  const removePhoto = (index: number, type: "before" | "after") => {
    if (type === "before") {
      setPhotosBefore((prev) => prev.filter((_, i) => i !== index));
    } else {
      setPhotosAfter((prev) => prev.filter((_, i) => i !== index));
    }
  };

  // Signature canvas functions
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasSignature(true);
    setHasDrawnNewSignature(true); // Mark that user drew a new signature
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = signatureCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.lineTo(x, y);
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    setExistingSignature(null);
    setHasDrawnNewSignature(false);
  };

  const getSignatureDataUrl = (): string | null => {
    // If user drew a new signature, get it from canvas
    if (hasDrawnNewSignature) {
      const canvas = signatureCanvasRef.current;
      if (!canvas) return null;
      return canvas.toDataURL("image/png");
    }

    // Otherwise, return null (we'll use existing signature)
    return null;
  };

  const canSubmit = () => {
    const hasBeforePhotos =
      photosBefore.length > 0 || existingPhotosBefore.length > 0;
    const hasAfterPhotos =
      photosAfter.length > 0 || existingPhotosAfter.length > 0;
    const hasValidSignature = hasSignature || existingSignature;
    const hasClientName = clientName.trim() !== "";

    console.log("canSubmit check:", {
      hasBeforePhotos,
      hasAfterPhotos,
      hasValidSignature,
      hasClientName,
      photosBefore: photosBefore.length,
      existingPhotosBefore: existingPhotosBefore.length,
      photosAfter: photosAfter.length,
      existingPhotosAfter: existingPhotosAfter.length,
      hasSignature,
      existingSignature: !!existingSignature,
      clientName: clientName,
    });

    return (
      hasBeforePhotos && hasAfterPhotos && hasValidSignature && hasClientName
    );
  };

  const handleSubmit = async () => {
    if (!workOrder || !canSubmit()) return;

    try {
      setSubmitting(true);

      // Upload new photos to Supabase Storage (if any)
      let photosBeforeUrls = [...existingPhotosBefore];
      if (photosBefore.length > 0) {
        const newBeforeUrls = await uploadWorkOrderFiles(
          workOrder.wo_number,
          photosBefore,
          "before"
        );
        photosBeforeUrls = [...photosBeforeUrls, ...newBeforeUrls];
      }

      let photosAfterUrls = [...existingPhotosAfter];
      if (photosAfter.length > 0) {
        const newAfterUrls = await uploadWorkOrderFiles(
          workOrder.wo_number,
          photosAfter,
          "after"
        );
        photosAfterUrls = [...photosAfterUrls, ...newAfterUrls];
      }

      // Upload signature (if new one was drawn)
      const signatureDataUrl = getSignatureDataUrl();
      let signatureUrl: string | undefined = existingSignature || undefined;

      if (signatureDataUrl) {
        signatureUrl = await uploadSignature(
          workOrder.wo_number,
          signatureDataUrl
        );
      }

      // Complete work order
      await completeWorkOrder(workOrder.id, {
        technician_notes: notes,
        photos_before: photosBeforeUrls,
        photos_after: photosAfterUrls,
        client_signature: signatureUrl,
        client_signature_name: clientName,
      });

      toast({
        title: "Work Order Completed",
        description: "The work order has been completed successfully",
      });

      router.push(`/dashboard/workorders/${params.wo_number}`);
    } catch (error) {
      console.error("Error completing work order:", error);
      toast({
        title: "Error",
        description: "Failed to complete work order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!workOrder) {
    return null;
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/workorders/${params.wo_number}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Complete Work Order</h1>
          <p className="text-muted-foreground">
            {workOrder.wo_number} - {workOrder.title}
          </p>
        </div>
      </div>

      {/* Validation Alert */}
      {!canSubmit() && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please complete all required fields:
            <ul className="mt-2 ml-4 list-disc text-sm">
              {!(
                photosBefore.length > 0 || existingPhotosBefore.length > 0
              ) && <li>Photos Before (0 photos)</li>}
              {!(photosAfter.length > 0 || existingPhotosAfter.length > 0) && (
                <li>Photos After (0 photos)</li>
              )}
              {!(hasSignature || existingSignature) && (
                <li>Client Signature (no signature)</li>
              )}
              {clientName.trim() === "" && <li>Client Name (empty)</li>}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Technician Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Technician Notes
          </CardTitle>
          <CardDescription>
            Describe the work performed, any issues found, or additional
            observations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="E.g., Installed router in main rack. Configured WiFi network with new credentials. Client requested additional ethernet port for printer..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={6}
            disabled={submitting}
          />
        </CardContent>
      </Card>

      {/* Photos Before */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Before *
          </CardTitle>
          <CardDescription>
            Upload photos showing the initial state before starting work
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => handleFileUpload(e, "before")}
              disabled={submitting}
            />
          </div>

          {/* Existing Photos */}
          {existingPhotosBefore.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Existing Photos:</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {existingPhotosBefore.map((url, index) => (
                  <div key={`existing-before-${index}`} className="relative">
                    <img
                      src={url}
                      alt={`Existing Before ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border"
                    />
                    <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                      Existing
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* New Photos */}
          {photosBefore.length > 0 && (
            <div>
              {existingPhotosBefore.length > 0 && (
                <p className="text-sm font-medium mb-2">New Photos:</p>
              )}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {photosBefore.map((file, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Before ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removePhoto(index, "before")}
                      disabled={submitting}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      {file.name}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {photosBefore.length === 0 && existingPhotosBefore.length === 0 && (
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <Camera className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                No photos uploaded yet
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Photos After */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            After *
          </CardTitle>
          <CardDescription>
            Upload photos showing the completed work and final state
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => handleFileUpload(e, "after")}
              disabled={submitting}
            />
          </div>

          {/* Existing Photos */}
          {existingPhotosAfter.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Existing Photos:</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {existingPhotosAfter.map((url, index) => (
                  <div key={`existing-after-${index}`} className="relative">
                    <img
                      src={url}
                      alt={`Existing After ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border"
                    />
                    <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                      Existing
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* New Photos */}
          {photosAfter.length > 0 && (
            <div>
              {existingPhotosAfter.length > 0 && (
                <p className="text-sm font-medium mb-2">New Photos:</p>
              )}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {photosAfter.map((file, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`After ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removePhoto(index, "after")}
                      disabled={submitting}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      {file.name}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {photosAfter.length === 0 && existingPhotosAfter.length === 0 && (
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <Camera className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                No photos uploaded yet
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Client Signature */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PenTool className="h-5 w-5" />
            Client Signature *
          </CardTitle>
          <CardDescription>
            Client must sign to approve the completed work
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="clientName">Client Name *</Label>
            <Input
              id="clientName"
              placeholder="Full name of person signing"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              disabled={submitting}
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Signature</Label>
              <div className="flex items-center gap-2">
                {existingSignature && (
                  <span className="text-xs text-blue-600 font-medium">
                    Existing signature loaded
                  </span>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearSignature}
                  disabled={submitting}
                >
                  Clear
                </Button>
              </div>
            </div>
            <canvas
              ref={signatureCanvasRef}
              width={600}
              height={200}
              className="border rounded-lg cursor-crosshair bg-white w-full"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
            />
            <p className="text-xs text-muted-foreground">
              Draw signature above with mouse or touch
              {existingSignature && " (or keep existing signature)"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end gap-2">
        <Link href={`/dashboard/workorders/${params.wo_number}`}>
          <Button variant="outline" disabled={submitting}>
            Cancel
          </Button>
        </Link>
        <Button
          onClick={handleSubmit}
          disabled={!canSubmit() || submitting}
          size="lg"
        >
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Completing...
            </>
          ) : (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              Complete Work Order
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
