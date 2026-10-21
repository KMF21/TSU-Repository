"use client";

import { useState } from "react";

type Props = {
  author: string;
  year: number;
  title: string;
  degreeType: string;
  degreeLabel: string;
  department: string;
  institution: string;
  url: string;
};

/** Citation block with APA / BibTeX / plain tabs and one-click copy. */
export function CitationCard({
  author,
  year,
  title,
  degreeType,
  degreeLabel,
  department,
  institution,
  url,
}: Props) {
  const [tab, setTab] = useState<"apa" | "bibtex" | "plain">("apa");
  const [copied, setCopied] = useState(false);

  const kind =
    degreeType === "phd" ? "Doctoral dissertation" : degreeType === "bsc" ? "Bachelor's thesis" : "Master's thesis";

  const key =
    (author.split(/\s+/).pop() ?? "thesis").replace(/[^a-zA-Z]/g, "").toLowerCase() + year;

  const text = {
    apa: `${author}. (${year}). ${title} [${kind}, ${institution}]. TSU Digital Research Repository. ${url}`,
    bibtex: `@${degreeType === "phd" ? "phdthesis" : "mastersthesis"}{${key},
  author  = {${author}},
  title   = {${title}},
  school  = {${institution}},
  year    = {${year}},
  type    = {${degreeLabel} thesis, ${department}},
  url     = {${url}}
}`,
    plain: `${author}. (${year}). ${title}. ${degreeLabel} thesis, ${department}, ${institution}.`,
  }[tab];

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable (e.g. insecure context) — the text is still selectable */
    }
  }

  const tabs = [
    ["apa", "APA"],
    ["bibtex", "BibTeX"],
    ["plain", "Plain"],
  ] as const;

  return (
    <div className="card p-6 sm:p-10">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="section-label">How to cite this</p>
        <div className="flex items-center gap-2">
          <div className="flex rounded-pill border border-tsu-card-border bg-tsu-bg p-1">
            {tabs.map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setTab(value)}
                className={`rounded-pill px-3.5 py-1.5 text-sm font-semibold transition-colors ${
                  tab === value ? "bg-tsu-navy text-white" : "text-tsu-text-secondary hover:text-tsu-navy"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={copy}
            className="rounded-pill border border-tsu-card-border bg-tsu-bg px-4 py-2 text-sm font-semibold text-tsu-accent-tag-text transition-colors hover:text-tsu-navy"
          >
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>

      {tab === "bibtex" ? (
        <pre className="overflow-x-auto whitespace-pre-wrap break-words rounded-xl bg-tsu-bg p-5 font-mono text-sm leading-relaxed text-tsu-text-primary">
          {text}
        </pre>
      ) : (
        <p className="break-words text-base leading-relaxed text-tsu-text-primary sm:text-lg">{text}</p>
      )}
    </div>
  );
}
