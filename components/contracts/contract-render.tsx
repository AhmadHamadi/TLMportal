"use client";

import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { BrandMark } from "@/components/shared/brand-mark";

export function ContractRender({
  title,
  body,
  customerName,
}: {
  title: string;
  body: string;
  customerName: string;
}) {
  return (
    <div>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body, html { background: white !important; }
          .contract-page { box-shadow: none !important; border: none !important; padding: 0 !important; max-width: 100% !important; }
        }
      `}</style>

      <div className="no-print mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Auto-filled with {customerName}&rsquo;s details. Print to PDF for a signing copy.
        </p>
        <Button onClick={() => window.print()} size="sm" variant="outline" className="gap-2">
          <Printer className="h-4 w-4" />
          Print / Save PDF
        </Button>
      </div>

      <article className="contract-page mx-auto max-w-3xl rounded-lg border bg-card p-10 shadow-sm space-y-6">
        <header className="flex items-start justify-between border-b pb-5">
          <BrandMark size={36} wordmark="Trade Leads Marketing" />
          <div className="text-right">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Contract</div>
            <div className="text-sm font-semibold mt-0.5">{title}</div>
          </div>
        </header>
        <pre className="whitespace-pre-wrap font-sans text-[13.5px] leading-[1.65] text-ink">
          {body}
        </pre>
      </article>
    </div>
  );
}
