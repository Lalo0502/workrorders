"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const search = useSearchParams();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function check() {
      try {
        const { data } = await supabase.auth.getSession();
        const session = data.session;
        if (!session) {
          const redirectTo = window.location.pathname + window.location.search;
          router.replace(`/login?redirectTo=${encodeURIComponent(redirectTo)}`);
          return;
        }
      } finally {
        if (isMounted) setChecking(false);
      }
    }

    check();
    return () => {
      isMounted = false;
    };
  }, [router, search]);

  if (checking) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return <>{children}</>;
}
