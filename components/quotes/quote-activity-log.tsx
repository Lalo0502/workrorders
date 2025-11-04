"use client";

import { useState, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  Activity,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  User,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { getQuoteLogs, QuoteLog } from "@/lib/supabase/quotes";

interface QuoteActivityLogProps {
  quoteId: string;
}

const actionLabels: Record<string, { label: string; color: string }> = {
  created: { label: "Created", color: "bg-green-100 text-green-800" },
  updated: { label: "Updated", color: "bg-blue-100 text-blue-800" },
  deleted: { label: "Deleted", color: "bg-red-100 text-red-800" },
  status_changed: {
    label: "Status Changed",
    color: "bg-yellow-100 text-yellow-800",
  },
  item_added: {
    label: "Item Added",
    color: "bg-purple-100 text-purple-800",
  },
  item_removed: {
    label: "Item Removed",
    color: "bg-orange-100 text-orange-800",
  },
  item_updated: {
    label: "Item Updated",
    color: "bg-cyan-100 text-cyan-800",
  },
  client_changed: {
    label: "Client Changed",
    color: "bg-indigo-100 text-indigo-800",
  },
  project_changed: {
    label: "Project Changed",
    color: "bg-teal-100 text-teal-800",
  },
  pricing_changed: {
    label: "Pricing Changed",
    color: "bg-emerald-100 text-emerald-800",
  },
  sent_to_client: {
    label: "Sent to Client",
    color: "bg-blue-100 text-blue-800",
  },
  converted_to_wo: {
    label: "Converted to Work Order",
    color: "bg-green-100 text-green-800",
  },
};

const fieldLabels: Record<string, string> = {
  status: "Status",
  title: "Title",
  description: "Description",
  client_id: "Client",
  project_id: "Project",
  total: "Total",
  subtotal: "Subtotal",
  tax_rate: "Tax Rate",
  tax_amount: "Tax Amount",
  discount_value: "Discount Value",
  discount_type: "Discount Type",
  discount_amount: "Discount Amount",
  apply_tax: "Apply Tax",
  valid_until: "Valid Until",
  issue_date: "Issue Date",
  internal_notes: "Internal Notes",
  terms_and_conditions: "Terms & Conditions",
};

export function QuoteActivityLog({ quoteId }: QuoteActivityLogProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [logs, setLogs] = useState<QuoteLog[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isExpanded && logs.length === 0) {
      loadLogs();
    }
  }, [isExpanded, quoteId]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const data = await getQuoteLogs(quoteId);
      console.log("Loaded logs:", data);
      setLogs(data);
    } catch (error) {
      console.error("Error loading logs:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Collapsible Header */}
      <div
        className="flex items-center gap-2 text-sm cursor-pointer hover:bg-accent transition-colors rounded-md p-2"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
        <Activity className="h-5 w-5" />
        <span className="font-medium">Activity Log</span>
        <Badge variant="secondary" className="ml-auto text-xs">
          {logs.length}
        </Badge>
      </div>

      {/* Expandable Content */}
      {isExpanded && (
        <div className="ml-6">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-8 w-8 mx-auto mb-2 opacity-50 animate-spin" />
              <p className="text-sm">Loading activity...</p>
            </div>
          ) : !logs || logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No activity recorded yet</p>
            </div>
          ) : (
            <ScrollArea className="h-[400px] scrollbar-hide">
              <div className="space-y-4 pr-4">
                {logs.map((log) => {
                  const actionConfig = actionLabels[log.action] || {
                    label: log.action,
                    color: "bg-gray-100 text-gray-800",
                  };

                  return (
                    <div
                      key={log.id}
                      className="flex gap-3 pb-4 border-b last:border-0 last:pb-0"
                    >
                      <div className="flex-shrink-0 mt-1">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge
                            className={actionConfig.color}
                            variant="secondary"
                          >
                            {actionConfig.label}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(log.changed_at), "PPp", {
                              locale: es,
                            })}
                          </span>
                          {log.user_email && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <User className="h-3 w-3" />
                              <span>{log.user_email}</span>
                            </div>
                          )}
                        </div>
                        {log.field_name && (
                          <p className="text-sm text-muted-foreground">
                            <span className="font-medium text-foreground">
                              {fieldLabels[log.field_name] || log.field_name}
                            </span>
                            {log.old_value && log.new_value && (
                              <>
                                {" changed from "}
                                <span className="font-medium text-red-600">
                                  {log.old_value}
                                </span>
                                {" to "}
                                <span className="font-medium text-green-600">
                                  {log.new_value}
                                </span>
                              </>
                            )}
                            {!log.old_value && log.new_value && (
                              <>
                                {" set to "}
                                <span className="font-medium text-green-600">
                                  {log.new_value}
                                </span>
                              </>
                            )}
                            {log.old_value && !log.new_value && (
                              <>
                                {" removed (was "}
                                <span className="font-medium text-red-600">
                                  {log.old_value}
                                </span>
                                {")"}
                              </>
                            )}
                          </p>
                        )}
                        {log.notes && !log.field_name && (
                          <p className="text-sm text-muted-foreground">
                            {log.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </div>
      )}
    </div>
  );
}
