/**
 * Standard date and time formatting utilities for the Hospital Information System (SIH).
 * Strictly enforces the standard French format: JJ/MM/AAAA and JJ/MM/AAAA HH:mm
 */

/**
 * Format any date input to JJ/MM/AAAA
 * Example: "2026-09-18" -> "18/09/2026"
 */
export function formatDateDDMMYYYY(dateInput: string | number | Date | null | undefined): string {
  if (!dateInput) return '—';
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) {
      // Fallback regex if it's already YYYY-MM-DD
      if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateInput)) {
        const parts = dateInput.slice(0, 10).split('-');
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return String(dateInput);
    }
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return String(dateInput || '—');
  }
}

/**
 * Format any date input to JJ/MM/AAAA à HH:mm (or JJ/MM/AAAA HH:mm)
 * Example: "2026-09-18T10:15:00Z" -> "18/09/2026 à 10:15"
 */
export function formatDateTimeDDMMYYYY(
  dateInput: string | number | Date | null | undefined,
  includeAtSeparator = true
): string {
  if (!dateInput) return '—';
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return formatDateDDMMYYYY(dateInput);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const sep = includeAtSeparator ? ' à ' : ' ';
    return `${day}/${month}/${year}${sep}${hours}:${minutes}`;
  } catch {
    return formatDateDDMMYYYY(dateInput);
  }
}

/**
 * Get current date in JJ/MM/AAAA
 */
export function getCurrentDateDDMMYYYY(): string {
  return formatDateDDMMYYYY(new Date());
}

/**
 * Get current date and time in JJ/MM/AAAA à HH:mm
 */
export function getCurrentDateTimeDDMMYYYY(includeAtSeparator = true): string {
  return formatDateTimeDDMMYYYY(new Date(), includeAtSeparator);
}

/**
 * Get local ISO date string (YYYY-MM-DD) based on user's current local timezone
 */
export function getLocalISODate(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Robustly check if a date corresponds to today in the user's local timezone.
 * Handles ISO strings (YYYY-MM-DD...), French format (DD/MM/YYYY...), timestamps and Date objects.
 */
export function isDateToday(dateInput: string | number | Date | null | undefined): boolean {
  if (!dateInput) return false;

  const today = new Date();
  const todayDay = today.getDate();
  const todayMonth = today.getMonth();
  const todayYear = today.getFullYear();

  // If already string with DD/MM/YYYY format
  if (typeof dateInput === 'string') {
    const trimmed = dateInput.trim();
    // Match DD/MM/YYYY
    const ddmmyyyyMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (ddmmyyyyMatch) {
      const d = parseInt(ddmmyyyyMatch[1], 10);
      const m = parseInt(ddmmyyyyMatch[2], 10) - 1;
      const y = parseInt(ddmmyyyyMatch[3], 10);
      return d === todayDay && m === todayMonth && y === todayYear;
    }

    // Match YYYY-MM-DD
    const yyyymmddMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (yyyymmddMatch) {
      const y = parseInt(yyyymmddMatch[1], 10);
      const m = parseInt(yyyymmddMatch[2], 10) - 1;
      const d = parseInt(yyyymmddMatch[3], 10);
      return d === todayDay && m === todayMonth && y === todayYear;
    }
  }

  // General Date parsing
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return false;
    return (
      d.getDate() === todayDay &&
      d.getMonth() === todayMonth &&
      d.getFullYear() === todayYear
    );
  } catch {
    return false;
  }
}
