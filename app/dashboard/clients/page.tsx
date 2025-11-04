"use client";

import { useEffect, useState, useMemo } from "react";
import { Plus, Users } from "lucide-react";
import { toast } from "sonner";

import { ClientCardList } from "@/components/clients/client-card-list";
import { Pagination } from "@/components/shared/pagination";
import { usePagination } from "@/hooks/use-pagination";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingState } from "@/components/shared/loading-state";
import {
  AdvancedFilterSort,
  MultiFilterConfig,
  SortOption,
} from "@/components/shared/advanced-filter-sort";
import { ClientForm, ClientFormData } from "@/components/clients/client-form";
import {
  getClients,
  createClient,
  updateClient,
  deleteClient,
} from "@/lib/supabase/clients";
import { createLocation, getLocationsByClient } from "@/lib/supabase/locations";
import { Client } from "@/types";

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  // Search, filter, and sort state
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>(
    {}
  );
  const [sortBy, setSortBy] = useState("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    fetchClients();
  }, []);

  async function fetchClients() {
    try {
      setLoading(true);
      const data = await getClients();
      setClients(data);
    } catch (error) {
      console.error("Error fetching clients:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(data: ClientFormData) {
    try {
      if (selectedClient) {
        // Update existing client (only client data, not locations)
        await updateClient(selectedClient.id, data.client);
        toast.success("Client updated successfully");
      } else {
        // Create new client with locations
        const newClient = await createClient({ ...data.client, active: true });

        // Create locations if any
        if (data.locations && data.locations.length > 0) {
          for (const location of data.locations) {
            await createLocation({
              ...location,
              client_id: newClient.id,
              active: true,
            });
          }
          toast.success(
            `Client created with ${data.locations.length} location(s)`
          );
        } else {
          toast.success("Client created successfully");
        }
      }

      await fetchClients();
      setDialogOpen(false);
      setSelectedClient(null);
    } catch (error) {
      console.error("Error saving client:", error);
      toast.error("Failed to save client");
    }
  }

  async function handleEdit(client: Client) {
    try {
      // Load locations for this client
      const locations = await getLocationsByClient(client.id);
      setSelectedClient({
        ...client,
        locations: locations || [],
      } as any);
      setDialogOpen(true);
    } catch (error) {
      console.error("Error loading client locations:", error);
      toast.error("Failed to load client locations");
      // Still open dialog with client data
      setSelectedClient(client);
      setDialogOpen(true);
    }
  }

  async function handleDelete(client: Client) {
    if (confirm(`Are you sure you want to delete ${client.name}?`)) {
      try {
        await deleteClient(client.id);
        await fetchClients();
        toast.success("Client deleted successfully");
      } catch (error) {
        console.error("Error deleting client:", error);
        toast.error("Failed to delete client");
      }
    }
  }

  function handleNew() {
    setSelectedClient(null);
    setDialogOpen(true);
  }

  // Filter configuration (multi-select)
  const filterConfigs: MultiFilterConfig[] = [
    {
      key: "status",
      label: "Status",
      type: "multiple",
      options: [
        { label: "Active", value: "active" },
        { label: "Inactive", value: "inactive" },
      ],
    },
    {
      key: "industry",
      label: "Industry",
      type: "multiple",
      options: [
        { label: "Technology", value: "technology" },
        { label: "Healthcare", value: "healthcare" },
        { label: "Finance", value: "finance" },
        { label: "Manufacturing", value: "manufacturing" },
        { label: "Retail", value: "retail" },
        { label: "Education", value: "education" },
        { label: "Other", value: "other" },
      ],
    },
  ];

  // Sort configuration
  const sortOptions: SortOption[] = [
    { label: "Client Name (A-Z)", value: "name" },
    { label: "Email", value: "email" },
    { label: "Industry", value: "industry" },
    { label: "Created Date", value: "created_at" },
  ];

  // Filter, search, and sort clients
  const filteredClients = useMemo(() => {
    let result = [...clients];

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (client) =>
          client.name.toLowerCase().includes(query) ||
          client.email?.toLowerCase().includes(query) ||
          client.phone?.toLowerCase().includes(query) ||
          client.industry?.toLowerCase().includes(query) ||
          client.address?.toLowerCase().includes(query)
      );
    }

    // Apply multi-select filters
    if (activeFilters.status && activeFilters.status.length > 0) {
      result = result.filter((client) => {
        if (activeFilters.status.includes("active") && client.active)
          return true;
        if (activeFilters.status.includes("inactive") && !client.active)
          return true;
        return false;
      });
    }

    if (activeFilters.industry && activeFilters.industry.length > 0) {
      result = result.filter((client) =>
        activeFilters.industry.includes(client.industry || "")
      );
    }

    // Apply sorting
    if (sortBy) {
      result.sort((a, b) => {
        let aValue: any = a[sortBy as keyof Client];
        let bValue: any = b[sortBy as keyof Client];

        // Handle null/undefined
        if (aValue == null) aValue = "";
        if (bValue == null) bValue = "";

        // Convert to lowercase for string comparison
        if (typeof aValue === "string") aValue = aValue.toLowerCase();
        if (typeof bValue === "string") bValue = bValue.toLowerCase();

        if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
        if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [clients, searchQuery, activeFilters, sortBy, sortDirection]);

  // Pagination
  const pagination = usePagination<Client>({
    totalItems: filteredClients.length,
    initialPageSize: 10,
  });

  // Get paginated data
  const paginatedClients = pagination.paginateData(filteredClients);

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header Section */}
      <PageHeader
        icon={Users}
        title="Clients"
        description="Manage your client database"
        actionLabel="New Client"
        actionIcon={Plus}
        onAction={handleNew}
      />

      {/* Search, Filters, and Sort */}
      <AdvancedFilterSort
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search clients by name, email, phone, industry..."
        filters={filterConfigs}
        activeFilters={activeFilters}
        onFilterChange={(key, values) =>
          setActiveFilters((prev) => ({ ...prev, [key]: values }))
        }
        onClearFilters={() => setActiveFilters({})}
        sortOptions={sortOptions}
        sortBy={sortBy}
        sortDirection={sortDirection}
        onSortChange={(field, direction) => {
          setSortBy(field);
          setSortDirection(direction);
        }}
      />

      {/* Clients Grid */}
      {loading ? (
        <LoadingState message="Loading clients..." />
      ) : clients.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No clients yet"
          description="Get started by creating your first client"
          actionLabel="Create Client"
          actionIcon={Plus}
          onAction={handleNew}
        />
      ) : (
        <div className="space-y-6">
          <ClientCardList
            clients={paginatedClients}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            pageSize={pagination.pageSize}
            totalItems={pagination.totalItems}
            onPageChange={pagination.goToPage}
            onPageSizeChange={pagination.setPageSize}
          />
        </div>
      )}

      <ClientForm
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        client={selectedClient}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
