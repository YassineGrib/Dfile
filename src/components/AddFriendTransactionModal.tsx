import React, { useState, useEffect } from 'react';
import { useLanguage } from './LanguageContext';
import type { Friend, FriendTransaction, FriendTransactionDirection, FriendTransactionType } from '../types';
import { 
  X, Plus, Banknote, Briefcase, Receipt, 
  ArrowDownLeft, ArrowUpRight, Calendar, User, FileText 
} from 'lucide-react';

interface AddFriendTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  friends: Friend[];
  defaultFriendId?: string;
  onAddTransaction: (tx: FriendTransaction) => void;
  onOpenAddFriend?: () => void;
}

export const AddFriendTransactionModal: React.FC<AddFriendTransactionModalProps> = ({
  isOpen,
  onClose,
  friends,
  defaultFriendId,
  onAddTransaction,
  onOpenAddFriend,
}) => {
  const { language } = useLanguage();

  const [selectedFriendId, setSelectedFriendId] = useState<string>('');
  const [direction, setDirection] = useState<FriendTransactionDirection>('lent');
  const [type, setType] = useState<FriendTransactionType>('money');
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setSelectedFriendId(defaultFriendId || (friends[0]?.id ?? ''));
      setDirection('lent');
      setType('money');
      setAmount('');
      setDescription('');
      setDate(new Date().toISOString().split('T')[0]);
      setDueDate('');
      setErrorMsg('');
    }
  }, [isOpen, defaultFriendId, friends]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFriendId) {
      setErrorMsg(language === 'ar' ? 'يرجى اختيار الصديق أو إضافة صديق جديد' : 'Please select a friend or add a new friend');
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMsg(language === 'ar' ? 'يرجى إدخال مبلغ صحيح أكبر من الصفر' : 'Please enter a valid amount greater than 0');
      return;
    }

    if (!description.trim()) {
      setErrorMsg(language === 'ar' ? 'يرجى إدخال وصف المعاملة' : 'Please enter a description');
      return;
    }

    const newTx: FriendTransaction = {
      id: 'ftr_' + Math.random().toString(36).substring(2, 9),
      friend_id: selectedFriendId,
      type,
      direction,
      amount: parsedAmount,
      paid_amount: 0,
      description: description.trim(),
      due_date: dueDate.trim() || undefined,
      status: 'pending',
      date: date || new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString(),
    };

    onAddTransaction(newTx);
    onClose();
  };

  return (
    <div className="modal-overlay animate-fade-in" onClick={onClose}>
      <div 
        className="modal-container animate-scale-up" 
        style={{ maxWidth: '520px' }} 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className={`kpi-card-icon-bubble ${direction === 'lent' ? 'green' : 'orange'}`} style={{ width: '34px', height: '34px' }}>
              {direction === 'lent' ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
            </div>
            <div>
              <h3 className="modal-title" style={{ fontSize: '1.05rem', fontWeight: 450 }}>
                {language === 'ar' ? 'تسجيل معاملة / دين جديد' : 'Record New Friend Transaction'}
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                {language === 'ar' ? 'تسجيل دين نقدي أو خدمة متبادلة أو مصاريف مشتركة' : 'Track loan, favor, mutual service or shared cost'}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="modal-close-btn" title="Close">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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

            {/* 1. Friend Selector with Quick Add */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label className="form-label" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <User size={13} />
                  <span>{language === 'ar' ? 'الصديق المعني *' : 'Friend *'}</span>
                </label>
                {onOpenAddFriend && (
                  <button 
                    type="button" 
                    onClick={onOpenAddFriend}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--btn-primary)',
                      fontSize: '0.76rem',
                      fontWeight: 450,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Plus size={12} />
                    <span>{language === 'ar' ? 'صديق جديد' : 'New Friend'}</span>
                  </button>
                )}
              </div>

              {friends.length === 0 ? (
                <div style={{
                  padding: '12px',
                  backgroundColor: 'var(--bg-hover)',
                  border: '1px dashed var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  textAlign: 'center',
                  fontSize: '0.82rem',
                  color: 'var(--text-secondary)'
                }}>
                  {language === 'ar' ? 'لا يوجد أصدقاء مسجلون حتى الآن.' : 'No friends added yet.'}
                  {onOpenAddFriend && (
                    <button 
                      type="button"
                      onClick={onOpenAddFriend}
                      className="submit-btn" 
                      style={{ margin: '8px auto 0', display: 'flex', padding: '6px 12px', fontSize: '0.78rem' }}
                    >
                      <Plus size={12} />
                      <span>{language === 'ar' ? 'إضافة صديق الآن' : 'Add Friend Now'}</span>
                    </button>
                  )}
                </div>
              ) : (
                <select
                  className="form-input"
                  value={selectedFriendId}
                  onChange={(e) => setSelectedFriendId(e.target.value)}
                  required
                >
                  {friends.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} {f.phone ? `(${f.phone})` : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* 2. Direction Toggle (Segmented) */}
            <div className="form-group">
              <label className="form-label">
                {language === 'ar' ? 'اتجاه المعاملة *' : 'Transaction Direction *'}
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div
                  className={`method-radio-card ${direction === 'lent' ? 'selected' : ''}`}
                  onClick={() => setDirection('lent')}
                  style={{
                    borderColor: direction === 'lent' ? '#16A34A' : undefined,
                    backgroundColor: direction === 'lent' ? 'rgba(22, 163, 74, 0.06)' : undefined,
                    color: direction === 'lent' ? '#16A34A' : undefined
                  }}
                >
                  <ArrowDownLeft size={16} />
                  <div>
                    <div style={{ fontWeight: 450 }}>{language === 'ar' ? 'لي (دين عليه)' : 'Owed to Me'}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {language === 'ar' ? 'أقرضته أو قدمت له خدمة' : 'I lent money or gave service'}
                    </div>
                  </div>
                </div>

                <div
                  className={`method-radio-card ${direction === 'borrowed' ? 'selected' : ''}`}
                  onClick={() => setDirection('borrowed')}
                  style={{
                    borderColor: direction === 'borrowed' ? '#DC2626' : undefined,
                    backgroundColor: direction === 'borrowed' ? 'rgba(220, 38, 38, 0.06)' : undefined,
                    color: direction === 'borrowed' ? '#DC2626' : undefined
                  }}
                >
                  <ArrowUpRight size={16} />
                  <div>
                    <div style={{ fontWeight: 450 }}>{language === 'ar' ? 'عليّ (دين له)' : 'I Owe'}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {language === 'ar' ? 'اقترضت منه أو قدم لي خدمة' : 'I borrowed or received service'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Transaction Type Selector */}
            <div className="form-group">
              <label className="form-label">
                {language === 'ar' ? 'نوع المعاملة *' : 'Transaction Nature *'}
              </label>
              <div className="method-radio-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                <div 
                  className={`method-radio-card ${type === 'money' ? 'selected' : ''}`}
                  onClick={() => setType('money')}
                >
                  <Banknote size={15} />
                  <span>{language === 'ar' ? 'دين نقدي' : 'Money Loan'}</span>
                </div>
                <div 
                  className={`method-radio-card ${type === 'service' ? 'selected' : ''}`}
                  onClick={() => setType('service')}
                >
                  <Briefcase size={15} />
                  <span>{language === 'ar' ? 'خدمة / عمل' : 'Service'}</span>
                </div>
                <div 
                  className={`method-radio-card ${type === 'expense' ? 'selected' : ''}`}
                  onClick={() => setType('expense')}
                >
                  <Receipt size={15} />
                  <span>{language === 'ar' ? 'نفقة مشتركة' : 'Shared Cost'}</span>
                </div>
              </div>
            </div>

            {/* 4. Amount Input */}
            <div className="form-group">
              <label className="form-label">
                {language === 'ar' ? 'المبلغ الإجمالي (دج) *' : 'Total Amount (DZD) *'}
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="number"
                  min="1"
                  step="any"
                  className="form-input"
                  required
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    if (errorMsg) setErrorMsg('');
                  }}
                  placeholder="5000"
                  style={{ fontSize: '1.05rem', fontWeight: 450 }}
                />
                <span style={{
                  position: 'absolute',
                  insetInlineEnd: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: '0.8rem',
                  color: 'var(--text-muted)'
                }}>
                  DZ
                </span>
              </div>
            </div>

            {/* 5. Description */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FileText size={13} />
                <span>{language === 'ar' ? 'البيان / الوصف والتفاصيل *' : 'Description & Details *'}</span>
              </label>
              <input
                type="text"
                className="form-input"
                required
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                placeholder={
                  type === 'service'
                    ? (language === 'ar' ? 'مثال: تطوير واجهة المستخدم لتطبيقه' : 'e.g. Frontend UI design for his app')
                    : type === 'expense'
                    ? (language === 'ar' ? 'مثال: دفع فاتورة الاستضافة السنوية عنه' : 'e.g. Paid annual server hosting bill')
                    : (language === 'ar' ? 'مثال: سلفة نقدية عبر بريدي موب' : 'e.g. Cash transfer via BaridiMob')
                }
              />
            </div>

            {/* 6. Dates Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Calendar size={13} />
                  <span>{language === 'ar' ? 'تاريخ المعاملة' : 'Date'}</span>
                </label>
                <input
                  type="date"
                  className="form-input"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Calendar size={13} />
                  <span>{language === 'ar' ? 'تاريخ الاستحقاق (اختياري)' : 'Due Date (Optional)'}</span>
                </label>
                <input
                  type="date"
                  className="form-input"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </div>

          </div>

          <div className="modal-footer" style={{ marginTop: '16px' }}>
            <button type="button" onClick={onClose} className="secondary-btn">
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </button>
            <button 
              type="submit" 
              className="submit-btn primary-submit"
              disabled={friends.length === 0}
            >
              {language === 'ar' ? 'حفظ المعاملة' : 'Save Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
