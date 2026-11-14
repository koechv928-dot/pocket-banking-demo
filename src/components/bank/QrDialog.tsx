import { useMemo } from "react";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useBank } from "@/lib/bank/store";
import { HOLDER } from "@/lib/bank/profile";

function pattern(seed: string, n = 25) {
  let h = 2166136261;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  const cells: boolean[] = [];
  for (let i = 0; i < n * n; i++) {
    h = Math.imul(h ^ (h >>> 13), 0x5bd1e995);
    cells.push(((h >>> 7) & 1) === 1);
  }
  const finder = (x: number, y: number) => {
    const finders: [number, number][] = [[0, 0], [n - 7, 0], [0, n - 7]];
    for (const [fx, fy] of finders) {
      const dx = x - fx, dy = y - fy;
      if (dx >= 0 && dx < 7 && dy >= 0 && dy < 7) {
        const edge = dx === 0 || dx === 6 || dy === 0 || dy === 6;
        const core = dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4;
        return edge || core ? 1 : 0;
      }
      if (dx >= -1 && dx <= 7 && dy >= -1 && dy <= 7) return 0;
    }
    return -1;
  };
  return { n, on: (x: number, y: number) => { const f = finder(x, y); return f === -1 ? cells[y * n + x] : f === 1; } };
}

export function QrDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { state } = useBank();
  const acc = state.accounts[0]!;
  const qr = useMemo(() => pattern(acc.number), [acc.number]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle>Receive money</DialogTitle>
          <DialogDescription>Let the sender scan this code or share your account number.</DialogDescription>
        </DialogHeader>
        <div className="mx-auto rounded-2xl bg-card p-4 shadow-card">
          <svg viewBox={`0 0 ${qr.n} ${qr.n}`} className="h-52 w-52 text-navy" role="img" aria-label="Account QR code">
            {Array.from({ length: qr.n }).flatMap((_, y) =>
              Array.from({ length: qr.n }).map((__, x) =>
                qr.on(x, y) ? <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill="currentColor" /> : null,
              ),
            )}
          </svg>
        </div>
        <div className="text-center">
          <p className="font-semibold text-foreground">{HOLDER.fullName}</p>
          <p className="text-sm text-muted-foreground">
            {acc.name} · {acc.number}
          </p>
        </div>
        <Button
          variant="soft"
          onClick={() => {
            void navigator.clipboard?.writeText(acc.number).then(
              () => toast.success("Account number copied"),
              () => toast.error("Couldn't copy on this device"),
            );
          }}
        >
          <Copy /> Copy account number
        </Button>
      </DialogContent>
    </Dialog>
  );
}
