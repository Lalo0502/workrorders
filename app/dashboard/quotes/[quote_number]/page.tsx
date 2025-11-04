"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/shared/page-header";
import { QuoteActivityLog } from "@/components/quotes/quote-activity-log";
import { AssociateWorkOrderDialog } from "@/components/quotes/associate-work-order-dialog";
import {
  FileText,
  RefreshCw,
  Edit,
  Download,
  Trash2,
  Calendar,
  User,
  Briefcase,
  DollarSign,
  FileCheck,
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Plus,
  Link as LinkIcon,
  X,
} from "lucide-react";
import {
  getQuotes,
  getQuoteItems,
  updateQuote,
  createQuoteLog,
  getWorkOrderByQuoteId,
} from "@/lib/supabase/quotes";
import { deleteQuote } from "@/lib/supabase/quotes";
import { generateQuotePDF } from "@/lib/pdf/quote-pdf";
import { supabase } from "@/lib/supabase/client";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const statusConfig = {
  draft: {
    label: "Draft",
    color: "bg-gray-100 text-gray-800",
  },
  sent: {
    label: "Sent",
    color: "bg-blue-100 text-blue-800",
  },
  approved: {
    label: "Approved",
    color: "bg-green-100 text-green-800",
  },
  rejected: {
    label: "Rejected",
    color: "bg-red-100 text-red-800",
  },
  expired: {
    label: "Expired",
    color: "bg-orange-100 text-orange-800",
  },
  converted: {
    label: "Converted",
    color: "bg-purple-100 text-purple-800",
  },
};

