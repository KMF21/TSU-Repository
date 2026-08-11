import Image from "next/image";
import Link from "next/link";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import heroImage from "./assets/PG.png"; // swap in your actual image

export default function HomePage() {
  return (
    <main className="min-h-screen bg-tsu-bg">
      {/* ================= HERO (FULL SCREEN WITH IMAGE) ================= */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <Image
            src={heroImage}
            alt="Taraba State University"
            fill
            priority
            sizes="100vw"
            className="object-cover object-[25%_center]"
          />

          {/* Dark overlay */}
          <div className="absolute inset-0 bg-tsu-bg/80" />
        </div>

        {/* Glow effects */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-tsu-accent/20 blur-[140px] rounded-full" />
          <div className="absolute -bottom-40 right-0 w-[400px] h-[400px] bg-tsu-gold-text/10 blur-[140px] rounded-full" />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-2xl mx-auto px-6 text-center">
          <p className="text-md tracking-widest uppercase text-tsu-accent-tag-text mb-4">
            College of Postgraduate Studies
          </p>
          <h1 className="text-2xl md:text-4xl sm:text-5xl font-semibold text-white leading-tight mb-5">
            The permanent scholarly record of Taraba State University
          </h1>
          <p className="text-tsu-text-secondary text-base sm:text-xl md:text-2xl leading-relaxed mb-8">
            Postgraduate theses, dissertations, and research from every faculty —
            archived, searchable, and citable in one place.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              href="/browse"
              className="bg-tsu-accent text-white text-md md:text-lg font-medium px-6 py-3 rounded-lg hover:opacity-90 transition-opacity"
            >
              Browse research
            </Link>
            <SignedIn>
              <Link
                href="/submit"
                className="bg-white/10 backdrop-blur border border-white/20 text-white text-md md:text-lg font-medium px-6 py-3 rounded-lg hover:bg-white/20 transition-colors"
              >
                Submit your research
              </Link>
            </SignedIn>
            <SignedOut>
              <SignInButton mode="modal">
                <button className="bg-white/10 backdrop-blur border border-white/20 text-white text-md md:text-lg font-medium px-6 py-3 rounded-lg hover:bg-white/20 transition-colors">
                  Sign in to submit
                </button>
              </SignInButton>
            </SignedOut>
          </div>
        </div>
      </section>

      {/* Stats */}
      <div className="max-w-4xl mx-auto px-6 py-16">
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
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-tsu-card border border-tsu-card-border rounded-card p-5">
      <p className="text-sm text-tsu-text-muted mb-1.5">{label}</p>
      <p className="text-2xl md:text-4xl font-semibold text-tsu-text-heading">{value}</p>
    </div>
  );
}

function Guideline({ title, body }: { title: string; body: React.ReactNode }) {
  return (
    <div>
      <p className="text-md md:text-lg font-medium text-tsu-text-primary mb-1.5">{title}</p>
      <p className="text-md text-tsu-text-secondary leading-relaxed">{body}</p>
    </div>
  );
}