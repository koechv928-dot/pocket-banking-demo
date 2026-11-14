import { createFileRoute } from "@tanstack/react-router";
import { PendingScreen } from "@/components/bank/PendingScreen";

export const Route = createFileRoute("/send")({
  validateSearch: (s: Record<string, unknown>): { type?: string } => (typeof s.type === "string" ? { type: s.type } : {}),
  head: () => ({
    meta: [
      { title: "Send Money - Kilele Bank" },
      { name: "description", content: "Send Money in the Kilele Bank demo app." },
      { property: "og:title", content: "Send Money - Kilele Bank" },
      { property: "og:description", content: "Send Money in the Kilele Bank demo app." },
    ],
  }),
  component: () => <PendingScreen title="Send Money" />,
});
