"use client";

import { useState, useMemo, useTransition } from "react";
import { submitThesis } from "@/lib/actions/submitThesis";

type Department = { id: string; name: string; faculty: string };
type Programme = { id: string; name: string; degree_type: string; department_id: string };

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

export function SubmissionForm({
  departments,
  programmes,
  authorName,
}: {
  departments: Department[];
  programmes: Programme[];
  authorName: string;
}) {
  const [title, setTitle] = useState("");
  const [abstract, setAbstract] = useState("");
  const [keywords, setKeywords] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [programmeId, setProgrammeId] = useState("");
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [supervisorName, setSupervisorName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const filteredProgrammes = useMemo(
    () => programmes.filter((p) => p.department_id === departmentId),
    [programmes, departmentId]
  );

  const selectedProgramme = programmes.find((p) => p.id === programmeId);
  const selectedDepartment = departments.find((d) => d.id === departmentId);

  const keywordChips = keywords
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] ?? null;
    setFileError(null);
    if (selected) {
      if (selected.type !== "application/pdf") {
        setFileError("Only PDF files are accepted.");
        setFile(null);
        return;
      }
      if (selected.size > 50 * 1024 * 1024) {
        setFileError("File exceeds the 50MB limit.");
        setFile(null);
        return;
      }
    }
    setFile(selected);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setResult(null);

    const formData = new FormData();
    formData.set("title", title);
    formData.set("abstract", abstract);
    formData.set("keywords", keywords);
    formData.set("department_id", departmentId);
    formData.set("programme_id", programmeId);
    formData.set("degree_type", selectedProgramme?.degree_type ?? "");
    formData.set("year", year);
    formData.set("supervisor_name", supervisorName);
    if (file) formData.set("file", file);

    startTransition(async () => {
      const res = await submitThesis(formData);
      if (res.success) {
        setResult({ success: true, message: "Submitted. Your work is now pending review." });
        setTitle("");
        setAbstract("");
        setKeywords("");
        setSupervisorName("");
        setFile(null);
      } else {
        setResult({ success: false, message: res.error });
      }
    });
  }

  const fileReady = !!file && !fileError;

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <div className="bg-tsu-card border border-tsu-card-border rounded-card p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-7">
          <div>
            <p className="text-xs text-tsu-text-muted mb-1">TSU Digital Research Repository</p>
            <h1 className="text-2xl font-semibold text-tsu-text-heading">Submit your research</h1>
          </div>
          <span className="bg-tsu-accent-tag-bg text-tsu-accent-tag-text text-xs font-medium px-3.5 py-1.5 rounded-pill border border-tsu-input-border">
            Draft
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Thesis details */}
          <div className="bg-tsu-bg border border-tsu-card-border rounded-card p-6">
            <p className="text-[11px] tracking-wider uppercase text-tsu-text-muted mb-4">
              Thesis details
            </p>

            <label className="block text-xs text-tsu-text-secondary mb-1.5" htmlFor="title">
              Title
            </label>
            <input
              id="title"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-tsu-input-bg border border-tsu-input-border rounded-lg px-3.5 py-2.5 text-sm text-tsu-text-primary mb-4 focus:outline-none focus:ring-1 focus:ring-tsu-accent"
              placeholder="Full thesis title, as it appears on the title page"
            />

            <label className="block text-xs text-tsu-text-secondary mb-1.5" htmlFor="abstract">
              Abstract
            </label>
            <textarea
              id="abstract"
              required
              rows={5}
              value={abstract}
              onChange={(e) => setAbstract(e.target.value)}
              className="w-full bg-tsu-input-bg border border-tsu-input-border rounded-lg px-3.5 py-2.5 text-sm text-tsu-text-secondary leading-relaxed mb-4 focus:outline-none focus:ring-1 focus:ring-tsu-accent"
              placeholder="Paste the abstract exactly as submitted in your final defense copy"
            />

            <label className="block text-xs text-tsu-text-secondary mb-2" htmlFor="keywords">
              Keywords
            </label>
            <input
              id="keywords"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              className="w-full bg-tsu-input-bg border border-tsu-input-border rounded-lg px-3.5 py-2.5 text-sm text-tsu-text-primary mb-2 focus:outline-none focus:ring-1 focus:ring-tsu-accent"
              placeholder="Separate with commas — e.g. urban planning, Jalingo"
            />
            {keywordChips.length > 0 && (
              <div className="flex gap-2 flex-wrap mt-2">
                {keywordChips.map((k) => (
                  <span
                    key={k}
                    className="bg-tsu-accent-tag-bg text-tsu-accent-tag-text text-xs px-3 py-1 rounded-pill"
                  >
                    {k}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Academic record */}
          <div className="bg-tsu-bg border border-tsu-card-border rounded-card p-6">
            <p className="text-[11px] tracking-wider uppercase text-tsu-text-muted mb-4">
              Academic record
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-tsu-text-secondary mb-1.5" htmlFor="department">
                  Department
                </label>
                <select
                  id="department"
                  required
                  value={departmentId}
                  onChange={(e) => {
                    setDepartmentId(e.target.value);
                    setProgrammeId("");
                  }}
                  className="w-full bg-tsu-input-bg border border-tsu-input-border rounded-lg px-3.5 py-2.5 text-sm text-tsu-text-primary focus:outline-none focus:ring-1 focus:ring-tsu-accent"
                >
                  <option value="">Select department</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-tsu-text-secondary mb-1.5" htmlFor="programme">
                  Programme
                </label>
                <select
                  id="programme"
                  required
                  value={programmeId}
                  onChange={(e) => setProgrammeId(e.target.value)}
                  disabled={!departmentId}
                  className="w-full bg-tsu-input-bg border border-tsu-input-border rounded-lg px-3.5 py-2.5 text-sm text-tsu-text-primary focus:outline-none focus:ring-1 focus:ring-tsu-accent disabled:opacity-40"
                >
                  <option value="">Select programme</option>
                  {filteredProgrammes.map((p) => (
                    <option key={p.id} value={p.id}>
                      {DEGREE_LABELS[p.degree_type]} — {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-tsu-text-secondary mb-1.5" htmlFor="year">
                  Year of completion
                </label>
                <input
                  id="year"
                  required
                  type="number"
                  min="2008"
                  max={new Date().getFullYear()}
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="w-full bg-tsu-input-bg border border-tsu-input-border rounded-lg px-3.5 py-2.5 text-sm text-tsu-text-primary focus:outline-none focus:ring-1 focus:ring-tsu-accent"
                />
              </div>

              <div>
                <label className="block text-xs text-tsu-text-secondary mb-1.5" htmlFor="supervisor">
                  Supervisor
                </label>
                <input
                  id="supervisor"
                  required
                  value={supervisorName}
                  onChange={(e) => setSupervisorName(e.target.value)}
                  className="w-full bg-tsu-input-bg border border-tsu-input-border rounded-lg px-3.5 py-2.5 text-sm text-tsu-text-primary focus:outline-none focus:ring-1 focus:ring-tsu-accent"
                  placeholder="e.g. Prof. A. B. Sample"
                />
              </div>
            </div>
          </div>

          {/* Manuscript upload */}
          <div className="bg-tsu-bg border border-tsu-card-border rounded-card p-6">
            <p className="text-[11px] tracking-wider uppercase text-tsu-text-muted mb-4">
              Manuscript
            </p>
            <label
              htmlFor="file"
              className="flex items-center gap-3.5 border border-dashed border-tsu-input-border rounded-lg p-4 cursor-pointer hover:border-tsu-accent transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-tsu-accent-tag-bg flex items-center justify-center flex-shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7ca8e0" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <path d="M14 2v6h6" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                {file ? (
                  <>
                    <p className="text-sm text-tsu-text-primary truncate">{file.name}</p>
                    <p className="text-xs text-tsu-text-muted mt-0.5">
                      {(file.size / (1024 * 1024)).toFixed(1)}MB · PDF
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-tsu-text-secondary">Choose a PDF to upload</p>
                    <p className="text-xs text-tsu-text-muted mt-0.5">
                      Up to 50MB. Large files should be compressed first — see the note below.
                    </p>
                  </>
                )}
              </div>
              {fileReady && (
                <span className="bg-tsu-success-bg text-tsu-success-text text-xs font-medium px-3 py-1.5 rounded-pill flex-shrink-0">
                  Ready
                </span>
              )}
            </label>
            <input
              id="file"
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              className="hidden"
            />
            {fileError && <p className="text-xs text-red-400 mt-2">{fileError}</p>}
            <p className="text-xs text-tsu-text-muted mt-3 leading-relaxed">
              If your file is large (scanned pages or many images), compress it before uploading using
              a free tool such as{" "}
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
              . Smaller files load and download faster for everyone accessing the repository.
            </p>
          </div>

          {result && (
            <div
              className={`rounded-lg p-4 text-sm ${
                result.success
                  ? "bg-tsu-success-bg text-tsu-success-text"
                  : "bg-red-950 text-red-400"
              }`}
            >
              {result.message}
            </div>
          )}

          <button
            type="submit"
            disabled={isPending || !!fileError}
            className="w-full bg-tsu-accent text-white text-sm font-medium py-3.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isPending ? "Submitting…" : "Submit for review"}
          </button>
        </form>

        {/* What happens next — mirrors the Screening Portal's step tracker */}
        <div className="border-t border-tsu-card-border mt-7 pt-6">
          <p className="text-[11px] tracking-wider uppercase text-tsu-text-muted mb-3.5">
            What happens next
          </p>
          <div className="flex flex-col gap-3">
            <StepRow label="Submitted" state={fileReady ? "done" : "pending"} number={1} />
            <StepRow label="Under admin review" state="pending" number={2} />
            <StepRow label="Published to the repository" state="upcoming" number={3} />
          </div>
        </div>

        {/* Live citation preview */}
        <div className="border-t border-tsu-card-border mt-7 pt-6">
          <p className="text-[11px] tracking-wider uppercase text-tsu-text-muted mb-3">
            How this will be cited
          </p>
          <div className="bg-tsu-bg border border-tsu-card-border rounded-card p-5">
            <p className="font-display text-sm leading-relaxed text-tsu-text-primary">
              {authorName || "Author name"}. ({year || "Year"}).{" "}
              <span className="italic">{title || "Thesis title"}</span>.{" "}
              {selectedProgramme ? DEGREE_LABELS[selectedProgramme.degree_type] : "Degree"} thesis,{" "}
              {selectedDepartment?.name || "Department"}, Taraba State University.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StepRow({
  label,
  state,
  number,
}: {
  label: string;
  state: "done" | "pending" | "upcoming";
  number: number;
}) {
  const circleClass =
    state === "done"
      ? "bg-tsu-success-bg text-tsu-success-text"
      : state === "pending"
      ? "bg-tsu-accent-tag-bg text-tsu-accent-tag-text"
      : "bg-tsu-input-bg text-tsu-text-muted";

  const textClass =
    state === "done" ? "text-tsu-text-primary" : state === "pending" ? "text-tsu-text-secondary" : "text-tsu-text-muted";

  return (
    <div className="flex items-center gap-3">
      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs ${circleClass}`}>
        {state === "done" ? (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        ) : (
          number
        )}
      </div>
      <p className={`text-sm ${textClass}`}>{label}</p>
    </div>
  );
}