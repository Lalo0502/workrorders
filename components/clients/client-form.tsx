"use client";

import * as React from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Loader2,
  Plus,
  X,
  MapPin,
  Building2,
  Mail,
  Phone as PhoneIcon,
  Globe,
  Briefcase,
  FileText,
  Check,
  Edit,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogPortal,
  DialogClose,
} from "@/components/ui/dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const locationSchema = z.object({
  location_name: z.string().min(2, "Location name required"),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip_code: z.string().optional(),
  country: z.string().default("USA"),
  poc_name: z.string().optional(),
  poc_email: z.string().email("Invalid email").optional().or(z.literal("")),
  poc_phone: z.string().optional(),
  poc_title: z.string().optional(),
  is_primary: z.boolean().default(false),
  notes: z.string().optional(),
});

const clientFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  website: z.string().optional(),
  notes: z.string().optional(),
  locations: z.array(locationSchema).optional(),
});

type ClientFormValues = z.infer<typeof clientFormSchema>;

export interface ClientFormData {
  client: Omit<ClientFormValues, "locations">;
  locations?: Array<
    Omit<z.infer<typeof locationSchema>, "is_primary"> & { is_primary: boolean }
  >;
}

interface ClientFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: any;
  onSubmit: (data: ClientFormData) => Promise<void>;
}

