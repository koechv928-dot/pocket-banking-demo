import { useRouter, Link, type LinkProps } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import type { ReactNode } from "react";

export function PageHeader({
  title,
  back = true,
  right,
  onBack,
}: {
  title: string;
  back?: boolean;
  right?: ReactNode;
  onBack?: () => void;
}) {
  const router = useRouter();
  const goBack = () => {
    if (onBack) return onBack();
    if (window.history.length > 1) router.history.back();
    else router.navigate({ to: "/home" });
  };
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border/60 bg-background/95 px-3 backdrop-blur">
      {back ? (
        <button
          type="button"
          onClick={goBack}
          aria-label="Go back"
          className="flex h-10 w-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      ) : (
        <div className="w-2" />
      )}
      <h1 className="flex-1 truncate text-lg font-semibold text-foreground">{title}</h1>
      <div className="flex items-center gap-1">{right}</div>
    </header>
  );
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-2 mt-5 flex items-center justify-between">
      <h2 className="text-sm font-semibold text-foreground">{children}</h2>
      {action}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon: ReactNode;
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-primary">{icon}</div>
      <p className="font-semibold text-foreground">{title}</p>
      {body && <p className="mt-1 text-sm text-muted-foreground">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function MenuLink({
  to,
  icon,
  label,
  hint,
}: {
  to: LinkProps["to"];
  icon: ReactNode;
  label: string;
  hint?: string;
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-muted"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-primary">{icon}</span>
      <span className="flex-1">
        <span className="block text-sm font-medium text-foreground">{label}</span>
        {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
      </span>
      <ChevronLeft className="h-4 w-4 rotate-180 text-muted-foreground" />
    </Link>
  );
}
