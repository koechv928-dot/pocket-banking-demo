import { createFileRoute } from "@tanstack/react-router";
import { PendingScreen } from "@/components/bank/PendingScreen";

export const Route = createFileRoute("/transact")({
  
  head: () => ({
    meta: [
      { title: "Transact - Kilele Bank" },
      { name: "description", content: "Transact in the Kilele Bank demo app." },
      { property: "og:title", content: "Transact - Kilele Bank" },
      { property: "og:description", content: "Transact in the Kilele Bank demo app." },
    ],
  }),
  component: () => <PendingScreen title="Transact" />,
});
