

/**
 * Internal (30) = mids component (20) + assignment (10)
 * mids component = (75% of highest mid + 25% of lowest mid) / 40 * 20
 */
export function midsComponent(mid1, mid2) {
  if (mid1 == null && mid2 == null) return null;
  const a = mid1 ?? 0;
  const b = mid2 ?? 0;
  const hi = Math.max(a, b);
  const lo = Math.min(a, b);
  const weighted = hi * 0.75 + lo * 0.25; // out of 40
  return round(weighted / 40 * 20);
}

export function internalTotal(m) {
  const mids = midsComponent(m.mid1, m.mid2);
  if (mids == null) return null;
  return round(mids + (m.assignment ?? 0));
}

export function grandTotal(m) {
  const internal = internalTotal(m);
  if (internal == null || m.external == null) return null;
  return round(internal + m.external);
}

/** Combined mid performance expressed out of 100 (used for current semester). */
export function midOutOf100(m) {
  if (m.mid1 == null && m.mid2 == null) return null;
  const a = m.mid1 ?? 0;
  const b = m.mid2 ?? 0;
  const hi = Math.max(a, b);
  const lo = Math.min(a, b);
  return round((hi * 0.75 + lo * 0.25) / 40 * 100);
}

export function gradeOf(total) {
  if (total >= 90) return "O";
  if (total >= 80) return "A+";
  if (total >= 70) return "A";
  if (total >= 60) return "B+";
  if (total >= 50) return "B";
  if (total >= 40) return "C";
  return "F";
}

export function gradePoint(total) {
  if (total >= 90) return 10;
  if (total >= 80) return 9;
  if (total >= 70) return 8;
  if (total >= 60) return 7;
  if (total >= 50) return 6;
  if (total >= 40) return 5;
  return 0;
}

export function isPass(total) {
  return total >= 40;
}

export function round(n) {
  return Math.round(n * 100) / 100;
}

/** CGPA out of 10: 75/100 => 7.5 */
export function cgpaFromPercent(percent) {
  return round(percent / 10);
}