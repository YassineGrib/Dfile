import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from './LanguageContext';
import type { Client, Project, Payment, PaymentType, PaymentMethod } from '../types';
import { CheckCircle2, CreditCard, Wallet, Building, Banknote } from 'lucide-react';

interface AddPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: Client[];
  projects: Project[];
  payments: Payment[];
  onAddPayment: (payment: Payment) => void;
  defaultClientId?: string;
  defaultProjectId?: string;
}

export const AddPaymentModal: React.FC<AddPaymentModalProps> = ({
  isOpen,
  onClose,
  clients,
  projects,
  payments,
  onAddPayment,
  defaultClientId,
  defaultProjectId,
}) => {
  const { language } = useLanguage();

  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [paymentType, setPaymentType] = useState<PaymentType>('advance');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('baridimob');
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Sync default client / project when opened
  useEffect(() => {
    if (isOpen) {
      const initialClient = defaultClientId || (clients[0]?.id ?? '');
      setSelectedClientId(initialClient);

      const clientProjects = projects.filter(p => p.client_id === initialClient);
      const initialProject = defaultProjectId || (clientProjects[0]?.id ?? '');
      setSelectedProjectId(initialProject);

      setAmount('');
      setPaymentType('advance');
      setPaymentMethod('baridimob');
      setReferenceNumber('');
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setNotes('');
      setErrorMsg('');
    }
  }, [isOpen, defaultClientId, defaultProjectId, clients, projects]);

  // Handle client change
  const handleClientChange = (cId: string) => {
    setSelectedClientId(cId);
    const clientProjects = projects.filter(p => p.client_id === cId);
    setSelectedProjectId(clientProjects[0]?.id ?? '');
  };

  // Filtered projects for the chosen client
  const clientProjects = useMemo(() => {
    return projects.filter(p => p.client_id === selectedClientId);
  }, [projects, selectedClientId]);

  // Selected project details & balance calculation
  const projectFinancials = useMemo(() => {
    const proj = projects.find(p => p.id === selectedProjectId);
    if (!proj) return { total: 0, paid: 0, remaining: 0 };

    const total = proj.price_dzd || 0;
    const paid = payments
      .filter(p => p.project_id === proj.id)
      .reduce((sum, p) => sum + (p.amount || 0), 0);
    const remaining = Math.max(0, total - paid);

    return { total, paid, remaining };
  }, [projects, payments, selectedProjectId]);

  // Preset percentage handler
  const handleApplyPreset = (ratio: number) => {
    if (projectFinancials.remaining > 0) {
      const computed = Math.round(projectFinancials.remaining * ratio);
      setAmount(computed.toString());
    } else if (projectFinancials.total > 0) {
      const computed = Math.round(projectFinancials.total * ratio);
      setAmount(computed.toString());
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);

    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMsg(language === 'ar' ? 'الرجاء إدخال مبلغ صحيح أكبر من الصفر' : 'Please enter a valid amount greater than zero');
      return;
    }

    if (!selectedClientId) {
      setErrorMsg(language === 'ar' ? 'يرجى اختيار العميل' : 'Please select a client');
      return;
    }

    if (!selectedProjectId) {
      setErrorMsg(language === 'ar' ? 'يرجى ربط الدفعة بمشروع' : 'Please select a linked project');
      return;
    }

    const newPayment: Payment = {
      id: 'pay_' + Math.random().toString(36).substring(2, 10),
      client_id: selectedClientId,
      project_id: selectedProjectId,
      amount: numAmount,
      payment_type: paymentType,
      payment_method: paymentMethod,
      reference_number: referenceNumber.trim() || undefined,
      notes: notes.trim() || undefined,
      payment_date: paymentDate,
      created_at: new Date().toISOString(),
    };

    onAddPayment(newPayment);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="slide-over-overlay" onClick={onClose}>
      <div 
        className="slide-over-container animate-slide-in" 
        onClick={(e) => e.stopPropagation()}
        style={{ direction: language === 'ar' ? 'rtl' : 'ltr' }}
      >
        {/* Header */}
        <div className="slide-over-header">
          <div className="client-badge-profile">
            <div className="profile-large-avatar" style={{ backgroundColor: 'var(--btn-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Banknote size={22} />
            </div>
            <div>
              <h3 className="profile-name-title">
                {language === 'ar' ? 'تسجيل دفعة نقدية جديدة' : 'Record New Payment'}
              </h3>
              <span className="profile-muted-date">
                {language === 'ar' ? 'تسوية التدفق المالي وحساب المتبقي' : 'Record client deposit & debt reconciliation'}
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
              <div className="alert-box error" style={{ padding: '8px 12px', fontSize: '0.8rem', margin: 0 }}>
                <span>{errorMsg}</span>
              </div>
            )}

            {/* 1. Client Picker */}
            <div className="form-group">
              <label className="form-label">{language === 'ar' ? 'العميل المرسل للمال *' : 'Paying Client *'}</label>
              <select
                value={selectedClientId}
                onChange={(e) => handleClientChange(e.target.value)}
                className="form-input"
                required
              >
                <option value="" disabled>
                  {language === 'ar' ? '-- اختر العميل --' : '-- Select Client --'}
                </option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Project Picker with Dynamic Balance Hint */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label className="form-label" style={{ margin: 0 }}>
                  {language === 'ar' ? 'المشروع المرتبط *' : 'Linked Project *'}
                </label>
                {projectFinancials.total > 0 && (
                  <span style={{ fontSize: '0.74rem', color: projectFinancials.remaining === 0 ? '#0E4F2F' : 'var(--accent-orange)' }}>
                    {language === 'ar' 
                      ? `المتبقي: ${projectFinancials.remaining.toLocaleString()} دج`
                      : `Remaining: ${projectFinancials.remaining.toLocaleString()} DZ`}
                  </span>
                )}
              </div>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="form-input"
                required
                disabled={clientProjects.length === 0}
              >
                {clientProjects.length === 0 ? (
                  <option value="">{language === 'ar' ? 'لا توجد مشاريع مسجلة لهذا العميل' : 'No projects for this client'}</option>
                ) : (
                  clientProjects.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.price_dzd.toLocaleString()} DZ)
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* 3. Amount & Percentage Quick Presets */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label className="form-label" style={{ margin: 0 }}>
                  {language === 'ar' ? 'المبلغ المستلم (دج) *' : 'Amount Received (DZD) *'}
                </label>
                <div className="payment-preset-row">
                  <button type="button" onClick={() => handleApplyPreset(0.25)} className="preset-chip-btn">
                    25%
                  </button>
                  <button type="button" onClick={() => handleApplyPreset(0.5)} className="preset-chip-btn">
                    50%
                  </button>
                  <button type="button" onClick={() => handleApplyPreset(1.0)} className="preset-chip-btn" style={{ borderColor: 'var(--btn-primary)', color: 'var(--btn-primary)' }}>
                    {language === 'ar' ? 'كامل المتبقي' : '100% Full'}
                  </button>
                </div>
              </div>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type="number"
                  min="1"
                  step="any"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  className="form-input"
                  style={{ fontSize: '1.1rem', fontWeight: 450, color: '#0E4F2F' }}
                  required
                />
                <span style={{ 
                  position: 'absolute', 
                  [language === 'ar' ? 'left' : 'right']: '14px', 
                  color: 'var(--text-muted)', 
                  fontSize: '0.85rem',
                  pointerEvents: 'none' 
                }}>
                  {language === 'ar' ? 'دج' : 'DZD'}
                </span>
              </div>
            </div>

            {/* 4. Payment Method Selector Cards */}
            <div className="form-group">
              <label className="form-label" style={{ marginBottom: '8px' }}>
                {language === 'ar' ? 'طريقة الدفع والاستلام' : 'Payment Method'}
              </label>
              <div className="method-select-grid">
                {/* BaridiMob */}
                <div 
                  onClick={() => setPaymentMethod('baridimob')}
                  className={`method-select-card ${paymentMethod === 'baridimob' ? 'selected' : ''}`}
                >
                  <Wallet size={18} color={paymentMethod === 'baridimob' ? 'var(--accent-purple)' : '#E05300'} />
                  <span className="method-select-label">{language === 'ar' ? 'بريدي موب' : 'BaridiMob'}</span>
                </div>

                {/* CCP */}
                <div 
                  onClick={() => setPaymentMethod('ccp')}
                  className={`method-select-card ${paymentMethod === 'ccp' ? 'selected' : ''}`}
                >
                  <CreditCard size={18} color={paymentMethod === 'ccp' ? 'var(--accent-purple)' : '#D97706'} />
                  <span className="method-select-label">CCP</span>
                </div>

                {/* Bank Wire */}
                <div 
                  onClick={() => setPaymentMethod('bank_transfer')}
                  className={`method-select-card ${paymentMethod === 'bank_transfer' ? 'selected' : ''}`}
                >
                  <Building size={18} color={paymentMethod === 'bank_transfer' ? 'var(--accent-purple)' : '#2563EB'} />
                  <span className="method-select-label">{language === 'ar' ? 'تحويل بنكي' : 'Bank Wire'}</span>
                </div>

                {/* Cash */}
                <div 
                  onClick={() => setPaymentMethod('cash')}
                  className={`method-select-card ${paymentMethod === 'cash' ? 'selected' : ''}`}
                >
                  <Banknote size={18} color={paymentMethod === 'cash' ? 'var(--accent-purple)' : '#0E4F2F'} />
                  <span className="method-select-label">{language === 'ar' ? 'نقداً (كاش)' : 'Cash'}</span>
                </div>
              </div>
            </div>

            {/* 5. Payment Type & Date */}
            <div className="modal-dates-row">
              <div className="form-group">
                <label className="form-label">
                  {language === 'ar' ? 'مرحلة الدفعة' : 'Payment Type'}
                </label>
                <select
                  value={paymentType}
                  onChange={(e) => setPaymentType(e.target.value as PaymentType)}
                  className="form-input"
                >
                  <option value="advance">{language === 'ar' ? 'تسبيق / عربون أول' : 'Advance / Upfront'}</option>
                  <option value="milestone">{language === 'ar' ? 'دفعة مرحلية' : 'Milestone Payment'}</option>
                  <option value="final">{language === 'ar' ? 'سداد نهائي' : 'Final Settlement'}</option>
                  <option value="tip">{language === 'ar' ? 'إكرامية / بونص' : 'Bonus / Tip'}</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">
                  {language === 'ar' ? 'تاريخ الاستلام' : 'Date Received'}
                </label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="form-input"
                  required
                />
              </div>
            </div>

            {/* 6. Reference Number / Transaction Slip */}
            <div className="form-group">
              <label className="form-label">
                {language === 'ar' ? 'رقم الحوالة / إشعار بريدي موب (اختياري)' : 'Transaction ID / Slip Ref (Optional)'}
              </label>
              <input
                type="text"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="e.g. TXN-928471 or BaridiMob #39281"
                className="form-input"
              />
            </div>

            {/* 7. Notes */}
            <div className="form-group">
              <label className="form-label">
                {language === 'ar' ? 'ملاحظات إضافية' : 'Notes / Remarks'}
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={language === 'ar' ? 'مثال: تم الاستلام نقداً بعد تسليم النسخة الأولى' : 'e.g. Received after milestone 1 delivery'}
                className="form-input"
              />
            </div>
          </div>

          {/* Footer Actions inside slide-over */}
          <div className="modal-footer" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: 'auto' }}>
            <button type="button" onClick={onClose} className="btn-secondary">
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </button>
            <button type="submit" className="submit-btn primary-submit">
              <CheckCircle2 size={16} />
              <span>{language === 'ar' ? 'حفظ وتأكيد الدفعة' : 'Record Payment'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
