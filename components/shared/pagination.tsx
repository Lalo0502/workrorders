/**
 * Pagination Component
 *
 * A reusable pagination component that can be used independently
 * or integrated with data tables for better user experience.
 */

import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  pageSizeOptions?: number[];
  showPageSizeSelector?: boolean;
  showPageInfo?: boolean;
  showItemsInfo?: boolean;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 30, 40, 50, 100],
  showPageSizeSelector = true,
  showPageInfo = true,
  showItemsInfo = true,
  className = "",
}: PaginationProps) {
  const canGoPrevious = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  // Calculate which page numbers to show
  const getPageNumbers = () => {
    const pages: (number | "ellipsis")[] = [];
    const maxVisible = 5; // Maximum number of page buttons to show

    if (totalPages <= maxVisible) {
      // Show all pages if total is less than max visible
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      // Calculate range around current page
      let startPage = Math.max(2, currentPage - 1);
      let endPage = Math.min(totalPages - 1, currentPage + 1);

      // Adjust if we're near the start
      if (currentPage <= 3) {
        startPage = 2;
        endPage = 4;
      }

      // Adjust if we're near the end
      if (currentPage >= totalPages - 2) {
        startPage = totalPages - 3;
        endPage = totalPages - 1;
      }

      // Add ellipsis after first page if needed
      if (startPage > 2) {
        pages.push("ellipsis");
      }

      // Add middle pages
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }

      // Add ellipsis before last page if needed
      if (endPage < totalPages - 1) {
        pages.push("ellipsis");
      }

      // Always show last page
      pages.push(totalPages);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  // Calculate items range
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div
      className={`flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between ${className}`}
    >
      {/* Items info */}
      {showItemsInfo && (
        <div className="text-sm text-muted-foreground">
          {totalItems > 0 ? (
            <>
              Showing <span className="font-medium">{startItem}</span> to{" "}
              <span className="font-medium">{endItem}</span> of{" "}
              <span className="font-medium">{totalItems}</span> results
            </>
          ) : (
            <>No results</>
          )}
        </div>
      )}

      {/* Pagination controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
        {/* Page size selector */}
        {showPageSizeSelector && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium whitespace-nowrap">
              Rows per page
            </span>
            <Select
              value={`${pageSize}`}
              onValueChange={(value) => onPageSizeChange(Number(value))}
            >
              <SelectTrigger className="h-9 w-[70px]">
                <SelectValue placeholder={pageSize} />
              </SelectTrigger>
              <SelectContent side="top">
                {pageSizeOptions.map((size) => (
                  <SelectItem key={size} value={`${size}`}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Page info and navigation */}
        <div className="flex items-center gap-2">
          {/* Navigation buttons */}
          <div className="flex items-center gap-1">
            {/* First page */}
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9"
              onClick={() => onPageChange(1)}
              disabled={!canGoPrevious}
              title="First page"
            >
              <ChevronsLeft className="h-4 w-4" />
              <span className="sr-only">First page</span>
            </Button>

            {/* Previous page */}
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={!canGoPrevious}
              title="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Previous page</span>
            </Button>

            {/* Page numbers */}
            {showPageInfo && (
              <div className="hidden md:flex items-center gap-1">
                {pageNumbers.map((page, index) =>
                  page === "ellipsis" ? (
                    <div
                      key={`ellipsis-${index}`}
                      className="flex h-9 w-9 items-center justify-center"
                    >
                      <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                    </div>
                  ) : (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="icon"
                      className="h-9 w-9"
                      onClick={() => onPageChange(page)}
                    >
                      {page}
                    </Button>
                  )
                )}
              </div>
            )}

            {/* Mobile page info */}
            {showPageInfo && (
              <div className="flex md:hidden items-center justify-center min-w-[80px]">
                <span className="text-sm font-medium">
                  {currentPage} / {totalPages}
                </span>
              </div>
            )}

            {/* Next page */}
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={!canGoNext}
              title="Next page"
            >
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only">Next page</span>
            </Button>

            {/* Last page */}
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9"
              onClick={() => onPageChange(totalPages)}
              disabled={!canGoNext}
              title="Last page"
            >
              <ChevronsRight className="h-4 w-4" />
              <span className="sr-only">Last page</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
