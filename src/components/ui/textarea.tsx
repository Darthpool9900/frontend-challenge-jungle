import * as React from "react";
import { cn } from "@/lib/utils";

type TextareaProps = React.ComponentProps<"textarea"> & {
  unstyled?: boolean;
};

function Textarea({ className, unstyled = false, ...props }: TextareaProps) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        !unstyled &&
          "w-full min-h-16 rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
