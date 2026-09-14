import React, { useState } from 'react';
import {
  UserCheck,
  Plus,
  Shield,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  Edit2,
  Trash2,
  X,
  KeyRound,
  Users2,
  AlertTriangle,
  Microscope,
  Stethoscope,
  Briefcase,
  Building,
  Check,
} from 'lucide-react';
import { ResUser, ResGroup, ResPartner } from '../types';

interface UsersViewProps {
  users: ResUser[];
  groups: ResGroup[];
  partners: ResPartner[];
  onSaveUser: (userData: any) => Promise<void>;
  onDeleteUser?: (id: number) => Promise<void>;
  onSaveGroup: (groupData: any) => Promise<void>;
  onDeleteGroup: (id: number) => Promise<void>;
}

export const EXHAUSTIVE_PERMISSIONS = [
  { key: 'can_manage_invoices', label: 'Facturation & Ordonnances', description: 'Création et modification des factures et dossiers patients' },
  { key: 'can_validate_invoices', label: 'Validation Comptable', description: 'Comptabilisation et verrouillage des pièces au Grand Livre' },
  { key: 'can_delete_invoices', label: 'Suppression Factures', description: 'Autorisation de supprimer des brouillons et écritures non validées' },
  { key: 'can_register_payments', label: 'Encaissement Caisse', description: 'Enregistrement des paiements espèces, cartes, mobile money & tiers' },
  { key: 'can_manage_partners', label: 'Répertoire Patients & Mutuelles', description: 'Gestion des fiches patients, entreprises et organismes d assurance' },
  { key: 'can_manage_lab_catalog', label: 'Catalogue Analyses & Profils', description: 'Configuration des examens, bilans, tarifs et valeurs de référence' },
  { key: 'can_validate_medical', label: 'Validation Biologique Officielle', description: 'Signature biologique et libération médicale des résultats' },
  { key: 'can_enter_results', label: 'Saisie Technique Paillasse', description: 'Saisie des résultats d analyses par les techniciens de labo' },
  { key: 'can_view_financials', label: 'Rapports & Grand Livre', description: 'Accès aux déclarations de TVA, clôture de caisse et audit financier' },
  { key: 'can_manage_settings', label: 'Branding & Paramètres Labo', description: 'Modification du logo, coordonnées, banque et mentions légales' },
  { key: 'can_manage_users', label: 'Gestion des Utilisateurs & Droits', description: 'Création des comptes, attribution des rôles et des habilitations' },
];

export const ALL_NAVIGATION_MENUS = [
  { id: 'dashboard', label: 'Tableau de Bord & Analyses', category: 'PILOTAGE & STRATÉGIE' },
  { id: 'caisse_sessions', label: 'Sessions Caisse & Guichets', category: 'FACTURATION & CAISSE' },
  { id: 'invoices', label: 'Factures & Actes', category: 'FACTURATION & CAISSE' },
  { id: 'payments', label: 'Règlements & Encaissements', category: 'FACTURATION & CAISSE' },
  { id: 'partners', label: 'Patients & Prescripteurs', category: 'PATIENTS & PLATEAU TECHNIQUE' },
  { id: 'lab_results', label: 'Examens & Résultats', category: 'PATIENTS & PLATEAU TECHNIQUE' },
  { id: 'products', label: 'Catalogue des Analyses', category: 'PATIENTS & PLATEAU TECHNIQUE' },
  { id: 'users', label: 'Utilisateurs & Droits', category: 'ADMINISTRATION & SÉCURITÉ' },
  { id: 'company', label: 'Branding & Filigrane', category: 'ADMINISTRATION & SÉCURITÉ' },
  { id: 'flash_announcements', label: 'Annonces & Flash Info', category: 'ADMINISTRATION & SÉCURITÉ' },
  { id: 'notifications', label: 'Relances & Alertes', category: 'AUDIT & TRAÇABILITÉ' },
  { id: 'schema', label: 'Schéma & Architecture BD', category: 'ADMINISTRATION & SÉCURITÉ' },
];

