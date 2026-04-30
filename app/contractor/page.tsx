import Link from "next/link";
import { contractorDashboardData, contractorOverviewStats } from "@/server/services/billing";
import { requireContractor } from "@/lib/auth-guard";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { formatNational } from "@/lib/phone";
import { requestAdBudgetChangeAction } from "@/server/actions/ad-spend";
import { CalendarCheck, Inbox, LineChart, MessageSquare, Phone } from "lucide-react";

export const metadata = { title: "Overview - TLM Portal" };

function leadName(lead: { firstName: string | null; lastName: string | null }) {
  return [lead.firstName, lead.lastName].filter(Boolean).join(" ") || "Lead";
}

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function nextSevenDays() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    return day;
  });
}

export default async function ContractorOverview() {
  const ctx = await requireContractor();
  const [stats, dashboard] = await Promise.all([
    contractorOverviewStats(ctx),
    contractorDashboardData(ctx),
  ]);

  const confirmedAppointments = dashboard.upcomingAppointments.filter((appointment) =>
    ["ACCEPTED", "CONFIRMED", "COMPLETED"].includes(appointment.status),
  );
  const bookingRate = stats.leadsThisMonth > 0
    ? Math.round((stats.confirmedThisMonth / stats.leadsThisMonth) * 100)
    : 0;
  const appointmentsByDay = new Map<string, number>();
  for (const appointment of confirmedAppointments) {
    if (!appointment.appointmentWindowStart) continue;
    const key = dateKey(appointment.appointmentWindowStart);
    appointmentsByDay.set(key, (appointmentsByDay.get(key) ?? 0) + 1);
  }
  const googleAdsCustomers = dashboard.customers.filter((customer) => customer.googleAdsEnabled);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border bg-[radial-gradient(circle_at_top_left,_hsl(var(--primary)/0.16),_transparent_34%),linear-gradient(135deg,_hsl(var(--card)),_hsl(var(--muted)/0.5))] p-5 shadow-sm md:p-6">
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Your lead dashboard</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">
          Simple view: leads, confirmed booked appointments, call logs, SMS follow-up, and Google Ads budget requests.
        </p>
      </section>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total leads" value={stats.leadsThisMonth} icon={Inbox} />
        <StatCard label="Booked appointments" value={stats.confirmedThisMonth} icon={CalendarCheck} />
        <StatCard label="Booking rate" value={`${bookingRate}%`} hint="Booked appointments divided by leads." icon={LineChart} />
        <StatCard label="Tracked calls" value={stats.callsThisMonth} icon={Phone} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarCheck className="h-4 w-4 text-muted-foreground" />
              7-day appointment calendar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2">
              {nextSevenDays().map((day) => {
                const count = appointmentsByDay.get(dateKey(day)) ?? 0;
                return (
                  <div key={day.toISOString()} className={count > 0 ? "rounded-xl border bg-primary/10 p-2 text-center ring-1 ring-primary/20" : "rounded-xl border bg-muted/30 p-2 text-center"}>
                    <div className="text-[10px] uppercase text-muted-foreground">
                      {new Intl.DateTimeFormat("en-CA", { weekday: "short" }).format(day)}
                    </div>
                    <div className="mt-1 text-lg font-semibold">{day.getDate()}</div>
                    <div className="mt-1 text-[11px] text-muted-foreground">
                      {count ? `${count} booked` : "clear"}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Confirmed booked appointments</CardTitle>
          </CardHeader>
          <CardContent>
            {confirmedAppointments.length === 0 ? (
              <p className="rounded-xl border border-dashed bg-muted/40 p-4 text-sm text-muted-foreground">
                No confirmed booked appointments yet.
              </p>
            ) : (
              <div className="space-y-3">
                {confirmedAppointments.slice(0, 5).map((appointment) => (
                  <Link key={appointment.id} href={`/contractor/leads/${appointment.leadId}`} className="block rounded-xl border p-3 transition hover:bg-muted/60">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium">{leadName(appointment.lead)}</p>
                      <StatusBadge status={appointment.status} />
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {appointment.lead.serviceRequested ?? "Estimate"}
                      {appointment.lead.city ? ` - ${appointment.lead.city}` : ""}
                      {` - ${formatDateTime(appointment.appointmentWindowStart)}`}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              Recent tracking calls
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dashboard.recentCallLogs.length === 0 ? (
              <p className="rounded-xl border border-dashed bg-muted/40 p-4 text-sm text-muted-foreground">No tracked calls yet.</p>
            ) : (
              <div className="space-y-3">
                {dashboard.recentCallLogs.slice(0, 4).map((call) => (
                  <div key={call.id} className="rounded-xl border p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium">{formatNational(call.fromNumber)}</p>
                      <StatusBadge status={call.lead?.appointment ? "BOOKED_APPOINTMENT" : "LEAD"} />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatDateTime(call.createdAt)} - tracking number {formatNational(call.trackingNumber)} - {call.callStatus}
                    </p>
                  </div>
                ))}
                <Link href="/contractor/calls" className="block text-sm font-medium text-primary hover:underline">View all calls</Link>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              SMS summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dashboard.recentLeads.length === 0 ? (
              <p className="rounded-xl border border-dashed bg-muted/40 p-4 text-sm text-muted-foreground">No SMS follow-up yet.</p>
            ) : (
              <div className="space-y-3">
                {dashboard.recentLeads.slice(0, 4).map((lead) => (
                  <Link key={lead.id} href={`/contractor/leads/${lead.id}`} className="block rounded-xl border p-3 transition hover:bg-muted/60">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium">{leadName(lead)}</p>
                      <StatusBadge status={lead.appointment ? "BOOKED_APPOINTMENT" : "NOT_BOOKED"} />
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {lead.serviceRequested ?? "Estimate request"}
                      {lead.city ? ` - ${lead.city}` : ""}
                    </p>
                  </Link>
                ))}
                <Link href="/contractor/sms" className="block text-sm font-medium text-primary hover:underline">View SMS summary</Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {googleAdsCustomers.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Set next 30-day Google Ads budget</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={requestAdBudgetChangeAction} className="grid gap-3 md:grid-cols-5">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Account</label>
                <select name="customerId" className="mt-1 h-9 w-full rounded-md border bg-background px-3 text-sm">
                  {googleAdsCustomers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.businessName} - current {customer.googleAdsBudgetCurrency} {formatMoney(customer.monthlyAdBudget)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Currency</label>
                <select name="currency" className="mt-1 h-9 w-full rounded-md border bg-background px-3 text-sm">
                  <option value="CAD">CAD</option>
                  <option value="USD">USD</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Budget request</label>
                <select name="direction" className="mt-1 h-9 w-full rounded-md border bg-background px-3 text-sm">
                  <option value="keep">Keep / confirm</option>
                  <option value="increase">Increase</option>
                  <option value="decrease">Decrease</option>
                  <option value="change">Change</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Next 30 days</label>
                <input name="requestedBudget" type="number" min="700" step="50" placeholder="700 minimum" required className="mt-1 h-9 w-full rounded-md border bg-background px-3 text-sm" />
              </div>
              <div className="flex items-end">
                <Button type="submit" className="w-full">Send request</Button>
              </div>
              <p className="md:col-span-5 text-xs text-muted-foreground">Minimum recommended ad budget is 700. We will also ask at the beginning of each month by SMS.</p>
              <textarea name="note" rows={2} placeholder="Optional note" className="md:col-span-5 rounded-md border bg-background px-3 py-2 text-sm" />
            </form>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
