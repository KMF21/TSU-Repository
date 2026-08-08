"use client";

import { useState } from "react";

export function ExpandableText({
  text,
  maxLength = 400,
  className = "",
}: {
  text: string;
  maxLength?: number;
  className?: string;
}) {
  const [expanded, setExpanded] = useState(false);

  const needsTruncation = text.length > maxLength;
  const displayText =
    expanded || !needsTruncation ? text : text.slice(0, maxLength).trimEnd() + "…";

  return (
    <div>
      <p className={className}>{displayText}</p>
      {needsTruncation && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="text-xs text-tsu-accent-tag-text hover:underline mt-2"
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      )}
    </div>
  );
}