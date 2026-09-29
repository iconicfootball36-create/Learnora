import React, { useState } from 'react';
import { 
  Sparkles, 
  BookOpen, 
  BrainCircuit, 
  Layers, 
  GraduationCap, 
  ArrowRight, 
  CheckCircle2, 
  Play, 
  Mic, 
  FileText, 
  ShieldCheck, 
  Star,
  ChevronRight,
  HelpCircle,
  Clock,
  Zap,
  Flame,
  Award
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

interface LandingProps {
  onGetStarted: () => void;
  onSignIn: () => void;
}

export const LandingPage: React.FC<LandingProps> = ({ onGetStarted, onSignIn }) => {
  const [activeTab, setActiveTab] = useState<'students' | 'educators'>('students');
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setFaqOpen(faqOpen === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-indigo-100 selection:text-indigo-900 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-200">
              <BrainCircuit className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-slate-900 font-serif">Learnora</span>
              <span className="hidden sm:inline-block ml-2 text-xs font-semibold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100">AI Study Workspace</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-indigo-600 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-indigo-600 transition-colors">How it works</a>
            <a href="#audience" className="hover:text-indigo-600 transition-colors">Who it's for</a>
            <a href="#pricing" className="hover:text-indigo-600 transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-indigo-600 transition-colors">FAQ</a>
          </nav>

          <div className="flex items-center gap-3">
            <PWAInstallButton variant="compact" />

            <button 
              onClick={onSignIn}
              className="text-sm font-semibold text-slate-700 hover:text-slate-950 px-3 py-2 rounded-lg transition-colors"
            >
              Sign In
            </button>
            <button 
              onClick={onGetStarted}
              className="text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white px-4 py-2.5 rounded-xl shadow-sm hover:shadow transition-all flex items-center gap-1.5"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 overflow-hidden bg-gradient-to-b from-white via-indigo-50/20 to-slate-50 border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100/80 text-indigo-700 text-xs font-semibold uppercase tracking-wider mb-6 animate-pulse">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Next-Gen Personal AI Study Workspace</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-slate-950 max-w-4xl mx-auto font-serif leading-[1.12]">
            Turn what you have into <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-indigo-800 to-violet-700">what you know.</span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Upload your lecture slides, PDFs, notes, or YouTube recordings. Learnora builds comprehensive notes, spaced-repetition flashcards, adaptive practice exams, and an interactive AI lecturer named Nora.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <button 
              onClick={onGetStarted}
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white font-semibold text-base shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
            >
              <span>Start Learning Free</span>
              <ArrowRight className="w-5 h-5" />
            </button>
            <a 
              href="#how-it-works"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold text-base transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <Play className="w-4 h-4 fill-slate-700" />
              <span>See How It Works</span>
            </a>
          </div>

          <div className="mt-8 flex items-center justify-center gap-6 text-xs text-slate-500">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Full source-grounded answers</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Mobile-first design</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Instant PWA App Install</span>
            </div>
          </div>

          {/* Interactive Workspace Mockup Preview */}
          <div className="mt-14 relative mx-auto max-w-5xl rounded-2xl border border-slate-200/80 bg-white shadow-2xl shadow-indigo-500/10 overflow-hidden text-left">
            <div className="h-10 bg-slate-100/80 border-b border-slate-200 px-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-400"></span>
                <span className="w-3 h-3 rounded-full bg-amber-400"></span>
                <span className="w-3 h-3 rounded-full bg-emerald-400"></span>
                <span className="text-xs font-mono text-slate-500 ml-3">learnora.app / study-sets / neurobiology-101</span>
              </div>
              <div className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-indigo-500" />
                <span>Nora AI Active</span>
              </div>
            </div>

            <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-6 bg-slate-50/50">
              {/* Left pane: Materials & Notes */}
              <div className="md:col-span-7 bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">Structured Notes</span>
                    <span className="text-xs text-slate-400">Source: Lecture 04 — Slide 14</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mt-3 font-serif">Action Potentials and Saltatory Conduction</h3>
                  <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                    An action potential propagates when voltage-gated Na+ channels open rapidly, depolarizing the axonal membrane. In myelinated axons, myelin sheaths formed by oligodendrocytes force currents to jump across the Nodes of Ranvier.
                  </p>
                  <div className="mt-4 p-3 bg-indigo-50/60 rounded-lg border border-indigo-100 text-xs text-indigo-950 flex items-start gap-2">
                    <Zap className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <span><strong>Nora's Key Analogy:</strong> Think of myelin like rubber insulation around a copper wire; without it, signal dissipates into surrounding tissue.</span>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> 18 Flashcards ready
                  </span>
                  <span className="flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-amber-500" /> 10 Quiz Questions
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-indigo-500" /> 6 min Audio Lesson
                  </span>
                </div>
              </div>

              {/* Right pane: Nora Tutor Dialog */}
              <div className="md:col-span-5 bg-gradient-to-b from-indigo-900 to-slate-900 text-white p-5 rounded-xl shadow-md flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 pb-3 border-b border-white/10">
                    <div className="w-7 h-7 rounded-lg bg-indigo-500 flex items-center justify-center text-white">
                      <BrainCircuit className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold">Nora Personal Lecturer</h4>
                      <p className="text-[11px] text-indigo-200">Socratic mode • Adaptive feedback</p>
                    </div>
                  </div>

                  <div className="mt-3 space-y-3 text-xs leading-relaxed">
                    <div className="bg-white/10 rounded-lg p-3 border border-white/10">
                      <p className="text-indigo-200 font-semibold mb-1">Nora:</p>
                      <p>"What would happen to transmission velocity if demyelination occurs, such as in Multiple Sclerosis?"</p>
                    </div>
                    <div className="bg-indigo-600/30 rounded-lg p-3 border border-indigo-400/20 text-slate-200 ml-4">
                      <p className="text-white font-semibold mb-1">You:</p>
                      <p>"Current leaks out, so conduction slows down or completely halts."</p>
                    </div>
                    <div className="bg-white/10 rounded-lg p-3 border border-white/10">
                      <p className="text-emerald-300 font-semibold mb-1">✓ Nora's Assessment:</p>
                      <p>"Spot on! Capacitance increases and axial current is lost. Ready for question 2?"</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <span className="px-2.5 py-1 rounded bg-white/10 text-[11px] text-indigo-200">Quiz Me</span>
                  <span className="px-2.5 py-1 rounded bg-white/10 text-[11px] text-indigo-200">Explain Simply</span>
                  <span className="px-2.5 py-1 rounded bg-white/10 text-[11px] text-indigo-200">Go Deeper</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Core Workflow (How It Works) */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-600 mb-2">Simple 3-Step Transformation</h2>
            <h3 className="text-3xl sm:text-4xl font-bold text-slate-950 font-serif">From passive files to deep mastery</h3>
            <p className="mt-3 text-slate-600">Stop re-reading textbooks 4 times. Let Learnora break your curriculum into active recall exercises.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-indigo-300 hover:shadow-lg transition-all">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-lg mb-4">
                1
              </div>
              <h4 className="text-xl font-bold text-slate-900 mb-2">Upload Any Material</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Drop your lecture PDFs, PowerPoint slides, Word docs, photos of handwritten notes, or paste YouTube lecture links. You can even record live class lectures directly in your browser.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-indigo-300 hover:shadow-lg transition-all">
              <div className="w-12 h-12 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center font-bold text-lg mb-4">
                2
              </div>
              <h4 className="text-xl font-bold text-slate-900 mb-2">Automated Studio Extraction</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                In seconds, Learnora synthesizes your content into tiered notes, spaced-repetition flashcards, chapter summaries, practice tests, and interactive audio lessons.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-indigo-300 hover:shadow-lg transition-all">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-lg mb-4">
                3
              </div>
              <h4 className="text-xl font-bold text-slate-900 mb-2">Interactive AI Mastery</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Nora tutors you with Socratic questions, assesses weak topics, simulates exams under timed conditions, and crafts an adaptive 7-day study plan leading up to test day.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section id="features" className="py-20 bg-slate-50 border-t border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-600 mb-2">Feature Suite</h2>
            <h3 className="text-3xl sm:text-4xl font-bold text-slate-950 font-serif">Every learning tool in one operating system</h3>
            <p className="mt-3 text-slate-600">Built for medical students, engineers, law candidates, and university undergraduates tackling massive syllabi.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
                <FileText className="w-5 h-5" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-1">Structured AI Notes</h4>
              <p className="text-sm text-slate-600">Choose between Quick Summary, Standard, or Comprehensive academic notes with verified source citations.</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                <Layers className="w-5 h-5" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-1">Spaced Repetition Cards</h4>
              <p className="text-sm text-slate-600">Term/definition, Q&A, and multiple choice cards that adapt review schedules based on your confidence.</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center mb-4">
                <BrainCircuit className="w-5 h-5" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-1">Nora AI Lecturer</h4>
              <p className="text-sm text-slate-600">Ask questions, request simpler analogies, or launch multi-step interactive Socratic lessons that check understanding.</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
                <Zap className="w-5 h-5" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-1">Exam Simulations</h4>
              <p className="text-sm text-slate-600">Simulate real exam conditions with timed practice tests, score breakdowns, and immediate weak-topic diagnosis.</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
                <Mic className="w-5 h-5" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-1">Live Lecture Recorder</h4>
              <p className="text-sm text-slate-600">Record in-person lectures in real time; Learnora transcribes, extracts key concepts, and generates revision cards.</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                <Sparkles className="w-5 h-5" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-1">AI Essay Grader</h4>
              <p className="text-sm text-slate-600">Paste your draft to get line-by-line constructive feedback on argumentation, academic tone, clarity, and evidence.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Target Audiences */}
      <section id="audience" className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center mb-8">
            <div className="p-1 rounded-xl bg-slate-100 border border-slate-200 flex">
              <button 
                onClick={() => setActiveTab('students')}
                className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === 'students' ? 'bg-white shadow text-indigo-700' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                For Students & Exam Takers
              </button>
              <button 
                onClick={() => setActiveTab('educators')}
                className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === 'educators' ? 'bg-white shadow text-indigo-700' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                For Tutors & Educators
              </button>
            </div>
          </div>

          {activeTab === 'students' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-slate-50 p-8 rounded-2xl border border-slate-200">
              <div>
                <h4 className="text-2xl font-bold text-slate-900 font-serif mb-4">Crush High-Volume Courses With Confidence</h4>
                <ul className="space-y-3 text-sm text-slate-600">
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                    <span>Cut study preparation time by 70% by generating cards & notes directly from 500-page syllabi.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                    <span>Never wonder what to study next — Nora surfaces concepts you failed in yesterday's quiz.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                    <span>Listen to generated audio podcasts on your commute or at the gym.</span>
                  </li>
                </ul>
                <button onClick={onGetStarted} className="mt-6 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm transition-colors">
                  Join Free Today
                </button>
              </div>
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-center">
                <div className="w-12 h-12 mx-auto rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 mb-3">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <h5 className="font-bold text-slate-900">Proven Spaced Repetition</h5>
                <p className="text-xs text-slate-500 mt-1">Supercharged with Socratic check-ins to make facts stick long after finals week.</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-slate-50 p-8 rounded-2xl border border-slate-200">
              <div>
                <h4 className="text-2xl font-bold text-slate-900 font-serif mb-4">Transform Course Materials into Teaching Assets</h4>
                <ul className="space-y-3 text-sm text-slate-600">
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                    <span>Generate quiz banks, practice exams, and reading summaries from your textbook chapters in seconds.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                    <span>Configure Custom Teaching Styles (e.g. "Professor Mode" or "Simple Mode") for differentiated instruction.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                    <span>Export notes and flashcard decks to PDF and CSV formats for your classrooms.</span>
                  </li>
                </ul>
                <button onClick={onGetStarted} className="mt-6 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm transition-colors">
                  Get Educator Access
                </button>
              </div>
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-center">
                <div className="w-12 h-12 mx-auto rounded-full bg-violet-100 flex items-center justify-center text-violet-600 mb-3">
                  <BookOpen className="w-6 h-6" />
                </div>
                <h5 className="font-bold text-slate-900">Curriculum Automation</h5>
                <p className="text-xs text-slate-500 mt-1">Spend more time mentoring and less time drafting repetitive multiple-choice questions.</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-600 mb-2">Transparent Pricing</h2>
            <h3 className="text-3xl sm:text-4xl font-bold text-slate-950 font-serif">Invest in your academic success</h3>
            <p className="mt-3 text-slate-600">Start free, upgrade anytime as your study workload expands.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
            {/* 1 Month Plan */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 flex flex-col justify-between shadow-sm hover:border-slate-300 transition-all">
              <div>
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-bold text-slate-900">1 Month</h4>
                  <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">Monthly</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">Flexible month-to-month access</p>
                <div className="mt-5 flex items-baseline gap-1">
                  <span className="text-3xl sm:text-4xl font-bold text-slate-900 font-sans">₦2,500</span>
                  <span className="text-xs text-slate-500">/ month</span>
                </div>
                <ul className="mt-6 space-y-2.5 text-xs text-slate-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Unlimited Study Sets
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Full Nora Socratic AI Tutor
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Notes, Flashcards & Practice Exams
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Audio Lessons & Podcasts
                  </li>
                </ul>
              </div>
              <button 
                onClick={onGetStarted}
                className="mt-8 w-full py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold text-xs transition-colors"
              >
                Choose 1 Month
              </button>
            </div>

            {/* 3 Months Plan */}
            <div className="bg-white p-6 rounded-2xl border border-indigo-200 flex flex-col justify-between shadow-sm hover:border-indigo-300 transition-all">
              <div>
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-bold text-slate-900">3 Months</h4>
                  <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">Semester</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">Ideal for exam or semester prep</p>
                <div className="mt-5 flex items-baseline gap-1">
                  <span className="text-3xl sm:text-4xl font-bold text-indigo-700 font-sans">₦7,000</span>
                  <span className="text-xs text-slate-500">/ 3 months</span>
                </div>
                <p className="text-[11px] text-emerald-600 font-semibold mt-1">Save ₦500 vs monthly</p>
                <ul className="mt-5 space-y-2.5 text-xs text-slate-600">
                  <li className="flex items-center gap-2 font-medium text-slate-900">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" /> Everything in 1 Month
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" /> Live Lecture Voice Recording
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" /> AI Essay Grader & Rubrics
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" /> Cognitive Mastery Analytics
                  </li>
                </ul>
              </div>
              <button 
                onClick={onGetStarted}
                className="mt-8 w-full py-2.5 rounded-xl border border-indigo-600 text-indigo-600 hover:bg-indigo-50 font-semibold text-xs transition-colors"
              >
                Choose 3 Months
              </button>
            </div>

            {/* 6 Months Plan (Most Popular) */}
            <div className="bg-white p-6 rounded-2xl border-2 border-indigo-600 relative flex flex-col justify-between shadow-xl shadow-indigo-600/10">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                Most Popular
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-bold text-slate-900">6 Months</h4>
                  <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">Academic Term</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">Full 2 semesters of continuous tutoring</p>
                <div className="mt-5 flex items-baseline gap-1">
                  <span className="text-3xl sm:text-4xl font-bold text-indigo-700 font-sans">₦14,000</span>
                  <span className="text-xs text-slate-500">/ 6 months</span>
                </div>
                <p className="text-[11px] text-emerald-600 font-semibold mt-1">Save ₦1,000 vs monthly</p>
                <ul className="mt-5 space-y-2.5 text-xs text-slate-600">
                  <li className="flex items-center gap-2 font-medium text-slate-900">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" /> Everything in 3 Months
                  </li>
                  <li className="flex items-center gap-2 font-medium text-slate-900">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" /> Priority Gemini 2.5 Flash Processing
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" /> Unlimited Flashcards & Spaced Decks
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" /> Offline PWA sync for mobile
                  </li>
                </ul>
              </div>
              <button 
                onClick={onGetStarted}
                className="mt-8 w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors shadow-md shadow-indigo-600/20"
              >
                Choose 6 Months
              </button>
            </div>

            {/* 1 Year Plan (Best Value) */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 flex flex-col justify-between shadow-sm hover:border-slate-300 transition-all">
              <div>
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-bold text-slate-900">1 Year</h4>
                  <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">Best Value</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">Complete year of university & test prep</p>
                <div className="mt-5 flex items-baseline gap-1">
                  <span className="text-3xl sm:text-4xl font-bold text-slate-900 font-sans">₦30,000</span>
                  <span className="text-xs text-slate-500">/ year</span>
                </div>
                <p className="text-[11px] text-amber-700 font-semibold mt-1">Save ₦5,000 (2 months free)</p>
                <ul className="mt-5 space-y-2.5 text-xs text-slate-600">
                  <li className="flex items-center gap-2 font-medium text-slate-900">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> All Pro features included
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Unlimited AI tutor voice conversations
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> 10GB cloud document storage
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Priority 24/7 dedicated support
                  </li>
                </ul>
              </div>
              <button 
                onClick={onGetStarted}
                className="mt-8 w-full py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold text-xs transition-colors"
              >
                Choose 1 Year
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-600 mb-2">Got questions?</h2>
            <h3 className="text-3xl font-bold text-slate-950 font-serif">Frequently Asked Questions</h3>
          </div>

          <div className="space-y-4">
            {[
              {
                q: "How is Learnora different from simple chatbot wrappers?",
                a: "Learnora does not just spit out answers. It is built as an educational operating system with source grounding. Every note, flashcard, and tutor response links directly to your uploaded materials. Nora uses Socratic inquiry to test your knowledge rather than doing your thinking for you."
              },
              {
                q: "What types of materials can I upload?",
                a: "You can upload PDFs, Word documents (.docx), PowerPoint presentations (.pptx), plain text (.txt), images of diagrams or handwritten notes, paste YouTube educational links, or record lectures directly through your computer or phone microphone."
              },
              {
                q: "Are my study notes and private materials secure?",
                a: "Yes. Your materials and generated assets are secured via Firebase enterprise authentication and strict security rules. No other student or third party can access your study sets or recordings."
              },
              {
                q: "Does Nora support scientific formulas and medical terminology?",
                a: "Absolutely. Powered by Google Gemini 2.5, Nora excels in advanced STEM fields, medical pathophysiology, jurisprudence, computer science, and foreign language learning."
              }
            ].map((faq, idx) => (
              <div key={idx} className="border border-slate-200 rounded-xl overflow-hidden">
                <button 
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-4 text-left font-semibold text-slate-900 flex justify-between items-center bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronRight className={`w-4 h-4 text-slate-500 transition-transform ${faqOpen === idx ? 'rotate-90' : ''}`} />
                </button>
                {faqOpen === idx && (
                  <div className="p-4 bg-white text-sm text-slate-600 leading-relaxed border-t border-slate-100">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-tr from-indigo-900 via-indigo-800 to-slate-950 text-white text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-5xl font-bold font-serif leading-tight">
            Ready to master your hardest classes?
          </h2>
          <p className="mt-4 text-indigo-200 text-lg max-w-xl mx-auto">
            Join thousands of university and certification students turning mountains of slides into effortless A grades.
          </p>
          <div className="mt-8 flex justify-center">
            <button 
              onClick={onGetStarted}
              className="px-8 py-4 rounded-xl bg-white text-indigo-950 font-bold text-base hover:bg-indigo-50 shadow-xl transition-all active:scale-95 flex items-center gap-2"
            >
              <span>Get Started with Learnora</span>
              <ArrowRight className="w-5 h-5 text-indigo-900" />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 py-12 text-sm border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <span className="text-lg font-bold text-white font-serif">Learnora</span>
            <span className="text-xs text-slate-500 ml-2">"Turn what you have into what you know."</span>
          </div>

          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} Learnora AI Inc. All rights reserved. Built for student academic excellence.
          </p>

          <div className="flex gap-6 text-xs text-slate-400">
            <a href="#features" className="hover:text-white">Features</a>
            <a href="#pricing" className="hover:text-white">Pricing</a>
            <a href="#faq" className="hover:text-white">Privacy & Security</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
