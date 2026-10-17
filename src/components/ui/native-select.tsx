import * as React from "react";
import { cn } from "@/lib/utils";

type NativeSelectProps = React.ComponentProps<"select"> & {
  unstyled?: boolean;
};

/** A native select preserves keyboard behavior, screenshot geometry and the MSW E2E selectors. */
function NativeSelect({
  className,
  unstyled = false,
  ...props
}: NativeSelectProps) {
  return (
    <select
      data-slot="native-select"
      className={cn(
        !unstyled &&
          "w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export { NativeSelect };
