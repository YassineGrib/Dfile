import React, { useState, useEffect } from 'react';
import { 
  User, Shield, Link, Bell, Info, Save, Key, 
  Download, LogOut, Check, Globe, Moon, Sun, Monitor,
  ShieldAlert, Eye, EyeOff, Plus, Type, Loader2
} from 'lucide-react';
import { isFirebaseConfigured } from '../firebase/config';
import { UserAvatar } from './UserAvatar';
import { useTheme } from '../core';
import { firestoreService } from '../firebase/services';
import { authService } from '../firebase/auth';
import type { FreelancerProfile } from '../types';

interface FontThemeOption {
  id: string;
  name: string;
  nameAr: string;
  badge: string;
  badgeAr: string;
  description: string;
  descriptionAr: string;
  sans: string;
  ar: string;
}

const FONT_THEMES: FontThemeOption[] = [
  {
    id: 'satoshi',
    name: 'Satoshi + Alexandria',
    nameAr: 'ساتوشي + الإسكندرية',
    badge: 'Tendance SaaS',
    badgeAr: 'الأكثر عصرية',
    description: 'Ultra-modern neo-grotesque with sharp geometric balance, paired with contemporary Arabic calligraphy.',
    descriptionAr: 'خط هندسي فائق الأناقة للواجهات الحديثة متناغم تماماً مع خط الإسكندرية العربي المعاصر.',
    sans: "'Satoshi', 'Outfit', 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
    ar: "'Alexandria', 'Tajawal', system-ui, -apple-system, sans-serif"
  },
  {
    id: 'outfit',
    name: 'Outfit + Alexandria',
    nameAr: 'أوتفيت الفاخر + الإسكندرية',
    badge: 'Luxury Boutique',
    badgeAr: 'فخامة هندسية',
    description: 'Smooth rounded geometric curves crafted for design studios and luxury boutique fintech.',
    descriptionAr: 'منحنيات هندسية انسيابية ناعمة مخصصة للعلامات الفاخرة واستوديوهات التصميم العالمية.',
    sans: "'Outfit', 'Satoshi', 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
    ar: "'Alexandria', 'Tajawal', system-ui, -apple-system, sans-serif"
  },
  {
    id: 'geist',
    name: 'Geist Silicon + Alexandria',
    nameAr: 'غايست التقني + الإسكندرية',
    badge: 'Silicon Tech',
    badgeAr: 'بساطة تقنية',
    description: 'Precision engineered by Vercel for high density, metrics tables, and developer-grade clarity.',
    descriptionAr: 'خط دقيق عالي الكفاءة صُمم للوحات التحكم والبيانات الكثيفة وتطبيقات الجيل القادم.',
    sans: "'Geist', 'Satoshi', system-ui, -apple-system, sans-serif",
    ar: "'Alexandria', 'Tajawal', system-ui, -apple-system, sans-serif"
  },
  {
    id: 'jakarta',
    name: 'Jakarta + Tajawal',
    nameAr: 'جاكرتا + تجوال',
    badge: 'Classic Corporate',
    badgeAr: 'كلاسيكي متوازن',
    description: 'Balanced humanist sans-serif with conventional, familiar proportions.',
    descriptionAr: 'المظهر النظيف المتوازن والمألوف لبيئات الأعمال التقليدية.',
    sans: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
    ar: "'Tajawal', system-ui, -apple-system, sans-serif"
  }
];

interface SettingsViewProps {
  profile: FreelancerProfile;
  onUpdateProfile: (p: FreelancerProfile) => void;
  contractClauses: string;
  onUpdateClauses: (clauses: string) => void;
  toggleLanguage: () => void;
  language: 'en' | 'ar';
  
  // Custom Project Categories state
  categories: string[];
  onUpdateCategories: (cats: string[]) => void;

