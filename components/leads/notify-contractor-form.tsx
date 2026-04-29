"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { notifyContractorAction } from "@/server/actions/sms";
import { toast } from "sonner";

export function NotifyContractorForm({ leadId }: { leadId: string }) {
  const [pending, start] = useTransition();
  return (
    <form
      action={(fd) => {
        start(async () => {
          await notifyContractorAction(fd);
          toast.success("Contractor notified");
        });
      }}
    >
      <input type="hidden" name="leadId" value={leadId} />
      <Button type="submit" variant="outline" disabled={pending} className="w-full">
        {pending ? "Sending..." : "Notify contractor (SMS summary)"}
      </Button>
    </form>
  );
}
