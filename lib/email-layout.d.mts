export function emailLayout(o: {
  site: string;
  title: string;
  intro: string;
  chip?: string;
  tone?: "info" | "warn";
  button?: { label: string; url: string };
  code?: string;
  meta?: string[];
  fallback?: boolean;
  footnote: string;
}): string;
