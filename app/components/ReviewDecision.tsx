"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { approveThesis, rejectThesis } from "@/lib/actions/reviewThesis";

export function ReviewDecision({ thesisId }: { thesisId: string }) {
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleApprove() {
    setError(null);
    startTransition(async () => {
      const res = await approveThesis(thesisId);
      if (res.success) {
        router.push("/admin");
      } else {
        setError(res.error);
      }
    });
  }

  function handleReject(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await rejectThesis(thesisId, reason);
      if (res.success) {
        router.push("/admin");
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-950 text-red-400 text-sm rounded-lg p-3">{error}</div>
      )}

      {!showRejectForm ? (
        <div className="flex gap-3">
          <button
            onClick={handleApprove}
            disabled={isPending}
            className="flex-1 bg-tsu-success-bg text-tsu-success-text font-medium text-sm py-3 rounded-lg hover:opacity-80 transition-opacity disabled:opacity-50"
          >
            {isPending ? "Approving…" : "Approve & publish"}
          </button>
          <button
            onClick={() => setShowRejectForm(true)}
            disabled={isPending}
            className="flex-1 bg-transparent border border-red-900 text-red-400 font-medium text-sm py-3 rounded-lg hover:bg-red-950 transition-colors disabled:opacity-50"
          >
            Reject
          </button>
        </div>
      ) : (
        <form onSubmit={handleReject} className="space-y-3 bg-tsu-bg border border-tsu-card-border rounded-card p-5">
          <label className="block text-xs text-tsu-text-secondary" htmlFor="reason">
            Reason for rejection (shown to the student)
          </label>
          <textarea
            id="reason"
            required
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full bg-tsu-input-bg border border-tsu-input-border rounded-lg px-3.5 py-2.5 text-sm text-tsu-text-primary focus:outline-none focus:ring-1 focus:ring-tsu-accent"
            placeholder="e.g. Abstract does not match the final defense copy on file."
          />
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isPending}
              className="bg-red-950 text-red-400 font-medium text-sm px-5 py-2.5 rounded-lg hover:bg-red-900 transition-colors disabled:opacity-50"
            >
              {isPending ? "Submitting…" : "Confirm rejection"}
            </button>
            <button
              type="button"
              onClick={() => setShowRejectForm(false)}
              className="text-tsu-text-muted text-sm px-5 py-2.5 hover:text-tsu-text-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}