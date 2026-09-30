import React, { useState, useMemo } from 'react';
import { useLanguage } from './LanguageContext';
import { AddExpenseModal } from './AddExpenseModal';
import type { Expense, Project } from '../types';
import { 
  TrendingDown, Plus, Search, Trash2, ArrowUpDown, 
  Cpu, Cloud, Megaphone, Laptop, Box, 
  FolderKanban, Clock, Percent, Edit2
} from 'lucide-react';

interface ExpensesViewProps {
  expenses: Expense[];
  projects: Project[];
  onOpenAddExpense?: () => void;
  onAddExpense: (expense: Expense) => void;
  onEditExpense: (expense: Expense) => void;
  onDeleteExpense: (expenseId: string) => void;
}

export const ExpensesView: React.FC<ExpensesViewProps> = ({
  expenses,
  projects,
  onOpenAddExpense,
  onAddExpense,
  onEditExpense,
  onDeleteExpense,
}) => {
  const { language } = useLanguage();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [selectedProjectFilter, setSelectedProjectFilter] = useState<'all' | 'linked' | 'general'>('all');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  // 1. KPI Metrics
  const metrics = useMemo(() => {
    const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

    const projectExpensesList = expenses.filter(e => Boolean(e.project_id));
    const projectExpenses = projectExpensesList.reduce((sum, e) => sum + (e.amount || 0), 0);
    const projectExpensesCount = projectExpensesList.length;

    const now = new Date();
    const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const thisMonthExpenses = expenses
      .filter(e => e.expense_date && e.expense_date.startsWith(currentMonthPrefix))
      .reduce((sum, e) => sum + (e.amount || 0), 0);

    const averageExpense = expenses.length > 0 
      ? Math.round(totalExpenses / expenses.length) 
      : 0;

    return { 
      totalExpenses, 
      projectExpenses, 
      projectExpensesCount,
      thisMonthExpenses, 
      averageExpense 
    };
  }, [expenses]);

  // 2. Filter & Sort Logic
  const filteredExpenses = useMemo(() => {
    return expenses
      .filter(e => {
        const project = projects.find(proj => proj.id === e.project_id);

        const matchesQuery = 
          searchQuery.trim() === '' ||
          (e.description && e.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (e.category && e.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (project && project.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (e.reference_number && e.reference_number.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (e.notes && e.notes.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesCategory = 
          selectedCategoryFilter === 'all' || 
          e.category === selectedCategoryFilter;

        const matchesProject = 
          selectedProjectFilter === 'all' ||
          (selectedProjectFilter === 'linked' && Boolean(e.project_id)) ||
          (selectedProjectFilter === 'general' && !e.project_id);

        return matchesQuery && matchesCategory && matchesProject;
      })
      .sort((a, b) => {
        const dateA = new Date(a.expense_date).getTime();
        const dateB = new Date(b.expense_date).getTime();
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
      });
  }, [expenses, projects, searchQuery, selectedCategoryFilter, selectedProjectFilter, sortOrder]);

  const getCategoryIcon = (cat: string, size = 15) => {
    switch (cat) {
      case 'Software/Tools': return <Cpu size={size} />;
      case 'Hosting/Services': return <Cloud size={size} />;
      case 'Marketing': return <Megaphone size={size} />;
      case 'Equipment': return <Laptop size={size} />;
      default: return <Box size={size} />;
    }
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'Software/Tools': return language === 'ar' ? 'برامج وأدوات' : 'Software/Tools';
      case 'Hosting/Services': return language === 'ar' ? 'استضافة وخدمات' : 'Hosting';
      case 'Marketing': return language === 'ar' ? 'تسويق وإعلانات' : 'Marketing';
      case 'Equipment': return language === 'ar' ? 'أجهزة ومعدات' : 'Equipment';
      default: return language === 'ar' ? 'أخرى' : 'Others';
    }
  };

  const getCategoryPillClass = (cat: string) => {
    switch (cat) {
      case 'Software/Tools': return 'pill-pay-type advance';
      case 'Hosting/Services': return 'pill-pay-type final';
      case 'Marketing': return 'pill-pay-type tip';
      case 'Equipment': return 'pill-pay-type milestone';
      default: return 'pill-pay-type';
    }
  };

  const getMethodBadgeClass = (method?: string) => {
    switch (method) {
      case 'baridimob': return 'badge-pay-method baridimob';
      case 'ccp': return 'badge-pay-method ccp';
      case 'bank_transfer': return 'badge-pay-method bank';
      case 'cash': return 'badge-pay-method cash';
      default: return 'badge-pay-method other';
    }
  };

  const getMethodLabel = (method?: string) => {
    switch (method) {
      case 'baridimob': return 'BaridiMob';
      case 'ccp': return 'CCP';
      case 'bank_transfer': return language === 'ar' ? 'تحويل بنكي' : 'Bank Wire';
      case 'cash': return language === 'ar' ? 'نقداً' : 'Cash';
      default: return method || (language === 'ar' ? 'أخرى' : 'Other');
    }
  };

  const handleDelete = (id: string) => {
    const confirmMsg = language === 'ar'
      ? 'هل أنت متأكد من رغبتك في حذف هذا السجل المالي للنفقات؟'
      : 'Are you sure you want to delete this expense record?';
    if (window.confirm(confirmMsg)) {
      onDeleteExpense(id);
    }
  };

  const handleOpenAdd = () => {
    if (onOpenAddExpense) {
      onOpenAddExpense();
    } else {
      setIsAddModalOpen(true);
    }
  };

  return (
    <div className="dashboard-content-area" style={{ paddingBottom: '60px' }}>
      
      {/* 1. Header Row */}
      <div className="view-header-row">
        <div>
          <h2 className="header-greeting-title" style={{ fontSize: '1.6rem', fontWeight: 450 }}>
            {language === 'ar' ? 'سجل المصاريف والتكاليف العامة' : 'Expenses & Outlays Hub'}
          </h2>
          <p className="header-greeting-subtitle" style={{ fontSize: '0.85rem', fontWeight: 400 }}>
            {language === 'ar' 
              ? 'تتبع ومراقبة جميع النفقات والتكاليف التشغيلية ومصاريف المشاريع'
              : 'Track and reconcile operational costs, software subscriptions, and project expenditures'}
          </p>
        </div>

        <button 
          id="btnRecordExpense"
          onClick={handleOpenAdd}
          className="submit-btn"
          style={{ padding: '10px 18px', fontSize: '0.85rem', gap: '8px' }}
        >
          <Plus size={15} />
          <span>{language === 'ar' ? 'تسجيل مصروف جديد' : 'Record Expense'}</span>
        </button>
      </div>

      {/* 2. Top KPI Cards */}
      <div className="payments-kpi-grid">
        
        {/* KPI 1: Total Outlays */}
        <div className="payments-kpi-card red">
          <div className="kpi-card-header">
            <span className="kpi-card-label">
              {language === 'ar' ? 'إجمالي المصاريف الكلية' : 'Total Logged Outlays'}
            </span>
            <div className="kpi-card-icon-bubble red">
              <TrendingDown size={16} />
            </div>
          </div>
          <div className="kpi-card-value-row">
            <span className="kpi-card-metric-huge" style={{ color: '#D32F2F' }}>
              -{metrics.totalExpenses.toLocaleString()}
            </span>
            <span className="kpi-currency-unit">DZ</span>
          </div>
          <span className="kpi-subtext-note">
            {language === 'ar' ? 'مجموع جميع التكاليف والنفقات المسجلة' : 'From all cleared expense records'}
          </span>
        </div>

        {/* KPI 2: Project-Linked Outlays */}
        <div className="payments-kpi-card orange">
          <div className="kpi-card-header">
            <span className="kpi-card-label">
              {language === 'ar' ? 'تكاليف المشاريع المباشرة' : 'Project-Linked Outlays'}
            </span>
            <div className="kpi-card-icon-bubble orange">
              <FolderKanban size={16} />
            </div>
          </div>
          <div className="kpi-card-value-row">
            <span className="kpi-card-metric-huge" style={{ color: 'var(--accent-orange)' }}>
              -{metrics.projectExpenses.toLocaleString()}
            </span>
            <span className="kpi-currency-unit">DZ</span>
          </div>
          <span className="kpi-subtext-note">
            {language === 'ar' 
              ? `${metrics.projectExpensesCount} نفقة مخصصة للمشاريع` 
              : `${metrics.projectExpensesCount} outlays allocated to projects`}
          </span>
        </div>

        {/* KPI 3: This Month Outlays */}
        <div className="payments-kpi-card purple">
          <div className="kpi-card-header">
            <span className="kpi-card-label">
              {language === 'ar' ? 'مصاريف هذا الشهر' : 'This Month Outlays'}
            </span>
            <div className="kpi-card-icon-bubble purple">
              <Clock size={16} />
            </div>
          </div>
          <div className="kpi-card-value-row">
            <span className="kpi-card-metric-huge" style={{ color: 'var(--accent-purple)' }}>
              -{metrics.thisMonthExpenses.toLocaleString()}
            </span>
            <span className="kpi-currency-unit">DZ</span>
          </div>
          <span className="kpi-subtext-note">
            {language === 'ar' ? 'نفقات الشهر التقويمي الحالي' : 'Recorded in the current month'}
          </span>
        </div>

        {/* KPI 4: Average Outlay */}
        <div className="payments-kpi-card amber">
          <div className="kpi-card-header">
            <span className="kpi-card-label">
              {language === 'ar' ? 'متوسط قيمة المعاملة' : 'Average Outlay'}
            </span>
            <div className="kpi-card-icon-bubble amber">
              <Percent size={16} />
            </div>
          </div>
          <div className="kpi-card-value-row">
            <span className="kpi-card-metric-huge" style={{ color: '#B45309' }}>
              {metrics.averageExpense.toLocaleString()}
            </span>
            <span className="kpi-currency-unit">DZ</span>
          </div>
          <span className="kpi-subtext-note">
            {language === 'ar' 
              ? `${expenses.length} عملية صرف مسجلة إجمالاً` 
              : `Across ${expenses.length} total outlay entries`}
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
            placeholder={
              language === 'ar' 
                ? 'بحث بالبيان، المشروع، التصنيف، أو المرجع...' 
                : 'Search by description, project, category, or ref...'
            }
            className="payments-search-field"
          />
        </div>

        <div className="payments-filters-group">
          {/* Category Filter Chips */}
          <button
            type="button"
            onClick={() => setSelectedCategoryFilter('all')}
            className={`payments-filter-chip ${selectedCategoryFilter === 'all' ? 'active' : ''}`}
          >
            {language === 'ar' ? 'جميع التصنيفات' : 'All Categories'}
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategoryFilter('Software/Tools')}
            className={`payments-filter-chip ${selectedCategoryFilter === 'Software/Tools' ? 'active' : ''}`}
          >
            {language === 'ar' ? 'برامج وأدوات' : 'Software'}
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategoryFilter('Hosting/Services')}
            className={`payments-filter-chip ${selectedCategoryFilter === 'Hosting/Services' ? 'active' : ''}`}
          >
            {language === 'ar' ? 'استضافة' : 'Hosting'}
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategoryFilter('Marketing')}
            className={`payments-filter-chip ${selectedCategoryFilter === 'Marketing' ? 'active' : ''}`}
          >
            {language === 'ar' ? 'تسويق' : 'Marketing'}
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategoryFilter('Equipment')}
            className={`payments-filter-chip ${selectedCategoryFilter === 'Equipment' ? 'active' : ''}`}
          >
            {language === 'ar' ? 'أجهزة' : 'Equipment'}
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategoryFilter('Others')}
            className={`payments-filter-chip ${selectedCategoryFilter === 'Others' ? 'active' : ''}`}
          >
            {language === 'ar' ? 'أخرى' : 'Others'}
          </button>

          {/* Project Linkage Toggle */}
          <button
            type="button"
            onClick={() => setSelectedProjectFilter(prev => {
              if (prev === 'all') return 'linked';
              if (prev === 'linked') return 'general';
              return 'all';
            })}
            className={`payments-filter-chip ${selectedProjectFilter !== 'all' ? 'active' : ''}`}
            title={language === 'ar' ? 'تصفية حسب الارتباط بمشروع' : 'Filter by project link'}
          >
            {selectedProjectFilter === 'all' && (language === 'ar' ? 'المشاريع: الكل' : 'Projects: All')}
            {selectedProjectFilter === 'linked' && (language === 'ar' ? 'مرتبطة بمشروع' : 'Project Linked')}
            {selectedProjectFilter === 'general' && (language === 'ar' ? 'تكاليف عامة' : 'General Costs')}
          </button>

          {/* Sort Order Button */}
          <button
            type="button"
            onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
            className="payments-filter-chip"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            title={language === 'ar' ? 'ترتيب حسب التاريخ' : 'Sort by date'}
          >
            <ArrowUpDown size={12} />
            <span>
              {sortOrder === 'desc' 
                ? (language === 'ar' ? 'الأحدث أولاً' : 'Newest') 
                : (language === 'ar' ? 'الأقدم أولاً' : 'Oldest')}
            </span>
          </button>
        </div>
      </div>

      {/* 4. Transactions Ledger Table */}
      {filteredExpenses.length === 0 ? (
        <div className="empty-directory-card">
          <div 
            className="kpi-card-icon-bubble red" 
            style={{ width: '48px', height: '48px', borderRadius: '50%' }}
          >
            <TrendingDown size={24} />
          </div>
          <h4 style={{ fontSize: '1.05rem', fontWeight: 450 }}>
            {expenses.length === 0 
              ? (language === 'ar' ? 'لا توجد مصاريف مسجلة بعد' : 'No expenses logged yet')
              : (language === 'ar' ? 'لا توجد نتائج مطابقة لخيارات البحث' : 'No expenses match your search filters')}
          </h4>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            {expenses.length === 0 
              ? (language === 'ar' 
                  ? 'ابدأ بتسجيل أول مصروف تشغيلي أو اشتراك لربطه بالمشاريع ومتابعة التكاليف بدقة.' 
                  : 'Start recording operational outlays to monitor cost allocations and real project margins.')
              : (language === 'ar' 
                  ? 'جرّب تعديل كلمات البحث أو تصفير فلتر التصنيفات.' 
                  : 'Try changing your search terms or clearing the category filter.')}
          </p>
          {expenses.length === 0 && (
            <button 
              onClick={handleOpenAdd} 
              className="submit-btn" 
              style={{ padding: '8px 20px', fontSize: '0.85rem', marginTop: '6px' }}
            >
              <Plus size={15} />
              <span>{language === 'ar' ? 'تسجيل أول مصروف' : 'Record First Expense'}</span>
            </button>
          )}
        </div>
      ) : (
        <div className="payments-table-card">
          <div className="payments-table-wrap">
            <table className="payments-table">
              <thead>
                <tr>
                  <th>{language === 'ar' ? 'بيان المصروف' : 'Item / Outlay'}</th>
                  <th>{language === 'ar' ? 'المشروع المرتبط' : 'Project'}</th>
                  <th>{language === 'ar' ? 'المبلغ المستقطع' : 'Amount'}</th>
                  <th>{language === 'ar' ? 'التصنيف' : 'Category'}</th>
                  <th>{language === 'ar' ? 'طريقة الدفع' : 'Method'}</th>
                  <th>{language === 'ar' ? 'تاريخ الصرف' : 'Date'}</th>
                  <th>{language === 'ar' ? 'رقم الإشعار / الفاتورة' : 'Reference'}</th>
                  <th style={{ textAlign: 'center' }}>{language === 'ar' ? 'الإجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map((exp) => {
                  const project = projects.find(p => p.id === exp.project_id);

                  return (
                    <tr key={exp.id}>
                      {/* Description & Icon */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div 
                            style={{ 
                              width: '28px', 
                              height: '28px', 
                              borderRadius: 'var(--radius-sm)', 
                              backgroundColor: '#FFEBEE', 
                              color: '#D32F2F', 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center' 
                            }}
                          >
                            {getCategoryIcon(exp.category, 14)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 450, color: 'var(--text-main)' }}>
                              {exp.description || (language === 'ar' ? 'مصروف عام' : 'General Outlay')}
                            </div>
                            {exp.notes && (
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                {exp.notes}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Project Link */}
                      <td>
                        {project ? (
                          <span style={{ 
                            fontSize: '0.8rem', 
                            fontWeight: 450, 
                            color: 'var(--text-main)',
                            background: 'var(--bg-canvas)',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            border: '1px solid var(--border-color)'
                          }}>
                            {project.name}
                          </span>
                        ) : (
                          <span style={{ 
                            fontSize: '0.76rem', 
                            color: 'var(--text-muted)',
                            background: 'var(--bg-sidebar)',
                            padding: '2px 7px',
                            borderRadius: '3px'
                          }}>
                            {language === 'ar' ? 'تكلفة عامة' : 'General Cost'}
                          </span>
                        )}
                      </td>

                      {/* Amount */}
                      <td>
                        <span className="payment-amount-cell" style={{ color: '#D32F2F' }}>
                          -{exp.amount.toLocaleString()} <span style={{ fontSize: '0.75rem' }}>DZ</span>
                        </span>
                      </td>

                      {/* Category Pill */}
                      <td>
                        <span className={getCategoryPillClass(exp.category)}>
                          {getCategoryLabel(exp.category)}
                        </span>
                      </td>

                      {/* Payment Method Badge */}
                      <td>
                        <span className={getMethodBadgeClass(exp.payment_method)}>
                          {getMethodLabel(exp.payment_method)}
                        </span>
                      </td>

                      {/* Date */}
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {exp.expense_date}
                      </td>

                      {/* Reference Number */}
                      <td>
                        {exp.reference_number ? (
                          <span style={{ 
                            fontFamily: 'var(--font-mono)', 
                            fontSize: '0.74rem', 
                            color: 'var(--text-muted)',
                            background: 'var(--bg-sidebar)',
                            padding: '2px 6px',
                            borderRadius: '3px'
                          }}>
                            {exp.reference_number}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-placeholder)', fontSize: '0.75rem' }}>—</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          {/* Edit Trigger */}
                          <button
                            type="button"
                            onClick={() => setEditingExpense(exp)}
                            className="table-action-icon-btn"
                            title={language === 'ar' ? 'تعديل المصروف' : 'Edit Expense'}
                          >
                            <Edit2 size={14} />
                          </button>

                          {/* Delete Trigger */}
                          <button
                            type="button"
                            onClick={() => handleDelete(exp.id)}
                            className="table-action-icon-btn delete"
                            title={language === 'ar' ? 'حذف المصروف' : 'Delete'}
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

      {/* 5. Add / Edit Expense Modal Dialog */}
      {(isAddModalOpen || editingExpense) && (
        <AddExpenseModal
          isOpen={isAddModalOpen || Boolean(editingExpense)}
          onClose={() => {
            setIsAddModalOpen(false);
            setEditingExpense(null);
          }}
          projects={projects}
          expenseToEdit={editingExpense}
          onAddExpense={onAddExpense}
          onEditExpense={onEditExpense}
        />
      )}

    </div>
  );
};
