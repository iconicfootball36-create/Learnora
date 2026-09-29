import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Layers, 
  HelpCircle, 
  BrainCircuit, 
  Calendar, 
  Headphones, 
  Video, 
  ArrowLeft, 
  ExternalLink, 
  Check, 
  Clock, 
  Sparkles,
  Download,
  Share2,
  Trash2,
  ChevronRight,
  BookOpen
} from 'lucide-react';
import { StudySet, StudyNote, Flashcard, Quiz } from '../types';
import { DBService } from '../services/dbService';
import { AIService } from '../services/aiService';

interface StudySetDetailViewProps {
  studySet: StudySet;
  onBack: () => void;
  onOpenTutor: (studySet: StudySet) => void;
  onOpenFlashcards: (studySet: StudySet) => void;
  onOpenQuiz: (studySet: StudySet) => void;
  onOpenAudio: (studySet: StudySet) => void;
  onOpenExplainer: (studySet: StudySet) => void;
  onDeleteStudySet?: (studySet: StudySet) => void;
}

export const StudySetDetailView: React.FC<StudySetDetailViewProps> = ({
  studySet,
  onBack,
  onOpenTutor,
  onOpenFlashcards,
  onOpenQuiz,
  onOpenAudio,
  onOpenExplainer,
  onDeleteStudySet
}) => {
  const [activeTab, setActiveTab] = useState<'notes' | 'flashcards' | 'quiz' | 'sources'>('notes');
  const [notes, setNotes] = useState<StudyNote[]>([]);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingMore, setGeneratingMore] = useState(false);
  const [selectedCitation, setSelectedCitation] = useState<string | null>(null);

  useEffect(() => {
    loadMaterials();
  }, [studySet.id]);

  const loadMaterials = async () => {
    setLoading(true);
    try {
      const [fetchedNotes, fetchedCards, fetchedQuizzes] = await Promise.all([
        DBService.getNotes(studySet.id),
        DBService.getFlashcards(studySet.id),
        DBService.getQuizzes(studySet.id)
      ]);
      setNotes(fetchedNotes);
      setFlashcards(fetchedCards);
      setQuizzes(fetchedQuizzes);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const currentNote = notes[0];

  const handleExportNotes = () => {
    if (!currentNote) return;
    const textData = `# ${currentNote.title}\n\n${currentNote.summary}\n\n` + 
      currentNote.sections.map(s => `## ${s.heading}\n${s.content}\n${s.keyTerms ? s.keyTerms.map(t => `- ${t.term}: ${t.definition}`).join('\n') : ''}`).join('\n\n');
    
    const blob = new Blob([textData], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${studySet.title.replace(/\s+/g, '_')}_Notes.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 overflow-y-auto">
      {/* Top Header */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-8 py-5 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={onBack}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                  {studySet.subject || 'General'}
                </span>
                <span className="text-xs text-slate-400">
                  Updated {new Date(studySet.updatedAt).toLocaleDateString()}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 font-serif mt-1">{studySet.title}</h1>
            </div>
          </div>

          {/* Quick Study Actions */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            <button
              onClick={() => onOpenTutor(studySet)}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm shadow-indigo-600/20 transition-all whitespace-nowrap"
            >
              <BrainCircuit className="w-4 h-4" />
              <span>Ask Nora</span>
            </button>
            <button
              onClick={() => onOpenFlashcards(studySet)}
              className="px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold text-xs flex items-center gap-1.5 transition-colors whitespace-nowrap"
            >
              <Layers className="w-4 h-4 text-emerald-600" />
              <span>Review Cards ({flashcards.length})</span>
            </button>
            <button
              onClick={() => onOpenQuiz(studySet)}
              className="px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold text-xs flex items-center gap-1.5 transition-colors whitespace-nowrap"
            >
              <HelpCircle className="w-4 h-4 text-violet-600" />
              <span>Take Quiz</span>
            </button>
            <button
              onClick={() => onOpenAudio(studySet)}
              className="px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold text-xs flex items-center gap-1.5 transition-colors whitespace-nowrap"
              title="Listen to Audio Lesson"
            >
              <Headphones className="w-4 h-4 text-amber-600" />
              <span className="hidden sm:inline">Audio</span>
            </button>
            <button
              onClick={() => onOpenExplainer(studySet)}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-rose-50 to-amber-50 hover:from-rose-100 hover:to-amber-100 border border-rose-200/80 text-rose-700 font-semibold text-xs flex items-center gap-1.5 shadow-2xs transition-all whitespace-nowrap active:scale-95"
              title="Open StudyFetch-Style AI Explainer Video"
            >
              <Video className="w-4 h-4 text-rose-600" />
              <span>Explainer Video</span>
              <span className="px-1.5 py-0.2 rounded bg-rose-600 text-white text-[9px] font-bold uppercase">AI</span>
            </button>

            {onDeleteStudySet && (
              <button
                onClick={() => onDeleteStudySet(studySet)}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition-colors shrink-0"
                title="Delete this Study Set"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Tab Strip */}
        <div className="max-w-6xl mx-auto flex gap-6 mt-4 border-t border-slate-100 pt-3 text-xs font-semibold text-slate-600">
          <button
            onClick={() => setActiveTab('notes')}
            className={`pb-2 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'notes' ? 'border-indigo-600 text-indigo-700 font-bold' : 'border-transparent hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>AI Notes</span>
          </button>
          <button
            onClick={() => setActiveTab('flashcards')}
            className={`pb-2 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'flashcards' ? 'border-indigo-600 text-indigo-700 font-bold' : 'border-transparent hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Flashcards ({flashcards.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('quiz')}
            className={`pb-2 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'quiz' ? 'border-indigo-600 text-indigo-700 font-bold' : 'border-transparent hover:text-slate-900'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Quizzes</span>
          </button>
          <button
            onClick={() => setActiveTab('sources')}
            className={`pb-2 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'sources' ? 'border-indigo-600 text-indigo-700 font-bold' : 'border-transparent hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Source Materials ({studySet.materials?.length || 0})</span>
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-6 w-full flex-1">
        {loading ? (
          <div className="py-16 text-center">
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-xs text-slate-500 font-medium">Loading study materials...</p>
          </div>
        ) : (
          <>
            {/* TAB: NOTES */}
            {activeTab === 'notes' && (
              <div className="space-y-6 animate-fade-in">
                {currentNote ? (
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider bg-indigo-50 px-2 py-0.5 rounded">
                            {currentNote.type} Notes
                          </span>
                          <span className="text-xs text-slate-400">
                            Source grounded by Nora
                          </span>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 font-serif mt-2">{currentNote.title}</h2>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleExportNotes}
                          className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-medium flex items-center gap-1.5"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Export Markdown</span>
                        </button>
                      </div>
                    </div>

                    {/* Executive Summary */}
                    {currentNote.summary && (
                      <div className="mt-6 p-4 rounded-xl bg-indigo-50/50 border border-indigo-100">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-1.5 mb-1.5">
                          <Sparkles className="w-4 h-4 text-indigo-600" />
                          <span>Executive Summary</span>
                        </h4>
                        <p className="text-sm text-indigo-950 leading-relaxed font-sans">{currentNote.summary}</p>
                      </div>
                    )}

                    {/* Structured Sections */}
                    <div className="mt-8 space-y-8">
                      {currentNote.sections.map((section, idx) => (
                        <div key={section.id || idx} className="border-b border-slate-100 pb-8 last:border-b-0">
                          <h3 className="text-xl font-bold text-slate-900 font-serif mb-3 flex items-center gap-2">
                            <span className="text-sm font-sans font-bold text-indigo-600 bg-indigo-50 w-6 h-6 rounded-md flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <span>{section.heading}</span>
                          </h3>

                          <div className="text-sm text-slate-700 leading-relaxed space-y-3 font-sans">
                            <p>{section.content}</p>
                          </div>

                          {/* Key Terms */}
                          {section.keyTerms && section.keyTerms.length > 0 && (
                            <div className="mt-4 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">Key Vocabulary & Definitions</h5>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                {section.keyTerms.map((term, tIdx) => (
                                  <div key={tIdx} className="bg-white p-2.5 rounded-lg border border-slate-200">
                                    <strong className="text-indigo-950 block">{term.term}</strong>
                                    <span className="text-slate-600">{term.definition}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Takeaways / Citations */}
                          {section.citations && section.citations.length > 0 && (
                            <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                              <span>Source Grounding:</span>
                              {section.citations.map((c, cIdx) => (
                                <span 
                                  key={cIdx} 
                                  onClick={() => setSelectedCitation(c.quote || c.sourceName)}
                                  className="text-indigo-600 hover:underline cursor-pointer bg-indigo-50 px-2 py-0.5 rounded font-mono text-[11px]"
                                >
                                  "{c.quote?.slice(0, 40) || c.sourceName}..."
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
                    <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <h3 className="font-bold text-slate-900">No notes generated yet</h3>
                    <p className="text-xs text-slate-500 mt-1">Upload materials to create comprehensive structured notes.</p>
                  </div>
                )}
              </div>
            )}

            {/* TAB: FLASHCARDS PREVIEW */}
            {activeTab === 'flashcards' && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-500">{flashcards.length} Spaced Repetition Flashcards in this study deck</p>
                  <button
                    onClick={() => onOpenFlashcards(studySet)}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm flex items-center gap-1.5"
                  >
                    <Layers className="w-4 h-4" />
                    <span>Launch Flashcard Session</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {flashcards.map((card, idx) => (
                    <div key={card.id || idx} className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-indigo-300 transition-colors">
                      <div>
                        <div className="flex items-center justify-between text-[11px] text-slate-400 pb-2 border-b border-slate-100">
                          <span className="font-semibold text-indigo-600 uppercase">{card.type}</span>
                          <span className={`px-2 py-0.5 rounded font-medium ${
                            card.mastery === 'mastered' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {card.mastery}
                          </span>
                        </div>
                        <h4 className="font-bold text-sm text-slate-900 mt-3 font-serif">{card.front}</h4>
                        <div className="mt-3 p-3 bg-slate-50 rounded-lg text-xs text-slate-700 border border-slate-100">
                          <strong className="block text-slate-500 text-[10px] uppercase tracking-wider mb-1">Answer</strong>
                          {card.back}
                        </div>
                      </div>

                      {card.explanation && (
                        <p className="text-[11px] text-slate-400 mt-3 italic">
                          Context: {card.explanation}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: QUIZ PREVIEW */}
            {activeTab === 'quiz' && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-500">{quizzes[0]?.questions.length || 0} Questions Ready</p>
                  <button
                    onClick={() => onOpenQuiz(studySet)}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm flex items-center gap-1.5"
                  >
                    <HelpCircle className="w-4 h-4" />
                    <span>Start Practice Quiz</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {quizzes[0]?.questions.map((q, idx) => (
                    <div key={q.id || idx} className="bg-white p-5 rounded-xl border border-slate-200">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-bold text-slate-400">Q{idx + 1}</span>
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                          {q.type.replace('_', ' ')}
                        </span>
                        {q.topic && <span className="text-[11px] text-indigo-600 font-medium ml-auto">{q.topic}</span>}
                      </div>
                      <h4 className="font-semibold text-sm text-slate-900">{q.question}</h4>

                      {q.options && (
                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          {q.options.map((opt, oIdx) => (
                            <div 
                              key={oIdx}
                              className={`p-2.5 rounded-lg border text-slate-700 ${
                                opt === q.correctAnswer ? 'bg-emerald-50/60 border-emerald-300 font-medium text-emerald-950' : 'bg-slate-50 border-slate-200'
                              }`}
                            >
                              {opt}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: SOURCES */}
            {activeTab === 'sources' && (
              <div className="space-y-4 animate-fade-in">
                <h3 className="font-bold text-slate-900 text-sm font-serif">Original Attached Materials</h3>
                <div className="space-y-3">
                  {studySet.materials.map((mat) => (
                    <div key={mat.id} className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col justify-between">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                              {mat.type}
                            </span>
                            <span className="text-xs text-slate-400">
                              Uploaded {new Date(mat.uploadedAt).toLocaleDateString()}
                            </span>
                          </div>
                          <h4 className="font-bold text-slate-900 mt-2">{mat.name}</h4>
                        </div>
                      </div>

                      <div className="mt-4 p-3 bg-slate-50 rounded-lg text-xs text-slate-600 font-mono max-h-40 overflow-y-auto leading-relaxed border border-slate-200">
                        {mat.content.slice(0, 500)}...
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Citation Modal / Flyout if clicked */}
      {selectedCitation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full border border-slate-200 shadow-2xl">
            <h4 className="font-bold text-slate-900 text-sm font-serif mb-2">Source Material Citation</h4>
            <p className="text-xs text-slate-600 italic bg-slate-50 p-4 rounded-xl border border-slate-200 leading-relaxed">
              "{selectedCitation}"
            </p>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setSelectedCitation(null)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
