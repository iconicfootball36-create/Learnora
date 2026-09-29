import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Users, 
  Search, 
  Filter, 
  Crown, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Trash2, 
  Edit3, 
  Plus, 
  Flame, 
  Star, 
  Clock, 
  ArrowLeft, 
  BookOpen, 
  GraduationCap, 
  Mail, 
  UserCheck, 
  UserX, 
  Sparkles,
  Sliders,
  Send,
  MoreVertical,
  Check,
  X
} from 'lucide-react';
import { UserProfile, ADMIN_EMAIL, isAdminEmail } from '../types';
import { DBService } from '../services/dbService';

interface AdminPanelProps {
  currentUserEmail: string | null;
  onBack: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ currentUserEmail, onBack }) => {
  const isAuthorized = isAdminEmail(currentUserEmail);

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStudySets: 0,
    totalFlashcards: 0,
    proUsers: 0,
    activeUsers: 0
  });

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTier, setFilterTier] = useState<'all' | 'free' | 'pro'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'suspended'>('all');

  // Modals & Action States
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [deleteTargetUser, setDeleteTargetUser] = useState<UserProfile | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  // Quick Bonus Points Modal
  const [pointsUser, setPointsUser] = useState<UserProfile | null>(null);
  const [bonusPointsAmount, setBonusPointsAmount] = useState(100);

  // System Broadcast Notice
  const [broadcastText, setBroadcastText] = useState('');
  const [broadcastActive, setBroadcastActive] = useState(false);

  useEffect(() => {
    if (isAuthorized) {
      loadData();
    }
  }, [isAuthorized]);

  const showToast = (msg: string) => {
    setFeedbackToast(msg);
    setTimeout(() => setFeedbackToast(null), 3500);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [fetchedUsers, platformStats] = await Promise.all([
        DBService.getAllUsers(),
        DBService.getPlatformStats()
      ]);
      setUsers(fetchedUsers);
      setStats(platformStats);
    } catch (e) {
      console.error('Error loading admin data:', e);
      showToast('Error loading user database.');
    } finally {
      setLoading(false);
    }
  };

  // User Actions
  const handleToggleTier = async (user: UserProfile) => {
    const nextTier: 'free' | 'pro' = (user.tier === 'pro' || user.tier === 'elite') ? 'free' : 'pro';
    try {
      await DBService.updateUserByAdmin(user.uid, { tier: nextTier });
      setUsers(prev => prev.map(u => u.uid === user.uid ? { ...u, tier: nextTier } : u));
      showToast(`Updated ${user.displayName}'s tier to ${nextTier.toUpperCase()}`);
    } catch (e) {
      console.error(e);
      showToast('Failed to update tier.');
    }
  };

  const handleToggleStatus = async (user: UserProfile) => {
    const nextStatus: 'active' | 'suspended' = user.status === 'suspended' ? 'active' : 'suspended';
    try {
      await DBService.updateUserByAdmin(user.uid, { status: nextStatus });
      setUsers(prev => prev.map(u => u.uid === user.uid ? { ...u, status: nextStatus } : u));
      showToast(`User account is now ${nextStatus}`);
    } catch (e) {
      console.error(e);
      showToast('Failed to change user status.');
    }
  };

  const handleAwardPoints = async () => {
    if (!pointsUser) return;
    setActionLoading(true);
    try {
      const newPoints = (pointsUser.points || 0) + bonusPointsAmount;
      await DBService.updateUserByAdmin(pointsUser.uid, { points: newPoints });
      setUsers(prev => prev.map(u => u.uid === pointsUser.uid ? { ...u, points: newPoints } : u));
      showToast(`Awarded +${bonusPointsAmount} points to ${pointsUser.displayName}`);
      setPointsUser(null);
    } catch (e) {
      console.error(e);
      showToast('Failed to award points.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveProfileEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setActionLoading(true);
    try {
      await DBService.updateUserByAdmin(editingUser.uid, {
        displayName: editingUser.displayName,
        tutorNickname: editingUser.tutorNickname,
        educationLevel: editingUser.educationLevel,
        role: editingUser.role,
        tier: editingUser.tier,
        streakDays: Number(editingUser.streakDays) || 0,
        points: Number(editingUser.points) || 0
      });
      setUsers(prev => prev.map(u => u.uid === editingUser.uid ? editingUser : u));
      showToast(`Updated profile for ${editingUser.displayName}`);
      setEditingUser(null);
    } catch (e) {
      console.error(e);
      showToast('Failed to update profile.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteTargetUser) return;
    setActionLoading(true);
    try {
      await DBService.deleteUserByAdmin(deleteTargetUser.uid);
      setUsers(prev => prev.filter(u => u.uid !== deleteTargetUser.uid));
      showToast(`User ${deleteTargetUser.displayName} and data have been removed.`);
      setDeleteTargetUser(null);
    } catch (e) {
      console.error(e);
      showToast('Failed to delete user.');
    } finally {
      setActionLoading(false);
    }
  };

  // If user is not adedayoademola171@gmail.com, show access denied
  if (!isAuthorized) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 bg-slate-900 text-white min-h-[80vh]">
        <div className="max-w-md w-full bg-slate-950 border border-rose-900/50 rounded-3xl p-8 text-center shadow-2xl relative overflow-hidden">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-5">
            <XCircle className="w-8 h-8" />
          </div>
          <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30">
            Access Restricted
          </span>
          <h2 className="text-xl font-bold font-serif mt-4 text-white">Administrator Access Required</h2>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            This administration panel is strictly restricted to the account:
          </p>
          <div className="mt-3 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-indigo-300 select-all">
            {ADMIN_EMAIL}
          </div>
          <p className="text-[11px] text-slate-500 mt-3">
            Logged in as: <span className="text-slate-300">{currentUserEmail || 'Anonymous'}</span>
          </p>
          <button
            onClick={onBack}
            className="mt-6 w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Learning Dashboard</span>
          </button>
        </div>
      </div>
    );
  }

  // Filter users
  const filteredUsers = users.filter(u => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = 
      (u.displayName && u.displayName.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.tutorNickname && u.tutorNickname.toLowerCase().includes(q));

    const matchesTier = 
      filterTier === 'all' || 
      (filterTier === 'pro' && (u.tier === 'pro' || u.tier === 'elite')) ||
      (filterTier === 'free' && (!u.tier || u.tier === 'free'));

    const matchesStatus = 
      filterStatus === 'all' || 
      (filterStatus === 'suspended' && u.status === 'suspended') ||
      (filterStatus === 'active' && u.status !== 'suspended');

    return matchesSearch && matchesTier && matchesStatus;
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 text-slate-100 overflow-y-auto w-full">
      {/* Admin Header */}
      <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 sm:px-8 py-4 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Return to Dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-indigo-400" />
                  <span>Admin Console</span>
                </span>
                <span className="text-[11px] text-emerald-400 font-mono">
                  {ADMIN_EMAIL}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold font-serif text-white mt-1">
                Learnora User Management
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              disabled={loading}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Users</span>
            </button>
            <button
              onClick={onBack}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors shadow-lg shadow-indigo-600/30"
            >
              Exit to Student App
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-6 w-full space-y-6">
        {/* Feedback Toast */}
        {feedbackToast && (
          <div className="p-3 bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 rounded-xl text-xs flex items-center gap-2 animate-fade-in shadow-lg">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{feedbackToast}</span>
          </div>
        )}

        {/* Platform Overview Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-xs font-semibold">Total Students</span>
              <Users className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-serif text-white">
              {stats.totalUsers || users.length}
            </div>
            <span className="text-[10px] text-indigo-400 mt-1 block">Registered learner accounts</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-xs font-semibold">Pro Subscriptions</span>
              <Crown className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-serif text-amber-400">
              {stats.proUsers || users.filter(u => u.tier === 'pro').length}
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">Premium tier accounts</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-xs font-semibold">Study Sets Created</span>
              <BookOpen className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-serif text-emerald-400">
              {stats.totalStudySets}
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">Platform-wide collections</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-xs font-semibold">Flashcards Mastered</span>
              <Sparkles className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-serif text-rose-400">
              {stats.totalFlashcards}
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">Spaced repetition cards</span>
          </div>
        </div>

        {/* User Search & Filters Toolbar */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users by name, email, or nickname..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap text-xs">
            {/* Tier Filter */}
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1">
              <button
                onClick={() => setFilterTier('all')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  filterTier === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                All Tiers
              </button>
              <button
                onClick={() => setFilterTier('free')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  filterTier === 'free' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Free
              </button>
              <button
                onClick={() => setFilterTier('pro')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  filterTier === 'pro' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Pro ⭐
              </button>
            </div>

            {/* Status Filter */}
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  filterStatus === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                All Status
              </button>
              <button
                onClick={() => setFilterStatus('active')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  filterStatus === 'active' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setFilterStatus('suspended')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  filterStatus === 'suspended' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Suspended
              </button>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="font-bold text-sm text-white font-serif flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-400" />
              <span>Registered Accounts ({filteredUsers.length})</span>
            </h3>
            <span className="text-[11px] text-slate-400">
              Direct live sync with Cloud Firestore
            </span>
          </div>

          {loading ? (
            <div className="py-16 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-3">
              <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              <span>Querying users from database...</span>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-400">
              No users found matching the filter criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">User / Email</th>
                    <th className="py-3 px-4">Level & Goal</th>
                    <th className="py-3 px-4">Tier</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Stats</th>
                    <th className="py-3 px-4">Joined</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {filteredUsers.map((u) => {
                    const isSelfAdmin = isAdminEmail(u.email);
                    const isPro = u.tier === 'pro' || u.tier === 'elite';
                    const isSuspended = u.status === 'suspended';

                    return (
                      <tr key={u.uid} className="hover:bg-slate-800/40 transition-colors">
                        {/* Name & Email */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-800 flex items-center justify-center font-bold text-white text-xs shrink-0">
                              {u.displayName?.[0] || 'U'}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-white truncate max-w-[140px]">
                                  {u.displayName || 'Learner'}
                                </span>
                                {isSelfAdmin && (
                                  <span className="px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-[9px] font-bold">
                                    OWNER ADMIN
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-400 truncate max-w-[180px]">
                                {u.email || 'No email provided'}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Education Level */}
                        <td className="py-3.5 px-4">
                          <div className="text-slate-200 font-medium">{u.educationLevel || 'General'}</div>
                          <div className="text-[10px] text-slate-400 truncate max-w-[150px]">{u.primaryGoal || 'Study'}</div>
                        </td>

                        {/* Tier */}
                        <td className="py-3.5 px-4">
                          <button
                            type="button"
                            onClick={() => handleToggleTier(u)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all flex items-center gap-1 ${
                              isPro
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30'
                                : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700'
                            }`}
                            title="Click to toggle Free / Pro tier"
                          >
                            <Crown className="w-3 h-3" />
                            <span>{isPro ? 'PRO TIER' : 'FREE'}</span>
                          </button>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(u)}
                            disabled={isSelfAdmin}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all flex items-center gap-1 ${
                              isSuspended
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30'
                                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30'
                            } ${isSelfAdmin ? 'opacity-50 cursor-not-allowed' : ''}`}
                            title={isSelfAdmin ? 'Owner cannot be suspended' : 'Click to toggle status'}
                          >
                            {isSuspended ? (
                              <>
                                <XCircle className="w-3 h-3 text-rose-400" />
                                <span>SUSPENDED</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                <span>ACTIVE</span>
                              </>
                            )}
                          </button>
                        </td>

                        {/* Stats */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3 text-[11px]">
                            <span className="flex items-center gap-1 text-amber-400" title="Points">
                              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                              <span>{u.points || 0}</span>
                            </span>
                            <span className="flex items-center gap-1 text-orange-400" title="Streak Days">
                              <Flame className="w-3 h-3 fill-orange-400 text-orange-400" />
                              <span>{u.streakDays || 0}d</span>
                            </span>
                          </div>
                        </td>

                        {/* Joined Date */}
                        <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'Recent'}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => setPointsUser(u)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-slate-800 transition-colors"
                              title="Award Bonus Points"
                            >
                              <Star className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => setEditingUser(u)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-300 hover:bg-slate-800 transition-colors"
                              title="Edit User Details"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            {!isSelfAdmin && (
                              <button
                                type="button"
                                onClick={() => setDeleteTargetUser(u)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                                title="Delete User and Associated Data"
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
          )}
        </div>
      </main>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl text-slate-100 relative">
            <button
              onClick={() => setEditingUser(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full"
            >
              ✕
            </button>
            <h3 className="text-lg font-bold font-serif text-white flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-indigo-400" />
              <span>Edit User: {editingUser.displayName}</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">UID: {editingUser.uid}</p>

            <form onSubmit={handleSaveProfileEdit} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Display Name</label>
                <input
                  type="text"
                  required
                  value={editingUser.displayName}
                  onChange={(e) => setEditingUser({ ...editingUser, displayName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nora Tutor Nickname</label>
                <input
                  type="text"
                  value={editingUser.tutorNickname || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, tutorNickname: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Subscription Tier</label>
                  <select
                    value={editingUser.tier || 'free'}
                    onChange={(e) => setEditingUser({ ...editingUser, tier: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="free">Free Learner</option>
                    <option value="pro">Pro Member</option>
                    <option value="elite">Academic Elite</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Account Role</label>
                  <select
                    value={editingUser.role || 'student'}
                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="student">Student</option>
                    <option value="mentor">Peer Mentor</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Study Streak (Days)</label>
                  <input
                    type="number"
                    min={0}
                    value={editingUser.streakDays || 0}
                    onChange={(e) => setEditingUser({ ...editingUser, streakDays: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Reward Points</label>
                  <input
                    type="number"
                    min={0}
                    value={editingUser.points || 0}
                    onChange={(e) => setEditingUser({ ...editingUser, points: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Education Level</label>
                <input
                  type="text"
                  value={editingUser.educationLevel || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, educationLevel: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="mt-5 flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors flex items-center gap-1.5"
                >
                  {actionLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Award Points Modal */}
      {pointsUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm p-6 shadow-2xl text-slate-100 text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-3">
              <Star className="w-6 h-6 fill-amber-400" />
            </div>
            <h3 className="font-bold text-base font-serif text-white">Award Bonus Points</h3>
            <p className="text-xs text-slate-400 mt-1">
              Grant achievement study points to <strong className="text-white">{pointsUser.displayName}</strong>
            </p>

            <div className="flex items-center justify-center gap-2 my-4">
              {[50, 100, 250, 500].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setBonusPointsAmount(amt)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    bonusPointsAmount === amt
                      ? 'bg-amber-500 text-slate-950 shadow-md'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  +{amt}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 mt-5">
              <button
                type="button"
                onClick={() => setPointsUser(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAwardPoints}
                disabled={actionLoading}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors flex items-center gap-1.5"
              >
                {actionLoading ? 'Awarding...' : `Add +${bonusPointsAmount} Points`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Confirmation Modal */}
      {deleteTargetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-rose-900/50 rounded-3xl w-full max-w-md p-6 shadow-2xl text-slate-100">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg font-serif text-white">Delete User Profile</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Are you sure you want to permanently delete <strong className="text-white">{deleteTargetUser.displayName}</strong> ({deleteTargetUser.email})? 
              This will remove their profile and all associated study sets from Cloud Firestore.
            </p>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteTargetUser(null)}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteUser}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-colors flex items-center gap-1.5"
              >
                {actionLoading ? 'Deleting...' : 'Delete User Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
