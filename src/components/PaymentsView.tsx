import React, { useState, useMemo } from 'react';
import { useLanguage } from './LanguageContext';
import { UserAvatar } from './UserAvatar';
import { PaymentReceiptModal } from './PaymentReceiptModal';
import type { Payment, Client, Project } from '../types';
import { 
  Banknote, TrendingUp, Clock, Percent, Plus, 
  Search, Trash2, Receipt, ArrowUpDown, Wallet 
} from 'lucide-react';

interface PaymentsViewProps {
  payments: Payment[];
  clients: Client[];
  projects: Project[];
  onOpenAddPayment: () => void;
  onDeletePayment: (id: string) => void;
  freelancerName?: string;
}

export const PaymentsView: React.FC<PaymentsViewProps> = ({
  payments,
  clients,
  projects,
  onOpenAddPayment,
  onDeletePayment,
  freelancerName = 'Sadek Rahman',
}) => {
  const { language } = useLanguage();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMethodFilter, setSelectedMethodFilter] = useState<string>('all');
  const [selectedReceiptPayment, setSelectedReceiptPayment] = useState<Payment | null>(null);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // KPI Calculations
  const metrics = useMemo(() => {
    const totalReceived = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const totalCommitted = projects.reduce((sum, p) => sum + (p.price_dzd || 0), 0);
    const totalPending = Math.max(0, totalCommitted - totalReceived);

    const now = new Date();
    const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const thisMonthInflow = payments
      .filter(p => p.payment_date && p.payment_date.startsWith(currentMonthPrefix))
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    const collectionRate = totalCommitted > 0 
      ? Math.min(100, Math.round((totalReceived / totalCommitted) * 100)) 
      : 100;

    return { totalReceived, totalPending, thisMonthInflow, collectionRate };
  }, [payments, projects]);

  // Filtering & Sorting
  const filteredPayments = useMemo(() => {
    return payments
      .filter(p => {
        const client = clients.find(c => c.id === p.client_id);
        const project = projects.find(proj => proj.id === p.project_id);

        const matchesQuery = 
          searchQuery.trim() === '' ||
          (client?.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (project?.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (p.reference_number?.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (p.notes?.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesMethod = 
          selectedMethodFilter === 'all' || 
          p.payment_method === selectedMethodFilter;

        return matchesQuery && matchesMethod;
      })
      .sort((a, b) => {
        const dateA = new Date(a.payment_date).getTime();
        const dateB = new Date(b.payment_date).getTime();
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
      });
  }, [payments, clients, projects, searchQuery, selectedMethodFilter, sortOrder]);

  const getMethodBadgeClass = (method: string) => {
    switch (method) {
      case 'baridimob': return 'badge-pay-method baridimob';
      case 'ccp': return 'badge-pay-method ccp';
      case 'bank_transfer': return 'badge-pay-method bank';
      case 'cash': return 'badge-pay-method cash';
      default: return 'badge-pay-method other';
    }
  };

  const getMethodLabel = (method: string) => {
    switch (method) {
      case 'baridimob': return 'BaridiMob';
      case 'ccp': return 'CCP';
      case 'bank_transfer': return language === 'ar' ? 'تحويل بنكي' : 'Bank Wire';
      case 'cash': return language === 'ar' ? 'نقداً' : 'Cash';
      default: return method;
    }
  };

  const getTypePillClass = (type: string) => {
    switch (type) {
      case 'advance': return 'pill-pay-type advance';
      case 'milestone': return 'pill-pay-type milestone';
      case 'final': return 'pill-pay-type final';
      case 'tip': return 'pill-pay-type tip';
      default: return 'pill-pay-type advance';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'advance': return language === 'ar' ? 'تسبيق' : 'Advance';
      case 'milestone': return language === 'ar' ? 'مرحلية' : 'Milestone';
      case 'final': return language === 'ar' ? 'نهائية' : 'Final';
      case 'tip': return language === 'ar' ? 'إكرامية' : 'Tip';
      default: return type;
    }
  };

  return (
    <div className="dashboard-content-area" style={{ paddingBottom: '60px' }}>
      
      {/* 1. Header Row */}
      <div className="view-header-row">
        <div>
          <h2 className="header-greeting-title" style={{ fontSize: '1.6rem', fontWeight: 450 }}>
            {language === 'ar' ? 'سجل المدفوعات والتحصيلات المالية' : 'Payments & Inflow Hub'}
          </h2>
          <p className="header-greeting-subtitle" style={{ fontSize: '0.85rem', fontWeight: 400 }}>
            {language === 'ar' 
              ? 'تتبع ومراقبة جميع التدفقات المالية والمستحقات المستلمة من عملائك'
              : 'Track and reconcile incoming cash flow, client deposits, and outstanding debts'}
          </p>
        </div>

        <button 
          id="btnRecordPayment"
          onClick={onOpenAddPayment}
          className="submit-btn"
          style={{ padding: '10px 18px', fontSize: '0.85rem', gap: '8px' }}
        >
          <Plus size={15} />
          <span>{language === 'ar' ? 'تسجيل دفعة جديدة' : 'Record Payment'}</span>
        </button>
      </div>

      {/* 2. Top KPI Cards */}
      <div className="payments-kpi-grid">
        {/* KPI 1: Total Received */}
        <div className="payments-kpi-card green">
          <div className="kpi-card-header">
            <span className="kpi-card-label">
              {language === 'ar' ? 'إجمالي المحصل الفعلي' : 'Total Collected Inflow'}
            </span>
            <div className="kpi-card-icon-bubble green">
              <Wallet size={16} />
            </div>
          </div>
          <div className="kpi-card-value-row">
            <span className="kpi-card-metric-huge" style={{ color: '#0E4F2F' }}>
              {metrics.totalReceived.toLocaleString()}
            </span>
            <span className="kpi-currency-unit">DZ</span>
          </div>
          <span className="kpi-subtext-note">
            {language === 'ar' ? 'مجموع الدفعات المستلمة بنجاح' : 'From all cleared payments'}
          </span>
        </div>

        {/* KPI 2: Pending Receivables */}
        <div className="payments-kpi-card orange">
          <div className="kpi-card-header">
            <span className="kpi-card-label">
              {language === 'ar' ? 'المستحقات المعلقة المتبقية' : 'Outstanding Receivables'}
            </span>
            <div className="kpi-card-icon-bubble orange">
              <Clock size={16} />
            </div>
          </div>
          <div className="kpi-card-value-row">
            <span className="kpi-card-metric-huge" style={{ color: 'var(--accent-orange)' }}>
              {metrics.totalPending.toLocaleString()}
            </span>
            <span className="kpi-currency-unit">DZ</span>
          </div>
          <span className="kpi-subtext-note">
            {language === 'ar' ? 'متبقي على ميزانيات المشاريع' : 'Unpaid balance across projects'}
          </span>
        </div>

        {/* KPI 3: This Month Inflow */}
        <div className="payments-kpi-card purple">
          <div className="kpi-card-header">
            <span className="kpi-card-label">
              {language === 'ar' ? 'تحصيلات هذا الشهر' : 'This Month Inflow'}
            </span>
            <div className="kpi-card-icon-bubble purple">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="kpi-card-value-row">
            <span className="kpi-card-metric-huge" style={{ color: 'var(--accent-purple)' }}>
              {metrics.thisMonthInflow.toLocaleString()}
            </span>
            <span className="kpi-currency-unit">DZ</span>
          </div>
          <span className="kpi-subtext-note">
            {language === 'ar' ? 'مداخيل الشهر التقويمي الحالي' : 'Recorded in the current month'}
          </span>
        </div>

        {/* KPI 4: Collection Rate */}
        <div className="payments-kpi-card amber">
          <div className="kpi-card-header">
            <span className="kpi-card-label">
              {language === 'ar' ? 'معدل التحصيل العام' : 'Collection Rate'}
            </span>
            <div className="kpi-card-icon-bubble amber">
              <Percent size={16} />
            </div>
          </div>
          <div className="kpi-card-value-row">
            <span className="kpi-card-metric-huge" style={{ color: '#B45309' }}>
              {metrics.collectionRate}%
            </span>
          </div>
          <span className="kpi-subtext-note">
            {language === 'ar' ? 'نسبة المداخيل إلى العقود' : 'Paid vs total project volume'}
          </span>
        </div>
      </div>

      {/* 3. Search & Filters Panel */}
      <div className="payments-toolbar-panel">
        <div className="payments-search-input-wrap">
          <Search size={15} className="search-icon" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={language === 'ar' ? 'بحث باسم العميل، المشروع، أو رقم الوصل...' : 'Search by client, project, or reference...'}
            className="payments-search-field"
          />
        </div>

        <div className="payments-filters-group">
          <button
            type="button"
            onClick={() => setSelectedMethodFilter('all')}
            className={`payments-filter-chip ${selectedMethodFilter === 'all' ? 'active' : ''}`}
          >
            {language === 'ar' ? 'جميع الطرق' : 'All Methods'}
          </button>
          <button
            type="button"
            onClick={() => setSelectedMethodFilter('baridimob')}
            className={`payments-filter-chip ${selectedMethodFilter === 'baridimob' ? 'active' : ''}`}
          >
            BaridiMob
          </button>
          <button
            type="button"
            onClick={() => setSelectedMethodFilter('ccp')}
            className={`payments-filter-chip ${selectedMethodFilter === 'ccp' ? 'active' : ''}`}
          >
            CCP
          </button>
          <button
            type="button"
            onClick={() => setSelectedMethodFilter('bank_transfer')}
            className={`payments-filter-chip ${selectedMethodFilter === 'bank_transfer' ? 'active' : ''}`}
          >
            {language === 'ar' ? 'تحويل بنكي' : 'Bank'}
          </button>
          <button
            type="button"
            onClick={() => setSelectedMethodFilter('cash')}
            className={`payments-filter-chip ${selectedMethodFilter === 'cash' ? 'active' : ''}`}
          >
            {language === 'ar' ? 'كاش' : 'Cash'}
          </button>

          <button
            type="button"
            onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
            className="payments-filter-chip"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            title={language === 'ar' ? 'ترتيب حسب التاريخ' : 'Sort by date'}
          >
            <ArrowUpDown size={12} />
            <span>{sortOrder === 'desc' ? (language === 'ar' ? 'الأحدث أولاً' : 'Newest') : (language === 'ar' ? 'الأقدم أولاً' : 'Oldest')}</span>
          </button>
        </div>
      </div>

      {/* 4. Transactions Ledger Table */}
      {filteredPayments.length === 0 ? (
        <div className="empty-directory-card">
          <div className="kpi-card-icon-bubble green" style={{ width: '48px', height: '48px', borderRadius: '50%' }}>
            <Banknote size={24} />
          </div>
          <h4 style={{ fontSize: '1.05rem', fontWeight: 450 }}>
            {payments.length === 0 
              ? (language === 'ar' ? 'لا توجد مدفوعات مسجلة بعد' : 'No payments logged yet')
              : (language === 'ar' ? 'لا توجد نتائج مطابقة لخيارات البحث' : 'No payments match your search filters')}
          </h4>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            {payments.length === 0 
              ? (language === 'ar' ? 'ابدأ بتسجيل أول دفعة مستلمة عبر بريدي موب أو نقداً لربطها بمشاريعك ومتابعة أرباحك.' : 'Start recording incoming payments to track real cash flow and project balances.')
              : (language === 'ar' ? 'جرّب تعديل كلمات البحث أو تصفير فلتر طريقة الدفع.' : 'Try changing your search terms or clearing the method filter.')}
          </p>
          {payments.length === 0 && (
            <button onClick={onOpenAddPayment} className="submit-btn" style={{ padding: '8px 20px', fontSize: '0.85rem', marginTop: '6px' }}>
              <Plus size={15} />
              <span>{language === 'ar' ? 'تسجيل أول دفعة' : 'Record First Payment'}</span>
            </button>
          )}
        </div>
      ) : (
        <div className="payments-table-card">
          <div className="payments-table-wrap">
            <table className="payments-table">
              <thead>
                <tr>
                  <th>{language === 'ar' ? 'العميل' : 'Client'}</th>
                  <th>{language === 'ar' ? 'المشروع المرتبط' : 'Project'}</th>
                  <th>{language === 'ar' ? 'المبلغ المستلم' : 'Amount'}</th>
                  <th>{language === 'ar' ? 'طريقة الدفع' : 'Method'}</th>
                  <th>{language === 'ar' ? 'نوع الدفعة' : 'Type'}</th>
                  <th>{language === 'ar' ? 'تاريخ الاستلام' : 'Date'}</th>
                  <th>{language === 'ar' ? 'رقم الإشعار / المرجع' : 'Reference'}</th>
                  <th style={{ textAlign: 'center' }}>{language === 'ar' ? 'الإجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((pay, i) => {
                  const client = clients.find(c => c.id === pay.client_id);
                  const project = projects.find(p => p.id === pay.project_id);

                  return (
                    <tr key={pay.id}>
                      {/* Client */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <UserAvatar name={client?.name || 'Unknown'} size={28} animate="hover" />
                          <div>
                            <div style={{ fontWeight: 450, color: 'var(--text-main)' }}>
                              {client?.name || (language === 'ar' ? 'عميل غير مسجل' : 'Unknown Client')}
                            </div>
                            {client?.email && (
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                {client.email}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Project */}
                      <td>
                        <span style={{ 
                          fontSize: '0.8rem', 
                          fontWeight: 450, 
                          color: 'var(--text-main)',
                          background: 'var(--bg-canvas)',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          border: '1px solid var(--border-color)'
                        }}>
                          {project?.name || (language === 'ar' ? 'مشروع عام' : 'General Project')}
                        </span>
                      </td>

                      {/* Amount */}
                      <td>
                        <span className="payment-amount-cell">
                          +{pay.amount.toLocaleString()} <span style={{ fontSize: '0.75rem' }}>DZ</span>
                        </span>
                      </td>

                      {/* Method Badge */}
                      <td>
                        <span className={getMethodBadgeClass(pay.payment_method)}>
                          {getMethodLabel(pay.payment_method)}
                        </span>
                      </td>

                      {/* Type Pill */}
                      <td>
                        <span className={getTypePillClass(pay.payment_type)}>
                          {getTypeLabel(pay.payment_type)}
                        </span>
                      </td>

                      {/* Date */}
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {pay.payment_date}
                      </td>

                      {/* Reference */}
                      <td>
                        {pay.reference_number ? (
                          <span style={{ 
                            fontFamily: 'var(--font-mono)', 
                            fontSize: '0.74rem', 
                            color: 'var(--text-muted)',
                            background: 'var(--bg-sidebar)',
                            padding: '2px 6px',
                            borderRadius: '3px'
                          }}>
                            {pay.reference_number}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-placeholder)', fontSize: '0.75rem' }}>—</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          {/* Receipt Trigger */}
                          <button
                            type="button"
                            id={i === 0 ? 'receiptBtnFirst' : undefined}
                            onClick={() => setSelectedReceiptPayment(pay)}
                            className="table-action-icon-btn"
                            title={language === 'ar' ? 'عرض وطباعة الوصل' : 'View Receipt'}
                          >
                            <Receipt size={14} />
                          </button>

                          {/* Delete Trigger */}
                          <button
                            type="button"
                            onClick={() => {
                              const confirmMsg = language === 'ar' 
                                ? 'هل أنت متأكد من رغبتك في حذف هذا السجل المالي؟'
                                : 'Are you sure you want to delete this payment record?';
                              if (window.confirm(confirmMsg)) {
                                onDeletePayment(pay.id);
                              }
                            }}
                            className="table-action-icon-btn delete"
                            title={language === 'ar' ? 'حذف الدفعة' : 'Delete'}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. Printable Receipt Modal */}
      {selectedReceiptPayment && (
        <PaymentReceiptModal
          payment={selectedReceiptPayment}
          client={clients.find(c => c.id === selectedReceiptPayment.client_id)}
          project={projects.find(p => p.id === selectedReceiptPayment.project_id)}
          allProjectPayments={payments}
          freelancerName={freelancerName}
          onClose={() => setSelectedReceiptPayment(null)}
        />
      )}

    </div>
  );
};
