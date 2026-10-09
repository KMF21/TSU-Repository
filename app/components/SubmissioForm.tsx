"use client";

import { useState, useMemo, useTransition } from "react";
import { submitThesis } from "@/lib/actions/submitThesis";
import { DEGREE_LABELS } from "@/lib/site";

type Department = { id: string; name: string; faculty: string };
type Programme = { id: string; name: string; degree_type: string; department_id: string };

export function SubmissionForm({
  departments,
  programmes,
  authorName,
  initialMatricNumber,
}: {
  departments: Department[];
  programmes: Programme[];
  authorName: string;
  initialMatricNumber?: string;
}) {
  const [title, setTitle] = useState("");
  const [abstract, setAbstract] = useState("");
  const [keywords, setKeywords] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [programmeId, setProgrammeId] = useState("");
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [supervisorName, setSupervisorName] = useState("");
  const [matricNumber, setMatricNumber] = useState(initialMatricNumber ?? "");
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
    formData.set("matric_number", matricNumber);
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
    <div className="mx-auto max-w-4xl px-5 py-12 sm:px-8 sm:py-16">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-3">Deposit</p>
          <h1 className="page-title">Submit your research</h1>
        </div>
        <span className="pill-blue hidden border border-tsu-input-border sm:inline-flex">Draft</span>
      </div>

      <div className="card p-5 sm:p-10">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Thesis details */}
          <div className="panel p-5 sm:p-7">
            <p className="section-label mb-5">Thesis details</p>

            <label className="field-label" htmlFor="title">
              Title
            </label>
            <input
              id="title"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="field mb-5"
              placeholder="Full thesis title, as it appears on the title page"
            />

            <label className="field-label" htmlFor="abstract">
              Abstract
            </label>
            <textarea
              id="abstract"
              required
              rows={8}
              value={abstract}
              onChange={(e) => setAbstract(e.target.value)}
              className="field mb-5 leading-relaxed"
              placeholder="Paste the abstract exactly as submitted in your final defense copy"
            />

            <label className="field-label" htmlFor="keywords">
              Keywords
            </label>
            <input
              id="keywords"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              className="field"
              placeholder="Separate with commas — e.g. urban planning, Jalingo"
            />
            {keywordChips.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {keywordChips.map((k) => (
                  <span key={k} className="chip">
                    {k}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Academic record */}
          <div className="panel p-5 sm:p-7">
            <p className="section-label mb-5">Academic record</p>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="field-label" htmlFor="department">
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
                  className="field"
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
                <label className="field-label" htmlFor="programme">
                  Programme
                </label>
                <select
                  id="programme"
                  required
                  value={programmeId}
                  onChange={(e) => setProgrammeId(e.target.value)}
                  disabled={!departmentId}
                  className="field"
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
                <label className="field-label" htmlFor="year">
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
                  className="field"
                />
              </div>

              <div>
                <label className="field-label" htmlFor="supervisor">
                  Supervisor
                </label>
                <input
                  id="supervisor"
                  required
                  value={supervisorName}
                  onChange={(e) => setSupervisorName(e.target.value)}
                  className="field"
                  placeholder="e.g. Prof. A. B. Sample"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="field-label" htmlFor="matric">
                  Matric number
                </label>
                <input
                  id="matric"
                  required
                  value={matricNumber}
                  onChange={(e) => setMatricNumber(e.target.value)}
                  className="field"
                  placeholder="e.g. TSU/PG/2023/0142"
                />
              </div>
            </div>
          </div>

          {/* Manuscript upload */}
          <div className="panel p-5 sm:p-7">
            <p className="section-label mb-5">Manuscript</p>
            <label
              htmlFor="file"
              className="flex cursor-pointer items-center gap-4 rounded-xl border-2 border-dashed border-tsu-input-border p-5 transition-colors hover:border-tsu-accent hover:bg-tsu-accent-tag-bg/30 sm:p-6"
            >
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-tsu-accent-tag-bg">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8db6ec" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <path d="M14 2v6h6" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                {file ? (
                  <>
                    <p className="truncate text-base font-semibold text-white sm:text-lg">{file.name}</p>
                    <p className="mt-0.5 text-base text-tsu-text-muted">
                      {(file.size / (1024 * 1024)).toFixed(1)}MB · PDF
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-base font-semibold text-white sm:text-lg">Choose a PDF to upload</p>
                    <p className="mt-0.5 text-sm text-tsu-text-muted sm:text-base">
                      Up to 50MB. Large files should be compressed first.
                    </p>
                  </>
                )}
              </div>
              {fileReady && <span className="pill-green flex-shrink-0">Ready</span>}
            </label>
            <input
              id="file"
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              className="hidden"
            />
            {fileError && <p className="mt-3 text-base text-red-400">{fileError}</p>}
            <p className="mt-4 text-base leading-relaxed text-tsu-text-muted">
              If your file is large (scanned pages or many images), compress it before uploading using
              a free tool such as{" "}
              <a
                href="https://smallpdf.com/compress-pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="text-tsu-accent-tag-text underline-offset-4 hover:underline"
              >
                smallpdf.com
              </a>{" "}
              or{" "}
              <a
                href="https://www.ilovepdf.com/compress_pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="text-tsu-accent-tag-text underline-offset-4 hover:underline"
              >
                ilovepdf.com
              </a>
              . Smaller files load and download faster for everyone accessing the repository.
            </p>
          </div>

          {result && (
            <div className={result.success ? "alert-success" : "alert-error"}>{result.message}</div>
          )}

          <button
            type="submit"
            disabled={isPending || !!fileError}
            className="btn-primary w-full py-4 text-lg"
          >
            {isPending ? "Submitting…" : "Submit for review"}
          </button>
        </form>

        {/* What happens next — mirrors the Screening Portal's step tracker */}
        <div className="mt-10 border-t border-tsu-card-border pt-8">
          <p className="section-label mb-5">What happens next</p>
          <div className="flex flex-col gap-4">
            <StepRow label="Submitted" state={fileReady ? "done" : "pending"} number={1} />
            <StepRow label="Under admin review" state="pending" number={2} />
            <StepRow label="Published to the repository" state="upcoming" number={3} />
          </div>
        </div>

        {/* Live citation preview */}
        <div className="mt-10 border-t border-tsu-card-border pt-8">
          <p className="section-label mb-4">How this will be cited</p>
          <div className="panel p-5 sm:p-7">
            <p className="font-display text-lg leading-relaxed text-white sm:text-xl">
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
    state === "done"
      ? "text-tsu-text-primary"
      : state === "pending"
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
