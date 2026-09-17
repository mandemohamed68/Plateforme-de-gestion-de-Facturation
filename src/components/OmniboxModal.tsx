import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  User,
  FileText,
  CreditCard,
  Microscope,
  Stethoscope,
  ArrowRight,
  Clock,
  X,
  Phone,
  Shield,
  Zap,
  Activity,
  Calendar,
  Layers,
  ChevronRight
} from 'lucide-react';
import { ResPartner, AccountMove, AppView, CompanySettings, ResUser } from '../types';
import { formatFCFA } from '../lib/formatters';

interface OmniboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  partners?: ResPartner[];
  moves?: AccountMove[];
  currentUser: ResUser | null;
  company: CompanySettings;
  onNavigateToView: (view: AppView) => void;
  onSelectPatient?: (patient: ResPartner) => void;
  onSelectMove?: (move: AccountMove) => void;
  onSearchNDM?: (ndm: string) => void;
}

export const OmniboxModal: React.FC<OmniboxModalProps> = ({
  isOpen,
  onClose,
  partners = [],
  moves = [],
  currentUser,
  company,
  onNavigateToView,
  onSelectPatient,
  onSelectMove,
  onSearchNDM,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus on mount
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Global keyboard shortcuts (ESC to close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Fast filtered items
  const searchResults = useMemo(() => {
    const trimmed = query.trim().toLowerCase();

    // Available Quick Actions
    const quickActions = [
      {
        id: 'qa-new-consultation',
        type: 'action' as const,
        title: 'Nouvelle Consultation Médicale',
        subtitle: 'Enregistrer une admission ou consultation',
        icon: Stethoscope,
        category: 'Action Rapide',
        action: () => onNavigateToView('consultations'),
      },
      {
        id: 'qa-new-invoice',
        type: 'action' as const,
        title: 'Nouvelle Facture Patient / Assurance',
        subtitle: 'Créer un acte de facturation médicale',
        icon: FileText,
        category: 'Action Rapide',
        action: () => onNavigateToView('invoices'),
      },
      {
        id: 'qa-caisse-sessions',
        type: 'action' as const,
        title: 'Caisse Journalière & Arrêté Z',
        subtitle: 'Ouvrir, clôturer ou consulter le billetage de caisse',
        icon: CreditCard,
        category: 'Action Rapide',
        action: () => onNavigateToView('caisse_sessions'),
      },
      {
        id: 'qa-lab-results',
        type: 'action' as const,
        title: 'Laboratoire & Paillasse Biologique',
        subtitle: 'Saisie et validation des analyses',
        icon: Microscope,
        category: 'Action Rapide',
        action: () => onNavigateToView('lab_results'),
      },
      {
        id: 'qa-care-plans',
        type: 'action' as const,
        title: 'Feuille de Soins & Relève Infirmière',
        subtitle: 'Planifier et administrer les actes infirmiers',
        icon: Activity,
        category: 'Action Rapide',
        action: () => onNavigateToView('care_plans'),
      },
    ];

    if (!trimmed) {
      // Return 5 most recent patients and quick actions
      const recentPatients = partners
        .filter((p) => !p.partner_type || p.partner_type === 'patient')
        .slice(0, 5)
        .map((p) => ({
          id: `p-${p.id}`,
          type: 'patient' as const,
          title: p.name,
          subtitle: `NDM: ${p.ndm || 'N/A'} • ${p.phone || 'Sans tél'} • ${p.insurance_name || 'Patient Direct'}`,
          icon: User,
          category: 'Patients Récents',
          data: p,
          action: () => {
            if (onSelectPatient) onSelectPatient(p);
            else if (onSearchNDM && p.ndm) onSearchNDM(p.ndm);
            else onNavigateToView('partners');
          },
        }));

      return [...recentPatients, ...quickActions];
    }

    // Filter patients
    const matchedPatients = partners
      .filter((p) => {
        if (p.partner_type && p.partner_type !== 'patient') return false;
        const nameMatch = (p.name || '').toLowerCase().includes(trimmed);
        const ndmMatch = (p.ndm || '').toLowerCase().includes(trimmed);
        const phoneMatch = (p.phone || '').toLowerCase().includes(trimmed);
        const insMatch = (p.insurance_name || '').toLowerCase().includes(trimmed);
        return nameMatch || ndmMatch || phoneMatch || insMatch;
      })
      .slice(0, 6)
      .map((p) => ({
        id: `p-${p.id}`,
        type: 'patient' as const,
        title: p.name,
        subtitle: `NDM: ${p.ndm || 'N/A'} • Tél: ${p.phone || '-'} • ${p.insurance_name || 'Comptant'}`,
        icon: User,
        category: 'Patients',
        data: p,
        action: () => {
          if (onSelectPatient) onSelectPatient(p);
          else if (onSearchNDM && p.ndm) onSearchNDM(p.ndm);
          else onNavigateToView('partners');
        },
      }));

    // Filter invoices / moves
    const matchedMoves = moves
      .filter((m) => {
        const nameMatch = (m.name || '').toLowerCase().includes(trimmed);
        const partnerMatch = (m.partner_name || m.partner?.name || '').toLowerCase().includes(trimmed);
        return nameMatch || partnerMatch;
      })
      .slice(0, 5)
      .map((m) => ({
        id: `m-${m.id}`,
        type: 'move' as const,
        title: `Facture ${m.name || `#${m.id}`}`,
        subtitle: `${m.partner_name || m.partner?.name || 'Client'} • ${formatFCFA(m.amount_total || 0)} (${m.payment_state === 'paid' ? 'Payée' : 'Non soldée'})`,
        icon: FileText,
        category: 'Factures & Reçus',
        data: m,
        action: () => {
          if (onSelectMove) onSelectMove(m);
          else onNavigateToView('invoices');
        },
      }));

    // Filter quick actions matching query
    const matchedActions = quickActions.filter(
      (a) =>
        a.title.toLowerCase().includes(trimmed) ||
        a.subtitle.toLowerCase().includes(trimmed)
    );

    return [...matchedPatients, ...matchedMoves, ...matchedActions];
  }, [query, partners, moves, onNavigateToView, onSelectPatient, onSelectMove, onSearchNDM]);

  const handleSelectResult = (item: typeof searchResults[0]) => {
    item.action();
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (searchResults.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + (searchResults.length || 1)) % (searchResults.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (searchResults[selectedIndex]) {
        handleSelectResult(searchResults[selectedIndex]);
      } else if (query.trim() && onSearchNDM) {
        onSearchNDM(query.trim());
        onClose();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      {/* Click outside to close */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Main Omnibox Dialog */}
      <div
        id="omnibox-search-modal"
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-10 flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-150"
      >
        {/* Top Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-200 bg-slate-50/50">
          <Search className="w-5 h-5 text-slate-400 mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Rechercher patient (NDM, nom, tél), facture, analyse ou action rapide..."
            className="w-full bg-transparent border-none text-slate-900 placeholder:text-slate-400 font-medium text-sm focus:outline-none focus:ring-0"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 mr-1"
              title="Effacer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 text-[10px] font-mono font-bold text-slate-400 bg-slate-200/60 border border-slate-300 rounded">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="overflow-y-auto p-2 space-y-1 flex-1 custom-scrollbar">
          {searchResults.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <Search className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-semibold text-slate-700">Aucun résultat trouvé pour "{query}"</p>
              <p className="text-xs text-slate-400 mt-1">
                Appuyez sur <strong className="text-slate-700">Entrée</strong> pour lancer une recherche globale par N° dossier NDM.
              </p>
            </div>
          ) : (
            searchResults.map((item, index) => {
              const Icon = item.icon;
              const isSelected = index === selectedIndex;

              return (
                <button
                  key={item.id}
                  id={`omnibox-result-${index}`}
                  onClick={() => handleSelectResult(item)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-all ${
                    isSelected
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'hover:bg-slate-100 text-slate-800'
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <div
                      className={`p-2 rounded-lg shrink-0 ${
                        isSelected
                          ? 'bg-white/10 text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-xs sm:text-sm truncate">
                          {item.title}
                        </span>
                        <span
                          className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                            isSelected
                              ? 'bg-white/20 text-slate-200'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {item.category}
                        </span>
                      </div>
                      <p
                        className={`text-[11px] truncate mt-0.5 ${
                          isSelected ? 'text-slate-300' : 'text-slate-500'
                        }`}
                      >
                        {item.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1 shrink-0 ml-2">
                    <ChevronRight
                      className={`w-4 h-4 transition-transform ${
                        isSelected ? 'text-white translate-x-0.5' : 'text-slate-300'
                      }`}
                    />
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500 font-medium">
          <div className="flex items-center space-x-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 font-mono text-[9px] bg-white border border-slate-300 rounded shadow-2xs font-bold text-slate-700">↑</kbd>
              <kbd className="px-1.5 py-0.5 font-mono text-[9px] bg-white border border-slate-300 rounded shadow-2xs font-bold text-slate-700">↓</kbd>
              <span>Naviguer</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 font-mono text-[9px] bg-white border border-slate-300 rounded shadow-2xs font-bold text-slate-700">↵</kbd>
              <span>Sélectionner</span>
            </span>
          </div>
          <span className="hidden sm:inline text-slate-400">
            {company.name || 'Système Hospitalier Intégré'}
          </span>
        </div>
      </div>
    </div>
  );
};
