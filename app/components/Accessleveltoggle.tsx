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
    <div className="panel mb-6 p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-lg font-semibold text-white">
            {level === "open" ? "Open access" : "Restricted"}
          </p>
          <p className="mt-1 text-base text-tsu-text-secondary">
            {level === "open"
              ? "Visible to anyone once published, and harvested by Google Scholar, BASE and CORE."
              : "Only visible to signed-in TSU users once published. Never indexed externally."}
          </p>
        </div>
        <button
          onClick={toggle}
          disabled={isPending}
          className={`btn flex-shrink-0 ${
            level === "open"
              ? "bg-tsu-accent-tag-bg text-tsu-accent-tag-text hover:bg-tsu-accent hover:text-white"
              : "bg-tsu-gold-bg text-tsu-gold-text hover:brightness-125"
          }`}
        >
          {isPending ? "Updating…" : level === "open" ? "Make restricted" : "Make open"}
        </button>
      </div>
      {error && <p className="mt-3 text-base text-red-400">{error}</p>}
    </div>
  );
}
