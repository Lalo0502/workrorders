import { Search, X, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterConfig {
  key: string;
  label: string;
  options: FilterOption[];
}

interface AdvancedSearchProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filters?: FilterConfig[];
  activeFilters?: Record<string, string>;
  onFilterChange?: (key: string, value: string) => void;
  onClearFilters?: () => void;
  showFilters?: boolean;
  onToggleFilters?: () => void;
}

export function AdvancedSearch({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search...",
  filters = [],
  activeFilters = {},
  onFilterChange,
  onClearFilters,
  showFilters = false,
  onToggleFilters,
}: AdvancedSearchProps) {
  const activeFilterCount = Object.values(activeFilters).filter(Boolean).length;

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 pr-9"
          />
          {searchValue && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSearchChange("")}
              className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 p-0 hover:bg-transparent"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {filters.length > 0 && onToggleFilters && (
          <Button variant="outline" onClick={onToggleFilters} className="gap-2">
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-1 px-1 py-0 text-xs">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        )}
      </div>

      {/* Filters Panel */}
      {showFilters && filters.length > 0 && (
        <div className="rounded-lg border bg-muted/50 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium">Filters</h3>
            {activeFilterCount > 0 && onClearFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearFilters}
                className="h-7 text-xs"
              >
                Clear all
              </Button>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filters.map((filter) => (
              <div key={filter.key} className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">
                  {filter.label}
                </label>
                <Select
                  value={activeFilters[filter.key] || "all"}
                  onValueChange={(value) =>
                    onFilterChange?.(filter.key, value === "all" ? "" : value)
                  }
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {filter.options.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Filter Tags */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(activeFilters).map(([key, value]) => {
            if (!value) return null;
            const filter = filters.find((f) => f.key === key);
            const option = filter?.options.find((o) => o.value === value);
            return (
              <Badge key={key} variant="secondary" className="gap-1">
                <span className="text-xs">
                  {filter?.label}: {option?.label}
                </span>
                <button
                  onClick={() => onFilterChange?.(key, "")}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}
