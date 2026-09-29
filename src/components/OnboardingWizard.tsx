import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Check, 
  ArrowRight, 
  GraduationCap, 
  Target, 
  Sparkles, 
  Clock, 
  BrainCircuit, 
  Compass,
  Smile
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { EducationLevel, ProficiencyLevel, LearningGoal, LearningStyle, StudyTimePerDay } from '../types';

interface OnboardingProps {
  onComplete: () => void;
}

export const OnboardingWizard: React.FC<OnboardingProps> = ({ onComplete }) => {
  const { profile, updateProfileData } = useAuth();
  const [step, setStep] = useState(1);
  const totalSteps = 6;

  // Form states
  const [educationLevel, setEducationLevel] = useState<EducationLevel>(profile?.educationLevel || 'University');
  const [customEducation, setCustomEducation] = useState('');
  const [proficiencyLevel, setProficiencyLevel] = useState<ProficiencyLevel>(profile?.proficiencyLevel || 'Intermediate');
  const [primaryGoal, setPrimaryGoal] = useState<LearningGoal>(profile?.primaryGoal || 'Understand my classes');
  const [customGoal, setCustomGoal] = useState('');
  const [learningStyles, setLearningStyles] = useState<LearningStyle[]>(
    profile?.learningStyles?.length ? profile.learningStyles : ['Interactive tutoring', 'Flashcards', 'Practice questions']
  );
  const [dailyStudyTime, setDailyStudyTime] = useState<StudyTimePerDay>(profile?.dailyStudyTime || '1 hour');
  const [tutorNickname, setTutorNickname] = useState(profile?.tutorNickname || profile?.displayName || 'Learner');
  const [saving, setSaving] = useState(false);

  const toggleLearningStyle = (style: LearningStyle) => {
    if (learningStyles.includes(style)) {
      if (learningStyles.length > 1) {
        setLearningStyles(learningStyles.filter(s => s !== style));
      }
    } else {
      setLearningStyles([...learningStyles, style]);
    }
  };

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      handleFinalize();
    }
  };

  const handleFinalize = async () => {
    setSaving(true);
    try {
      await updateProfileData({
        educationLevel: educationLevel === 'Other' && customEducation ? customEducation : educationLevel,
        customEducation: customEducation.trim() ? customEducation.trim() : '',
        proficiencyLevel,
        primaryGoal: primaryGoal === 'Other' && customGoal ? customGoal : primaryGoal,
        learningStyles,
        dailyStudyTime,
        tutorNickname: tutorNickname.trim() || 'Learner',
        onboardingCompleted: true
      });

      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });

      setTimeout(() => {
        onComplete();
      }, 1000);
    } catch (e) {
      console.error('Failed to save profile during onboarding:', e);
      onComplete();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between p-4 sm:p-6 md:p-10 font-sans">
      {/* Top Header & Progress */}
      <div className="max-w-2xl mx-auto w-full">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg font-serif text-slate-900">Learnora Setup</span>
          </div>
          <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full">
            Step {step} of {totalSteps}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mb-8">
          <div 
            className="bg-indigo-600 h-full transition-all duration-300 ease-out"
            style={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Interactive Step Content */}
      <div className="max-w-2xl mx-auto w-full flex-1 flex flex-col justify-center my-4">
        {/* Step 1: What are you studying? */}
        {step === 1 && (
          <div className="animate-fade-in">
            <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-4">
              <GraduationCap className="w-6 h-6" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 font-serif">What are you studying?</h2>
            <p className="text-sm text-slate-500 mt-1 mb-6">Learnora adjusts Nora's pedagogical vocabulary to your field.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                'Secondary School',
                'University',
                'Professional Certification',
                'Medical',
                'Law',
                'Technology',
                'Business',
                'Language Learning',
                'Other'
              ].map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setEducationLevel(opt as EducationLevel)}
                  className={`p-3.5 text-left rounded-xl border text-sm font-medium transition-all flex items-center justify-between ${
                    educationLevel === opt 
                      ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 font-semibold ring-2 ring-indigo-500/20' 
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <span>{opt}</span>
                  {educationLevel === opt && <Check className="w-4 h-4 text-indigo-600" />}
                </button>
              ))}
            </div>

            {educationLevel === 'Other' && (
              <div className="mt-4">
                <input
                  type="text"
                  placeholder="Specify what you are studying..."
                  value={customEducation}
                  onChange={(e) => setCustomEducation(e.target.value)}
                  className="w-full p-3 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            )}
          </div>
        )}

        {/* Step 2: What is your current level? */}
        {step === 2 && (
          <div className="animate-fade-in">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
              <Compass className="w-6 h-6" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 font-serif">What is your current level?</h2>
            <p className="text-sm text-slate-500 mt-1 mb-6">Select your familiarity with the subject matter.</p>

            <div className="space-y-3">
              {[
                { title: 'Beginner', desc: 'Starting from scratch; explain fundamental concepts with clear everyday analogies.' },
                { title: 'Intermediate', desc: 'Familiar with core concepts; ready to tackle applied problem solving.' },
                { title: 'Advanced', desc: 'Strong grasp; require deep theoretical nuance, edge cases, and high rigor.' },
                { title: 'Exam preparation', desc: 'High yield test focus; rapid active recall, practice exams, and weak spot remediation.' }
              ].map((lvl) => (
                <button
                  key={lvl.title}
                  type="button"
                  onClick={() => setProficiencyLevel(lvl.title as ProficiencyLevel)}
                  className={`w-full p-4 text-left rounded-xl border transition-all flex items-start justify-between ${
                    proficiencyLevel === lvl.title 
                      ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 ring-2 ring-indigo-500/20' 
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div>
                    <h4 className="font-semibold text-sm">{lvl.title}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">{lvl.desc}</p>
                  </div>
                  {proficiencyLevel === lvl.title && <Check className="w-4 h-4 text-indigo-600 shrink-0 mt-1" />}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: What are you trying to achieve? */}
        {step === 3 && (
          <div className="animate-fade-in">
            <div className="w-12 h-12 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center mb-4">
              <Target className="w-6 h-6" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 font-serif">What are you trying to achieve?</h2>
            <p className="text-sm text-slate-500 mt-1 mb-6">We'll tailor your personalized study dashboard around this outcome.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                'Understand my classes',
                'Prepare for exams',
                'Improve my grades',
                'Learn a new subject',
                'Prepare for a certification',
                'Build practical skills',
                'Other'
              ].map((goal) => (
                <button
                  key={goal}
                  type="button"
                  onClick={() => setPrimaryGoal(goal as LearningGoal)}
                  className={`p-3.5 text-left rounded-xl border text-sm font-medium transition-all flex items-center justify-between ${
                    primaryGoal === goal 
                      ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 font-semibold ring-2 ring-indigo-500/20' 
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <span>{goal}</span>
                  {primaryGoal === goal && <Check className="w-4 h-4 text-indigo-600" />}
                </button>
              ))}
            </div>

            {primaryGoal === 'Other' && (
              <div className="mt-4">
                <input
                  type="text"
                  placeholder="Tell us what you want to achieve..."
                  value={customGoal}
                  onChange={(e) => setCustomGoal(e.target.value)}
                  className="w-full p-3 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            )}
          </div>
        )}

        {/* Step 4: How do you learn best? */}
        {step === 4 && (
          <div className="animate-fade-in">
            <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 font-serif">How do you learn best?</h2>
            <p className="text-sm text-slate-500 mt-1 mb-6">Select all formats that match your learning rhythm (multiple selections allowed).</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                'Reading',
                'Watching explanations',
                'Listening',
                'Practice questions',
                'Flashcards',
                'Interactive tutoring',
                'A mixture of everything'
              ].map((style) => {
                const isSelected = learningStyles.includes(style as LearningStyle);
                return (
                  <button
                    key={style}
                    type="button"
                    onClick={() => toggleLearningStyle(style as LearningStyle)}
                    className={`p-3.5 text-left rounded-xl border text-sm font-medium transition-all flex items-center justify-between ${
                      isSelected 
                        ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 font-semibold ring-2 ring-indigo-500/20' 
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <span>{style}</span>
                    {isSelected && <Check className="w-4 h-4 text-indigo-600" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 5: How much time can you study? */}
        {step === 5 && (
          <div className="animate-fade-in">
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-4">
              <Clock className="w-6 h-6" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 font-serif">How much time can you study daily?</h2>
            <p className="text-sm text-slate-500 mt-1 mb-6">We will calculate achievable pacing and daily task targets.</p>

            <div className="space-y-3">
              {[
                { time: '15 minutes', note: 'Micro-learning: Quick flashcards & 1 quiz' },
                { time: '30 minutes', note: 'Focused session: Notes review + targeted practice' },
                { time: '1 hour', note: 'Standard session: Concept lecture + flashcard retention' },
                { time: '2 hours', note: 'Deep study: Timed practice exam + Socratic tutoring' },
                { time: '3+ hours', note: 'Intensive immersion: Comprehensive curriculum mastery' }
              ].map((item) => (
                <button
                  key={item.time}
                  type="button"
                  onClick={() => setDailyStudyTime(item.time as StudyTimePerDay)}
                  className={`w-full p-4 text-left rounded-xl border transition-all flex items-center justify-between ${
                    dailyStudyTime === item.time 
                      ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 ring-2 ring-indigo-500/20' 
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div>
                    <span className="font-semibold text-sm">{item.time}</span>
                    <span className="text-xs text-slate-500 ml-3">{item.note}</span>
                  </div>
                  {dailyStudyTime === item.time && <Check className="w-4 h-4 text-indigo-600" />}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 6: What should Nora call you? */}
        {step === 6 && (
          <div className="animate-fade-in">
            <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
              <Smile className="w-6 h-6" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 font-serif">What should your AI tutor call you?</h2>
            <p className="text-sm text-slate-500 mt-1 mb-6">Nora will address you by this name during study conversations and feedback.</p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Your First Name or Nickname</label>
              <input
                type="text"
                required
                value={tutorNickname}
                onChange={(e) => setTutorNickname(e.target.value)}
                placeholder="e.g. Ademola or Alex"
                className="w-full p-3.5 text-base border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {/* Personalized summary card */}
            <div className="mt-6 p-4 rounded-xl bg-indigo-50/80 border border-indigo-100 text-xs text-indigo-900 space-y-2">
              <div className="font-bold flex items-center gap-1.5 text-indigo-950">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>Your Personalized Learning Profile</span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1 text-slate-700">
                <div>Field: <strong>{educationLevel}</strong></div>
                <div>Level: <strong>{proficiencyLevel}</strong></div>
                <div>Goal: <strong>{primaryGoal}</strong></div>
                <div>Commitment: <strong>{dailyStudyTime}/day</strong></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Nav Action */}
      <div className="max-w-2xl mx-auto w-full pt-4 border-t border-slate-200 flex items-center justify-between">
        {step > 1 ? (
          <button
            type="button"
            onClick={() => setStep(step - 1)}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900"
          >
            Back
          </button>
        ) : (
          <div></div>
        )}

        <button
          type="button"
          onClick={handleNext}
          disabled={saving}
          className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white font-semibold text-sm shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2"
        >
          {saving ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <>
              <span>{step === totalSteps ? 'Enter Learnora' : 'Continue'}</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
