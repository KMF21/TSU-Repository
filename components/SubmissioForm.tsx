"use client";

import { submitThesis } from "@/lib/supabase/actions/submitThesis";
import { useState, useMemo, useTransition } from "react";


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

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 grid md:grid-cols-[1fr_320px] gap-10">
      {/* --- Form --- */}
      <form onSubmit={handleSubmit} className="space-y-8 border-l-2 border-tsu-gold pl-8">
        <div>
          <p className="font-mono text-xs tracking-widest text-tsu-slate uppercase mb-1">
            Deposit &middot; TSU Digital Research Repository
          </p>
          <h1 className="font-display text-3xl font-semibold text-tsu-navy">
            Submit your research
          </h1>
        </div>

        <section className="space-y-4">
          <h2 className="font-display text-lg text-tsu-navy border-b border-tsu-border pb-2">
            Thesis details
          </h2>

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="title">
              Title
            </label>
            <input
              id="title"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-tsu-border rounded-none px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-tsu-blue"
              placeholder="Full thesis title, as it appears on the title page"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="abstract">
              Abstract
            </label>
            <textarea
              id="abstract"
              required
              rows={6}
              value={abstract}
              onChange={(e) => setAbstract(e.target.value)}
              className="w-full border border-tsu-border rounded-none px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-tsu-blue"
              placeholder="Paste the abstract exactly as submitted in your final defense copy"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="keywords">
              Keywords
            </label>
            <input
              id="keywords"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              className="w-full border border-tsu-border rounded-none px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-tsu-blue"
              placeholder="Separate with commas — e.g. urban planning, informal settlements, Jalingo"
            />
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-display text-lg text-tsu-navy border-b border-tsu-border pb-2">
            Academic record
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="department">
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
                className="w-full border border-tsu-border px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-tsu-blue"
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
              <label className="block text-sm font-medium mb-1" htmlFor="programme">
                Programme
              </label>
              <select
                id="programme"
                required
                value={programmeId}
                onChange={(e) => setProgrammeId(e.target.value)}
                disabled={!departmentId}
                className="w-full border border-tsu-border px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-tsu-blue disabled:bg-gray-100"
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
              <label className="block text-sm font-medium mb-1" htmlFor="year">
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
                className="w-full border border-tsu-border px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-tsu-blue"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="supervisor">
                Supervisor
              </label>
              <input
                id="supervisor"
                required
                value={supervisorName}
                onChange={(e) => setSupervisorName(e.target.value)}
                className="w-full border border-tsu-border px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-tsu-blue"
                placeholder="e.g. Prof. A. B. Sample"
              />
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-lg text-tsu-navy border-b border-tsu-border pb-2">
            Manuscript
          </h2>
          <div className="border border-dashed border-tsu-border p-6 text-center bg-white">
            <input
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              className="block w-full text-sm"
            />
            <p className="font-mono text-xs text-tsu-slate mt-2">
              PDF only &middot; up to 50MB &middot; compressed automatically after submission
            </p>
            {file && (
              <p className="text-sm mt-2 text-tsu-charcoal">
                {file.name} ({(file.size / (1024 * 1024)).toFixed(1)}MB)
              </p>
            )}
            {fileError && <p className="text-sm mt-2 text-red-600">{fileError}</p>}
          </div>
        </section>

        {result && (
          <div
            className={`p-4 text-sm ${
              result.success
                ? "bg-green-50 text-tsu-success border border-tsu-success"
                : "bg-red-50 text-red-700 border border-red-300"
            }`}
          >
            {result.message}
          </div>
        )}

        <button
          type="submit"
          disabled={isPending || !!fileError}
          className="bg-tsu-navy text-white font-medium px-6 py-3 hover:bg-tsu-blue transition-colors disabled:opacity-50"
        >
          {isPending ? "Submitting…" : "Submit for review"}
        </button>
      </form>

      {/* --- Live citation preview: the signature element --- */}
      <aside className="md:sticky md:top-12 h-fit">
        <p className="font-mono text-xs tracking-widest text-tsu-slate uppercase mb-3">
          How this will be cited
        </p>
        <div className="bg-white border border-tsu-border p-6 space-y-3">
          <p className="font-display text-base leading-relaxed text-tsu-charcoal">
            {authorName || "Author name"}. ({year || "Year"}).{" "}
            <span className="italic">{title || "Thesis title"}</span>.{" "}
            {selectedProgramme ? DEGREE_LABELS[selectedProgramme.degree_type] : "Degree"} thesis,{" "}
            {selectedDepartment?.name || "Department"}, Taraba State University.
          </p>
          <div className="pt-3 border-t border-tsu-border font-mono text-xs text-tsu-slate space-y-1">
            <p>Status: pending review</p>
            <p>Access: restricted until approved</p>
          </div>
        </div>
      </aside>
    </div>
  );
}