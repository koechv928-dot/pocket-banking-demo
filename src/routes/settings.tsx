import { createFileRoute } from "@tanstack/react-router";
import { PendingScreen } from "@/components/bank/PendingScreen";

export const Route = createFileRoute("/settings")({
  
  head: () => ({
    meta: [
      { title: "Settings - Kilele Bank" },
      { name: "description", content: "Settings in the Kilele Bank demo app." },
      { property: "og:title", content: "Settings - Kilele Bank" },
      { property: "og:description", content: "Settings in the Kilele Bank demo app." },
    ],
  }),
  component: () => <PendingScreen title="Settings" />,
});
