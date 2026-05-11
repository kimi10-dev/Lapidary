"use client";

import { markdown } from "@codemirror/lang-markdown";
import CodeMirror from "@uiw/react-codemirror";

export function MarkdownEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <CodeMirror
      value={value}
      height="100%"
      extensions={[markdown()]}
      basicSetup={{ lineNumbers: true, foldGutter: true }}
      onChange={onChange}
    />
  );
}
