import { Link } from "@tanstack/react-router";
import { Construction } from "lucide-react";
import { PageHeader, EmptyState } from "./PageHeader";
import { Button } from "@/components/ui/button";

/** Shown for screens that were not finished in this build. */
export function PendingScreen({ title }: { title: string }) {
  return (
    <div>
      <PageHeader title={title} />
      <EmptyState
        icon={<Construction className="h-6 w-6" />}
        title={`${title} isn't built yet`}
        body="This screen still needs to be finished."
        action={
          <Button asChild>
            <Link to="/home">Back to Home</Link>
          </Button>
        }
      />
    </div>
  );
}
