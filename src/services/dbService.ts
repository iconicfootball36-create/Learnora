import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  deleteDoc, 
  updateDoc 
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { 
  UserProfile, 
  StudySet, 
  StudyNote, 
  Flashcard, 
  Quiz, 
  QuizAttempt, 
  PracticeTest, 
  PracticeTestAttempt, 
  StudyPlan, 
  TutorSession, 
  TutorMessage,
  EssayFeedback,
  TeachingStyle,
  Achievement,
  NotificationItem,
  UserSubscription,
  StudentCognitiveMemory,
  TeachingEvolutionLog
} from '../types';

export class DBService {
  // Helper to remove undefined fields which Firestore rejects
  private static cleanUndefined<T extends Record<string, any>>(obj: T): T {
    const cleaned: any = {};
    for (const key of Object.keys(obj)) {
      const val = obj[key];
      if (val !== undefined) {
        if (val !== null && typeof val === 'object' && !Array.isArray(val) && !(val instanceof Date)) {
          cleaned[key] = this.cleanUndefined(val);
        } else {
          cleaned[key] = val;
        }
      }
    }
    return cleaned;
  }

  // Profiles local cache helpers
  private static getLocalCachedProfile(uid: string): UserProfile | null {
    try {
      const raw = localStorage.getItem(`learnora_profile_${uid}`);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  private static setLocalCachedProfile(profile: UserProfile): void {
    try {
      localStorage.setItem(`learnora_profile_${profile.uid}`, JSON.stringify(profile));
    } catch {
      // Storage quota or private mode
    }
  }

  // Profiles
  static async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const snap = await getDoc(doc(db, 'profiles', uid));
      if (snap.exists()) {
        const prof = snap.data() as UserProfile;
        this.setLocalCachedProfile(prof);
        return prof;
      }
      return this.getLocalCachedProfile(uid);
    } catch (e: any) {
      // If Firestore reports permission-denied or network disconnect, gracefully use local cache
      const cached = this.getLocalCachedProfile(uid);
      if (cached) return cached;
      console.warn('Notice getting profile from cloud:', e?.message || e);
      return null;
    }
  }

  static async saveUserProfile(profile: UserProfile): Promise<void> {
    this.setLocalCachedProfile(profile);
    try {
      const data = this.cleanUndefined(profile);
      await setDoc(doc(db, 'profiles', profile.uid), data, { merge: true });
    } catch (e) {
      console.warn('Notice saving profile (offline/retrying):', e);
    }
  }

