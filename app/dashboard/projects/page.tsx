"use client";

import { useEffect, useState } from "react";
import {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
  getProjectWorkOrders,
  removeWorkOrderFromProject,
} from "@/lib/supabase/projects";
import { getClients } from "@/lib/supabase/clients";
import { getProjectLogs, createProjectLog } from "@/lib/supabase/project-logs";
import { getQuotes } from "@/lib/supabase/quotes";
import { PageHeader } from "@/components/shared/page-header";
import { ProjectForm } from "@/components/projects/project-form";
import { AddWorkOrderDialog } from "@/components/projects/add-workorder-dialog";
import { CreateWorkOrderDialog } from "@/components/projects/create-workorder-dialog";
import { AddQuoteDialog } from "@/components/projects/add-quote-dialog";
import { ProjectHistory } from "@/components/projects/project-history";
import {
  FolderKanban,
  Plus,
  FolderIcon,
  ChevronRight,
  ChevronDown,
  FileText,
  User,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Pencil,
  Trash2,
  Search,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { cn } from "@/lib/utils";

const statusConfig = {
  active: {
    label: "Active",
    color: "bg-green-100 text-green-800",
    icon: Clock,
  },
  completed: {
    label: "Completed",
    color: "bg-blue-100 text-blue-800",
    icon: CheckCircle2,
  },
  on_hold: {
    label: "On Hold",
    color: "bg-yellow-100 text-yellow-800",
    icon: Clock,
  },
  cancelled: {
    label: "Cancelled",
    color: "bg-red-100 text-red-800",
    icon: XCircle,
  },
};

const workOrderStatusConfig = {
  pending: {
    label: "Pending",
    color: "bg-yellow-100 text-yellow-800",
  },
  in_progress: {
    label: "In Progress",
    color: "bg-blue-100 text-blue-800",
  },
  completed: {
    label: "Completed",
    color: "bg-green-100 text-green-800",
  },
  cancelled: {
    label: "Cancelled",
    color: "bg-red-100 text-red-800",
  },
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<any | null>(null);
  const [editedProject, setEditedProject] = useState<any | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [loadingWorkOrders, setLoadingWorkOrders] = useState(false);
  const [workOrdersExpanded, setWorkOrdersExpanded] = useState(false);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [loadingQuotes, setLoadingQuotes] = useState(false);
  const [quotesExpanded, setQuotesExpanded] = useState(false);
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [addWorkOrderDialogOpen, setAddWorkOrderDialogOpen] = useState(false);
  const [createWorkOrderDialogOpen, setCreateWorkOrderDialogOpen] =
    useState(false);
  const [addQuoteDialogOpen, setAddQuoteDialogOpen] = useState(false);
  const [creatingNewProject, setCreatingNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("New Project");
  const [renamingProjectId, setRenamingProjectId] = useState<string | null>(
    null
  );
  const [renameValue, setRenameValue] = useState("");
  const [projectLogs, setProjectLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  useEffect(() => {
    loadProjects();
    loadClients();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      setEditedProject({ ...selectedProject });
      setHasUnsavedChanges(false);
      loadWorkOrders();
      loadQuotes();
      loadLogs();
    }
  }, [selectedProject]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const data = await getProjects();
      setProjects(data);
    } catch (error) {
      console.error("Error loading projects:", error);
      toast.error("Error loading projects");
    } finally {
      setLoading(false);
    }
  };

  const loadClients = async () => {
    try {
      const data = await getClients();
      setClients(data);
    } catch (error) {
      console.error("Error loading clients:", error);
    }
  };

  const loadWorkOrders = async () => {
    if (!selectedProject) return;
    try {
      setLoadingWorkOrders(true);
      const data = await getProjectWorkOrders(selectedProject.id);
      setWorkOrders(data);
    } catch (error) {
      console.error("Error loading work orders:", error);
      toast.error("Error loading work orders");
    } finally {
      setLoadingWorkOrders(false);
    }
  };

  const loadQuotes = async () => {
    if (!selectedProject) return;
    try {
      setLoadingQuotes(true);
      const allQuotes = await getQuotes();
      // Filter quotes that belong to this project
      const projectQuotes = allQuotes.filter(
        (quote: any) => quote.project_id === selectedProject.id
      );
      setQuotes(projectQuotes);
    } catch (error) {
      console.error("Error loading quotes:", error);
      toast.error("Error loading quotes");
    } finally {
      setLoadingQuotes(false);
    }
  };

  const loadLogs = async () => {
    if (!selectedProject) return;
    try {
      setLoadingLogs(true);
      const data = await getProjectLogs(selectedProject.id);
      setProjectLogs(data);
    } catch (error) {
      console.error("Error loading logs:", error);
      // Don't show error toast for logs, just log it
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleRemoveWorkOrder = async (
    workOrderId: string,
    workOrderTitle: string
  ) => {
    if (!selectedProject) return;

    try {
      await removeWorkOrderFromProject(workOrderId);
      toast.success(`Work order removed from project`);

      // Create log entry
      await createProjectLog({
        project_id: selectedProject.id,
        action: "work_order_removed",
        field_name: "work_order",
        old_value: workOrderTitle,
        new_value: "",
      });

      // Reload work orders and logs
      loadWorkOrders();
      loadLogs();
    } catch (error) {
      console.error("Error removing work order:", error);
      toast.error("Error removing work order from project");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!projectToDelete) return;
    try {
      await deleteProject(projectToDelete.id);
      toast.success("Project deleted successfully");
      setDeleteDialogOpen(false);
      setProjectToDelete(null);
      if (selectedProject?.id === projectToDelete.id) {
        setSelectedProject(null);
        setEditedProject(null);
        setHasUnsavedChanges(false);
      }
      loadProjects();
    } catch (error) {
      console.error("Error deleting project:", error);
      toast.error("Error deleting project");
    }
  };

  const handleNew = async () => {
    // Just show the input for creating new project
    setCreatingNewProject(true);
    setNewProjectName("New Project");
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) {
      toast.error("Project name is required");
      return;
    }

    try {
      await createProject({
        name: newProjectName.trim(),
        status: "active",
      });

      toast.success("Project created");
      setCreatingNewProject(false);
      setNewProjectName("New Project");
      loadProjects();
    } catch (error) {
      console.error("Error creating project:", error);
      toast.error("Error creating project");
    }
  };

  const handleCancelCreate = () => {
    setCreatingNewProject(false);
    setNewProjectName("New Project");
  };

  const handleRename = (project: any) => {
    setRenamingProjectId(project.id);
    setRenameValue(project.name);
  };

  const handleRenameConfirm = async (projectId: string) => {
    if (!renameValue.trim()) {
      toast.error("Project name is required");
      return;
    }

    try {
      await updateProject(projectId, { name: renameValue.trim() });
      toast.success("Project renamed");
      setRenamingProjectId(null);
      setRenameValue("");
      loadProjects();

      // Update selected project if it's the one being renamed
      if (selectedProject?.id === projectId) {
        setSelectedProject({ ...selectedProject, name: renameValue.trim() });
      }
    } catch (error) {
      console.error("Error renaming project:", error);
      toast.error("Error renaming project");
    }
  };

  const handleCancelRename = () => {
    setRenamingProjectId(null);
    setRenameValue("");
  };

  const handleUpdateField = (field: string, value: any) => {
    if (!editedProject) return;
    setEditedProject({
      ...editedProject,
      [field]: value,
    });
    setHasUnsavedChanges(true);
  };

  const handleSaveProject = async () => {
    if (!editedProject || !selectedProject) return;
    try {
      // Extract only the fields that exist in the database
      const { clients: projectClients, ...projectData } = editedProject;

      // Detect changes and create logs
      const changedFields = Object.keys(projectData).filter((key) => {
        if (key === "id" || key === "created_at" || key === "updated_at")
          return false;
        return projectData[key] !== selectedProject[key];
      });

      await updateProject(editedProject.id, projectData);

      // Create log entries for each changed field
      console.log("Changed fields:", changedFields);
      for (const field of changedFields) {
        let action:
          | "updated"
          | "status_changed"
          | "client_changed"
          | "date_changed" = "updated";
        let oldValue = String(selectedProject[field] || "");
        let newValue = String(projectData[field] || "");

        // Determine specific action type
        if (field === "status") {
          action = "status_changed";
        } else if (field === "client_id") {
          action = "client_changed";
          // Get client names for better display - use the state clients, not the extracted one
          const oldClient = clients.find(
            (c: any) => c.id === selectedProject[field]
          );
          const newClient = clients.find(
            (c: any) => c.id === projectData[field]
          );
          oldValue = oldClient?.name || "No client";
          newValue = newClient?.name || "No client";
        } else if (field.includes("date")) {
          action = "date_changed";
        }

        console.log("Creating log:", { field, action, oldValue, newValue });

        try {
          await createProjectLog({
            project_id: editedProject.id,
            action,
            field_name: field,
            old_value: oldValue,
            new_value: newValue,
          });
          console.log("Log created successfully for field:", field);
        } catch (logError) {
          console.error("Error creating log for field:", field, logError);
        }
      }

      toast.success("Project updated");

      // Update the project in the projects list without reloading everything
      setProjects((prevProjects) =>
        prevProjects.map((p) =>
          p.id === editedProject.id ? { ...p, ...projectData } : p
        )
      );

      // Update the selected project with the new data
      const updatedSelectedProject = {
        ...selectedProject,
        ...projectData,
      };
      setSelectedProject(updatedSelectedProject);
      setEditedProject(updatedSelectedProject);

      // Reload logs to show new changes
      loadLogs();

      setHasUnsavedChanges(false);
    } catch (error) {
      console.error("Error updating project:", error);
      toast.error("Error updating project");
    }
  };

  const handleCancelEdit = () => {
    if (selectedProject) {
      setEditedProject({ ...selectedProject });
      setHasUnsavedChanges(false);
    }
  };

  const handleDelete = (project: any) => {
    setProjectToDelete(project);
    setDeleteDialogOpen(true);
  };

  // Filter projects based on search query
  const filteredProjects = projects.filter((project) =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <FolderKanban className="h-12 w-12 mx-auto mb-4 text-muted-foreground animate-pulse" />
          <p className="text-muted-foreground">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Two Panel Layout */}
      <div className="flex-1 flex gap-4 overflow-hidden">
        {/* LEFT SIDEBAR - Projects List */}
        <Card className="w-80 flex-shrink-0 flex flex-col overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between mb-3">
              <CardTitle className="text-sm font-medium">
                Projects ({filteredProjects.length})
              </CardTitle>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={handleNew}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-8 h-9"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-9 w-9 p-0 hover:bg-transparent"
                  onClick={() => setSearchQuery("")}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          <Separator />
          <ContextMenu>
            <ContextMenuTrigger asChild>
              <CardContent className="flex-1 overflow-auto p-0">
                {filteredProjects.length === 0 && !creatingNewProject ? (
                  <div className="flex flex-col items-center justify-center py-12 px-4">
                    <FolderKanban className="h-12 w-12 text-muted-foreground mb-3" />
                    <p className="text-sm text-muted-foreground text-center">
                      {projects.length === 0
                        ? "No projects yet"
                        : "No projects found"}
                    </p>
                  </div>
                ) : (
                  <div className="py-2">
                    {/* New Project Input */}
                    {creatingNewProject && (
                      <div className="flex items-center gap-2 px-4 py-2 bg-accent">
                        <FolderIcon className="h-5 w-5 text-yellow-500 flex-shrink-0" />
                        <Input
                          autoFocus
                          value={newProjectName}
                          onChange={(e) => setNewProjectName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleCreateProject();
                            } else if (e.key === "Escape") {
                              handleCancelCreate();
                            }
                          }}
                          onBlur={handleCreateProject}
                          className="h-7 text-sm flex-1"
                        />
                      </div>
                    )}

                    {/* Existing Projects */}
                    {filteredProjects.map((project) => {
                      const isSelected = selectedProject?.id === project.id;
                      const isRenaming = renamingProjectId === project.id;

                      return (
                        <ContextMenu key={project.id}>
                          <ContextMenuTrigger>
                            <div
                              className={cn(
                                "flex items-center gap-2 px-4 py-2 cursor-pointer hover:bg-accent transition-colors",
                                isSelected &&
                                  "bg-accent border-l-4 border-primary"
                              )}
                              onClick={() =>
                                !isRenaming && setSelectedProject(project)
                              }
                            >
                              <FolderIcon className="h-5 w-5 text-yellow-500 flex-shrink-0" />
                              {isRenaming ? (
                                <Input
                                  autoFocus
                                  value={renameValue}
                                  onChange={(e) =>
                                    setRenameValue(e.target.value)
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      handleRenameConfirm(project.id);
                                    } else if (e.key === "Escape") {
                                      handleCancelRename();
                                    }
                                  }}
                                  onBlur={() => handleRenameConfirm(project.id)}
                                  className="h-7 text-sm flex-1"
                                  onClick={(e) => e.stopPropagation()}
                                />
                              ) : (
                                <span className="text-sm truncate flex-1">
                                  {project.name}
                                </span>
                              )}
                            </div>
                          </ContextMenuTrigger>
                          <ContextMenuContent>
                            <ContextMenuItem
                              onClick={() => setSelectedProject(project)}
                            >
                              <FolderIcon className="h-4 w-4 mr-2" />
                              Open
                            </ContextMenuItem>
                            <ContextMenuItem
                              onClick={() => handleRename(project)}
                            >
                              <Pencil className="h-4 w-4 mr-2" />
                              Rename
                            </ContextMenuItem>
                            <ContextMenuItem
                              onClick={() => handleDelete(project)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </ContextMenuItem>
                          </ContextMenuContent>
                        </ContextMenu>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </ContextMenuTrigger>
            <ContextMenuContent>
              <ContextMenuItem onClick={handleNew}>
                <Plus className="h-4 w-4 mr-2" />
                New Project
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        </Card>

        {/* RIGHT PANEL - Project Details */}
        <Card className="flex-1 flex flex-col overflow-hidden">
          {!selectedProject ? (
            <CardContent className="flex flex-col items-center justify-center h-full">
              <FolderKanban className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Select a project</h3>
              <p className="text-muted-foreground text-center">
                Choose a project from the list to view its details
              </p>
            </CardContent>
          ) : (
            <>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <FolderIcon className="h-8 w-8 text-yellow-500" />
                      <Input
                        value={editedProject?.name || ""}
                        onChange={(e) =>
                          handleUpdateField("name", e.target.value)
                        }
                        className="text-2xl font-bold h-auto border-0 px-0 focus-visible:ring-1 focus-visible:ring-primary focus-visible:px-2 focus-visible:rounded-md transition-all"
                        placeholder="Project name"
                      />
                    </div>
                    <Textarea
                      value={editedProject?.description || ""}
                      onChange={(e) =>
                        handleUpdateField("description", e.target.value)
                      }
                      className="ml-11 text-base text-muted-foreground border-0 px-0 focus-visible:ring-1 focus-visible:ring-primary focus-visible:px-2 focus-visible:rounded-md transition-all resize-none min-h-[40px]"
                      rows={1}
                      placeholder="Add description..."
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    {hasUnsavedChanges && (
                      <>
                        <Button size="sm" onClick={handleSaveProject}>
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleCancelEdit}
                        >
                          Cancel
                        </Button>
                      </>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(selectedProject)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <Separator />
              <CardContent className="flex-1 overflow-auto p-6 scrollbar-hide">
                {/* Project Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {/* Status Card */}
                  <Card className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        {statusConfig[
                          (editedProject?.status ||
                            "active") as keyof typeof statusConfig
                        ]?.icon && (
                          <div
                            className={cn(
                              "p-3 rounded-lg",
                              statusConfig[
                                (editedProject?.status ||
                                  "active") as keyof typeof statusConfig
                              ]?.color
                            )}
                          >
                            {(() => {
                              const IconComponent =
                                statusConfig[
                                  (editedProject?.status ||
                                    "active") as keyof typeof statusConfig
                                ]?.icon;
                              return IconComponent ? (
                                <IconComponent className="h-6 w-6" />
                              ) : null;
                            })()}
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="text-xs text-muted-foreground mb-1">
                            Status
                          </p>
                          <Select
                            value={editedProject?.status || "active"}
                            onValueChange={(value) =>
                              handleUpdateField("status", value)
                            }
                          >
                            <SelectTrigger className="border-0 h-auto p-0 font-semibold text-lg focus:ring-0 hover:bg-accent/50 rounded-md">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="completed">
                                Completed
                              </SelectItem>
                              <SelectItem value="on_hold">On Hold</SelectItem>
                              <SelectItem value="cancelled">
                                Cancelled
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Client Card */}
                  <Card className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-3 rounded-lg bg-blue-100">
                          <User className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground mb-1">
                            Client
                          </p>
                          <Select
                            value={editedProject?.client_id || "none"}
                            onValueChange={(value) =>
                              handleUpdateField(
                                "client_id",
                                value === "none" ? null : value
                              )
                            }
                          >
                            <SelectTrigger className="border-0 h-auto p-0 font-semibold text-lg focus:ring-0 hover:bg-accent/50 rounded-md truncate">
                              <SelectValue placeholder="No client" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">No client</SelectItem>
                              {clients.map((client) => (
                                <SelectItem key={client.id} value={client.id}>
                                  {client.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Dates Section */}
                <Card className="mb-6">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-4">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <h3 className="font-semibold">Project Dates</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Created Date - Read only */}
                      {selectedProject?.created_at && (
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                          <Clock className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">
                              Created
                            </p>
                            <p className="font-medium">
                              {format(
                                new Date(selectedProject.created_at),
                                "PP",
                                { locale: es }
                              )}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Start Date - Editable */}
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 cursor-pointer hover:shadow-md transition-shadow">
                        <Calendar className="h-5 w-5 text-green-600" />
                        <div className="flex-1">
                          <p className="text-xs text-muted-foreground">Start</p>
                          <Input
                            type="date"
                            value={editedProject?.start_date || ""}
                            onChange={(e) =>
                              handleUpdateField("start_date", e.target.value)
                            }
                            className="border-0 h-auto p-0 font-medium focus-visible:ring-1 focus-visible:ring-green-600 focus-visible:px-2 focus-visible:rounded-md bg-transparent"
                          />
                        </div>
                      </div>

                      {/* End Date - Editable */}
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 cursor-pointer hover:shadow-md transition-shadow">
                        <Calendar className="h-5 w-5 text-blue-600" />
                        <div className="flex-1">
                          <p className="text-xs text-muted-foreground">End</p>
                          <Input
                            type="date"
                            value={editedProject?.end_date || ""}
                            onChange={(e) =>
                              handleUpdateField("end_date", e.target.value)
                            }
                            className="border-0 h-auto p-0 font-medium focus-visible:ring-1 focus-visible:ring-blue-600 focus-visible:px-2 focus-visible:rounded-md bg-transparent"
                          />
                        </div>
                      </div>

                      {/* Estimated Completion - Editable */}
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-orange-50 cursor-pointer hover:shadow-md transition-shadow">
                        <Clock className="h-5 w-5 text-orange-600" />
                        <div className="flex-1">
                          <p className="text-xs text-muted-foreground">
                            Estimated
                          </p>
                          <Input
                            type="date"
                            value={
                              editedProject?.estimated_completion_date || ""
                            }
                            onChange={(e) =>
                              handleUpdateField(
                                "estimated_completion_date",
                                e.target.value
                              )
                            }
                            className="border-0 h-auto p-0 font-medium focus-visible:ring-1 focus-visible:ring-orange-600 focus-visible:px-2 focus-visible:rounded-md bg-transparent"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Separator className="my-6" />

                {/* Quotes Folder */}
                <div>
                  <div
                    className="flex items-center gap-2 cursor-pointer hover:bg-accent p-2 rounded-md transition-colors"
                    onClick={() => setQuotesExpanded(!quotesExpanded)}
                  >
                    {quotesExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                    <FolderIcon className="h-5 w-5 text-purple-500" />
                    <span className="font-medium text-sm">Quotes</span>
                    <Badge variant="secondary" className="ml-auto text-xs">
                      {quotes.length}
                    </Badge>
                  </div>

                  {/* Quotes List */}
                  {quotesExpanded && (
                    <div className="ml-6 mt-2 space-y-3">
                      {/* Quotes Items */}
                      <div className="flex flex-wrap gap-2">
                        {loadingQuotes ? (
                          <p className="text-sm text-muted-foreground py-2">
                            Loading...
                          </p>
                        ) : (
                          <>
                            {quotes.map((quote) => (
                              <div
                                key={quote.id}
                                className="group relative flex flex-col items-center gap-1 p-2 hover:bg-accent rounded-md transition-colors cursor-pointer min-w-[80px] max-w-[100px]"
                                title={quote.title}
                                onClick={() =>
                                  window.open(
                                    `/dashboard/quotes/${quote.quote_number}`,
                                    "_blank"
                                  )
                                }
                              >
                                {/* File Icon */}
                                <div className="relative">
                                  <FileText className="h-10 w-10 text-purple-500" />
                                  {/* Status indicator dot */}
                                  <div
                                    className={cn(
                                      "absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background",
                                      quote.status === "approved"
                                        ? "bg-green-500"
                                        : quote.status === "sent"
                                        ? "bg-blue-500"
                                        : quote.status === "rejected"
                                        ? "bg-red-500"
                                        : quote.status === "converted"
                                        ? "bg-purple-500"
                                        : "bg-gray-500"
                                    )}
                                  />
                                </div>
                                {/* File Name */}
                                <span className="text-xs text-center font-medium line-clamp-2 w-full">
                                  {quote.quote_number}
                                </span>
                              </div>
                            ))}

                            {/* Add Quote Card */}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <div
                                  className="group relative flex flex-col items-center justify-center p-2 hover:bg-accent/50 rounded-md transition-colors cursor-pointer min-w-[80px] max-w-[100px]"
                                  title="Add Quote"
                                >
                                  {/* Plus Icon */}
                                  <div className="relative">
                                    <Plus className="h-8 w-8 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                                  </div>
                                </div>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem
                                  onClick={() =>
                                    window.open(
                                      `/dashboard/quotes/new?project=${selectedProject.id}&client=${selectedProject.client_id}`,
                                      "_blank"
                                    )
                                  }
                                >
                                  <Plus className="h-4 w-4 mr-2" />
                                  Create New Quote
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setAddQuoteDialogOpen(true);
                                  }}
                                >
                                  <FileText className="h-4 w-4 mr-2" />
                                  Add Existing Quote
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <Separator className="my-6" />

                {/* Work Orders Folder */}
                <div>
                  <div
                    className="flex items-center gap-2 cursor-pointer hover:bg-accent p-2 rounded-md transition-colors"
                    onClick={() => setWorkOrdersExpanded(!workOrdersExpanded)}
                  >
                    {workOrdersExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                    <FolderIcon className="h-5 w-5 text-blue-500" />
                    <span className="font-medium text-sm">Work Orders</span>
                    <Badge variant="secondary" className="ml-auto text-xs">
                      {workOrders.length}
                    </Badge>
                  </div>

                  {/* Work Orders List */}
                  {workOrdersExpanded && (
                    <div className="ml-6 mt-2 space-y-3">
                      {/* Work Orders Items */}
                      <div className="flex flex-wrap gap-2">
                        {loadingWorkOrders ? (
                          <p className="text-sm text-muted-foreground py-2">
                            Loading...
                          </p>
                        ) : (
                          <>
                            {workOrders.map((wo) => (
                              <div
                                key={wo.id}
                                className="group relative flex flex-col items-center gap-1 p-2 hover:bg-accent rounded-md transition-colors cursor-pointer min-w-[80px] max-w-[100px]"
                                title={wo.title}
                              >
                                {/* File Icon */}
                                <div className="relative">
                                  <FileText className="h-10 w-10 text-blue-500" />
                                  {/* Status indicator dot */}
                                  <div
                                    className={cn(
                                      "absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background",
                                      wo.status === "completed"
                                        ? "bg-green-500"
                                        : wo.status === "in_progress"
                                        ? "bg-blue-500"
                                        : wo.status === "cancelled"
                                        ? "bg-red-500"
                                        : "bg-yellow-500"
                                    )}
                                  />
                                </div>
                                {/* File Name */}
                                <span className="text-xs text-center font-medium line-clamp-2 w-full">
                                  {wo.wo_number || wo.title}
                                </span>
                                {/* Remove button */}
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-background shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveWorkOrder(wo.id, wo.title);
                                  }}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}

                            {/* Add Work Order Card */}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <div
                                  className="group relative flex flex-col items-center justify-center p-2 hover:bg-accent/50 rounded-md transition-colors cursor-pointer min-w-[80px] max-w-[100px]"
                                  title="Add Work Order"
                                >
                                  {/* Plus Icon */}
                                  <div className="relative">
                                    <Plus className="h-8 w-8 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                                  </div>
                                </div>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="start">
                                <DropdownMenuItem
                                  onClick={() =>
                                    setAddWorkOrderDialogOpen(true)
                                  }
                                >
                                  <FileText className="h-4 w-4 mr-2" />
                                  Add Existing Work Order
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    setCreateWorkOrderDialogOpen(true)
                                  }
                                >
                                  <Plus className="h-4 w-4 mr-2" />
                                  Create New Work Order
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <Separator className="my-6" />

                {/* Activity Log */}
                <ProjectHistory
                  projectId={selectedProject.id}
                  logs={projectLogs}
                />
              </CardContent>
            </>
          )}
        </Card>
      </div>

      {/* Project Form Dialog */}
      <ProjectForm
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        project={selectedProject}
        onSuccess={() => {
          loadProjects();
          setFormDialogOpen(false);
        }}
      />

      {/* Add Work Order Dialog */}
      {selectedProject && (
        <AddWorkOrderDialog
          open={addWorkOrderDialogOpen}
          onOpenChange={setAddWorkOrderDialogOpen}
          projectId={selectedProject.id}
          onSuccess={() => {
            loadWorkOrders();
            loadLogs();
            setAddWorkOrderDialogOpen(false);
          }}
        />
      )}

      {/* Create Work Order Dialog */}
      {selectedProject && (
        <CreateWorkOrderDialog
          open={createWorkOrderDialogOpen}
          onOpenChange={setCreateWorkOrderDialogOpen}
          projectId={selectedProject.id}
          projectName={selectedProject.name}
        />
      )}

      {/* Add Quote Dialog */}
      {selectedProject && (
        <AddQuoteDialog
          open={addQuoteDialogOpen}
          onOpenChange={setAddQuoteDialogOpen}
          projectId={selectedProject.id}
          clientId={selectedProject.client_id}
          onSuccess={() => {
            setAddQuoteDialogOpen(false);
            loadQuotes();
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              project "{projectToDelete?.name}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
