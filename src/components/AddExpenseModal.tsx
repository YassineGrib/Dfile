import React, { useState, useEffect } from 'react';
import { useLanguage } from './LanguageContext';
import type { Project, Expense, PaymentMethod } from '../types';
import { 
  CheckCircle2, CreditCard, Wallet, Building, Banknote, 
  Cpu, Cloud, Megaphone, Laptop, Box, TrendingDown, X 
} from 'lucide-react';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  onAddExpense: (expense: Expense) => void;
  onEditExpense?: (expense: Expense) => void;
  expenseToEdit?: Expense | null;
  defaultProjectId?: string;
}

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  isOpen,
  onClose,
  projects,
  onAddExpense,
  onEditExpense,
  expenseToEdit,
  defaultProjectId,
}) => {
  const { language } = useLanguage();

  const [amount, setAmount] = useState<string>('');
  const [category, setCategory] = useState<string>('Software/Tools');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('baridimob');
  const [expenseDate, setExpenseDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState<string>('');
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      if (expenseToEdit) {
        setAmount(expenseToEdit.amount.toString());
        setCategory(expenseToEdit.category || 'Software/Tools');
        setSelectedProjectId(expenseToEdit.project_id || '');
        setPaymentMethod((expenseToEdit.payment_method as PaymentMethod) || 'baridimob');
        setExpenseDate(expenseToEdit.expense_date || new Date().toISOString().split('T')[0]);
        setDescription(expenseToEdit.description || '');
        setReferenceNumber(expenseToEdit.reference_number || '');
        setNotes(expenseToEdit.notes || '');
      } else {
        setAmount('');
        setCategory('Software/Tools');
        setSelectedProjectId(defaultProjectId || '');
        setPaymentMethod('baridimob');
        setExpenseDate(new Date().toISOString().split('T')[0]);
        setDescription('');
        setReferenceNumber('');
        setNotes('');
      }
      setErrorMsg('');
    }
  }, [isOpen, expenseToEdit, defaultProjectId]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);

    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMsg(
        language === 'ar' 
          ? 'الرجاء إدخال مبلغ صحيح أكبر من الصفر' 
          : 'Please enter a valid amount greater than zero'
      );
      return;
    }

    if (!description.trim()) {
      setErrorMsg(
        language === 'ar'
          ? 'يرجى كتابة بيان / وصف المصروف'
          : 'Please enter a description for the expense'
      );
      return;
    }

    if (expenseToEdit && onEditExpense) {
      const updated: Expense = {
        ...expenseToEdit,
        amount: numAmount,
        category,
        project_id: selectedProjectId || undefined,
        payment_method: paymentMethod,
        expense_date: expenseDate,
        description: description.trim(),
        reference_number: referenceNumber.trim() || undefined,
        notes: notes.trim() || undefined,
      };
      onEditExpense(updated);
    } else {
      const newExp: Expense = {
        id: 'exp_' + Math.random().toString(36).substring(2, 10),
        amount: numAmount,
        category,
        project_id: selectedProjectId || undefined,
        payment_method: paymentMethod,
        expense_date: expenseDate,
        description: description.trim(),
        reference_number: referenceNumber.trim() || undefined,
        notes: notes.trim() || undefined,
        created_at: new Date().toISOString(),
      };
      onAddExpense(newExp);
    }

    onClose();
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'Software/Tools': return <Cpu size={15} />;
      case 'Hosting/Services': return <Cloud size={15} />;
      case 'Marketing': return <Megaphone size={15} />;
      case 'Equipment': return <Laptop size={15} />;
      default: return <Box size={15} />;
    }
  };

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
            <div 
              className="profile-large-avatar" 
              style={{ 
                backgroundColor: '#FFEBEE', 
                color: '#D32F2F', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}
            >
              <TrendingDown size={22} />
            </div>
            <div>
              <h3 className="profile-name-title">
                {expenseToEdit 
                  ? (language === 'ar' ? 'تعديل تفاصيل المصروف' : 'Edit Expense Record')
                  : (language === 'ar' ? 'تسجيل مصروف جديد' : 'Record New Expense')}
              </h3>
              <span className="profile-muted-date">
                {language === 'ar' 
                  ? 'توثيق النفقات وتوزيع التكاليف التشغيلية والمشاريع' 
                  : 'Track operational costs and project expenditure allocations'}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="close-slide-over-btn" aria-label="Close">
            <X size={18} />
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

            {/* 1. Amount Input */}
            <div className="form-group">
              <label className="form-label" style={{ marginBottom: '6px' }}>
                {language === 'ar' ? 'المبلغ المستقطع (دج) *' : 'Outlay Amount (DZD) *'}
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type="number"
                  min="1"
                  step="any"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  className="form-input"
                  style={{ fontSize: '1.1rem', fontWeight: 450, color: '#D32F2F' }}
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

            {/* 2. Category Selector */}
            <div className="form-group">
              <label className="form-label">
                {language === 'ar' ? 'تصنيف النفقة *' : 'Expense Category *'}
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
                {[
                  { id: 'Software/Tools', labelAr: 'برامج وأدوات', labelEn: 'Software/Tools' },
                  { id: 'Hosting/Services', labelAr: 'استضافة وسيرفرات', labelEn: 'Hosting/Services' },
                  { id: 'Marketing', labelAr: 'تسويق وإعلانات', labelEn: 'Marketing' },
                  { id: 'Equipment', labelAr: 'أجهزة ومعدات', labelEn: 'Equipment' },
                  { id: 'Others', labelAr: 'تكاليف أخرى', labelEn: 'Others' }
                ].map(cat => (
                  <button
                    type="button"
                    key={cat.id}
                    onClick={() => setCategory(cat.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-sm)',
                      border: category === cat.id ? '1.5px solid var(--accent-purple)' : '1px solid var(--border-color)',
                      backgroundColor: category === cat.id ? 'var(--accent-purple-light)' : 'var(--bg-canvas)',
                      color: category === cat.id ? 'var(--accent-purple)' : 'var(--text-main)',
                      fontSize: '0.78rem',
                      fontWeight: 450,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {getCategoryIcon(cat.id)}
                    <span>{language === 'ar' ? cat.labelAr : cat.labelEn}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Description / Reason */}
            <div className="form-group">
              <label className="form-label">
                {language === 'ar' ? 'بيان / تفاصيل التكلفة *' : 'Description / Item *'}
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={language === 'ar' ? 'مثال: اشتراك شهري في Figma Pro أو تجديد دومين' : 'e.g. Monthly Figma Pro plan or domain renewal'}
                className="form-input"
                required
              />
            </div>

            {/* 4. Linked Project (Optional) */}
            <div className="form-group">
              <label className="form-label">
                {language === 'ar' ? 'المشروع المرتبط (اختياري)' : 'Linked Project (Optional)'}
              </label>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="form-input"
              >
                <option value="">
                  {language === 'ar' ? '-- عام (تكلفة عامة غير مرتبطة بمشروع) --' : '-- General Business Cost (Not Linked) --'}
                </option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.price_dzd?.toLocaleString() || 0} DZ)
                  </option>
                ))}
              </select>
            </div>

            {/* 5. Payment Method Selector Cards */}
            <div className="form-group">
              <label className="form-label" style={{ marginBottom: '8px' }}>
                {language === 'ar' ? 'طريقة الدفع المسدد بها' : 'Payment Method Used'}
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

            {/* 6. Date & Reference Number */}
            <div className="modal-dates-row">
              <div className="form-group">
                <label className="form-label">
                  {language === 'ar' ? 'تاريخ المعاملة *' : 'Transaction Date *'}
                </label>
                <input
                  type="date"
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  {language === 'ar' ? 'رقم الفاتورة / الوصل (اختياري)' : 'Invoice / Voucher Ref'}
                </label>
                <input
                  type="text"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  placeholder="e.g. INV-802 or RECEIPT-441"
                  className="form-input"
                />
              </div>
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
                placeholder={language === 'ar' ? 'سجل أي تفاصيل إضافية عن الفاتورة أو المورد...' : 'Enter any notes regarding vendor, taxes, etc...'}
                className="form-input"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="modal-footer" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: 'auto' }}>
            <button type="button" onClick={onClose} className="btn-secondary">
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </button>
            <button type="submit" className="submit-btn primary-submit">
              <CheckCircle2 size={16} />
              <span>
                {expenseToEdit
                  ? (language === 'ar' ? 'حفظ التعديلات' : 'Save Changes')
                  : (language === 'ar' ? 'تسجيل المصروف' : 'Record Expense')}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
