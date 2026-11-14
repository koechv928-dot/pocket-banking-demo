import type { Account, Txn } from "./bank/types";
import { formatDateTime, formatKES, maskAccount } from "./bank/logic";
import { APP_NAME, HOLDER } from "./bank/profile";

type Row = { txn: Txn; balance: number };

const NAVY: [number, number, number] = [30, 53, 97];
const GREEN: [number, number, number] = [123, 176, 30];

export async function downloadStatementPdf(opts: {
  accounts: Account[];
  rows: Row[];
  from: string;
  to: string;
  filterLabel: string;
  balances: Record<string, number>;
}) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 40;

  const header = () => {
    doc.setFillColor(...NAVY);
    doc.rect(0, 0, W, 70, "F");
    doc.setFillColor(...GREEN);
    doc.rect(0, 70, W, 4, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text(APP_NAME.toUpperCase(), M, 42);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Account Statement  ·  DEMO - not a real bank document", W - M, 42, { align: "right" });
  };

  header();
  let y = 104;
  doc.setTextColor(20, 30, 60);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(HOLDER.fullName, M, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  y += 16;
  doc.text(`Statement period: ${opts.from} to ${opts.to}`, M, y);
  y += 14;
  doc.text(`Filter: ${opts.filterLabel}`, M, y);
  y += 14;
  for (const a of opts.accounts) {
    doc.text(`${a.name}: ${a.number}   ·   Closing balance ${formatKES(opts.balances[a.id] ?? 0)}`, M, y);
    y += 14;
  }
  doc.text(`Generated: ${new Date().toLocaleString("en-GB")}`, M, y);
  y += 22;

  const cols = [M, M + 70, M + 135, M + 330, M + 415, W - M];
  const tableHeader = () => {
    doc.setFillColor(238, 242, 248);
    doc.rect(M - 4, y - 12, W - 2 * M + 8, 18, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.text("Date", cols[0], y);
    doc.text("Ref", cols[1], y);
    doc.text("Description", cols[2], y);
    doc.text("Debit", cols[3] + 70, y, { align: "right" });
    doc.text("Credit", cols[4] + 60, y, { align: "right" });
    doc.text("Balance", cols[5], y, { align: "right" });
    doc.setFont("helvetica", "normal");
    y += 18;
  };
  tableHeader();

  if (opts.rows.length === 0) {
    doc.text("No transactions in this period.", M, y);
  }
  for (const { txn, balance } of opts.rows) {
    if (y > H - 50) {
      doc.addPage();
      header();
      y = 100;
      tableHeader();
    }
    const { date, time } = formatDateTime(txn.date);
    const desc = doc.splitTextToSize(txn.description, 185) as string[];
    doc.setFontSize(8);
    doc.text(`${date}`, cols[0], y);
    doc.setTextColor(110, 120, 140);
    doc.text(time, cols[0], y + 10);
    doc.setTextColor(20, 30, 60);
    doc.text(txn.ref, cols[1], y);
    doc.text(desc.slice(0, 2), cols[2], y);
    const debit = txn.direction === "debit" ? formatKES(txn.amount + txn.fee, false) : "";
    const credit = txn.direction === "credit" ? formatKES(txn.amount, false) : "";
    doc.text(debit, cols[3] + 70, y, { align: "right" });
    doc.text(credit, cols[4] + 60, y, { align: "right" });
    doc.text(formatKES(balance, false), cols[5], y, { align: "right" });
    y += Math.max(22, desc.slice(0, 2).length * 10 + 12);
    doc.setDrawColor(230, 233, 240);
    doc.line(M - 4, y - 10, W - M + 4, y - 10);
  }

  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(120, 130, 150);
    doc.text(`${APP_NAME} demo statement for ${HOLDER.fullName}  ·  Page ${i} of ${pages}`, W / 2, H - 20, { align: "center" });
  }
  doc.save(`Kilele-Statement-${opts.from}-to-${opts.to}.pdf`);
}

export async function downloadReceiptPdf(txn: Txn, account: Account, payTo?: string) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: [320, 520] });
  const W = 320;
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, W, 64, "F");
  doc.setFillColor(...GREEN);
  doc.rect(0, 64, W, 3, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text(APP_NAME.toUpperCase(), 20, 38);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("Transaction receipt · DEMO", W - 20, 38, { align: "right" });

  doc.setTextColor(20, 30, 60);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text(`${txn.direction === "credit" ? "+" : "-"}${formatKES(txn.amount)}`, W / 2, 110, { align: "center" });
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(40, 140, 80);
  doc.text("SUCCESSFUL", W / 2, 128, { align: "center" });

  const { date, time } = formatDateTime(txn.date);
  const lines: [string, string][] = [
    ...(payTo ? ([["Pay to", payTo.replace(/^Pay to: /, "")]] as [string, string][]) : []),
    ["Description", txn.description],
    ["From", HOLDER.fullName],
    ["Account", `${account.name} (${maskAccount(account.number)})`],
    ...((txn.details ?? []).map((d) => [d.label, d.value]) as [string, string][]),
    ["Fee", formatKES(txn.fee)],
    ["Reference", txn.ref],
    ["Date", date],
    ["Time", time],
  ];
  let y = 160;
  doc.setTextColor(20, 30, 60);
  for (const [k, v] of lines) {
    doc.setTextColor(110, 120, 140);
    doc.text(k, 20, y);
    doc.setTextColor(20, 30, 60);
    const wrapped = doc.splitTextToSize(v, 170) as string[];
    doc.text(wrapped, W - 20, y, { align: "right" });
    y += 12 * wrapped.length + 8;
  }
  doc.setFontSize(7.5);
  doc.setTextColor(120, 130, 150);
  doc.text("This is a demo receipt. No real money was moved.", W / 2, 500, { align: "center" });
  doc.save(`Kilele-Receipt-${txn.ref}.pdf`);
}
