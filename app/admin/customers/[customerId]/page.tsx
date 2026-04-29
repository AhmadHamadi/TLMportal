import Link from "next/link";
import { notFound } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/shared/status-badge";
import { getCustomerById } from "@/server/services/customers";
import { requireAdmin } from "@/lib/auth-guard";
import { formatMoney } from "@/lib/money";
import { formatNational } from "@/lib/phone";
import {
  addServiceAction,
  toggleServiceAction,
  deleteServiceAction,
  addServiceAreaAction,
  toggleServiceAreaAction,
  deleteServiceAreaAction,
  deleteCustomerAction,
} from "@/server/actions/customers";
import { InviteUserForm } from "@/components/customers/invite-user-form";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ customerId: string }>;
}) {
  const { customerId } = await params;
  const ctx = await requireAdmin();
  const customer = await getCustomerById(ctx, customerId);
  if (!customer) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">{customer.businessName}</h1>
            <StatusBadge status={customer.status} />
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {customer.contactName} · {customer.email} · {formatNational(customer.phone)}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/admin/customers/${customer.id}/edit`}
            className={buttonVariants({ variant: "outline" })}
          >
            Edit
          </Link>
          <form action={deleteCustomerAction}>
            <input type="hidden" name="id" value={customer.id} />
            <Button type="submit" variant="destructive">
              Archive
            </Button>
          </form>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="areas">Service areas</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="numbers">Tracking numbers</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-sm">Setup fee</CardTitle></CardHeader>
              <CardContent className="text-2xl font-semibold">
                {formatMoney(customer.setupFee)}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm">Monthly retainer</CardTitle></CardHeader>
              <CardContent className="text-2xl font-semibold">
                {formatMoney(customer.monthlyRetainer)}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm">Appointment fee</CardTitle></CardHeader>
              <CardContent className="text-2xl font-semibold">
                {formatMoney(customer.appointmentFee)}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm">Monthly ad budget</CardTitle></CardHeader>
              <CardContent className="text-2xl font-semibold">
                {formatMoney(customer.monthlyAdBudget)}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm">Min project size</CardTitle></CardHeader>
              <CardContent className="text-2xl font-semibold">
                {customer.minProjectSize ? formatMoney(customer.minProjectSize) : "—"}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm">Dispute window</CardTitle></CardHeader>
              <CardContent className="text-2xl font-semibold">{customer.disputeWindowHours}h</CardContent>
            </Card>
          </div>
          {customer.notes ? (
            <Card>
              <CardHeader><CardTitle className="text-sm">Notes</CardTitle></CardHeader>
              <CardContent className="text-sm whitespace-pre-wrap">{customer.notes}</CardContent>
            </Card>
          ) : null}
        </TabsContent>

        <TabsContent value="services" className="space-y-3">
          <form action={addServiceAction} className="flex gap-2 max-w-md">
            <input type="hidden" name="customerId" value={customer.id} />
            <input
              type="text"
              name="name"
              placeholder="e.g. Concrete driveways"
              className="flex-1 rounded-md border bg-background px-3 py-1.5 text-sm"
              required
            />
            <Button type="submit" size="sm">Add</Button>
          </form>
          <ul className="rounded-md border divide-y bg-card">
            {customer.services.map((s) => (
              <li key={s.id} className="flex items-center justify-between px-4 py-2">
                <div className="flex items-center gap-2">
                  <span className={s.isActive ? "" : "text-muted-foreground line-through"}>
                    {s.name}
                  </span>
                  {!s.isActive ? <StatusBadge status="INACTIVE" /> : null}
                </div>
                <div className="flex gap-2">
                  <form action={toggleServiceAction}>
                    <input type="hidden" name="id" value={s.id} />
                    <input type="hidden" name="customerId" value={customer.id} />
                    <Button type="submit" variant="ghost" size="sm">
                      {s.isActive ? "Disable" : "Enable"}
                    </Button>
                  </form>
                  <form action={deleteServiceAction}>
                    <input type="hidden" name="id" value={s.id} />
                    <input type="hidden" name="customerId" value={customer.id} />
                    <Button type="submit" variant="ghost" size="sm">
                      Remove
                    </Button>
                  </form>
                </div>
              </li>
            ))}
            {customer.services.length === 0 ? (
              <li className="px-4 py-3 text-sm text-muted-foreground">No services yet.</li>
            ) : null}
          </ul>
        </TabsContent>

        <TabsContent value="areas" className="space-y-3">
          <form action={addServiceAreaAction} className="flex flex-wrap gap-2 max-w-2xl">
            <input type="hidden" name="customerId" value={customer.id} />
            <input
              type="text"
              name="city"
              placeholder="City"
              className="flex-1 min-w-[140px] rounded-md border bg-background px-3 py-1.5 text-sm"
              required
            />
            <input
              type="text"
              name="neighbourhood"
              placeholder="Neighbourhood (optional)"
              className="flex-1 min-w-[140px] rounded-md border bg-background px-3 py-1.5 text-sm"
            />
            <input
              type="text"
              name="province"
              defaultValue="ON"
              className="w-16 rounded-md border bg-background px-3 py-1.5 text-sm"
            />
            <Button type="submit" size="sm">Add</Button>
          </form>
          <ul className="rounded-md border divide-y bg-card">
            {customer.serviceAreas.map((a) => (
              <li key={a.id} className="flex items-center justify-between px-4 py-2">
                <div className="flex items-center gap-2">
                  <span className={a.isActive ? "" : "text-muted-foreground line-through"}>
                    {[a.city, a.neighbourhood].filter(Boolean).join(" — ")}, {a.province}
                  </span>
                  {!a.isActive ? <StatusBadge status="INACTIVE" /> : null}
                </div>
                <div className="flex gap-2">
                  <form action={toggleServiceAreaAction}>
                    <input type="hidden" name="id" value={a.id} />
                    <input type="hidden" name="customerId" value={customer.id} />
                    <Button type="submit" variant="ghost" size="sm">
                      {a.isActive ? "Disable" : "Enable"}
                    </Button>
                  </form>
                  <form action={deleteServiceAreaAction}>
                    <input type="hidden" name="id" value={a.id} />
                    <input type="hidden" name="customerId" value={customer.id} />
                    <Button type="submit" variant="ghost" size="sm">
                      Remove
                    </Button>
                  </form>
                </div>
              </li>
            ))}
            {customer.serviceAreas.length === 0 ? (
              <li className="px-4 py-3 text-sm text-muted-foreground">No service areas yet.</li>
            ) : null}
          </ul>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <ul className="rounded-md border divide-y bg-card">
            {customer.users.map((u) => (
              <li key={u.id} className="flex items-center justify-between px-4 py-2">
                <div>
                  <div className="font-medium text-sm">{u.user.name ?? u.user.email}</div>
                  <div className="text-xs text-muted-foreground">{u.user.email}</div>
                </div>
                <StatusBadge status={u.role} />
              </li>
            ))}
            {customer.users.length === 0 ? (
              <li className="px-4 py-3 text-sm text-muted-foreground">No users linked.</li>
            ) : null}
          </ul>
          <Separator />
          <h3 className="text-sm font-medium text-muted-foreground">Invite a contractor user</h3>
          <InviteUserForm customerId={customer.id} />
        </TabsContent>

        <TabsContent value="numbers" className="space-y-3">
          <ul className="rounded-md border divide-y bg-card">
            {customer.trackingNumbers.map((tn) => (
              <li key={tn.id} className="flex items-center justify-between px-4 py-2">
                <div>
                  <div className="font-medium text-sm">{formatNational(tn.twilioPhoneNumber)}</div>
                  <div className="text-xs text-muted-foreground">
                    forwards to {formatNational(tn.forwardingPhoneNumber)}
                    {tn.label ? ` · ${tn.label}` : ""}
                  </div>
                </div>
                <StatusBadge status={tn.status} />
              </li>
            ))}
            {customer.trackingNumbers.length === 0 ? (
              <li className="px-4 py-3 text-sm text-muted-foreground">
                No tracking numbers assigned. Twilio integration ships in Phase 6.
              </li>
            ) : null}
          </ul>
        </TabsContent>
      </Tabs>
    </div>
  );
}
