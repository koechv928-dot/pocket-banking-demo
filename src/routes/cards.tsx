import { createFileRoute } from "@tanstack/react-router";
import { PendingScreen } from "@/components/bank/PendingScreen";

export const Route = createFileRoute("/cards")({
  
  head: () => ({
    meta: [
      { title: "Cards - Kilele Bank" },
      { name: "description", content: "Cards in the Kilele Bank demo app." },
      { property: "og:title", content: "Cards - Kilele Bank" },
      { property: "og:description", content: "Cards in the Kilele Bank demo app." },
    ],
  }),
  component: () => <PendingScreen title="Cards" />,
});
