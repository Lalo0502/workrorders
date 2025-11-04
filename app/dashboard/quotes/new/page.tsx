"use client";

import { useSearchParams } from "next/navigation";
import { QuoteForm } from "@/components/quotes/quote-form";
import { PageHeader } from "@/components/shared/page-header";
import { FileText } from "lucide-react";

export default function NewQuotePage() {
  const searchParams = useSearchParams();
  const fromWoId = searchParams.get("from_wo");
  const clientId = searchParams.get("client");

  return (
    <div className="space-y-6">
      <PageHeader
        icon={FileText}
        title="Create Quote"
        description={
          fromWoId
            ? "Create a new quote from work order"
            : "Create a new quote for a client"
        }
      />
      <QuoteForm
        mode="create"
        fromWorkOrderId={fromWoId || undefined}
        preselectedClientId={clientId || undefined}
      />
    </div>
  );
}
