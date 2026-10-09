import type { Metadata } from "next";
import { currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { DEGREE_LABELS } from "@/lib/site";

export const metadata: Metadata = {
  title: "My submissions",
  robots: { index: false, follow: false },
};

export default async function DashboardPage() {
  const user = await currentUser();
  const supabase = await createServerSupabaseClient();

  const { data: theses } = await supabase
    .from("theses")
    .select(
      `id, title, year, degree_type, status, rejection_reason, submitted_at, published_at,
       author_name, submitted_on_behalf,
       department:departments ( name ),
       programme:programmes ( name )`
    )
    .order("submitted_at", { ascending: false });

  const firstName = user?.firstName || "there";

  return (
    <main className="min-h-screen bg-tsu-bg">
      <div className="mx-auto max-w-4xl px-5 py-12 sm:px-8 sm:py-16">
        <div className="mb-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow mb-3">Your submissions</p>
            <h1 className="page-title">Hello, {firstName}</h1>
          </div>
          <Link href="/submit" className="btn-primary self-start sm:self-auto">
            Submit research
          </Link>
        </div>

        {(!theses || theses.length === 0) && (
          <div className="card p-10 text-center sm:p-14">
            <p className="mb-6 text-lg text-tsu-text-secondary">
              You haven&apos;t submitted any research yet.
            </p>
            <Link href="/submit" className="btn-primary">
              Submit your first thesis
            </Link>
          </div>
        )}

        {theses && theses.length > 0 && (
          <div className="flex flex-col gap-5">
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

  const currentStepIndex = thesis.status === "published" ? 2 : 1;

  return (
    <div className="card p-6 sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="font-display text-xl font-semibold leading-snug text-white sm:text-2xl">
            {thesis.title}
          </h2>
          {thesis.submitted_on_behalf && (
            <p className="mt-2 text-base font-semibold text-tsu-gold-text">
              Uploaded for: {thesis.author_name}
            </p>
          )}
          <p className="mt-2 text-base text-tsu-text-secondary">
            {thesis.department?.name} &middot; {DEGREE_LABELS[thesis.degree_type]} &middot;{" "}
            {thesis.year}
          </p>
        </div>
        <div className="self-start">
          <StatusPill status={thesis.status} />
        </div>
      </div>

      {thesis.status === "rejected" && thesis.rejection_reason && (
        <div className="alert-error mt-5">
          <span className="font-semibold">Reason: </span>
          {thesis.rejection_reason}
        </div>
      )}

      {thesis.status !== "rejected" && (
        <div className="mt-6 flex flex-col gap-3.5 border-t border-tsu-card-border pt-6">
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
          className="mt-6 inline-flex items-center gap-2 text-base font-semibold text-tsu-accent-tag-text transition-colors hover:text-white"
        >
          View public listing &rarr;
        </Link>
      )}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  if (status === "published") return <span className="pill-green">Published</span>;
  if (status === "rejected") return <span className="pill-red">Rejected</span>;
  return <span className="pill-blue">Pending review</span>;
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
    <div className="flex items-center gap-3.5">
      <div
        className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-semibold ${circleClass}`}
      >
        {state === "done" ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        ) : (
          number
        )}
      </div>
      <p className={`text-base sm:text-[17px] ${textClass}`}>{label}</p>
    </div>
  );
}
