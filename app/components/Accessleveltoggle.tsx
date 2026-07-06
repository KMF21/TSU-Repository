"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setAccessLevel } from "@/lib/actions/reviewThesis";

export function AccessLevelToggle({
  thesisId,
  currentAccessLevel,
}: {
  thesisId: string;
  currentAccessLevel: "open" | "restricted";
}) {
  const [level, setLevel] = useState(currentAccessLevel);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function toggle() {
    const next = level === "open" ? "restricted" : "open";
    setError(null);
    startTransition(async () => {
      const res = await setAccessLevel(thesisId, next);
      if (res.success) {
        setLevel(next);
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <div className="flex items-center justify-between bg-tsu-bg border border-tsu-card-border rounded-card p-5 mb-6">
      <div>
        <p className="text-sm text-tsu-text-primary mb-0.5">
          {level === "open" ? "Open access" : "Restricted"}
        </p>
        <p className="text-xs text-tsu-text-muted">
          {level === "open"
            ? "Visible to anyone once published."
            : "Only visible to signed-in TSU users once published."}
        </p>
      </div>
      <button
        onClick={toggle}
        disabled={isPending}
        className={`text-xs font-medium px-4 py-2 rounded-pill transition-colors disabled:opacity-50 ${
          level === "open"
            ? "bg-tsu-accent-tag-bg text-tsu-accent-tag-text hover:bg-tsu-accent hover:text-white"
            : "bg-tsu-gold-bg text-tsu-gold-text hover:opacity-80"
        }`}
      >
        {isPending ? "Updating…" : level === "open" ? "Make restricted" : "Make open"}
      </button>
      {error && <p className="text-xs text-red-400 ml-3">{error}</p>}
    </div>
  );
}