export default function QuoteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const quoteNumber = params.quote_number as string;

  const [quote, setQuote] = useState<any>(null);
  const [quoteItems, setQuoteItems] = useState<any[]>([]);
  const [workOrder, setWorkOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [showAssociateDialog, setShowAssociateDialog] = useState(false);

  useEffect(() => {
    loadQuote();
  }, [quoteNumber]);

  const loadQuote = async () => {
    try {
      setLoading(true);
      const quotes = await getQuotes();
      const found = quotes.find((q: any) => q.quote_number === quoteNumber);

      if (!found) {
        toast.error("Quote not found");
        router.push("/dashboard/quotes");
        return;
      }

      setQuote(found);

      // Load quote items
      const items = await getQuoteItems((found as any).id);
      setQuoteItems(items);

      // Check if quote has an associated work order
      const wo = await getWorkOrderByQuoteId((found as any).id);
      setWorkOrder(wo);
    } catch (error) {
      console.error("Error loading quote:", error);
      toast.error("Failed to load quote");
      router.push("/dashboard/quotes");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      setUpdatingStatus(true);
      const oldStatus = quote.status;

      await updateQuote(quote.id, { status: newStatus } as any);

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Create log entry
      await createQuoteLog({
        quote_id: quote.id,
        action: "status_changed",
        field_name: "status",
        old_value: oldStatus,
        new_value: newStatus,
        notes: `Status changed from ${oldStatus} to ${newStatus}`,
      });

      setQuote({ ...quote, status: newStatus });
      toast.success("Status updated successfully");
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleUnlinkWorkOrder = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (
      !confirm(
        "Are you sure you want to unlink this work order from the quote?"
      )
    ) {
      return;
    }

    try {
      // Update work order to remove quote_id
      const { error } = await (supabase as any)
        .from("work_orders")
        .update({ quote_id: null })
        .eq("id", workOrder.id);

      if (error) throw error;

      // Update quote status back to approved or sent
      await (supabase as any)
        .from("quotes")
        .update({ status: "approved" })
        .eq("id", quote.id);

      // Log the unlinking
      await createQuoteLog({
        quote_id: quote.id,
        action: "wo_unlinked",
        notes: `Work Order ${workOrder.wo_number} unlinked from quote`,
      });

      toast.success("Work Order unlinked successfully");
      loadQuote(); // Reload to update UI
    } catch (error) {
      console.error("Error unlinking work order:", error);
      toast.error("Failed to unlink work order");
    }
  };

  const handleDownload = async () => {
    try {
      await generateQuotePDF({
        quote,
        client: quote.clients || null,
        project: quote.projects || null,
        items: quoteItems,
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF");
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this quote? This action cannot be undone."
      )
    ) {
      return;
    }
    try {
      await deleteQuote(quote.id);
      toast.success("Quote deleted");
      router.push("/dashboard/quotes");
    } catch (error) {
      console.error("Error deleting quote:", error);
      toast.error("Failed to delete quote");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader icon={FileText} title="Loading..." description="" />
        <Card className="p-8">
          <div className="flex justify-center items-center space-x-2">
            <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
            <span className="text-muted-foreground">Loading quote...</span>
          </div>
        </Card>
      </div>
    );
  }

  if (!quote) {
    return null;
  }

  const statusInfo =
    statusConfig[quote.status as keyof typeof statusConfig] ||
    statusConfig.draft;

  const isExpired =
    quote.valid_until &&
    new Date(quote.valid_until) < new Date() &&
    quote.status !== "approved" &&
    quote.status !== "converted";

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex flex-col gap-4">
        <Button
          variant="ghost"
          className="w-fit"
          onClick={() => router.push("/dashboard/quotes")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Quotes
        </Button>

        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  {quote.quote_number}
                </h1>
                <p className="text-lg text-muted-foreground">{quote.title}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Select
              value={quote.status}
              onValueChange={handleStatusChange}
              disabled={updatingStatus}
            >
              <SelectTrigger
                className={cn(
                  "h-8 border-0 gap-1 text-xs font-medium px-2.5 w-auto",
                  statusInfo.color
                )}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">
                  <span className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-gray-500" />
                    Draft
                  </span>
                </SelectItem>
                <SelectItem value="sent">
                  <span className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    Sent
                  </span>
                </SelectItem>
                <SelectItem value="approved">
                  <span className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    Approved
                  </span>
                </SelectItem>
                <SelectItem value="rejected">
                  <span className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    Rejected
                  </span>
                </SelectItem>
                <SelectItem value="expired">
                  <span className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-orange-500" />
                    Expired
                  </span>
                </SelectItem>
                <SelectItem value="converted">
                  <span className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-purple-500" />
                    Converted
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={() =>
                router.push(`/dashboard/quotes/${quote.quote_number}/edit`)
              }
              title="Edit quote"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleDownload}
              title="Download PDF"
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleDelete}
              title="Delete quote"
              className="hover:bg-red-50 hover:text-red-600 hover:border-red-200"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Work Order Association Status */}
      {!loading && (
        <div className="flex items-center gap-2">
          {workOrder ? (
            <div className="flex items-center gap-1">
              <Badge
                variant="outline"
                className="cursor-pointer hover:bg-purple-50 border-purple-300 text-purple-700 pr-1"
                onClick={() =>
                  router.push(`/dashboard/workorders/${workOrder.wo_number}`)
                }
              >
                <FileCheck className="h-3 w-3 mr-1" />
                {workOrder.wo_number}
                <button
                  onClick={handleUnlinkWorkOrder}
                  className="ml-1 hover:bg-purple-100 rounded-full p-0.5"
                  title="Unlink Work Order"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            </div>
          ) : (
            <>
              <Badge
                variant="outline"
                className="cursor-pointer hover:bg-green-50 border-green-300 text-green-700"
                onClick={() =>
                  router.push(
                    `/dashboard/workorders/new?from_quote=${quote.id}`
                  )
                }
              >
                <Plus className="h-3 w-3 mr-1" />
                Create WO
              </Badge>
              <Badge
                variant="outline"
                className="cursor-pointer hover:bg-blue-50 border-blue-300 text-blue-700"
                onClick={() => setShowAssociateDialog(true)}
              >
                <LinkIcon className="h-3 w-3 mr-1" />
                Associate WO
              </Badge>
            </>
          )}
        </div>
      )}

      <AssociateWorkOrderDialog
        open={showAssociateDialog}
        onOpenChange={setShowAssociateDialog}
        quoteId={quote?.id}
        quoteNumber={quoteNumber}
        clientId={quote?.client_id}
        onSuccess={loadQuote}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Left 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          {/* Client & Project Info - Redesigned */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Client Card */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Building2 className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Client
                    </p>
                    <p className="font-semibold text-lg">
                      {quote.clients?.name || "N/A"}
                    </p>
                    {quote.clients?.email && (
                      <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        <span>{quote.clients.email}</span>
                      </div>
                    )}
                    {quote.clients?.phone && (
                      <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        <span>{quote.clients.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Project Card */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Briefcase className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Project
                    </p>
                    <p className="font-semibold text-lg">
                      {quote.projects?.name || "No project assigned"}
                    </p>
                    {quote.projects?.location && (
                      <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span>{quote.projects.location}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Dates Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Issued</p>
                    <p className="font-semibold">
                      {format(new Date(quote.issue_date), "MMM dd, yyyy")}
                    </p>
                  </div>
                </div>

                {quote.valid_until && (
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "p-2 rounded-lg",
                        isExpired ? "bg-red-100" : "bg-orange-100"
                      )}
                    >
                      {isExpired ? (
                        <XCircle className="h-5 w-5 text-red-600" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-orange-600" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Valid Until
                      </p>
                      <p
                        className={cn(
                          "font-semibold",
                          isExpired && "text-red-600"
                        )}
                      >
                        {format(new Date(quote.valid_until), "MMM dd, yyyy")}
                      </p>
                      {isExpired && (
                        <p className="text-xs text-red-600">Expired</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          {quote.description && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {quote.description}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Quote Items */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-semibold">
                        Description
                      </TableHead>
                      <TableHead className="text-right font-semibold">
                        Qty
                      </TableHead>
                      <TableHead className="text-right font-semibold">
                        Unit Price
                      </TableHead>
                      <TableHead className="text-right font-semibold">
                        Subtotal
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {quoteItems.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="text-center text-muted-foreground py-8"
                        >
                          No items found
                        </TableCell>
                      </TableRow>
                    ) : (
                      quoteItems.map((item: any) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {item.description}
                              </div>
                              {item.notes && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  {item.notes}
                                </div>
                              )}
                              {item.item_type === "material" && (
                                <div className="text-xs text-blue-600 mt-1">
                                  From catalog
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            {item.quantity}
                          </TableCell>
                          <TableCell className="text-right">
                            ${item.unit_price.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            ${item.subtotal.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Terms and Conditions - Collapsible */}
          {quote.terms_and_conditions && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Terms and Conditions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/30 rounded-lg p-4">
                  <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">
                    {quote.terms_and_conditions}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Internal Notes */}
          {quote.internal_notes && (
            <Card className="border-orange-200 bg-orange-50/50">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2 text-orange-800">
                  <AlertCircle className="h-4 w-4" />
                  Internal Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-orange-900/70 whitespace-pre-wrap">
                  {quote.internal_notes}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Activity Log */}
          <QuoteActivityLog quoteId={quote.id} />
        </div>

        {/* Sidebar - Pricing Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader className="bg-primary/5">
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Pricing Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">
                  ${quote.subtotal.toFixed(2)}
                </span>
              </div>

              {quote.apply_tax && (
                <>
                  <Separator />
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Tax ({quote.tax_rate}%)
                    </span>
                    <span className="font-medium">
                      ${quote.tax_amount.toFixed(2)}
                    </span>
                  </div>
                </>
              )}

              {quote.discount_value > 0 && (
                <>
                  <Separator />
                  <div className="flex justify-between text-sm text-red-600">
                    <span>
                      Discount{" "}
                      {quote.discount_type === "percentage"
                        ? `(${quote.discount_value}%)`
                        : `($${quote.discount_value})`}
                    </span>
                    <span className="font-medium">
                      -${quote.discount_amount.toFixed(2)}
                    </span>
                  </div>
                </>
              )}

              <Separator className="my-4" />

              <div className="bg-primary/10 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total</span>
                  <span className="text-2xl font-bold text-primary">
                    ${quote.total.toFixed(2)}
                  </span>
                </div>
              </div>

              {quote.converted_to_wo_id && (
                <>
                  <Separator />
                  <div className="bg-purple-50 border border-purple-200 p-3 rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-purple-800 font-medium">
                      <FileCheck className="h-4 w-4" />
                      <span>Converted to Work Order</span>
                    </div>
                    {quote.converted_at && (
                      <p className="text-xs text-purple-600 mt-1">
                        {format(new Date(quote.converted_at), "MMM dd, yyyy")}
                      </p>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
