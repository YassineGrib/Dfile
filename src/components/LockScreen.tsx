import React, { useEffect, useRef, useState } from 'react';
import { Lock, Delete, Fingerprint, Loader2 } from 'lucide-react';
import { useLanguage } from './LanguageContext';
import { verifyPin } from '../core/pin';
import { verifyBiometric } from '../core/biometric';

const PIN_LENGTH = 4;
const MAX_ATTEMPTS = 5;
const COOLDOWN_SECONDS = 30;

interface LockScreenProps {
  /** Present when a PIN is set; the keypad is hidden otherwise */
  pinHash?: string;
  pinSalt?: string;
  /** Windows Hello (fingerprint / face / Hello PIN) unlock is enabled */
  biometricEnabled: boolean;
  userName?: string;
  onUnlock: () => void;
  onSignOut: () => void;
}

/** Quick-unlock screen shown when a saved session is restored and a PIN or fingerprint lock is enabled. */
export const LockScreen: React.FC<LockScreenProps> = ({ pinHash, pinSalt, biometricEnabled, userName, onUnlock, onSignOut }) => {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const hasPin = Boolean(pinHash && pinSalt);

  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [cooldown, setCooldown] = useState(0);
  const [bioWaiting, setBioWaiting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const autoPromptedRef = useRef(false);

  const tryBiometric = async () => {
    setBioWaiting(true);
    setError('');
    const result = await verifyBiometric(isAr ? 'فتح قفل Dfile' : 'Unlock Dfile');
    setBioWaiting(false);
    if (result === 'verified') {
      onUnlock();
      return;
    }
    if (result === 'canceled') {
      setError(isAr ? 'تم إلغاء Windows Hello.' : 'Windows Hello was canceled.');
    } else {
      setError(
        hasPin
          ? (isAr ? 'تعذر استخدام البصمة. استخدم رمز PIN.' : "Fingerprint didn't work. Use your PIN instead.")
          : (isAr ? 'Windows Hello غير متاح على هذا الجهاز.' : 'Windows Hello is not available on this device.')
      );
    }
    inputRef.current?.focus();
  };

  // Open the Windows Hello prompt straight away (once, even under StrictMode's double effects)
  useEffect(() => {
    if (biometricEnabled && !autoPromptedRef.current) {
      autoPromptedRef.current = true;
      tryBiometric();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [biometricEnabled]);

  // Count down the lockout after too many wrong attempts
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  useEffect(() => {
    if (cooldown === 0 && !bioWaiting) inputRef.current?.focus();
  }, [cooldown, bioWaiting]);

  const submit = async (value: string) => {
    if (!pinHash || !pinSalt) return;
    setChecking(true);
    const ok = await verifyPin(value, pinHash, pinSalt).catch(() => false);
    setChecking(false);
    if (ok) {
      onUnlock();
      return;
    }
    const nextAttempts = attempts + 1;
    setPin('');
    if (nextAttempts >= MAX_ATTEMPTS) {
      setAttempts(0);
      setCooldown(COOLDOWN_SECONDS);
      setError(isAr ? 'محاولات كثيرة خاطئة. انتظر قليلاً.' : 'Too many wrong attempts. Please wait.');
    } else {
      setAttempts(nextAttempts);
      setError(
        isAr
          ? `رمز PIN غير صحيح. المحاولات المتبقية: ${MAX_ATTEMPTS - nextAttempts}`
          : `Wrong PIN. ${MAX_ATTEMPTS - nextAttempts} attempts left.`
      );
    }
  };

  const update = (value: string) => {
    if (checking || cooldown > 0) return;
    const digits = value.replace(/\D/g, '').slice(0, PIN_LENGTH);
    setPin(digits);
    if (digits.length > 0) setError('');
    if (digits.length === PIN_LENGTH) submit(digits);
  };

  const disabled = checking || cooldown > 0;

  const prompt = hasPin && biometricEnabled
    ? (isAr ? 'استخدم البصمة أو أدخل رمز PIN للمتابعة.' : 'Use your fingerprint or enter your PIN to continue.')
    : hasPin
      ? (isAr ? 'أدخل رمز PIN للمتابعة.' : 'Enter your PIN to continue.')
      : (isAr ? 'استخدم البصمة للمتابعة.' : 'Use your fingerprint to continue.');

  return (
    <div className="lock-screen" role="dialog" aria-modal="true" aria-labelledby="lockScreenTitle">
      <div className="lock-card">
        <span className="lock-icon" aria-hidden="true">
          <Lock size={22} />
        </span>
        <h1 id="lockScreenTitle" className="lock-title">
          {isAr ? 'التطبيق مقفل' : 'Workspace locked'}
        </h1>
        <p className="lock-subtitle">
          {userName ? (isAr ? `مرحباً ${userName}. ` : `Welcome back, ${userName}. `) : ''}
          {prompt}
        </p>

        {hasPin && (
          <>
            {/* Hidden real input keeps keyboard entry and paste working; the dots mirror it */}
            <label className="lock-dots" htmlFor="lockPinInput" dir="ltr">
              {Array.from({ length: PIN_LENGTH }, (_, i) => (
                <span key={i} className={`lock-dot ${i < pin.length ? 'filled' : ''} ${error ? 'error' : ''}`} />
              ))}
            </label>
            <input
              id="lockPinInput"
              ref={inputRef}
              className="lock-hidden-input"
              type="password"
              inputMode="numeric"
              autoComplete="off"
              maxLength={PIN_LENGTH}
              value={pin}
              disabled={disabled}
              onChange={(e) => update(e.target.value)}
              aria-label={isAr ? 'رمز PIN' : 'PIN'}
              aria-describedby="lockPinStatus"
            />
          </>
        )}

        <p id="lockPinStatus" className="lock-status" aria-live="polite">
          {cooldown > 0
            ? (isAr ? `حاول مرة أخرى بعد ${cooldown} ثانية` : `Try again in ${cooldown}s`)
            : error}
        </p>

        {hasPin && (
          <div className="lock-keypad" dir="ltr">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
              <button key={d} type="button" className="lock-key" disabled={disabled} onClick={() => update(pin + d)}>
                {d}
              </button>
            ))}
            {biometricEnabled ? (
              <button
                type="button"
                className="lock-key lock-key-muted"
                disabled={bioWaiting}
                onClick={tryBiometric}
                aria-label={isAr ? 'استخدام البصمة' : 'Use fingerprint'}
              >
                <Fingerprint size={20} aria-hidden="true" />
              </button>
            ) : (
              <span />
            )}
            <button type="button" className="lock-key" disabled={disabled} onClick={() => update(pin + '0')}>
              0
            </button>
            <button
              type="button"
              className="lock-key lock-key-muted"
              disabled={disabled || pin.length === 0}
              onClick={() => update(pin.slice(0, -1))}
              aria-label={isAr ? 'حذف' : 'Delete'}
            >
              <Delete size={18} aria-hidden="true" />
            </button>
          </div>
        )}

        {!hasPin && biometricEnabled && (
          <button type="button" className="lock-bio-btn" onClick={tryBiometric} disabled={bioWaiting}>
            {bioWaiting ? <Loader2 size={18} className="animate-spin" aria-hidden="true" /> : <Fingerprint size={18} aria-hidden="true" />}
            {bioWaiting
              ? (isAr ? 'بانتظار Windows Hello…' : 'Waiting for Windows Hello…')
              : (isAr ? 'استخدام البصمة' : 'Use fingerprint')}
          </button>
        )}

        <button type="button" className="lock-signout" onClick={onSignOut}>
          {hasPin
            ? (isAr ? 'نسيت رمز PIN؟ تسجيل الخروج' : 'Forgot your PIN? Sign out')
            : (isAr ? 'لا يمكنك الدخول؟ تسجيل الخروج' : "Can't unlock? Sign out")}
        </button>
      </div>
    </div>
  );
};