  // Study Sets
  static async getStudySets(userId: string): Promise<StudySet[]> {
    try {
      const q = query(
        collection(db, 'studySets'), 
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as StudySet));
    } catch (e) {
      try {
        const q = query(collection(db, 'studySets'), where('userId', '==', userId));
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as StudySet));
      } catch (fallbackErr) {
        console.warn('Notice loading study sets from cloud:', fallbackErr);
        return [];
      }
    }
  }

  static async getStudySet(setId: string): Promise<StudySet | null> {
    const snap = await getDoc(doc(db, 'studySets', setId));
    if (snap.exists()) return { id: snap.id, ...snap.data() } as StudySet;
    return null;
  }

  static async saveStudySet(studySet: StudySet): Promise<void> {
    const data = this.cleanUndefined(studySet);
    await setDoc(doc(db, 'studySets', studySet.id), data, { merge: true });
  }

  static async deleteStudySet(setId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'studySets', setId));

      // Cleanup associated notes, flashcards, and quizzes in background
      const subCollections = ['notes', 'flashcards', 'quizzes', 'practiceTests'];
      for (const col of subCollections) {
        try {
          const q = query(collection(db, col), where('studySetId', '==', setId));
          const snap = await getDocs(q);
          const deletes = snap.docs.map(d => deleteDoc(d.ref));
          await Promise.allSettled(deletes);
        } catch (e) {
          console.warn(`Clean up error on ${col} for set ${setId}:`, e);
        }
      }
    } catch (err) {
      console.error('Error deleting study set:', err);
      throw err;
    }
  }

  static async deleteAllStudySets(userId: string): Promise<void> {
    const sets = await this.getStudySets(userId);
    for (const set of sets) {
      await this.deleteStudySet(set.id);
    }
  }

  // Notes
  static async getNotes(studySetId: string): Promise<StudyNote[]> {
    const q = query(collection(db, 'notes'), where('studySetId', '==', studySetId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as StudyNote));
  }

  static async saveNote(note: StudyNote): Promise<void> {
    const data = this.cleanUndefined(note);
    await setDoc(doc(db, 'notes', note.id), data, { merge: true });
  }

  // Flashcards
  static async getFlashcards(studySetId: string): Promise<Flashcard[]> {
    const q = query(collection(db, 'flashcards'), where('studySetId', '==', studySetId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Flashcard));
  }

  static async saveFlashcard(card: Flashcard): Promise<void> {
    const data = this.cleanUndefined(card);
    await setDoc(doc(db, 'flashcards', card.id), data, { merge: true });
  }

  static async updateFlashcardMastery(cardId: string, mastery: 'new' | 'learning' | 'mastered', isCorrect: boolean): Promise<void> {
    const cardRef = doc(db, 'flashcards', cardId);
    const snap = await getDoc(cardRef);
    if (!snap.exists()) return;
    const data = snap.data() as Flashcard;
    const timesReviewed = (data.timesReviewed || 0) + 1;
    const timesCorrect = (data.timesCorrect || 0) + (isCorrect ? 1 : 0);
    const timesMissed = (data.timesMissed || 0) + (isCorrect ? 0 : 1);
    
    // Spaced repetition interval calculation
    let nextIntervalDays = 1;
    if (isCorrect) {
      if (mastery === 'mastered') nextIntervalDays = 7;
      else if (mastery === 'learning') nextIntervalDays = 3;
    }

    await updateDoc(cardRef, {
      mastery,
      timesReviewed,
      timesCorrect,
      timesMissed,
      intervalDays: nextIntervalDays,
      nextReviewDate: Date.now() + (nextIntervalDays * 24 * 60 * 60 * 1000)
    });
  }

  // Quizzes
  static async getQuizzes(studySetId: string): Promise<Quiz[]> {
    const q = query(collection(db, 'quizzes'), where('studySetId', '==', studySetId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Quiz));
  }

  static async saveQuiz(quiz: Quiz): Promise<void> {
    const data = this.cleanUndefined(quiz);
    await setDoc(doc(db, 'quizzes', quiz.id), data, { merge: true });
  }

  static async saveQuizAttempt(attempt: QuizAttempt): Promise<void> {
    const data = this.cleanUndefined(attempt);
    await setDoc(doc(db, 'quizAttempts', attempt.id), data);
  }

  static async getQuizAttempts(userId: string): Promise<QuizAttempt[]> {
    const q = query(collection(db, 'quizAttempts'), where('userId', '==', userId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as QuizAttempt));
  }

  // Practice Tests
  static async getPracticeTests(studySetId: string): Promise<PracticeTest[]> {
    const q = query(collection(db, 'practiceTests'), where('studySetId', '==', studySetId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as PracticeTest));
  }

  static async savePracticeTest(test: PracticeTest): Promise<void> {
    const data = this.cleanUndefined(test);
    await setDoc(doc(db, 'practiceTests', test.id), data, { merge: true });
  }

  static async saveTestAttempt(attempt: PracticeTestAttempt): Promise<void> {
    const data = this.cleanUndefined(attempt);
    await setDoc(doc(db, 'testAttempts', attempt.id), data);
  }

  // Study Plans
  static async getStudyPlans(userId: string): Promise<StudyPlan[]> {
    const q = query(collection(db, 'studyPlans'), where('userId', '==', userId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as StudyPlan));
  }

  static async saveStudyPlan(plan: StudyPlan): Promise<void> {
    const data = this.cleanUndefined(plan);
    await setDoc(doc(db, 'studyPlans', plan.id), data, { merge: true });
  }

  // Tutor Messages & Sessions
  static async getTutorSessions(userId: string): Promise<TutorSession[]> {
    const q = query(collection(db, 'tutorSessions'), where('userId', '==', userId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as TutorSession));
  }

  static async saveTutorSession(session: TutorSession): Promise<void> {
    const data = this.cleanUndefined(session);
    await setDoc(doc(db, 'tutorSessions', session.id), data, { merge: true });
  }

  static async deleteTutorSession(sessionId: string): Promise<void> {
    await deleteDoc(doc(db, 'tutorSessions', sessionId));
    await this.clearTutorMessages(sessionId);
  }

  static async getTutorMessages(sessionId: string): Promise<TutorMessage[]> {
    const userId = auth.currentUser?.uid;
    if (!userId) return [];

    const q = query(collection(db, 'tutorMessages'), where('userId', '==', userId));
    const snap = await getDocs(q);
    const msgs = snap.docs
      .filter(d => d.data().sessionId === sessionId)
      .map(d => ({ id: d.id, ...d.data() } as TutorMessage));
    return msgs.sort((a, b) => a.timestamp - b.timestamp);
  }

  static async saveTutorMessage(msg: TutorMessage): Promise<void> {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('A Firebase-authenticated user is required to save chat history.');

    const data = this.cleanUndefined({ ...msg, userId });
    await setDoc(doc(db, 'tutorMessages', msg.id), data, { merge: true });
  }

  static async clearTutorMessages(sessionId: string): Promise<void> {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    const q = query(collection(db, 'tutorMessages'), where('userId', '==', userId));
    const snap = await getDocs(q);
    const deletePromises = snap.docs
      .filter(d => d.data().sessionId === sessionId)
      .map(d => deleteDoc(d.ref));
    await Promise.all(deletePromises);
  }

  // Essay Feedback
  static async getEssays(userId: string): Promise<EssayFeedback[]> {
    const q = query(collection(db, 'essays'), where('userId', '==', userId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as EssayFeedback));
  }

  static async saveEssay(essay: EssayFeedback): Promise<void> {
    const data = this.cleanUndefined(essay);
    await setDoc(doc(db, 'essays', essay.id), data, { merge: true });
  }

  // Teaching Styles
  static async getTeachingStyles(userId: string): Promise<TeachingStyle[]> {
    const q = query(collection(db, 'teachingStyles'), where('userId', '==', userId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as TeachingStyle));
  }

  static async saveTeachingStyle(style: TeachingStyle): Promise<void> {
    const data = this.cleanUndefined(style);
    await setDoc(doc(db, 'teachingStyles', style.id), data, { merge: true });
  }

  // Cognitive Memory & AI Self-Improvement
  static async getCognitiveMemory(userId: string): Promise<StudentCognitiveMemory> {
    try {
      const snap = await getDoc(doc(db, 'cognitiveMemories', userId));
      if (snap.exists()) {
        return snap.data() as StudentCognitiveMemory;
      }
    } catch (e) {
      console.warn('Could not fetch cognitive memory, building default:', e);
    }

    const defaultMemory: StudentCognitiveMemory = {
      id: userId,
      userId,
      learnedKnowledgeGaps: [],
      demonstratedStrengths: [],
      preferredExplanations: {
        usesAnalogies: true,
        technicalDepth: 'balanced',
        pacingSpeed: 'standard',
        effectiveHooks: ['Intuitive analogies', 'Step-by-step conceptual walkthroughs']
      },
      recurringMistakesCount: {},
      noraPedagogicalStrategy: {
        strategyName: 'Baseline Adaptive Socratic Mentorship',
        focusAreas: ['Active diagnostic questioning', 'Continuous scaffolding'],
        recentSelfAdjustment: 'Initialized adaptive cognitive baseline to track student learning behaviors.',
        adaptationLevel: 1,
        totalInteractionsReflected: 0
      },
      lastSelfReflectionAt: Date.now(),
      updatedAt: Date.now()
    };

    try {
      await setDoc(doc(db, 'cognitiveMemories', userId), defaultMemory);
    } catch (err) {
      console.error('Failed to initialize cognitive memory:', err);
    }

    return defaultMemory;
  }

  static async saveCognitiveMemory(memory: StudentCognitiveMemory): Promise<void> {
    const data = this.cleanUndefined(memory);
    await setDoc(doc(db, 'cognitiveMemories', memory.userId), data, { merge: true });
  }

  static async recordTeachingEvolutionLog(log: TeachingEvolutionLog): Promise<void> {
    const data = this.cleanUndefined(log);
    await setDoc(doc(db, 'teachingEvolutionLogs', log.id), data);
  }

  static async getTeachingEvolutionLogs(userId: string): Promise<TeachingEvolutionLog[]> {
    try {
      const q = query(
        collection(db, 'teachingEvolutionLogs'),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc')
      );
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as TeachingEvolutionLog));
    } catch (e) {
      const q = query(collection(db, 'teachingEvolutionLogs'), where('userId', '==', userId));
      const snap = await getDocs(q);
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as TeachingEvolutionLog));
      return items.sort((a, b) => b.timestamp - a.timestamp);
    }
  }

  // Notifications
  static async getNotifications(userId: string): Promise<NotificationItem[]> {
    const q = query(collection(db, 'notifications'), where('userId', '==', userId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as NotificationItem));
  }

  static async saveNotification(notif: NotificationItem): Promise<void> {
    const data = this.cleanUndefined(notif);
    await setDoc(doc(db, 'notifications', notif.id), data);
  }

  static async markNotificationRead(notifId: string): Promise<void> {
    await updateDoc(doc(db, 'notifications', notifId), { read: true });
  }

  // Subscriptions & Usage
  static async getUserSubscription(userId: string): Promise<UserSubscription> {
    const snap = await getDoc(doc(db, 'subscriptions', userId));
    if (snap.exists()) return snap.data() as UserSubscription;
    // Default free plan
    const defaultSub: UserSubscription = {
      userId,
      plan: 'free',
      status: 'active',
      renewalDate: Date.now() + 30 * 24 * 60 * 60 * 1000,
      limits: {
        monthlyGenerations: 50,
        fileUploadsRemaining: 15,
        audioLessonsRemaining: 5,
        storageUsedMB: 2.5,
        storageLimitMB: 100
      }
    };
    await setDoc(doc(db, 'subscriptions', userId), defaultSub);
    return defaultSub;
  }

  // Admin Portal Methods (Restricted to adedayoademola171@gmail.com)
  static async getAllUsers(): Promise<UserProfile[]> {
    try {
      const q = query(collection(db, 'profiles'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ uid: d.id, ...d.data() } as UserProfile));
    } catch (e) {
      console.warn('Fallback fetching profiles without orderBy:', e);
      const snap = await getDocs(collection(db, 'profiles'));
      const list = snap.docs.map(d => ({ uid: d.id, ...d.data() } as UserProfile));
      return list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    }
  }

  static async updateUserByAdmin(uid: string, updates: Partial<UserProfile>): Promise<void> {
    const data = this.cleanUndefined({
      ...updates,
      updatedAt: Date.now()
    });
    await updateDoc(doc(db, 'profiles', uid), data);
  }

  static async deleteUserByAdmin(uid: string): Promise<void> {
    await deleteDoc(doc(db, 'profiles', uid));
    await this.deleteAllStudySets(uid);
  }

  static async getPlatformStats(): Promise<{
    totalUsers: number;
    totalStudySets: number;
    totalFlashcards: number;
    proUsers: number;
    activeUsers: number;
  }> {
    try {
      const [profilesSnap, setsSnap, cardsSnap] = await Promise.all([
        getDocs(collection(db, 'profiles')),
        getDocs(collection(db, 'studySets')),
        getDocs(collection(db, 'flashcards'))
      ]);

      const users = profilesSnap.docs.map(d => d.data() as UserProfile);
      const proUsers = users.filter(u => u.tier === 'pro' || u.tier === 'elite').length;
      const activeUsers = users.filter(u => u.status !== 'suspended').length;

      return {
        totalUsers: profilesSnap.size,
        totalStudySets: setsSnap.size,
        totalFlashcards: cardsSnap.size,
        proUsers,
        activeUsers
      };
    } catch (e) {
      console.error('Error fetching platform stats:', e);
      return {
        totalUsers: 1,
        totalStudySets: 0,
        totalFlashcards: 0,
        proUsers: 0,
        activeUsers: 1
      };
    }
  }
}
