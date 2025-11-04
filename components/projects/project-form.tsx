"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getClients } from "@/lib/supabase/clients";
import { createProject, updateProject } from "@/lib/supabase/projects";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  description: z.string().optional(),
  client_id: z.string().min(1, "El cliente es requerido"),
  status: z.enum(["active", "completed", "on_hold", "cancelled"]),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  estimated_completion_date: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface ProjectFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: any;
  onSuccess?: () => void;
}

export function ProjectForm({
  open,
  onOpenChange,
  project,
  onSuccess,
}: ProjectFormProps) {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingClients, setLoadingClients] = useState(true);
  const isEditing = !!project;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      client_id: "",
      status: "active",
      start_date: "",
      end_date: "",
      estimated_completion_date: "",
    },
  });

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    if (project) {
      form.reset({
        name: project.name || "",
        description: project.description || "",
        client_id: project.client_id || "",
        status: project.status || "active",
        start_date: project.start_date || "",
        end_date: project.end_date || "",
        estimated_completion_date: project.estimated_completion_date || "",
      });
    } else {
      form.reset({
        name: "",
        description: "",
        client_id: "",
        status: "active",
        start_date: "",
        end_date: "",
        estimated_completion_date: "",
      });
    }
  }, [project, form]);

  const loadClients = async () => {
    try {
      setLoadingClients(true);
      const data = await getClients();
      setClients(data);
    } catch (error) {
      console.error("Error loading clients:", error);
      toast.error("Error al cargar clientes");
    } finally {
      setLoadingClients(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true);

      // Convert empty strings to null for optional date fields
      const projectData = {
        ...data,
        start_date: data.start_date || null,
        end_date: data.end_date || null,
        estimated_completion_date: data.estimated_completion_date || null,
      };

      if (isEditing) {
        await updateProject(project.id, projectData);
        toast.success("Proyecto actualizado exitosamente");
      } else {
        await createProject(projectData);
        toast.success("Proyecto creado exitosamente");
      }

      onOpenChange(false);
      form.reset();
      onSuccess?.();
    } catch (error) {
      console.error("Error saving project:", error);
      toast.error(
        isEditing ? "Error al actualizar proyecto" : "Error al crear proyecto"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Proyecto" : "Nuevo Proyecto"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Actualiza la información del proyecto."
              : "Completa la información para crear un nuevo proyecto."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Nombre <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ej: Implementación de Sistema"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe el proyecto..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Client */}
            <FormField
              control={form.control}
              name="client_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Cliente <span className="text-red-500">*</span>
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={loadingClients}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            loadingClients
                              ? "Cargando clientes..."
                              : "Selecciona un cliente"
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Status */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Estado <span className="text-red-500">*</span>
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un estado" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">Activo</SelectItem>
                      <SelectItem value="completed">Completado</SelectItem>
                      <SelectItem value="on_hold">En Espera</SelectItem>
                      <SelectItem value="cancelled">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Dates Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Start Date */}
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha de Inicio</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* End Date */}
              <FormField
                control={form.control}
                name="end_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha de Fin</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Estimated Completion Date */}
              <FormField
                control={form.control}
                name="estimated_completion_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha Estimada</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? "Actualizar" : "Crear"} Proyecto
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
