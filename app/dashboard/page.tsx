import { currentUser } from "@clerk/nextjs/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import Link from "next/link";

const DEGREE_LABELS: Record<string, string> = {
  bsc: "B.Sc.",
  msc: "M.Sc.",
  ma: "M.A.",
  med: "M.Ed.",
  pgd: "PGD",
  mphil: "M.Phil.",
  phd: "Ph.D.",
  other: "Other",
};

export default async function DashboardPage() {
  const user = await currentUser();
  const supabase = await createServerSupabaseClient();

  const { data: theses } = await supabase
    .from("theses")
    .select(
      `id, title, year, degree_type, status, rejection_reason, submitted_at, published_at,
       department:departments ( name ),
       programme:programmes ( name )`
    )
    .order("submitted_at", { ascending: false });

  const firstName = user?.firstName || "there";

  return (
    <main className="min-h-screen bg-tsu-bg">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-7">
          <div>
            <p className="text-xs text-tsu-text-muted mb-1">Your submissions</p>
            <h1 className="text-2xl font-semibold text-tsu-text-heading">Hello, {firstName}</h1>
          </div>
          <Link
            href="/submit"
            className="bg-tsu-accent text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:opacity-90 transition-opacity"
          >
            Submit research
          </Link>
        </div>

        {(!theses || theses.length === 0) && (
          <div className="bg-tsu-card border border-tsu-card-border rounded-card p-10 text-center">
            <p className="text-tsu-text-secondary text-sm mb-4">
              You haven't submitted any research yet.
            </p>
            <Link
              href="/submit"
              className="inline-block bg-tsu-accent text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:opacity-90 transition-opacity"
            >
              Submit your first thesis
            </Link>
          </div>
        )}

        {theses && theses.length > 0 && (
          <div className="flex flex-col gap-4">
            {theses.map((t: any) => (
              <SubmissionCard key={t.id} thesis={t} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function SubmissionCard({ thesis }: { thesis: any }) {
  const steps = [
    { label: "Submitted", key: "submitted" },
    { label: "Under admin review", key: "review" },
    { label: "Published to the repository", key: "published" },
  ];

  const currentStepIndex =
    thesis.status === "published" ? 2 : thesis.status === "rejected" ? 1 : 1;

  return (
    <div className="bg-tsu-card border border-tsu-card-border rounded-card p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="min-w-0 pr-4">
          <p className="text-sm font-medium text-tsu-text-heading">{thesis.title}</p>
          <p className="text-xs text-tsu-text-muted mt-1">
            {thesis.department?.name} &middot; {DEGREE_LABELS[thesis.degree_type]} &middot; {thesis.year}
          </p>
        </div>
        <StatusPill status={thesis.status} />
      </div>

      {thesis.status === "rejected" && thesis.rejection_reason && (
        <div className="bg-red-950 rounded-lg p-3.5 mb-4">
          <p className="text-xs text-red-400 leading-relaxed">
            <span className="font-medium">Reason: </span>
            {thesis.rejection_reason}
          </p>
        </div>
      )}

      {thesis.status !== "rejected" && (
        <div className="flex flex-col gap-2.5 pt-2">
          {steps.map((step, i) => (
            <StepRow
              key={step.key}
              label={step.label}
              state={i < currentStepIndex ? "done" : i === currentStepIndex ? "current" : "upcoming"}
              number={i + 1}
            />
          ))}
        </div>
      )}

      {thesis.status === "published" && (
        <Link
          href={`/theses/${thesis.id}`}
          className="inline-block mt-4 text-xs text-tsu-accent-tag-text hover:underline"
        >
          View public listing &rarr;
        </Link>
      )}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  if (status === "published") {
    return (
      <span className="flex-shrink-0 bg-tsu-success-bg text-tsu-success-text text-xs font-medium px-3.5 py-1.5 rounded-pill">
        Published
      </span>
    );
  }
  if (status === "rejected") {
    return (
      <span className="flex-shrink-0 bg-red-950 text-red-400 text-xs font-medium px-3.5 py-1.5 rounded-pill">
        Rejected
      </span>
    );
  }
  return (
    <span className="flex-shrink-0 bg-tsu-accent-tag-bg text-tsu-accent-tag-text text-xs font-medium px-3.5 py-1.5 rounded-pill">
      Pending review
    </span>
  );
}

function StepRow({
  label,
  state,
  number,
}: {
  label: string;
  state: "done" | "current" | "upcoming";
  number: number;
}) {
  const circleClass =
    state === "done"
      ? "bg-tsu-success-bg text-tsu-success-text"
      : state === "current"
      ? "bg-tsu-accent-tag-bg text-tsu-accent-tag-text"
      : "bg-tsu-input-bg text-tsu-text-muted";

  const textClass =
    state === "done"
      ? "text-tsu-text-primary"
      : state === "current"
      ? "text-tsu-text-secondary"
      : "text-tsu-text-muted";

  return (
    <div className="flex items-center gap-3">
      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] ${circleClass}`}>
        {state === "done" ? (
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        ) : (
          number
        )}
      </div>
      <p className={`text-xs ${textClass}`}>{label}</p>
    </div>
  );
}