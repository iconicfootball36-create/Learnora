import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Flame, 
  Clock, 
  Layers, 
  HelpCircle, 
  CheckCircle2, 
  ArrowLeft,
  TrendingUp,
  BrainCircuit,
  Calendar,
  Zap,
  Target
} from 'lucide-react';
import { UserProfile, QuizAttempt } from '../types';
import { DBService } from '../services/dbService';

interface ProgressViewProps {
  userId: string;
  profile: UserProfile | null;
  onBack?: () => void;
}

export const ProgressView: React.FC<ProgressViewProps> = ({ userId, profile, onBack }) => {
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProgress();
  }, [userId]);

  const loadProgress = async () => {
    try {
      const fetched = await DBService.getQuizAttempts(userId);
      setAttempts(fetched);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const totalQuizzes = attempts.length;
  const averageAccuracy = totalQuizzes > 0 
    ? Math.round(attempts.reduce((sum, a) => sum + (a.accuracy || 0), 0) / totalQuizzes) 
    : 85;

  // Aggregate weak and strong topics
  const allWeak = attempts.flatMap(a => a.weakTopics || []);
  const allStrong = attempts.flatMap(a => a.strongTopics || []);

  const topWeakTopics = Array.from(new Set(allWeak)).slice(0, 5);
  const topStrongTopics = Array.from(new Set(allStrong)).slice(0, 5);

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 font-sans overflow-y-auto">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-sm text-slate-900 font-serif">Learning Analytics & Mastery</h2>
            <p className="text-[11px] text-slate-500">Track streaks, spaced retention, and diagnosed weak topics</p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 sm:p-8 w-full flex-1 space-y-6">
        {/* Top metrics grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-2">
              <Flame className="w-4 h-4 fill-amber-500" />
            </div>
            <span className="text-xs text-slate-500 font-semibold">Active Streak</span>
            <span className="text-2xl font-bold text-slate-900 block mt-0.5">{profile?.streakDays || 4} Days</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2">
              <Clock className="w-4 h-4" />
            </div>
            <span className="text-xs text-slate-500 font-semibold">Study Time</span>
            <span className="text-2xl font-bold text-slate-900 block mt-0.5">{profile?.totalStudyMinutes || 128} mins</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <span className="text-xs text-slate-500 font-semibold">Avg. Accuracy</span>
            <span className="text-2xl font-bold text-slate-900 block mt-0.5">{averageAccuracy}%</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center mb-2">
              <Trophy className="w-4 h-4" />
            </div>
            <span className="text-xs text-slate-500 font-semibold">Knowledge Points</span>
            <span className="text-2xl font-bold text-slate-900 block mt-0.5">{profile?.points || 340} pts</span>
          </div>
        </div>

        {/* Strengths & Weak Areas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Weak spots detected */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
            <h3 className="font-bold text-base text-slate-900 font-serif flex items-center gap-2 mb-2">
              <Target className="w-5 h-5 text-rose-500" />
              <span>Diagnosed Priority Review Areas</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Nora detected these concepts from missed quiz questions & flashcard review.
            </p>

            {topWeakTopics.length > 0 ? (
              <div className="space-y-2">
                {topWeakTopics.map((topic, i) => (
                  <div key={i} className="p-3 bg-rose-50/60 rounded-xl border border-rose-100 flex items-center justify-between text-xs">
                    <span className="font-semibold text-rose-950">{topic}</span>
                    <span className="text-[11px] font-medium text-rose-700 bg-rose-100/70 px-2 py-0.5 rounded">
                      Needs 10 min review
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-slate-50 rounded-xl text-center text-xs text-slate-500">
                No weak topics flagged yet. Take more quizzes to diagnose retention!
              </div>
            )}
          </div>

          {/* Mastered Topics */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
            <h3 className="font-bold text-base text-slate-900 font-serif flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <span>Mastered Knowledge Areas</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Concepts with over 80% active recall consistency.
            </p>

            {topStrongTopics.length > 0 ? (
              <div className="space-y-2">
                {topStrongTopics.map((topic, i) => (
                  <div key={i} className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 flex items-center justify-between text-xs">
                    <span className="font-semibold text-emerald-950">{topic}</span>
                    <span className="text-[11px] font-medium text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded">
                      Mastered
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-slate-50 rounded-xl text-center text-xs text-slate-500">
                Keep studying to unlock concept mastery badges!
              </div>
            )}
          </div>
        </div>

        {/* Recent Quiz Attempts */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
          <h3 className="font-bold text-base text-slate-900 font-serif mb-4">Recent Quiz Performance</h3>
          {attempts.length > 0 ? (
            <div className="space-y-2">
              {attempts.map((att) => (
                <div key={att.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-slate-900 block">
                      Score: {att.score}% ({att.score >= 70 ? 'Passed' : 'Needs Review'})
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {new Date(att.completedAt).toLocaleString()}
                    </span>
                  </div>
                  <span className={`px-2.5 py-1 rounded-lg font-bold text-xs ${
                    att.score >= 80 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {att.score}%
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400">No attempts logged yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};
