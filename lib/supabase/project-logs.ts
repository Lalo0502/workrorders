import { supabase } from "./client";

export interface ProjectLog {
  id: string;
  project_id: string;
  action: "created" | "updated" | "deleted" | "work_order_added" | "work_order_removed" | "status_changed" | "client_changed" | "date_changed";
  field_name?: string;
  old_value?: string;
  new_value?: string;
  user_id?: string;
  user_email?: string;
  created_at: string;
}

export async function getProjectLogs(projectId: string) {
  // Get current user email to display in logs
  const { data: { user } } = await supabase.auth.getUser();
  const currentUserEmail = user?.email || 'Unknown User';

  const { data, error } = await supabase
    .from("project_logs")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  
  // Add user email to each log (for now, all logs will show current user)
  const logsWithEmails = (data || []).map((log: any) => ({
    ...log,
    user_email: currentUserEmail,
  }));
  
  return logsWithEmails;
}

export async function createProjectLog(log: Omit<ProjectLog, "id" | "created_at" | "user_email">) {
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  
  const logWithUser = {
    ...log,
    user_id: user?.id,
  };

  const { data, error } = await supabase
    .from("project_logs")
    // @ts-expect-error - Supabase types need to be regenerated after creating the table
    .insert([logWithUser])
    .select()
    .single();

  if (error) throw error;
  return data;
}
