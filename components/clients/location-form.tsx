"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { ClientLocation } from "@/types";
import { createLocation, updateLocation } from "@/lib/supabase/locations";

const locationFormSchema = z.object({
  location_name: z.string().min(2, {
    message: "Location name must be at least 2 characters.",
  }),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip_code: z.string().optional(),
  country: z.string().optional(),
  poc_name: z.string().optional(),
  poc_email: z
    .string()
    .email({
      message: "Please enter a valid email address.",
    })
    .optional()
    .or(z.literal("")),
  poc_phone: z.string().optional(),
  poc_title: z.string().optional(),
  is_primary: z.boolean().default(false),
  notes: z.string().optional(),
});

type LocationFormValues = z.infer<typeof locationFormSchema>;

interface LocationFormProps {
  clientId: string;
  location?: ClientLocation | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function LocationForm({
  clientId,
  location,
  open,
  onOpenChange,
  onSuccess,
}: LocationFormProps) {
  const [isLoading, setIsLoading] = React.useState(false);

  const form = useForm<LocationFormValues>({
    resolver: zodResolver(locationFormSchema),
    defaultValues: {
      location_name: location?.location_name || "",
      address: location?.address || "",
      city: location?.city || "",
      state: location?.state || "",
      zip_code: location?.zip_code || "",
      country: location?.country || "USA",
      poc_name: location?.poc_name || "",
      poc_email: location?.poc_email || "",
      poc_phone: location?.poc_phone || "",
      poc_title: location?.poc_title || "",
      is_primary: location?.is_primary || false,
      notes: location?.notes || "",
    },
  });

  React.useEffect(() => {
    if (location) {
      form.reset({
        location_name: location.location_name,
        address: location.address || "",
        city: location.city || "",
        state: location.state || "",
        zip_code: location.zip_code || "",
        country: location.country || "USA",
        poc_name: location.poc_name || "",
        poc_email: location.poc_email || "",
        poc_phone: location.poc_phone || "",
        poc_title: location.poc_title || "",
        is_primary: location.is_primary,
        notes: location.notes || "",
      });
    } else {
      form.reset({
        location_name: "",
        address: "",
        city: "",
        state: "",
        zip_code: "",
        country: "USA",
        poc_name: "",
        poc_email: "",
        poc_phone: "",
        poc_title: "",
        is_primary: false,
        notes: "",
      });
    }
  }, [location, form]);

  async function handleSubmit(data: LocationFormValues) {
    setIsLoading(true);
    try {
      const locationData = {
        ...data,
        client_id: clientId,
      };

      if (location) {
        await updateLocation(location.id, locationData);
      } else {
        await createLocation(locationData);
      }

      form.reset();
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {location ? "Edit Location" : "Add Location"}
          </DialogTitle>
          <DialogDescription>
            {location
              ? "Update location and point of contact information."
              : "Add a new location with point of contact details."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
          >
            {/* Location Information Section */}
            <div className="space-y-4">
              <div className="text-sm font-semibold">Location Information</div>

              <FormField
                control={form.control}
                name="location_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location Name *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Main Campus, Downtown Office"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Street Address</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="123 Main St"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="City"
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
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="State"
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
                  name="zip_code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ZIP Code</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="12345"
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
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="USA"
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
                name="is_primary"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Set as Primary Location</FormLabel>
                      <FormDescription>
                        This will be the default location for this client
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            {/* Point of Contact Section */}
            <div className="space-y-4">
              <div className="text-sm font-semibold">Point of Contact</div>

              <FormField
                control={form.control}
                name="poc_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="John Doe"
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
                name="poc_title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title/Position</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Facility Manager"
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
                name="poc_email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="contact@example.com"
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
                name="poc_phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input
                        type="tel"
                        placeholder="(555) 123-4567"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Notes Section */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional notes about this location..."
                      className="resize-none"
                      rows={3}
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {location ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
