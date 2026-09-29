import React, { useState, useEffect } from 'react';
import { 
  HelpCircle, 
  ArrowLeft, 
  Check, 
  X, 
  Sparkles, 
  Award, 
  RotateCcw,
  Clock,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { StudySet, Quiz, QuizQuestion, QuizAttempt } from '../types';
import { DBService } from '../services/dbService';

interface QuizSessionProps {
  userId: string;
  studySet: StudySet;
  onBack: () => void;
}

export const QuizSession: React.FC<QuizSessionProps> = ({ userId, studySet, onBack }) => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string | boolean>>({});
  const [showExplanation, setShowExplanation] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQuiz();
  }, [studySet.id]);

  const loadQuiz = async () => {
    setLoading(true);
    try {
      const fetched = await DBService.getQuizzes(studySet.id);
      setQuizzes(fetched);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const activeQuiz = quizzes[0];
  const questions = activeQuiz?.questions || [];
  const currentQ = questions[currentQuestionIndex];

  const handleSelectOption = (opt: string | boolean) => {
    if (showExplanation) return; // Prevent changing after submit
    setSelectedAnswers({
      ...selectedAnswers,
      [currentQ.id]: opt
    });
  };

  const handleCheckAnswer = () => {
    setShowExplanation(true);
  };

  const handleNext = async () => {
    setShowExplanation(false);
    if (currentQuestionIndex + 1 < questions.length) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Calculate score & finalize
      let correct = 0;
      const weakTopics: string[] = [];
      const strongTopics: string[] = [];

      questions.forEach((q) => {
        const userAns = selectedAnswers[q.id];
        if (String(userAns).trim().toLowerCase() === String(q.correctAnswer).trim().toLowerCase()) {
          correct++;
          if (q.topic) strongTopics.push(q.topic);
        } else {
          if (q.topic) weakTopics.push(q.topic);
        }
      });

      const score = Math.round((correct / questions.length) * 100);
      const attempt: QuizAttempt = {
        id: 'att_' + Date.now(),
        quizId: activeQuiz.id,
        studySetId: studySet.id,
        userId,
        answers: selectedAnswers,
        score,
        totalQuestions: questions.length,
        accuracy: score,
        weakTopics: Array.from(new Set(weakTopics)),
        strongTopics: Array.from(new Set(strongTopics)),
        recommendedRevision: weakTopics.length > 0 
          ? `Review: ${weakTopics.slice(0, 3).join(', ')} using Nora Tutor mode.` 
          : 'Outstanding mastery across all tested dimensions!',
        completedAt: Date.now()
      };

      await DBService.saveQuizAttempt(attempt);

      // Feed into Nora's Cognitive Self-Learning Memory
      try {
        const mem = await DBService.getCognitiveMemory(userId);
        const updatedGaps = Array.from(new Set([...mem.learnedKnowledgeGaps, ...weakTopics]));
        const updatedStrengths = Array.from(new Set([...mem.demonstratedStrengths, ...strongTopics]));
        
        const updatedMemory = {
          ...mem,
          learnedKnowledgeGaps: updatedGaps,
          demonstratedStrengths: updatedStrengths,
          noraPedagogicalStrategy: {
            ...mem.noraPedagogicalStrategy,
            recentSelfAdjustment: weakTopics.length > 0 
              ? `Calibrated diagnostic focus to prioritize review for: ${weakTopics.slice(0, 2).join(', ')}.`
              : 'Affirmed student high mastery; increased analytical challenge for upcoming lessons.',
            adaptationLevel: Math.min(100, mem.noraPedagogicalStrategy.adaptationLevel + 1),
            totalInteractionsReflected: (mem.noraPedagogicalStrategy.totalInteractionsReflected || 0) + 1
          },
          lastSelfReflectionAt: Date.now(),
          updatedAt: Date.now()
        };
        await DBService.saveCognitiveMemory(updatedMemory);

        // Record teaching evolution log
        await DBService.recordTeachingEvolutionLog({
          id: 'log_quiz_' + Date.now(),
          userId,
          interactionSummary: `Diagnostic Quiz Completed (${score}%) on ${studySet.title}`,
          studentGraspObserved: score >= 80 ? 'mastered' : score >= 50 ? 'partially-understood' : 'struggling',
          identifiedGap: weakTopics.length > 0 ? weakTopics.join(', ') : undefined,
          tutorAdjustmentMade: updatedMemory.noraPedagogicalStrategy.recentSelfAdjustment,
          timestamp: Date.now()
        });
      } catch (err) {
        console.error('Failed to update cognitive memory from quiz:', err);
      }

      setIsCompleted(true);
      confetti({ particleCount: 80, spread: 70 });
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!activeQuiz || questions.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-50 text-center">
        <HelpCircle className="w-12 h-12 text-slate-300 mb-3" />
        <h3 className="font-bold text-slate-900 text-lg">No Quiz Available</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm">
          A quiz has not been generated for this study set yet.
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

  // Calculate current score
  let correctCount = 0;
  questions.forEach(q => {
    if (selectedAnswers[q.id] && String(selectedAnswers[q.id]).trim().toLowerCase() === String(q.correctAnswer).trim().toLowerCase()) {
      correctCount++;
    }
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 font-sans">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="font-bold text-sm text-slate-900 font-serif">Diagnostic Quiz</h2>
            <p className="text-[11px] text-slate-500">{studySet.title}</p>
          </div>
        </div>

        <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full">
          Question {isCompleted ? questions.length : currentQuestionIndex + 1} of {questions.length}
        </span>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 max-w-2xl mx-auto w-full">
        {!isCompleted && currentQ ? (
          <div className="w-full bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-lg">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-4 pb-2 border-b border-slate-100">
              <span className="uppercase font-semibold text-indigo-600 tracking-wider">
                {currentQ.type.replace('_', ' ')}
              </span>
              {currentQ.topic && <span>Topic: {currentQ.topic}</span>}
            </div>

            <h3 className="text-lg sm:text-xl font-bold text-slate-900 font-serif mb-6 leading-snug">
              {currentQ.question}
            </h3>

            {/* Options */}
            <div className="space-y-3">
              {currentQ.options?.map((opt, idx) => {
                const isSelected = selectedAnswers[currentQ.id] === opt;
                const isCorrect = String(opt).trim().toLowerCase() === String(currentQ.correctAnswer).trim().toLowerCase();

                let style = 'border-slate-200 bg-white hover:border-indigo-300 text-slate-700';
                if (showExplanation) {
                  if (isCorrect) {
                    style = 'border-emerald-500 bg-emerald-50/80 text-emerald-950 font-bold';
                  } else if (isSelected && !isCorrect) {
                    style = 'border-rose-400 bg-rose-50 text-rose-950';
                  }
                } else if (isSelected) {
                  style = 'border-indigo-600 bg-indigo-50/70 text-indigo-950 ring-2 ring-indigo-500/20 font-semibold';
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={showExplanation}
                    onClick={() => handleSelectOption(opt)}
                    className={`w-full p-4 text-left rounded-xl border text-sm transition-all flex items-center justify-between ${style}`}
                  >
                    <span>{opt}</span>
                    {showExplanation && isCorrect && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
                    {showExplanation && isSelected && !isCorrect && <X className="w-4 h-4 text-rose-600 shrink-0" />}
                  </button>
                );
              })}
            </div>

            {/* Explanation box after check */}
            {showExplanation && (
              <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1.5 animate-fade-in">
                <span className="font-bold text-slate-900 block">Explanation:</span>
                <p className="leading-relaxed">{currentQ.explanation}</p>
                {currentQ.citation && (
                  <span className="text-[11px] text-slate-400 block pt-1 italic">
                    Grounding: {currentQ.citation.sourceName}
                  </span>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-slate-100">
              {!showExplanation ? (
                <button
                  type="button"
                  disabled={!selectedAnswers[currentQ.id]}
                  onClick={handleCheckAnswer}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-semibold text-xs shadow-md transition-all"
                >
                  Check Answer
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md transition-all"
                >
                  {currentQuestionIndex + 1 < questions.length ? 'Next Question' : 'View Results'}
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Completion Screen */
          <div className="w-full bg-white rounded-3xl border border-slate-200 p-8 shadow-xl text-center animate-fade-in">
            <div className="w-16 h-16 mx-auto rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 mb-4">
              <Award className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 font-serif">Quiz Completed!</h3>
            <p className="text-xs text-slate-500 mt-1">Here is your performance breakdown</p>

            <div className="my-6 p-6 rounded-2xl bg-indigo-50/60 border border-indigo-100 max-w-sm mx-auto">
              <span className="text-5xl font-bold text-indigo-700 font-serif">
                {Math.round((correctCount / questions.length) * 100)}%
              </span>
              <p className="text-xs font-semibold text-indigo-950 mt-2">
                {correctCount} out of {questions.length} Correct
              </p>
            </div>

            <div className="flex gap-3 justify-center">
              <button
                onClick={() => {
                  setCurrentQuestionIndex(0);
                  setSelectedAnswers({});
                  setShowExplanation(false);
                  setIsCompleted(false);
                }}
                className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-colors flex items-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Retry Quiz</span>
              </button>
              <button
                onClick={onBack}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-700 transition-colors"
              >
                Return to Workspace
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
