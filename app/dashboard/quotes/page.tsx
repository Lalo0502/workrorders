"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/shared/data-table";
import {
  AdvancedFilterSort,
  MultiFilterConfig,
  SortOption,
} from "@/components/shared/advanced-filter-sort";
import { Pagination } from "@/components/shared/pagination";
import { FileText, Plus, RefreshCw } from "lucide-react";
import { getQuotes } from "@/lib/supabase/quotes";
import { QuoteColumns } from "@/components/quotes/quote-columns";
import { toast } from "sonner";

export default function QuotesPage() {
  const router = useRouter();
  const [quotes, setQuotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Search and Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>(
    {}
  );
  const [sortBy, setSortBy] = useState("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    loadQuotes();
  }, []);

  const loadQuotes = async () => {
    try {
      setLoading(true);
      const data = await getQuotes();
      setQuotes(data);
    } catch (error) {
      console.error("Error loading quotes:", error);
      toast.error("Failed to load quotes");
    } finally {
      setLoading(false);
    }
  };

  // Filter Configuration
  const filterConfigs: MultiFilterConfig[] = [
    {
      key: "status",
      label: "Status",
      options: [
        { value: "draft", label: "Draft" },
        { value: "sent", label: "Sent" },
        { value: "approved", label: "Approved" },
        { value: "rejected", label: "Rejected" },
        { value: "expired", label: "Expired" },
        { value: "converted", label: "Converted" },
      ],
    },
  ];

  // Sort Options
  const sortOptions: SortOption[] = [
    { value: "quote_number", label: "Quote Number" },
    { value: "issue_date", label: "Issue Date" },
    { value: "valid_until", label: "Valid Until" },
    { value: "total", label: "Total Amount" },
    { value: "created_at", label: "Created Date" },
  ];

  // Apply filters, search, and sorting
  const filteredAndSortedQuotes = useMemo(() => {
    let result = [...quotes];

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (quote) =>
          quote.quote_number?.toLowerCase().includes(query) ||
          quote.title?.toLowerCase().includes(query) ||
          quote.clients?.name?.toLowerCase().includes(query)
      );
    }

    // Apply filters
    Object.entries(activeFilters).forEach(([key, values]) => {
      if (values.length > 0) {
        result = result.filter((quote) => values.includes(quote[key]));
      }
    });

    // Apply sorting
    if (sortBy) {
      result.sort((a, b) => {
        let aValue = a[sortBy];
        let bValue = b[sortBy];

        // Handle nested properties (like clients.name)
        if (sortBy.includes(".")) {
          const keys = sortBy.split(".");
          aValue = keys.reduce((obj, key) => obj?.[key], a);
          bValue = keys.reduce((obj, key) => obj?.[key], b);
        }

        // Handle null/undefined
        if (aValue == null) return 1;
        if (bValue == null) return -1;

        // Handle numbers
        if (typeof aValue === "number" && typeof bValue === "number") {
          return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
        }

        // Handle strings
        const aStr = String(aValue).toLowerCase();
        const bStr = String(bValue).toLowerCase();

        if (sortDirection === "asc") {
          return aStr.localeCompare(bStr);
        } else {
          return bStr.localeCompare(aStr);
        }
      });
    }

    return result;
  }, [quotes, searchQuery, activeFilters, sortBy, sortDirection]);

  // Paginate results
  const paginatedQuotes = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredAndSortedQuotes.slice(startIndex, endIndex);
  }, [filteredAndSortedQuotes, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredAndSortedQuotes.length / pageSize);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeFilters, sortBy, sortDirection]);

  const handleFilterChange = (key: string, values: string[]) => {
    setActiveFilters((prev) => ({
      ...prev,
      [key]: values,
    }));
  };

  const handleClearFilters = () => {
    setActiveFilters({});
    setSearchQuery("");
    setSortBy("");
    setSortDirection("asc");
  };

  const handleSortChange = (newSortBy: string, direction: "asc" | "desc") => {
    setSortBy(newSortBy);
    setSortDirection(direction);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          icon={FileText}
          title="Quotes"
          description="Manage customer quotes and proposals"
        />
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={loadQuotes}
            title="Refresh"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button onClick={() => router.push("/dashboard/quotes/new")}>
            <Plus className="h-4 w-4 mr-2" />
            New Quote
          </Button>
        </div>
      </div>

      {/* Filters and Sort */}
      <AdvancedFilterSort
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search by quote number, title, or client..."
        filters={filterConfigs}
        activeFilters={activeFilters}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
        sortOptions={sortOptions}
        sortBy={sortBy}
        sortDirection={sortDirection}
        onSortChange={handleSortChange}
      />

      {/* Data Table */}
      <Card>
        {loading ? (
          <div className="p-8 text-center">
            <div className="flex justify-center items-center space-x-2">
              <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
              <span className="text-muted-foreground">Loading quotes...</span>
            </div>
          </div>
        ) : filteredAndSortedQuotes.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No quotes found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || Object.keys(activeFilters).length > 0
                ? "Try adjusting your search or filters"
                : "Get started by creating your first quote"}
            </p>
            {!searchQuery && Object.keys(activeFilters).length === 0 && (
              <Button onClick={() => router.push("/dashboard/quotes/new")}>
                <Plus className="h-4 w-4 mr-2" />
                Create Quote
              </Button>
            )}
          </div>
        ) : (
          <DataTable columns={QuoteColumns} data={paginatedQuotes} />
        )}
      </Card>

      {/* Pagination */}
      {!loading && filteredAndSortedQuotes.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={filteredAndSortedQuotes.length}
          onPageChange={setCurrentPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setCurrentPage(1);
          }}
        />
      )}
    </div>
  );
}
