/**
 * Caisse & Caisse-Facture Session Management and Supervisor Auditing Service
 * Ensures mandatory session opening/closing, session persistence across logouts/inactivity,
 * and supervisor-only correction/deletion of invoices and payments with reason logs.
 */

import { formatDateDDMMYYYY, formatDateTimeDDMMYYYY } from './dateUtils';
import { TillSession, ResUser } from '../types';

export interface FinancialCorrectionLog {
  id: string;
  date: string; // JJ/MM/AAAA
  dateTime: string; // JJ/MM/AAAA à HH:mm
  timestamp: number;
  supervisorId: number;
  supervisorName: string;
  targetType: 'invoice' | 'payment';
  targetRef: string;
  action: 'edit' | 'delete' | 'cancel' | 'correction';
  reason: string;
  oldAmount?: number;
  newAmount?: number;
  details?: string;
}

const SESSIONS_STORAGE_KEY = 'hospital_till_sessions_registry_v1';
const AUDIT_LOGS_STORAGE_KEY = 'hospital_financial_corrections_audit_v1';

/**
 * Determine if a user role belongs strictly to cashier or cashier-facture
 */
export function isCashierOnlyProfile(user: ResUser | null): boolean {
  if (!user) return false;
  const role = (user.role || '').toLowerCase().trim();
  const login = (user.login || '').toLowerCase().trim();

  // If user is supervisor or admin or director, they are NOT restricted cashier-only
  if (
    role.includes('superviseur') ||
    role.includes('admin') ||
    role.includes('directeur') ||
    login.includes('superviseur') ||
    login.includes('admin')
  ) {
    return false;
  }

  return (
    role.includes('caisse') ||
    role.includes('caissier') ||
    role.includes('polyvalent') ||
    login === 'caissier' ||
    login === 'caisse_facture' ||
    login === 'facturier' ||
    role.includes('facture / caisse') ||
    role.includes('facture/caisse')
  );
}

/**
 * Determine if a user is a financial supervisor or admin
 */
export function isSupervisorOrAdmin(user: ResUser | null): boolean {
  if (!user) return false;
  const role = (user.role || '').toLowerCase().trim();
  const login = (user.login || '').toLowerCase().trim();
  const email = (user.email || '').toLowerCase().trim();

  return (
    role.includes('supervis') ||
    role.includes('admin') ||
    role.includes('direct') ||
    role.includes('universel') ||
    login.includes('supervis') ||
    login.includes('admin') ||
    login === 'mandemohamed68@gmail.com' ||
    email === 'mandemohamed68@gmail.com' ||
    (user.group_ids || []).includes(1) || // Admin group
    (user.group_ids || []).includes(5)   // Direction/Billing supervisor group
  );
}

/**
 * Load all stored sessions from localStorage or default seed
 */
