import React, { useState, useEffect } from 'react';
import { useLanguage } from './LanguageContext';
import type { FriendTransaction, FriendSettlement, FriendSettlementMethod } from '../types';
import { X, CheckCircle2, Banknote, CreditCard, Building, Wrench, FileText, Calendar } from 'lucide-react';

interface SettleTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: FriendTransaction | null;
  friendName?: string;
  onSettle: (settlement: FriendSettlement, updatedTransaction: FriendTransaction) => void;
}

export const SettleTransactionModal: React.FC<SettleTransactionModalProps> = ({
  isOpen,
  onClose,
  transaction,
  friendName,
  onSettle,
}) => {
  const { language } = useLanguage();

  const [settleAmount, setSettleAmount] = useState<string>('');
  const [method, setMethod] = useState<FriendSettlementMethod>('baridimob');
  const [notes, setNotes] = useState<string>('');
  const [settleDate, setSettleDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const remaining = transaction 
    ? Math.max(0, transaction.amount - (transaction.paid_amount || 0))
    : 0;

  useEffect(() => {
    if (isOpen && transaction) {
      const rem = Math.max(0, transaction.amount - (transaction.paid_amount || 0));
      setSettleAmount(rem.toString());
      setMethod('baridimob');
      setNotes('');
      setSettleDate(new Date().toISOString().split('T')[0]);
      setErrorMsg('');
    }
  }, [isOpen, transaction]);

  if (!isOpen || !transaction) return null;

  const handlePercentage = (pct: number) => {
    const val = Math.round((remaining * pct) / 100);
    setSettleAmount(val.toString());
    if (errorMsg) setErrorMsg('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(settleAmount);

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMsg(language === 'ar' ? 'يرجى إدخال مبلغ تسوية صحيح' : 'Please enter a valid settlement amount');
      return;
    }

    if (parsedAmount > remaining) {
      setErrorMsg(
        language === 'ar' 
          ? `لا يمكن أن يتجاوز مبلغ التسوية الرصيد المتبقي (${remaining.toLocaleString()} دج)` 
          : `Settlement amount cannot exceed remaining balance (${remaining.toLocaleString()} DZ)`
      );
      return;
    }

    if (method === 'service_offset' && !notes.trim()) {
      setErrorMsg(
        language === 'ar'
          ? 'يرجى كتابة تفاصيل الخدمة المقابلة في الملاحظات'
          : 'Please describe the offset service in notes'
      );
      return;
    }

    const newSettlement: FriendSettlement = {
      id: 'fstl_' + Math.random().toString(36).substring(2, 9),
      transaction_id: transaction.id,
      friend_id: transaction.friend_id,
      amount: parsedAmount,
      payment_method: method,
      notes: notes.trim() || undefined,
      date: settleDate || new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString(),
    };

    const newPaid = (transaction.paid_amount || 0) + parsedAmount;
    const isFullyPaid = newPaid >= transaction.amount;

    const updatedTransaction: FriendTransaction = {
      ...transaction,
      paid_amount: newPaid,
      status: isFullyPaid ? 'settled' : 'partially_paid',
    };

    onSettle(newSettlement, updatedTransaction);
    onClose();
  };

  return (
    <div className="modal-overlay animate-fade-in" onClick={onClose} style={{ zIndex: 300 }}>
      <div 
        className="modal-container animate-scale-up" 
        style={{ maxWidth: '480px' }} 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="kpi-card-icon-bubble green" style={{ width: '34px', height: '34px' }}>
              <CheckCircle2 size={16} />
            </div>
            <div>
              <h3 className="modal-title" style={{ fontSize: '1.05rem', fontWeight: 450 }}>
                {language === 'ar' ? 'تسجيل تسوية أو سداد' : 'Record Settlement / Payment'}
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                {friendName ? `${language === 'ar' ? 'مع الصديق: ' : 'With: '} ${friendName}` : ''}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="modal-close-btn" title="Close">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Transaction Overview Card */}
            <div style={{
              backgroundColor: 'var(--bg-hover)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 14px',
              border: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 450, color: 'var(--text-primary)' }}>
                  {transaction.description}
                </span>
                <span className={`badge-direction ${transaction.direction}`}>
                  {transaction.direction === 'lent' 
                    ? (language === 'ar' ? 'دين لك' : 'Owed to you')
                    : (language === 'ar' ? 'دين عليك' : 'You owe')}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                <span>{language === 'ar' ? 'المبلغ الكلي:' : 'Total:'} {transaction.amount.toLocaleString()} DZ</span>
                <span>{language === 'ar' ? 'المسدد سابقاً:' : 'Paid:'} {(transaction.paid_amount || 0).toLocaleString()} DZ</span>
                <span style={{ fontWeight: 450, color: 'var(--text-primary)' }}>
                  {language === 'ar' ? 'المتبقي:' : 'Remaining:'} {remaining.toLocaleString()} DZ
                </span>
              </div>
            </div>

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

            {/* Settle Amount */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <label className="form-label" style={{ margin: 0 }}>
                  {language === 'ar' ? 'المبلغ المراد تسويته (دج) *' : 'Settlement Amount (DZD) *'}
                </label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button 
                    type="button" 
                    onClick={() => handlePercentage(50)}
                    className="view-mode-pill-btn"
                    style={{ padding: '2px 8px', fontSize: '0.72rem' }}
                  >
                    50%
                  </button>
                  <button 
                    type="button" 
                    onClick={() => handlePercentage(100)}
                    className="view-mode-pill-btn active"
                    style={{ padding: '2px 8px', fontSize: '0.72rem' }}
                  >
                    {language === 'ar' ? 'سداد كامل' : '100% Full'}
                  </button>
                </div>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type="number"
                  min="1"
                  max={remaining}
                  step="any"
                  className="form-input"
                  required
                  value={settleAmount}
                  onChange={(e) => {
                    setSettleAmount(e.target.value);
                    if (errorMsg) setErrorMsg('');
                  }}
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

            {/* Settlement Method Selector */}
            <div className="form-group">
              <label className="form-label">
                {language === 'ar' ? 'طريقة التسوية / السداد *' : 'Settlement Method *'}
              </label>
              <div className="method-radio-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
                <div 
                  className={`method-radio-card ${method === 'baridimob' ? 'selected' : ''}`}
                  onClick={() => setMethod('baridimob')}
                >
                  <CreditCard size={15} />
                  <span>{language === 'ar' ? 'بريدي موب (BaridiMob)' : 'BaridiMob'}</span>
                </div>
                <div 
                  className={`method-radio-card ${method === 'cash' ? 'selected' : ''}`}
                  onClick={() => setMethod('cash')}
                >
                  <Banknote size={15} />
                  <span>{language === 'ar' ? 'نقداً (كاش)' : 'Cash'}</span>
                </div>
                <div 
                  className={`method-radio-card ${method === 'service_offset' ? 'selected' : ''}`}
                  onClick={() => setMethod('service_offset')}
                >
                  <Wrench size={15} />
                  <span>{language === 'ar' ? 'مقاصة خدمة متبادلة' : 'Service Offset'}</span>
                </div>
                <div 
                  className={`method-radio-card ${method === 'bank_transfer' ? 'selected' : ''}`}
                  onClick={() => setMethod('bank_transfer')}
                >
                  <Building size={15} />
                  <span>{language === 'ar' ? 'تحويل بنكي / CCP' : 'Bank Transfer'}</span>
                </div>
              </div>
            </div>

            {/* Notes / Details */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FileText size={13} />
                <span>
                  {method === 'service_offset' 
                    ? (language === 'ar' ? 'شرح الخدمة المقابلة *' : 'Offset Service Details *')
                    : (language === 'ar' ? 'ملاحظات التسوية (اختياري)' : 'Settlement Notes (Optional)')}
                </span>
              </label>
              <input
                type="text"
                className="form-input"
                required={method === 'service_offset'}
                value={notes}
                onChange={(e) => {
                  setNotes(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                placeholder={
                  method === 'service_offset'
                    ? (language === 'ar' ? 'مثال: تم خصم المبلغ مقابل صيانة حاسوبه' : 'e.g. Deducted against fixing his PC')
                    : (language === 'ar' ? 'مثال: تم التحويل إلى بريدي موب واستلام الوصل' : 'e.g. Transferred via BaridiMob')
                }
              />
            </div>

            {/* Date */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calendar size={13} />
                <span>{language === 'ar' ? 'تاريخ التسوية' : 'Settlement Date'}</span>
              </label>
              <input
                type="date"
                className="form-input"
                value={settleDate}
                onChange={(e) => setSettleDate(e.target.value)}
              />
            </div>

          </div>

          <div className="modal-footer" style={{ marginTop: '16px' }}>
            <button type="button" onClick={onClose} className="secondary-btn">
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </button>
            <button type="submit" className="submit-btn primary-submit">
              {language === 'ar' ? 'تأكيد التسوية' : 'Confirm Settlement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
