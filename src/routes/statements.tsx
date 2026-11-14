import { createFileRoute } from "@tanstack/react-router";
import { PendingScreen } from "@/components/bank/PendingScreen";

export const Route = createFileRoute("/statements")({
  
  head: () => ({
    meta: [
      { title: "Statements - Kilele Bank" },
      { name: "description", content: "Statements in the Kilele Bank demo app." },
      { property: "og:title", content: "Statements - Kilele Bank" },
      { property: "og:description", content: "Statements in the Kilele Bank demo app." },
    ],
  }),
  component: () => <PendingScreen title="Statements" />,
});
