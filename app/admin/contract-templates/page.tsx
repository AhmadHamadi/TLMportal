import { requireAdmin } from "@/lib/auth-guard";
import { CONTRACT_TEMPLATES } from "@/lib/contract-templates";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/shared/copy-button";

export const metadata = { title: "Contract templates — Admin" };

export default async function ContractTemplatesPage() {
  await requireAdmin();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Contract templates</h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Master agreement and statements of work used for every customer. To generate a
          customer-specific signed copy with their name auto-filled, open the customer&rsquo;s
          page and click <strong>Generate signing copy</strong>.
        </p>
      </div>

      <div className="space-y-4">
        {CONTRACT_TEMPLATES.map((t) => (
          <Card key={t.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-2">
                <Badge variant="outline">{t.type.replace(/_/g, " ")}</Badge>
                <CopyButton text={t.body} label="Copy template" />
              </div>
              <CardTitle className="text-base mt-2">{t.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <details>
                <summary className="cursor-pointer text-sm text-muted-foreground">
                  Show full text
                </summary>
                <pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap rounded border bg-muted p-4 font-mono text-xs leading-relaxed">
                  {t.body}
                </pre>
              </details>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
