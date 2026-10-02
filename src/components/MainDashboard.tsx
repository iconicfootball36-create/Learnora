import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  BrainCircuit, 
  BookOpen, 
  Layers, 
  Clock, 
  Flame, 
  Upload, 
  Youtube, 
  FileText, 
  Mic, 
  HelpCircle, 
  Calendar as CalendarIcon, 
  Video, 
  Headphones, 
  FileCheck, 
  Sparkles, 
  TrendingUp, 
  Settings, 
  User, 
  CheckCircle2, 
  ArrowRight,
  FolderOpen,
  Library,
  Target,
  Trash2,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { DBService } from '../services/dbService';
import { StudySet, isAdminEmail } from '../types';
import { MaterialUploadModal } from './MaterialUploadModal';
import { StudySetDetailView } from './StudySetDetailView';
import { NoraTutorView } from './NoraTutorView';
import { FlashcardSession } from './FlashcardSession';
import { QuizSession } from './QuizSession';
import { EssayGraderView } from './EssayGraderView';
import { StudyPlanView } from './StudyPlanView';
import { ProgressView } from './ProgressView';
import { AudioLessonModal } from './AudioLessonModal';
import { ExplainerVideoModal } from './ExplainerVideoModal';
import { SettingsModal } from './SettingsModal';
import { NoraCognitiveDashboard } from './NoraCognitiveDashboard';
import { PWAInstallButton } from './PWAInstallButton';
import { AdminPanel } from './AdminPanel';

type ActiveView = 
  | 'home' 
  | 'library' 
  | 'study-set-detail' 
  | 'tutor' 
  | 'flashcards' 
  | 'quiz' 
  | 'essay-grader' 
  | 'study-plan' 
  | 'progress'
  | 'cognitive-mind'
  | 'admin';

