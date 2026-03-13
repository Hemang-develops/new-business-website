import * as React from "react";

import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-24 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white shadow-sm outline-none transition placeholder:text-white/40 focus-visible:border-teal-300 focus-visible:ring-2 focus-visible:ring-teal-300/30 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