export function loadAllSessions(): TillSession[] {
  try {
    const raw = localStorage.getItem(SESSIONS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Error reading stored till sessions:', e);
  }

  // Initial seed if none exists
  const now = new Date();
  const seedDate = formatDateDDMMYYYY(now);
  const seed: TillSession[] = [
    {
      id: 101,
      session_code: 'POS-2026-0089',
      till_name: 'Guichet Caisse 1 (Central)',
      cashier_id: 3,
      cashier_name: 'Amadou Caissier',
      state: 'in_progress',
      opening_date: `${seedDate} 08:00`,
      opening_balance: 50000,
      total_cash_collected: 185000,
      total_mobile_money_collected: 75000,
      total_card_collected: 0,
      total_check_collected: 0,
      total_collected: 260000,
      transactions: [],
      created_at: `${seedDate} 08:00`,
      updated_at: `${seedDate} 08:00`,
    },
    {
      id: 102,
      session_code: 'POS-2026-0088',
      till_name: 'Guichet Caisse 2 (Urgences)',
      cashier_id: 4,
      cashier_name: 'Awa Polyvalente Caisse-Facture',
      state: 'in_progress',
      opening_date: `${seedDate} 08:30`,
      opening_balance: 50000,
      total_cash_collected: 92000,
      total_mobile_money_collected: 15000,
      total_card_collected: 0,
      total_check_collected: 0,
      total_collected: 107000,
      transactions: [],
      created_at: `${seedDate} 08:30`,
      updated_at: `${seedDate} 08:30`,
    },
  ];

  saveAllSessions(seed);
  return seed;
}

export function saveAllSessions(sessions: TillSession[]): void {
  try {
    localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
  } catch (e) {
    console.error('Error saving till sessions to storage:', e);
  }
}

/**
 * Get active session for a specific cashier.
 * Because sessions are persisted in localStorage, closing a browser or logout
 * DOES NOT close the active session.
 */
export function getActiveSessionForCashier(user: ResUser | null): TillSession | null {
  if (!user) return null;
  const all = loadAllSessions();
  return (
    all.find(
      (s) =>
        (s.cashier_id === user.id || s.cashier_name === user.name) &&
        s.state === 'in_progress'
    ) || null
  );
}

/**
 * Open a new official session for the cashier
 */
export function openNewCashierSession(params: {
  userId: number;
  userName: string;
  tillName: string;
  openingBalance: number;
  notes?: string;
}): TillSession {
  const all = loadAllSessions();
  const existingActive = all.find(
    (s) => (s.cashier_id === params.userId || s.cashier_name === params.userName) && s.state === 'in_progress'
  );

  if (existingActive) {
    return existingActive;
  }

  const now = new Date();
  const sessionCode = `POS-${now.getFullYear()}-${String(all.length + 1).padStart(4, '0')}`;
  const nowFormatted = formatDateTimeDDMMYYYY(now, false);
  const newSession: TillSession = {
    id: Date.now(),
    session_code: sessionCode,
    till_name: params.tillName || 'Guichet Caisse 1',
    cashier_id: params.userId,
    cashier_name: params.userName,
    state: 'in_progress',
    opening_date: nowFormatted,
    opening_balance: params.openingBalance || 0,
    total_cash_collected: 0,
    total_mobile_money_collected: 0,
    total_card_collected: 0,
    total_check_collected: 0,
    total_collected: 0,
    notes: params.notes,
    created_at: nowFormatted,
    updated_at: nowFormatted,
    transactions: [],
  };

  const updated = [newSession, ...all];
  saveAllSessions(updated);
  return newSession;
}

/**
 * Clôture d'une session de caisse avec arrêté de compte et billetage
 */
export function closeCashierSession(params: {
  sessionId: number;
  actualCash: number;
  notes?: string;
  billetage?: Record<number, number>;
  closedBySupervisor?: boolean;
  supervisorName?: string;
}): TillSession | null {
  const all = loadAllSessions();
  const index = all.findIndex((s) => s.id === params.sessionId);
  if (index === -1) return null;

  const session = { ...all[index] };
  const expectedCash = (session.opening_balance || 0) + (session.total_cash_collected || 0);
  const difference = params.actualCash - expectedCash;
  const now = new Date();

  session.state = 'closed';
  session.closing_date = formatDateTimeDDMMYYYY(now, false);
  session.closing_actual_cash = params.actualCash;
  session.closing_expected_cash = expectedCash;
  session.cash_variance = difference;
  session.updated_at = formatDateTimeDDMMYYYY(now, false);
  session.notes = params.notes
    ? `${session.notes ? session.notes + ' | ' : ''}${params.notes}`
    : session.notes;

  if (params.closedBySupervisor && params.supervisorName) {
    session.notes = `${session.notes ? session.notes + ' | ' : ''}Clôturé par le Superviseur ${params.supervisorName}`;
  }

  all[index] = session;
  saveAllSessions(all);
  return session;
}

/**
 * Supervisor force closure of an active session
 */
export function supervisorForceCloseSession(
  sessionId: number,
  supervisorUser: ResUser,
  reason: string
): TillSession | null {
  const all = loadAllSessions();
  const session = all.find((s) => s.id === sessionId);
  if (!session) return null;

  const expectedCash = (session.opening_balance || 0) + (session.total_cash_collected || 0);
  const closed = closeCashierSession({
    sessionId,
    actualCash: expectedCash,
    notes: `Arrêté forcé par le superviseur: ${reason}`,
    closedBySupervisor: true,
    supervisorName: supervisorUser.name,
  });

  // Log to audit corrections
  logFinancialCorrection({
    supervisorId: supervisorUser.id,
    supervisorName: supervisorUser.name,
    targetType: 'payment',
    targetRef: session.session_code,
    action: 'cancel',
    reason: `Clôture d'office de session: ${reason}`,
    details: `Session de caisse ${session.till_name} opérée par ${session.cashier_name}`,
  });

  return closed;
}

/**
 * Save an audit correction record (when supervisor modifies, cancels or corrects a financial item)
 */
export function logFinancialCorrection(params: {
  supervisorId: number;
  supervisorName: string;
  targetType: 'invoice' | 'payment';
  targetRef: string;
  action: 'edit' | 'delete' | 'cancel' | 'correction';
  reason: string;
  oldAmount?: number;
  newAmount?: number;
  details?: string;
}): FinancialCorrectionLog {
  const now = new Date();
  const log: FinancialCorrectionLog = {
    id: `AUDIT-${Date.now()}`,
    date: formatDateDDMMYYYY(now),
    dateTime: formatDateTimeDDMMYYYY(now),
    timestamp: Date.now(),
    supervisorId: params.supervisorId,
    supervisorName: params.supervisorName,
    targetType: params.targetType,
    targetRef: params.targetRef,
    action: params.action,
    reason: params.reason,
    oldAmount: params.oldAmount,
    newAmount: params.newAmount,
    details: params.details,
  };

  const logs = loadFinancialCorrections();
  const updated = [log, ...logs];
  try {
    localStorage.setItem(AUDIT_LOGS_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Error saving financial corrections log:', e);
  }

  return log;
}

/**
 * Load all supervisor audit corrections
 */
export function loadFinancialCorrections(): FinancialCorrectionLog[] {
  try {
    const raw = localStorage.getItem(AUDIT_LOGS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn('Error reading financial audit logs:', e);
  }

  // Seed with a few realistic audit records
  const now = new Date();
  const d = formatDateDDMMYYYY(now);
  const seed: FinancialCorrectionLog[] = [
    {
      id: 'AUDIT-1001',
      date: d,
      dateTime: `${d} à 09:40`,
      timestamp: Date.now() - 3600000 * 2,
      supervisorId: 1,
      supervisorName: 'Dr. Ibrahim Traoré (Superviseur)',
      targetType: 'payment',
      targetRef: 'PAY-2026-0042',
      action: 'correction',
      reason: 'Erreur de saisie de mode de règlement (Espèces au lieu de Wave)',
      oldAmount: 15000,
      newAmount: 15000,
      details: 'Rectification guichet Urgences avec quittance NDM-00270418',
    },
    {
      id: 'AUDIT-1002',
      date: d,
      dateTime: `${d} à 11:15`,
      timestamp: Date.now() - 3600000,
      supervisorId: 1,
      supervisorName: 'Dr. Ibrahim Traoré (Superviseur)',
      targetType: 'invoice',
      targetRef: 'FAC-2026-0105',
      action: 'edit',
      reason: 'Application rétroactive de la prise en charge assurance 80% omise à la saisie',
      oldAmount: 45000,
      newAmount: 9000,
      details: 'Patient conventionné SONAVIE vérifié sur bordereau',
    },
  ];

  try {
    localStorage.setItem(AUDIT_LOGS_STORAGE_KEY, JSON.stringify(seed));
  } catch (_) {}

  return seed;
}
