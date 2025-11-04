"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Edit,
  Download,
  Trash2,
  Building2,
  FileText,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { generateQuotePDF } from "@/lib/pdf/quote-pdf";
import { getQuoteItems } from "@/lib/supabase/quotes";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const statusConfig = {
  draft: {
    label: "Draft",
    icon: FileText,
    color: "bg-gray-100 text-gray-700 border-gray-200",
    dotColor: "bg-gray-500",
  },
  sent: {
    label: "Sent",
    icon: Send,
    color: "bg-blue-100 text-blue-700 border-blue-200",
    dotColor: "bg-blue-500",
  },
  approved: {
    label: "Approved",
    icon: CheckCircle2,
    color: "bg-green-100 text-green-700 border-green-200",
    dotColor: "bg-green-500",
  },
  rejected: {
    label: "Rejected",
    icon: XCircle,
    color: "bg-red-100 text-red-700 border-red-200",
    dotColor: "bg-red-500",
  },
  expired: {
    label: "Expired",
    icon: AlertCircle,
    color: "bg-orange-100 text-orange-700 border-orange-200",
    dotColor: "bg-orange-500",
  },
  converted: {
    label: "Converted",
    icon: CheckCircle2,
    color: "bg-purple-100 text-purple-700 border-purple-200",
    dotColor: "bg-purple-500",
  },
};

export const QuoteColumns: ColumnDef<any>[] = [
  {
    accessorKey: "quote_number",
    header: "Quote",
    cell: ({ row }) => {
      const router = useRouter();
      return (
        <div
          className="flex items-center gap-3 group cursor-pointer"
          onClick={() =>
            router.push(`/dashboard/quotes/${row.original.quote_number}`)
          }
        >
          <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
            <FileText className="h-4 w-4 text-primary" />
          </div>
          <div>
            <div className="font-semibold text-sm group-hover:text-primary transition-colors">
              {row.getValue("quote_number")}
            </div>
            <div className="text-xs text-muted-foreground">
              {format(new Date(row.original.issue_date), "MMM dd, yyyy")}
            </div>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "title",
    header: "Details",
    cell: ({ row }) => {
      const client = row.original.clients;
      return (
        <div className="max-w-[350px]">
          <div className="font-medium text-sm mb-1 truncate">
            {row.getValue("title")}
          </div>
          {client && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Building2 className="h-3 w-3" />
              <span className="truncate">{client.name}</span>
            </div>
          )}
          {row.original.description && (
            <div className="text-xs text-muted-foreground mt-1 truncate">
              {row.original.description}
            </div>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      const config =
        statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
      const StatusIcon = config.icon;

      return (
        <Badge
          className={cn(
            "text-xs font-medium border px-2.5 py-1 gap-1.5",
            config.color
          )}
          variant="secondary"
        >
          <StatusIcon className="h-3 w-3" />
          {config.label}
        </Badge>
      );
    },
  },
  {
    accessorKey: "total",
    header: () => <div className="text-right">Amount</div>,
    cell: ({ row }) => {
      const total = parseFloat(row.getValue("total") || "0");
      return (
        <div className="text-right">
          <div className="font-bold text-base">
            $
            {total.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
          {row.original.discount_value > 0 && (
            <div className="text-xs text-red-600 flex items-center justify-end gap-1">
              <span>
                {row.original.discount_type === "percentage"
                  ? `${row.original.discount_value}% off`
                  : `$${row.original.discount_value} off`}
              </span>
            </div>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "valid_until",
    header: () => <div className="text-center">Validity</div>,
    cell: ({ row }) => {
      const date = row.getValue("valid_until");
      const issueDate = new Date(row.original.issue_date);

      if (!date) {
        return (
          <div className="text-center">
            <span className="text-xs text-muted-foreground">No expiry</span>
          </div>
        );
      }

      const validDate = new Date(date as string);
      const today = new Date();
      const daysRemaining = differenceInDays(validDate, today);
      const isExpired =
        validDate < today &&
        row.original.status !== "approved" &&
        row.original.status !== "converted";

      const isExpiringSoon = daysRemaining <= 7 && daysRemaining > 0;

      return (
        <div className="text-center space-y-1">
          <div
            className={cn(
              "text-xs font-medium",
              isExpired && "text-red-600",
              isExpiringSoon && "text-orange-600",
              !isExpired && !isExpiringSoon && "text-muted-foreground"
            )}
          >
            {format(validDate, "MMM dd, yyyy")}
          </div>
          <div className="flex items-center justify-center gap-1">
            {isExpired ? (
              <Badge
                variant="destructive"
                className="text-[10px] px-1.5 py-0 h-5"
              >
                <XCircle className="h-2.5 w-2.5 mr-1" />
                Expired
              </Badge>
            ) : isExpiringSoon ? (
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 h-5 border-orange-300 text-orange-700 bg-orange-50"
              >
                <Clock className="h-2.5 w-2.5 mr-1" />
                {daysRemaining}d left
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 h-5 border-green-300 text-green-700 bg-green-50"
              >
                <CheckCircle2 className="h-2.5 w-2.5 mr-1" />
                {daysRemaining}d left
              </Badge>
            )}
          </div>
        </div>
      );
    },
  },
  {
    id: "actions",
    header: () => <div className="text-center">Actions</div>,
    cell: ({ row }) => {
      const quote = row.original;
      const router = useRouter();

      const handleEdit = () => {
        router.push(`/dashboard/quotes/${quote.quote_number}/edit`);
      };

      const handleDownload = async () => {
        try {
          const items = await getQuoteItems(quote.id);
          await generateQuotePDF({
            quote,
            client: quote.clients || null,
            project: quote.projects || null,
            items,
          });
        } catch (error) {
          console.error("Error generating quote PDF from table:", error);
          toast.error("Failed to generate PDF");
        }
      };

      const handleDelete = () => {
        // TODO: Implement delete
        console.log("Delete quote:", quote.id);
      };

      return (
        <div className="flex items-center justify-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDownload}
                  className="h-8 w-8 hover:bg-green-50 hover:text-green-600"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Download PDF</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleEdit}
                  className="h-8 w-8 hover:bg-blue-50 hover:text-blue-600"
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Edit</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDelete}
                  className="h-8 w-8 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Delete</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      );
    },
  },
];
