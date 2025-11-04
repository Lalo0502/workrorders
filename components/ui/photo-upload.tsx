"use client";

import { useRef, useState } from "react";
import { Camera, Upload, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase/client";

interface PhotoUploadProps {
  value?: string | null;
  onChange: (value: string) => void;
  name?: string;
}

export function PhotoUpload({
  value,
  onChange,
  name = "Usuario",
}: PhotoUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(value || null);
  const [uploading, setUploading] = useState(false);

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const uploadToSupabase = async (file: File): Promise<string | null> => {
    try {
      setUploading(true);

      // Generar un nombre único para el archivo
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random()
        .toString(36)
        .substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Subir el archivo a Supabase Storage
      const { data, error } = await supabase.storage
        .from("technicians")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
        console.error("Error uploading file:", error);
        alert("Error al subir la imagen");
        return null;
      }

      // Obtener la URL pública
      const {
        data: { publicUrl },
      } = supabase.storage.from("technicians").getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error("Error uploading to Supabase:", error);
      alert("Error al subir la imagen");
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validar que sea una imagen
      if (!file.type.startsWith("image/")) {
        alert("Por favor selecciona un archivo de imagen válido");
        return;
      }

      // Validar tamaño (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert("La imagen no debe superar los 5MB");
        return;
      }

      // Crear preview local
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Subir a Supabase
      const publicUrl = await uploadToSupabase(file);
      if (publicUrl) {
        onChange(publicUrl);
      }
    }
  };

  const handleCameraCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
      });

      // Crear un modal para mostrar la cámara
      const modal = document.createElement("div");
      modal.style.cssText =
        "position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.9);z-index:9999;display:flex;flex-direction:column;align-items:center;justify-content:center;";

      const video = document.createElement("video");
      video.style.cssText = "max-width:90%;max-height:70%;border-radius:8px;";
      video.srcObject = stream;
      video.autoplay = true;

      const captureBtn = document.createElement("button");
      captureBtn.textContent = "Capturar Foto";
      captureBtn.style.cssText =
        "margin-top:20px;padding:12px 24px;background:#fff;border:none;border-radius:6px;cursor:pointer;font-size:16px;";

      const cancelBtn = document.createElement("button");
      cancelBtn.textContent = "Cancelar";
      cancelBtn.style.cssText =
        "margin-top:10px;padding:8px 16px;background:#666;color:#fff;border:none;border-radius:6px;cursor:pointer;";

      modal.appendChild(video);
      modal.appendChild(captureBtn);
      modal.appendChild(cancelBtn);
      document.body.appendChild(modal);

      const cleanup = () => {
        stream.getTracks().forEach((track) => track.stop());
        document.body.removeChild(modal);
      };

      cancelBtn.onclick = cleanup;

      captureBtn.onclick = async () => {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0);

          // Convertir canvas a blob
          canvas.toBlob(
            async (blob) => {
              if (blob) {
                // Crear preview local
                const localUrl = URL.createObjectURL(blob);
                setPreview(localUrl);

                // Convertir blob a File para subir
                const file = new File([blob], `photo-${Date.now()}.jpg`, {
                  type: "image/jpeg",
                });
                const publicUrl = await uploadToSupabase(file);
                if (publicUrl) {
                  onChange(publicUrl);
                }
              }
            },
            "image/jpeg",
            0.8
          );
        }

        cleanup();
      };
    } catch (error) {
      console.error("Error accessing camera:", error);
      alert("No se pudo acceder a la cámara. Por favor verifica los permisos.");
    }
  };

  const handleRemove = async () => {
    // Si hay una URL de Supabase, intentar eliminar el archivo
    if (value && value.includes("supabase")) {
      try {
        const urlParts = value.split("/");
        const fileName = urlParts[urlParts.length - 1];

        await supabase.storage.from("technicians").remove([fileName]);
      } catch (error) {
        console.error("Error deleting file:", error);
      }
    }

    setPreview(null);
    onChange("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
      <Label>Fotografía</Label>

      <div className="flex items-center gap-4">
        {/* Avatar Preview */}
        <Avatar className="h-24 w-24">
          <AvatarImage src={preview || ""} alt={name} />
          <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
        </Avatar>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Subiendo...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Subir Foto
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCameraCapture}
              disabled={uploading}
            >
              <Camera className="mr-2 h-4 w-4" />
              Tomar Foto
            </Button>
          </div>

          {preview && !uploading && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              className="text-destructive"
            >
              <X className="mr-2 h-4 w-4" />
              Eliminar Foto
            </Button>
          )}

          <p className="text-xs text-muted-foreground">
            JPG, PNG o GIF (máx. 5MB)
          </p>
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}
