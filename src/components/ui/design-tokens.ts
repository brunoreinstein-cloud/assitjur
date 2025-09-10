export const tokens = {
  spacing: {
    comfortable: "p-4",
    compact: "p-2",
  },
  typography: {
    title: "text-lg font-semibold",
    body: "text-sm leading-6",
  },
  states: {
    hover: "transition-colors hover:bg-muted",
    focus: "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    disabled: "opacity-50 pointer-events-none cursor-not-allowed",
  },
};

export type Density = keyof typeof tokens.spacing;
export type Contrast = "normal" | "high";
