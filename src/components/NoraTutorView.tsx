import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Sparkles, 
  BrainCircuit, 
  HelpCircle, 
  BookOpen, 
  Check, 
  CheckCircle2,
  XCircle,
  Volume2, 
  ArrowLeft, 
  Lightbulb, 
  Maximize2, 
  Minimize2, 
  ChevronRight, 
  Flame, 
  Award, 
  Zap, 
  Sliders, 
  TrendingUp, 
  Activity, 
  History,
  RotateCcw,
  Trash2,
  MessageSquare,
  Plus,
  PanelLeftClose,
  PanelLeft,
  Clock,
  X
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { StudySet, TutorMode, TutorMessage, TeachingStyle, StudentCognitiveMemory, TeachingEvolutionLog, TutorSession } from '../types';
import { AIService } from '../services/aiService';
import { DBService } from '../services/dbService';
import { NoraCognitiveDashboard } from './NoraCognitiveDashboard';
import { VoiceService } from '../services/voiceService';
import { ElevenLabsVoiceSelector } from './ElevenLabsVoiceSelector';

interface NoraTutorViewProps {
  userId: string;
  studentName: string;
  studySet?: StudySet | null;
  onBack?: () => void;
}

export const NoraTutorView: React.FC<NoraTutorViewProps> = ({
  userId,
  studentName,
  studySet,
  onBack
}) => {
  const [activeMode, setActiveMode] = useState<TutorMode>('Teach Me');
  const [messages, setMessages] = useState<TutorMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [teachingStyles, setTeachingStyles] = useState<TeachingStyle[]>([]);
  const [selectedStyle, setSelectedStyle] = useState<string>('Socratic & Challenging');
  const [speechActive, setSpeechActive] = useState(false);
  const [showCognitiveModal, setShowCognitiveModal] = useState(false);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [cognitiveMemory, setCognitiveMemory] = useState<StudentCognitiveMemory | null>(null);
  const [pendingQuizSelections, setPendingQuizSelections] = useState<Record<string, number>>({});
  const [isSpeakingMessageId, setIsSpeakingMessageId] = useState<string | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string>(() => {
    return studySet ? `sess_${studySet.id}` : `sess_general_${userId || 'guest'}`;
  });
  const [sessions, setSessions] = useState<TutorSession[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [clearingChat, setClearingChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load list of all sessions for this student
  const refreshSessionsList = async () => {
    if (!userId) return;
    try {
      const allSessions = await DBService.getTutorSessions(userId);
      // Sort most recent first
      const sorted = allSessions.sort((a, b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt));
      setSessions(sorted);
    } catch (e) {
      console.warn('Could not load sessions list:', e);
    }
  };

  // Switch to an existing session
  const handleSelectSession = async (sess: TutorSession) => {
    if (sess.id === currentSessionId) {
      setSidebarOpen(false);
      return;
    }

    VoiceService.stop();
    setCurrentSessionId(sess.id);
    setActiveMode(sess.activeMode || 'Teach Me');
    setLoading(true);
    setSidebarOpen(false);

    try {
      const savedMessages = await DBService.getTutorMessages(sess.id);
      if (savedMessages && savedMessages.length > 0) {
        setMessages(savedMessages);
      } else {
        const local = localStorage.getItem(`learnora_chat_${sess.id}`);
        if (local) {
          try {
            setMessages(JSON.parse(local));
          } catch (e) {}
        }
      }
    } catch (e) {
      console.warn('Error switching session:', e);
    } finally {
      setLoading(false);
    }
  };

  // Start a fresh new chat session
  const handleStartNewChat = async () => {
    VoiceService.stop();
    const newSessId = 'sess_' + Date.now();
    const newTitle = studySet ? `${studySet.title} (New Session)` : 'New Socratic Exploration';

    const newSession: TutorSession = {
      id: newSessId,
      studySetId: studySet?.id,
      userId,
      title: newTitle,
      activeMode,
      identifiedWeakTopics: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    setCurrentSessionId(newSessId);
    setSidebarOpen(false);

    const welcome: TutorMessage = {
      id: 'msg_welcome_' + Date.now(),
      sessionId: newSessId,
      sender: 'nora',
      mode: activeMode,
      content: `Hello **${studentName}**! I've started a brand-new discussion.\n\n${
        studySet
          ? `I have your materials for **"${studySet.title}"** loaded. What angle or question shall we conquer in this fresh session?`
          : `I am ready. What topic, concept, or test would you like to master today?`
      }`,
      interactiveOptions: [
        'Teach me the core concept step-by-step',
        'Give me a tricky quiz question',
        'Explain this like I am 10 years old',
        'What are the most common exam pitfalls?'
      ],
      timestamp: Date.now()
    };

    setMessages([welcome]);

    try {
      await DBService.saveTutorSession(newSession);
      await DBService.saveTutorMessage(welcome);
      await refreshSessionsList();
    } catch (e) {
      console.warn('Error initializing new session in db:', e);
    }
  };

  // Delete an old chat session
  const handleDeleteSession = async (e: React.MouseEvent, sessId: string) => {
    e.stopPropagation();
    try {
      await DBService.deleteTutorSession(sessId);
      localStorage.removeItem(`learnora_chat_${sessId}`);
      setSessions((prev) => prev.filter((s) => s.id !== sessId));

      // If we just deleted the active one, start a fresh chat
      if (sessId === currentSessionId) {
        handleStartNewChat();
      }
    } catch (err) {
      console.warn('Could not delete session:', err);
    }
  };

  // Initialize session & load persistent chat history & cognitive memory
  useEffect(() => {
    const initSession = async () => {
      const activeSessId = studySet ? `sess_${studySet.id}` : `sess_general_${userId || 'guest'}`;
      setCurrentSessionId(activeSessId);

      // 1. Load cognitive memory
      if (userId) {
        try {
          const mem = await DBService.getCognitiveMemory(userId);
          setCognitiveMemory(mem);
        } catch (e) {
          console.error('Error fetching cognitive memory:', e);
        }
      }

      // 2. Refresh sessions list
      await refreshSessionsList();

      // 3. Load existing persistent chat messages from Firestore
      try {
        const savedMessages = await DBService.getTutorMessages(activeSessId);
        if (savedMessages && savedMessages.length > 0) {
          setMessages(savedMessages);
        } else {
          // Check local storage backup
          const localBackup = localStorage.getItem(`learnora_chat_${activeSessId}`);
          if (localBackup) {
            try {
              const parsed = JSON.parse(localBackup);
              if (Array.isArray(parsed) && parsed.length > 0) {
                setMessages(parsed);
                return;
              }
            } catch (err) {}
          }

          // Initial greeting tailored to student
          const welcome: TutorMessage = {
            id: 'msg_welcome_' + Date.now(),
            sessionId: activeSessId,
            sender: 'nora',
            mode: activeMode,
            content: `Hello **${studentName}**! I'm **Nora**, your adaptive personal AI lecturer.\n\n${
              studySet 
                ? `I have fully analyzed your materials for **"${studySet.title}"**. What concept should we conquer today? You can ask me to explain a tricky idea, quiz your understanding, or guide you through a step-by-step Socratic lesson.`
                : `I am ready to help you master any subject. What topic or exam are you preparing for today?`
            }`,
            interactiveOptions: [
              'Teach me the core concept step-by-step',
              'Give me a tricky quiz question',
              'Explain this like I am 10 years old',
              'What are the most common exam pitfalls?'
            ],
            timestamp: Date.now()
          };
          setMessages([welcome]);
          DBService.saveTutorMessage(welcome).catch((e) => console.warn('Could not persist welcome message:', e));

          // Also ensure an entry exists in tutorSessions
          if (userId) {
            const initialSess: TutorSession = {
              id: activeSessId,
              studySetId: studySet?.id,
              userId,
              title: studySet ? studySet.title : 'General Study Session',
              activeMode,
              identifiedWeakTopics: [],
              createdAt: Date.now(),
              updatedAt: Date.now()
            };
            DBService.saveTutorSession(initialSess).catch(() => {});
          }
        }
      } catch (err) {
        console.warn('Could not fetch saved messages, checking local storage:', err);
        const localBackup = localStorage.getItem(`learnora_chat_${activeSessId}`);
        if (localBackup) {
          try {
            const parsed = JSON.parse(localBackup);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setMessages(parsed);
            }
          } catch (e) {}
        }
      }

      // Load teaching styles
      try {
        const styles = await DBService.getTeachingStyles(userId);
        setTeachingStyles(styles);
      } catch (e) {}
    };

    initSession();
  }, [studySet?.id, userId]);

  // Persist messages backup to localStorage on every state change
  useEffect(() => {
    if (messages.length > 0 && currentSessionId) {
      try {
        localStorage.setItem(`learnora_chat_${currentSessionId}`, JSON.stringify(messages));
      } catch (e) {}
    }
  }, [messages, currentSessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (messageText?: string, quizContext?: { lastConcept?: string; wasCorrect?: boolean; userSubmittedAnswer?: string }) => {
    const textToSend = messageText || input;
    if (!textToSend.trim() || loading) return;

    const userMsg: TutorMessage = {
      id: 'usr_' + Date.now(),
      sessionId: currentSessionId,
      sender: 'user',
      content: textToSend,
      timestamp: Date.now()
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    // Persist user message to Firestore
    DBService.saveTutorMessage(userMsg).catch((e) => console.warn('Error saving user message to db:', e));

    try {
      const materialContext = studySet?.materials?.map(m => m.content).join('\n\n') || '';

      const noraResponse = await AIService.tutorChat({
        userMessage: textToSend,
        mode: activeMode,
        studyMaterialContext: materialContext,
        teachingStyle: selectedStyle,
        chatHistory: messages.slice(-6).map(m => ({ sender: m.sender, content: m.content })),
        studentName,
        cognitiveMemory,
        quizContext
      });

      const noraMsg: TutorMessage = {
        id: 'nora_' + Date.now(),
        sessionId: currentSessionId,
        sender: 'nora',
        mode: activeMode,
        content: noraResponse.content || 'Let us continue exploring this topic.',
        questionToStudent: noraResponse.questionToStudent,
        chatQuiz: noraResponse.chatQuiz,
        interactiveOptions: noraResponse.interactiveOptions || ['Can you give an analogy?', 'Test me with a harder question', 'Explain simply'],
        citations: noraResponse.citations || [],
        selfReflection: noraResponse.selfReflection,
        timestamp: Date.now()
      };

      setMessages((prev) => [...prev, noraMsg]);

      // Persist Nora message to Firestore
      DBService.saveTutorMessage(noraMsg).catch((e) => console.warn('Error saving Nora message to db:', e));

      // Also ensure session metadata is saved/updated in tutorSessions
      if (userId) {
        const sessionTitle = studySet 
          ? studySet.title 
          : textToSend.slice(0, 36) + (textToSend.length > 36 ? '...' : '');

        const sessMeta: TutorSession = {
          id: currentSessionId,
          studySetId: studySet?.id,
          userId,
          title: sessionTitle,
          activeMode,
          identifiedWeakTopics: cognitiveMemory?.learnedKnowledgeGaps || [],
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
        DBService.saveTutorSession(sessMeta).then(() => refreshSessionsList()).catch(() => {});
      }

      // Self-Learning Pipeline: Update cognitive memory and log adjustments
      if (noraResponse.selfReflection && cognitiveMemory) {
        const reflection = noraResponse.selfReflection;
        const newGaps = reflection.identifiedGap && reflection.identifiedGap.trim() 
          ? [reflection.identifiedGap.trim()] 
          : [];
        const newStrengths = reflection.demonstratedStrength && reflection.demonstratedStrength.trim()
          ? [reflection.demonstratedStrength.trim()]
          : [];

        const updatedMem: StudentCognitiveMemory = {
          ...cognitiveMemory,
          learnedKnowledgeGaps: Array.from(new Set([...cognitiveMemory.learnedKnowledgeGaps, ...newGaps])),
          demonstratedStrengths: Array.from(new Set([...cognitiveMemory.demonstratedStrengths, ...newStrengths])),
          noraPedagogicalStrategy: {
            ...cognitiveMemory.noraPedagogicalStrategy,
            recentSelfAdjustment: reflection.tutorAdjustmentMade || cognitiveMemory.noraPedagogicalStrategy.recentSelfAdjustment,
            adaptationLevel: Math.min(100, cognitiveMemory.noraPedagogicalStrategy.adaptationLevel + 1),
            totalInteractionsReflected: (cognitiveMemory.noraPedagogicalStrategy.totalInteractionsReflected || 0) + 1
          },
          lastSelfReflectionAt: Date.now(),
          updatedAt: Date.now()
        };

        setCognitiveMemory(updatedMem);
        await DBService.saveCognitiveMemory(updatedMem);

        // Record teaching evolution event
        const evolutionLog: TeachingEvolutionLog = {
          id: 'log_' + Date.now(),
          userId,
          interactionSummary: `Dialogue on: "${textToSend.slice(0, 50)}..."`,
          studentGraspObserved: reflection.studentGraspObserved || 'partially-understood',
          identifiedGap: reflection.identifiedGap || undefined,
          tutorAdjustmentMade: reflection.tutorAdjustmentMade,
          timestamp: Date.now()
        };
        await DBService.recordTeachingEvolutionLog(evolutionLog);
      }

      // Voice narration if active (ElevenLabs with fallback)
      if (speechActive) {
        VoiceService.speak({
          text: noraResponse.content
        });
      }

    } catch (e) {
      console.error(e);
      const errMsg: TutorMessage = {
        id: 'err_' + Date.now(),
        sessionId: currentSessionId,
        sender: 'nora',
        content: 'I had a momentary hiccup retrieving that academic insight. Could you rephrase your question?',
        timestamp: Date.now()
      };
      setMessages((prev) => [...prev, errMsg]);
      DBService.saveTutorMessage(errMsg).catch(() => {});
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = async () => {
    if (clearingChat) return;
    setClearingChat(true);
    try {
      VoiceService.stop();
      await DBService.clearTutorMessages(currentSessionId);
      localStorage.removeItem(`learnora_chat_${currentSessionId}`);

      const freshWelcome: TutorMessage = {
        id: 'msg_welcome_' + Date.now(),
        sessionId: currentSessionId,
        sender: 'nora',
        mode: activeMode,
        content: `Chat history reset. How would you like to proceed with **${studySet ? studySet.title : 'your study session'}**?`,
        interactiveOptions: [
          'Teach me the core concept step-by-step',
          'Give me a tricky quiz question',
          'Explain this like I am 10 years old',
          'Test my knowledge'
        ],
        timestamp: Date.now()
      };
      setMessages([freshWelcome]);
      await DBService.saveTutorMessage(freshWelcome);
    } catch (e) {
      console.warn('Error clearing chat history:', e);
    } finally {
      setClearingChat(false);
    }
  };

  const handleSelectQuizOption = (messageId: string, optionIndex: number) => {
    setPendingQuizSelections((prev) => ({
      ...prev,
      [messageId]: optionIndex
    }));
  };

  const handleSubmitChatQuiz = (msg: TutorMessage) => {
    if (!msg.chatQuiz) return;
    const selectedIdx = pendingQuizSelections[msg.id];
    if (selectedIdx === undefined) return;

    const isCorrect = selectedIdx === msg.chatQuiz.correctIndex;
    const chosenOptionText = msg.chatQuiz.options[selectedIdx];

    // Mark message as submitted in local state
    const updatedMsg: TutorMessage = {
      ...msg,
      chatQuiz: {
        ...msg.chatQuiz,
        studentAnswerIndex: selectedIdx,
        isCorrect,
        submitted: true
      }
    };

    setMessages((prev) =>
      prev.map((m) => (m.id === msg.id ? updatedMsg : m))
    );

    // Persist updated quiz state to Firestore
    DBService.saveTutorMessage(updatedMsg).catch(() => {});

    if (isCorrect) {
      confetti({ particleCount: 65, spread: 60 });
    }

    // Automatically trigger Nora's mastery-first follow-up
    const userPrompt = isCorrect
      ? `I selected "${chosenOptionText}" for the question on ${msg.chatQuiz.concept}. That was correct! What is the next concept or question?`
      : `I selected "${chosenOptionText}" for the question on ${msg.chatQuiz.concept}. I missed it (correct was "${msg.chatQuiz.options[msg.chatQuiz.correctIndex]}"). Can you explain why my choice was mistaken, teach me the intuition so I truly master it, and then test me on this concept again?`;

    handleSend(userPrompt, {
      lastConcept: msg.chatQuiz.concept,
      wasCorrect: isCorrect,
      userSubmittedAnswer: chosenOptionText
    });
  };

  const speakText = (text: string, msgId?: string) => {
    if (msgId && isSpeakingMessageId === msgId) {
      VoiceService.stop();
      setIsSpeakingMessageId(null);
      return;
    }

    if (msgId) setIsSpeakingMessageId(msgId);
    VoiceService.speak({
      text,
      onStart: () => {
        if (msgId) setIsSpeakingMessageId(msgId);
      },
      onEnd: () => {
        if (msgId) setIsSpeakingMessageId(null);
      }
    });
  };

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 min-w-0 bg-slate-50 font-sans relative overflow-x-hidden">
      {/* Desktop Nora Header */}
      <div className="hidden sm:flex bg-white border-b border-slate-200 px-4 sm:px-6 py-3.5 items-center justify-between shrink-0 z-10 shadow-xs">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {/* Chat History & Sessions Sidebar Toggle */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 sm:p-2 rounded-xl text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 transition-colors flex items-center gap-1.5 shadow-2xs"
            title="Open Chat Sessions & History"
          >
            <PanelLeft className="w-4 h-4 text-indigo-600" />
            <span className="hidden md:inline text-xs font-semibold">Chats</span>
          </button>

          {/* New Chat Quick Button */}
          <button
            onClick={handleStartNewChat}
            className="p-1.5 sm:p-2 rounded-xl text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 transition-colors flex items-center gap-1 shadow-2xs"
            title="Start New Chat"
          >
            <Plus className="w-4 h-4 text-indigo-600" />
            <span className="hidden lg:inline text-xs font-semibold">New Chat</span>
          </button>

          {onBack && (
            <button
              onClick={onBack}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-sm shrink-0">
            <BrainCircuit className="w-5 h-5" />
          </div>
          <div className="truncate max-w-[140px] sm:max-w-xs">
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-sm text-slate-900 font-serif truncate">Nora AI Lecturer</h2>
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
            </div>
            <p className="text-[11px] text-slate-500 truncate">
              {studySet ? `Grounded in: ${studySet.title}` : 'Self-Learning Socratic Tutor'}
            </p>
          </div>
        </div>

        {/* Cognitive Memory & Controls */}
        <div className="flex items-center gap-2">
          {/* AI Self-Learning Brain Trigger */}
          <button
            onClick={() => setShowCognitiveModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-50 to-violet-50 hover:from-indigo-100 hover:to-violet-100 border border-indigo-200/80 text-indigo-700 text-xs font-semibold shadow-2xs transition-all active:scale-95"
            title="Open Nora's Cognitive Mind & Self-Improvement Dashboard"
          >
            <BrainCircuit className="w-3.5 h-3.5 text-indigo-600" />
            <span className="hidden sm:inline">Nora's Memory</span>
            <span className="px-1.5 py-0.2 rounded-full bg-indigo-600 text-white text-[10px] font-mono">
              Lvl {cognitiveMemory?.noraPedagogicalStrategy?.adaptationLevel || 1}
            </span>
          </button>

          {/* Mode Pill Dropdown / Selector */}
          <div className="hidden sm:flex items-center bg-slate-100 p-0.5 rounded-xl text-xs font-semibold text-slate-600">
            {(['Explain', 'Teach Me', 'Quiz Me', 'Explain Simply', 'Go Deeper'] as TutorMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setActiveMode(mode)}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  activeMode === mode ? 'bg-white text-indigo-700 shadow-xs font-bold' : 'hover:text-slate-900'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowVoiceModal(true)}
            className="p-2 rounded-xl border border-slate-200 text-xs flex items-center gap-1.5 transition-colors bg-white text-slate-600 hover:text-indigo-600 hover:bg-slate-50"
            title="Configure Nora Voices"
          >
            <Sliders className="w-4 h-4 text-violet-600" />
          </button>

          <button
            onClick={() => setSpeechActive(!speechActive)}
            className={`p-2 rounded-xl border text-xs flex items-center gap-1.5 transition-colors ${
              speechActive ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
            title="Read responses aloud"
          >
            <Volume2 className="w-4 h-4" />
          </button>

          <button
            onClick={handleClearChat}
            disabled={clearingChat || messages.length <= 1}
            className="p-2 rounded-xl border border-slate-200 text-xs flex items-center gap-1.5 transition-colors bg-white text-slate-400 hover:text-rose-600 hover:bg-rose-50 disabled:opacity-40 disabled:hover:text-slate-400 disabled:hover:bg-white"
            title="Clear and reset chat history"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile Nora Header (Phone-optimized, zero horizontal overflow) */}
      <div className="sm:hidden flex flex-col bg-white border-b border-slate-200 shrink-0 z-10 shadow-xs">
        <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 gap-2">
          {/* Left: Avatar + Title + Level badge */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {onBack && (
              <button
                onClick={onBack}
                className="p-1 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 shrink-0"
                title="Go back"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-xs shrink-0">
              <BrainCircuit className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h2 className="font-bold text-xs text-slate-900 font-serif truncate">
                  Nora AI Lecturer
                </h2>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                <button
                  onClick={() => setShowCognitiveModal(true)}
                  className="px-1.5 py-0.2 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-mono font-semibold shrink-0"
                  title="Nora's Memory Level"
                >
                  Lv {cognitiveMemory?.noraPedagogicalStrategy?.adaptationLevel || 1}
                </button>
              </div>
              <p className="text-[10px] text-slate-500 truncate mt-0.5">
                {studySet ? `Grounded in: ${studySet.title}` : 'Self-Learning Socratic Tutor'}
              </p>
            </div>
          </div>

          {/* Right: Compact Controls Toolbar */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 transition-colors"
              title="Chat Sessions"
            >
              <PanelLeft className="w-3.5 h-3.5 text-indigo-600" />
            </button>
            <button
              onClick={handleStartNewChat}
              className="p-1.5 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 transition-colors"
              title="New Chat"
            >
              <Plus className="w-3.5 h-3.5 text-indigo-600" />
            </button>
            <button
              onClick={() => setShowVoiceModal(true)}
              className="p-1.5 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 transition-colors"
              title="Voice Settings"
            >
              <Sliders className="w-3.5 h-3.5 text-violet-600" />
            </button>
            <button
              onClick={() => setSpeechActive(!speechActive)}
              className={`p-1.5 rounded-lg border transition-colors ${
                speechActive
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                  : 'bg-white border-slate-200 text-slate-600'
              }`}
              title="Read responses aloud"
            >
              <Volume2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleClearChat}
              disabled={clearingChat || messages.length <= 1}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 disabled:opacity-30 transition-colors"
              title="Reset Chat"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Mode Switcher (Smooth hidden scrollbar, prominent active state) */}
      <div className="sm:hidden flex items-center overflow-x-auto gap-1.5 px-3 py-1.5 bg-slate-100/90 border-b border-slate-200 text-xs font-medium no-scrollbar shrink-0">
        {(['Explain', 'Teach Me', 'Quiz Me', 'Explain Simply', 'Go Deeper'] as TutorMode[]).map((mode) => (
          <button
            key={mode}
            onClick={() => setActiveMode(mode)}
            className={`px-3 py-1 rounded-full whitespace-nowrap text-xs font-semibold shrink-0 transition-all ${
              activeMode === mode
                ? 'bg-indigo-600 text-white font-bold shadow-xs ring-2 ring-indigo-600/30'
                : 'bg-white text-slate-700 border border-slate-200 hover:border-indigo-300'
            }`}
          >
            {mode}
          </button>
        ))}
      </div>

      {/* Live Self-Adjustment Status Banner */}
      {cognitiveMemory?.noraPedagogicalStrategy?.recentSelfAdjustment && (
        <div className="bg-indigo-50/80 border-b border-indigo-100 px-3 sm:px-4 py-2 flex flex-col xs:flex-row xs:items-center justify-between gap-1.5 text-xs text-indigo-900 shrink-0">
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span className="font-semibold text-indigo-950 shrink-0">Nora's Current Focus:</span>
            <span className="truncate text-slate-600 italic">
              "{cognitiveMemory.noraPedagogicalStrategy.recentSelfAdjustment}"
            </span>
          </div>
          <button
            onClick={() => setShowCognitiveModal(true)}
            className="text-[11px] font-bold text-indigo-700 hover:underline shrink-0 self-end xs:self-auto flex items-center gap-0.5"
          >
            <span>View Mind Map</span>
            <span>→</span>
          </button>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto px-3 py-3 sm:p-6 space-y-3.5 max-w-4xl mx-auto w-full min-h-0 overscroll-contain">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-2 sm:gap-3 w-full animate-fade-in ${
              msg.sender === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {msg.sender === 'nora' && (
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 mt-0.5">
                <BrainCircuit className="w-4 h-4" />
              </div>
            )}

            <div
              className={`rounded-2xl p-3.5 sm:p-5 shadow-xs leading-relaxed text-[13px] sm:text-sm break-words overflow-hidden ${
                msg.sender === 'user'
                  ? 'max-w-[88%] sm:max-w-[78%] bg-indigo-600 text-white rounded-br-xs'
                  : 'w-full max-w-full sm:max-w-[85%] md:max-w-[78%] bg-white border border-slate-200/90 text-slate-900 rounded-bl-xs'
              }`}
            >
              {/* Header with speaker label */}
              {msg.sender === 'nora' && (
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 text-xs text-slate-400">
                  <span className="font-bold text-indigo-700">Nora ({msg.mode || 'Lecturer'})</span>
                  <button
                    onClick={() => speakText(msg.content, msg.id)}
                    className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg transition-colors ${
                      isSpeakingMessageId === msg.id 
                        ? 'bg-indigo-100 text-indigo-700 font-semibold' 
                        : 'hover:text-indigo-600'
                    }`}
                    title={isSpeakingMessageId === msg.id ? 'Stop speaking' : 'Read aloud'}
                  >
                    <Volume2 className={`w-3.5 h-3.5 ${isSpeakingMessageId === msg.id ? 'animate-pulse text-indigo-600' : ''}`} />
                    {isSpeakingMessageId === msg.id && (
                      <span className="text-[10px] text-indigo-600">Reading...</span>
                    )}
                  </button>
                </div>
              )}

              {/* Message text with Markdown formatting */}
              <div className="whitespace-pre-wrap space-y-2 font-sans break-words">
                {msg.content}
              </div>

              {/* Interactive In-Chat Quiz Card with Options, Checkmarks & Submit */}
              {msg.chatQuiz && (
                <div className="mt-3.5 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-indigo-50/90 via-slate-50 to-purple-50/80 border border-indigo-200/90 shadow-2xs space-y-2.5 sm:space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-indigo-100">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-indigo-900 uppercase tracking-wide">
                      <HelpCircle className="w-4 h-4 text-indigo-600" />
                      <span>Interactive Concept Check</span>
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold">
                      {msg.chatQuiz.concept || 'Knowledge Check'}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm font-semibold text-slate-900 leading-snug">
                    {msg.chatQuiz.question}
                  </p>

                  <div className="space-y-1.5 sm:space-y-2 pt-1">
                    {msg.chatQuiz.options.map((option, optIdx) => {
                      const isPendingSelected = pendingQuizSelections[msg.id] === optIdx;
                      const isSubmitted = msg.chatQuiz!.submitted;
                      const isCorrect = optIdx === msg.chatQuiz!.correctIndex;
                      const wasChosen = msg.chatQuiz!.studentAnswerIndex === optIdx;

                      let itemStyle = 'border-slate-200 bg-white hover:border-indigo-400 hover:bg-indigo-50/40 text-slate-800';
                      let checkmarkStyle = 'border-slate-300 text-transparent';

                      if (isSubmitted) {
                        if (isCorrect) {
                          itemStyle = 'border-emerald-500 bg-emerald-50 text-emerald-950 font-semibold ring-1 ring-emerald-500/30';
                          checkmarkStyle = 'border-emerald-600 bg-emerald-600 text-white';
                        } else if (wasChosen) {
                          itemStyle = 'border-rose-400 bg-rose-50 text-rose-950 line-through';
                          checkmarkStyle = 'border-rose-500 bg-rose-500 text-white';
                        } else {
                          itemStyle = 'border-slate-200 bg-slate-50/60 text-slate-400 opacity-60';
                        }
                      } else if (isPendingSelected) {
                        itemStyle = 'border-indigo-600 bg-indigo-50/90 text-indigo-950 font-medium ring-2 ring-indigo-500/20 shadow-xs';
                        checkmarkStyle = 'border-indigo-600 bg-indigo-600 text-white';
                      }

                      return (
                        <div
                          key={optIdx}
                          onClick={() => {
                            if (!isSubmitted && !loading) {
                              handleSelectQuizOption(msg.id, optIdx);
                            }
                          }}
                          className={`p-2.5 sm:p-3 rounded-xl border text-xs sm:text-sm flex items-center justify-between gap-2.5 transition-all cursor-pointer ${itemStyle} ${
                            isSubmitted || loading ? 'cursor-default pointer-events-none' : ''
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span className="w-5 h-5 rounded-md bg-slate-100 border border-slate-200 text-slate-600 font-mono text-[11px] font-bold flex items-center justify-center shrink-0">
                              {String.fromCharCode(65 + optIdx)}
                            </span>
                            <span className="leading-snug break-words">{option}</span>
                          </div>

                          <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${checkmarkStyle}`}>
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Submit Button & State Feedback */}
                  {!msg.chatQuiz.submitted ? (
                    <div className="pt-2 flex flex-col xs:flex-row xs:items-center justify-between gap-2">
                      <span className="text-[11px] text-slate-500 italic">
                        {pendingQuizSelections[msg.id] !== undefined
                          ? 'Option selected. Click Submit to verify understanding.'
                          : 'Select an option to verify your grasp with Nora.'}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleSubmitChatQuiz(msg)}
                        disabled={pendingQuizSelections[msg.id] === undefined || loading}
                        className="w-full xs:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 shrink-0"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Submit Answer</span>
                      </button>
                    </div>
                  ) : (
                    <div className="pt-2">
                      <div className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                        msg.chatQuiz.isCorrect 
                          ? 'bg-emerald-100/70 border border-emerald-300 text-emerald-900' 
                          : 'bg-rose-100/70 border border-rose-300 text-rose-900'
                      }`}>
                        {msg.chatQuiz.isCorrect ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        )}
                        <div className="leading-relaxed">
                          <strong className="block font-bold">
                            {msg.chatQuiz.isCorrect 
                              ? 'Mastered! Excellent understanding.' 
                              : `Needs Review (Correct answer: ${msg.chatQuiz.options[msg.chatQuiz.correctIndex]})`}
                          </strong>
                          <span>{msg.chatQuiz.explanation}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Nora's Real-time Self-Reflection Callout */}
              {msg.selfReflection && (
                <div className="mt-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-start gap-2">
                  <Activity className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <div className="text-[11px] leading-relaxed">
                    <span className="font-bold text-slate-900">Nora's Internal Reflection: </span>
                    <span>Observed grasp was <strong>{msg.selfReflection.studentGraspObserved}</strong>. </span>
                    <span className="italic text-indigo-900">"{msg.selfReflection.tutorAdjustmentMade}"</span>
                  </div>
                </div>
              )}

              {/* Follow-up question callout */}
              {msg.questionToStudent && (
                <div className="mt-3 p-3 bg-indigo-50/80 rounded-xl border border-indigo-100 text-indigo-950 font-medium text-xs flex items-start gap-2">
                  <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-indigo-900 mb-0.5">Check for understanding:</span>
                    <span>{msg.questionToStudent}</span>
                  </div>
                </div>
              )}

              {/* Grounded Citation Sources */}
              {msg.citations && msg.citations.length > 0 && (
                <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-400 flex flex-wrap gap-1 items-center">
                  <span>Source Grounding:</span>
                  {msg.citations.map((c, i) => (
                    <span key={i} className="bg-slate-100 px-2 py-0.5 rounded text-indigo-700 font-mono text-[10px]">
                      {c.sourceName || 'Lecture Note'}
                    </span>
                  ))}
                </div>
              )}

              {/* Interactive prompt pills */}
              {msg.interactiveOptions && msg.interactiveOptions.length > 0 && (
                <div className="mt-3.5 pt-3 border-t border-slate-100 flex flex-wrap gap-1.5">
                  {msg.interactiveOptions.map((opt, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSend(opt)}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 border border-slate-200 text-xs font-medium text-slate-700 hover:text-indigo-700 transition-colors text-left max-w-full break-words active:scale-98"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-2 sm:gap-3 justify-start animate-fade-in">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
              <BrainCircuit className="w-4 h-4" />
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-xs p-3.5 sm:p-4 shadow-xs flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce"></div>
              <div className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.2s]"></div>
              <div className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.4s]"></div>
              <span className="text-xs text-slate-400 ml-1 font-medium">Nora is reflecting and adapting...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Bottom Message Input Bar */}
      <div className="bg-white/95 backdrop-blur-md border-t border-slate-200/90 p-2 sm:p-3 shrink-0 z-20">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="mx-auto w-[calc(100%-24px)] sm:w-full max-w-4xl min-h-[52px] bg-slate-50 hover:bg-slate-100/70 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-500 rounded-[18px] border border-slate-300/80 shadow-xs flex items-center gap-1.5 sm:gap-2 px-2 py-1.5 transition-all"
        >
          {/* Left [+] button */}
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="w-9 h-9 rounded-xl bg-white hover:bg-indigo-50 border border-slate-200/80 text-slate-600 hover:text-indigo-600 flex items-center justify-center shrink-0 transition-colors shadow-2xs active:scale-95"
            title="Open Sessions & New Chat"
          >
            <Plus className="w-4 h-4 text-indigo-600" />
          </button>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onFocus={() => {
              setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
              }, 150);
            }}
            placeholder={`Ask Nora anything about ${studySet?.title ? studySet.title : 'your studies'}...`}
            className="flex-1 min-w-0 bg-transparent border-0 focus:outline-none focus:ring-0 text-slate-900 placeholder:text-slate-400 text-xs sm:text-sm py-2 px-1"
          />

          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="px-3 sm:px-4 h-9 bg-indigo-600 hover:bg-indigo-700 active:scale-95 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 shrink-0 font-semibold text-xs"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Send</span>
          </button>
        </form>
      </div>

      {/* Nora's Cognitive Mind & Memory Modal */}
      {showCognitiveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden flex flex-col relative max-h-[90vh]">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
                  <BrainCircuit className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 font-serif">Nora's Cognitive Self-Learning Model</h3>
                  <p className="text-[11px] text-slate-500">Autonomous adaptation, knowledge gap tracking & pedagogical evolution</p>
                </div>
              </div>
              <button
                onClick={() => setShowCognitiveModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-full"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <NoraCognitiveDashboard
                userId={userId}
                studentName={studentName}
                onClose={() => setShowCognitiveModal(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Slide-over Chat Sessions Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity animate-fade-in"
            onClick={() => setSidebarOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="relative w-80 max-w-[85vw] bg-white h-full shadow-2xl flex flex-col z-10 animate-slide-right border-r border-slate-200">
            {/* Sidebar Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
                  <BrainCircuit className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 font-serif">Nora Chat Sessions</h3>
                  <p className="text-[11px] text-slate-500">History & New Conversations</p>
                </div>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
                title="Close sidebar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* New Chat Primary Button */}
            <div className="p-3 border-b border-slate-100">
              <button
                onClick={handleStartNewChat}
                className="w-full py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-98"
              >
                <Plus className="w-4 h-4" />
                <span>Start New Chat</span>
              </button>
            </div>

            {/* Sessions List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
              <div className="px-2 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>Recent Conversations</span>
                <span className="text-[10px] font-normal lowercase">{sessions.length} sessions</span>
              </div>

              {sessions.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">
                  <MessageSquare className="w-8 h-8 mx-auto text-slate-300 mb-2 stroke-1" />
                  <p>No prior saved chats yet.</p>
                  <p className="text-[10px] mt-1 text-slate-400">New conversations you start with Nora will appear right here.</p>
                </div>
              ) : (
                sessions.map((sess) => {
                  const isActive = sess.id === currentSessionId;
                  const dateLabel = new Date(sess.updatedAt || sess.createdAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric'
                  });

                  return (
                    <div
                      key={sess.id}
                      onClick={() => handleSelectSession(sess)}
                      className={`group relative p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex items-start justify-between gap-2 ${
                        isActive
                          ? 'bg-indigo-50/90 border-indigo-200 text-indigo-950 font-medium shadow-2xs'
                          : 'bg-white border-transparent hover:border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <MessageSquare className={`w-4 h-4 shrink-0 mt-0.5 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                        <div className="truncate">
                          <p className="truncate font-semibold leading-tight text-slate-900">
                            {sess.title || 'Study Session'}
                          </p>
                          <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {dateLabel}
                            </span>
                            {sess.activeMode && (
                              <span className="px-1.5 py-0.2 bg-slate-100 rounded text-slate-600">
                                {sess.activeMode}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Delete session button */}
                      <button
                        onClick={(e) => handleDeleteSession(e, sess.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all shrink-0"
                        title="Delete chat session"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Sidebar Footer info */}
            <div className="p-3 border-t border-slate-200 bg-slate-50 text-[11px] text-slate-500 flex items-center justify-between">
              <span className="truncate">Learner: <strong>{studentName}</strong></span>
              <span className="text-[10px] text-indigo-600 font-medium">Learnora AI</span>
            </div>
          </div>
        </div>
      )}

      {/* ElevenLabs Voice Selection Modal */}
      {showVoiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl p-4 sm:p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowVoiceModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 rounded-full text-sm"
            >
              ✕
            </button>
            <ElevenLabsVoiceSelector onClose={() => setShowVoiceModal(false)} />
          </div>
        </div>
      )}
    </div>
  );
};
