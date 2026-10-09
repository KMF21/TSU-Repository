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
      {error && <div className="alert-error">{error}</div>}

      {!showRejectForm ? (
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            onClick={handleApprove}
            disabled={isPending}
            className="btn-success flex-1 py-3.5"
          >
            {isPending ? "Approving…" : "Approve & publish"}
          </button>
          <button
            onClick={() => setShowRejectForm(true)}
            disabled={isPending}
            className="btn-danger flex-1 py-3.5"
          >
            Reject
          </button>
        </div>
      ) : (
        <form onSubmit={handleReject} className="panel space-y-4 p-5 sm:p-6">
          <label className="field-label" htmlFor="reason">
            Reason for rejection (shown to the student)
          </label>
          <textarea
            id="reason"
            required
            rows={4}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="field"
            placeholder="e.g. Abstract does not match the final defense copy on file."
          />
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="submit"
              disabled={isPending}
              className="btn bg-red-950 text-red-300 hover:bg-red-900"
            >
              {isPending ? "Submitting…" : "Confirm rejection"}
            </button>
            <button
              type="button"
              onClick={() => setShowRejectForm(false)}
              className="btn text-tsu-text-secondary hover:text-white"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
