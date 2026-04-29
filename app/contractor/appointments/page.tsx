import { listAppointments } from "@/server/services/appointments";
import { requireContractor } from "@/lib/auth-guard";
import { EmptyState } from "@/components/shared/empty-state";
import { CalendarCheck } from "lucide-react";
import { AppointmentCard } from "@/components/contractor/appointment-card";

export const metadata = { title: "Appointments - TLM Portal" };

export default async function ContractorAppointmentsPage() {
  const ctx = await requireContractor();
  const items = await listAppointments(ctx);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Appointments</h1>
        <p className="text-sm text-muted-foreground">
          Tap to accept, decline, or open the lead.
        </p>
      </div>
      {items.length === 0 ? (
        <EmptyState icon={CalendarCheck} title="No appointments yet" />
      ) : (
        <ul className="space-y-3">
          {items.map((a) => (
            <li key={a.id}>
              <AppointmentCard appt={a} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
