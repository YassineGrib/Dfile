import React, { useState } from 'react';
import { useLanguage } from './LanguageContext';
import type { Friend } from '../types';
import { User, Phone, FileText, X } from 'lucide-react';

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
    <div className="modal-overlay animate-fade-in" onClick={onClose}>
      <div 
        className="modal-container animate-scale-up" 
        style={{ maxWidth: '440px' }} 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="kpi-card-icon-bubble purple" style={{ width: '32px', height: '32px' }}>
              <User size={16} />
            </div>
            <div>
              <h3 className="modal-title" style={{ fontSize: '1.05rem', fontWeight: 450 }}>
                {language === 'ar' ? 'إضافة صديق جديد' : 'Add New Friend'}
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                {language === 'ar' ? 'تسجيل صديق لربطه بالمعاملات والديون' : 'Add a contact to track mutual debts and favors'}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="modal-close-btn" title="Close">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {errorMsg && (
              <div style={{
                padding: '8px 12px',
                backgroundColor: 'rgba(220, 38, 38, 0.08)',
                color: '#DC2626',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.8rem',
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
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={language === 'ar' ? 'زميل عمل، صديق الطفولة، مطور شريك...' : 'Colleague, childhood friend, developer partner...'}
              />
            </div>
          </div>

          <div className="modal-footer" style={{ marginTop: '16px' }}>
            <button type="button" onClick={onClose} className="secondary-btn">
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </button>
            <button type="submit" className="submit-btn primary-submit">
              {language === 'ar' ? 'حفظ الصديق' : 'Save Friend'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
