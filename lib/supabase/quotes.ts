import { supabase } from "./client";

export interface Quote {
  id: string;
  quote_number: string;
  client_id: string;
  project_id?: string;
  title: string;
  description?: string;
  status: "draft" | "sent" | "approved" | "rejected" | "expired" | "converted";
  issue_date: string;
  valid_until?: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  discount_type?: "percentage" | "fixed";
  discount_value: number;
  discount_amount: number;
  total: number;
  apply_tax: boolean;
  terms_and_conditions?: string;
  internal_notes?: string;
  converted_to_wo_id?: string;
  converted_at?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface QuoteItem {
  id: string;
  quote_id: string;
  item_type: "material" | "custom";
  material_id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  notes?: string;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface QuoteLog {
  id: string;
  quote_id: string;
  action: string;
  field_name?: string;
  old_value?: string;
  new_value?: string;
  notes?: string;
  changed_by?: string; // UUID
  user_email?: string; // Email address for display
  changed_at: string;
}

/**
 * Create a log entry for quote changes
 */
export async function createQuoteLog(log: {
  quote_id: string;
  action: string;
  field_name?: string;
  old_value?: string;
  new_value?: string;
  notes?: string;
  changed_by?: string;
}) {
  const { data, error } = await supabase
    .from("quote_changes")
    .insert([log] as any)
    .select()
    .single();

  if (error) {
    console.error("Error creating quote log:", error);
    // Don't throw - logs shouldn't break the main operation
    return null;
  }

  console.log("Quote log created:", data);
  return data;
}

/**
 * Get logs for a quote
 */
export async function getQuoteLogs(quoteId: string): Promise<QuoteLog[]> {
  // Get current user email to display in logs
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const currentUserEmail = user?.email || "Unknown User";

  const { data, error } = await supabase
    .from("quote_changes")
    .select("*")
    .eq("quote_id", quoteId)
    .order("changed_at", { ascending: false });

  if (error) {
    console.error("Error fetching quote logs:", error);
    return [];
  }

  console.log("Loaded quote logs:", data);

  // Add user email to each log (for now, all logs will show current user)
  const logsWithEmails = (data || []).map((log: any) => ({
    ...log,
    user_email: currentUserEmail,
  }));

  return logsWithEmails;
}

/**
 * Get all quotes
 */
export async function getQuotes() {
  const { data, error } = await supabase
    .from("quotes")
    .select(
      `
      *,
      clients:client_id (
        id,
        name,
        email
      ),
      projects:project_id (
        id,
        name
      )
    `
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching quotes:", error);
    throw error;
  }

  return data || [];
}

/**
 * Get a single quote by ID
 */
export async function getQuoteById(id: string) {
  const { data, error } = await supabase
    .from("quotes")
    .select(
      `
      *,
      clients:client_id (
        id,
        name,
        email,
        phone,
        address
      ),
      projects:project_id (
        id,
        name,
        description
      )
    `
    )
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching quote:", error);
    throw error;
  }

  return data;
}

/**
 * Get quote items for a quote
 */
export async function getQuoteItems(quoteId: string): Promise<QuoteItem[]> {
  const { data, error } = await supabase
    .from("quote_items")
    .select(
      `
      *,
      materials:material_id (
        id,
        name,
        sku
      )
    `
    )
    .eq("quote_id", quoteId)
    .order("display_order", { ascending: true });

  if (error) {
    console.error("Error fetching quote items:", error);
    throw error;
  }

  return data || [];
}

/**
 * Generate default terms and conditions for a quote
 */
function generateDefaultTerms(): string {
  return `TERMS AND CONDITIONS

1. PAYMENT TERMS
   - 50% deposit required upon acceptance of this quote
   - Remaining balance due upon completion of work
   - Payment accepted via check, credit card, or bank transfer
   - Late payments subject to 1.5% monthly interest charge

2. QUOTE VALIDITY
   - This quote is valid for 60 days from issue date
   - Prices subject to change after expiration date
   - Materials and labor costs may vary based on market conditions

3. SCOPE OF WORK
   - Work will be performed as described in quote items
   - Any additional work requires written approval and separate quote
   - Change orders may affect timeline and pricing

4. WARRANTIES
   - All work guaranteed for 1 year from completion date
   - Materials covered by manufacturer warranties
   - Warranty does not cover damage from misuse or neglect

5. CANCELLATION
   - Client may cancel with 48 hours written notice
   - Deposit is non-refundable after work has commenced
   - Client responsible for costs incurred up to cancellation date

6. LIMITATION OF LIABILITY
   - Our liability limited to quote amount
   - Not responsible for delays due to circumstances beyond our control
   - Client responsible for site access and safety

By accepting this quote, client agrees to these terms and conditions.`;
}

/**
 * Create a new quote
 */
export async function createQuote(quote: Omit<Quote, "id" | "created_at" | "updated_at" | "quote_number">) {
  // Add default terms and conditions if not provided
  const quoteWithTerms = {
    ...quote,
    terms_and_conditions: quote.terms_and_conditions || generateDefaultTerms()
  };

  // @ts-ignore - Supabase types not updated yet
  const { data, error } = await supabase
    .from("quotes")
    .insert([quoteWithTerms])
    .select()
    .single();

  if (error) {
    console.error("Error creating quote:", error);
    throw error;
  }

  return data;
}

/**
 * Update an existing quote
 */
export async function updateQuote(
  id: string,
  updates: Partial<Omit<Quote, "id" | "created_at" | "quote_number">>
) {
  // @ts-ignore - Supabase types not updated yet
  const { data, error } = await supabase
    .from("quotes")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating quote:", error);
    throw error;
  }

