const PROGRESS_BAR_SLOTS = 10;
const PROGRESS_PER_SLOT = 100 / PROGRESS_BAR_SLOTS;

export function padNumber(value: number, width: number): string {
  return String(value).padStart(width, '0');
}

export function renderProgressBar(percent: number): string {
  const clamped = Math.max(0, Math.min(100, Math.round(percent)));
  const filled = Math.round(clamped / PROGRESS_PER_SLOT);
  return `${'█'.repeat(filled)}${'░'.repeat(PROGRESS_BAR_SLOTS - filled)} ${clamped}%`;
}

/** `{key}` 형태의 자리표시자를 치환한다. 정의되지 않은 키는 그대로 둔다. */
export function applyTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => vars[key] ?? match);
}
