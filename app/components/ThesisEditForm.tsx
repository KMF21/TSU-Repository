"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateThesisMetadata } from "@/lib/actions/editThesis";
import { DEGREE_LABELS } from "@/lib/site";

type Department = { id: string; name: string; faculty: string };
type Programme = { id: string; name: string; degree_type: string; department_id: string };

export function ThesisEditForm({
  thesisId,
  departments,
  programmes,
  initial,
}: {
  thesisId: string;
  departments: Department[];
  programmes: Programme[];
  initial: {
    title: string;
    abstract: string;
    keywords: string[];
    year: number;
    supervisor_name: string;
    department_id: string;
    programme_id: string;
  };
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initial.title);
  const [abstract, setAbstract] = useState(initial.abstract);
  const [keywords, setKeywords] = useState(initial.keywords.join(", "));
  const [year, setYear] = useState(String(initial.year));
  const [supervisor, setSupervisor] = useState(initial.supervisor_name);
  const [departmentId, setDepartmentId] = useState(initial.department_id);
  const [programmeId, setProgrammeId] = useState(initial.programme_id);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filteredProgrammes = useMemo(
    () => programmes.filter((p) => p.department_id === departmentId),
    [programmes, departmentId]
  );

  const keywordChips = keywords
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const res = await updateThesisMetadata(thesisId, {
        title,
        abstract,
        keywords,
        year: Number(year),
        supervisor_name: supervisor,
        department_id: departmentId,
        programme_id: programmeId,
      });

      if (res.success) {
        router.push(`/admin/theses/${thesisId}`);
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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
        />

        <div className="mb-2 flex items-baseline justify-between">
          <label className="field-label !mb-0" htmlFor="abstract">
            Abstract
          </label>
          <span className="text-sm text-tsu-text-muted">{abstract.length.toLocaleString()} characters</span>
        </div>
        <textarea
          id="abstract"
          required
          rows={12}
          value={abstract}
          onChange={(e) => setAbstract(e.target.value)}
          className="field mb-5 leading-relaxed"
        />

        <label className="field-label" htmlFor="keywords">
          Keywords
        </label>
        <input
          id="keywords"
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
          className="field"
          placeholder="Separate with commas"
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
              min="1990"
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
              value={supervisor}
              onChange={(e) => setSupervisor(e.target.value)}
              className="field"
            />
          </div>
        </div>
      </div>

      {error && <div className="alert-error">{error}</div>}

      <div className="flex flex-col gap-3 sm:flex-row">
        <button type="submit" disabled={isPending} className="btn-primary flex-1 py-3.5">
          {isPending ? "Saving…" : "Save changes"}
        </button>
        <button
          type="button"
          onClick={() => router.push(`/admin/theses/${thesisId}`)}
          disabled={isPending}
          className="btn-secondary"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