  // Backup data triggers
  onExportBackup: () => void;
  onLogoutAllDevices: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  profile,
  onUpdateProfile,
  contractClauses,
  onUpdateClauses,
  toggleLanguage,
  language,
  categories,
  onUpdateCategories,
  onExportBackup,
  onLogoutAllDevices
}) => {
  // Navigation Tabs for Settings sections
  const [activeTab, setActiveTab] = useState<'account' | 'preferences' | 'security' | 'integrations' | 'notifications' | 'about'>('account');

  // Form states for profile
  const [name, setName] = useState(profile.name || '');
  const [designation, setDesignation] = useState(profile.designation || '');
  const [email, setEmail] = useState(profile.email || '');
  const [phone, setPhone] = useState(profile.phone || '');
  const [address, setAddress] = useState(profile.address || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Form states for password change simulation
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Contract standard clauses template
  const [clauses, setClauses] = useState(contractClauses || '');

  // Project Category adder state
  const [newCatName, setNewCatName] = useState('');

  // Font theme preference
  const [activeFontTheme, setActiveFontTheme] = useState<string>(() => {
    return localStorage.getItem('indflow_font_theme') || 'satoshi';
  });

  const applyFontTheme = (themeId: string) => {
    const theme = FONT_THEMES.find(t => t.id === themeId);
    if (!theme) return;
    setActiveFontTheme(themeId);
    localStorage.setItem('indflow_font_theme', themeId);
    document.documentElement.style.setProperty('--font-sans', theme.sans);
    document.documentElement.style.setProperty('--font-ar', theme.ar);
    firestoreService.saveWorkspacePreferences({ font_theme: themeId });
    triggerToast(language === 'ar' ? `تم تفعيل خط: ${theme.nameAr}` : `Typography switched to ${theme.name}`);
  };

  // Theme context from core
  const { mode, setMode } = useTheme();

  const handleThemeModeChange = (newMode: 'light' | 'dark' | 'system') => {
    setMode(newMode);
    firestoreService.saveWorkspacePreferences({ theme_mode: newMode });
    const msg = newMode === 'light' 
      ? (language === 'ar' ? 'تم تفعيل الوضع الفاتح' : 'Light mode activated')
      : newMode === 'dark'
      ? (language === 'ar' ? 'تم تفعيل الوضع الداكن' : 'Dark mode activated')
      : (language === 'ar' ? 'تم التبديل لتوافق النظام' : 'System preference activated');
    triggerToast(msg);
  };

  // Security Lock states
  const [pinEnabled, setPinEnabled] = useState(true);
  const [biometricsEnabled, setBiometricsEnabled] = useState(true);
  const [pinCode, setPinCode] = useState('1234');
  
  // Google Calendar Integration states
  const [googleConnected, setGoogleConnected] = useState(false);
  const [googleEmail, setGoogleEmail] = useState('');

  // Notification toggles
  const [pushEnabled, setPushEnabled] = useState(true);
  const [notifyDeadlines, setNotifyDeadlines] = useState(true);
  const [notifyPayments, setNotifyPayments] = useState(true);
  const [notifyTasks, setNotifyTasks] = useState(false);

  // Support Request form states
  const [supportSubject, setSupportSubject] = useState('');
  const [supportMessage, setSupportMessage] = useState('');
  const [isSubmittingSupport, setIsSubmittingSupport] = useState(false);

  // Toast confirmation
  const [toast, setToast] = useState<{ message: string; isError?: boolean } | null>(null);

  const triggerToast = (msg: string, isError = false) => {
    setToast({ message: msg, isError });
    setTimeout(() => setToast(null), 3000);
  };

  // Sync profile when updated from Firestore
  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setDesignation(profile.designation || '');
      setEmail(profile.email || '');
      setPhone(profile.phone || '');
      setAddress(profile.address || '');
    }
  }, [profile]);

  // Sync contract clauses when updated from Firestore
  useEffect(() => {
    if (contractClauses !== undefined) {
      setClauses(contractClauses);
    }
  }, [contractClauses]);

  // Subscribe to backend Workspace Preferences in Firestore
  useEffect(() => {
    const unsub = firestoreService.subscribeWorkspacePreferences((prefs) => {
      if (!prefs) return;
      if (prefs.font_theme) {
        setActiveFontTheme(prefs.font_theme);
        const theme = FONT_THEMES.find(t => t.id === prefs.font_theme);
        if (theme) {
          document.documentElement.style.setProperty('--font-sans', theme.sans);
          document.documentElement.style.setProperty('--font-ar', theme.ar);
          localStorage.setItem('indflow_font_theme', prefs.font_theme);
        }
      }
      if (prefs.theme_mode && (prefs.theme_mode === 'light' || prefs.theme_mode === 'dark' || prefs.theme_mode === 'system')) {
        setMode(prefs.theme_mode);
      }
      if (prefs.security) {
        if (typeof prefs.security.pin_enabled === 'boolean') setPinEnabled(prefs.security.pin_enabled);
        if (typeof prefs.security.biometrics_enabled === 'boolean') setBiometricsEnabled(prefs.security.biometrics_enabled);
        if (typeof prefs.security.pin_code === 'string') setPinCode(prefs.security.pin_code);
      }
      if (prefs.integrations) {
        if (typeof prefs.integrations.google_connected === 'boolean') setGoogleConnected(prefs.integrations.google_connected);
        if (typeof prefs.integrations.google_email === 'string') setGoogleEmail(prefs.integrations.google_email);
      }
      if (prefs.notifications) {
        if (typeof prefs.notifications.push_enabled === 'boolean') setPushEnabled(prefs.notifications.push_enabled);
        if (typeof prefs.notifications.notify_deadlines === 'boolean') setNotifyDeadlines(prefs.notifications.notify_deadlines);
        if (typeof prefs.notifications.notify_payments === 'boolean') setNotifyPayments(prefs.notifications.notify_payments);
        if (typeof prefs.notifications.notify_tasks === 'boolean') setNotifyTasks(prefs.notifications.notify_tasks);
      }
    });

    return () => unsub();
  }, [setMode]);

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      onUpdateProfile({ name, designation, email, phone, address });
      triggerToast(language === 'ar' ? 'تم تحديث وحفظ الملف الشخصي بنجاح!' : 'Profile updated and saved successfully!');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      triggerToast(language === 'ar' ? 'يجب أن تتكون كلمة المرور من 6 أحرف على الأقل' : 'Password must be at least 6 characters', true);
      return;
    }
    if (newPassword !== confirmPassword) {
      triggerToast(language === 'ar' ? 'كلمات المرور الجديدة غير متطابقة!' : 'New passwords do not match!', true);
      return;
    }
    setIsUpdatingPassword(true);
    const res = await authService.updatePassword(oldPassword, newPassword, language);
    setIsUpdatingPassword(false);
    if (res.error) {
      triggerToast(res.error, true);
    } else {
      triggerToast(language === 'ar' ? 'تم تغيير كلمة المرور بنجاح!' : 'Password updated successfully!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordSection(false);
    }
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCatName.trim();
    if (!trimmed) return;
    if (categories.includes(trimmed)) {
      triggerToast(language === 'ar' ? 'هذا التصنيف موجود بالفعل!' : 'Category already exists!', true);
      return;
    }
    onUpdateCategories([...categories, trimmed]);
    setNewCatName('');
    triggerToast(language === 'ar' ? 'تم إضافة التصنيف الجديد وحفظه بالسحابة!' : 'New category added and saved to cloud!');
  };

  const handleRemoveCategory = (cat: string) => {
    onUpdateCategories(categories.filter(c => c !== cat));
    triggerToast(language === 'ar' ? 'تم إزالة التصنيف وتحديث السحابة!' : 'Category removed.');
  };

  const handleSupportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportSubject.trim() || !supportMessage.trim()) return;
    setIsSubmittingSupport(true);
    try {
      await firestoreService.saveSupportTicket({
        id: 'ticket_' + Math.random().toString(36).substr(2, 9),
        subject: supportSubject.trim(),
        message: supportMessage.trim(),
        user_email: email || profile.email || 'user@decabyte.space',
        created_at: new Date().toISOString(),
        status: 'open'
      });
      setSupportSubject('');
      setSupportMessage('');
      triggerToast(language === 'ar' ? 'تم إرسال بطاقة الدعم الفني وتخزينها في السحابة بنجاح!' : 'Support ticket sent and stored in cloud successfully!');
    } catch (err) {
      console.error('Error submitting support ticket:', err);
      triggerToast(language === 'ar' ? 'تعذر إرسال التذكرة. يرجى التحقق من الاتصال.' : 'Failed to submit ticket. Please check connection.', true);
    } finally {
      setIsSubmittingSupport(false);
    }
  };

  const handleSaveClauses = () => {
    onUpdateClauses(clauses);
    triggerToast(language === 'ar' ? 'تم تحديث قالب البنود القانونية وحفظه بالسحابة بنجاح!' : 'Standard legal clauses updated and saved to cloud!');
  };

  const handleTogglePin = (enabled: boolean) => {
    setPinEnabled(enabled);
    firestoreService.saveWorkspacePreferences({
      security: {
        pin_enabled: enabled,
        pin_code: pinCode,
        biometrics_enabled: biometricsEnabled
      }
    });
    triggerToast(enabled ? (language === 'ar' ? 'تم تفعيل قفل PIN وحفظه' : 'PIN lock enabled and saved') : (language === 'ar' ? 'تم تعطيل قفل PIN وحفظه' : 'PIN lock disabled and saved'));
  };

  const handlePinCodeChange = (code: string) => {
    setPinCode(code);
    if (code.length === 4) {
      firestoreService.saveWorkspacePreferences({
        security: {
          pin_enabled: pinEnabled,
          pin_code: code,
          biometrics_enabled: biometricsEnabled
        }
      });
      triggerToast(language === 'ar' ? 'تم حفظ رمز PIN الجديد بالسحابة' : 'New PIN passcode saved to cloud');
    }
  };

  const handleToggleBiometrics = (enabled: boolean) => {
    setBiometricsEnabled(enabled);
    firestoreService.saveWorkspacePreferences({
      security: {
        pin_enabled: pinEnabled,
        pin_code: pinCode,
        biometrics_enabled: enabled
      }
    });
    triggerToast(enabled ? (language === 'ar' ? 'تم تفعيل مصادقة البصمة وحفظها' : 'Biometrics lock enabled and saved') : (language === 'ar' ? 'تم تعطيل مصادقة البصمة وحفظها' : 'Biometrics lock disabled and saved'));
  };

  const handleGoogleConnectToggle = () => {
    if (googleConnected) {
      setGoogleConnected(false);
      setGoogleEmail('');
      firestoreService.saveWorkspacePreferences({
        integrations: {
          google_connected: false,
          google_email: ''
        }
      });
      triggerToast(language === 'ar' ? 'تم إلغاء ربط الحساب بنجاح' : 'Google Account unlinked.');
    } else {
      const activeEmail = email || profile.email || 'sadek.rahman@gmail.com';
      setGoogleConnected(true);
      setGoogleEmail(activeEmail);
      firestoreService.saveWorkspacePreferences({
        integrations: {
          google_connected: true,
          google_email: activeEmail
        }
      });
      triggerToast(language === 'ar' ? 'تم ربط حساب Google وحفظه بالسحابة بنجاح!' : 'Google Account linked and saved to cloud successfully!');
    }
  };

  const handleTogglePush = (enabled: boolean) => {
    setPushEnabled(enabled);
    firestoreService.saveWorkspacePreferences({
      notifications: {
        push_enabled: enabled,
        notify_deadlines: notifyDeadlines,
        notify_payments: notifyPayments,
        notify_tasks: notifyTasks
      }
    });
    triggerToast(enabled ? (language === 'ar' ? 'تم تفعيل تنبيهات المتصفح وحفظها' : 'Push alerts enabled and saved') : (language === 'ar' ? 'تم تعطيل التنبيهات وحفظها' : 'Push alerts disabled and saved'));
  };

  const handleNotificationChange = (type: 'deadlines' | 'payments' | 'tasks', value: boolean) => {
    const updatedDeadlines = type === 'deadlines' ? value : notifyDeadlines;
    const updatedPayments = type === 'payments' ? value : notifyPayments;
    const updatedTasks = type === 'tasks' ? value : notifyTasks;

    if (type === 'deadlines') setNotifyDeadlines(value);
    if (type === 'payments') setNotifyPayments(value);
    if (type === 'tasks') setNotifyTasks(value);

    firestoreService.saveWorkspacePreferences({
      notifications: {
        push_enabled: pushEnabled,
        notify_deadlines: updatedDeadlines,
        notify_payments: updatedPayments,
        notify_tasks: updatedTasks
      }
    });
    triggerToast(language === 'ar' ? 'تم تحديث تفضيلات الإشعارات بالسحابة' : 'Notification preferences saved');
  };

  return (
    <div className="dashboard-content-area">
      
      {/* Toast popup */}
      {toast && (
        <div 
          className="toast-notification animate-slide-in"
          style={{
            background: toast.isError ? '#D32F2F' : undefined,
            color: '#FFFFFF'
          }}
        >
          {toast.isError ? (
            <ShieldAlert size={16} style={{ marginRight: '6px' }} />
          ) : (
            <Check size={16} style={{ marginRight: '6px' }} />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header Path */}
      <div className="workspace-header-strip">
        <div className="project-breadcrumb">
          <span>{language === 'ar' ? 'النظام' : 'System Settings'}</span>
          <span className="breadcrumb-divider">/</span>
          <span className="text-bold">{language === 'ar' ? 'تفضيلات لوحة التحكم' : 'Control Center'}</span>
        </div>
      </div>

      {/* Greeting info */}
      <div className="project-details-intro-block" style={{ marginBottom: '24px' }}>
        <div>
          <h2 className="project-title-heading">
            {language === 'ar' ? 'لوحة التحكم والتهيئة العامة' : 'DecaByte Workspace Preferences'}
          </h2>
          <p className="header-greeting-subtitle" style={{ margin: '4px 0 0 0' }}>
            {language === 'ar' ? 'إدارة الهوية المحاسبية والتعاقدية، الأمان والوصول برمز PIN ومصادقة البصمة.' : 'Manage corporate billing details, legal clauses, session locks, and data backup integrations.'}
          </p>
        </div>
      </div>

      {/* Settings Grid Panel */}
      <div className="calendar-two-col-layout" style={{ gap: '24px' }}>
        
        {/* Left Side Tab Navigation */}
        <div className="calendar-left-section" style={{ flex: '0 0 250px', maxWidth: '250px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          
          <button 
            onClick={() => setActiveTab('account')}
            className={`utility-link-btn ${activeTab === 'account' ? 'active' : ''}`}
            style={{ width: '100%', justifyContent: 'flex-start', padding: '12px 16px', borderRadius: '8px', border: 'none', background: activeTab === 'account' ? 'var(--bg-sidebar)' : 'transparent', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '10px' }}
          >
            <User size={18} />
            <span style={{ fontWeight: activeTab === 'account' ? 500 : 400 }}>
              {language === 'ar' ? 'الملف الشخصي والحساب' : 'Account Settings'}
            </span>
          </button>

          <button 
            id="tabBtnPreferences"
            onClick={() => setActiveTab('preferences')}
            className={`utility-link-btn ${activeTab === 'preferences' ? 'active' : ''}`}
            style={{ width: '100%', justifyContent: 'flex-start', padding: '12px 16px', borderRadius: '8px', border: 'none', background: activeTab === 'preferences' ? 'var(--bg-sidebar)' : 'transparent', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '10px' }}
          >
            <Globe size={18} />
            <span style={{ fontWeight: activeTab === 'preferences' ? 500 : 400 }}>
              {language === 'ar' ? 'تفضيلات التطبيق والمشاريع' : 'App Preferences'}
            </span>
          </button>

          <button 
            onClick={() => setActiveTab('security')}
            className={`utility-link-btn ${activeTab === 'security' ? 'active' : ''}`}
            style={{ width: '100%', justifyContent: 'flex-start', padding: '12px 16px', borderRadius: '8px', border: 'none', background: activeTab === 'security' ? 'var(--bg-sidebar)' : 'transparent', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '10px' }}
          >
            <Shield size={18} />
            <span style={{ fontWeight: activeTab === 'security' ? 500 : 400 }}>
              {language === 'ar' ? 'أمان الدخول وجلسات النشاط' : 'Security Lock'}
            </span>
          </button>

          <button 
            id="tabBtnIntegrations"
            onClick={() => setActiveTab('integrations')}
            className={`utility-link-btn ${activeTab === 'integrations' ? 'active' : ''}`}
            style={{ width: '100%', justifyContent: 'flex-start', padding: '12px 16px', borderRadius: '8px', border: 'none', background: activeTab === 'integrations' ? 'var(--bg-sidebar)' : 'transparent', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '10px' }}
          >
            <Link size={18} />
            <span style={{ fontWeight: activeTab === 'integrations' ? 500 : 400 }}>
              {language === 'ar' ? 'الربط السحابي والنسخ الاحتياطي' : 'Integrations & Cloud'}
            </span>
          </button>

          <button 
            onClick={() => setActiveTab('notifications')}
            className={`utility-link-btn ${activeTab === 'notifications' ? 'active' : ''}`}
            style={{ width: '100%', justifyContent: 'flex-start', padding: '12px 16px', borderRadius: '8px', border: 'none', background: activeTab === 'notifications' ? 'var(--bg-sidebar)' : 'transparent', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '10px' }}
          >
            <Bell size={18} />
            <span style={{ fontWeight: activeTab === 'notifications' ? 500 : 400 }}>
              {language === 'ar' ? 'إعدادات الإشعارات والتنبيه' : 'Notification Toggles'}
            </span>
          </button>

          <button 
            onClick={() => setActiveTab('about')}
            className={`utility-link-btn ${activeTab === 'about' ? 'active' : ''}`}
            style={{ width: '100%', justifyContent: 'flex-start', padding: '12px 16px', borderRadius: '8px', border: 'none', background: activeTab === 'about' ? 'var(--bg-sidebar)' : 'transparent', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '10px' }}
          >
            <Info size={18} />
            <span style={{ fontWeight: activeTab === 'about' ? 500 : 400 }}>
              {language === 'ar' ? 'حول النظام والدعم الفني' : 'About & Support'}
            </span>
          </button>

        </div>

        {/* Right Side Content Panel */}
        <div className="calendar-right-section" style={{ flex: 1, border: '1.5px solid var(--border-color)', borderRadius: '12px', background: 'var(--bg-card)', padding: '24px' }}>
          
          {/* 1. TAB: ACCOUNT SETTINGS */}
          {activeTab === 'account' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <form onSubmit={handleProfileSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 500, margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px dashed var(--border-color)', paddingBottom: '10px' }}>
                  <User size={18} className="text-orange" />
                  {language === 'ar' ? 'ملف تعريف الفريلانسر الشخصي' : 'Freelancer Profile Details'}
                </h3>

                {/* Live Character Avatar Preview */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '16px',
                  borderRadius: '12px',
                  background: 'var(--bg-sidebar)',
                  border: '1.5px solid var(--border-color)',
                  marginBottom: '6px'
                }}>
                  <UserAvatar name={name || 'User'} size={56} animate="hover" />
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '1.05rem', fontWeight: 500, color: 'var(--text-main)' }}>
                      {name || (language === 'ar' ? 'المستخدم' : 'Workspace User')}
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {designation || (language === 'ar' ? 'مستقل / فريلانسر' : 'Independent Professional')} • {language === 'ar' ? 'أفاتار هندسي متناسق من عائلة Blobatar' : 'Deterministic Blobatar Character'}
                    </p>
                  </div>
                </div>

                <div className="modal-dates-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group-item">
                    <label>{language === 'ar' ? 'الاسم واللقب *' : 'Display Name *'}</label>
                    <input 
                      type="text" 
                      value={name} 
                      onChange={(e) => setName(e.target.value)} 
                      required 
                      className="milestone-form-input" 
                    />
                  </div>
                  <div className="form-group-item">
                    <label>{language === 'ar' ? 'المسمى الوظيفي / الاختصاص *' : 'Professional Designation *'}</label>
                    <input 
                      type="text" 
                      value={designation} 
                      onChange={(e) => setDesignation(e.target.value)} 
                      required 
                      className="milestone-form-input" 
                    />
                  </div>
                </div>

                <div className="modal-dates-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group-item">
                    <label>{language === 'ar' ? 'البريد المهني الموثق' : 'Verified Business Email'}</label>
                    <input 
                      type="email" 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                      className="milestone-form-input" 
                    />
                  </div>
                  <div className="form-group-item">
                    <label>{language === 'ar' ? 'رقم الهاتف للتواصل' : 'Mobile / Phone'}</label>
                    <input 
                      type="tel" 
                      value={phone} 
                      onChange={(e) => setPhone(e.target.value)} 
                      className="milestone-form-input" 
                    />
                  </div>
                </div>

                <div className="form-group-item">
                  <label>{language === 'ar' ? 'العنوان المهني (الجزائر)' : 'Business Physical Address'}</label>
                  <input 
                    type="text" 
                    value={address} 
                    onChange={(e) => setAddress(e.target.value)} 
                    className="milestone-form-input" 
                  />
                </div>

                <button type="submit" disabled={isSavingProfile} className="submit-btn compact-btn" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {isSavingProfile ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      {language === 'ar' ? 'جاري الحفظ...' : 'Saving...'}
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      {language === 'ar' ? 'حفظ التغييرات الشخصية' : 'Save Identity Details'}
                    </>
                  )}
                </button>
              </form>

              {/* Password Reset Section */}
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                {!showPasswordSection ? (
                  <button 
                    onClick={() => setShowPasswordSection(true)} 
                    className="submit-btn compact-btn"
                    style={{ background: 'var(--bg-sidebar)', border: '1.5px solid var(--border-color)', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Key size={15} />
                    {language === 'ar' ? 'تغيير كلمة مرور الحساب' : 'Change Workspace Password'}
                  </button>
                ) : (
                  <form onSubmit={handlePasswordSubmit} className="animate-slide-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '400px' }}>
                    <h4 style={{ fontSize: '0.88rem', fontWeight: 500, margin: 0 }}>
                      {language === 'ar' ? 'تغيير كلمة المرور السرية' : 'Update Access Password'}
                    </h4>
                    
                    <div className="form-group-item">
                      <label>{language === 'ar' ? 'كلمة المرور الحالية' : 'Current Password'}</label>
                      <div style={{ position: 'relative' }}>
                        <input 
                          type={showOldPass ? 'text' : 'password'} 
                          value={oldPassword} 
                          onChange={(e) => setOldPassword(e.target.value)} 
                          required 
                          className="milestone-form-input" 
                          style={{ paddingRight: '40px' }}
                        />
                        <button type="button" onClick={() => setShowOldPass(!showOldPass)} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-placeholder)' }}>
                          {showOldPass ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <div className="form-group-item">
                      <label>{language === 'ar' ? 'كلمة المرور الجديدة' : 'New Password'}</label>
                      <div style={{ position: 'relative' }}>
                        <input 
                          type={showNewPass ? 'text' : 'password'} 
                          value={newPassword} 
                          onChange={(e) => setNewPassword(e.target.value)} 
                          required 
                          className="milestone-form-input" 
                          style={{ paddingRight: '40px' }}
                        />
                        <button type="button" onClick={() => setShowNewPass(!showNewPass)} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-placeholder)' }}>
                          {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <div className="form-group-item">
                      <label>{language === 'ar' ? 'تأكيد كلمة المرور الجديدة' : 'Confirm New Password'}</label>
                      <input 
                        type="password" 
                        value={confirmPassword} 
                        onChange={(e) => setConfirmPassword(e.target.value)} 
                        required 
                        className="milestone-form-input" 
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                      <button type="button" onClick={() => setShowPasswordSection(false)} className="btn-secondary" style={{ flex: 1 }}>
                        {language === 'ar' ? 'إلغاء' : 'Cancel'}
                      </button>
                      <button type="submit" disabled={isUpdatingPassword} className="submit-btn primary-submit" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        {isUpdatingPassword ? (
                          <>
                            <Loader2 size={16} className="animate-spin" />
                            {language === 'ar' ? 'جاري التحديث...' : 'Updating...'}
                          </>
                        ) : (
                          language === 'ar' ? 'تحديث الكلمة' : 'Update'
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* 2. TAB: APPLICATION PREFERENCES */}
          {activeTab === 'preferences' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Dedicated Language Selector */}
              <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Globe size={18} style={{ color: 'var(--accent-orange)' }} />
                    <h5 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 500 }}>
                      {language === 'ar' ? 'لغة واجهة المنصة (Interface Language)' : 'System Interface Language'}
                    </h5>
                  </div>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.78rem', color: 'var(--text-placeholder)' }}>
                    {language === 'ar' 
                      ? 'اختر لغة العرض واتجاه النصوص (RTL / LTR) لكافة مستندات وفواتير ولوحة العمل.' 
                      : 'Choose your default workspace language and document orientation (RTL / LTR).'}
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', maxWidth: '520px' }}>
                  {/* English Card */}
                  <div
                    id="langBtnEnglish"
                    onClick={() => {
                      if (language !== 'en') {
                        toggleLanguage();
                        triggerToast('Language switched to English');
                      }
                    }}
                    style={{
                      cursor: 'pointer',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      border: language === 'en' ? '2px solid var(--accent-purple)' : '1px solid var(--border-color)',
                      background: language === 'en' ? 'var(--accent-purple-light)' : 'var(--bg-card)',
                      boxShadow: language === 'en' ? '0 4px 14px rgba(138, 92, 245, 0.12)' : 'var(--shadow-sm)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '1.4rem', lineHeight: 1 }}>🇬🇧</span>
                      <div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-main)' }}>English</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Left-to-Right (LTR)</div>
                      </div>
                    </div>
                    {language === 'en' && (
                      <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'var(--accent-purple)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Check size={12} strokeWidth={3} />
                      </span>
                    )}
                  </div>

                  {/* Arabic Card */}
                  <div
                    id="langBtnArabic"
                    onClick={() => {
                      if (language !== 'ar') {
                        toggleLanguage();
                        triggerToast('تم تفعيل اللغة العربية بنجاح');
                      }
                    }}
                    style={{
                      cursor: 'pointer',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      border: language === 'ar' ? '2px solid var(--accent-purple)' : '1px solid var(--border-color)',
                      background: language === 'ar' ? 'var(--accent-purple-light)' : 'var(--bg-card)',
                      boxShadow: language === 'ar' ? '0 4px 14px rgba(138, 92, 245, 0.12)' : 'var(--shadow-sm)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '1.4rem', lineHeight: 1 }}>🇩🇿</span>
                      <div style={{ textAlign: language === 'ar' ? 'right' : 'left' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-main)', fontFamily: 'var(--font-ar)' }}>العربية</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-ar)' }}>من اليمين لليسار (RTL)</div>
                      </div>
                    </div>
                    {language === 'ar' && (
                      <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'var(--accent-purple)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Check size={12} strokeWidth={3} />
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Theme Selector (Light / Dark / System) */}
              <div className="settings-panel-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
                <div>
                  <h5 style={{ margin: '0 0 4px 0', fontSize: '0.9rem', fontWeight: 500 }}>
                    {language === 'ar' ? 'مظهر مساحة العمل (Themes)' : 'Workspace Appearance'}
                  </h5>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-placeholder)' }}>
                    {language === 'ar' ? 'التبديل التلقائي بين الوضع الفاتح والداكن ونظام الجهاز.' : 'Seamlessly switch between Light, Dark, or System mode.'}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '6px', background: 'var(--bg-sidebar)', padding: '3px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                  <button 
                    id="theme-light-btn"
                    onClick={() => handleThemeModeChange('light')}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 10px', borderRadius: '4px', border: 'none',
                      background: mode === 'light' ? 'var(--bg-card)' : 'transparent',
                      color: mode === 'light' ? 'var(--text-main)' : 'var(--text-muted)',
                      boxShadow: mode === 'light' ? 'var(--shadow-sm)' : 'none',
                      fontWeight: mode === 'light' ? 500 : 400, fontSize: '0.78rem', cursor: 'pointer'
                    }}
                  >
                    <Sun size={14} />
                    <span>{language === 'ar' ? 'فاتح' : 'Light'}</span>
                  </button>
                  <button 
                    id="theme-dark-btn"
                    onClick={() => handleThemeModeChange('dark')}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 10px', borderRadius: '4px', border: 'none',
                      background: mode === 'dark' ? 'var(--bg-card)' : 'transparent',
                      color: mode === 'dark' ? 'var(--text-main)' : 'var(--text-muted)',
                      boxShadow: mode === 'dark' ? 'var(--shadow-sm)' : 'none',
                      fontWeight: mode === 'dark' ? 500 : 400, fontSize: '0.78rem', cursor: 'pointer'
                    }}
                  >
                    <Moon size={14} />
                    <span>{language === 'ar' ? 'داكن' : 'Dark'}</span>
                  </button>
                  <button 
                    id="theme-system-btn"
                    onClick={() => handleThemeModeChange('system')}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 10px', borderRadius: '4px', border: 'none',
                      background: mode === 'system' ? 'var(--bg-card)' : 'transparent',
                      color: mode === 'system' ? 'var(--text-main)' : 'var(--text-muted)',
                      boxShadow: mode === 'system' ? 'var(--shadow-sm)' : 'none',
                      fontWeight: mode === 'system' ? 500 : 400, fontSize: '0.78rem', cursor: 'pointer'
                    }}
                  >
                    <Monitor size={14} />
                    <span>{language === 'ar' ? 'تلقائي' : 'System'}</span>
                  </button>
                </div>
              </div>

              {/* Curated Tendance Typography Selector */}
              <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Type size={18} style={{ color: 'var(--accent-purple)' }} />
                    <h5 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 500 }}>
                      {language === 'ar' ? 'نمط الخطوط والطباعة الفاخرة (Tendance Typography)' : 'Curated Premium Typography Suites'}
                    </h5>
                  </div>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.78rem', color: 'var(--text-placeholder)' }}>
                    {language === 'ar'
                      ? 'اختر النمط العصري الأنسب لهوية أعمالك ومشاريعك. يتم تطبيقه فورياً عبر كافة صفحات وواجهات المنصة.'
                      : 'Select your preferred high-end typography suite. Changes take effect instantly across all views and documents.'}
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
                  {FONT_THEMES.map((theme) => {
                    const isSelected = activeFontTheme === theme.id;
                    return (
                      <div
                        key={theme.id}
                        onClick={() => applyFontTheme(theme.id)}
                        style={{
                          cursor: 'pointer',
                          padding: '14px 16px',
                          borderRadius: '12px',
                          border: isSelected ? '2px solid var(--accent-purple)' : '1px solid var(--border-color)',
                          background: isSelected ? 'var(--accent-purple-light)' : 'var(--bg-card)',
                          boxShadow: isSelected ? '0 4px 14px rgba(138, 92, 245, 0.12)' : 'var(--shadow-sm)',
                          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                          position: 'relative'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                          <span style={{ 
                            fontSize: '0.68rem', 
                            fontWeight: 500, 
                            textTransform: 'uppercase', 
                            letterSpacing: '0.04em',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            background: isSelected ? 'var(--accent-purple)' : 'var(--bg-sidebar)',
                            color: isSelected ? '#FFFFFF' : 'var(--text-muted)'
                          }}>
                            {language === 'ar' ? theme.badgeAr : theme.badge}
                          </span>
                          {isSelected && (
                            <span style={{ 
                              width: '20px', 
                              height: '20px', 
                              borderRadius: '50%', 
                              background: 'var(--accent-purple)', 
                              color: '#fff', 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center' 
                            }}>
                              <Check size={12} strokeWidth={3} />
                            </span>
                          )}
                        </div>
                        <h6 style={{ 
                          margin: '0 0 6px 0', 
                          fontSize: '0.95rem', 
                          fontWeight: 500, 
                          color: 'var(--text-main)',
                          fontFamily: language === 'ar' ? theme.ar : theme.sans 
                        }}>
                          {language === 'ar' ? theme.nameAr : theme.name}
                        </h6>
                        <p style={{ margin: '0 0 10px 0', fontSize: '0.74rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                          {language === 'ar' ? theme.descriptionAr : theme.description}
                        </p>
                        <div style={{ 
                          fontSize: '0.8rem', 
                          fontWeight: 500, 
                          color: 'var(--text-main)', 
                          padding: '6px 10px', 
                          borderRadius: '6px', 
                          background: isSelected ? 'rgba(255, 255, 255, 0.7)' : 'var(--bg-sidebar)',
                          fontFamily: language === 'ar' ? theme.ar : theme.sans,
                          letterSpacing: language === 'ar' ? '0' : '-0.015em',
                          display: 'flex',
                          justifyContent: 'space-between'
                        }}>
                          <span>{language === 'ar' ? 'استوديو التصميم المعاصر' : 'Modern Studio Pro'}</span>
                          <span style={{ fontFeatureSettings: '"tnum" 1' }}>{language === 'ar' ? '180,000 دج' : '$12,450'}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Editable Project Predefined Categories */}
              <div>
                <h4 style={{ fontSize: '0.92rem', fontWeight: 500, margin: '0 0 12px 0' }}>
                  {language === 'ar' ? 'تصنيفات المشاريع المعرّفة مسبقاً' : 'Predefined Project Categories'}
                </h4>
                
                {/* List categories */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                  {categories.map(cat => (
                    <div 
                      key={cat} 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '6px', 
                        background: 'var(--bg-sidebar)', 
                        padding: '6px 12px', 
                        borderRadius: '6px', 
                        fontSize: '0.8rem',
                        fontWeight: 500,
                        border: '1.5px solid var(--border-color)'
                      }}
                    >
                      <span>{cat}</span>
                      <button 
                        onClick={() => handleRemoveCategory(cat)}
                        style={{ border: 'none', background: 'transparent', color: '#D32F2F', cursor: 'pointer', fontSize: '0.9rem', padding: '0 2px' }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add new Category */}
                <form onSubmit={handleAddCategory} style={{ display: 'flex', gap: '8px', maxWidth: '350px' }}>
                  <input 
                    type="text" 
                    placeholder={language === 'ar' ? 'تصنيف جديد (مثال: برمجيات SaaS)' : 'e.g. SaaS Development'}
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    className="milestone-form-input" 
                  />
                  <button type="submit" className="submit-btn compact-btn" style={{ height: '38px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Plus size={16} />
                    {language === 'ar' ? 'إضافة' : 'Add'}
                  </button>
                </form>
              </div>

              {/* Contract Templates Standard Boilerplate */}
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                <h4 style={{ fontSize: '0.92rem', fontWeight: 500, margin: '0 0 6px 0' }}>
                  {language === 'ar' ? 'البنود القانونية لعقود العمل' : 'Legal Clauses Template'}
                </h4>
                <p style={{ margin: '0 0 12px 0', fontSize: '0.78rem', color: 'var(--text-placeholder)' }}>
                  {language === 'ar' ? 'تعديل البنود الثابتة الملحقة بملفات العقود والاتفاقيات المصاغة.' : ' Boilersplate terms appended dynamically to AI generated freelance agreements.'}
                </p>
                
                <textarea 
                  value={clauses} 
                  onChange={(e) => setClauses(e.target.value)} 
                  className="milestone-form-input" 
                  style={{ minHeight: '140px', resize: 'vertical', fontFamily: 'monospace', fontSize: '0.78rem', lineHeight: '1.5' }} 
                />
                
                <button onClick={handleSaveClauses} className="submit-btn compact-btn" style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Save size={15} />
                  {language === 'ar' ? 'حفظ قالب البنود' : 'Save Clauses Template'}
                </button>
              </div>

            </div>
          )}

          {/* 3. TAB: SECURITY SETTINGS */}
          {activeTab === 'security' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* PIN Lock Toggle */}
              <div className="settings-panel-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
                <div>
                  <h5 style={{ margin: '0 0 4px 0', fontSize: '0.9rem', fontWeight: 500 }}>
                    {language === 'ar' ? 'رمز الحماية الرقمي PIN (4 أرقام)' : 'Numeric PIN Lock'}
                  </h5>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-placeholder)' }}>
                    {language === 'ar' ? 'طلب رمز المرور المكون من 4 أرقام عند قفل التطبيق تأميناً للبيانات.' : 'Protect your local browser session using a lock passcode.'}
                  </p>
                </div>
                <button 
                  onClick={() => handleTogglePin(!pinEnabled)}
                  style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}
                >
                  {pinEnabled ? (
                    <span style={{ color: '#2E7D32', fontWeight: 500 }}>ON</span>
                  ) : (
                    <span style={{ color: 'var(--text-placeholder)' }}>OFF</span>
                  )}
                </button>
              </div>

              {/* Set PIN code form */}
              {pinEnabled && (
                <div className="form-group-item animate-slide-in" style={{ maxWidth: '250px' }}>
                  <label>{language === 'ar' ? 'رمز المرور الحالي PIN' : 'Active 4-Digit Passcode'}</label>
                  <input 
                    type="password" 
                    maxLength={4} 
                    value={pinCode} 
                    onChange={(e) => handlePinCodeChange(e.target.value.replace(/\D/g, ''))} 
                    className="milestone-form-input" 
                    style={{ textAlign: 'center', fontFamily: 'monospace', letterSpacing: '12px', fontSize: '1.2rem', padding: '8px' }} 
                  />
                </div>
              )}

              {/* Fingerprint Biometric Toggle */}
              <div className="settings-panel-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
                <div>
                  <h5 style={{ margin: '0 0 4px 0', fontSize: '0.9rem', fontWeight: 500 }}>
                    {language === 'ar' ? 'مصادقة البصمة والقياسات الحيوية' : 'Biometric Fingerprint Lock'}
                  </h5>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-placeholder)' }}>
                    {language === 'ar' ? 'تفعيل مستشعر البصمة للأجهزة المحمولة المتوافقة.' : 'Allow unlocking using device\'s native biometric scanners.'}
                  </p>
                </div>
                <button 
                  onClick={() => handleToggleBiometrics(!biometricsEnabled)}
                  style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}
                >
                  {biometricsEnabled ? (
                    <span style={{ color: '#2E7D32', fontWeight: 500 }}>ON</span>
                  ) : (
                    <span style={{ color: 'var(--text-placeholder)' }}>OFF</span>
                  )}
                </button>
              </div>

              {/* Session Management & Devices */}
              <div>
                <h4 style={{ fontSize: '0.92rem', fontWeight: 500, margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShieldAlert size={16} className="text-red" style={{ color: '#D32F2F' }} />
                  {language === 'ar' ? 'الجلسات والأجهزة النشطة' : 'Session Management'}
                </h4>
                <p style={{ margin: '0 0 12px 0', fontSize: '0.78rem', color: 'var(--text-placeholder)' }}>
                  {language === 'ar' ? 'الأجهزة المتصلة حالياً بحساب DecaByte الخاص بك.' : 'Manage authenticated browser client cookies connected to this workspace.'}
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-sidebar)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.8rem' }}>
                    <div>
                      <strong>Google Chrome (Windows Desktop)</strong>
                      <span style={{ display: 'block', fontSize: '0.72rem', color: '#2E7D32', fontWeight: 500 }}>This device (Active Now)</span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-placeholder)' }}>Algiers, DZ</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-sidebar)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.8rem' }}>
                    <div>
                      <strong>Apple iPhone 14 (DecaByte App)</strong>
                      <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-placeholder)' }}>Last active: 2 hours ago</span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-placeholder)' }}>Oran, DZ</span>
                  </div>
                </div>

                <button 
                  onClick={() => { onLogoutAllDevices(); triggerToast(language === 'ar' ? 'تم تسجيل خروج باقي الأجهزة' : 'Logged out other sessions.'); }}
                  className="submit-btn compact-btn"
                  style={{ background: '#FFEBEE', color: '#D32F2F', border: '1px solid #FFCDCD', marginTop: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <LogOut size={14} />
                  {language === 'ar' ? 'تسجيل الخروج من بقية الأجهزة' : 'Terminate Other Sessions'}
                </button>
              </div>

            </div>
          )}

          {/* 4. TAB: INTEGRATIONS & BACKUP */}
          {activeTab === 'integrations' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Firebase Cloud Firestore Card */}
              <div 
                style={{ 
                  border: '1.5px solid var(--border-color)', 
                  borderRadius: '12px', 
                  padding: '20px', 
                  background: 'var(--bg-sidebar)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.2rem' }}>🔥</span>
                    <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 500 }}>Firebase Cloud Firestore</h4>
                    <span style={{ 
                      fontSize: '0.68rem', 
                      fontWeight: 500, 
                      padding: '2px 8px', 
                      borderRadius: '4px',
                      background: isFirebaseConfigured ? '#E8F5E9' : '#FFF3E0',
                      color: isFirebaseConfigured ? '#2E7D32' : '#E65100'
                    }}>
                      {isFirebaseConfigured ? 'CONNECTED' : 'CONFIG READY (.env)'}
                    </span>
                  </div>
                  <p style={{ margin: '6px 0 0 0', fontSize: '0.78rem', color: 'var(--text-placeholder)', maxWidth: '420px', lineHeight: '1.4' }}>
                    {language === 'ar'
                      ? 'مشروع Firebase: fintask-app. مزامنة سحابية لحظية لبيانات العملاء والمشاريع والفواتير والمصاريف.'
                      : 'Project: fintask-app. Real-time cloud database synchronization for clients, projects, invoices, and expenses.'}
                  </p>
                </div>

                <a 
                  href="https://console.firebase.google.com/u/0/project/fintask-app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="submit-btn compact-btn"
                  style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Link size={14} />
                  {language === 'ar' ? 'وحدة التحكم' : 'Console'}
                </a>
              </div>

              {/* Google Calendar Sync */}
              <div 
                style={{ 
                  border: '1.5px solid var(--border-color)', 
                  borderRadius: '12px', 
                  padding: '20px', 
                  background: 'var(--bg-sidebar)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '0.92rem', fontWeight: 500 }}>Google Calendar Connection</h4>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-placeholder)', maxWidth: '350px', lineHeight: '1.4' }}>
                    {language === 'ar' ? 'تصدير ومزامنة مواعيد تسليم المشاريع وتواريخ استحقاق المهام تلقائياً.' : 'Automatically sync project deadlines and timeline nodes with Google Account.'}
                  </p>
                  
                  {googleConnected && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', fontSize: '0.78rem', color: '#2E7D32', fontWeight: 500 }}>
                      <Check size={14} />
                      Connected as: {googleEmail}
                    </div>
                  )}
                </div>

                <button 
                  onClick={handleGoogleConnectToggle}
                  className="submit-btn compact-btn"
                  style={{ background: googleConnected ? '#FFEBEE' : 'var(--accent-orange)', color: googleConnected ? '#D32F2F' : 'white', border: googleConnected ? '1px solid #FFCDCD' : 'none' }}
                >
                  {googleConnected ? (language === 'ar' ? 'إلغاء المزامنة' : 'Disconnect') : (language === 'ar' ? 'ربط الحساب' : 'Connect Account')}
                </button>
              </div>

              {/* Data Backup & Export (Working JSON Trigger!) */}
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                <h4 style={{ fontSize: '0.92rem', fontWeight: 500, margin: '0 0 6px 0' }}>
                  {language === 'ar' ? 'تصدير البيانات والنسخ الاحتياطي' : 'Export & Data Backup'}
                </h4>
                <p style={{ margin: '0 0 16px 0', fontSize: '0.78rem', color: 'var(--text-placeholder)' }}>
                  {language === 'ar' ? 'تصدير نسخة كاملة من مشاريعك، عملائك، فواتيرك، ومصاريفك كملف JSON لضمان أمان عملك.' : 'Download complete workspace offline archive backup containing clients, projects, billing, and outlays.'}
                </p>

                <button 
                  onClick={onExportBackup} 
                  className="submit-btn compact-btn"
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <Download size={16} />
                  {language === 'ar' ? 'تنزيل أرشيف البيانات (JSON)' : 'Download Workspace Backup (JSON)'}
                </button>
              </div>

            </div>
          )}

          {/* 5. TAB: NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Global push toggle */}
              <div className="settings-panel-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
                <div>
                  <h5 style={{ margin: '0 0 4px 0', fontSize: '0.9rem', fontWeight: 500 }}>
                    {language === 'ar' ? 'تفعيل تنبيهات المتصفح' : 'Push Notification Alerts'}
                  </h5>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-placeholder)' }}>
                    {language === 'ar' ? 'إرسال إشعارات لسطح المكتب للمواعيد الحرجة والمهام.' : 'Receive browser tab system alerts when not actively viewing dashboard.'}
                  </p>
                </div>
                <button 
                  onClick={() => handleTogglePush(!pushEnabled)}
                  style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}
                >
                  {pushEnabled ? (
                    <span style={{ color: '#2E7D32', fontWeight: 500 }}>ENABLED</span>
                  ) : (
                    <span style={{ color: 'var(--text-placeholder)' }}>DISABLED</span>
                  )}
                </button>
              </div>

              {/* Specific switches */}
              {pushEnabled && (
                <div className="animate-slide-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingLeft: '12px' }}>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem' }}>
                    <div>
                      <strong>{language === 'ar' ? 'مواعيد تسليم المشاريع' : 'Project Deadlines Warnings'}</strong>
                      <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-placeholder)', marginTop: '2px' }}>
                        {language === 'ar' ? 'تنبيهات عندما يتبقى أقل من 3 أيام على موعد تسليم المشروع.' : 'Trigger alerts when <3 days remaining on milestone end dates.'}
                      </span>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={notifyDeadlines} 
                      onChange={(e) => handleNotificationChange('deadlines', e.target.checked)} 
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem' }}>
                    <div>
                      <strong>{language === 'ar' ? 'إشعارات سداد الفواتير والمدفوعات' : 'Payment Reminders'}</strong>
                      <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-placeholder)', marginTop: '2px' }}>
                        {language === 'ar' ? 'تنبيهات للفواتير المتأخرة المستحقة على العملاء.' : 'Alerts for unpaid final invoices crossing their due date.'}
                      </span>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={notifyPayments} 
                      onChange={(e) => handleNotificationChange('payments', e.target.checked)} 
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem' }}>
                    <div>
                      <strong>{language === 'ar' ? 'تحديثات المهام والتعليقات' : 'Task Updates & Comments'}</strong>
                      <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-placeholder)', marginTop: '2px' }}>
                        {language === 'ar' ? 'تنبيهات للمهام الموكلة والملاحظات المسجلة.' : 'Receive notification when comments are posted inside project boards.'}
                      </span>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={notifyTasks} 
                      onChange={(e) => handleNotificationChange('tasks', e.target.checked)} 
                    />
                  </div>

                </div>
              )}

            </div>
          )}

          {/* 6. TAB: ABOUT & SUPPORT */}
          {activeTab === 'about' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Version & About */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-sidebar)', padding: '16px 20px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '0.92rem', fontWeight: 500 }}>DecaByte Control Center</h4>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-placeholder)' }}>Version 1.4.2-build.90</span>
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: 500, background: 'var(--accent-orange)', color: 'white', padding: '4px 8px', borderRadius: '4px' }}>
                  Stable MVP
                </span>
              </div>

              {/* Support request ticket builder form */}
              <div>
                <h4 style={{ fontSize: '0.92rem', fontWeight: 500, margin: '0 0 6px 0' }}>
                  {language === 'ar' ? 'تواصل مع الدعم الفني والمساعدة' : 'Submit Support Ticket'}
                </h4>
                <p style={{ margin: '0 0 16px 0', fontSize: '0.78rem', color: 'var(--text-placeholder)' }}>
                  {language === 'ar' ? 'اكتب تفاصيل استفسارك أو مشكلتك الفنية وسيقوم مهندسو DecaByte بالرد عليك.' : 'Encountering bugs or cloud syncing problems? Send a ticket directly to developers.'}
                </p>

                <form onSubmit={handleSupportSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div className="form-group-item">
                    <label>{language === 'ar' ? 'عنوان الرسالة / الموضوع' : 'Subject Title'}</label>
                    <input 
                      type="text" 
                      required 
                      placeholder={language === 'ar' ? 'مثال: مشكلة في تصدير الفواتير' : 'e.g. Google Calendar Sync Error'}
                      value={supportSubject}
                      onChange={(e) => setSupportSubject(e.target.value)}
                      className="milestone-form-input" 
                    />
                  </div>

                  <div className="form-group-item">
                    <label>{language === 'ar' ? 'تفاصيل المشكلة / استفسارك' : 'Message Details'}</label>
                    <textarea 
                      required 
                      placeholder={language === 'ar' ? 'يرجى كتابة التفاصيل هنا...' : 'Explain what happened...'}
                      value={supportMessage}
                      onChange={(e) => setSupportMessage(e.target.value)}
                      className="milestone-form-input" 
                      style={{ minHeight: '100px', resize: 'vertical' }}
                    />
                  </div>

                  <button 
                    type="submit" 
                    disabled={isSubmittingSupport}
                    className="submit-btn compact-btn"
                    style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    {isSubmittingSupport ? (
                      <>
                        <span className="spinner" style={{ display: 'inline-block', width: '12px', height: '12px', border: '2px solid white', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></span>
                        {language === 'ar' ? 'جاري الإرسال...' : 'Submitting...'}
                      </>
                    ) : (
                      language === 'ar' ? 'إرسال التذكرة' : 'Submit Ticket'
                    )}
                  </button>
                </form>
              </div>

              {/* Links Legal */}
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', display: 'flex', gap: '16px', fontSize: '0.75rem', color: 'var(--text-placeholder)' }}>
                <a href="#privacy" onClick={(e) => { e.preventDefault(); triggerToast(language === 'ar' ? 'سياسة الخصوصية متوفرة بالإنترنت' : 'Privacy policy loaded.'); }} style={{ color: 'inherit' }}>
                  {language === 'ar' ? 'سياسة الخصوصية والأمان' : 'Privacy Policy'}
                </a>
                <span>•</span>
                <a href="#terms" onClick={(e) => { e.preventDefault(); triggerToast(language === 'ar' ? 'شروط الخدمة متوفرة بالإنترنت' : 'Terms of service loaded.'); }} style={{ color: 'inherit' }}>
                  {language === 'ar' ? 'شروط وأحكام الاستخدام' : 'Terms & Conditions'}
                </a>
              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
};
