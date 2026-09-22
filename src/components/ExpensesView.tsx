import React, { useState } from 'react';
import { useLanguage } from './LanguageContext';
import type { Expense, Project } from '../types';
import { 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  X, 
  AlertTriangle, 
  Cpu, 
  Cloud, 
  Megaphone, 
  Laptop, 
  Box, 
  FileText, 
  Check, 
  Info,
  DollarSign,
  TrendingDown
} from 'lucide-react';

interface ExpensesViewProps {
  expenses: Expense[];
  projects: Project[];
  onAddExpense: (expense: Expense) => void;
  onEditExpense: (expense: Expense) => void;
  onDeleteExpense: (expenseId: string) => void;
}

export const ExpensesView: React.FC<ExpensesViewProps> = ({
  expenses,
  projects,
  onAddExpense,
  onEditExpense,
  onDeleteExpense,
}) => {
  const { language } = useLanguage();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [projectFilter, setProjectFilter] = useState<'All' | 'Linked' | 'General'>('All');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'amount_high' | 'amount_low'>('newest');

  // Slide-over states (details, editing, adding, deleting)
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [deletingExpenseId, setDeletingExpenseId] = useState<string | null>(null);

  // Form states for Add / Edit
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Software/Tools');
  const [projectId, setProjectId] = useState('');
  const [description, setDescription] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);

  const [editAmount, setEditAmount] = useState<number>(0);
  const [editCategory, setEditCategory] = useState('Software/Tools');
  const [editDescription, setEditDescription] = useState('');
  const [editProjectId, setEditProjectId] = useState<string>('');
  const [editDate, setEditDate] = useState('');

  // Toast confirmation
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2000);
  };

  // Category Icon Mapper
  const getCategoryIcon = (cat: string, size = 18) => {
    switch (cat) {
      case 'Software/Tools':
        return <Cpu size={size} />;
      case 'Hosting/Services':
        return <Cloud size={size} />;
      case 'Marketing':
        return <Megaphone size={size} />;
      case 'Hardware':
      case 'Equipment':
        return <Laptop size={size} />;
      default:
        return <Box size={size} />;
    }
  };

  // Helper payment methods and mock invoice IDs for the database
  const getExtendedDetails = (id: string) => {
    const paymentMethods = ['Credit Card', 'CCP Transfer', 'Cash', 'Bank Transfer', 'BaridiMob'];
    const codes = ['INV-802', 'INV-109', 'INV-552', 'INV-204', 'INV-319'];
    const idx = id.charCodeAt(id.length - 1) % 5;
    return {
      paymentMethod: paymentMethods[idx],
      invoiceRef: codes[idx]
    };
  };

  // Filter & Sort Logic
  const filteredExpenses = expenses
    .filter(exp => {
      const matchesSearch = 
        (exp.description && exp.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        exp.category.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory = 
        categoryFilter === 'All' || exp.category === categoryFilter;

      const matchesLink = 
        projectFilter === 'All' ||
        (projectFilter === 'Linked' && exp.project_id) ||
        (projectFilter === 'General' && !exp.project_id);

      return matchesSearch && matchesCategory && matchesLink;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.expense_date).getTime() - new Date(a.expense_date).getTime();
      if (sortBy === 'oldest') return new Date(a.expense_date).getTime() - new Date(b.expense_date).getTime();
      if (sortBy === 'amount_high') return b.amount - a.amount;
      if (sortBy === 'amount_low') return a.amount - b.amount;
      return 0;
    });

  // Calculate overall metrics
  const totalAmount = filteredExpenses.reduce((acc, curr) => acc + curr.amount, 0);
  const averageAmount = filteredExpenses.length > 0 ? Math.round(totalAmount / filteredExpenses.length) : 0;
  const projectLinkedCount = filteredExpenses.filter(e => e.project_id).length;

  // Add Expense Submission
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;

    const newExp: Expense = {
      id: 'exp_' + Math.random().toString(36).substr(2, 9),
      amount: parseFloat(amount),
      project_id: projectId || undefined,
      category,
      description: description.trim() || undefined,
      expense_date: expenseDate,
      created_at: new Date().toISOString()
    };

    onAddExpense(newExp);
    setIsAddingExpense(false);
    
    // Clear inputs
    setAmount('');
    setCategory('Software/Tools');
    setProjectId('');
    setDescription('');
    setExpenseDate(new Date().toISOString().split('T')[0]);

    triggerToast(language === 'ar' ? 'تم إضافة بند المصاريف بنجاح!' : 'Expense recorded successfully!');
  };

  // Edit Start Helper
  const handleStartEdit = (exp: Expense, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingExpense(exp);
    setEditAmount(exp.amount);
    setEditCategory(exp.category);
    setEditDescription(exp.description || '');
    setEditProjectId(exp.project_id || '');
    setEditDate(exp.expense_date);
  };

  // Save Edit submit
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExpense) return;

    const updated: Expense = {
      ...editingExpense,
      amount: editAmount,
      category: editCategory,
      description: editDescription || undefined,
      project_id: editProjectId || undefined,
      expense_date: editDate
    };

    onEditExpense(updated);
    setEditingExpense(null);
    if (selectedExpense && selectedExpense.id === editingExpense.id) {
      setSelectedExpense(updated);
    }
    triggerToast(language === 'ar' ? 'تم تحديث المصاريف بنجاح!' : 'Expense updated successfully!');
  };

  // Delete Click Helper
  const handleDeleteClick = (expenseId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingExpenseId(expenseId);
  };

  const handleConfirmDelete = (id: string) => {
    onDeleteExpense(id);
    setDeletingExpenseId(null);
    if (selectedExpense && selectedExpense.id === id) {
      setSelectedExpense(null);
    }
    triggerToast(language === 'ar' ? 'تم حذف بند المصروفات' : 'Expense record deleted.');
  };

  return (
    <div className="dashboard-content-area">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="toast-notification animate-slide-in">
          <Check size={16} style={{ marginRight: '6px' }} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header breadcrumb */}
      <div className="workspace-header-strip">
        <div className="project-breadcrumb">
          <span>{language === 'ar' ? 'المصاريف والنفقات' : 'Expenses Directory'}</span>
          <span className="breadcrumb-divider">/</span>
          <span className="text-bold">{language === 'ar' ? 'إدارة نفقات العمل' : 'Business Outlays'}</span>
        </div>

        {/* Clicking opens the slide-over addition drawer */}
        <button onClick={() => setIsAddingExpense(true)} className="submit-btn compact-btn" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Plus size={16} />
          {language === 'ar' ? 'تسجيل مصاريف جديدة' : 'Log Expense'}
        </button>
      </div>

      {/* Title greeting */}
      <div className="project-details-intro-block" style={{ marginBottom: '16px' }}>
        <div>
          <h2 className="project-title-heading">
            {language === 'ar' ? 'سجل المصاريف والتكاليف العامة' : 'Business Outlays & Expenses'}
          </h2>
          <p className="header-greeting-subtitle" style={{ margin: '4px 0 0 0' }}>
            {language === 'ar' ? 'تتبع مصاريف التراخيص والخدمات السحابية واحتساب ربحية المشاريع.' : 'Track software licensing, hosting services, and project outlays.'}
          </p>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="table-summary-strip" style={{ marginBottom: '20px' }}>
        <div className="summary-metric-tile">
          <span className="metric-tile-label">{language === 'ar' ? 'إجمالي النفقات النشطة' : 'Total Outlays'}</span>
          <span className="metric-tile-val text-red" style={{ color: '#D32F2F', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <TrendingDown size={18} />
            {totalAmount.toLocaleString()} DZ
          </span>
        </div>
        <div className="summary-metric-tile">
          <span className="metric-tile-label">{language === 'ar' ? 'متوسط المعاملة' : 'Average Outlay'}</span>
          <span className="metric-tile-val" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <DollarSign size={18} style={{ color: 'var(--text-placeholder)' }} />
            {averageAmount.toLocaleString()} DZ
          </span>
        </div>
        <div className="summary-metric-tile">
          <span className="metric-tile-label">{language === 'ar' ? 'نفقات مرتبطة بمشاريع' : 'Project-Linked Outlays'}</span>
          <span className="metric-tile-val" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Info size={16} style={{ color: 'var(--text-placeholder)' }} />
            {projectLinkedCount} / {filteredExpenses.length}
          </span>
        </div>
      </div>

      {/* Directory Filter / Search Toolbar */}
      <div className="clients-toolbar-strip" style={{ marginBottom: '20px' }}>
        <div className="search-toolbar-input">
          <Search size={15} />
          <input 
            type="text" 
            placeholder={language === 'ar' ? 'ابحث عن تصنيف، وصف...' : 'Search category, description...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="clear-search-btn">
              <X size={12} />
            </button>
          )}
        </div>

        <div className="filter-pills-row" style={{ gap: '8px' }}>
          <select 
            value={categoryFilter} 
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="toolbar-select-filter"
            style={{ border: 'none', background: 'transparent', fontWeight: 500 }}
          >
            <option value="All">{language === 'ar' ? 'جميع التصنيفات' : 'All Categories'}</option>
            <option value="Software/Tools">Software/Tools</option>
            <option value="Hosting/Services">Hosting/Services</option>
            <option value="Marketing">Marketing</option>
            <option value="Hardware">Hardware</option>
            <option value="Others">Others</option>
          </select>

          <select 
            value={projectFilter} 
            onChange={(e) => setProjectFilter(e.target.value as any)}
            className="toolbar-select-filter"
            style={{ border: 'none', background: 'transparent', fontWeight: 500 }}
          >
            <option value="All">{language === 'ar' ? 'جميع المصاريف' : 'All Expenses'}</option>
            <option value="Linked">{language === 'ar' ? 'مرتبطة بمشاريع' : 'Project Linked'}</option>
            <option value="General">{language === 'ar' ? 'نفقات عامة' : 'General Outlays'}</option>
          </select>

          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value as any)}
            className="toolbar-select-filter"
            style={{ border: 'none', background: 'transparent', fontWeight: 500 }}
          >
            <option value="newest">{language === 'ar' ? 'الأحدث' : 'Newest'}</option>
            <option value="oldest">{language === 'ar' ? 'الأقدم' : 'Oldest'}</option>
            <option value="amount_high">{language === 'ar' ? 'الأعلى قيمة' : 'Highest'}</option>
            <option value="amount_low">{language === 'ar' ? 'الأقل قيمة' : 'Lowest'}</option>
          </select>
        </div>
      </div>

      {/* Bento Directory Grid - Spanning Full Width */}
      <div className="clients-grid-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
        {filteredExpenses.length === 0 ? (
          <div className="no-milestones-txt" style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px' }}>
            {language === 'ar' ? 'لم يتم العثور على أي نفقات مطابقة.' : 'No matching outlays found.'}
          </div>
        ) : (
          filteredExpenses.map(exp => {
            const linkedProj = projects.find(p => p.id === exp.project_id);

            return (
              <div 
                key={exp.id}
                onClick={() => setSelectedExpense(exp)}
                className="client-bento-card"
                style={{ cursor: 'pointer' }}
              >
                {/* Top header with category icon & action controls */}
                <div className="card-top-header">
                  <div className="client-avatar-large" style={{ backgroundColor: '#FFF3E0', color: '#E65100', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {getCategoryIcon(exp.category, 20)}
                  </div>
                  <div className="card-action-icons">
                    <button 
                      onClick={(e) => handleStartEdit(exp, e)}
                      title={language === 'ar' ? 'تعديل البيانات' : 'Edit outlay'}
                    >
                      <Edit2 size={13} />
                    </button>
                    <button 
                      onClick={(e) => handleDeleteClick(exp.id, e)}
                      className="delete-icon-btn"
                      title={language === 'ar' ? 'حذف السجل' : 'Delete outlay'}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Amount and description */}
                <div className="client-identity-info">
                  <span style={{ fontSize: '1.2rem', fontWeight: 500, color: '#D32F2F', display: 'flex', alignItems: 'center', gap: '2px' }}>
                    -{exp.amount.toLocaleString()} DZ
                  </span>
                  <h4 className="client-display-name" style={{ marginTop: '8px' }}>{exp.description || 'General Outlay'}</h4>
                </div>

                {/* Footer details */}
                <div className="client-card-footer-strip">
                  <div className="client-card-small-stats">
                    <span className="stat-value">{exp.expense_date}</span>
                    <span className="stat-separator">•</span>
                    {linkedProj ? (
                      <span className="stat-value text-green" style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        🔗 {linkedProj.name}
                      </span>
                    ) : (
                      <span className="stat-value">{language === 'ar' ? 'تكلفة عامة' : 'General'}</span>
                    )}
                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 1. SLIDE-OVER DETAIL PANEL */}
      {/* ------------------------------------------------------------- */}
      {selectedExpense && !editingExpense && (
        <div className="slide-over-overlay" onClick={() => setSelectedExpense(null)}>
          <div 
            className="slide-over-container animate-slide-in" 
            onClick={(e) => e.stopPropagation()}
            style={{ direction: language === 'ar' ? 'rtl' : 'ltr' }}
          >
            {/* Header */}
            <div className="slide-over-header">
              <div className="client-badge-profile">
                <div className="profile-large-avatar" style={{ backgroundColor: '#FFF3E0', color: '#E65100', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {getCategoryIcon(selectedExpense.category, 24)}
                </div>
                <div>
                  <h3 className="profile-name-title">{selectedExpense.description || 'General Outlay'}</h3>
                  <span className="profile-muted-date">{selectedExpense.expense_date}</span>
                </div>
              </div>
              <button onClick={() => setSelectedExpense(null)} className="close-slide-over-btn" aria-label="Close">
                <X size={18} />
              </button>
            </div>

            {/* Scrollable details */}
            <div className="slide-over-content-body">
              <div className="ledger-details-section">
                <h4 className="ledger-sub-title">{language === 'ar' ? 'بيانات المعاملة المالية' : 'Transaction Information'}</h4>
                <div className="ledger-info-grid">
                  <div className="ledger-info-row" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="info-label">{language === 'ar' ? 'المبلغ المستقطع:' : 'Amount Paid:'}</span>
                    <span className="info-value text-bold text-red" style={{ color: '#D32F2F' }}>
                      -{selectedExpense.amount.toLocaleString()} DZ
                    </span>
                  </div>

                  <div className="ledger-info-row" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="info-label">{language === 'ar' ? 'التصنيف:' : 'Category:'}</span>
                    <span className="info-value text-bold">{selectedExpense.category}</span>
                  </div>

                  <div className="ledger-info-row" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="info-label">{language === 'ar' ? 'طريقة الدفع:' : 'Payment Method:'}</span>
                    <span className="info-value">{getExtendedDetails(selectedExpense.id).paymentMethod}</span>
                  </div>

                  <div className="ledger-info-row" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="info-label">{language === 'ar' ? 'رقم الفاتورة المرجعي:' : 'Invoice Ref:'}</span>
                    <span className="info-value font-mono">{getExtendedDetails(selectedExpense.id).invoiceRef}</span>
                  </div>
                </div>
              </div>

              {/* Profitability margin impact */}
              {selectedExpense.project_id && (
                <div className="ledger-details-section" style={{ marginTop: '20px' }}>
                  <h4 className="ledger-sub-title">{language === 'ar' ? 'ربحية المشروع المرتبط' : 'Project Profitability Margin'}</h4>
                  {(() => {
                    const proj = projects.find(p => p.id === selectedExpense.project_id);
                    if (!proj) return null;
                    const projExpenses = expenses.filter(e => e.project_id === proj.id);
                    const totalProjExp = projExpenses.reduce((sum, curr) => sum + curr.amount, 0);
                    const netMargin = proj.price_dzd - totalProjExp;
                    const marginPercent = proj.price_dzd > 0 ? Math.round((netMargin / proj.price_dzd) * 100) : 100;

                    return (
                      <div className="ledger-financial-summary-row" style={{ flexDirection: 'column', gap: '8px', padding: '12px', borderRadius: '8px', background: 'var(--bg-sidebar)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                          <span style={{ color: 'var(--text-placeholder)' }}>{language === 'ar' ? 'اسم المشروع:' : 'Project Name:'}</span>
                          <span style={{ fontWeight: 500 }}>{proj.name}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                          <span style={{ color: 'var(--text-placeholder)' }}>{language === 'ar' ? 'ميزانية العقد الكلية:' : 'Total Budget:'}</span>
                          <span style={{ fontWeight: 500 }}>{proj.price_dzd.toLocaleString()} DZ</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                          <span style={{ color: 'var(--text-placeholder)' }}>{language === 'ar' ? 'إجمالي نفقات المشروع:' : 'Total Costs:'}</span>
                          <span style={{ fontWeight: 500, color: '#D32F2F' }}>{totalProjExp.toLocaleString()} DZ</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', borderTop: '1px dashed var(--border-color)', paddingTop: '6px', marginTop: '4px' }}>
                          <span style={{ color: 'var(--text-muted)' }}>{language === 'ar' ? 'صافي الأرباح المتبقية:' : 'Net Profit Remaining:'}</span>
                          <span style={{ fontWeight: 500, color: netMargin >= 0 ? '#2E7D32' : '#D32F2F' }}>
                            {netMargin.toLocaleString()} DZ ({marginPercent}%)
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Receipt File Voucher Upload Box */}
              <div className="ledger-details-section" style={{ marginTop: '20px' }}>
                <h4 className="ledger-sub-title">{language === 'ar' ? 'وصل الدفع وصورة الفاتورة' : 'Receipt Document Voucher'}</h4>
                <div 
                  style={{ 
                    height: '120px', 
                    border: '1.5px dashed var(--border-color)', 
                    borderRadius: '8px', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    backgroundColor: 'var(--bg-sidebar)',
                    cursor: 'pointer'
                  }}
                  onClick={() => triggerToast(language === 'ar' ? 'تحميل الوصل متوفر بالنسخة السحابية' : 'Voucher download is available in workspace cloud.')}
                >
                  <FileText size={32} style={{ color: 'var(--text-placeholder)' }} />
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-placeholder)', marginTop: '4px' }}>
                    {getExtendedDetails(selectedExpense.id).invoiceRef}.pdf
                  </span>
                  <span style={{ fontSize: '0.68rem', color: 'var(--accent-orange)', fontWeight: 500, marginTop: '2px' }}>
                    {language === 'ar' ? 'اضغط للمعاينة الكاملة' : 'Click to preview voucher'}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="slide-over-footer-actions" style={{ display: 'flex', gap: '8px', marginTop: '32px' }}>
                <button 
                  onClick={(e) => handleStartEdit(selectedExpense, e)}
                  className="submit-btn compact-btn" 
                  style={{ flex: 1, background: 'var(--bg-card)', border: '1.5px solid var(--border-color)', color: 'var(--text-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <Edit2 size={14} />
                  {language === 'ar' ? 'تعديل النفقات' : 'Edit Outlay'}
                </button>
                <button 
                  onClick={(e) => handleDeleteClick(selectedExpense.id, e)}
                  className="submit-btn compact-btn" 
                  style={{ flex: 1, background: '#FFEBEE', color: '#D32F2F', border: '1px solid #FFCDCD', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <Trash2 size={14} />
                  {language === 'ar' ? 'حذف السجل' : 'Delete'}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. SLIDE-OVER ADD EXPENSE PANEL */}
      {/* ------------------------------------------------------------- */}
      {isAddingExpense && (
        <div className="slide-over-overlay" onClick={() => setIsAddingExpense(false)}>
          <div 
            className="slide-over-container animate-slide-in" 
            onClick={(e) => e.stopPropagation()}
            style={{ direction: language === 'ar' ? 'rtl' : 'ltr' }}
          >
            {/* Header */}
            <div className="slide-over-header">
              <div className="client-badge-profile">
                <div className="profile-large-avatar" style={{ backgroundColor: 'var(--accent-orange)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Plus size={24} />
                </div>
                <div>
                  <h3 className="profile-name-title">{language === 'ar' ? 'تسجيل مصروفات جديدة' : 'Log New Outlay'}</h3>
                  <span className="profile-muted-date">{language === 'ar' ? 'إدخال البيانات المالية' : 'Specify transaction details'}</span>
                </div>
              </div>
              <button onClick={() => setIsAddingExpense(false)} className="close-slide-over-btn" aria-label="Close">
                <X size={18} />
              </button>
            </div>

            {/* Form scroll content */}
            <form onSubmit={handleAddSubmit} className="slide-over-content-body" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
                
                <div className="form-group-item">
                  <label>{language === 'ar' ? 'المبلغ المستقطع (DZ) *' : 'Outlay Amount (DZ) *'}</label>
                  <input 
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    placeholder="e.g. 15000"
                    className="milestone-form-input"
                  />
                </div>

                <div className="form-group-item">
                  <label>{language === 'ar' ? 'التصنيف' : 'Category'}</label>
                  <select 
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="milestone-form-select"
                  >
                    <option value="Software/Tools">Software/Tools</option>
                    <option value="Hosting/Services">Hosting/Services</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Hardware">Hardware</option>
                    <option value="Others">Others</option>
                  </select>
                </div>

                <div className="form-group-item">
                  <label>{language === 'ar' ? 'ربط بمشروع (اختياري)' : 'Link to Project (Optional)'}</label>
                  <select 
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    className="milestone-form-select"
                  >
                    <option value="">{language === 'ar' ? '-- عام (غير مرتبط بمشروع) --' : '-- General (No linked project) --'}</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group-item">
                  <label>{language === 'ar' ? 'تاريخ المعاملة' : 'Outlay Date'}</label>
                  <input 
                    type="date"
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    required
                    className="milestone-form-input"
                  />
                </div>

                <div className="form-group-item">
                  <label>{language === 'ar' ? 'تفاصيل / بيان التكلفة *' : 'Description / Reason *'}</label>
                  <input 
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    placeholder={language === 'ar' ? 'مثال: شراء تراخيص Figma Pro' : 'e.g. Figma Monthly Pro subscription'}
                    className="milestone-form-input"
                  />
                </div>

              </div>

              {/* Footer Save */}
              <div className="modal-footer" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: 'auto' }}>
                <button type="button" onClick={() => setIsAddingExpense(false)} className="btn-secondary" style={{ flex: 1 }}>
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button type="submit" className="submit-btn primary-submit" style={{ flex: 1 }}>
                  {language === 'ar' ? 'تسجيل المصاريف' : 'Save Outlay'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3. SLIDE-OVER EDIT EXPENSE PANEL */}
      {/* ------------------------------------------------------------- */}
      {editingExpense && (
        <div className="slide-over-overlay" onClick={() => setEditingExpense(null)}>
          <div 
            className="slide-over-container animate-slide-in" 
            onClick={(e) => e.stopPropagation()}
            style={{ direction: language === 'ar' ? 'rtl' : 'ltr' }}
          >
            {/* Header */}
            <div className="slide-over-header">
              <div className="client-badge-profile">
                <div className="profile-large-avatar" style={{ backgroundColor: 'var(--btn-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Edit2 size={24} />
                </div>
                <div>
                  <h3 className="profile-name-title">{language === 'ar' ? 'تعديل تفاصيل المصروف' : 'Edit Outlay Details'}</h3>
                  <span className="profile-muted-date">{editingExpense.description || 'General Outlay'}</span>
                </div>
              </div>
              <button onClick={() => setEditingExpense(null)} className="close-slide-over-btn" aria-label="Close">
                <X size={18} />
              </button>
            </div>

            {/* Form edit scroll content */}
            <form onSubmit={handleSaveEdit} className="slide-over-content-body" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
                
                <div className="form-group-item">
                  <label>{language === 'ar' ? 'المبلغ المستقطع (DZ) *' : 'Outlay Amount (DZ) *'}</label>
                  <input 
                    type="number"
                    value={editAmount}
                    onChange={(e) => setEditAmount(parseFloat(e.target.value))}
                    required
                    className="milestone-form-input"
                  />
                </div>

                <div className="form-group-item">
                  <label>{language === 'ar' ? 'التصنيف' : 'Category'}</label>
                  <select 
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="milestone-form-select"
                  >
                    <option value="Software/Tools">Software/Tools</option>
                    <option value="Hosting/Services">Hosting/Services</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Hardware">Hardware</option>
                    <option value="Others">Others</option>
                  </select>
                </div>

                <div className="form-group-item">
                  <label>{language === 'ar' ? 'المشروع المرتبط (اختياري)' : 'Link Project (Optional)'}</label>
                  <select 
                    value={editProjectId}
                    onChange={(e) => setEditProjectId(e.target.value)}
                    className="milestone-form-select"
                  >
                    <option value="">{language === 'ar' ? '-- عام (غير مرتبط بمشروع) --' : '-- General (No linked project) --'}</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group-item">
                  <label>{language === 'ar' ? 'تاريخ المعاملة' : 'Outlay Date'}</label>
                  <input 
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    required
                    className="milestone-form-input"
                  />
                </div>

                <div className="form-group-item">
                  <label>{language === 'ar' ? 'التفاصيل / بيان التكلفة *' : 'Description / Reason *'}</label>
                  <input 
                    type="text"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    required
                    className="milestone-form-input"
                  />
                </div>

              </div>

              {/* Footer Save */}
              <div className="modal-footer" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: 'auto' }}>
                <button type="button" onClick={() => setEditingExpense(null)} className="btn-secondary" style={{ flex: 1 }}>
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button type="submit" className="submit-btn primary-submit" style={{ flex: 1 }}>
                  {language === 'ar' ? 'حفظ التحديثات' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 4. SLIDE-OVER DELETE CONFIRMATION PANEL */}
      {/* ------------------------------------------------------------- */}
      {deletingExpenseId && (() => {
        const exp = expenses.find(e => e.id === deletingExpenseId);
        if (!exp) return null;
        return (
          <div className="slide-over-overlay" onClick={() => setDeletingExpenseId(null)}>
            <div 
              className="slide-over-container animate-slide-in" 
              onClick={(e) => e.stopPropagation()}
              style={{ direction: language === 'ar' ? 'rtl' : 'ltr' }}
            >
              {/* Header */}
              <div className="slide-over-header" style={{ backgroundColor: '#FFF0F0', borderBottom: '1px solid #FFE0E0' }}>
                <div className="client-badge-profile">
                  <div className="profile-large-avatar" style={{ backgroundColor: '#D32F2F', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <AlertTriangle size={24} />
                  </div>
                  <div>
                    <h3 className="profile-name-title" style={{ color: '#C62828' }}>
                      {language === 'ar' ? 'تأكيد حذف المصاريف' : 'Delete Outlay Record'}
                    </h3>
                    <span className="profile-muted-date" style={{ color: '#A31D1D' }}>
                      {language === 'ar' ? 'تحذير: هذا الإجراء لا يمكن التراجع عنه' : 'Warning: This action is permanent'}
                    </span>
                  </div>
                </div>
                <button onClick={() => setDeletingExpenseId(null)} className="close-slide-over-btn" aria-label="Close">
                  <X size={18} />
                </button>
              </div>

              {/* Content body info box */}
              <div className="slide-over-content-body" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ padding: '16px', border: '1px solid #FFE0E0', borderRadius: '12px', backgroundColor: '#FFF5F5', color: '#B82C2C', fontSize: '0.88rem', lineHeight: '1.5', fontWeight: '500' }}>
                  {language === 'ar' ? (
                    `أنت على وشك حذف المصروف المالي بقيمة ${exp.amount.toLocaleString()} DZ (${exp.description || exp.category}) بالكامل.`
                  ) : (
                    `You are about to delete expense record of ${exp.amount.toLocaleString()} DZ (${exp.description || exp.category}) from your workspace.`
                  )}
                  <br /><br />
                  {language === 'ar' ? (
                    'سيتم إلغاء ربط بند التكلفة نهائياً. النفقات المسجلة تلعب دوراً في حساب صافي أرباح وهوامش المشاريع التاريخية.'
                  ) : (
                    'This cost entry will be permanently removed. The deletion will automatically adjust the associated project\'s profitability margins.'
                  )}
                </div>
              </div>

              {/* Footer controls */}
              <div className="modal-footer" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: 'auto' }}>
                <button type="button" onClick={() => setDeletingExpenseId(null)} className="btn-secondary" style={{ flex: 1 }}>
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button 
                  type="button" 
                  onClick={() => handleConfirmDelete(exp.id)}
                  className="submit-btn primary-submit" 
                  style={{ backgroundColor: '#D32F2F', flex: 1 }}
                >
                  {language === 'ar' ? 'تأكيد الحذف' : 'Confirm Delete'}
                </button>
              </div>

            </div>
          </div>
        );
      })()}

    </div>
  );
};
