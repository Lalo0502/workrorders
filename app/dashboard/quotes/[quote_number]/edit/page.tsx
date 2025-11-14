"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { QuoteForm } from "@/components/quotes/quote-form";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { FileText, RefreshCw } from "lucide-react";
import { getQuotes, getQuoteItems } from "@/lib/supabase/quotes";
import { toast } from "sonner";

export default function EditQuotePage() {
  const params = useParams();
  const router = useRouter();
  const quoteNumber = params.quote_number as string;

  const [quote, setQuote] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQuote();
  }, [quoteNumber]);

  const loadQuote = async () => {
    try {
      setLoading(true);
      const quotes = await getQuotes();
      const found: any = quotes.find((q: any) => q.quote_number === quoteNumber);

      if (!found) {
        toast.error("Quote not found");
        router.push("/dashboard/quotes");
        return;
      }

      // Load quote items
      const items = await getQuoteItems(found.id);

      // Add items to the quote object
      const quoteWithItems = {
        ...found,
        items: items,
      };

      setQuote(quoteWithItems);
    } catch (error) {
      console.error("Error loading quote:", error);
      toast.error("Failed to load quote");
      router.push("/dashboard/quotes");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          icon={FileText}
          title="Edit Quote"
          description="Loading quote..."
        />
        <Card className="p-8">
          <div className="flex justify-center items-center space-x-2">
            <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
            <span className="text-muted-foreground">Loading quote...</span>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={FileText}
        title={`Edit Quote ${quoteNumber}`}
        description="Update quote information"
      />
      <QuoteForm mode="edit" initialData={quote} />
    </div>
  );
}