export function ClientForm({
  open,
  onOpenChange,
  client,
  onSubmit,
}: ClientFormProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [locationModalOpen, setLocationModalOpen] = React.useState(false);
  const [editingLocationIndex, setEditingLocationIndex] = React.useState<
    number | null
  >(null);

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      address: "",
      website: "",
      notes: "",
      locations: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "locations",
  });

  React.useEffect(() => {
    if (client && open) {
      form.reset({
        name: client.name || "",
        email: client.email || "",
        phone: client.phone || "",
        address: client.address || "",
        website: client.website || "",
        notes: client.notes || "",
        locations: client.locations || [],
      });
    } else if (!open) {
      form.reset({
        name: "",
        email: "",
        phone: "",
        address: "",
        website: "",
        notes: "",
        locations: [],
      });
    }
  }, [client, open, form]);

  async function handleSubmit(data: ClientFormValues) {
    try {
      setIsLoading(true);
      const { locations, ...clientData } = data;
      await onSubmit({
        client: clientData,
        locations: locations?.map((loc) => ({
          ...loc,
          country: loc.country || "USA",
          is_primary: loc.is_primary || false,
        })),
      });
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error("Failed to save client:", error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`max-w-4xl max-h-[90vh] overflow-hidden flex flex-col transition-all duration-300 ${
          locationModalOpen ? "!left-[30%]" : ""
        }`}
        onInteractOutside={(e) => {
          // Prevent closing when location modal is open
          if (locationModalOpen) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-xl">
            {client ? "Edit Client" : "New Client"}
          </DialogTitle>
          <DialogDescription>
            {client
              ? "Update client information"
              : "Complete the form to add a new client"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-1">
          <Form {...form}>
            <form
              id="client-form"
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-6"
            >
              {/* Basic Information Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <h3 className="text-sm font-semibold text-blue-600">
                    🏢 Basic Information
                  </h3>
                </div>

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Company Name <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Acme Corporation"
                          className="h-11"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              {/* Contact Information Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <h3 className="text-sm font-semibold text-green-600">
                    📧 Contact Information
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="contact@acme.com"
                            className="h-11"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="(555) 123-4567"
                            className="h-11"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://www.acme.com"
                          className="h-11"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              {/* Notes Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <h3 className="text-sm font-semibold text-amber-600">
                    📝 Additional Notes
                  </h3>
                </div>

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea
                          placeholder="Any additional information about this client..."
                          className="min-h-[100px] resize-none"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormDescription>
                        {field.value?.length || 0}/500 characters
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              {/* Locations Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b">
                  <h3 className="text-sm font-semibold text-indigo-600">
                    🗺️ Additional Locations
                  </h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingLocationIndex(null);
                      setLocationModalOpen(true);
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Location
                  </Button>
                </div>

                {fields.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                    <MapPin className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                      No locations
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Get started by adding a location.
                    </p>
                  </div>
                ) : (
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Location Name</TableHead>
                          <TableHead>City, State</TableHead>
                          <TableHead>Contact</TableHead>
                          <TableHead className="text-center">Primary</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {fields.map((field, index) => (
                          <TableRow key={field.id}>
                            <TableCell className="font-medium">
                              {form.watch(`locations.${index}.location_name`) ||
                                `Location ${index + 1}`}
                            </TableCell>
                            <TableCell>
                              {[
                                form.watch(`locations.${index}.city`),
                                form.watch(`locations.${index}.state`),
                              ]
                                .filter(Boolean)
                                .join(", ") || "-"}
                            </TableCell>
                            <TableCell>
                              {form.watch(`locations.${index}.poc_name`) || "-"}
                            </TableCell>
                            <TableCell className="text-center">
                              {form.watch(`locations.${index}.is_primary`) && (
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100">
                                  <Check className="h-4 w-4 text-indigo-600" />
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => {
                                    setEditingLocationIndex(index);
                                    setLocationModalOpen(true);
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => remove(index)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </form>
          </Form>
        </div>
        <DialogFooter className="px-6 py-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              onOpenChange(false);
            }}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" form="client-form" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {client ? "Update" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Location Modal - Slides from right without overlay */}
      <Dialog
        open={locationModalOpen}
        onOpenChange={setLocationModalOpen}
        modal={false}
      >
        <DialogPortal>
          <DialogPrimitive.Content
            className="fixed right-[5%] top-1/2 -translate-y-1/2 z-[100] grid w-full max-w-2xl max-h-[90vh] gap-4 border bg-background p-6 shadow-lg duration-300 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:rounded-lg overflow-y-auto"
            onPointerDownOutside={(e) => {
              e.preventDefault();
            }}
            onInteractOutside={(e) => {
              e.preventDefault();
            }}
          >
            <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </DialogPrimitive.Close>

            <DialogHeader>
              <DialogTitle>
                {editingLocationIndex !== null
                  ? "Edit Location"
                  : "Add Location"}
              </DialogTitle>
              <DialogDescription>
                {editingLocationIndex !== null
                  ? "Update the location details."
                  : "Add a new location for this client."}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {editingLocationIndex !== null ? (
                // Edit Mode - Using FormFields with controlled state
                <Form {...form}>
                  <FormField
                    control={form.control}
                    name={`locations.${editingLocationIndex}.location_name`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location Name *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Main Office"
                            className="h-11"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`locations.${editingLocationIndex}.address`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="123 Business St"
                            className="h-11"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name={`locations.${editingLocationIndex}.city`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="City"
                              className="h-11"
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`locations.${editingLocationIndex}.state`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="CA"
                              className="h-11"
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`locations.${editingLocationIndex}.zip_code`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ZIP</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="12345"
                              className="h-11"
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name={`locations.${editingLocationIndex}.poc_name`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="John Doe"
                              className="h-11"
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`locations.${editingLocationIndex}.poc_email`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact Email</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="john@acme.com"
                              className="h-11"
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name={`locations.${editingLocationIndex}.poc_phone`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact Phone</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="(555) 123-4567"
                              className="h-11"
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`locations.${editingLocationIndex}.poc_title`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact Title</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Manager"
                              className="h-11"
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name={`locations.${editingLocationIndex}.notes`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Location notes..."
                            className="min-h-[80px] resize-none"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`locations.${editingLocationIndex}.is_primary`}
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Primary Location</FormLabel>
                          <FormDescription>
                            Mark this as the main location for this client
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </Form>
              ) : (
                // Add Mode - Create new location without FormFields (to be added via append)
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">
                      Location Name *
                    </label>
                    <Input
                      id="new-location-name"
                      placeholder="Main Office"
                      className="h-11 mt-2"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Address</label>
                    <Input
                      id="new-address"
                      placeholder="123 Business St"
                      className="h-11 mt-2"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium">City</label>
                      <Input
                        id="new-city"
                        placeholder="City"
                        className="h-11 mt-2"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">State</label>
                      <Input
                        id="new-state"
                        placeholder="CA"
                        className="h-11 mt-2"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">ZIP</label>
                      <Input
                        id="new-zip"
                        placeholder="12345"
                        className="h-11 mt-2"
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">
                        Contact Name
                      </label>
                      <Input
                        id="new-poc-name"
                        placeholder="John Doe"
                        className="h-11 mt-2"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">
                        Contact Email
                      </label>
                      <Input
                        id="new-poc-email"
                        type="email"
                        placeholder="john@acme.com"
                        className="h-11 mt-2"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">
                        Contact Phone
                      </label>
                      <Input
                        id="new-poc-phone"
                        placeholder="(555) 123-4567"
                        className="h-11 mt-2"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">
                        Contact Title
                      </label>
                      <Input
                        id="new-poc-title"
                        placeholder="Manager"
                        className="h-11 mt-2"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Notes</label>
                    <Textarea
                      id="new-notes"
                      placeholder="Location notes..."
                      className="min-h-[80px] resize-none mt-2"
                    />
                  </div>

                  <div className="flex items-start space-x-3 rounded-md border p-4">
                    <Checkbox id="new-is-primary" />
                    <div className="space-y-1 leading-none">
                      <label
                        htmlFor="new-is-primary"
                        className="text-sm font-medium cursor-pointer"
                      >
                        Primary Location
                      </label>
                      <p className="text-sm text-muted-foreground">
                        Mark this as the main location for this client
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setLocationModalOpen(false);
                  setEditingLocationIndex(null);
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => {
                  if (editingLocationIndex !== null) {
                    // Edit mode - just close modal, changes are already in form state
                    setLocationModalOpen(false);
                    setEditingLocationIndex(null);
                  } else {
                    // Add mode - collect values and append
                    const locationName =
                      (
                        document.getElementById(
                          "new-location-name"
                        ) as HTMLInputElement
                      )?.value || "";
                    const address =
                      (
                        document.getElementById(
                          "new-address"
                        ) as HTMLInputElement
                      )?.value || "";
                    const city =
                      (document.getElementById("new-city") as HTMLInputElement)
                        ?.value || "";
                    const state =
                      (document.getElementById("new-state") as HTMLInputElement)
                        ?.value || "";
                    const zipCode =
                      (document.getElementById("new-zip") as HTMLInputElement)
                        ?.value || "";
                    const pocName =
                      (
                        document.getElementById(
                          "new-poc-name"
                        ) as HTMLInputElement
                      )?.value || "";
                    const pocEmail =
                      (
                        document.getElementById(
                          "new-poc-email"
                        ) as HTMLInputElement
                      )?.value || "";
                    const pocPhone =
                      (
                        document.getElementById(
                          "new-poc-phone"
                        ) as HTMLInputElement
                      )?.value || "";
                    const pocTitle =
                      (
                        document.getElementById(
                          "new-poc-title"
                        ) as HTMLInputElement
                      )?.value || "";
                    const notes =
                      (
                        document.getElementById(
                          "new-notes"
                        ) as HTMLTextAreaElement
                      )?.value || "";
                    const isPrimary =
                      (
                        document.getElementById(
                          "new-is-primary"
                        ) as HTMLInputElement
                      )?.checked || fields.length === 0;

                    if (!locationName) {
                      alert("Location name is required");
                      return;
                    }

                    append({
                      location_name: locationName,
                      address,
                      city,
                      state,
                      zip_code: zipCode,
                      country: "USA",
                      poc_name: pocName,
                      poc_email: pocEmail,
                      poc_phone: pocPhone,
                      poc_title: pocTitle,
                      is_primary: isPrimary,
                      notes,
                    });

                    // Clear form fields after adding
                    (
                      document.getElementById(
                        "new-location-name"
                      ) as HTMLInputElement
                    ).value = "";
                    (
                      document.getElementById("new-address") as HTMLInputElement
                    ).value = "";
                    (
                      document.getElementById("new-city") as HTMLInputElement
                    ).value = "";
                    (
                      document.getElementById("new-state") as HTMLInputElement
                    ).value = "";
                    (
                      document.getElementById("new-zip") as HTMLInputElement
                    ).value = "";
                    (
                      document.getElementById(
                        "new-poc-name"
                      ) as HTMLInputElement
                    ).value = "";
                    (
                      document.getElementById(
                        "new-poc-email"
                      ) as HTMLInputElement
                    ).value = "";
                    (
                      document.getElementById(
                        "new-poc-phone"
                      ) as HTMLInputElement
                    ).value = "";
                    (
                      document.getElementById(
                        "new-poc-title"
                      ) as HTMLInputElement
                    ).value = "";
                    (
                      document.getElementById(
                        "new-notes"
                      ) as HTMLTextAreaElement
                    ).value = "";
                    (
                      document.getElementById(
                        "new-is-primary"
                      ) as HTMLInputElement
                    ).checked = false;
                  }
                }}
              >
                {editingLocationIndex !== null
                  ? "Save Changes"
                  : "Add Location"}
              </Button>
            </DialogFooter>
          </DialogPrimitive.Content>
        </DialogPortal>
      </Dialog>
    </Dialog>
  );
}
