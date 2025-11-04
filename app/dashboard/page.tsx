"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/shared/page-header";
import {
  FolderKanban,
  ClipboardList,
  Plus,
  Clock,
  Calendar,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  LayoutDashboard,
  TrendingUp,
} from "lucide-react";
import { getWorkOrders } from "@/lib/supabase/workorders";
import { getProjects } from "@/lib/supabase/projects";
import { getQuotes } from "@/lib/supabase/quotes";
import { supabase } from "@/lib/supabase/client";

import { format } from "date-fns";
import { cn } from "@/lib/utils";

const workOrderStatusConfig = {
  pending: {
    label: "Pending",
    color: "bg-yellow-100 text-yellow-800",
    icon: Clock,
  },
  in_progress: {
    label: "In Progress",
    color: "bg-blue-100 text-blue-800",
    icon: AlertCircle,
  },
  completed: {
    label: "Completed",
    color: "bg-green-100 text-green-800",
    icon: CheckCircle2,
  },
  cancelled: {
    label: "Cancelled",
    color: "bg-red-100 text-red-800",
    icon: CheckCircle2,
  },
};

const projectStatusConfig = {
  active: {
    label: "Active",
    color: "bg-green-100 text-green-800",
  },
  completed: {
    label: "Completed",
    color: "bg-blue-100 text-blue-800",
  },
  on_hold: {
    label: "On Hold",
    color: "bg-yellow-100 text-yellow-800",
  },
  cancelled: {
    label: "Cancelled",
    color: "bg-red-100 text-red-800",
  },
};