export function getDefaultViewsForRole(roleName?: string | null): string[] {
  const r = (roleName || '').toLowerCase();
  if (r.includes('directeur') || r.includes('admin') || r === 'directeur général') {
    return ALL_NAVIGATION_MENUS.map(m => m.id);
  }
  if (r.includes('superviseur')) {
    return ['dashboard', 'caisse_sessions', 'invoices', 'payments', 'partners', 'flash_announcements'];
  }
  if (r.includes('facturier') || r.includes('facture')) {
    return ['caisse_sessions', 'invoices', 'partners'];
  }
  if (r.includes('caissier') || r.includes('caisse')) {
    return ['caisse_sessions', 'invoices', 'payments'];
  }
  if (r.includes('facture / caisse')) {
    return ['caisse_sessions', 'invoices', 'payments', 'partners'];
  }
  if (r === 'biologiste' || r.includes('biolog')) {
    return ['lab_results', 'products', 'partners', 'dashboard'];
  }
  if (r.includes('technicien')) {
    return ['lab_results', 'products', 'partners'];
  }
  if (r.includes('comptable')) {
    return ['dashboard', 'invoices', 'payments', 'partners'];
  }
  return ['dashboard', 'caisse_sessions', 'invoices', 'payments', 'partners'];
}

export const UsersView: React.FC<UsersViewProps> = ({
  users = [],
  groups = [],
  partners = [],
  onSaveUser,
  onDeleteUser,
  onSaveGroup,
  onDeleteGroup,
}) => {
  const [activeTab, setActiveTab] = useState<'users' | 'roles' | 'matrix'>('users');

  // User modal state
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<ResUser | null>(null);
  const [login, setLogin] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [role, setRole] = useState('Biologiste');
  const [department, setDepartment] = useState('Laboratoire Médical');
  const [partnerId, setPartnerId] = useState<number | null>(null);
  const [selectedGroupIds, setSelectedGroupIds] = useState<number[]>([1]);
  const [selectedUserPermissions, setSelectedUserPermissions] = useState<string[]>([]);
  const [selectedAllowedViews, setSelectedAllowedViews] = useState<string[]>([]);

  // Role modal state
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<ResGroup | null>(null);
  const [roleName, setRoleName] = useState('');
  const [roleDescription, setRoleDescription] = useState('');
  const [rolePermissions, setRolePermissions] = useState<string[]>([]);

  // Deletion state
  const [itemToDelete, setItemToDelete] = useState<{ type: 'user' | 'group'; id: number; name: string } | null>(null);

  const handleOpenCreateUserModal = () => {
    setEditingUser(null);
    setLogin('');
    setName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setPasswordError('');
    setRole('Facturier (Établissement Factures Seul)');
    setDepartment('Facturation');
    setPartnerId(partners[0]?.id || null);
    setSelectedGroupIds([2]);
    setSelectedUserPermissions(['can_manage_invoices', 'can_manage_partners']);
    setSelectedAllowedViews(getDefaultViewsForRole('Facturier (Établissement Factures Seul)'));
    setIsUserModalOpen(true);
  };

  const handleOpenEditUserModal = (u: ResUser) => {
    setEditingUser(u);
    setLogin(u.login);
    setName(u.name);
    setEmail(u.email || '');
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setPasswordError('');
    setRole(u.role || 'Facturier (Établissement Factures Seul)');
    setDepartment(u.department || 'Facturation');
    setPartnerId(u.partner_id);
    setSelectedGroupIds(u.group_ids || [2]);
    setSelectedUserPermissions(u.permissions || []);
    setSelectedAllowedViews(
      u.allowed_views && u.allowed_views.length > 0
        ? u.allowed_views
        : getDefaultViewsForRole(u.role || 'Facturier (Établissement Factures Seul)')
    );
    setIsUserModalOpen(true);
  };

  const toggleGroup = (groupId: number) => {
    const list = selectedGroupIds || [];
    if (list.includes(groupId)) {
      setSelectedGroupIds(list.filter((id) => id !== groupId));
    } else {
      setSelectedGroupIds([...list, groupId]);
    }
  };

  const toggleUserPermission = (permKey: string) => {
    const list = selectedUserPermissions || [];
    if (list.includes(permKey)) {
      setSelectedUserPermissions(list.filter((k) => k !== permKey));
    } else {
      setSelectedUserPermissions([...list, permKey]);
    }
  };

  const toggleAllowedView = (viewId: string) => {
    const list = selectedAllowedViews || [];
    if (list.includes(viewId)) {
      setSelectedAllowedViews(list.filter((v) => v !== viewId));
    } else {
      setSelectedAllowedViews([...list, viewId]);
    }
  };

  const handleRoleChange = (newRole: string) => {
    const safeRole = newRole || '';
    setRole(safeRole);
    setSelectedAllowedViews(getDefaultViewsForRole(safeRole));

    if (safeRole.includes("Superviseur") || safeRole === "Directeur Général") {
      setSelectedGroupIds([1]);
      setDepartment("Direction / Supervision");
      setSelectedUserPermissions([
        'can_manage_invoices',
        'can_validate_invoices',
        'can_delete_invoices',
        'can_register_payments',
        'can_manage_partners',
        'can_manage_lab_catalog',
        'can_validate_medical',
        'can_enter_results',
        'can_view_financials',
        'can_manage_settings',
        'can_manage_users',
      ]);
    } else if (safeRole.includes("Facturier") || safeRole === "Facture") {
      setSelectedGroupIds([2]);
      setDepartment("Facturation");
      setSelectedUserPermissions(['can_manage_invoices', 'can_manage_partners']);
    } else if (safeRole.includes("Caissier") || safeRole === "Caisse") {
      setSelectedGroupIds([3]);
      setDepartment("Caisse");
      setSelectedUserPermissions(['can_register_payments', 'can_manage_partners']);
    } else if (safeRole.includes("Facture / Caisse")) {
      setSelectedGroupIds([4]);
      setDepartment("Facturation & Caisse");
      setSelectedUserPermissions(['can_manage_invoices', 'can_register_payments', 'can_manage_partners']);
    } else if (safeRole === "Biologiste") {
      setSelectedGroupIds([5]);
      setDepartment("Laboratoire Médical");
      setSelectedUserPermissions(['can_manage_invoices', 'can_validate_medical', 'can_enter_results', 'can_manage_lab_catalog']);
    } else if (safeRole === "Technicien Supérieur Analyses Médicales") {
      setSelectedGroupIds([6]);
      setDepartment("Laboratoire Médical");
      setSelectedUserPermissions(['can_enter_results']);
    } else if (safeRole === "Comptable & Tiers-Payeur") {
      setSelectedGroupIds([7]);
      setDepartment("Comptabilité");
      setSelectedUserPermissions(['can_validate_invoices', 'can_register_payments', 'can_view_financials']);
    }
  };

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    if (!name.trim() || !login.trim()) return;

    // Validate password when creating or editing if typed
    if (!editingUser && !password.trim()) {
      setPasswordError('Veuillez renseigner un mot de passe pour le compte.');
      return;
    }

    if (password.trim() && password !== confirmPassword) {
      setPasswordError('Les deux mots de passe ne correspondent pas.');
      return;
    }

    const userDataToSend: any = {
      id: editingUser?.id,
      login: login.trim(),
      name: name.trim(),
      email: email.trim() || null,
      role: role.trim(),
      department: department.trim(),
      partner_id: partnerId,
      group_ids: selectedGroupIds,
      permissions: selectedUserPermissions,
      allowed_views: selectedAllowedViews,
    };

    if (password.trim()) {
      userDataToSend.password = password.trim();
      userDataToSend.password_hash = password.trim();
    }

    await onSaveUser(userDataToSend);
    setIsUserModalOpen(false);
  };

  const handleOpenCreateRoleModal = () => {
    setEditingGroup(null);
    setRoleName('');
    setRoleDescription('');
    setRolePermissions(['can_manage_invoices']);
    setIsRoleModalOpen(true);
  };

  const handleOpenEditRoleModal = (g: ResGroup) => {
    setEditingGroup(g);
    setRoleName(g.name);
    setRoleDescription(g.description || '');
    setRolePermissions(g.permissions || []);
    setIsRoleModalOpen(true);
  };

  const toggleRolePermission = (permKey: string) => {
    const list = rolePermissions || [];
    if (list.includes(permKey)) {
      setRolePermissions(list.filter((k) => k !== permKey));
    } else {
      setRolePermissions([...list, permKey]);
    }
  };

  const handleRoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleName.trim()) return;
    await onSaveGroup({
      id: editingGroup?.id,
      name: roleName.trim(),
      description: roleDescription.trim(),
      permissions: rolePermissions,
    });
    setIsRoleModalOpen(false);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    if (itemToDelete.type === 'user' && onDeleteUser) {
      await onDeleteUser(itemToDelete.id);
    } else if (itemToDelete.type === 'group' && onDeleteGroup) {
      await onDeleteGroup(itemToDelete.id);
    }
    setItemToDelete(null);
  };

  return (
    <div className="space-y-6 pb-12 max-w-full">
      {/* Header Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-base sm:text-lg font-black text-slate-900">
              Utilisateurs &amp; Droits d'Accès Exhaustifs
            </h2>
            <span className="bg-slate-100 text-slate-700 text-xs font-extrabold px-2.5 py-0.5 rounded-full">
              {users.length} comptes
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Gestion du personnel (Biologistes, Techniciens, Caissiers, Comptables) et matrice des habilitations de laboratoire.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {activeTab === 'users' ? (
            <button
              id="btn-create-user"
              onClick={handleOpenCreateUserModal}
              className="flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-md transition active:scale-95 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Créer un Utilisateur</span>
            </button>
          ) : (
            <button
              id="btn-create-role"
              onClick={handleOpenCreateRoleModal}
              className="flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-md transition active:scale-95 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Ajouter un Profil de Rôle</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition ${
            activeTab === 'users'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Comptes Utilisateurs ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('roles')}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition ${
            activeTab === 'roles'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Rôles &amp; Habilitations Métier ({groups.length})
        </button>
        <button
          onClick={() => setActiveTab('matrix')}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition ${
            activeTab === 'matrix'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Matrice Exhaustive des Permissions
        </button>
      </div>

      {/* TAB 1: USERS (Liste en Ligne) */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="w-full">
            <table className="w-full text-left text-xs border-collapse table-fixed">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-3 w-[26%]">Utilisateur</th>
                  <th className="py-3 px-2 w-[14%] font-mono">Identifiant</th>
                  <th className="py-3 px-2 w-[16%] hidden sm:table-cell">Fonction / Rôle</th>
                  <th className="py-3 px-2 w-[14%] hidden md:table-cell">Département</th>
                  <th className="py-3 px-2 w-[16%] hidden lg:table-cell">Groupes &amp; Profils</th>
                  <th className="py-3 px-2 w-[10%] text-center">Statut</th>
                  <th className="py-3 px-2 text-center w-[12%]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[...users].sort((a, b) => {
                  const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
                  const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
                  if (dateB !== dateA) return dateB - dateA;
                  return (b.id || 0) - (a.id || 0);
                }).map((u) => {
                  const userGroups = groups.filter((g) => (u.group_ids || []).includes(g.id));
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Name & Avatar */}
                      <td className="py-3 px-3 truncate">
                        <div className="flex items-center space-x-2.5 truncate">
                          <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                            {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div className="truncate">
                            <div className="font-extrabold text-slate-900 leading-tight truncate" title={u.name}>{u.name}</div>
                            <div className="text-[10px] text-slate-500 truncate">{u.email || 'Email non renseigné'}</div>
                          </div>
                        </div>
                      </td>

                      {/* Login */}
                      <td className="py-3 px-2 font-mono font-bold text-slate-700 truncate" title={u.login}>
                        {u.login}
                      </td>

                      {/* Role */}
                      <td className="py-3 px-2 hidden sm:table-cell truncate">
                        <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md text-[10px] truncate inline-block max-w-full" title={u.role}>
                          {u.role || 'Opérateur'}
                        </span>
                      </td>

                      {/* Department */}
                      <td className="py-3 px-2 text-slate-600 font-medium hidden md:table-cell truncate">
                        {u.department || 'Laboratoire'}
                      </td>

                      {/* Groups */}
                      <td className="py-3 px-2 hidden lg:table-cell">
                        <div className="flex flex-wrap gap-1">
                          {userGroups.map((g) => (
                            <span
                              key={g.id}
                              className="bg-indigo-50 text-indigo-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-indigo-200 truncate"
                            >
                              {g.name}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-2 text-center">
                        {u.active ? (
                          <span className="inline-flex items-center text-emerald-700 font-bold text-[10px]">
                            <CheckCircle2 className="w-3 h-3 mr-0.5 text-emerald-500 shrink-0" />
                            Actif
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-slate-400 font-medium text-[10px]">
                            <XCircle className="w-3 h-3 mr-0.5 shrink-0" />
                            Désactivé
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            onClick={() => handleOpenEditUserModal(u)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                            title="Modifier l'utilisateur"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {onDeleteUser && (
                            <button
                              onClick={() => setItemToDelete({ type: 'user', id: u.id, name: u.name })}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                              title="Supprimer l'utilisateur"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: ROLES & GROUPS (Liste en Ligne) */}
      {activeTab === 'roles' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="w-full">
            <table className="w-full text-left text-xs border-collapse table-fixed">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4 w-[28%]">Rôle / Groupe Métier</th>
                  <th className="py-3 px-3 w-[30%] hidden md:table-cell">Description Opérationnelle</th>
                  <th className="py-3 px-3 w-[32%]">Droits Exhaustifs Associés</th>
                  <th className="py-3 px-4 text-center w-[10%]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {groups.map((g) => (
                  <tr key={g.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Role Name */}
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2.5">
                        <div className="p-2 bg-slate-100 text-slate-800 rounded-xl shrink-0">
                          <Shield className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-extrabold text-slate-900 truncate">{g.name}</div>
                          <div className="text-[11px] text-slate-500 truncate md:hidden">{g.description || 'Aucune description'}</div>
                        </div>
                      </div>
                    </td>

                    {/* Description */}
                    <td className="py-3 px-3 text-slate-600 hidden md:table-cell">
                      <p className="line-clamp-2 text-xs">{g.description || 'Aucune description'}</p>
                    </td>

                    {/* Permissions list */}
                    <td className="py-3 px-3">
                      <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto">
                        {(g.permissions || []).map((permKey) => {
                          const pObj = EXHAUSTIVE_PERMISSIONS.find((p) => p.key === permKey);
                          return (
                            <span
                              key={permKey}
                              className="bg-slate-100 text-slate-800 text-[10px] font-semibold px-1.5 py-0.5 rounded border border-slate-200 truncate max-w-full"
                            >
                              {pObj?.label || permKey}
                            </span>
                          );
                        })}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          onClick={() => handleOpenEditRoleModal(g)}
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                          title="Modifier le rôle"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {onDeleteGroup && (
                          <button
                            onClick={() => setItemToDelete({ type: 'group', id: g.id, name: g.name })}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title="Supprimer le rôle"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: PERMISSIONS MATRIX */}
      {activeTab === 'matrix' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-sm font-black text-slate-900">
              Grille d'Habilitation Complète du Laboratoire
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Vue synthétique des privilèges alloués à chaque corps de métier pour la conformité et la sécurité des données.
            </p>
          </div>

          <div className="w-full">
            <table className="w-full text-left text-xs border-collapse table-fixed">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                  <th className="py-3 px-3 w-[40%]">Fonctionnalité &amp; Droit</th>
                  {groups.map((g) => (
                    <th key={g.id} className="py-3 px-2 text-center text-[11px] truncate">
                      {g.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {EXHAUSTIVE_PERMISSIONS.map((perm) => (
                  <tr key={perm.key} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-slate-900 truncate">{perm.label}</div>
                      <div className="text-[11px] text-slate-400 line-clamp-1">{perm.description}</div>
                    </td>
                    {groups.map((g) => {
                      const hasPerm = (g.permissions || []).includes(perm.key);
                      return (
                        <td key={g.id} className="py-2.5 px-2 text-center">
                          {hasPerm ? (
                            <span className="inline-flex p-1 bg-emerald-100 text-emerald-700 rounded-full">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 animate-in zoom-in-95">
            <div className="flex items-center space-x-3 text-rose-600 mb-3">
              <div className="p-2.5 bg-rose-100 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black text-slate-900">
                Confirmer la suppression
              </h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mb-5">
              Êtes-vous certain de vouloir supprimer{' '}
              <strong className="text-slate-900">{itemToDelete.name}</strong> ? Cette action est irréversible.
            </p>
            <div className="flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md transition"
              >
                Oui, Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit User Modal */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-xl w-full max-h-[90vh] flex flex-col shadow-xl border border-slate-200 overflow-hidden animate-in zoom-in-95">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 text-slate-900 px-5 py-3.5 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2.5">
                <div className="p-1.5 bg-slate-100 rounded-md border border-slate-200 text-slate-500">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-xs uppercase tracking-tight text-slate-900">
                    {editingUser ? 'Modifier le Compte Utilisateur' : 'Créer un Compte Collaborateur'}
                  </h3>
                  <p className="text-[11px] text-slate-500">Attribution des accès et des rôles de laboratoire</p>
                </div>
              </div>
              <button
                onClick={() => setIsUserModalOpen(false)}
                className="p-1 hover:bg-slate-100 rounded-md text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleUserSubmit} className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1 text-[11px]">
                    Nom &amp; Prénom <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nom et prénoms"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 shadow-sm"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1 text-[11px]">
                    Identifiant de Connexion (Login) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={login}
                    onChange={(e) => setLogin(e.target.value)}
                    placeholder="Identifiant"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 shadow-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1 text-[11px]">
                    Profil Métier &amp; Habilitation
                  </label>
                  <select
                    value={role}
                    onChange={(e) => handleRoleChange(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 shadow-sm"
                  >
                    <option value="">-- Sélectionner un profil --</option>
                    <optgroup label="Profils Facturation &amp; Caisse (Règles strictes de workflow)">
                      <option value="Facturier (Établissement Factures Seul)">
                        Profil Facture (Établissement factures seul, aucun encaissement)
                      </option>
                      <option value="Caissier (Encaissement Paiements Seul)">
                        Profil Caisse (Encaissement paiements seul, pas de création)
                      </option>
                      <option value="Facture / Caisse">
                        Profil Facture / Caisse (Polyvalent : Factures + Encaissements)
                      </option>
                      <option value="Superviseur Caisse / Facture">
                        Profil Superviseur Caisse / Facture (Supérieur hiérarchique, contrôle total)
                      </option>
                    </optgroup>
                    <optgroup label="Profils Médicaux &amp; Laboratoire">
                      <option value="Biologiste">Biologiste Médical / Chef Labo</option>
                      <option value="Technicien Supérieur Analyses Médicales">Technicien Supérieur Analyses Médicales</option>
                      <option value="Directeur Général">Directeur Général / Administrateur</option>
                      <option value="Comptable & Tiers-Payeur">Comptable &amp; Tiers-Payeur</option>
                      <option value="Opérateur">Opérateur Standard</option>
                    </optgroup>
                    {role && ![
                      "Superviseur Caisse / Facture",
                      "Facturier (Établissement Factures Seul)",
                      "Caissier (Encaissement Paiements Seul)",
                      "Facture / Caisse",
                      "Biologiste",
                      "Technicien Supérieur Analyses Médicales",
                      "Directeur Général",
                      "Comptable & Tiers-Payeur",
                      "Opérateur"
                    ].includes(role) && (
                      <option value={role}>{role}</option>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1 text-[11px]">
                    Département / Service
                  </label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="Département"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 shadow-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1 text-[11px]">
                  Email Professionnel
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Adresse email"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 shadow-sm"
                />
              </div>

              {/* Security & Password Section */}
              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-slate-900 font-bold text-[11px] uppercase tracking-wider">
                    <Lock className="w-3.5 h-3.5 text-slate-700" />
                    <span>Sécurité &amp; Mot de Passe de Connexion</span>
                  </div>
                  {editingUser && (
                    <span className="text-[10px] text-slate-500 italic">
                      Laisser vide si inchangé
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1 text-[11px]">
                      {editingUser ? 'Nouveau Mot de Passe' : 'Mot de Passe *'}
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required={!editingUser}
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          if (passwordError) setPasswordError('');
                        }}
                        placeholder={editingUser ? '•••••••• (inchangé)' : 'Saisir un mot de passe'}
                        className="w-full pl-3 pr-9 py-2 bg-white border border-slate-300 rounded-md font-mono text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 shadow-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-700"
                        title={showPassword ? 'Masquer' : 'Afficher'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1 text-[11px]">
                      Confirmer le Mot de Passe
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (passwordError) setPasswordError('');
                      }}
                      placeholder="Confirmer le mot de passe"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md font-mono text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 shadow-sm"
                    />
                  </div>
                </div>

                {passwordError && (
                  <div className="p-2 bg-rose-50 border border-rose-200 text-rose-700 text-[11px] rounded font-bold flex items-center space-x-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>{passwordError}</span>
                  </div>
                )}
              </div>

              {/* Group selection */}
              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-2 text-[11px]">
                  Groupes d'Accès &amp; Profils Métier
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {groups.map((g) => {
                    const isSelected = (selectedGroupIds || []).includes(g.id);
                    return (
                      <div
                        key={g.id}
                        onClick={() => toggleGroup(g.id)}
                        className={`p-3 rounded-md border cursor-pointer transition flex items-start space-x-2.5 ${
                          isSelected
                            ? 'border-slate-900 bg-slate-50 ring-1 ring-slate-900'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="mt-0.5 rounded text-slate-900 focus:ring-slate-900"
                        />
                        <div>
                          <div className="font-bold text-slate-900 text-xs">{g.name}</div>
                          <div className="text-[10px] text-slate-500 leading-tight mt-0.5">{g.description}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Custom Menu Access Control (Add/Subtract Menus) */}
              <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
                  <div>
                    <div className="font-black text-slate-900 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-slate-700" />
                      <span>Personnalisation des Menus d'Accès (Ajouter / Soustraire des Menus)</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Cochez ou décochez les menus individuels pour étendre ou restreindre l'accès de cet utilisateur.
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setSelectedAllowedViews(ALL_NAVIGATION_MENUS.map((m) => m.id))}
                      className="text-[10px] font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 px-2 py-1 rounded transition cursor-pointer"
                    >
                      Tout Cocher
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedAllowedViews(getDefaultViewsForRole(role))}
                      className="text-[10px] font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 px-2 py-1 rounded transition cursor-pointer"
                    >
                      Défaut Rôle
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                  {ALL_NAVIGATION_MENUS.map((menu) => {
                    const isChecked = (selectedAllowedViews || []).includes(menu.id);
                    return (
                      <div
                        key={menu.id}
                        onClick={() => toggleAllowedView(menu.id)}
                        className={`p-2.5 rounded-lg border cursor-pointer transition flex items-center justify-between ${
                          isChecked
                            ? 'bg-white border-slate-800 text-slate-900 ring-1 ring-slate-800 shadow-xs'
                            : 'bg-white/60 border-slate-200 text-slate-500 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            className="rounded text-slate-900 focus:ring-slate-900"
                          />
                          <div>
                            <div className="font-bold text-xs">{menu.label}</div>
                            <div className="text-[9px] text-slate-400 uppercase font-mono">{menu.category}</div>
                          </div>
                        </div>
                        <span
                          className={`px-1.5 py-0.5 text-[9px] font-bold rounded uppercase ${
                            isChecked ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-400'
                          }`}
                        >
                          {isChecked ? 'Autorisé' : 'Masqué'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end space-x-2.5 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-md font-bold text-slate-600 hover:bg-slate-50 transition-colors text-xs"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-md font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-sm transition-colors text-xs"
                >
                  {editingUser ? 'Enregistrer les Modifications' : 'Créer l\'Utilisateur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create / Edit Role Modal */}
      {isRoleModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4 text-slate-300" />
                <h3 className="text-sm font-bold">
                  {editingGroup ? 'Modifier le Rôle Métier' : 'Nouveau Profil de Rôle'}
                </h3>
              </div>
              <button
                onClick={() => setIsRoleModalOpen(false)}
                className="p-1 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRoleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Intitulé du Rôle *
                </label>
                <input
                  type="text"
                  required
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  placeholder="Nom du groupe"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Description Opérationnelle
                </label>
                <textarea
                  rows={2}
                  value={roleDescription}
                  onChange={(e) => setRoleDescription(e.target.value)}
                  placeholder="Attributions et responsabilités liées à ce rôle..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
                />
              </div>

              {/* Permissions checkboxes */}
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Habilitations &amp; Privilèges Exhaustifs
                </label>
                <div className="space-y-2 max-h-60 overflow-y-auto p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  {EXHAUSTIVE_PERMISSIONS.map((perm) => {
                    const isChecked = (rolePermissions || []).includes(perm.key);
                    return (
                      <label
                        key={perm.key}
                        className="flex items-start space-x-2.5 p-2 rounded-lg hover:bg-white cursor-pointer transition"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleRolePermission(perm.key)}
                          className="mt-0.5 rounded text-slate-900 focus:ring-slate-900"
                        />
                        <div>
                          <div className="font-bold text-slate-900">{perm.label}</div>
                          <div className="text-[11px] text-slate-500">{perm.description}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsRoleModalOpen(false)}
                  className="px-4 py-2 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-md transition active:scale-95"
                >
                  {editingGroup ? 'Enregistrer le Rôle' : 'Créer le Rôle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
