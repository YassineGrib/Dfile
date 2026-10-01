import React, { useState } from 'react';
import { useLanguage } from './LanguageContext';
import type { Friend } from '../types';
import { User, Phone, FileText } from 'lucide-react';

interface AddFriendModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddFriend: (friend: Friend) => void;
}

export const AddFriendModal: React.FC<AddFriendModalProps> = ({
  isOpen,
  onClose,
  onAddFriend,
}) => {
  const { language } = useLanguage();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg(language === 'ar' ? 'يرجى إدخال اسم الصديق' : 'Please enter the friend name');
      return;
    }

    const newFriend: Friend = {
      id: 'fr_' + Math.random().toString(36).substring(2, 9),
      name: name.trim(),
      phone: phone.trim() || undefined,
      notes: notes.trim() || undefined,
      created_at: new Date().toISOString(),
    };

    onAddFriend(newFriend);
    setName('');
    setPhone('');
    setNotes('');
    setErrorMsg('');
    onClose();
  };

  return (
    <div className="slide-over-overlay" onClick={onClose}>
      <div 
        className="slide-over-container animate-slide-in" 
        onClick={(e) => e.stopPropagation()}
        style={{ direction: language === 'ar' ? 'rtl' : 'ltr', maxWidth: '460px' }}
      >
        {/* Slide-over Header */}
        <div className="slide-over-header">
          <div className="client-badge-profile">
            <div className="profile-large-avatar" style={{ backgroundColor: 'var(--accent-purple)' }}>
              <User size={22} color="#FFFFFF" />
            </div>
            <div>
              <h3 className="profile-name-title">
                {language === 'ar' ? 'إضافة صديق جديد' : 'Add New Friend'}
              </h3>
              <span className="profile-muted-date">
                {language === 'ar' ? 'تسجيل صديق لربطه بالمعاملات والديون' : 'Add a contact to track mutual debts and favors'}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="close-slide-over-btn" aria-label="Close">
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="slide-over-content-body" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {errorMsg && (
              <div style={{
                padding: '10px 14px',
                backgroundColor: 'rgba(220, 38, 38, 0.08)',
                color: '#DC2626',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.82rem',
                border: '1px solid rgba(220, 38, 38, 0.2)'
              }}>
                {errorMsg}
              </div>
            )}

            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <User size={13} />
                <span>{language === 'ar' ? 'اسم الصديق *' : 'Friend Name *'}</span>
              </label>
              <input
                type="text"
                className="form-input"
                required
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                placeholder={language === 'ar' ? 'مثال: كريم بوعلام' : 'e.g. Karim Boualam'}
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Phone size={13} />
                <span>{language === 'ar' ? 'رقم الهاتف / واتساب (اختياري)' : 'Phone / WhatsApp (Optional)'}</span>
              </label>
              <input
                type="tel"
                className="form-input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+213 550 00 00 00"
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FileText size={13} />
                <span>{language === 'ar' ? 'ملاحظة أو صلة القرابة (اختياري)' : 'Notes / Context (Optional)'}</span>
              </label>
              <textarea
                className="form-input"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={language === 'ar' ? 'زميل عمل، صديق الطفولة، مطور شريك...' : 'Colleague, childhood friend, developer partner...'}
              />
            </div>
          </div>

          {/* Footer inside slide-over */}
          <div className="modal-footer" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: 'auto' }}>
            <button type="button" onClick={onClose} className="btn-secondary">
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </button>
            <button type="submit" className="submit-btn primary-submit" disabled={!name.trim()}>
              {language === 'ar' ? 'حفظ الصديق' : 'Save Friend'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
