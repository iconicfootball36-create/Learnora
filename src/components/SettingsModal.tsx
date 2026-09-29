import React, { useState } from 'react';
import { 
  User, 
  Settings as SettingsIcon, 
  CreditCard, 
  Shield, 
  Bell, 
  Moon, 
  Sun, 
  Trash2, 
  LogOut, 
  Sparkles, 
  ArrowLeft, 
  CheckCircle2, 
  Lock,
  Smartphone
} from 'lucide-react';
import { UserProfile, UserSubscription } from '../types';
import { useAuth } from '../context/AuthContext';
import { Volume2 } from 'lucide-react';
import { ElevenLabsVoiceSelector } from './ElevenLabsVoiceSelector';
import { PWAInstallButton } from './PWAInstallButton';

interface SettingsModalProps {
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const { user, profile, updateProfileData, sendPasswordReset, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'ai' | 'voice' | 'subscription' | 'app' | 'privacy'>('profile');
  const [name, setName] = useState(profile?.displayName || '');
  const [tutorNickname, setTutorNickname] = useState(profile?.tutorNickname || '');
  const [educationLevel, setEducationLevel] = useState(profile?.educationLevel || 'University');
  const [dailyStudyTime, setDailyStudyTime] = useState(profile?.dailyStudyTime || '1 hour');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfileData({
      displayName: name,
      tutorNickname,
      educationLevel,
      dailyStudyTime
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in font-sans">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col md:flex-row relative max-h-[90vh]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 text-slate-400 hover:text-slate-700 p-1.5 rounded-full"
        >
          ✕
        </button>

        {/* Sidebar Nav */}
        <div className="w-full md:w-56 bg-slate-50 border-r border-slate-200 p-5 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-base text-slate-900 font-serif mb-4">Workspace Settings</h3>
            <div className="space-y-1">
              {[
                { id: 'profile', label: 'Student Profile', icon: User },
                { id: 'ai', label: 'Nora AI Tutor', icon: Sparkles },
                { id: 'voice', label: 'Nora Voices', icon: Volume2 },
                { id: 'subscription', label: 'Plan & Billing', icon: CreditCard },
                { id: 'app', label: 'Install App (PWA)', icon: Smartphone },
                { id: 'privacy', label: 'Privacy & Data', icon: Shield }
              ].map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                      active 
                        ? 'bg-indigo-600 text-white shadow-xs' 
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <button
            onClick={logout}
            className="w-full mt-6 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Right Content */}
        <div className="flex-1 p-6 sm:p-8 overflow-y-auto">
          {savedSuccess && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Settings updated successfully!</span>
            </div>
          )}

          {activeTab === 'profile' && (
            <form onSubmit={handleSave} className="space-y-4">
              <h4 className="font-bold text-base text-slate-900 font-serif">Profile Information</h4>
              
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">How Nora addresses you (Nickname)</label>
                <input
                  type="text"
                  value={tutorNickname}
                  onChange={(e) => setTutorNickname(e.target.value)}
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Education Level</label>
                <select
                  value={educationLevel}
                  onChange={(e) => setEducationLevel(e.target.value)}
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                >
                  <option>Secondary School</option>
                  <option>University</option>
                  <option>Professional Certification</option>
                  <option>Medical</option>
                  <option>Law</option>
                  <option>Technology</option>
                  <option>Business</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Daily Study Target</label>
                <select
                  value={dailyStudyTime}
                  onChange={(e) => setDailyStudyTime(e.target.value as any)}
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                >
                  <option>15 minutes</option>
                  <option>30 minutes</option>
                  <option>1 hour</option>
                  <option>2 hours</option>
                  <option>3+ hours</option>
                </select>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
                >
                  Save Changes
                </button>
              </div>

              {/* Account Credentials & Password Management */}
              <div className="pt-5 mt-5 border-t border-slate-200 space-y-3">
                <h5 className="font-bold text-xs text-slate-800 uppercase tracking-wider">Account Credentials</h5>
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Registered Email:</span>
                    <span className="font-medium text-slate-800">{user?.email || profile?.email || 'N/A'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Sign-In Method:</span>
                    <span className="font-medium text-indigo-700">
                      {user?.providerData?.some(p => p.providerId === 'password')
                        ? 'Email & Password'
                        : user?.providerData?.some(p => p.providerId === 'google.com')
                        ? 'Google Account'
                        : 'Learnora Student'}
                    </span>
                  </div>
                  {user?.email && (
                    <div className="pt-2 flex items-center justify-between border-t border-slate-200/60">
                      <span className="text-slate-500 text-[11px]">Need to change or reset password?</span>
                      <button
                        type="button"
                        onClick={async () => {
                          if (user.email) {
                            await sendPasswordReset(user.email);
                            setResetSent(true);
                            setTimeout(() => setResetSent(false), 4000);
                          }
                        }}
                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
                      >
                        Send Reset Link
                      </button>
                    </div>
                  )}
                  {resetSent && (
                    <p className="text-[11px] text-emerald-600 font-medium pt-1">
                      Password reset email sent! Check your inbox.
                    </p>
                  )}
                </div>
              </div>
            </form>
          )}

          {activeTab === 'ai' && (
            <div className="space-y-4">
              <h4 className="font-bold text-base text-slate-900 font-serif">Nora AI Preferences</h4>
              <p className="text-xs text-slate-500">Fine-tune Nora's pedagogy and explanation depth.</p>

              <div className="space-y-3 pt-2">
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900 block">Socratic Inquiry First</span>
                    <span className="text-slate-500">Require check-for-understanding questions before moving on</span>
                  </div>
                  <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-indigo-600" />
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900 block">Strict Source Grounding</span>
                    <span className="text-slate-500">Alert me when Nora uses general knowledge rather than uploaded files</span>
                  </div>
                  <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-indigo-600" />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'voice' && (
            <div className="space-y-4">
              <ElevenLabsVoiceSelector />
            </div>
          )}

          {activeTab === 'subscription' && (
            <div className="space-y-4">
              <h4 className="font-bold text-base text-slate-900 font-serif">Plan & Subscription</h4>
              
              <div className="p-5 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">Active Membership</span>
                  <h5 className="text-xl font-bold text-indigo-950 font-serif mt-0.5">Academic Pro</h5>
                  <p className="text-xs text-indigo-700/80 mt-1">Unlimited study sets, Socratic Nora tutoring & exam prep</p>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                  Active
                </span>
              </div>

              <div className="space-y-2 pt-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>AI Monthly Generations</span>
                  <span className="font-semibold text-slate-900">42 / Unlimited</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-indigo-600 h-full w-1/4"></div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200">
                <h5 className="font-bold text-xs text-slate-900 mb-3">Available Renewal Options:</h5>
                <div className="grid grid-cols-2 gap-2.5 text-xs">
                  <div className="p-3 rounded-xl border border-slate-200 bg-slate-50">
                    <span className="font-semibold text-slate-900 block">1 Month</span>
                    <span className="text-indigo-600 font-bold">₦2,500</span>
                  </div>
                  <div className="p-3 rounded-xl border border-indigo-200 bg-indigo-50/50">
                    <span className="font-semibold text-slate-900 block">3 Months</span>
                    <span className="text-indigo-600 font-bold">₦7,000</span>
                  </div>
                  <div className="p-3 rounded-xl border border-indigo-300 bg-indigo-50/70">
                    <span className="font-semibold text-slate-900 block">6 Months</span>
                    <span className="text-indigo-600 font-bold">₦14,000</span>
                  </div>
                  <div className="p-3 rounded-xl border border-amber-200 bg-amber-50/50">
                    <span className="font-semibold text-slate-900 block">1 Year</span>
                    <span className="text-amber-800 font-bold">₦30,000</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'app' && (
            <div className="space-y-5">
              <div>
                <h4 className="font-bold text-base text-slate-900 font-serif">Progressive Web App (PWA)</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Install Learnora to your desktop, tablet, or phone for offline revision, faster launch, and full-screen focus.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="font-bold text-xs text-indigo-950">Installable on all devices</h5>
                  <p className="text-[11px] text-indigo-700/80">Works seamlessly on Windows, macOS, Android, and iOS.</p>
                </div>
              </div>

              <div className="pt-2">
                <PWAInstallButton variant="full" />
              </div>

              <div className="pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Works offline with cached study decks and notes</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>No App Store or Google Play download required</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Instant automatic updates when new features release</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-4">
              <h4 className="font-bold text-base text-slate-900 font-serif">Privacy & Security</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                All uploaded syllabi, lecture slides, and recordings are encrypted and private to your account. We never use your university materials to train public frontier models.
              </p>

              <div className="pt-4 border-t border-slate-200 space-y-3">
                <button
                  type="button"
                  onClick={() => alert('Personal study export initiated.')}
                  className="w-full p-3 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 text-left"
                >
                  Download All Study Data (JSON / Markdown)
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
