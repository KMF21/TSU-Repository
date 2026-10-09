"use client";

import { useState } from "react";

/**
 * Shows long text (an abstract) truncated at `maxLength` characters, cut on
 * a word boundary, with a Read more / Show less toggle. The full text is
 * always in the DOM-reachable state: nothing is ever discarded, so an admin
 * reviewing a submission can expand it and read every word.
 */
export function ExpandableText({
  text,
  maxLength = 400,
  className = "",
  defaultExpanded = false,
}: {
  text: string;
  maxLength?: number;
  className?: string;
  defaultExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const needsTruncation = text.length > maxLength;

  let displayText = text;
  if (needsTruncation && !expanded) {
    const slice = text.slice(0, maxLength);
    const lastSpace = slice.lastIndexOf(" ");
    // Cut on a word boundary unless that would throw away too much text.
    const cut = lastSpace > maxLength * 0.6 ? slice.slice(0, lastSpace) : slice;
    displayText = cut.trimEnd().replace(/[,;:.\-–—]+$/, "") + "…";
  }

  return (
    <div>
      <p className={`whitespace-pre-line ${className}`}>{displayText}</p>
      {needsTruncation && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="mt-3 inline-flex items-center gap-1.5 text-base font-semibold text-tsu-accent-tag-text transition-colors hover:text-white"
        >
          {expanded ? "Show less" : "Read more"}
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            className={`transition-transform ${expanded ? "rotate-180" : ""}`}
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
      )}
    </div>
  );
}
