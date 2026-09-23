import React, { useState, useEffect, useRef } from 'react';
import { printElement, printDocumentById } from '../lib/printUtils';
import {
  X,
  Activity,
  Heart,
  Thermometer,
  Gauge,
  CheckCircle2,
  AlertTriangle,
  Printer,
  FileText,
  User,
  Clock,
  Plus,
  Send,
  Bed,
  Trash2,
  Search,
  Edit3
} from 'lucide-react';
import { MedicalConsultation, ResUser, CompanySettings } from '../types';

// Audio chime using Web Audio API
export const playHospitalChime = () => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(392, now); // G4
    gain1.gain.setValueAtTime(0.15, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.5);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(523.25, now + 0.25); // C5
    gain2.gain.setValueAtTime(0.2, now + 0.25);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.1);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.25);
    osc2.stop(now + 1.1);
  } catch (e) {
    console.error('Audio chime error:', e);
  }
};

// -------------------------------------------------------------
// 1. MODAL SAISIE DES CONSTANTES & PARAMÈTRES VITAUX
// -------------------------------------------------------------

export interface VitalsModalProps {
  consultation: MedicalConsultation | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  currentUser: ResUser | null;
}

export const VitalsModal: React.FC<VitalsModalProps> = ({
  consultation,
  isOpen,
  onClose,
  onSaved,
  currentUser,
}) => {
  const [sys, setSys] = useState<string>('');
  const [dia, setDia] = useState<string>('');
  const [hr, setHr] = useState<string>('');
  const [spo2, setSpo2] = useState<string>('');
  const [temp, setTemp] = useState<string>('37.0');
  const [weight, setWeight] = useState<string>('');
  const [height, setHeight] = useState<string>('');
  const [sugar, setSugar] = useState<string>('');
  const [pain, setPain] = useState<number>(0);
  const [triageLevel, setTriageLevel] = useState<'normal' | 'urgent' | 'critique'>('normal');
  const [boxAssigned, setBoxAssigned] = useState<string>('Box Triage A');
  const [notes, setNotes] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && consultation) {
      const v = consultation.vitals || {};
      setSys(v.bp_systolic?.toString() || '');
      setDia(v.bp_diastolic?.toString() || '');
      setHr(v.heart_rate?.toString() || '');
      setSpo2(v.spo2?.toString() || '');
      setTemp(v.temperature?.toString() || '37.0');
      setWeight(v.weight?.toString() || '');
      setHeight(v.height?.toString() || '');
      setSugar(v.blood_sugar?.toString() || '');
      setPain(v.pain_level ?? 0);
      setTriageLevel(v.triage_level || 'normal');
      setBoxAssigned((consultation as any).box_assigned || 'Box Triage A');
      setNotes(v.vitals_notes || '');
      setFeedback(null);
    }
  }, [isOpen, consultation]);

  if (!isOpen || !consultation) return null;

  // Dynamic IMC calculation
  const wNum = parseFloat(weight);
  const hNum = parseFloat(height);
  const calculatedBmi = wNum > 0 && hNum > 0 ? (wNum / ((hNum / 100) * (hNum / 100))).toFixed(1) : null;
  const bmiNumber = calculatedBmi ? parseFloat(calculatedBmi) : null;

  const getBmiCategory = (bmi: number | null) => {
    if (!bmi) return null;
    if (bmi < 18.5) return { label: 'Insuffisance pondérale', color: 'text-amber-700 bg-amber-50 border-amber-200' };
    if (bmi < 25) return { label: 'Corpulence normale', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
    if (bmi < 30) return { label: 'Surpoids', color: 'text-amber-700 bg-amber-50 border-amber-200' };
    return { label: 'Obésité', color: 'text-rose-700 bg-rose-50 border-rose-200' };
  };

  const bmiCat = getBmiCategory(bmiNumber);

  const handleSubmit = async (orientToDoctor: boolean) => {
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/consultations/${consultation.id}/vitals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bp_systolic: sys,
          bp_diastolic: dia,
          heart_rate: hr,
          spo2,
          temperature: temp,
          weight,
          height,
          blood_sugar: sugar,
          pain_level: pain,
          triage_level: triageLevel,
          box_assigned: boxAssigned,
          vitals_notes: notes,
          taken_by_name: currentUser?.name || 'Awa Diabate (Infirmier)',
          orient_to_doctor: orientToDoctor,
        }),
      });

      if (!res.ok) throw new Error('Erreur lors de la sauvegarde des constantes');

      setFeedback(orientToDoctor ? 'Constantes enregistrées ! Patient transféré au médecin.' : 'Constantes enregistrées avec succès.');
      setTimeout(() => {
        onSaved();
        onClose();
      }, 700);
    } catch (err: any) {
      setFeedback(err.message || 'Erreur réseau');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-slate-700" />
              Saisie des Constantes & Paramètres Vitaux
            </h2>
            <div className="flex items-center gap-2 mt-1 text-xs text-slate-600">
              <span className="font-bold text-slate-900">{consultation.patient_name}</span>
              <span>•</span>
              <span className="font-mono text-slate-500">{consultation.patient_ndm || `NDM-${consultation.partner_id}`}</span>
              {consultation.patient_age && (
                <>
                  <span>•</span>
                  <span>{consultation.patient_age} ans</span>
                </>
              )}
              {consultation.patient_gender && (
                <>
                  <span>•</span>
                  <span>{consultation.patient_gender === 'M' ? 'Masculin' : 'Féminin'}</span>
                </>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs">
          {/* Subtle Directive Bar */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 flex items-center justify-between text-[11px] text-slate-600">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-slate-400"></span>
              <span className="font-bold text-slate-800 uppercase tracking-wider">Directive d'Accueil :</span>
              <span>Relevez les constantes hémodynamiques et la température pour orienter le patient dans le circuit approprié.</span>
            </div>
            <span className="font-semibold text-slate-500">Étape 1/2</span>
          </div>

          {feedback && (
            <div className={`p-3 rounded-lg text-xs font-semibold flex items-center gap-2 ${
              feedback.includes('succès') || feedback.includes('transféré')
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}>
              <CheckCircle2 className="w-4 h-4" />
              <span>{feedback}</span>
            </div>
          )}

          {/* Section 1: Hémodynamique & Température */}
          <div>
            <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider mb-3">
              1. Paramètres Hémodynamiques &amp; Température
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">TA Systolique (mmHg)</label>
                <input
                  type="number"
                  placeholder="ex: 120"
                  value={sys}
                  onChange={(e) => setSys(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">TA Diastolique (mmHg)</label>
                <input
                  type="number"
                  placeholder="ex: 80"
                  value={dia}
                  onChange={(e) => setDia(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">Pouls / FC (bpm)</label>
                <input
                  type="number"
                  placeholder="ex: 75"
                  value={hr}
                  onChange={(e) => setHr(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">Température (°C)</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="ex: 37.0"
                  value={temp}
                  onChange={(e) => setTemp(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Oxygénation & Métabolisme */}
          <div>
            <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider mb-3">
              2. Oxygénation & Métabolisme
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">SpO2 (%)</label>
                <input
                  type="number"
                  placeholder="ex: 98"
                  value={spo2}
                  onChange={(e) => setSpo2(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">Glycémie (g/L)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="ex: 0.95"
                  value={sugar}
                  onChange={(e) => setSugar(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">Poids (kg)</label>
                <input
                  type="number"
                  step="0.5"
                  placeholder="ex: 70"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">Taille (cm)</label>
                <input
                  type="number"
                  placeholder="ex: 175"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
                />
              </div>
            </div>

            {calculatedBmi && (
              <div className="mt-2 flex items-center gap-2">
                <span className="text-slate-600 font-semibold">IMC Calculé :</span>
                <span className="font-mono font-bold text-slate-900">{calculatedBmi} kg/m²</span>
                {bmiCat && (
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${bmiCat.color}`}>
                    {bmiCat.label}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Section 3: Douleur (EVA) */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-black text-slate-800">
                Échelle Visuelle Analogique de la Douleur (EVA)
              </label>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                pain === 0
                  ? 'bg-slate-100 text-slate-700 border-slate-300'
                  : pain <= 3
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : pain <= 6
                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                  : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}>
                {pain}/10 : {pain === 0 ? 'Aucune douleur' : pain <= 3 ? 'Douleur légère' : pain <= 6 ? 'Douleur modérée' : pain <= 8 ? 'Douleur sévère' : 'Douleur intolérable'}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="10"
              value={pain}
              onChange={(e) => setPain(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
              <span>0 (Nulle)</span>
              <span>2</span>
              <span>4</span>
              <span>6</span>
              <span>8</span>
              <span>10 (Maximale)</span>
            </div>
          </div>

          {/* Section 4: Orientation Triage & Box */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600">Niveau de Priorité Triage</label>
              <select
                value={triageLevel}
                onChange={(e) => setTriageLevel(e.target.value as any)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
              >
                <option value="normal">Normal (CCMU 3 - Soins stables)</option>
                <option value="urgent">Urgent (CCMU 2 - Urgence relative)</option>
                <option value="critique">Critique (CCMU 1 - Détresse vitale)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600">Box d'Examen Assigné</label>
              <select
                value={boxAssigned}
                onChange={(e) => setBoxAssigned(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
              >
                <option value="Box Triage A">Box Triage A</option>
                <option value="Box Triage B">Box Triage B</option>
                <option value="Box Déchoquage">Box Déchoquage (Urgences)</option>
                <option value="Salle d'Attente Médecin">Salle d'Attente Médecin</option>
                <option value="Salle d'Isolement">Salle d'Isolement</option>
              </select>
            </div>
          </div>

          {/* Observations */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-600">Observations & Transmissions Infirmières</label>
            <textarea
              rows={2}
              placeholder="Signes d'alerte, faciès, conscience, motricité, sueurs, etc."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold rounded-lg text-xs transition"
          >
            Fermer
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              disabled={saving}
              onClick={() => handleSubmit(false)}
              className="w-full sm:w-auto px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-bold rounded-lg text-xs transition"
            >
              Enregistrer (Sans transférer)
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={() => handleSubmit(true)}
              className="w-full sm:w-auto px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs transition flex items-center justify-center gap-2"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Valider & Transférer Médecin</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// 2. MODAL REQUALIFICATION & TRIAGE CCMU
// -------------------------------------------------------------

export interface TriageModalProps {
  consultation: MedicalConsultation | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export const TriageModal: React.FC<TriageModalProps> = ({
  consultation,
  isOpen,
  onClose,
  onSaved,
}) => {
  const [triageLevel, setTriageLevel] = useState<string>('normal');
  const [priority, setPriority] = useState<string>('normal');
  const [boxAssigned, setBoxAssigned] = useState<string>('Box Triage A');
  const [complaint, setComplaint] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [orientDoctor, setOrientDoctor] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && consultation) {
      setTriageLevel(consultation.vitals?.triage_level || 'normal');
      setPriority(consultation.priority || 'normal');
      setBoxAssigned(consultation.box_assigned || 'Box Triage A');
      setComplaint(consultation.chief_complaint || '');
      setNotes(consultation.vitals?.vitals_notes || '');
    }
  }, [isOpen, consultation]);

  if (!isOpen || !consultation) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/consultations/${consultation.id}/triage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          triage_level: triageLevel,
          priority,
          box_assigned: boxAssigned,
          chief_complaint: complaint,
          vitals_notes: notes,
          orient_to_doctor: orientDoctor,
        }),
      });
      if (res.ok) {
        onSaved();
        onClose();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in duration-150">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-slate-700" />
              Requalification & Attribution Box Triage
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {consultation.patient_name} • {consultation.patient_ndm || `NDM-${consultation.partner_id}`}
            </p>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs">
          {/* Subtle Directive Bar */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 flex items-center justify-between text-[11px] text-slate-600">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-slate-400"></span>
              <span className="font-bold text-slate-800 uppercase tracking-wider">Directive Triage :</span>
              <span>Classez le degré d'urgence CCMU et orientez le patient vers le box médical adéquat.</span>
            </div>
            <span className="font-semibold text-slate-500">Étape 2/2</span>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-600">Classification CCMU</label>
            <select
              value={priority}
              onChange={(e) => {
                setPriority(e.target.value);
                if (e.target.value === 'critique') setTriageLevel('critique');
                else if (e.target.value === 'urgent') setTriageLevel('urgent');
                else setTriageLevel('normal');
              }}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900"
            >
              <option value="normal">CCMU 3 : Soins stables / Consultation programmée</option>
              <option value="urgent">CCMU 2 : Urgence relative / Prise en charge rapide (&lt; 30 min)</option>
              <option value="critique">CCMU 1 : Détresse vitale / Déchoquage immédiat</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-600">Attribution Box / Salle</label>
            <select
              value={boxAssigned}
              onChange={(e) => setBoxAssigned(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900"
            >
              <option value="Box Triage A">Box Triage A</option>
              <option value="Box Triage B">Box Triage B</option>
              <option value="Box Déchoquage">Box Déchoquage (Urgences)</option>
              <option value="Salle d'Attente Médecin">Salle d'Attente Médecin</option>
              <option value="Salle d'Isolement">Salle d'Isolement</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-600">Motif d'arrivée & Signes d'alerte</label>
            <input
              type="text"
              value={complaint}
              onChange={(e) => setComplaint(e.target.value)}
              placeholder="Ex: Douleur thoracique irradiant, céphalées aiguës..."
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-600">Observations cliniques</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="État de conscience, pupilles, sueurs, nausées..."
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={orientDoctor}
              onChange={(e) => setOrientDoctor(e.target.checked)}
              className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
            />
            <span className="text-xs font-semibold text-slate-700">
              Transférer immédiatement en salle d'attente consultation médecin
            </span>
          </label>
        </div>

        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100"
          >
            Annuler
          </button>
          <button
            disabled={saving}
            onClick={handleSave}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition"
          >
            Enregistrer Requalification
          </button>
        </div>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// 3. MODAL IMPRESSION ORDONNANCE SÉCURISÉE MÉDECIN
// -------------------------------------------------------------

export interface PrescriptionModalProps {
  consultation: MedicalConsultation | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
  company?: CompanySettings;
  currentUser?: ResUser | null;
}

export const PrescriptionModal: React.FC<PrescriptionModalProps> = ({
  consultation,
  isOpen,
  onClose,
  onSaved,
  company,
  currentUser,
}) => {
  const [activeTab, setActiveTab] = useState<'edit' | 'print'>('edit');
  const [items, setItems] = useState<any[]>([]);
  const [catalogProducts, setCatalogProducts] = useState<any[]>([]);

  // Role detection for Infirmier vs Medecin
  const roleLower = (currentUser?.role || '').toLowerCase();
  const isInfirmier = roleLower.includes('infirm') || (consultation ? consultation.doctor_type === 'triage' : false);
  const isSpecialiste = roleLower.includes('spécialiste') || roleLower.includes('specialiste');

  const rawDoctorName = consultation?.doctor_name;
  const isGenericName = !rawDoctorName || rawDoctorName === 'Médecin' || rawDoctorName === 'Praticien';
  const resolvedName = isGenericName
    ? (currentUser?.name || (isInfirmier ? 'Infirmier Soignant' : 'Médecin'))
    : rawDoctorName;

  const practitionerPrefix = isInfirmier ? 'Inf.' : 'Dr.';
  const practitionerTitle = resolvedName.startsWith('Inf.') || resolvedName.startsWith('Dr.')
    ? resolvedName
    : `${practitionerPrefix} ${resolvedName}`;

  const practitionerRoleLabel = isInfirmier
    ? 'Infirmier Soignant'
    : isSpecialiste
    ? `Médecin Spécialiste${consultation?.specialty ? ` • ${consultation.specialty}` : ''}`
    : `Médecin Généraliste${consultation?.specialty ? ` • ${consultation.specialty}` : ''}`;

  // Form states for adding medication / item
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [customName, setCustomName] = useState<string>('');
  const [dosage, setDosage] = useState<string>('');
  const [instructions, setInstructions] = useState<string>('');
  const [duration, setDuration] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [itemType, setItemType] = useState<'medication' | 'lab_exam' | 'imaging' | 'care'>('medication');
  const [patientAgreed, setPatientAgreed] = useState<boolean>(true);
  const [medicalNotes, setMedicalNotes] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const printOrdonnanceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && consultation) {
      setItems(consultation.prescribed_items || []);
      setMedicalNotes(consultation.medical_notes || '');
      setActiveTab((consultation.prescribed_items || []).length > 0 ? 'print' : 'edit');
      fetch('/api/products')
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) setCatalogProducts(data);
        })
        .catch((e) => console.error('Failed to load products catalog:', e));
    }
  }, [isOpen, consultation]);

  if (!isOpen || !consultation) return null;

  const handleSelectCatalogProduct = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedProductId(val);
    if (!val) {
      setCustomName('');
      return;
    }
    const found = catalogProducts.find((p) => String(p.id) === val);
    if (found) {
      setCustomName(found.name);
      if (found.category_type === 'lab_exam' || found.lab_department) {
        setItemType('lab_exam');
      } else {
        setItemType('medication');
      }
    }
  };

  const handleAddItem = () => {
    if (!customName.trim()) {
      setFeedback('Veuillez saisir le nom du médicament ou de l\'examen.');
      return;
    }
    const selectedProd = catalogProducts.find((p) => String(p.id) === selectedProductId);
    const newItem = {
      id: `presc-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      product_id: selectedProd ? selectedProd.id : null,
      name: customName.trim(),
      dosage: dosage.trim() || 'Selon prescription',
      instructions: instructions.trim() || '',
      duration: duration.trim() || 'Selon avis médical',
      quantity: quantity || 1,
      price_unit: selectedProd ? selectedProd.list_price : 0,
      type: itemType,
      item_type: itemType,
      workflow_status: 'confirmed',
    };

    setItems([...items, newItem]);
    setSelectedProductId('');
    setCustomName('');
    setDosage('');
    setInstructions('');
    setDuration('');
    setQuantity(1);
    setFeedback(null);
  };

  const handleRemoveItem = (index: number) => {
    const next = [...items];
    next.splice(index, 1);
    setItems(next);
  };

  const handleSavePrescription = async () => {
    setSaving(true);
    setFeedback(null);
    try {
      const updateRes = await fetch(`/api/consultations/${consultation.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'completed',
          prescribed_items: items,
          medical_notes: medicalNotes,
          doctor_name: currentUser?.name || consultation.doctor_name || 'Infirmier / Praticien Soignant',
        }),
      });

      if (!updateRes.ok) throw new Error('Échec de la sauvegarde des prescriptions.');

      if (items.length > 0) {
        await fetch(`/api/consultations/${consultation.id}/confirm-prescriptions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            confirmedItems: items,
            patient_agreed: patientAgreed,
            prescription_notes: medicalNotes,
            circuit_mode: patientAgreed ? 'internal' : 'external',
          }),
        });
      }

      setFeedback(
        patientAgreed
          ? 'Prescription validée ! Transmise à la Facturation & Caisse.'
          : 'Prescription enregistrée en mode Ordonnance Externe.'
      );

      if (onSaved) await onSaved();
      setTimeout(() => {
        setActiveTab('print');
      }, 600);
    } catch (err: any) {
      setFeedback(err.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const meds = items.filter((i) => i.type === 'medication' || !i.type || i.item_type === 'medication');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-white text-slate-900">
          <div>
            <h2 className="text-base font-black flex items-center gap-2 text-slate-900">
              <FileText className="w-5 h-5 text-teal-600" />
              Prescription Médicale &amp; Ordonnance
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Patient : <strong className="text-slate-900">{consultation.patient_name}</strong> ({consultation.patient_ndm || `NDM-${consultation.partner_id}`}) • Réf : {consultation.consultation_number}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab(activeTab === 'edit' ? 'print' : 'edit')}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-teal-800 rounded-lg text-xs font-bold transition flex items-center gap-1.5 border border-slate-300"
            >
              {activeTab === 'edit' ? (
                <>
                  <Printer className="w-3.5 h-3.5" />
                  <span>Voir Aperçu / Imprimer</span>
                </>
              ) : (
                <>
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Saisir / Modifier Médicaments</span>
                </>
              )}
            </button>
            <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6">
          <button
            onClick={() => setActiveTab('edit')}
            className={`py-2.5 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'edit'
                ? 'border-slate-900 text-slate-900 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Saisie & Modification Médicaments</span>
            <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-slate-200 text-slate-800 font-bold">
              {items.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('print')}
            className={`py-2.5 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'print'
                ? 'border-slate-900 text-slate-900 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Aperçu Ordonnance Imprimable</span>
          </button>
        </div>

        {/* Tab 1: Saisie & Modification */}
        {activeTab === 'edit' && (
          <div className="p-6 overflow-y-auto space-y-5 text-xs">
            {feedback && (
              <div
                className={`p-3 rounded-lg text-xs font-semibold flex items-center gap-2 ${
                  feedback.includes('validée') || feedback.includes('enregistrée')
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{feedback}</span>
              </div>
            )}

            {/* Form Box */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-teal-600" />
                  Ajouter un Médicament ou Traitement
                </h3>
                <span className="text-[10px] text-slate-500">
                  Sélectionnez dans le catalogue ou saisissez un nom personnalisé
                </span>
              </div>

              {/* Selector vs Custom Input */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700">
                    Sélectionner dans la base de données (Facultatif)
                  </label>
                  <select
                    value={selectedProductId}
                    onChange={handleSelectCatalogProduct}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-slate-900"
                  >
                    <option value="">-- Parcourir la base de médicaments --</option>
                    {catalogProducts.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} {p.list_price ? `(${p.list_price} FCFA)` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700">
                    Saisie Libre Médicament / Produit (Ex: Paracétamol 1000mg) *
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Paracétamol 1000mg, Amoxicilline 500mg, Sérum Physio..."
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600">Dosage / Conditionnement</label>
                  <input
                    type="text"
                    placeholder="Ex: 1 boîte / 1000mg"
                    value={dosage}
                    onChange={(e) => setDosage(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600">Posologie & Consignes</label>
                  <input
                    type="text"
                    placeholder="Ex: 1 comp 3x/jour après repas"
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600">Durée du traitement</label>
                  <input
                    type="text"
                    placeholder="Ex: 5 jours, 7 jours..."
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600">Quantité</label>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 font-bold"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs transition flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Ajouter à l'Ordonnance</span>
                </button>
              </div>
            </div>

            {/* Current Items List */}
            <div className="space-y-2">
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                Éléments prescrits pour cette consultation ({items.length})
              </h4>

              {items.length === 0 ? (
                <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-xl text-slate-400">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="font-medium">Aucune prescription saisie.</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Utilisez le formulaire ci-dessus pour sélectionner ou saisir des médicaments (ex: Paracétamol 1000mg 1 boîte).
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
                  {items.map((it, idx) => (
                    <div key={idx} className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition">
                      <div className="space-y-0.5">
                        <div className="font-bold text-slate-900 text-xs flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-mono text-[10px] font-bold">
                            {idx + 1}
                          </span>
                          <span>{it.name}</span>
                          {it.dosage && (
                            <span className="text-slate-500 font-normal">({it.dosage})</span>
                          )}
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-mono font-bold">
                            Qté: {it.quantity || 1}
                          </span>
                        </div>
                        {it.instructions && (
                          <p className="text-[11px] text-slate-600 pl-7 italic">
                            Posologie : {it.instructions}
                          </p>
                        )}
                        {it.duration && (
                          <p className="text-[10px] text-slate-400 pl-7">
                            Durée : {it.duration}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition"
                        title="Supprimer cet élément"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Circuit Accord Patient */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <label className="text-xs font-bold text-slate-800 block">
                Accord du patient pour les prestations & médicaments
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPatientAgreed(true)}
                  className={`p-3 rounded-lg border text-left transition flex items-center gap-3 ${
                    patientAgreed
                      ? 'border-emerald-600 bg-emerald-50/50 text-emerald-900 ring-1 ring-emerald-600'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${patientAgreed ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300'}`}>
                    {patientAgreed && <CheckCircle2 className="w-3 h-3" />}
                  </div>
                  <div>
                    <span className="font-bold text-xs block">Accord Patient (Circuit Interne)</span>
                    <span className="text-[10px] text-slate-500 block">Envoie automatiquement la prescription à la Caisse / Facturation</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPatientAgreed(false)}
                  className={`p-3 rounded-lg border text-left transition flex items-center gap-3 ${
                    !patientAgreed
                      ? 'border-purple-600 bg-purple-50/50 text-purple-900 ring-1 ring-purple-600'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${!patientAgreed ? 'border-purple-600 bg-purple-600 text-white' : 'border-slate-300'}`}>
                    {!patientAgreed && <CheckCircle2 className="w-3 h-3" />}
                  </div>
                  <div>
                    <span className="font-bold text-xs block">Désaccord / Ordonnance Externe</span>
                    <span className="text-[10px] text-slate-500 block">Le patient achète à l'extérieur. Impression du bulletin externe</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Medical Notes */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600">Conseils hygiéno-diététiques / Recommandations</label>
              <textarea
                rows={2}
                placeholder="Conseils de prise, repos, hydratation..."
                value={medicalNotes}
                onChange={(e) => setMedicalNotes(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>
        )}

        {/* Tab 2: Aperçu & Impression Ordonnance */}
        {activeTab === 'print' && (() => {
          const displayMeds = items.length > 0 ? items : (consultation.prescribed_items || []);
          return (
            <div ref={printOrdonnanceRef} className="printable-area p-8 overflow-y-auto bg-white text-slate-900 font-sans space-y-6">
              <div className="border-b-2 border-slate-900 pb-4 flex items-center justify-between font-sans">
                <div>
                  <h1 className="text-lg font-black tracking-tight uppercase text-slate-900">
                    {company?.name || 'HÔPITAL NATIONAL DE BIOLOGIE & CLINIQUE'}
                  </h1>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {isInfirmier ? 'Service de Soins Infirmiers & Consultation' : 'Service de Médecine Générale & Spécialisée'} • Tél : {company?.phone || '+225 27 22 00 00 00'}
                  </p>
                </div>
                <div className="text-right text-xs">
                  <div className="font-bold text-slate-900 text-sm">
                    {practitionerTitle}
                  </div>
                  <div className="text-purple-700 font-bold text-[11px]">
                    {practitionerRoleLabel}
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl font-sans text-xs flex flex-wrap justify-between items-center gap-4 border border-slate-200">
                <div>
                  <span className="text-slate-500 font-medium">Patient : </span>
                  <strong className="text-slate-900 text-sm">{consultation.patient_name}</strong>
                  <span className="ml-2 font-mono text-slate-500">({consultation.patient_ndm || `NDM-${consultation.partner_id}`})</span>
                </div>
                <div>
                  <span className="text-slate-500">Âge : </span>
                  <strong>{consultation.patient_age || '--'} ans</strong>
                  <span className="mx-2">•</span>
                  <span className="text-slate-500">Sexe : </span>
                  <strong>{consultation.patient_gender === 'M' ? 'M' : 'F'}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Date : </span>
                  <strong>{new Date(consultation.consultation_date).toLocaleDateString('fr-FR')}</strong>
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <div className="text-3xl font-bold font-sans italic text-slate-800">℞</div>

                {displayMeds.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 font-sans text-xs italic bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    Aucun médicament ou soin saisi pour cette consultation. Cliquez sur &quot;Saisir / Modifier Médicaments&quot; ci-dessus pour ajouter vos prescriptions.
                  </div>
                ) : (
                  <div className="space-y-4 pl-4 font-sans text-xs">
                    {displayMeds.map((m, idx) => (
                      <div key={idx} className="border-b border-slate-100 pb-3">
                        <div className="font-bold text-sm text-slate-900">
                          {idx + 1}. {m.name} {m.dosage ? `(${m.dosage})` : ''}
                        </div>
                        {m.instructions && (
                          <div className="text-slate-700 mt-1 pl-4 italic">
                            Posologie : {m.instructions}
                          </div>
                        )}
                        {m.duration && (
                          <div className="text-slate-500 text-[11px] mt-0.5 pl-4">
                            Durée : {m.duration}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {medicalNotes && (
                <div className="pt-4 border-t border-slate-200 font-sans text-xs text-slate-600">
                  <span className="font-bold text-slate-800">Conseils hygiéno-diététiques : </span>
                  <span>{medicalNotes}</span>
                </div>
              )}

              <div className="pt-10 flex justify-end font-sans text-xs">
                <div className="text-center w-60 border-t border-slate-400 pt-2">
                  <p className="text-[11px] text-slate-500 mb-8">
                    Cachet &amp; Signature de l&apos;{isInfirmier ? 'Infirmier' : 'Médecin'}
                  </p>
                  <p className="font-bold text-slate-900 text-xs">
                    {practitionerTitle}
                  </p>
                  <p className="text-[10px] text-slate-500">{practitionerRoleLabel}</p>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
          >
            Fermer
          </button>

          <div className="flex items-center gap-2">
            {activeTab === 'print' ? (
              <button
                type="button"
                onClick={() => {
                  if (printOrdonnanceRef.current) {
                    printElement(
                      printOrdonnanceRef.current,
                      `Ordonnance_${consultation.patient_name || 'Patient'}`
                    );
                  }
                }}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs transition flex items-center gap-2 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimer l'Ordonnance</span>
              </button>
            ) : (
              <button
                type="button"
                disabled={saving}
                onClick={handleSavePrescription}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs transition flex items-center gap-2 shadow-sm"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
                <span>{saving ? 'Enregistrement...' : 'Valider & Enregistrer l\'Ordonnance'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// 4. MODAL RÉFÉRENCE / ORIENTATION PATIENT (Infirmier -> Médecin -> Spécialiste)
// -------------------------------------------------------------

export interface ReferralModalProps {
  consultation: MedicalConsultation | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  currentUser: ResUser | null;
}

export const ReferralModal: React.FC<ReferralModalProps> = ({
  consultation,
  isOpen,
  onClose,
  onSaved,
  currentUser,
}) => {
  const currentRole = (currentUser?.role || '').toLowerCase();
  const isInfirmier = currentRole.includes('infirm') || (consultation ? consultation.doctor_type === 'triage' : false);

  const [targetLevel, setTargetLevel] = useState<'medecin' | 'specialiste'>('medecin');
  const [specialty, setSpecialty] = useState<string>('Cardiologie');
  const [targetDoctorName, setTargetDoctorName] = useState<string>('');
  const [availableDoctors, setAvailableDoctors] = useState<any[]>([]);
  const [reason, setReason] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [priority, setPriority] = useState<'normal' | 'urgent' | 'critical'>('urgent');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && consultation) {
      const role = (currentUser?.role || '').toLowerCase();
      const inf = role.includes('infirm') || consultation.doctor_type === 'triage';
      setTargetLevel(inf ? 'medecin' : 'specialiste');
      setTargetDoctorName('');
      setFeedback(null);

      fetch('/api/users')
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            const docs = data.filter((u: any) => {
              const r = (u.role || '').toLowerCase();
              return (
                r.includes('medecin') ||
                r.includes('médecin') ||
                r.includes('specialiste') ||
                r.includes('spécialiste') ||
                r.includes('docteur') ||
                r.includes('doctor')
              );
            });
            setAvailableDoctors(docs);
          }
        })
        .catch((e) => console.error('Error fetching doctors:', e));
    }
  }, [isOpen, consultation, currentUser]);

  if (!isOpen || !consultation) return null;

  const specialtiesList = [
    'Cardiologie',
    'Pédiatrie',
    'Gynécologie & Obstétrique',
    'Chirurgie Générale',
    'Pneumologie',
    'Neurologie',
    'Dermatologie',
    'Ophtalmologie',
    'Orthopédie & Traumatologie',
    'Gastro-Entérologie',
    'Urgences & Réanimation'
  ];

  const handleReferralSubmit = async () => {
    setSubmitting(true);
    setFeedback(null);

    try {
      const res = await fetch(`/api/consultations/${consultation.id}/referral`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_level: targetLevel,
          target_specialty: targetLevel === 'specialiste' ? specialty : 'Médecine Générale',
          target_doctor_name: targetDoctorName || undefined,
          referral_reason: reason || 'Orientation suite à évaluation clinique',
          referral_notes: notes,
          priority,
          referred_by_role: isInfirmier ? 'infirmier' : 'medecin',
          referred_by_name: currentUser?.name || 'Soignant Référent'
        })
      });

      if (!res.ok) throw new Error('Échec du transfert du patient');

      setFeedback(`Patient transféré avec succès vers : ${targetLevel === 'specialiste' ? `Médecin Spécialiste (${specialty})` : 'Médecin Généraliste'}`);
      setTimeout(() => {
        onSaved();
        onClose();
      }, 800);
    } catch (err: any) {
      setFeedback(err.message || 'Erreur réseau');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in duration-150">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-white text-slate-900">
          <div className="flex items-center space-x-2">
            <Send className="w-5 h-5 text-teal-600" />
            <div>
              <h2 className="text-sm font-bold tracking-tight text-slate-900">Transfert &amp; Orientation Clinique</h2>
              <p className="text-[10px] text-slate-500">Référer le patient au niveau de compétence supérieur</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs">
          {feedback && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg font-semibold flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{feedback}</span>
            </div>
          )}

          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex justify-between items-center">
            <div>
              <span className="font-bold text-slate-900 text-xs block">{consultation.patient_name}</span>
              <span className="text-[10px] text-slate-500 font-mono">NDM: {consultation.patient_ndm} • {consultation.patient_age} ans ({consultation.patient_gender})</span>
            </div>
            <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-extrabold uppercase">
              Étape actuelle : {consultation.doctor_type || 'Triage'}
            </span>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
              Niveau d'orientation Cible *
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTargetLevel('medecin')}
                className={`py-2.5 px-3 rounded-lg border text-xs font-bold transition-all text-center flex flex-col items-center justify-center ${
                  targetLevel === 'medecin'
                    ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>Médecin Généraliste</span>
                <span className="text-[9px] font-normal opacity-80 mt-0.5">Premier recours médical</span>
              </button>
              <button
                type="button"
                onClick={() => setTargetLevel('specialiste')}
                className={`py-2.5 px-3 rounded-lg border text-xs font-bold transition-all text-center flex flex-col items-center justify-center ${
                  targetLevel === 'specialiste'
                    ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>Médecin Spécialiste</span>
                <span className="text-[9px] font-normal opacity-80 mt-0.5">Consultation spécialisée</span>
              </button>
            </div>
          </div>

          {targetLevel === 'specialiste' && (
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-700">Discipline / Spécialité Médicale *</label>
              <select
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900"
              >
                {specialtiesList.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-slate-700">Praticien Cible (Nom &amp; Fonction)</label>
            <select
              value={targetDoctorName}
              onChange={(e) => setTargetDoctorName(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900"
            >
              <option value="">
                -- Premier Médecin Disponible ({targetLevel === 'specialiste' ? specialty : 'Médecine Générale'}) --
              </option>
              {availableDoctors.map((doc) => (
                <option key={doc.id} value={doc.name}>
                  {doc.name.startsWith('Dr.') ? doc.name : `Dr. ${doc.name}`} — {doc.role || 'Médecin'} {doc.department ? `(${doc.department})` : ''}
                </option>
              ))}
              {/* Common default doctors fallback */}
              <option value="Dr. Ibrahim Traoré">Dr. Ibrahim Traoré — Médecin Généraliste</option>
              <option value="Dr. Aboubacar Touré">Dr. Aboubacar Touré — Cardiologue Spécialiste</option>
              <option value="Dr. Aminata Diallo">Dr. Aminata Diallo — Pédiatre Spécialiste</option>
            </select>
            <p className="text-[10px] text-slate-500 italic">
              Permet d&apos;orienter le patient vers un médecin spécifique ou l&apos;équipe de garde.
            </p>
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-slate-700">Degré d'Urgence du Transfert</label>
            <select
              value={priority}
              onChange={(e: any) => setPriority(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900"
            >
              <option value="normal">Normal (File d'attente courante)</option>
              <option value="urgent">Urgent (Prioritaire - Prise en charge rapide)</option>
              <option value="critical">Critique / Déchoquage (Prise en charge immédiate)</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-slate-700">Motif du Transfert / Dépassement de compétence *</label>
            <input
              type="text"
              required
              placeholder="ex: Suspicions de souffrance coronaire, avis cardiologique requis"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 font-semibold"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-slate-700">Résumé des Observations Cliniques &amp; Antécédents</label>
            <textarea
              rows={3}
              placeholder="Constantes relevées, traitements administrés, examens déjà réalisés..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900"
            />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100"
          >
            Annuler
          </button>
          <button
            disabled={submitting}
            onClick={handleReferralSubmit}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition flex items-center space-x-1.5 shadow-sm"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{submitting ? 'Transfert en cours...' : 'Confirmer & Transférer Patient'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// 5. MODAL IMPRESSION BULLETIN / ORDONNANCE EXTERNE (Non réalisé à l'hôpital)
// -------------------------------------------------------------

export interface ExternalPrescriptionModalProps {
  consultation: MedicalConsultation | null;
  items: any[];
  notes?: string;
  isOpen: boolean;
  onClose: () => void;
  company?: CompanySettings;
  currentUser?: ResUser | null;
}

export const ExternalPrescriptionModal: React.FC<ExternalPrescriptionModalProps> = ({
  consultation,
  items,
  notes,
  isOpen,
  onClose,
  company,
  currentUser,
}) => {
  if (!isOpen || !consultation) return null;

  const roleLower = (currentUser?.role || '').toLowerCase();
  const isInfirmier = roleLower.includes('infirm') || (consultation ? consultation.doctor_type === 'triage' : false);
  const isSpecialiste = roleLower.includes('spécialiste') || roleLower.includes('specialiste');

  const rawDoctorName = consultation?.doctor_name;
  const isGenericName = !rawDoctorName || rawDoctorName === 'Médecin' || rawDoctorName === 'Praticien';
  const resolvedName = isGenericName
    ? (currentUser?.name || (isInfirmier ? 'Infirmier Soignant' : 'Médecin'))
    : rawDoctorName;

  const practitionerPrefix = isInfirmier ? 'Inf.' : 'Dr.';
  const practitionerTitle = resolvedName.startsWith('Inf.') || resolvedName.startsWith('Dr.')
    ? resolvedName
    : `${practitionerPrefix} ${resolvedName}`;

  const practitionerRoleLabel = isInfirmier
    ? 'Infirmier Soignant'
    : isSpecialiste
    ? `Médecin Spécialiste${consultation?.specialty ? ` • ${consultation.specialty}` : ''}`
    : `Médecin Généraliste${consultation?.specialty ? ` • ${consultation.specialty}` : ''}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in duration-150">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-white text-slate-900">
          <div>
            <h2 className="text-base font-bold flex items-center gap-2 text-slate-900">
              <Printer className="w-5 h-5 text-slate-600" />
              Bulletin d&apos;Examen &amp; Ordonnance Externe
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Circuit Externe (Délivrance et exécution en ville)
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => printDocumentById('external-prescription-printable-area', `Prescription_${consultation.patient_name.replace(/\s+/g, '_')}`)}
              className="px-3 py-1.5 bg-slate-900 text-white hover:bg-slate-800 rounded-md text-xs font-semibold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-slate-200" />
              <span>Imprimer le document</span>
            </button>
            <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Body */}
        <div id="external-prescription-printable-area" className="printable-area p-8 overflow-y-auto bg-white text-slate-900 font-sans space-y-6">
          <div className="border-b-2 border-slate-900 pb-4 flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold tracking-tight uppercase text-slate-900">
                {company?.name || 'HÔPITAL NATIONAL DE BIOLOGIE & CLINIQUE'}
              </h1>
              <p className="text-xs text-slate-600 mt-0.5">
                Prescription médicale officielle pour exécution en ville
              </p>
            </div>
            <div className="text-right text-xs">
              <div className="font-bold text-slate-900">{practitionerTitle}</div>
              <div className="text-slate-600 font-semibold text-[11px]">{practitionerRoleLabel}</div>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-lg text-xs flex flex-wrap justify-between items-center gap-4 border border-slate-200">
            <div>
              <span className="text-slate-500 font-medium">Patient : </span>
              <strong className="text-slate-900 text-sm">{consultation.patient_name}</strong>
              <span className="ml-2 font-mono text-slate-500">({consultation.patient_ndm})</span>
            </div>
            <div>
              <span className="text-slate-500">Âge : </span>
              <strong>{consultation.patient_age || '--'} ans</strong>
              <span className="mx-2">•</span>
              <span className="text-slate-500">Sexe : </span>
              <strong>{consultation.patient_gender}</strong>
            </div>
            <div>
              <span className="text-slate-500">Date d&apos;émission : </span>
              <strong>{new Date().toLocaleDateString('fr-FR')}</strong>
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 italic">
            <strong>Mention Légale :</strong> Ce document autorise le patient à effectuer les examens complémentaires ou à se procurer les médicaments prescrits ci-dessous dans l&apos;établissement de son choix.
          </div>

          <div className="space-y-4 pt-2">
            <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wide border-b pb-1">
              Prescriptions &amp; Demandes d&apos;Examens Extérieurs
            </h3>

            {items.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-4">Aucune prescription externe enregistrée.</p>
            ) : (
              <div className="space-y-3 text-xs">
                {items.map((item, idx) => (
                  <div key={idx} className="p-3 border border-slate-200 rounded-lg flex justify-between items-center">
                    <div>
                      <div className="font-bold text-slate-900 text-xs">
                        {idx + 1}. {item.name}
                      </div>
                      {item.instructions && (
                        <div className="text-slate-600 mt-0.5 italic">Consignes / Posologie : {item.instructions}</div>
                      )}
                    </div>
                    <span className="text-[10px] bg-slate-100 font-extrabold uppercase px-2 py-0.5 rounded text-slate-700">
                      {item.item_type || item.type || 'Examen'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {notes && (
            <div className="pt-2 text-xs text-slate-600">
              <span className="font-bold text-slate-800">Remarques cliniques : </span>
              <span>{notes}</span>
            </div>
          )}

          <div className="pt-10 flex justify-end text-xs">
            <div className="text-center w-56 border-t border-slate-400 pt-2">
              <p className="text-[11px] text-slate-500 mb-8">Cachet &amp; Signature du Praticien</p>
              <p className="font-bold text-slate-900">{consultation.doctor_name}</p>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