  return data;
}

/**
 * Delete a quote
 */
export async function deleteQuote(id: string) {
  // Log deletion before deleting
  await createQuoteLog({
    quote_id: id,
    action: "deleted",
    notes: "Quote deleted",
  });

  const { error } = await supabase.from("quotes").delete().eq("id", id);

  if (error) {
    console.error("Error deleting quote:", error);
    throw error;
  }

  return true;
}

/**
 * Add item to quote
 */
export async function addQuoteItem(item: Omit<QuoteItem, "id" | "created_at" | "updated_at">) {
  // @ts-ignore - Supabase types not updated yet
  const { data, error } = await supabase
    .from("quote_items")
    .insert([item])
    .select()
    .single();

  if (error) {
    console.error("Error adding quote item:", error);
    throw error;
  }

  return data;
}

/**
 * Update quote item
 */
export async function updateQuoteItem(
  id: string,
  updates: Partial<Omit<QuoteItem, "id" | "quote_id" | "created_at">>
) {
  // @ts-ignore - Supabase types not updated yet
  const { data, error} = await supabase
    .from("quote_items")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating quote item:", error);
    throw error;
  }

  return data;
}

/**
 * Delete quote item
 */
export async function deleteQuoteItem(id: string) {
  const { error } = await supabase.from("quote_items").delete().eq("id", id);

  if (error) {
    console.error("Error deleting quote item:", error);
    throw error;
  }

  return true;
}

/**
 * Calculate quote totals
 */
export function calculateQuoteTotals(
  items: QuoteItem[],
  applyTax: boolean,
  taxRate: number,
  discountType?: "percentage" | "fixed",
  discountValue?: number
) {
  // Calculate subtotal from items
  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);

  // Calculate discount
  let discountAmount = 0;
  if (discountType && discountValue) {
    if (discountType === "percentage") {
      discountAmount = (subtotal * discountValue) / 100;
    } else {
      discountAmount = discountValue;
    }
  }

  // Calculate tax
  const taxableAmount = subtotal - discountAmount;
  const taxAmount = applyTax ? (taxableAmount * taxRate) / 100 : 0;

  // Calculate total
  const total = taxableAmount + taxAmount;

  return {
    subtotal,
    taxAmount,
    discountAmount,
    total,
  };
}

/**
 * Update quote status
 */
export async function updateQuoteStatus(
  id: string,
  status: Quote["status"],
  notes?: string
) {
  // Update the quote
  // @ts-ignore - Supabase types not updated yet
  const { data, error } = await supabase
    .from("quotes")
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating quote status:", error);
    throw error;
  }

  // Log the change
  await logQuoteChange(id, "status_changed", "status", undefined, status, notes);

  return data;
}

/**
 * Log quote change
 */
export async function logQuoteChange(
  quoteId: string,
  action: string,
  fieldName?: string,
  oldValue?: string,
  newValue?: string,
  notes?: string
) {
  // @ts-ignore - Supabase types not updated yet
  const { error } = await supabase.from("quote_changes").insert([
    {
      quote_id: quoteId,
      action,
      field_name: fieldName,
      old_value: oldValue,
      new_value: newValue,
      notes,
      changed_at: new Date().toISOString(),
    },
  ]);

  if (error) {
    console.error("Error logging quote change:", error);
    // Don't throw, just log the error
  }
}

/**
 * Get quote changes history
 */
export async function getQuoteChanges(quoteId: string) {
  const { data, error } = await supabase
    .from("quote_changes")
    .select("*")
    .eq("quote_id", quoteId)
    .order("changed_at", { ascending: false });

  if (error) {
    console.error("Error fetching quote changes:", error);
    return [];
  }

  return data || [];
}

/**
 * Check if quote is associated with a work order
 */
export async function getWorkOrderByQuoteId(quoteId: string) {
  const { data, error } = await supabase
    .from("work_orders")
    .select("id, wo_number, title, status, created_at")
    .eq("quote_id", quoteId)
    .single();

  if (error) {
    // No work order found is not an error
    if (error.code === "PGRST116") {
      return null;
    }
    console.error("Error fetching work order for quote:", error);
    return null;
  }

  return data;
}

/**
 * Get quote associated with a work order
 */
export async function getQuoteByWorkOrderId(workOrderId: string) {
  const { data, error } = await supabase
    .from("work_orders")
    .select("quote_id")
    .eq("id", workOrderId)
    .single();

  if (error || !data?.quote_id) {
    return null;
  }

  // Get the full quote details
  const { data: quote, error: quoteError } = await supabase
    .from("quotes")
    .select("id, quote_number, title, status, total, created_at")
    .eq("id", data.quote_id)
    .single();

  if (quoteError) {
    console.error("Error fetching quote:", quoteError);
    return null;
  }

  return quote;
}

/**
 * Get quotes by client
 */
export async function getQuotesByClient(clientId: string) {
  const { data, error } = await supabase
    .from("quotes")
    .select(
      `
      *,
      clients:client_id (
        id,
        name
      )
    `
    )
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching quotes by client:", error);
    throw error;
  }

  return data || [];
}

/**
 * Get quotes by project
 */
export async function getQuotesByProject(projectId: string) {
  const { data, error } = await supabase
    .from("quotes")
    .select(
      `
      *,
      clients:client_id (
        id,
        name
      )
    `
    )
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching quotes by project:", error);
    throw error;
  }

  return data || [];
}
