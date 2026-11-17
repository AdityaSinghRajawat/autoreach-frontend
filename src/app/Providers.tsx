import { QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import { Toaster } from "sonner";

import { createQueryClient } from "@/api/queryClient";
import { TooltipProvider } from "@/components/ui/Tooltip";
import { applyTheme, useTheme, watchSystemTheme } from "@/lib/theme";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createQueryClient);
  const preference = useTheme((state) => state.preference);

  useEffect(() => {
    applyTheme(preference);
  }, [preference]);

  useEffect(watchSystemTheme, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={300}>
        {children}
        <Toaster
          position="bottom-right"
          theme={preference}
          closeButton
          toastOptions={{
            className:
              "!rounded-lg !border-border !bg-surface !text-ink !font-sans !shadow-overlay",
          }}
        />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
