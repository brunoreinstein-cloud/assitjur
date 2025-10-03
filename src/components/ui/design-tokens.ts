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
    focus:
      "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    disabled: "opacity-50 pointer-events-none cursor-not-allowed",
  },
  density: {
    compact: {
      row: "py-1",
      cell: "px-3 py-1",
      text: "text-xs",
      badge: "text-[10px] px-1.5 py-0",
      button: "h-6 w-6",
      icon: "h-3 w-3",
    },
    comfortable: {
      row: "py-3",
      cell: "px-4 py-3",
      text: "text-sm",
      badge: "text-xs px-2 py-0.5",
      button: "h-8 w-8",
      icon: "h-4 w-4",
    },
  },
};

export type Density = keyof typeof tokens.density;
export type Contrast = "normal" | "high";