export default function DashboardPage() {
  const router = useRouter();
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [activities, setActivities] = useState<
    Array<{
      id: string;
      type: "work_order" | "quote" | "project";
      title: string;
      description: string;
      date: string;
      href: string;
      Icon: any;
      by?: string | null;
    }>
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [woData, projectsData, quotesData] = await Promise.all([
        getWorkOrders(),
        getProjects(),
        getQuotes(),
      ]);

      // Get recent work orders (last 6)
      setWorkOrders(woData.slice(0, 6));

      // Get active projects
      setProjects(projectsData.filter((p: any) => p.status === "active"));

      // Get recent quotes (show more to use available space)
      setQuotes(quotesData.slice(0, 10));

      // ---------- Recent Activity (aggregate from multiple logs) ----------
      const [woLogsRes, qtLogsRes, prjLogsRes] = await Promise.all([
        supabase
          .from("work_order_changes")
          .select(
            "id, work_order_id, change_type, entity_type, entity_name, old_value, new_value, notes, changed_by_email, created_at"
          )
          .order("created_at", { ascending: false })
          .limit(20),
        supabase
          .from("quote_changes")
          .select(
            "id, quote_id, action, field_name, old_value, new_value, notes, user_email, changed_at"
          )
          .order("changed_at", { ascending: false })
          .limit(20),
        supabase
          .from("project_logs")
          .select(
            "id, project_id, action, field_name, old_value, new_value, user_email, created_at"
          )
          .order("created_at", { ascending: false })
          .limit(20),
      ]);

      const woLogs = woLogsRes.data || [];
      const qtLogs = qtLogsRes.data || [];
      const prjLogs = prjLogsRes.data || [];

      // Build ID maps for friendly titles/links
      const woIds = Array.from(
        new Set(woLogs.map((l: any) => l.work_order_id).filter(Boolean))
      );
      const qtIds = Array.from(
        new Set(qtLogs.map((l: any) => l.quote_id).filter(Boolean))
      );
      const prjIds = Array.from(
        new Set(prjLogs.map((l: any) => l.project_id).filter(Boolean))
      );

      const [woMapRes, qtMapRes, prjMapRes] = await Promise.all([
        woIds.length
          ? supabase
              .from("work_orders")
              .select("id, wo_number, title")
              .in("id", woIds)
          : Promise.resolve({ data: [] as any[] }),
        qtIds.length
          ? supabase
              .from("quotes")
              .select("id, quote_number, title")
              .in("id", qtIds)
          : Promise.resolve({ data: [] as any[] }),
        prjIds.length
          ? supabase.from("projects").select("id, name").in("id", prjIds)
          : Promise.resolve({ data: [] as any[] }),
      ]);

      const woMap = new Map((woMapRes.data || []).map((w: any) => [w.id, w]));
      const qtMap = new Map((qtMapRes.data || []).map((q: any) => [q.id, q]));
      const prjMap = new Map((prjMapRes.data || []).map((p: any) => [p.id, p]));

      const toTitle = (s: string) =>
        s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

      const woItems = woLogs.map((l: any) => {
        const w = woMap.get(l.work_order_id);
        const title = w
          ? `WO ${w.wo_number}${w.title ? ` — ${w.title}` : ""}`
          : "Work Order";
        let description = toTitle(l.change_type);
        if (l.change_type === "field_updated" && l.entity_name) {
          const oldV = l.old_value ?? "(empty)";
          const newV = l.new_value ?? "(empty)";
          description = `${l.entity_name}: ${oldV} → ${newV}`;
        } else if (l.entity_name) {
          description = `${toTitle(l.change_type)}: ${l.entity_name}`;
        }
        return {
          id: `wo-${l.id}`,
          type: "work_order" as const,
          title,
          description,
          date: l.created_at,
          href: w?.wo_number
            ? `/dashboard/workorders/${w.wo_number}`
            : "/dashboard/workorders",
          Icon: ClipboardList,
          by: l.changed_by_email ?? null,
        };
      });

      const qtItems = qtLogs.map((l: any) => {
        const q = qtMap.get(l.quote_id);
        const title = q
          ? `QT ${q.quote_number}${q.title ? ` — ${q.title}` : ""}`
          : "Quote";
        let description = toTitle(l.action || "updated");
        if (l.field_name) {
          const oldV = l.old_value ?? "(empty)";
          const newV = l.new_value ?? "(empty)";
          description = `${toTitle(l.field_name)}: ${oldV} → ${newV}`;
        } else if (l.notes) {
          description = l.notes;
        }
        return {
          id: `qt-${l.id}`,
          type: "quote" as const,
          title,
          description,
          date: l.changed_at,
          href: q?.quote_number
            ? `/dashboard/quotes/${q.quote_number}`
            : "/dashboard/quotes",
          Icon: FileText,
          by: l.user_email ?? null,
        };
      });

      const prjItems = prjLogs.map((l: any) => {
        const p = prjMap.get(l.project_id);
        const title = p?.name || "Project";
        let description = toTitle(l.action || "updated");
        if (l.field_name) {
          const oldV = l.old_value ?? "(empty)";
          const newV = l.new_value ?? "(empty)";
          description = `${toTitle(l.field_name)}: ${oldV} → ${newV}`;
        }
        return {
          id: `pr-${l.id}`,
          type: "project" as const,
          title,
          description,
          date: l.created_at,
          href: "/dashboard/projects",
          Icon: FolderKanban,
          by: l.user_email ?? null,
        };
      });

      const combined = [...woItems, ...qtItems, ...prjItems]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 10);
      setActivities(combined);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        icon={LayoutDashboard}
        title="Dashboard"
        description="Overview of your work management system"
      />

      {/* Recent Quotes - moved up to use available space and expanded */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Recent Quotes
            </CardTitle>
            <CardDescription className="mt-1">
              Latest quotes in the system
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard/quotes")}
            className="flex items-center gap-1"
          >
            View All
            <ArrowRight className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          {quotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="p-4 rounded-full bg-muted mb-4">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium mb-1">No quotes yet</p>
              <p className="text-xs text-muted-foreground mb-4">
                Get started by creating your first quote
              </p>
              <Button
                onClick={() => router.push("/dashboard/quotes/new")}
                size="sm"
              >
                <Plus className="h-4 w-4 mr-1" />
                Create Quote
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {quotes.map((qt) => {
                const QStatus = qt.status as string;
                const statusMap: Record<
                  string,
                  { label: string; color: string; Icon: any }
                > = {
                  draft: {
                    label: "Draft",
                    color: "bg-gray-100 text-gray-800",
                    Icon: Clock,
                  },
                  sent: {
                    label: "Sent",
                    color: "bg-blue-100 text-blue-800",
                    Icon: AlertCircle,
                  },
                  approved: {
                    label: "Approved",
                    color: "bg-green-100 text-green-800",
                    Icon: CheckCircle2,
                  },
                  rejected: {
                    label: "Rejected",
                    color: "bg-red-100 text-red-800",
                    Icon: AlertCircle,
                  },
                  expired: {
                    label: "Expired",
                    color: "bg-yellow-100 text-yellow-800",
                    Icon: AlertCircle,
                  },
                  converted: {
                    label: "Converted",
                    color: "bg-purple-100 text-purple-800",
                    Icon: CheckCircle2,
                  },
                };
                const statusCfg = statusMap[QStatus] || statusMap.draft;
                const StatusIcon = statusCfg.Icon;

                return (
                  <div
                    key={qt.id}
                    className="group flex items-center gap-3 p-3 rounded-lg border hover:border-primary/50 hover:bg-accent/50 cursor-pointer transition-all"
                    onClick={() =>
                      router.push(`/dashboard/quotes/${qt.quote_number}`)
                    }
                  >
                    <div className="p-2 rounded-lg bg-gradient-to-br from-orange-50 to-orange-100 group-hover:from-orange-100 group-hover:to-orange-200 transition-colors">
                      <FileText className="h-4 w-4 text-orange-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-sm">
                          {qt.quote_number}
                        </p>
                        <Badge
                          className={cn("text-xs", statusCfg.color)}
                          variant="secondary"
                        >
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusCfg.label}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {qt.title}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        {qt.issue_date && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(qt.issue_date), "MMM dd, yyyy")}
                            </span>
                          </div>
                        )}
                        {/* Price intentionally hidden for protection */}
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats removed as requested */}

      {/* Quick Actions removed as requested */}

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Work Orders - Takes 2 columns */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                Recent Work Orders
              </CardTitle>
              <CardDescription className="mt-1">
                Latest work orders in the system
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/dashboard/workorders")}
              className="flex items-center gap-1"
            >
              View All
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {workOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="p-4 rounded-full bg-muted mb-4">
                  <ClipboardList className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium mb-1">No work orders yet</p>
                <p className="text-xs text-muted-foreground mb-4">
                  Get started by creating your first work order
                </p>
                <Button
                  onClick={() => router.push("/dashboard/workorders/new")}
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Create Work Order
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {workOrders.map((wo) => {
                  const status =
                    workOrderStatusConfig[
                      wo.status as keyof typeof workOrderStatusConfig
                    ] || workOrderStatusConfig.pending;
                  const StatusIcon = status.icon;

                  return (
                    <div
                      key={wo.id}
                      className="group flex items-center gap-3 p-3 rounded-lg border hover:border-primary/50 hover:bg-accent/50 cursor-pointer transition-all"
                      onClick={() =>
                        router.push(`/dashboard/workorders/${wo.wo_number}`)
                      }
                    >
                      <div className="p-2 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 group-hover:from-blue-100 group-hover:to-blue-200 transition-colors">
                        <FileText className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-sm">
                            {wo.wo_number}
                          </p>
                          <Badge
                            className={cn("text-xs", status.color)}
                            variant="secondary"
                          >
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {status.label}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {wo.title}
                        </p>
                        <div className="flex items-center gap-3 mt-1">
                          {wo.scheduled_date && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">
                                {format(
                                  new Date(wo.scheduled_date),
                                  "MMM dd, yyyy"
                                )}
                              </span>
                            </div>
                          )}
                          {wo.priority && (
                            <Badge variant="outline" className="text-xs">
                              {wo.priority}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Projects - Takes 1 column */}
        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FolderKanban className="h-5 w-5" />
                Active Projects
              </CardTitle>
              <CardDescription className="mt-1">
                Currently in progress
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/dashboard/projects")}
              className="flex items-center gap-1"
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {projects.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="p-4 rounded-full bg-muted mb-4">
                  <FolderKanban className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium mb-1">No active projects</p>
                <p className="text-xs text-muted-foreground mb-4">
                  Start organizing your work
                </p>
                <Button
                  onClick={() => router.push("/dashboard/projects")}
                  size="sm"
                  variant="outline"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Create Project
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {projects.slice(0, 6).map((project) => {
                  const status =
                    projectStatusConfig[
                      project.status as keyof typeof projectStatusConfig
                    ] || projectStatusConfig.active;

                  return (
                    <div
                      key={project.id}
                      className="group flex items-start gap-3 p-3 rounded-lg border hover:border-purple-200 hover:bg-purple-50/50 cursor-pointer transition-all"
                      onClick={() => router.push("/dashboard/projects")}
                    >
                      <div className="p-2 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100 group-hover:from-purple-100 group-hover:to-purple-200 transition-colors">
                        <FolderKanban className="h-4 w-4 text-purple-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className="font-semibold text-sm line-clamp-1">
                            {project.name}
                          </p>
                        </div>
                        {project.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                            {project.description}
                          </p>
                        )}
                        <div className="flex items-center flex-wrap gap-2">
                          <Badge
                            className={cn("text-xs", status.color)}
                            variant="secondary"
                          >
                            {status.label}
                          </Badge>
                          {project.start_date && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(project.start_date), "MMM dd")}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Recent Activity</CardTitle>
          </div>
          <CardDescription>
            Latest updates across Work Orders, Quotes, and Projects
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="p-4 rounded-full bg-muted mb-4">
                <Clock className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium mb-1">No recent activity</p>
              <p className="text-xs text-muted-foreground">
                Changes will appear here as they happen
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {activities.map((a) => (
                <div
                  key={a.id}
                  className="group flex items-start gap-3 p-3 rounded-lg border hover:border-primary/50 hover:bg-accent/50 cursor-pointer transition-all"
                  onClick={() => router.push(a.href)}
                >
                  <div className="p-2 rounded-lg bg-muted">
                    <a.Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium line-clamp-1">
                        {a.title}
                      </p>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {format(new Date(a.date), "MMM dd, yyyy HH:mm")}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                      {a.description}
                    </p>
                    {a.by && (
                      <p className="text-[11px] text-muted-foreground mt-1">
                        By {a.by}
                      </p>
                    )}
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
