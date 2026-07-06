import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-tsu-bg">
      {/* Nav */}
      <div className="max-w-4xl mx-auto px-6 py-6 flex items-center justify-between">
        <p className="text-sm font-medium text-tsu-text-heading">
          TSU Digital Research Repository
        </p>
        <div className="flex items-center gap-4">
          <Link
            href="/browse"
            className="text-sm text-tsu-text-secondary hover:text-tsu-text-primary transition-colors"
          >
            Browse research
          </Link>
          <SignedOut>
            <SignInButton mode="modal">
              <button className="bg-tsu-accent-tag-bg text-tsu-accent-tag-text text-sm font-medium px-4 py-2 rounded-pill hover:bg-tsu-accent hover:text-white transition-colors">
                Sign in
              </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <Link
              href="/submit"
              className="text-sm text-tsu-text-secondary hover:text-tsu-text-primary transition-colors"
            >
              Submit research
            </Link>
            <UserButton />
          </SignedIn>
        </div>
      </div>

      {/* Hero */}
      <div className="max-w-4xl mx-auto px-6 pt-12 pb-16">
        <p className="text-xs text-tsu-text-muted mb-3">College of Postgraduate Studies</p>
        <h1 className="text-4xl font-semibold text-tsu-text-heading leading-tight mb-5 max-w-xl">
          The permanent scholarly record of Taraba State University
        </h1>
        <p className="text-tsu-text-secondary text-base leading-relaxed max-w-lg mb-8">
          Postgraduate theses, dissertations, and research from every faculty — archived,
          searchable, and citable in one place.
        </p>
        <div className="flex gap-3">
          <Link
            href="/browse"
            className="bg-tsu-accent text-white text-sm font-medium px-6 py-3 rounded-lg hover:opacity-90 transition-opacity"
          >
            Browse research
          </Link>
          <SignedIn>
            <Link
              href="/submit"
              className="bg-tsu-accent-tag-bg text-tsu-accent-tag-text text-sm font-medium px-6 py-3 rounded-lg hover:bg-tsu-accent hover:text-white transition-colors"
            >
              Submit your research
            </Link>
          </SignedIn>
          <SignedOut>
            <SignInButton mode="modal">
              <button className="bg-tsu-accent-tag-bg text-tsu-accent-tag-text text-sm font-medium px-6 py-3 rounded-lg hover:bg-tsu-accent hover:text-white transition-colors">
                Sign in to submit
              </button>
            </SignInButton>
          </SignedOut>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-4xl mx-auto px-6 pb-16">
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Faculties represented" value="10" />
          <StatCard label="Departments" value="37" />
          <StatCard label="Programmes covered" value="254" />
        </div>
      </div>

      {/* Submission guidelines */}
      <div className="max-w-4xl mx-auto px-6 pb-20">
        <div className="bg-tsu-card border border-tsu-card-border rounded-card p-8">
          <p className="text-[11px] tracking-wider uppercase text-tsu-text-muted mb-5">
            Before you submit
          </p>
          <div className="grid sm:grid-cols-2 gap-5">
            <Guideline
              title="PDF only"
              body="Submissions must be your final defense copy, saved as a PDF."
            />
            <Guideline
              title="Compress large files"
              body={
                <>
                  Files with scanned pages or many images should be compressed before
                  uploading — try{" "}
                  <a
                    href="https://smallpdf.com/compress-pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-tsu-accent-tag-text hover:underline"
                  >
                    smallpdf.com
                  </a>{" "}
                  or{" "}
                  <a
                    href="https://www.ilovepdf.com/compress_pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-tsu-accent-tag-text hover:underline"
                  >
                    ilovepdf.com
                  </a>
                  . Smaller files are faster for everyone to access.
                </>
              }
            />
            <Guideline
              title="50MB limit"
              body="This is a hard limit — files above this size will be rejected at upload."
            />
            <Guideline
              title="Reviewed before publishing"
              body="An admin reviews every submission before it becomes part of the public record."
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-4xl mx-auto px-6 pb-10">
        <p className="text-xs text-tsu-text-muted text-center">
          Built and maintained by KMFenterprise
        </p>
      </div>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-tsu-card border border-tsu-card-border rounded-card p-5">
      <p className="text-xs text-tsu-text-muted mb-1.5">{label}</p>
      <p className="text-2xl font-semibold text-tsu-text-heading">{value}</p>
    </div>
  );
}

function Guideline({ title, body }: { title: string; body: React.ReactNode }) {
  return (
    <div>
      <p className="text-sm font-medium text-tsu-text-primary mb-1.5">{title}</p>
      <p className="text-xs text-tsu-text-secondary leading-relaxed">{body}</p>
    </div>
  );
}