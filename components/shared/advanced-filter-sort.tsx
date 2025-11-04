"use client";

import { useState } from "react";
import {
  Search,
  X,
  SlidersHorizontal,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Check,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export interface FilterOption {
  value: string;
  label: string;
}

export interface MultiFilterConfig {
  key: string;
  label: string;
  options: FilterOption[];
  type?: "single" | "multiple";
}

export interface SortOption {
  value: string;
  label: string;
}

interface AdvancedFilterSortProps {
  // Search
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;

  // Filters (multi-select)
  filters?: MultiFilterConfig[];
  activeFilters?: Record<string, string[]>;
  onFilterChange?: (key: string, values: string[]) => void;
  onClearFilters?: () => void;

  // Sorting
  sortOptions?: SortOption[];
  sortBy?: string;
  sortDirection?: "asc" | "desc";
  onSortChange?: (sortBy: string, direction: "asc" | "desc") => void;

  // UI
  className?: string;
}

export function AdvancedFilterSort({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search...",
  filters = [],
  activeFilters = {},
  onFilterChange,
  onClearFilters,
  sortOptions = [],
  sortBy = "",
  sortDirection = "asc",
  onSortChange,
  className = "",
}: AdvancedFilterSortProps) {
  const [showFilters, setShowFilters] = useState(false);

  const activeFilterCount = Object.values(activeFilters).reduce(
    (count, values) => count + values.length,
    0
  );

  const handleToggleFilter = (filterKey: string, value: string) => {
    const currentValues = activeFilters[filterKey] || [];
    const newValues = currentValues.includes(value)
      ? currentValues.filter((v) => v !== value)
      : [...currentValues, value];

    onFilterChange?.(filterKey, newValues);
  };

  const handleClearFilter = (filterKey: string) => {
    onFilterChange?.(filterKey, []);
  };

  const handleRemoveFilterValue = (filterKey: string, value: string) => {
    const currentValues = activeFilters[filterKey] || [];
    onFilterChange?.(
      filterKey,
      currentValues.filter((v) => v !== value)
    );
  };

  const handleToggleSortDirection = () => {
    if (sortBy && onSortChange) {
      onSortChange(sortBy, sortDirection === "asc" ? "desc" : "asc");
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search and Actions Bar */}
      <div className="flex flex-col gap-2 sm:flex-row">
        {/* Search Input */}
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

        {/* Actions */}
        <div className="flex gap-2">
          {/* Sort Dropdown */}
          {sortOptions.length > 0 && (
            <Select
              value={sortBy || "default"}
              onValueChange={(value) => {
                if (value === "default") {
                  onSortChange?.("", "asc");
                } else {
                  onSortChange?.(value, sortDirection);
                }
              }}
            >
              <SelectTrigger className="w-[180px]">
                <ArrowUpDown className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Sort by..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default order</SelectItem>
                <Separator className="my-1" />
                {sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Sort Direction Toggle */}
          {sortBy && (
            <Button
              variant="outline"
              size="icon"
              onClick={handleToggleSortDirection}
              title={`Sort ${
                sortDirection === "asc" ? "descending" : "ascending"
              }`}
            >
              {sortDirection === "asc" ? (
                <ArrowUp className="h-4 w-4" />
              ) : (
                <ArrowDown className="h-4 w-4" />
              )}
            </Button>
          )}

          {/* Filters Toggle */}
          {filters.length > 0 && (
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2"
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span className="hidden sm:inline">Filters</span>
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && filters.length > 0 && (
        <div className="rounded-lg border bg-muted/50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-medium">Filter Options</h3>
            {activeFilterCount > 0 && (
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

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filters.map((filter) => (
              <div key={filter.key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium text-muted-foreground">
                    {filter.label}
                  </Label>
                  {activeFilters[filter.key]?.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleClearFilter(filter.key)}
                      className="h-5 px-1 text-xs hover:text-destructive"
                    >
                      Clear
                    </Button>
                  )}
                </div>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between text-left font-normal"
                    >
                      <span className="truncate">
                        {activeFilters[filter.key]?.length > 0
                          ? `${activeFilters[filter.key].length} selected`
                          : "Select options..."}
                      </span>
                      <SlidersHorizontal className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[200px] p-0" align="start">
                    <div className="max-h-[300px] overflow-y-auto p-2">
                      {filter.options.map((option) => {
                        const isSelected = activeFilters[filter.key]?.includes(
                          option.value
                        );
                        return (
                          <div
                            key={option.value}
                            className="flex items-center space-x-2 rounded-sm px-2 py-1.5 hover:bg-accent cursor-pointer"
                            onClick={() =>
                              handleToggleFilter(filter.key, option.value)
                            }
                          >
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() =>
                                handleToggleFilter(filter.key, option.value)
                              }
                            />
                            <Label className="flex-1 cursor-pointer text-sm font-normal">
                              {option.label}
                            </Label>
                            {isSelected && (
                              <Check className="h-4 w-4 text-primary" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Filter Tags */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(activeFilters).map(([key, values]) => {
            if (!values || values.length === 0) return null;

            const filter = filters.find((f) => f.key === key);
            return values.map((value) => {
              const option = filter?.options.find((o) => o.value === value);
              return (
                <Badge
                  key={`${key}-${value}`}
                  variant="secondary"
                  className="gap-1.5 pr-1"
                >
                  <span className="text-xs">
                    {filter?.label}: {option?.label}
                  </span>
                  <button
                    onClick={() => handleRemoveFilterValue(key, value)}
                    className="ml-1 rounded-sm p-0.5 hover:bg-accent hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              );
            });
          })}
        </div>
      )}

      {/* Sort Info Badge */}
      {sortBy && (
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1.5">
            {sortDirection === "asc" ? (
              <ArrowUp className="h-3 w-3" />
            ) : (
              <ArrowDown className="h-3 w-3" />
            )}
            <span className="text-xs">
              Sorted by: {sortOptions.find((s) => s.value === sortBy)?.label}
            </span>
            <button
              onClick={() => onSortChange?.("", "asc")}
              className="ml-1 rounded-sm p-0.5 hover:bg-accent"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        </div>
      )}
    </div>
  );
}
