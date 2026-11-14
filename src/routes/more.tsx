import { createFileRoute } from "@tanstack/react-router";
import { PendingScreen } from "@/components/bank/PendingScreen";

export const Route = createFileRoute("/more")({
  
  head: () => ({
    meta: [
      { title: "More - Kilele Bank" },
      { name: "description", content: "More in the Kilele Bank demo app." },
      { property: "og:title", content: "More - Kilele Bank" },
      { property: "og:description", content: "More in the Kilele Bank demo app." },
    ],
  }),
  component: () => <PendingScreen title="More" />,
});
