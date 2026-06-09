import { shadcn } from "@clerk/ui/themes";

/** Shared Clerk appearance — matches the app's sky/stone palette. */
export const clerkAppearance = {
  theme: shadcn,
  variables: {
    colorPrimary: "#0284c7",
    colorBackground: "#ffffff",
    colorInput: "#ffffff",
    colorInputForeground: "#0f172a",
    colorForeground: "#0f172a",
    colorMuted: "#f0f9ff",
    colorMutedForeground: "#64748b",
    colorNeutral: "#0f172a",
    colorDanger: "#dc2626",
    borderRadius: "0.5rem",
    fontFamily: "var(--font-sans), system-ui, sans-serif",
  },
  elements: {
    rootBox: "mx-auto w-full max-w-[420px]",
    cardBox: "shadow-md border border-sky-200 rounded-xl",
    headerTitle: "text-slate-900 font-semibold",
    headerSubtitle: "text-slate-600",
    formButtonPrimary:
      "bg-sky-600 hover:bg-sky-700 text-white shadow-none after:hidden",
    formFieldInput:
      "border-sky-200 bg-white text-slate-900 focus:ring-sky-400",
    socialButtonsBlockButton:
      "border-sky-200 bg-white text-slate-900 hover:bg-sky-50",
    footerActionLink: "text-sky-700 hover:text-sky-800",
    identityPreviewEditButton: "text-sky-700",
  },
};

export const clerkDarkAppearance = {
  ...clerkAppearance,
  variables: {
    ...clerkAppearance.variables,
    colorPrimary: "#e7e5e4",
    colorBackground: "#292524",
    colorInput: "#1c1917",
    colorInputForeground: "#fafaf9",
    colorForeground: "#fafaf9",
    colorMuted: "#44403c",
    colorMutedForeground: "#a8a29e",
    colorNeutral: "#fafaf9",
  },
  elements: {
    ...clerkAppearance.elements,
    cardBox: "shadow-md border border-stone-600 rounded-xl",
    headerTitle: "text-stone-50 font-semibold",
    headerSubtitle: "text-stone-400",
    formButtonPrimary:
      "bg-stone-100 hover:bg-stone-200 text-stone-900 shadow-none after:hidden",
    formFieldInput:
      "border-stone-600 bg-stone-950 text-stone-100 focus:ring-stone-500",
    socialButtonsBlockButton:
      "border-stone-600 bg-stone-900 text-stone-100 hover:bg-stone-800",
    footerActionLink: "text-stone-200 hover:text-white",
  },
};
