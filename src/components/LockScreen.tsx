import React, { useEffect, useRef, useState } from 'react';
import { Lock, Delete } from 'lucide-react';
import { useLanguage } from './LanguageContext';
import { verifyPin } from '../core/pin';

const PIN_LENGTH = 4;
const MAX_ATTEMPTS = 5;
const COOLDOWN_SECONDS = 30;

interface LockScreenProps {
  pinHash: string;
  pinSalt: string;
  userName?: string;
  onUnlock: () => void;
  onSignOut: () => void;
}

/** Quick-unlock screen shown when a saved session is restored and a PIN is enabled. */
export const LockScreen: React.FC<LockScreenProps> = ({ pinHash, pinSalt, userName, onUnlock, onSignOut }) => {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [cooldown, setCooldown] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Count down the lockout after too many wrong attempts
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  useEffect(() => {
    if (cooldown === 0) inputRef.current?.focus();
  }, [cooldown]);

  const submit = async (value: string) => {
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
          {userName
            ? (isAr ? `مرحباً ${userName}، أدخل رمز PIN للمتابعة.` : `Welcome back, ${userName}. Enter your PIN to continue.`)
            : (isAr ? 'أدخل رمز PIN للمتابعة.' : 'Enter your PIN to continue.')}
        </p>

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

        <p id="lockPinStatus" className="lock-status" aria-live="polite">
          {cooldown > 0
            ? (isAr ? `حاول مرة أخرى بعد ${cooldown} ثانية` : `Try again in ${cooldown}s`)
            : error}
        </p>

        <div className="lock-keypad" dir="ltr">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
            <button key={d} type="button" className="lock-key" disabled={disabled} onClick={() => update(pin + d)}>
              {d}
            </button>
          ))}
          <span />
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

        <button type="button" className="lock-signout" onClick={onSignOut}>
          {isAr ? 'نسيت رمز PIN؟ تسجيل الخروج' : 'Forgot your PIN? Sign out'}
        </button>
      </div>
    </div>
  );
};
