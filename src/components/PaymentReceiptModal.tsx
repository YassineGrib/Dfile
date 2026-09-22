import React from 'react';
import { useLanguage } from './LanguageContext';
import { UserAvatar } from './UserAvatar';
import type { Payment, Client, Project } from '../types';
import { X, Printer, CheckCircle2 } from 'lucide-react';

interface PaymentReceiptModalProps {
  payment: Payment | null;
  client?: Client;
  project?: Project;
  allProjectPayments?: Payment[];
  freelancerName?: string;
  onClose: () => void;
}

export const PaymentReceiptModal: React.FC<PaymentReceiptModalProps> = ({
  payment,
  client,
  project,
  allProjectPayments = [],
  freelancerName = 'Sadek Rahman',
  onClose,
}) => {
  const { language } = useLanguage();

  if (!payment) return null;

  // Calculate project financial status at time of receipt
  const projectTotal = project?.price_dzd || 0;
  const projectTotalPaid = allProjectPayments
    .filter(p => p.project_id === project?.id)
    .reduce((sum, p) => sum + (p.amount || 0), 0);
  const projectRemaining = Math.max(0, projectTotal - projectTotalPaid);

  const handlePrint = () => {
    window.print();
  };

  const getMethodLabel = (method: string) => {
    switch (method) {
      case 'baridimob': return 'BaridiMob (بريدي موب)';
      case 'ccp': return 'CCP (الحساب الجاري)';
      case 'bank_transfer': return language === 'ar' ? 'تحويل بنكي' : 'Bank Wire';
      case 'cash': return language === 'ar' ? 'نقداً (كاش)' : 'Cash';
      default: return method;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'advance': return language === 'ar' ? 'تسبيق مالي' : 'Advance Payment';
      case 'milestone': return language === 'ar' ? 'دفعة مرحلية' : 'Milestone Clearance';
      case 'final': return language === 'ar' ? 'تسوية ختامية' : 'Final Settlement';
      case 'tip': return language === 'ar' ? 'إكرامية' : 'Gratuity / Tip';
      default: return type;
    }
  };

  return (
    <div className="receipt-overlay-backdrop" onClick={onClose}>
      <div 
        className="receipt-sheet-container" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="receipt-sheet-header">
          <div className="receipt-sheet-header-title">
            <CheckCircle2 size={18} color="#0E4F2F" />
            <span>{language === 'ar' ? 'وصل استلام دفعة رسمية' : 'Official Payment Receipt'}</span>
          </div>
          <button onClick={onClose} className="modal-close-btn" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {/* Receipt Paper Body */}
        <div className="receipt-sheet-body">
          {/* Brand & Receipt Meta */}
          <div className="receipt-brand-bar">
            <div>
              <h4 className="receipt-brand-title">{freelancerName}</h4>
              <p className="receipt-brand-meta">IndFlow Freelance Studio • Algiers, Algeria</p>
            </div>
            <div style={{ textAlign: 'end' }}>
              <span className="receipt-code-badge">{payment.id.toUpperCase()}</span>
              <p className="receipt-brand-meta" style={{ marginTop: '4px' }}>{payment.payment_date}</p>
            </div>
          </div>

          {/* Large Amount Display */}
          <div className="receipt-amount-display-box">
            <div>
              <span className="receipt-amount-caption">
                {language === 'ar' ? 'المبلغ المستلم بالدينار' : 'Amount Received'}
              </span>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                {getTypeLabel(payment.payment_type)}
              </div>
            </div>
            <div className="receipt-amount-value">
              {payment.amount.toLocaleString()} <span style={{ fontSize: '0.85rem' }}>DZ</span>
            </div>
          </div>

          {/* Details Breakdown */}
          <div className="receipt-details-grid">
            {/* Client info */}
            <div className="receipt-detail-item">
              <span className="receipt-detail-label">{language === 'ar' ? 'العميل' : 'Client'}:</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {client && <UserAvatar name={client.name} size={18} />}
                <span className="receipt-detail-value">{client?.name || 'Unknown Client'}</span>
              </div>
            </div>

            {/* Project info */}
            <div className="receipt-detail-item">
              <span className="receipt-detail-label">{language === 'ar' ? 'المشروع' : 'Project'}:</span>
              <span className="receipt-detail-value">{project?.name || 'General Inflow'}</span>
            </div>

            {/* Payment Method */}
            <div className="receipt-detail-item">
              <span className="receipt-detail-label">{language === 'ar' ? 'طريقة الدفع' : 'Payment Method'}:</span>
              <span className="receipt-detail-value">{getMethodLabel(payment.payment_method)}</span>
            </div>

            {/* Reference */}
            {payment.reference_number && (
              <div className="receipt-detail-item">
                <span className="receipt-detail-label">{language === 'ar' ? 'رقم الإشعار / الحوالة' : 'Transaction Ref'}:</span>
                <span className="receipt-detail-value" style={{ fontFamily: 'var(--font-mono)' }}>{payment.reference_number}</span>
              </div>
            )}

            {/* Project financial balance */}
            {projectTotal > 0 && (
              <>
                <div className="receipt-detail-item">
                  <span className="receipt-detail-label">{language === 'ar' ? 'ميزانية المشروع الكلية' : 'Project Budget'}:</span>
                  <span className="receipt-detail-value">{projectTotal.toLocaleString()} DZ</span>
                </div>
                <div className="receipt-detail-item">
                  <span className="receipt-detail-label">{language === 'ar' ? 'إجمالي المدفوع حتى الآن' : 'Total Paid to Date'}:</span>
                  <span className="receipt-detail-value" style={{ color: '#0E4F2F' }}>{projectTotalPaid.toLocaleString()} DZ</span>
                </div>
                <div className="receipt-detail-item">
                  <span className="receipt-detail-label">{language === 'ar' ? 'المبلغ المتبقي على المشروع' : 'Remaining Project Balance'}:</span>
                  <span className="receipt-detail-value" style={{ color: projectRemaining === 0 ? '#0E4F2F' : 'var(--accent-orange)' }}>
                    {projectRemaining.toLocaleString()} DZ
                  </span>
                </div>
              </>
            )}

            {/* Remarks */}
            {payment.notes && (
              <div className="receipt-detail-item" style={{ borderBottom: 'none', paddingTop: '6px' }}>
                <span className="receipt-detail-label">{language === 'ar' ? 'ملاحظة' : 'Note'}:</span>
                <span className="receipt-detail-value" style={{ fontWeight: 400, color: 'var(--text-muted)' }}>{payment.notes}</span>
              </div>
            )}
          </div>

          {/* Paid Stamp Watermark */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <span className="receipt-stamp-watermark">
              ✓ {language === 'ar' ? 'تم الاستلام والدفع' : 'PAID & RECEIVED'}
            </span>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="receipt-sheet-actions">
          <button type="button" onClick={onClose} className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.82rem' }}>
            {language === 'ar' ? 'إغلاق' : 'Close'}
          </button>
          <button type="button" onClick={handlePrint} className="submit-btn" style={{ padding: '8px 20px', fontSize: '0.85rem' }}>
            <Printer size={15} />
            <span>{language === 'ar' ? 'طباعة الوصل (PDF)' : 'Print / Export PDF'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
