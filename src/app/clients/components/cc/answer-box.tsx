"use client";
//test
import Editor, { useMonaco } from "@monaco-editor/react";
import { useEffect, useState } from "react";

export type AnswerBoxProps = {
  subject: string;
  body: string;
  onChange?: (value: string) => void;
  language?: string;
  onLanguageChange?: (language: string) => void;
};

// Add more languages if needed
const LANGUAGE_OPTIONS = [
  { value: "plaintext", label: "Plain Text" },
  { value: "cpp", label: "C++" },
  { value: "c", label: "C" },
  { value: "java", label: "Java" },
  { value: "python", label: "Python" },
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "rust", label: "Rust" },
  { value: "go", label: "Go" },
];

const AnswerBox = (props: AnswerBoxProps) => {
  const initialBody = typeof props.body === "string" ? props.body : "";
  const [code, setCode] = useState(initialBody);
  const [selectedLanguage, setSelectedLanguage] = useState(
    props.language || "plaintext",
  );
  const monaco = useMonaco();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInMonaco =
        target.closest(".monaco-editor") || target.className.includes("monaco");

      if (!isInMonaco) return;
      const isLetterKey = /^[a-z]$/i.test(e.key);
      const hasModifier = e.metaKey || e.ctrlKey || e.altKey;

      if (isLetterKey && !hasModifier) {
        e.stopPropagation();
      }
    };

    window.addEventListener("keydown", handler, true);
    return () => window.removeEventListener("keydown", handler, true);
  }, []);

  useEffect(() => {
    if (monaco) {
      monaco.editor.defineTheme("cc-theme", {
        base: "vs-dark",
        inherit: true,
        rules: [
          { token: "comment", foreground: "6A9955", fontStyle: "italic" },
          { token: "keyword", foreground: "C9EB3E" },
          { token: "string", foreground: "CE9178" },
          { token: "number", foreground: "B5CEA8" },
          { token: "type", foreground: "4EC9B0" },
          { token: "function", foreground: "DCDCAA" },
          { token: "variable", foreground: "9CDCFE" },
        ],
        colors: {
          "editor.background": "#16171B",
          "editor.foreground": "#FFFFFF",
          "editorLineNumber.foreground": "#858585",
          "editorLineNumber.activeForeground": "#C9EB3E",
          "editor.selectionBackground": "#C9EB3E",
          "editor.selectionForeground": "#999999",
          "editor.lineHighlightBackground": "#242527",
          "editorCursor.foreground": "#C9EB3E",
          "editorWhitespace.foreground": "#3B3B3B",
        },
      });
      monaco.editor.setTheme("cc-theme");
    }
  }, [monaco]);

  const handleEditorChange = (newValue: string | undefined) => {
    const value = newValue || "";
    setCode(value);
    props.onChange?.(value);
  };

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLanguage = e.target.value;
    setSelectedLanguage(newLanguage);
    props.onLanguageChange?.(newLanguage);
  };

  return (
    <div className="flex flex-col w-full h-full bg-[#16171B] border-[2px] border-solid border-[#393A3D]">
      <div className="w-full h-12 flex items-center justify-between px-3 border border-solid border-[#393A3D] bg-[#242527]">
        <span className="text-[#C9EB3E] font-ShareTechMono text-[20px]">
          {props.subject}
        </span>
        <select
          value={selectedLanguage}
          onChange={handleLanguageChange}
          className="bg-[#16171B] text-[#C9EB3E] border-[2px] border-solid border-[#393A3D] px-3 py-1 font-ShareTechMono text-[16px] rounded-sm focus:outline-none hover:border-[#C9EB3E]"
        >
          {LANGUAGE_OPTIONS.map((lang) => (
            <option key={lang.value} value={lang.value}>
              {lang.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex-1 w-full min-h-[220px] selection:bg-[#ccff00]">
        <Editor
          height="100%"
          theme="cc-theme"
          language={selectedLanguage}
          value={code}
          onChange={handleEditorChange}
          options={{
            minimap: { enabled: false },
            fontFamily: "ShareTechMono, monospace",
            fontSize: 14,
            wordWrap: "on",
            wrappingIndent: "same",
            scrollBeyondLastLine: false,
            suggestOnTriggerCharacters: selectedLanguage !== "plaintext",
            quickSuggestions: selectedLanguage !== "plaintext",
            wordBasedSuggestions:
              selectedLanguage !== "plaintext" ? "matchingDocuments" : "off",
          }}
        />
      </div>
    </div>
  );
};

export default AnswerBox;
