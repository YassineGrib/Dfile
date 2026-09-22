import React, { useState } from 'react';
import { useLanguage } from './LanguageContext';
import { authService } from '../firebase/auth';
import { isFirebaseConfigured } from '../firebase/config';

type FormState = 'login' | 'signup' | 'forgot';
type AlertType = 'success' | 'error' | null;

interface AuthFormProps {
  onLoginSuccess: () => void;
}

export const AuthForm: React.FC<AuthFormProps> = ({ onLoginSuccess }) => {
  const { t, language, toggleLanguage } = useLanguage();
  const [formState, setFormState] = useState<FormState>('login');
  
  // Fields state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  
  // UI states
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState<{ message: string; type: AlertType }>({ message: '', type: null });

  const switchState = (state: FormState) => {
    setFormState(state);
    setAlert({ message: '', type: null }); // Clear alerts
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlert({ message: '', type: null });

    // Client-side validations
    if (!email.includes('@')) {
      setAlert({ message: t('err-email-format'), type: 'error' });
      return;
    }
    
    if (formState !== 'forgot' && password.length < 8) {
      setAlert({ message: t('err-password-short'), type: 'error' });
      return;
    }
    
    if (formState === 'signup' && !agreeTerms) {
      setAlert({ message: t('err-terms'), type: 'error' });
      return;
    }

    // Trigger loading spinner
    setIsLoading(true);

    if (isFirebaseConfigured) {
      if (formState === 'login') {
        const { error } = await authService.signIn(email, password, language as 'en' | 'ar');
        setIsLoading(false);
        if (error) {
          setAlert({ message: error, type: 'error' });
          return;
        }
        setAlert({ message: t('success-login'), type: 'success' });
        setTimeout(() => onLoginSuccess(), 600);
      } else if (formState === 'signup') {
        const { error } = await authService.signUp(email, password, fullName, language as 'en' | 'ar');
        setIsLoading(false);
        if (error) {
          setAlert({ message: error, type: 'error' });
          return;
        }
        setAlert({ message: t('success-signup'), type: 'success' });
        setTimeout(() => switchState('login'), 1200);
      } else {
        const { error } = await authService.resetPassword(email, language as 'en' | 'ar');
        setIsLoading(false);
        if (error) {
          setAlert({ message: error, type: 'error' });
          return;
        }
        setAlert({ message: t('success-forgot'), type: 'success' });
        setTimeout(() => switchState('login'), 2000);
      }
    } else {
      setTimeout(() => {
        setIsLoading(false);
        if (formState === 'login') {
          setAlert({ message: t('success-login'), type: 'success' });
          setTimeout(() => {
            onLoginSuccess();
          }, 1000);
        } else if (formState === 'signup') {
          setAlert({ message: t('success-signup'), type: 'success' });
        } else if (formState === 'forgot') {
          setAlert({ message: t('success-forgot'), type: 'success' });
          setTimeout(() => switchState('login'), 2000);
        }
        
        // Reset fields
        setEmail('');
        setPassword('');
        setFullName('');
        setAgreeTerms(false);
      }, 1200);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    const { error } = await authService.signInWithGoogle(language as 'en' | 'ar');
    setIsLoading(false);
    if (error) {
      setAlert({ message: error, type: 'error' });
    } else {
      setAlert({ message: t('success-login'), type: 'success' });
      setTimeout(() => onLoginSuccess(), 600);
    }
  };

  return (
    <div className="form-side">
      <div className="form-scroll-container">
        
        {/* Brand Logo & Header */}
        <div className="brand-header">
          <div className="brand-logo-circle">
            <span className="logo-text-letter">F</span>
          </div>
          <div className="brand-info">
            <h1 className="brand-name">Fintask</h1>
            <p className="brand-tagline">{t('tagline')}</p>
          </div>
        </div>

        {/* Authentication Card */}
        <div className="auth-card">
          
          <div className="auth-card-header">
            <h2 id="authTitle" className="auth-title">
              {formState === 'login' && t('login-title')}
              {formState === 'signup' && t('signup-title')}
              {formState === 'forgot' && t('forgot-title')}
            </h2>
            <p id="authSubtitle" className="auth-subtitle">
              {formState === 'login' && t('login-subtitle')}
              {formState === 'signup' && t('signup-subtitle')}
              {formState === 'forgot' && t('forgot-subtitle')}
            </p>
          </div>

          {/* Error/Success Alert Box */}
          {alert.type && (
            <div id="alertBox" className={`alert-box ${alert.type}`}>
              <span className="alert-icon"></span>
              <span id="alertMessage" className="alert-message">{alert.message}</span>
            </div>
          )}

          {/* Form element */}
          <form onSubmit={handleSubmit} className="auth-form">
            
            {/* Full Name field (Signup state only) */}
            {formState === 'signup' && (
              <div className="form-group">
                <label htmlFor="signupName" className="form-label">{t('label-fullname')}</label>
                <div className="input-wrapper">
                  <span className="input-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                  </span>
                  <input 
                    type="text" 
                    id="signupName" 
                    className="form-input" 
                    placeholder={language === 'ar' ? 'صادق حسين' : 'Sadek Hosen'}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required 
                  />
                </div>
              </div>
            )}

            {/* Email Address field */}
            <div className="form-group">
              <label htmlFor="authEmail" className="form-label">{t('label-email')}</label>
              <div className="input-wrapper">
                <span className="input-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                </span>
                <input 
                  type="email" 
                  id="authEmail" 
                  className="form-input" 
                  placeholder="name@company.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                />
              </div>
            </div>

            {/* Password field (Login & Signup states only) */}
            {formState !== 'forgot' && (
              <div className="form-group">
                <div className="label-row">
                  <label htmlFor="authPassword" className="form-label">{t('label-password')}</label>
                  {formState === 'login' && (
                    <a href="#" onClick={(e) => { e.preventDefault(); switchState('forgot'); }} className="form-link">
                      {t('forgot-password-link')}
                    </a>
                  )}
                </div>
                <div className="input-wrapper">
                  <span className="input-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                  </span>
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    id="authPassword" 
                    className="form-input" 
                    placeholder="••••••••" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required 
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)} 
                    className="password-toggle-btn" 
                    aria-label="Toggle Password Visibility"
                  >
                    {!showPassword ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Remember Me Checkbox (Login state only) */}
            {formState === 'login' && (
              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input 
                    type="checkbox" 
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="custom-checkbox" 
                  />
                  <span className="checkbox-box"></span>
                  <span className="checkbox-text">{t('remember-me')}</span>
                </label>
              </div>
            )}

            {/* Terms Checkbox (Signup state only) */}
            {formState === 'signup' && (
              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input 
                    type="checkbox" 
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="custom-checkbox" 
                    required 
                  />
                  <span className="checkbox-box"></span>
                  <span className="checkbox-text">{t('agree-terms')}</span>
                </label>
              </div>
            )}

            {/* Submit Button */}
            <button type="submit" id="authSubmitBtn" className="submit-btn" disabled={isLoading}>
              {!isLoading ? (
                <span className="btn-text">
                  {formState === 'login' && t('btn-signin')}
                  {formState === 'signup' && t('btn-signup')}
                  {formState === 'forgot' && t('btn-reset')}
                </span>
              ) : (
                <span className="btn-spinner"></span>
              )}
            </button>

            {/* Quick Guest / Demo Workspace Access */}
            <button
              type="button"
              id="demoLoginBtn"
              onClick={onLoginSuccess}
              style={{
                marginTop: '10px',
                background: 'transparent',
                border: '1px dashed var(--border-color)',
                borderRadius: '8px',
                padding: '8px 12px',
                width: '100%',
                fontSize: '0.8rem',
                fontWeight: 500,
                color: 'var(--text-muted)',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {language === 'ar' ? '⚡ الدخول كضيف (وضع تجريبي)' : '⚡ Continue to Workspace (Guest / Demo)'}
            </button>
          </form>

          {/* Reset password go back (Forgot state only) */}
          {formState === 'forgot' && (
            <div className="back-to-login-wrapper">
              <a href="#" onClick={(e) => { e.preventDefault(); switchState('login'); }} className="form-link back-to-login">
                {t('back-to-login')}
              </a>
            </div>
          )}

          {/* Toggle state footer */}
          <div className="auth-card-footer">
            <span>
              {formState === 'login' ? t('login-prompt') : t('signup-prompt')}
            </span>
            <a 
              href="#" 
              id="switchFormLink"
              onClick={(e) => {
                e.preventDefault();
                switchState(formState === 'login' ? 'signup' : 'login');
              }} 
              className="form-link bold-link"
            >
              {formState === 'login' ? t('signup-link') : t('signin-link')}
            </a>
          </div>
        </div>

        {/* OAuth Separator */}
        <div className="oauth-separator">
          <span className="separator-line"></span>
          <span className="separator-text">{t('or-oauth')}</span>
          <span className="separator-line"></span>
        </div>

        {/* OAuth Buttons */}
        <div className="oauth-grid-buttons">
          <button type="button" className="oauth-btn" id="oauthGoogle" onClick={handleGoogleSignIn}>
            <span className="oauth-logo">
              <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
              </svg>
            </span>
            <div className="oauth-btn-text">
              <span className="oauth-title-text">Google</span>
              <span className="oauth-subtitle-text">{t('google-sub')}</span>
            </div>
          </button>

          <button type="button" className="oauth-btn" id="oauthApple">
            <span className="oauth-logo">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.22.67-2.94 1.52-.64.74-1.2 1.88-1.05 2.99 1.12.09 2.27-.58 3-1.45z"/>
              </svg>
            </span>
            <div className="oauth-btn-text">
              <span className="oauth-title-text">Apple</span>
              <span className="oauth-subtitle-text">{t('apple-sub')}</span>
            </div>
          </button>
        </div>

        {/* Footer Legal & Discreet Language Switcher */}
        <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <p className="auth-legal">{t('legal-notice')}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            <span 
              id="authLangEn"
              onClick={() => { if (language !== 'en') toggleLanguage(); }}
              style={{ cursor: 'pointer', fontWeight: language === 'en' ? 500 : 400, color: language === 'en' ? 'var(--text-main)' : 'var(--text-placeholder)' }}
            >
              English
            </span>
            <span style={{ color: 'var(--border-color)' }}>•</span>
            <span 
              id="authLangAr"
              onClick={() => { if (language !== 'ar') toggleLanguage(); }}
              style={{ cursor: 'pointer', fontWeight: language === 'ar' ? 500 : 400, color: language === 'ar' ? 'var(--text-main)' : 'var(--text-placeholder)', fontFamily: 'var(--font-ar)' }}
            >
              العربية
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
