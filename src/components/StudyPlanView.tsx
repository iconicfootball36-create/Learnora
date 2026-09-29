import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  ArrowLeft,
  ChevronRight,
  BookOpen,
  Award
} from 'lucide-react';
import { StudyPlan, StudyPlanDay } from '../types';
import { AIService } from '../services/aiService';
import { DBService } from '../services/dbService';

interface StudyPlanViewProps {
  userId: string;
  onBack?: () => void;
}

export const StudyPlanView: React.FC<StudyPlanViewProps> = ({ userId, onBack }) => {
  const [plans, setPlans] = useState<StudyPlan[]>([]);
  const [activePlan, setActivePlan] = useState<StudyPlan | null>(null);
  const [subject, setSubject] = useState('Organic Chemistry');
  const [examDate, setExamDate] = useState('2026-10-15');
  const [hoursPerWeek, setHoursPerWeek] = useState(10);
  const [confidence, setConfidence] = useState<'low' | 'medium' | 'high'>('medium');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPlans();
  }, [userId]);

  const loadPlans = async () => {
    try {
      const fetched = await DBService.getStudyPlans(userId);
      setPlans(fetched);
      if (fetched.length > 0) setActivePlan(fetched[0]);
    } catch (e) {
      console.error(e);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await AIService.generateStudyPlan({
        subject,
        examDate,
        hoursPerWeek,
        currentConfidence: confidence
      });

      const newPlan: StudyPlan = {
        ...res,
        id: 'plan_' + Date.now(),
        userId,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      await DBService.saveStudyPlan(newPlan);
      setPlans([newPlan, ...plans]);
      setActivePlan(newPlan);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const toggleTaskCompletion = async (dayIndex: number, taskId: string) => {
    if (!activePlan) return;
    const updatedSchedule = [...activePlan.schedule];
    const task = updatedSchedule[dayIndex].tasks.find(t => t.id === taskId);
    if (task) {
      task.completed = !task.completed;
      const updatedPlan = { ...activePlan, schedule: updatedSchedule, updatedAt: Date.now() };
      setActivePlan(updatedPlan);
      await DBService.saveStudyPlan(updatedPlan);
    }
  };

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
          <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center text-white">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-sm text-slate-900 font-serif">Adaptive Study Plan & Calendar</h2>
            <p className="text-[11px] text-slate-500">Paced revision schedules that adjust to your mastery</p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 sm:p-8 w-full flex-1">
        {!activePlan ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm max-w-xl mx-auto">
            <h3 className="font-bold text-lg text-slate-900 font-serif mb-1">Create Your Revision Schedule</h3>
            <p className="text-xs text-slate-500 mb-6">Tell Nora your exam timeline and target study hours.</p>

            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Target Subject or Exam *</label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Organic Chemistry, USMLE Step 1, MBE"
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Exam Date</label>
                  <input
                    type="date"
                    value={examDate}
                    onChange={(e) => setExamDate(e.target.value)}
                    className="w-full p-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Hours / Week</label>
                  <input
                    type="number"
                    min={2}
                    max={50}
                    value={hoursPerWeek}
                    onChange={(e) => setHoursPerWeek(Number(e.target.value))}
                    className="w-full p-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Current Confidence</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['low', 'medium', 'high'] as const).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setConfidence(lvl)}
                      className={`p-2 rounded-xl border text-xs capitalize font-medium transition-all ${
                        confidence === lvl 
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-900 font-bold' 
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate AI Study Schedule</span>
                  </>
                )}
              </button>
            </form>
          </div>
        ) : (
          <div className="space-y-6 animate-fade-in">
            {/* Top Plan Overview */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded">
                  Active Study Plan
                </span>
                <h3 className="text-2xl font-bold text-slate-900 font-serif mt-2">{activePlan.title}</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Target Exam: {activePlan.examDate || 'Self-paced'} • {activePlan.hoursPerWeek} hrs/week
                </p>
              </div>

              <button
                onClick={() => setActivePlan(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold"
              >
                Create New Plan
              </button>
            </div>

            {/* Daily schedule cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activePlan.schedule.map((day, dIdx) => (
                <div key={dIdx} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <span className="font-bold text-sm text-slate-900 font-serif">{day.dayName}</span>
                      <span className="text-xs text-indigo-600 font-mono font-medium">{day.date}</span>
                    </div>

                    <div className="mt-4 space-y-2.5">
                      {day.tasks.map((task) => (
                        <div
                          key={task.id}
                          onClick={() => toggleTaskCompletion(dIdx, task.id)}
                          className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-start gap-2.5 ${
                            task.completed
                              ? 'bg-slate-50 border-slate-200 text-slate-400 line-through'
                              : 'bg-white border-slate-200 hover:border-indigo-300 text-slate-800'
                          }`}
                        >
                          <div className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 mt-0.5 ${
                            task.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300'
                          }`}>
                            {task.completed && <CheckCircle2 className="w-3.5 h-3.5" />}
                          </div>
                          <div className="flex-1">
                            <span className="font-semibold block">{task.topic}</span>
                            <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3" /> {task.estimatedMinutes} mins • {task.activityType.replace('-', ' ')}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
