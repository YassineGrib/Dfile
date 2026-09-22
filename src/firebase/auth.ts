import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  type User,
  type AuthError
} from 'firebase/auth';
import { auth, googleProvider, isFirebaseConfigured } from './config';

/**
 * Format Firebase Auth errors into clear, actionable messages
 */
function formatAuthError(err: unknown, language: 'en' | 'ar' = 'en'): string {
  const authErr = err as AuthError;
  const code = authErr?.code || '';

  switch (code) {
    case 'auth/configuration-not-found':
    case 'auth/operation-not-allowed':
      return language === 'ar'
        ? 'تنبيه Firebase: يرجى تفعيل طريقة تسجيل الدخول (Email/Password أو Google) في وحدة تحكم Firebase (Build > Authentication > Sign-in method).'
        : 'Firebase Setup: Please enable this Sign-in provider (Email/Password or Google) in Firebase Console (Build > Authentication > Sign-in method).';
    case 'auth/unauthorized-domain':
      return language === 'ar'
        ? 'النطاق الحالي غير مصرح به في Firebase. يرجى إضافة localhost إلى Authorized Domains في إعدادات Authentication.'
        : 'Current domain is unauthorized. Please add localhost to Authorized Domains in Firebase Console > Authentication > Settings.';
    case 'auth/email-already-in-use':
      return language === 'ar' ? 'هذا البريد الإلكتروني مسجل بالفعل.' : 'This email address is already registered.';
    case 'auth/invalid-email':
      return language === 'ar' ? 'صيغة البريد الإلكتروني غير صحيحة.' : 'Invalid email address format.';
    case 'auth/weak-password':
      return language === 'ar' ? 'كلمة المرور ضعيفة جداً. يرجى استخدام 8 أحرف على الأقل.' : 'Password is too weak. Please use at least 8 characters.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return language === 'ar' ? 'بيانات الاعتماد غير صحيحة. يرجى التحقق من البريد وكلمة المرور.' : 'Invalid credentials. Please verify your email and password.';
    case 'auth/popup-closed-by-user':
      return language === 'ar' ? 'تم إلغاء تسجيل الدخول عبر Google من قبل المستخدم.' : 'Google sign-in popup was closed before completing.';
    case 'auth/network-request-failed':
      return language === 'ar' ? 'فشل الاتصال بالشبكة. يرجى التحقق من اتصالك بالإنترنت.' : 'Network connection failed. Please check your internet connection.';
    default:
      return authErr?.message || (language === 'ar' ? 'حدث خطأ أثناء المصادقة.' : 'Authentication error occurred.');
  }
}

export const authService = {
  signIn: async (email: string, pass: string, lang: 'en' | 'ar' = 'en') => {
    if (!isFirebaseConfigured || !auth) {
      return { user: { email, uid: 'mock_uid' } as unknown as User, error: null };
    }
    try {
      const res = await signInWithEmailAndPassword(auth, email, pass);
      return { user: res.user, error: null };
    } catch (err: unknown) {
      return { user: null, error: formatAuthError(err, lang) };
    }
  },

  signUp: async (email: string, pass: string, fullName?: string, lang: 'en' | 'ar' = 'en') => {
    if (!isFirebaseConfigured || !auth) {
      return { user: { email, uid: 'mock_uid', displayName: fullName } as unknown as User, error: null };
    }
    try {
      const res = await createUserWithEmailAndPassword(auth, email, pass);
      if (fullName && res.user) {
        try {
          await updateProfile(res.user, { displayName: fullName });
        } catch (profileErr) {
          console.warn('Could not update user display name:', profileErr);
        }
      }
      return { user: res.user, error: null };
    } catch (err: unknown) {
      return { user: null, error: formatAuthError(err, lang) };
    }
  },

  signInWithGoogle: async (lang: 'en' | 'ar' = 'en') => {
    if (!isFirebaseConfigured || !auth) {
      return { user: { email: 'demo@decabyte.space', displayName: 'Demo User', uid: 'mock_google_uid' } as unknown as User, error: null };
    }
    try {
      const res = await signInWithPopup(auth, googleProvider);
      return { user: res.user, error: null };
    } catch (err: unknown) {
      return { user: null, error: formatAuthError(err, lang) };
    }
  },

  resetPassword: async (email: string, lang: 'en' | 'ar' = 'en') => {
    if (!isFirebaseConfigured || !auth) {
      return { success: true, error: null };
    }
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true, error: null };
    } catch (err: unknown) {
      return { success: false, error: formatAuthError(err, lang) };
    }
  },

  signOut: async () => {
    if (!isFirebaseConfigured || !auth) return;
    try {
      await firebaseSignOut(auth);
    } catch (err) {
      console.error('Error signing out:', err);
    }
  },

  onAuthStateChanged: (callback: (user: User | null) => void) => {
    if (!isFirebaseConfigured || !auth) {
      return () => {};
    }
    return onAuthStateChanged(auth, callback);
  }
};

