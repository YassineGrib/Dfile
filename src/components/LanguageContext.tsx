import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'ar';
type Direction = 'ltr' | 'rtl';

interface LanguageContextType {
  language: Language;
  direction: Direction;
  toggleLanguage: () => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  ar: {
    'tagline': 'إدارة مهامك بأسلوب أكثر ذكاءً',
    'login-title': 'تسجيل الدخول',
    'login-subtitle': 'مرحباً بك مجدداً! الرجاء إدخال بياناتك للمتابعة.',
    'label-fullname': 'الاسم الكامل',
    'label-email': 'البريد الإلكتروني',
    'label-password': 'كلمة المرور',
    'forgot-password-link': 'نسيت كلمة المرور؟',
    'remember-me': 'تذكرني على هذا الجهاز',
    'btn-signin': 'تسجيل الدخول',
    'btn-signup': 'إنشاء حساب',
    'btn-reset': 'إرسال رابط الاستعادة',
    'back-to-login': 'العودة لتسجيل الدخول',
    'agree-terms': 'أوافق على الشروط والأحكام وسياسة الخصوصية',
    'login-prompt': 'ليس لديك حساب؟',
    'signup-link': 'إنشاء حساب جديد',
    'or-oauth': 'أو تابع باستخدام',
    'google-sub': 'حساب جوجل',
    'apple-sub': 'حساب آبل',
    'legal-notice': 'بالتسجيل، أنت توافق على شروط خدمة Fintask والاتفاقيات المصاحبة.',
    
    // Dynamic Form Headers
    'signup-title': 'إنشاء حساب جديد',
    'signup-subtitle': 'انضم إلى Fintask وابدأ في تنظيم مشاريع فريقك اليوم.',
    'forgot-title': 'استعادة كلمة المرور',
    'forgot-subtitle': 'أدخل بريدك الإلكتروني وسنرسل لك رابطاً لإعادة تعيين كلمة المرور.',
    'signup-prompt': 'لديك حساب بالفعل؟',
    'signin-link': 'تسجيل الدخول هنا',
    
    // Validation Errors & Successes
    'err-email-format': 'الرجاء إدخال بريد إلكتروني صحيح.',
    'err-password-short': 'يجب أن تتكون كلمة المرور من 8 أحرف على الأقل.',
    'err-terms': 'يجب الموافقة على الشروط والأحكام للمتابعة.',
    'success-login': 'تم تسجيل الدخول بنجاح! جاري تحويلك...',
    'success-signup': 'تم إنشاء الحساب بنجاح! تفقد بريدك لتأكيد التسجيل.',
    'success-forgot': 'تم إرسال رابط إعادة التعيين إلى بريدك الإلكتروني.',
    
    // Preview tagline
    'tagline-eyebrow': 'إدارة مهام FINTASK',
    'tagline-headline': 'تعاون ونظّم عملك في مساحة عمل واحدة نظيفة وأنيقة.'
  },
  en: {
    'tagline': 'Manage your tasks in a smarter way',
    'login-title': 'Sign In',
    'login-subtitle': 'Welcome back! Please enter your details to proceed.',
    'label-fullname': 'Full Name',
    'label-email': 'Email Address',
    'label-password': 'Password',
    'forgot-password-link': 'Forgot password?',
    'remember-me': 'Remember me on this device',
    'btn-signin': 'Sign In',
    'btn-signup': 'Create Account',
    'btn-reset': 'Send Recovery Link',
    'back-to-login': 'Back to Sign In',
    'agree-terms': 'I agree to the Terms & Conditions and Privacy Policy',
    'login-prompt': "Don't have an account?",
    'signup-link': 'Create a new account',
    'or-oauth': 'Or continue with',
    'google-sub': 'Google Account',
    'apple-sub': 'Apple ID',
    'legal-notice': "By signing up, you agree to Fintask's Terms of Service and associated agreements.",
    
    // Dynamic Form Headers
    'signup-title': 'Create New Account',
    'signup-subtitle': 'Join Fintask and start organizing your team projects today.',
    'forgot-title': 'Reset Password',
    'forgot-subtitle': 'Enter your email address and we will send you a recovery link.',
    'signup-prompt': 'Already have an account?',
    'signin-link': 'Sign in here',
    
    // Validation Errors & Successes
    'err-email-format': 'Please enter a valid email address.',
    'err-password-short': 'Password must be at least 8 characters long.',
    'err-terms': 'You must agree to the Terms & Conditions to proceed.',
    'success-login': 'Successfully signed in! Redirecting...',
    'success-signup': 'Account created successfully! Check your email to verify.',
    'success-forgot': 'A password reset link has been sent to your email.',
    
    // Preview tagline
    'tagline-eyebrow': 'FINTASK TASK MANAGEMENT',
    'tagline-headline': 'Collaborate and organize your work in one clean space.'
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');
  const [direction, setDirection] = useState<Direction>('ltr');

  useEffect(() => {
    // Update HTML attributes when language changes
    document.documentElement.lang = language;
    document.documentElement.dir = direction;
    document.title = language === 'ar' ? 'Fintask - المصادقة' : 'Fintask - Authentication';
  }, [language, direction]);

  const toggleLanguage = () => {
    setLanguage((prev) => {
      const nextLang = prev === 'ar' ? 'en' : 'ar';
      setDirection(nextLang === 'ar' ? 'rtl' : 'ltr');
      return nextLang;
    });
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, direction, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
