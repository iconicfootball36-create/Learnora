import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  ArrowLeft, 
  RotateCcw, 
  Check, 
  X, 
  Clock, 
  HelpCircle, 
  Flame, 
  Sparkles,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { StudySet, Flashcard } from '../types';
import { DBService } from '../services/dbService';

interface FlashcardSessionProps {
  studySet: StudySet;
  onBack: () => void;
}

export const FlashcardSession: React.FC<FlashcardSessionProps> = ({ studySet, onBack }) => {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [stats, setStats] = useState({ mastered: 0, almost: 0, dontKnow: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCards();
  }, [studySet.id]);

  const loadCards = async () => {
    setLoading(true);
    try {
      const fetched = await DBService.getFlashcards(studySet.id);
      setCards(fetched);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const currentCard = cards[currentIndex];

  const handleRating = async (rating: 'mastered' | 'almost' | 'dontKnow') => {
    if (!currentCard) return;

    const isCorrect = rating === 'mastered';
    const masteryState = rating === 'mastered' ? 'mastered' : rating === 'almost' ? 'learning' : 'new';

    // Update database
    await DBService.updateFlashcardMastery(currentCard.id, masteryState, isCorrect);

    // Update session stats
    setStats((prev) => ({
      ...prev,
      [rating]: prev[rating] + 1
    }));

    setIsFlipped(false);

    if (currentIndex + 1 < cards.length) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setSessionCompleted(true);
      confetti({ particleCount: 70, spread: 60 });

      // Update Nora's Cognitive Memory with retention signals
      try {
        const userId = studySet.userId;
        const mem = await DBService.getCognitiveMemory(userId);
        const cardTopic = studySet.title;
        const totalCards = cards.length;
        const masteryRatio = (stats.mastered + (rating === 'mastered' ? 1 : 0)) / totalCards;

        const updatedMem = {
          ...mem,
          noraPedagogicalStrategy: {
            ...mem.noraPedagogicalStrategy,
            recentSelfAdjustment: masteryRatio > 0.7
              ? `Observed high flashcard retention (${Math.round(masteryRatio * 100)}%) on ${cardTopic}; transitioning to higher cognitive inquiry.`
              : `Flagged recall fatigue on ${cardTopic}; will offer simpler analogies and mnemonic hooks in future explanations.`,
            adaptationLevel: Math.min(100, mem.noraPedagogicalStrategy.adaptationLevel + 1),
            totalInteractionsReflected: (mem.noraPedagogicalStrategy.totalInteractionsReflected || 0) + 1
          },
          lastSelfReflectionAt: Date.now(),
          updatedAt: Date.now()
        };
        await DBService.saveCognitiveMemory(updatedMem);
      } catch (err) {
        console.error('Failed to log flashcard retention memory:', err);
      }
    }
  };

  const restartSession = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setSessionCompleted(false);
    setStats({ mastered: 0, almost: 0, dontKnow: 0 });
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-50 text-center">
        <Layers className="w-12 h-12 text-slate-300 mb-3" />
        <h3 className="font-bold text-slate-900 text-lg">No flashcards found</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm">
          This study set doesn't have any cards yet. Return to the set to generate a deck.
        </p>
        <button
          onClick={onBack}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 font-sans">
      {/* Top Header */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="font-bold text-sm text-slate-900 font-serif">Spaced Repetition Flashcards</h2>
            <p className="text-[11px] text-slate-500">{studySet.title}</p>
          </div>
        </div>

        {/* Card counter */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-600">
            {sessionCompleted ? cards.length : currentIndex + 1} / {cards.length}
          </span>
        </div>
      </div>

      {/* Main card interface */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 max-w-2xl mx-auto w-full">
        {!sessionCompleted && currentCard ? (
          <div className="w-full flex flex-col items-center">
            {/* Flashcard container */}
            <div
              onClick={() => setIsFlipped(!isFlipped)}
              className="w-full min-h-[320px] sm:min-h-[360px] bg-white rounded-3xl border border-slate-200/90 shadow-xl p-8 flex flex-col justify-between cursor-pointer hover:border-indigo-300 transition-all select-none relative group"
            >
              {/* Card Meta Top */}
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="uppercase tracking-wider font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-md">
                  {currentCard.type}
                </span>
                <span className="text-[11px]">Click card to flip</span>
              </div>

              {/* Card Body */}
              <div className="my-auto text-center py-6">
                {!isFlipped ? (
                  <div>
                    <span className="text-xs uppercase font-bold tracking-widest text-slate-400 block mb-3">Front</span>
                    <h3 className="text-xl sm:text-2xl font-bold text-slate-900 font-serif leading-snug">
                      {currentCard.front}
                    </h3>
                  </div>
                ) : (
                  <div className="animate-fade-in">
                    <span className="text-xs uppercase font-bold tracking-widest text-indigo-600 block mb-3">Back / Answer</span>
                    <h3 className="text-lg sm:text-xl font-bold text-indigo-950 font-sans leading-relaxed">
                      {currentCard.back}
                    </h3>
                    {currentCard.explanation && (
                      <p className="text-xs text-slate-500 mt-4 italic bg-slate-50 p-3 rounded-xl border border-slate-100">
                        {currentCard.explanation}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Card Bottom Grounding */}
              <div className="text-center text-[11px] text-slate-400 border-t border-slate-100 pt-3">
                {currentCard.citation?.quote ? (
                  <span>Source: "{currentCard.citation.quote.slice(0, 50)}..."</span>
                ) : (
                  <span>Grounded in {studySet.title}</span>
                )}
              </div>
            </div>

            {/* Interaction Buttons: Know it / Almost / Don't know */}
            <div className="mt-8 grid grid-cols-3 gap-3 w-full">
              <button
                type="button"
                onClick={() => handleRating('dontKnow')}
                className="py-3 px-3 rounded-2xl bg-white border border-rose-200 hover:bg-rose-50 text-rose-700 font-bold text-xs sm:text-sm flex flex-col sm:flex-row items-center justify-center gap-1.5 shadow-sm transition-all active:scale-95"
              >
                <X className="w-4 h-4 text-rose-600" />
                <span>Don't Know</span>
              </button>

              <button
                type="button"
                onClick={() => handleRating('almost')}
                className="py-3 px-3 rounded-2xl bg-white border border-amber-200 hover:bg-amber-50 text-amber-700 font-bold text-xs sm:text-sm flex flex-col sm:flex-row items-center justify-center gap-1.5 shadow-sm transition-all active:scale-95"
              >
                <Clock className="w-4 h-4 text-amber-600" />
                <span>Almost</span>
              </button>

              <button
                type="button"
                onClick={() => handleRating('mastered')}
                className="py-3 px-3 rounded-2xl bg-white border border-emerald-200 hover:bg-emerald-50 text-emerald-700 font-bold text-xs sm:text-sm flex flex-col sm:flex-row items-center justify-center gap-1.5 shadow-sm transition-all active:scale-95"
              >
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Know It!</span>
              </button>
            </div>
          </div>
        ) : (
          /* Completion Card */
          <div className="w-full bg-white rounded-3xl border border-slate-200 p-8 shadow-xl text-center animate-fade-in">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mb-4">
              <Sparkles className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 font-serif">Deck Completed!</h3>
            <p className="text-xs text-slate-500 mt-1">Your spaced repetition schedule has been updated.</p>

            <div className="my-6 grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                <span className="text-2xl font-bold text-emerald-700 block">{stats.mastered}</span>
                <span className="text-[11px] font-semibold text-emerald-600">Mastered</span>
              </div>
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-100">
                <span className="text-2xl font-bold text-amber-700 block">{stats.almost}</span>
                <span className="text-[11px] font-semibold text-amber-600">Review Soon</span>
              </div>
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-100">
                <span className="text-2xl font-bold text-rose-700 block">{stats.dontKnow}</span>
                <span className="text-[11px] font-semibold text-rose-600">Needs Work</span>
              </div>
            </div>

            <div className="flex gap-3 justify-center">
              <button
                onClick={restartSession}
                className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-colors flex items-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Review Deck Again</span>
              </button>
              <button
                onClick={onBack}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-700 transition-colors"
              >
                Back to Study Set
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
