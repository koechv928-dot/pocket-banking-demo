import { createFileRoute } from "@tanstack/react-router";
import { PendingScreen } from "@/components/bank/PendingScreen";

export const Route = createFileRoute("/airtime")({
  
  head: () => ({
    meta: [
      { title: "Buy Airtime - Kilele Bank" },
      { name: "description", content: "Buy Airtime in the Kilele Bank demo app." },
      { property: "og:title", content: "Buy Airtime - Kilele Bank" },
      { property: "og:description", content: "Buy Airtime in the Kilele Bank demo app." },
    ],
  }),
  component: () => <PendingScreen title="Buy Airtime" />,
});
