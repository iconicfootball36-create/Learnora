import React, { useState, useEffect, useRef } from 'react';
import { FIREBASE_AUTH_CONFIG, useAuth } from '../context/AuthContext';
import { 
  BrainCircuit, 
  Mail, 
  Lock, 
  User, 
  ArrowRight, 
  AlertCircle, 
  Check, 
  Sparkles, 
  Eye, 
  EyeOff, 
  KeyRound, 
  CheckCircle2, 
  ShieldCheck,
  Zap,
  GraduationCap
} from 'lucide-react';

interface AuthModalProps {
  initialMode?: 'signin' | 'signup';
  onClose: () => void;
  onSuccess: () => void;
}

type AuthMethod = 'email' | 'instant' | 'google' | 'demo';

export const AuthModal: React.FC<AuthModalProps> = ({ initialMode = 'signin', onClose, onSuccess }) => {
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>(initialMode);
  const [method, setMethod] = useState<AuthMethod>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const googleButtonRef = useRef<HTMLDivElement>(null);

  const { 
    signInWithEmail, 
    signUpWithEmail, 
    signInWithLocalEmail, 
    signInWithGoogleCredential,
    sendPasswordReset 
  } = useAuth();

  const googleAuthFlowRef = useRef({ signInWithGoogleCredential, onSuccess });
  googleAuthFlowRef.current = { signInWithGoogleCredential, onSuccess };

  useEffect(() => {
    if (method !== 'google' || mode === 'forgot') return;

    let cancelled = false;
    const loadGoogleIdentityServices = () => new Promise<void>((resolve, reject) => {
      if ((window as any).google?.accounts?.id) {
        resolve();
        return;
      }

      const existingScript = document.querySelector<HTMLScriptElement>(
        'script[src="https://accounts.google.com/gsi/client"]'
      );
      const script = existingScript || document.createElement('script');
      script.addEventListener('load', () => resolve(), { once: true });
      script.addEventListener('error', () => reject(new Error('Google sign-in could not load. Check your connection and try again.')), { once: true });

      if (!existingScript) {
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
      }
    });

    void loadGoogleIdentityServices().then(() => {
      if (cancelled || !googleButtonRef.current) return;

      const googleIdentity = (window as any).google?.accounts?.id;
      if (!googleIdentity) throw new Error('Google sign-in could not initialize. Please try again.');

      googleIdentity.initialize({
        client_id: FIREBASE_AUTH_CONFIG.oAuthClientId,
        callback: (response: { credential?: string }) => {
          if (!response.credential) {
            setError('Google did not return a sign-in credential. Please try again.');
            return;
          }

          setError(null);
          setLoading(true);
          void googleAuthFlowRef.current.signInWithGoogleCredential(response.credential)
            .then(() => googleAuthFlowRef.current.onSuccess())
            .catch((err: any) => setError(err?.message || 'Google sign-in could not complete.'))
            .finally(() => setLoading(false));
        },
      });
      googleIdentity.renderButton(googleButtonRef.current, {
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        shape: 'rectangular',
        width: Math.min(320, googleButtonRef.current.clientWidth),
      });
    }).catch((err: any) => {
      if (!cancelled) setError(err?.message || 'Google sign-in could not load.');
    });

    return () => {
      cancelled = true;
      (window as any).google?.accounts?.id?.cancel();
      googleButtonRef.current?.replaceChildren();
    };
  }, [method, mode]);

  // Password strength calculation
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: '', color: 'bg-slate-200' };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass) || /[^A-Za-z0-9]/.test(pass)) score += 1;

    switch (score) {
      case 1:
        return { score: 1, label: 'Weak', color: 'bg-rose-500' };
      case 2:
        return { score: 2, label: 'Fair', color: 'bg-amber-500' };
      case 3:
        return { score: 3, label: 'Good', color: 'bg-indigo-500' };
      case 4:
        return { score: 4, label: 'Strong', color: 'bg-emerald-500' };
      default:
        return { score: 0, label: '', color: 'bg-slate-200' };
    }
  };

  const passwordStrength = getPasswordStrength(password);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);

    try {
      if (mode === 'signin') {
        if (!email.trim() || !password) {
          throw new Error('Please enter both your email address and password.');
        }
        await signInWithEmail(email.trim(), password);
        onSuccess();
      } else if (mode === 'signup') {
        if (!name.trim()) {
          throw new Error('Please enter your full name.');
        }
        if (!email.trim()) {
          throw new Error('Please enter a valid email address.');
        }
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters long.');
        }
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match. Please verify and re-type.');
        }
        await signUpWithEmail(email.trim(), password, name.trim());
        onSuccess();
      } else if (mode === 'forgot') {
        if (!email.trim()) {
          throw new Error('Please enter your email address to receive password reset instructions.');
        }
        await sendPasswordReset(email.trim());
        setInfo(`Password reset instructions have been sent to ${email.trim()}. Please check your inbox.`);
      }
    } catch (err: any) {
      const msg = err?.message || 'Authentication failed. Please verify your details.';
      if (msg.includes('auth/wrong-password') || msg.includes('Incorrect password')) {
        setError('Incorrect password for this account. Please verify or use Instant Access.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  // Instant 1-Click Access (Passwordless)
  const handleInstantAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setError(null);
    setLoading(true);
    try {
      await signInWithLocalEmail(email.trim(), name.trim() || undefined);
      onSuccess();
    } catch (err: any) {
      setError(err?.message || 'Could not start instant session.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 w-full max-w-md overflow-hidden relative animate-scale-up my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Close Button */}
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-1.5 rounded-full transition-colors z-10"
          aria-label="Close dialog"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Modal Header */}
        <div className="p-6 sm:p-7 pb-4 text-center border-b border-slate-100 bg-gradient-to-b from-slate-50/70 to-white">
          <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-md shadow-indigo-600/20">
            <BrainCircuit className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-xl text-slate-900 font-serif">
            {mode === 'signin' && 'Welcome Back to Learnora'}
            {mode === 'signup' && 'Create Your Student Account'}
            {mode === 'forgot' && 'Reset Your Password'}
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
            {mode === 'signin' && 'Sign in to access your notes, Nora Socratic sessions, and flashcards.'}
            {mode === 'signup' && 'Join thousands of students turning course materials into high-yield mastery.'}
            {mode === 'forgot' && 'Enter your email to receive password recovery instructions.'}
          </p>

          {/* Authentication Method Selector Tabs */}
          {mode !== 'forgot' && (
            <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-xl mt-5 text-[11px] font-semibold text-slate-600">
              <button
                type="button"
                onClick={() => { setMethod('email'); setError(null); }}
                className={`py-1.5 px-1 rounded-lg transition-all text-center truncate ${
                  method === 'email' ? 'bg-white text-indigo-700 shadow-2xs font-bold' : 'hover:text-slate-900'
                }`}
              >
                Email &amp; Pass
              </button>
              <button
                type="button"
                onClick={() => { setMethod('instant'); setError(null); }}
                className={`py-1.5 px-1 rounded-lg transition-all text-center truncate flex items-center justify-center gap-1 ${
                  method === 'instant' ? 'bg-white text-indigo-700 shadow-2xs font-bold' : 'hover:text-slate-900'
                }`}
              >
                <Zap className="w-3 h-3 text-amber-500 shrink-0" />
                <span>Instant</span>
              </button>
              <button
                type="button"
                onClick={() => { setMethod('google'); setError(null); }}
                className={`py-1.5 px-1 rounded-lg transition-all text-center truncate ${
                  method === 'google' ? 'bg-white text-indigo-700 shadow-2xs font-bold' : 'hover:text-slate-900'
                }`}
              >
                Google
              </button>
            </div>
          )}
        </div>

        {/* Modal Form Body */}
        <div className="p-6 sm:p-7 pt-4 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs flex items-start gap-2.5 animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <div className="flex-1">
                <span className="font-semibold block text-rose-900">Notice</span>
                <span className="text-[11px] leading-relaxed">{error}</span>
                {email && (
                  <button
                    type="button"
                    onClick={() => handleInstantAccess({ preventDefault: () => {} } as any)}
                    className="mt-1.5 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 underline block"
                  >
                    → Enter immediately with 1-click Instant Session as {email}
                  </button>
                )}
              </div>
            </div>
          )}

          {info && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs flex items-start gap-2.5 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <div className="flex-1">
                <span className="font-semibold block text-emerald-950">Success</span>
                <span className="text-[11px] leading-relaxed">{info}</span>
              </div>
            </div>
          )}

          {/* METHOD 1: EMAIL & PASSWORD */}
          {(method === 'email' || mode === 'forgot') && (
            <form onSubmit={handleEmailSubmit} className="space-y-3.5">
              {mode === 'signup' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g., Alex Morgan"
                      className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all placeholder:text-slate-400"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@university.edu or gmail"
                    className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>

              {mode !== 'forgot' && (
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold text-slate-700">Password</label>
                    {mode === 'signin' && (
                      <button
                        type="button"
                        onClick={() => { setMode('forgot'); setError(null); setInfo(null); }}
                        className="text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={mode === 'signup' ? 'Create a secure password (min. 6 chars)' : 'Enter your password'}
                      className="w-full pl-9 pr-10 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all placeholder:text-slate-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-1"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {mode === 'signup' && password.length > 0 && (
                    <div className="mt-2 space-y-1 animate-fade-in">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">Password strength:</span>
                        <span className="font-semibold text-slate-700">{passwordStrength.label}</span>
                      </div>
                      <div className="grid grid-cols-4 gap-1.5 h-1.5 w-full">
                        <div className={`h-full rounded-full transition-colors ${passwordStrength.score >= 1 ? passwordStrength.color : 'bg-slate-200'}`} />
                        <div className={`h-full rounded-full transition-colors ${passwordStrength.score >= 2 ? passwordStrength.color : 'bg-slate-200'}`} />
                        <div className={`h-full rounded-full transition-colors ${passwordStrength.score >= 3 ? passwordStrength.color : 'bg-slate-200'}`} />
                        <div className={`h-full rounded-full transition-colors ${passwordStrength.score >= 4 ? passwordStrength.color : 'bg-slate-200'}`} />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {mode === 'signup' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm Password</label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-type your password"
                      className="w-full pl-9 pr-10 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all placeholder:text-slate-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-1"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-xs sm:text-sm shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all active:scale-[0.99] mt-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>
                      {mode === 'signin' && 'Sign In to Workspace'}
                      {mode === 'signup' && 'Create Student Account'}
                      {mode === 'forgot' && 'Send Password Reset Link'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* METHOD 2: INSTANT PASSWORDLESS ACCESS */}
          {method === 'instant' && mode !== 'forgot' && (
            <form onSubmit={handleInstantAccess} className="space-y-3.5 py-1 animate-fade-in">
              <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-950 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-amber-900">
                  <Zap className="w-4 h-4 text-amber-600" />
                  <span>Instant Passwordless Access</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Enter your name and email to immediately start studying. No password setup required; automatically preserves your notes and sessions.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Your Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Alex or Jordan"
                    className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Your Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@university.edu"
                    className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl font-semibold text-xs sm:text-sm shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    <span>Launch Instant Study Session</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* METHOD 3: GOOGLE ACCOUNT VIEW */}
          {method === 'google' && mode !== 'forgot' && (
            <div className="space-y-4 py-1 animate-fade-in">
              <div className="p-3.5 rounded-2xl bg-indigo-50/50 border border-indigo-100 text-xs text-indigo-950 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-indigo-900">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  <span>Google Workspace &amp; Personal Accounts</span>
                </div>
                <p className="text-[11px] text-indigo-800/90 leading-relaxed">
                  Continue securely with your Google account.
                </p>
              </div>

              <div ref={googleButtonRef} className="flex min-h-10 w-full justify-center" />
            </div>
          )}

          {/* Modal Footer Mode Switch */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            {mode === 'signin' && (
              <>
                <span>New to Learnora?</span>
                <button
                  type="button"
                  onClick={() => { setMode('signup'); setError(null); }}
                  className="font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                >
                  Create an account
                </button>
              </>
            )}

            {mode === 'signup' && (
              <>
                <span>Already have an account?</span>
                <button
                  type="button"
                  onClick={() => { setMode('signin'); setError(null); }}
                  className="font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                >
                  Sign in
                </button>
              </>
            )}

            {mode === 'forgot' && (
              <div className="w-full text-center">
                <button
                  type="button"
                  onClick={() => { setMode('signin'); setError(null); }}
                  className="font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                >
                  ← Back to Sign In
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
