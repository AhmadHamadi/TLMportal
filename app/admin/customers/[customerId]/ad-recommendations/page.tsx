import { notFound } from "next/navigation";
import Link from "next/link";
import { getCustomerById } from "@/server/services/customers";
import { isAnthropicConfigured } from "@/server/services/ad-recommendations";
import { requireAdmin } from "@/lib/auth-guard";
import { buttonVariants } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AdRecommendationsForm } from "@/components/ad-recommendations/form";

export const metadata = { title: "AI Ad Recommendations — Admin" };

export default async function AdRecommendationsPage({
  params,
}: {
  params: Promise<{ customerId: string }>;
}) {
  const { customerId } = await params;
  const ctx = await requireAdmin();
  const customer = await getCustomerById(ctx, customerId);
  if (!customer) notFound();
  const aiReady = isAnthropicConfigured();

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Ad recommendations</h1>
          <p className="text-sm text-muted-foreground">
            For <strong>{customer.businessName}</strong>. Claude reads the landing page +
            campaign metrics and proposes specific keywords, copy, exclusions, and landing-page
            improvements.
          </p>
        </div>
        <Link
          href={`/admin/customers/${customer.id}`}
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          ← Back to customer
        </Link>
      </div>

      {!aiReady ? (
        <Alert>
          <AlertDescription>
            Set <code>ANTHROPIC_API_KEY</code> in your environment to enable AI recommendations.
          </AlertDescription>
        </Alert>
      ) : null}

      <AdRecommendationsForm
        customerId={customer.id}
        defaultLandingPageUrl={customer.landingPageUrl ?? ""}
        disabled={!aiReady}
      />
    </div>
  );
}
