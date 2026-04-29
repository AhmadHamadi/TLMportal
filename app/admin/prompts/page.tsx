import { requireAdmin } from "@/lib/auth-guard";
import { PROMPT_LIBRARY, NICHE_LANDING_VARIANTS } from "@/lib/prompt-library";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/shared/copy-button";

export const metadata = { title: "Prompt library — Admin" };

export default async function PromptsPage() {
  await requireAdmin();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Prompt library</h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Production-grade prompts your team uses to scaffold landing pages, full sites, GBP
          entries, Google Ads, and SEO. Niche-flavored variants are appended below the general
          template — copy and paste with the customer&rsquo;s details filled in from their detail
          page.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {PROMPT_LIBRARY.map((p) => (
          <Card key={p.id} className="flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-2">
                <Badge variant="outline">{p.category.replace(/_/g, " ")}</Badge>
                <Badge variant="secondary">{p.niches.join(", ")}</Badge>
              </div>
              <CardTitle className="text-base mt-2">{p.title}</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">{p.description}</p>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-3">
              <details className="text-xs">
                <summary className="cursor-pointer text-muted-foreground">
                  Show full prompt
                </summary>
                <pre className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap rounded bg-muted p-3 font-mono text-[11px] leading-snug">
                  {p.body}
                </pre>
              </details>
              <CopyButton text={p.body} label="Copy prompt" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div>
        <h2 className="text-lg font-semibold tracking-tight">Niche variants for landing pages</h2>
        <p className="text-sm text-muted-foreground mb-3">
          Append the variant for the contractor&rsquo;s niche to the general landing-page prompt.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Object.entries(NICHE_LANDING_VARIANTS).map(([niche, body]) => (
            <Card key={niche}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{niche}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-xs text-muted-foreground leading-snug">{body}</p>
                <CopyButton text={body} label="Copy variant" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
