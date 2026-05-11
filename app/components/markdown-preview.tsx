"use client";

import MarkdownIt from "markdown-it";
import { useMemo } from "react";

const md = new MarkdownIt({ html: false, linkify: true, typographer: true });

export function MarkdownPreview({
  content,
  onWikiLink,
}: {
  content: string;
  onWikiLink: (target: string) => void;
}) {
  const previewHtml = useMemo(() => {
    const withWikiLinks = content.replace(/!?\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_match, target, alias) => {
      const label = alias || target;
      return `[${label}](#wiki:${encodeURIComponent(target)})`;
    });

    return md.render(withWikiLinks);
  }, [content]);

  return (
    <article
      className="markdown-preview mx-auto w-full max-w-4xl px-5 py-6"
      onClick={(event) => {
        const target = event.target as HTMLElement;
        const link = target.closest("a");
        const href = link?.getAttribute("href");
        if (href?.startsWith("#wiki:")) {
          event.preventDefault();
          onWikiLink(decodeURIComponent(href.replace("#wiki:", "")));
        }
      }}
      dangerouslySetInnerHTML={{ __html: previewHtml }}
    />
  );
}
