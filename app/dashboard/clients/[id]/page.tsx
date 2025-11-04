"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  Mail,
  Phone,
  Building2,
  Plus,
  Edit,
  Trash2,
  Globe,
  CheckCircle2,
  XCircle,
  Calendar,
  MapPinned,
  User,
  Briefcase,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DataTable } from "@/components/shared/data-table";
import { getLocationColumns } from "@/components/clients/location-columns";
import { LocationForm } from "@/components/clients/location-form";
import { LocationDetailsDialog } from "@/components/clients/location-details-dialog";
import { ClientForm, ClientFormData } from "@/components/clients/client-form";
import { Client, ClientLocation, Project } from "@/types";
import { getClientById, updateClient } from "@/lib/supabase/clients";
import {
  getLocationsByClient,
  deleteLocation,
  setPrimaryLocation,
  createLocation,
  updateLocation,
} from "@/lib/supabase/locations";
import { getProjects } from "@/lib/supabase/projects";
import { toast } from "sonner";

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;

  const [client, setClient] = useState<Client | null>(null);
  const [locations, setLocations] = useState<ClientLocation[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLocationFormOpen, setIsLocationFormOpen] = useState(false);
  const [isClientFormOpen, setIsClientFormOpen] = useState(false);
  const [isLocationDetailsOpen, setIsLocationDetailsOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] =
    useState<ClientLocation | null>(null);

  useEffect(() => {
    loadClientData();
  }, [clientId]);

  const loadClientData = async () => {
    try {
      setLoading(true);
      const [clientData, locationsData, allProjects] = await Promise.all([
        getClientById(clientId),
        getLocationsByClient(clientId),
        getProjects(),
      ]);

      if (clientData) {
        setClient(clientData);
      } else {
        toast.error("Client not found");
        router.push("/dashboard/clients");
      }

      setLocations(locationsData || []);

      // Filter projects by client_id
      const clientProjects = (allProjects as Project[]).filter(
        (project) => project.client_id === clientId
      );
      setProjects(clientProjects);
    } catch (error) {
      console.error("Error loading client data:", error);
      toast.error("Failed to load client data");
    } finally {
      setLoading(false);
    }
  };

  const handleEditLocation = (location: ClientLocation) => {
    setSelectedLocation(location);
    setIsLocationFormOpen(true);
  };

  const handleViewLocationDetails = (location: ClientLocation) => {
    setSelectedLocation(location);
    setIsLocationDetailsOpen(true);
  };

  const handleDeleteLocation = async (location: ClientLocation) => {
    if (!confirm(`Delete location "${location.location_name}"?`)) return;

    try {
      await deleteLocation(location.id);
      toast.success("Location deleted successfully");
      loadClientData();
    } catch (error) {
      console.error("Error deleting location:", error);
      toast.error("Failed to delete location");
    }
  };

  const handleSetPrimary = async (location: ClientLocation) => {
    try {
      await setPrimaryLocation(clientId, location.id);
      toast.success(`"${location.location_name}" set as primary location`);
      loadClientData();
    } catch (error) {
      console.error("Error setting primary location:", error);
      toast.error("Failed to set primary location");
    }
  };

  const handleLocationFormSuccess = () => {
    setIsLocationFormOpen(false);
    setSelectedLocation(null);
    loadClientData();
  };

  const handleClientSubmit = async (data: ClientFormData) => {
    try {
      // Update client data
      await updateClient(clientId, data.client);

      // Handle locations
      if (data.locations) {
        const currentLocationIds = locations.map((loc) => loc.id);
        const submittedLocations = data.locations as any[]; // Type assertion for locations that may have id
        const submittedLocationIds = submittedLocations
          .filter((loc) => loc.id)
          .map((loc) => loc.id);

        // Delete locations that were removed
        const locationsToDelete = currentLocationIds.filter(
          (id) => !submittedLocationIds.includes(id)
        );
        for (const id of locationsToDelete) {
          await deleteLocation(id);
        }

        // Create or update locations
        for (const location of submittedLocations) {
          if (location.id) {
            // Update existing location
            await updateLocation(location.id, location);
          } else {
            // Create new location
            await createLocation({
              ...location,
              client_id: clientId,
              active: true,
            });
          }
        }
      }

      toast.success("Client updated successfully");
      setIsClientFormOpen(false);
      loadClientData();
    } catch (error) {
      console.error("Error updating client:", error);
      toast.error("Failed to update client");
      throw error;
    }
  };

  const columns = getLocationColumns({
    onEdit: handleEditLocation,
    onDelete: handleDeleteLocation,
    onSetPrimary: handleSetPrimary,
    onViewDetails: handleViewLocationDetails,
  });

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!client) {
    return null;
  }

  const primaryLocation = locations.find((loc) => loc.is_primary);

  return (
    <div className="space-y-6">
      {/* Enhanced Header with Stats */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/dashboard/clients")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight">
                  {client.name}
                </h1>
                <Badge
                  variant={client.active ? "default" : "secondary"}
                  className="h-6"
                >
                  {client.active ? (
                    <>
                      <CheckCircle2 className="mr-1 h-3 w-3" /> Active
                    </>
                  ) : (
                    <>
                      <XCircle className="mr-1 h-3 w-3" /> Inactive
                    </>
                  )}
                </Badge>
              </div>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                {client.email && (
                  <div className="flex items-center gap-1.5">
                    <Mail className="h-4 w-4" />
                    <a
                      href={`mailto:${client.email}`}
                      className="hover:text-foreground hover:underline"
                    >
                      {client.email}
                    </a>
                  </div>
                )}
                {client.phone && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="h-4 w-4" />
                    <a
                      href={`tel:${client.phone}`}
                      className="hover:text-foreground hover:underline"
                    >
                      {client.phone}
                    </a>
                  </div>
                )}
                {client.website && (
                  <div className="flex items-center gap-1.5">
                    <Globe className="h-4 w-4" />
                    <a
                      href={client.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-foreground hover:underline"
                    >
                      {client.website.replace(/^https?:\/\//, "")}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsClientFormOpen(true)}
              title="Edit Client"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="text-red-600 hover:text-red-700"
              title="Delete Client"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Locations
                  </p>
                  <p className="text-2xl font-bold">{locations.length}</p>
                </div>
                <MapPinned className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Active Projects
                  </p>
                  <p className="text-2xl font-bold">0</p>
                </div>
                <Briefcase className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Primary Location
                  </p>
                  <p className="text-sm font-semibold truncate">
                    {primaryLocation?.location_name || "Not set"}
                  </p>
                </div>
                <Building2 className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Created
                  </p>
                  <p className="text-sm font-semibold">
                    {new Date(client.created_at).toLocaleDateString()}
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="locations">
            Locations ({locations.length})
          </TabsTrigger>
          <TabsTrigger value="projects">
            Projects ({projects.length})
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Primary Location Card */}
            {primaryLocation ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-primary" />
                        Primary Location
                      </CardTitle>
                      <CardDescription>Main office location</CardDescription>
                    </div>
                    <Badge variant="default">Primary</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="font-semibold text-lg">
                      {primaryLocation.location_name}
                    </div>
                    {primaryLocation.address && (
                      <div className="text-sm text-muted-foreground mt-1">
                        {primaryLocation.address}
                      </div>
                    )}
                    {(primaryLocation.city ||
                      primaryLocation.state ||
                      primaryLocation.zip_code) && (
                      <div className="text-sm text-muted-foreground">
                        {[
                          primaryLocation.city,
                          primaryLocation.state,
                          primaryLocation.zip_code,
                        ]
                          .filter(Boolean)
                          .join(", ")}
                      </div>
                    )}
                  </div>

                  {primaryLocation.poc_name && (
                    <>
                      <Separator />
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <User className="h-4 w-4 text-muted-foreground" />
                          Point of Contact
                        </div>
                        <div className="pl-6 space-y-2">
                          <div>
                            <div className="font-medium">
                              {primaryLocation.poc_name}
                            </div>
                            {primaryLocation.poc_title && (
                              <div className="text-sm text-muted-foreground">
                                {primaryLocation.poc_title}
                              </div>
                            )}
                          </div>
                          {primaryLocation.poc_email && (
                            <a
                              href={`mailto:${primaryLocation.poc_email}`}
                              className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                            >
                              <Mail className="h-3.5 w-3.5" />
                              {primaryLocation.poc_email}
                            </a>
                          )}
                          {primaryLocation.poc_phone && (
                            <a
                              href={`tel:${primaryLocation.poc_phone}`}
                              className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                            >
                              <Phone className="h-3.5 w-3.5" />
                              {primaryLocation.poc_phone}
                            </a>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  {primaryLocation.notes && (
                    <>
                      <Separator />
                      <div>
                        <div className="text-sm font-medium mb-2">
                          Location Notes
                        </div>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {primaryLocation.notes}
                        </p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                    Primary Location
                  </CardTitle>
                  <CardDescription>No primary location set</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Building2 className="mx-auto h-12 w-12 text-muted-foreground/50" />
                    <p className="mt-4 text-sm text-muted-foreground">
                      Add a location and mark it as primary
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4"
                      onClick={() => {
                        setSelectedLocation(null);
                        setIsLocationFormOpen(true);
                      }}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Location
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Client Details Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  Client Details
                </CardTitle>
                <CardDescription>Additional information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  {client.address && (
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-1">
                        Address
                      </div>
                      <div className="text-sm">{client.address}</div>
                    </div>
                  )}

                  <Separator />

                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">
                      Status
                    </div>
                    <Badge variant={client.active ? "default" : "secondary"}>
                      {client.active ? (
                        <>
                          <CheckCircle2 className="mr-1 h-3 w-3" /> Active
                        </>
                      ) : (
                        <>
                          <XCircle className="mr-1 h-3 w-3" /> Inactive
                        </>
                      )}
                    </Badge>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-1">
                        Created
                      </div>
                      <div className="text-sm">
                        {new Date(client.created_at).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          }
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-1">
                        Last Updated
                      </div>
                      <div className="text-sm">
                        {new Date(client.updated_at).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          }
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Notes */}
          {client.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
                <CardDescription>
                  Additional information about this client
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {client.notes}
                </p>
              </CardContent>
            </Card>
          )}

          {/* All Locations Preview */}
          {locations.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>All Locations</CardTitle>
                    <CardDescription>
                      Quick view of all locations
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const tabsList = document.querySelector(
                        '[value="locations"]'
                      ) as HTMLElement;
                      tabsList?.click();
                    }}
                  >
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {locations.slice(0, 6).map((location) => (
                    <div
                      key={location.id}
                      className="rounded-lg border p-3 hover:bg-accent cursor-pointer transition-colors"
                      onClick={() => {
                        setSelectedLocation(location);
                        setIsLocationDetailsOpen(true);
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">
                            {location.location_name}
                          </div>
                          <div className="text-xs text-muted-foreground truncate mt-1">
                            {[location.city, location.state]
                              .filter(Boolean)
                              .join(", ") || "No address"}
                          </div>
                        </div>
                        {location.is_primary && (
                          <Badge variant="secondary" className="ml-2 text-xs">
                            Primary
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {locations.length > 6 && (
                  <div className="text-center mt-4">
                    <p className="text-sm text-muted-foreground">
                      +{locations.length - 6} more location
                      {locations.length - 6 !== 1 ? "s" : ""}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Locations Tab */}
        <TabsContent value="locations" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Locations</h2>
              <p className="text-muted-foreground">
                Manage locations for this client
              </p>
            </div>
            <Button
              onClick={() => {
                setSelectedLocation(null);
                setIsLocationFormOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Location
            </Button>
          </div>

          <DataTable columns={columns} data={locations} />
        </TabsContent>

        {/* Projects Tab */}
        <TabsContent value="projects" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Projects</h2>
              <p className="text-muted-foreground">
                Projects associated with this client
              </p>
            </div>
            <Button
              onClick={() =>
                router.push(`/dashboard/projects/new?client_id=${clientId}`)
              }
            >
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </div>

          {projects.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Projects Yet</h3>
                <p className="text-sm text-muted-foreground text-center mb-4">
                  This client doesn't have any projects yet.
                </p>
                <Button
                  onClick={() =>
                    router.push(`/dashboard/projects/new?client_id=${clientId}`)
                  }
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Project
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <Card
                  key={project.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() =>
                    router.push(`/dashboard/projects/${project.id}`)
                  }
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg line-clamp-1">
                          {project.name}
                        </CardTitle>
                        <CardDescription className="line-clamp-2 mt-1">
                          {project.description || "No description"}
                        </CardDescription>
                      </div>
                      <Badge
                        variant={
                          project.status === "active"
                            ? "default"
                            : project.status === "completed"
                            ? "secondary"
                            : project.status === "on_hold"
                            ? "outline"
                            : "destructive"
                        }
                      >
                        {project.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      {project.start_date && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>
                            Started:{" "}
                            {new Date(project.start_date).toLocaleDateString(
                              "en-US",
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              }
                            )}
                          </span>
                        </div>
                      )}
                      {project.estimated_completion_date && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>
                            Est. Completion:{" "}
                            {new Date(
                              project.estimated_completion_date
                            ).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Location Form Dialog */}
      <LocationForm
        clientId={clientId}
        location={selectedLocation}
        open={isLocationFormOpen}
        onOpenChange={(open) => {
          setIsLocationFormOpen(open);
          if (!open) setSelectedLocation(null);
        }}
        onSuccess={handleLocationFormSuccess}
      />

      {/* Location Details Dialog */}
      <LocationDetailsDialog
        location={selectedLocation}
        open={isLocationDetailsOpen}
        onOpenChange={(open) => {
          setIsLocationDetailsOpen(open);
          if (!open) setSelectedLocation(null);
        }}
      />

      {/* Client Edit Form Dialog */}
      <ClientForm
        client={{
          ...client,
          locations: locations,
        }}
        open={isClientFormOpen}
        onOpenChange={setIsClientFormOpen}
        onSubmit={handleClientSubmit}
      />
    </div>
  );
}
