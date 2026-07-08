export type TemplateVariables = Record<string, string>;

export function renderEmailTemplate(
  template: string,
  variables: TemplateVariables,
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key: string) => {
    if (!(key in variables)) return "";
    return variables[key] ?? "";
  });
}

export function renderGradeButtonHtml(url: string, label = "Submit grade"): string {
  if (!url) return "";
  return `<p><a href="${escapeHtmlAttribute(url)}" style="display:inline-block;padding:12px 24px;background:#059669;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:600;">${escapeHtml(label)}</a></p>`;
}

export function plainTextToHtml(text: string): string {
  const escaped = escapeHtml(text);
  return `<div style="font-family:system-ui,sans-serif;line-height:1.5;color:#1e293b;">${escaped.replace(/\n/g, "<br />")}</div>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeHtmlAttribute(value: string): string {
  return escapeHtml(value).replace(/"/g, "&quot;");
}
