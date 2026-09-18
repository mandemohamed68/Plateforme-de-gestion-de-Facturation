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
export function getCurrentDateTimeDDMMYYYY(): string {
  return formatDateTimeDDMMYYYY(new Date());
}