export const MainDashboard: React.FC = () => {
  const { user, profile } = useAuth();
  const [activeView, setActiveView] = useState<ActiveView>('home');
  const [studySets, setStudySets] = useState<StudySet[]>([]);
  const [selectedSet, setSelectedSet] = useState<StudySet | null>(null);
  const [loadingSets, setLoadingSets] = useState(true);

  // Modals
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showAudioModal, setShowAudioModal] = useState(false);
  const [showExplainerModal, setShowExplainerModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [deleteConfirmSet, setDeleteConfirmSet] = useState<StudySet | null>(null);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteSuccessToast, setDeleteSuccessToast] = useState<string | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (user) {
      loadSets();
    }
  }, [user]);

  const loadSets = async () => {
    if (!user) return;
    setLoadingSets(true);
    try {
      const sets = await DBService.getStudySets(user.uid);
      setStudySets(sets);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingSets(false);
    }
  };

  const handleStudySetCreated = (newSet: StudySet) => {
    setStudySets([newSet, ...studySets]);
    setSelectedSet(newSet);
    setShowUploadModal(false);
    setActiveView('study-set-detail');
  };

  const handleDeleteStudySet = async (setToDel: StudySet) => {
    setIsDeleting(true);
    try {
      await DBService.deleteStudySet(setToDel.id);
      setStudySets(prev => prev.filter(s => s.id !== setToDel.id));
      if (selectedSet?.id === setToDel.id) {
        setSelectedSet(null);
        setActiveView('library');
      }
      setDeleteConfirmSet(null);
      setDeleteSuccessToast(`"${setToDel.title}" has been deleted.`);
      setTimeout(() => setDeleteSuccessToast(null), 3500);
    } catch (e) {
      console.error('Error deleting study set:', e);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteAllStudySets = async () => {
    if (!user) return;
    setIsDeleting(true);
    try {
      await DBService.deleteAllStudySets(user.uid);
      setStudySets([]);
      setSelectedSet(null);
      setShowDeleteAllModal(false);
      setDeleteSuccessToast('All study sets in your library have been deleted.');
      setTimeout(() => setDeleteSuccessToast(null), 3500);
    } catch (e) {
      console.error('Error deleting all study sets:', e);
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredSets = studySets.filter(s => 
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.subject && s.subject.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="flex h-screen h-[100dvh] bg-slate-50 text-slate-900 overflow-hidden font-sans w-full">
      {/* Desktop Left Sidebar */}
      <aside className="hidden lg:flex w-64 bg-white border-r border-slate-200 flex-col justify-between shrink-0">
        <div>
          {/* Brand header */}
          <div className="h-16 px-6 border-b border-slate-100 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-sm shadow-indigo-100">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-lg font-serif text-slate-950">Learnora</span>
              <span className="block text-[10px] text-slate-400 font-sans uppercase tracking-wider font-semibold">Workspace</span>
            </div>
          </div>

          {/* Quick Create Action */}
          <div className="p-4">
            <button
              onClick={() => setShowUploadModal(true)}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white rounded-xl font-semibold text-xs shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>New Study Set</span>
            </button>
          </div>

          {/* Nav Items */}
          <nav className="px-3 space-y-1 text-xs font-semibold text-slate-600">
            <button
              onClick={() => setActiveView('home')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                activeView === 'home' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <BrainCircuit className="w-4 h-4" />
              <span>Home Dashboard</span>
            </button>

            <button
              onClick={() => setActiveView('library')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                activeView === 'library' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <FolderOpen className="w-4 h-4" />
              <span>My Study Sets ({studySets.length})</span>
            </button>

            <button
              onClick={() => {
                setSelectedSet(studySets[0] || null);
                setActiveView('tutor');
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                activeView === 'tutor' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>Nora AI Lecturer</span>
            </button>

            <button
              onClick={() => setActiveView('study-plan')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                activeView === 'study-plan' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <CalendarIcon className="w-4 h-4" />
              <span>Adaptive Study Plan</span>
            </button>

            <button
              onClick={() => setActiveView('essay-grader')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                activeView === 'essay-grader' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <FileCheck className="w-4 h-4" />
              <span>Essay Grader</span>
            </button>

            <button
              onClick={() => setActiveView('progress')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                activeView === 'progress' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>Analytics & Mastery</span>
            </button>

            <button
              onClick={() => setActiveView('cognitive-mind')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                activeView === 'cognitive-mind' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <BrainCircuit className="w-4 h-4 text-violet-600" />
              <div className="flex items-center justify-between flex-1">
                <span>Nora's Mind</span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-100 text-indigo-700 uppercase">Self-Learning</span>
              </div>
            </button>

            {isAdminEmail(user?.email) && (
              <button
                onClick={() => setActiveView('admin')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all border ${
                  activeView === 'admin' 
                    ? 'bg-slate-900 text-indigo-300 border-indigo-500/50 font-bold shadow-md shadow-slate-950/20' 
                    : 'border-indigo-100/80 bg-indigo-50/40 hover:bg-indigo-50 text-indigo-950 font-semibold'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                <div className="flex items-center justify-between flex-1">
                  <span>Admin Panel</span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-600 text-white uppercase tracking-wider">
                    Owner
                  </span>
                </div>
              </button>
            )}
          </nav>
        </div>

        {/* Sidebar Footer User profile */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0">
              {profile?.displayName?.charAt(0) || 'L'}
            </div>
            <div className="truncate">
              <span className="font-semibold text-xs text-slate-900 block truncate">
                {profile?.displayName || 'Learner'}
              </span>
              <span className="text-[10px] text-slate-400 capitalize block">
                {profile?.educationLevel || 'Student'}
              </span>
            </div>
          </div>

          <button
            onClick={() => setShowSettingsModal(true)}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main Container Area */}
      <div className="flex-1 flex flex-col h-full h-[100dvh] overflow-hidden min-w-0">
        {/* Top Navbar - on mobile, hidden during active tutor session to give Nora full viewport */}
        <header className={`h-16 bg-white border-b border-slate-200 px-4 sm:px-6 items-center justify-between shrink-0 ${
          activeView === 'tutor' ? 'hidden lg:flex' : 'flex'
        }`}>
          <div className="flex items-center gap-3 flex-1 min-w-0 max-w-md">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search your workspace..."
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 ml-4">
            {/* Streak & points badge */}
            <div className="flex items-center gap-3 text-xs font-semibold">
              <div className="flex items-center gap-1 text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100/80">
                <Flame className="w-3.5 h-3.5 fill-amber-500" />
                <span>{profile?.streakDays || 1}d</span>
              </div>
              <div className="hidden sm:flex items-center gap-1 text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100/80">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>{profile?.points || 120} pts</span>
              </div>
            </div>

            {isAdminEmail(user?.email) && (
              <button
                onClick={() => setActiveView('admin')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                  activeView === 'admin'
                    ? 'bg-slate-900 text-indigo-300 border-indigo-500/50 shadow-sm'
                    : 'bg-indigo-50 hover:bg-indigo-100/70 text-indigo-950 border-indigo-200/60'
                }`}
                title="Admin Command Center (adedayoademola171@gmail.com)"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                <span className="hidden sm:inline">Admin Panel</span>
              </button>
            )}

            {/* PWA Install Button */}
            <PWAInstallButton variant="compact" />

            <button
              onClick={() => setShowUploadModal(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create</span>
            </button>
          </div>
        </header>

        {/* View Routing */}
        <main className={`flex-1 flex flex-col min-h-0 min-w-0 pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:pb-0 ${
          activeView === 'tutor' ? 'overflow-hidden' : 'overflow-y-auto'
        }`}>
          {activeView === 'home' && (
            <div className="p-4 sm:p-8 max-w-6xl mx-auto w-full space-y-6 sm:space-y-8 animate-fade-in pb-4 lg:pb-8">
              {/* Welcome banner */}
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 font-serif">
                  Good day, {profile?.tutorNickname || profile?.displayName || 'Learner'}
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  "Turn what you have into what you know." What are we mastering today?
                </p>
              </div>

              {/* Quick Upload Action Buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Upload Material', desc: 'PDF, DOCX, PPTX', icon: Upload, color: 'text-indigo-600 bg-indigo-50' },
                  { label: 'Paste YouTube', desc: 'Lecture transcript', icon: Youtube, color: 'text-red-600 bg-red-50' },
                  { label: 'Write Topic', desc: 'Direct text input', icon: FileText, color: 'text-emerald-600 bg-emerald-50' },
                  { label: 'Record Lecture', desc: 'Microphone capture', icon: Mic, color: 'text-amber-600 bg-amber-50' }
                ].map((act, i) => {
                  const Icon = act.icon;
                  return (
                    <button
                      key={i}
                      onClick={() => setShowUploadModal(true)}
                      className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all text-left group"
                    >
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${act.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <h4 className="font-bold text-xs text-slate-900 group-hover:text-indigo-700 transition-colors">{act.label}</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">{act.desc}</p>
                    </button>
                  );
                })}
              </div>

              {/* AI Recommendation Alert */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-50 via-white to-violet-50 border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-indigo-950 uppercase tracking-wider block">
                      Nora's Daily Revision Insight
                    </span>
                    <p className="text-xs text-slate-600 mt-0.5">
                      You reviewed concepts recently. Nora has tuned her pedagogical strategy to reinforce recent topics.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setActiveView('cognitive-mind')}
                    className="px-3.5 py-2 bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <BrainCircuit className="w-3.5 h-3.5" />
                    <span>Nora's Brain Model</span>
                  </button>
                  <button
                    onClick={() => {
                      if (studySets.length > 0) {
                        setSelectedSet(studySets[0]);
                        setActiveView('flashcards');
                      } else {
                        setShowUploadModal(true);
                      }
                    }}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-xs"
                  >
                    Review Flashcards
                  </button>
                </div>
              </div>

              {/* Recent Study Sets */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-base text-slate-900 font-serif">Recent Study Sets</h3>
                  <button
                    onClick={() => setActiveView('library')}
                    className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1"
                  >
                    <span>View all ({studySets.length})</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {loadingSets ? (
                  <div className="py-12 text-center text-xs text-slate-400">Loading your sets...</div>
                ) : studySets.length === 0 ? (
                  /* Empty state */
                  <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-8 sm:p-12 text-center">
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 mb-4">
                      <BookOpen className="w-7 h-7" />
                    </div>
                    <h4 className="font-bold text-base text-slate-900 font-serif">Your study space is empty</h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto mb-6">
                      Upload your first material and Learnora will build your notes, flashcards, and interactive tutor sessions.
                    </p>
                    <button
                      onClick={() => setShowUploadModal(true)}
                      className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 inline-flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Upload First Document</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {filteredSets.slice(0, 6).map((set) => (
                      <div
                        key={set.id}
                        onClick={() => {
                          setSelectedSet(set);
                          setActiveView('study-set-detail');
                        }}
                        className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
                      >
                        <div>
                          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2">
                            <span className="font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                              {set.subject || 'General'}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <span>{new Date(set.createdAt).toLocaleDateString()}</span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteConfirmSet(set);
                                }}
                                className="p-1 rounded-md text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                title="Delete Study Set"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                          <h4 className="font-bold text-sm text-slate-900 group-hover:text-indigo-700 transition-colors font-serif line-clamp-2">
                            {set.title}
                          </h4>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Layers className="w-3.5 h-3.5 text-slate-400" />
                            <span>{set.materials?.length || 1} source</span>
                          </span>
                          <span className="text-indigo-600 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-1 text-[11px]">
                            <span>Open Set</span>
                            <ArrowRight className="w-3 h-3" />
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeView === 'library' && (
            <div className="p-4 sm:p-8 max-w-6xl mx-auto w-full space-y-6 animate-fade-in pb-4 lg:pb-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 font-serif">Study Sets Library</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    All your transformed educational collections ({studySets.length} {studySets.length === 1 ? 'set' : 'sets'})
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {studySets.length > 0 && (
                    <button
                      onClick={() => setShowDeleteAllModal(true)}
                      className="px-3.5 py-2 border border-slate-200 text-slate-500 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 rounded-xl font-semibold text-xs shadow-2xs flex items-center gap-1.5 transition-colors"
                      title="Clear or delete all study sets from library"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Clear Library</span>
                    </button>
                  )}
                  <button
                    onClick={() => setShowUploadModal(true)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-xs shadow-sm flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>New Study Set</span>
                  </button>
                </div>
              </div>

              {deleteSuccessToast && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2 animate-fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{deleteSuccessToast}</span>
                </div>
              )}

              {loadingSets ? (
                <div className="py-16 text-center text-xs text-slate-400">Loading your library...</div>
              ) : filteredSets.length === 0 ? (
                <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-8 sm:p-12 text-center">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 mb-4">
                    <FolderOpen className="w-7 h-7" />
                  </div>
                  <h4 className="font-bold text-base text-slate-900 font-serif">
                    {searchQuery ? 'No matching study sets found' : 'Your Study Sets Library is empty'}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto mb-6">
                    {searchQuery 
                      ? `No collections match "${searchQuery}". Try a different keyword.` 
                      : 'Upload materials (PDF, PPT, Word, YouTube, Audio) to build your first study set.'}
                  </p>
                  <button
                    onClick={() => setShowUploadModal(true)}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm shadow-indigo-600/20 inline-flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Study Set</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {filteredSets.map((set) => (
                    <div
                      key={set.id}
                      onClick={() => {
                        setSelectedSet(set);
                        setActiveView('study-set-detail');
                      }}
                      className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
                    >
                      <div>
                        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2">
                          <span className="font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                            {set.subject || 'General'}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span>{new Date(set.createdAt).toLocaleDateString()}</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteConfirmSet(set);
                              }}
                              className="p-1 rounded-md text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Delete Study Set"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <h4 className="font-bold text-sm text-slate-900 group-hover:text-indigo-700 transition-colors font-serif">
                          {set.title}
                        </h4>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span>{set.materials?.length || 1} material attached</span>
                        <span className="text-indigo-600 font-semibold flex items-center gap-1 text-[11px]">
                          <span>Study</span>
                          <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeView === 'study-set-detail' && selectedSet && (
            <StudySetDetailView
              studySet={selectedSet}
              onBack={() => setActiveView('library')}
              onOpenTutor={(s) => {
                setSelectedSet(s);
                setActiveView('tutor');
              }}
              onOpenFlashcards={(s) => {
                setSelectedSet(s);
                setActiveView('flashcards');
              }}
              onOpenQuiz={(s) => {
                setSelectedSet(s);
                setActiveView('quiz');
              }}
              onOpenAudio={(s) => {
                setSelectedSet(s);
                setShowAudioModal(true);
              }}
              onOpenExplainer={(s) => {
                setSelectedSet(s);
                setShowExplainerModal(true);
              }}
              onDeleteStudySet={(s) => setDeleteConfirmSet(s)}
            />
          )}

          {activeView === 'tutor' && (
            <NoraTutorView
              userId={user?.uid || ''}
              studentName={profile?.tutorNickname || profile?.displayName || 'Learner'}
              studySet={selectedSet}
              onBack={() => setActiveView('home')}
            />
          )}

          {activeView === 'flashcards' && selectedSet && (
            <FlashcardSession
              studySet={selectedSet}
              onBack={() => setActiveView('study-set-detail')}
            />
          )}

          {activeView === 'quiz' && selectedSet && (
            <QuizSession
              userId={user?.uid || ''}
              studySet={selectedSet}
              onBack={() => setActiveView('study-set-detail')}
            />
          )}

          {activeView === 'essay-grader' && (
            <EssayGraderView
              userId={user?.uid || ''}
              onBack={() => setActiveView('home')}
            />
          )}

          {activeView === 'study-plan' && (
            <StudyPlanView
              userId={user?.uid || ''}
              onBack={() => setActiveView('home')}
            />
          )}

          {activeView === 'progress' && (
            <ProgressView
              userId={user?.uid || ''}
              profile={profile}
              onBack={() => setActiveView('home')}
            />
          )}

          {activeView === 'cognitive-mind' && (
            <div className="p-4 sm:p-8 max-w-6xl mx-auto w-full space-y-6 animate-fade-in pb-4 lg:pb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 font-serif">Nora's Cognitive Self-Learning Mind</h2>
                  <p className="text-xs text-slate-500 mt-1">Autonomous student modeling, real-time pedagogical adjustments & continuous evolution</p>
                </div>
              </div>
              <NoraCognitiveDashboard
                userId={user?.uid || ''}
                studentName={profile?.tutorNickname || profile?.displayName || 'Learner'}
              />
            </div>
          )}

          {activeView === 'admin' && (
            <AdminPanel
              currentUserEmail={user?.email || null}
              onBack={() => setActiveView('home')}
            />
          )}
        </main>

        {/* Mobile Bottom Navigation Bar (Phone-First UX) */}
        <nav className={`fixed inset-x-0 bottom-0 z-50 lg:hidden min-h-16 bg-white/95 backdrop-blur border-t border-slate-200 px-1 pt-2 pb-[max(0.375rem,env(safe-area-inset-bottom))] shadow-[0_-4px_16px_rgba(15,23,42,0.08)] grid ${isAdminEmail(user?.email) ? 'grid-cols-6' : 'grid-cols-5'} items-center w-full`}>
          <button
            onClick={() => setActiveView('home')}
            className={`w-full flex flex-col items-center justify-center gap-1 py-1 transition-colors ${
              activeView === 'home' ? 'text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <BrainCircuit className="w-5 h-5" />
            <span className="text-[10px] leading-none">Home</span>
          </button>

          <button
            onClick={() => setActiveView('library')}
            className={`w-full flex flex-col items-center justify-center gap-1 py-1 transition-colors ${
              activeView === 'library' ? 'text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <FolderOpen className="w-5 h-5" />
            <span className="text-[10px] leading-none">Library</span>
          </button>

          {/* Standout Create Button */}
          <button
            onClick={() => setShowUploadModal(true)}
            className="w-full flex flex-col items-center justify-center -mt-5"
          >
            <div className="w-11 h-11 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30 active:scale-95 transition-transform">
              <Plus className="w-5 h-5" />
            </div>
            <span className="text-[10px] text-indigo-700 font-bold mt-1 leading-none">Create</span>
          </button>

          <button
            onClick={() => {
              setSelectedSet(studySets[0] || null);
              setActiveView('tutor');
            }}
            className={`w-full flex flex-col items-center justify-center gap-1 py-1 transition-colors ${
              activeView === 'tutor' ? 'text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <span className="text-[10px] leading-none">Nora</span>
          </button>

          {isAdminEmail(user?.email) && (
            <button
              onClick={() => setActiveView('admin')}
              className={`w-full flex flex-col items-center justify-center gap-1 py-1 transition-colors ${
                activeView === 'admin' ? 'text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
              <span className="text-[10px] leading-none">Admin</span>
            </button>
          )}

          <button
            onClick={() => setShowSettingsModal(true)}
            className="w-full flex flex-col items-center justify-center gap-1 py-1 text-slate-500 hover:text-slate-800 transition-colors"
          >
            <User className="w-5 h-5" />
            <span className="text-[10px] leading-none">Profile</span>
          </button>
        </nav>
      </div>

      {/* Modals */}
      {showUploadModal && (
        <MaterialUploadModal
          userId={user?.uid || ''}
          onClose={() => setShowUploadModal(false)}
          onSuccess={handleStudySetCreated}
        />
      )}

      {showAudioModal && selectedSet && (
        <AudioLessonModal
          studySet={selectedSet}
          onClose={() => setShowAudioModal(false)}
        />
      )}

      {showExplainerModal && selectedSet && (
        <ExplainerVideoModal
          studySet={selectedSet}
          onClose={() => setShowExplainerModal(false)}
        />
      )}

      {showSettingsModal && (
        <SettingsModal
          onClose={() => setShowSettingsModal(false)}
        />
      )}

      {/* Delete Single Study Set Confirmation Modal */}
      {deleteConfirmSet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md p-6 relative">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-slate-900 font-serif">Delete Study Set</h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Are you sure you want to delete <strong className="text-slate-800">"{deleteConfirmSet.title}"</strong>? All associated notes, flashcards, quizzes, and learning materials will be permanently removed.
            </p>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmSet(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteStudySet(deleteConfirmSet)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-semibold text-xs shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Study Set</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear Library (Delete All) Confirmation Modal */}
      {showDeleteAllModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md p-6 relative">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-slate-900 font-serif">Clear Entire Study Sets Library</h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Are you sure you want to permanently delete <strong className="text-slate-800">all {studySets.length} study sets</strong> from your library? This will delete all transformed notes, flashcards, and quizzes. This action cannot be undone.
            </p>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteAllModal(false)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAllStudySets}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-semibold text-xs shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Deleting All...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Entire Library</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
