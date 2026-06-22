import type { SubjectColor } from '@/api/types';

/** Score → semantic color: strong (≥70) success, mid (≥50) warning, low error. */
export function scoreColorKey(score: number): SubjectColor {
  if (score >= 70) return 'success';
  if (score >= 50) return 'warning';
  return 'error';
}
