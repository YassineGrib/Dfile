import React, { useState, useMemo } from 'react';
import { useLanguage } from './LanguageContext';
import { useTheme } from '../core';
import type { Client, Project, Payment, Expense, Activity } from '../types';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  LineController,
  BarController,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler,
} from 'chart.js';
import { Chart, Doughnut } from 'react-chartjs-2';
import {
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Plus,
  FileText,
  FilePenLine,
  CalendarPlus,
  HandCoins,
  Download,
  FolderPlus,
  UserPlus,
  Banknote,
  Receipt,
  type LucideIcon,
} from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  BarController,
  LineController,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

interface DashboardViewProps {
  clients: Client[];
  projects: Project[];
  payments: Payment[];
  expenses: Expense[];
  activities: Activity[];
  onOpenAddProject: () => void;
  onOpenAddClient: () => void;
  onOpenAddExpense: () => void;
  onOpenAddPayment?: () => void;
  onNavigate?: (tab: string) => void;
  onExportBackup?: () => void;
  freelancerName?: string;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  clients,
  projects,
  payments,
  expenses,
  activities,
  onOpenAddProject,
  onOpenAddClient,
  onOpenAddExpense,
  onOpenAddPayment,
  onNavigate,
  onExportBackup,
  freelancerName,
}) => {
  const { language } = useLanguage();
  const { theme, resolvedMode } = useTheme();
  const [timeRange, setTimeRange] = useState<'6m' | 'year'>('6m');

  // 1. Calculate Metrics
  const totalRevenue = payments.reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);
  const netProfit = totalRevenue - totalExpenses;
  const isProfit = netProfit >= 0;

  const activeProjectsCount = projects.filter(
    (p) => p.status === 'In Progress' || p.status === 'Waiting Client'
  ).length;

  // Only expenses dated in the current calendar month (same YYYY-MM bucketing as the cashflow chart)
  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const monthlyExpenses = expenses
    .filter((e) => (e.expense_date || e.created_at || '').slice(0, 7) === currentMonthKey)
    .reduce((acc, curr) => acc + curr.amount, 0);

  // Total pending receivables / outstanding client balances (sum of project remaining balances / reste)
  const pendingPayments = projects
    .filter((p) => p.status !== 'Cancelled')
    .reduce((acc, p) => {
      const projectPayments = payments.filter((pm) => pm.project_id === p.id);
      const collected = projectPayments.reduce((s, pm) => s + (pm.amount || 0), 0);
      return acc + Math.max(0, (p.price_dzd || 0) - collected);
    }, 0);

  // Helper to format currency
  const formatCurrency = (val: number) => {
    return val.toLocaleString(language === 'ar' ? 'ar-DZ' : 'en-US') + ' DZ';
  };

  // Helper to calculate days remaining
  const getDaysRemaining = (dueDateStr?: string) => {
    if (!dueDateStr) return null;
    const due = new Date(dueDateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = due.getTime() - today.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days;
  };

  // --- Dynamic Cashflow Monthly Aggregation ---
  const monthsData = useMemo(() => {
    const result: { key: string; label: string; inflow: number; outflow: number; net: number }[] = [];
    const today = new Date();

    const arMonths = ['جانفي', 'فيفري', 'مارس', 'أفريل', 'ماي', 'جوان', 'جويلية', 'أوت', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    const enMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    if (timeRange === '6m') {
      for (let i = 5; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const y = d.getFullYear();
        const m = d.getMonth();
        const key = `${y}-${String(m + 1).padStart(2, '0')}`;
        const label = language === 'ar' ? arMonths[m] : enMonths[m];
        result.push({ key, label, inflow: 0, outflow: 0, net: 0 });
      }
    } else {
      const y = today.getFullYear();
      for (let m = 0; m < 12; m++) {
        const key = `${y}-${String(m + 1).padStart(2, '0')}`;
        const label = language === 'ar' ? arMonths[m] : enMonths[m];
        result.push({ key, label, inflow: 0, outflow: 0, net: 0 });
      }
    }

    // Aggregate payments
    payments.forEach((p) => {
      const dateStr = p.payment_date || p.created_at;
      if (dateStr) {
        const monthKey = dateStr.slice(0, 7);
        const target = result.find((item) => item.key === monthKey);
        if (target) {
          target.inflow += p.amount;
        }
      }
    });

    // Aggregate expenses
    expenses.forEach((e) => {
      const dateStr = e.expense_date || e.created_at;
      if (dateStr) {
        const monthKey = dateStr.slice(0, 7);
        const target = result.find((item) => item.key === monthKey);
        if (target) {
          target.outflow += e.amount;
        }
      }
    });

    // Calculate net cashflow per month
    result.forEach((item) => {
      item.net = item.inflow - item.outflow;
    });

    return result;
  }, [payments, expenses, timeRange, language]);

  // Key Range Summary
  const totalRangeInflow = useMemo(() => monthsData.reduce((acc, m) => acc + m.inflow, 0), [monthsData]);
  const totalRangeOutflow = useMemo(() => monthsData.reduce((acc, m) => acc + m.outflow, 0), [monthsData]);
  const totalRangeNet = totalRangeInflow - totalRangeOutflow;
  const marginPercentage = totalRangeInflow > 0 ? Math.round((totalRangeNet / totalRangeInflow) * 100) : 0;
  const hasTransactions = totalRangeInflow > 0 || totalRangeOutflow > 0;

  // Chart colors come from the app theme palette. Forest is too dark to read
  // on the dark card, so dark mode lifts it to a brighter green.
  const isDark = resolvedMode === 'dark';
  const forest = isDark ? '#4ADE80' : theme.colors.brand.forest;
  const purple = theme.colors.brand.purple;
  const orange = theme.colors.brand.orange;

  // Chart Data Configuration (Mixed Chart: Bar + Spline Line)
  const cashflowChartData = {
    labels: monthsData.map((m) => m.label),
    datasets: [
      {
        type: 'line' as const,
        label: language === 'ar' ? 'صافي التدفق (Net Profit)' : 'Net Cashflow',
        data: monthsData.map((m) => m.net),
        borderColor: purple,
        backgroundColor: `${purple}14`,
        borderWidth: 2.5,
        tension: 0.35,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: purple,
        pointBorderColor: theme.colors.bg.card,
        pointBorderWidth: 2,
        fill: true,
        order: 1,
      },
      {
        type: 'bar' as const,
        label: language === 'ar' ? 'المقبوضات (Inflow)' : 'Inflow (Payments)',
        data: monthsData.map((m) => m.inflow),
        backgroundColor: forest,
        hoverBackgroundColor: isDark ? '#22C55E' : theme.colors.brand.forestHover,
        borderRadius: 5,
        barThickness: timeRange === '6m' ? 14 : 9,
        order: 2,
      },
      {
        type: 'bar' as const,
        label: language === 'ar' ? 'المصاريف (Outflow)' : 'Outflow (Expenses)',
        data: monthsData.map((m) => m.outflow),
        backgroundColor: orange,
        hoverBackgroundColor: `${orange}CC`,
        borderRadius: 5,
        barThickness: timeRange === '6m' ? 14 : 9,
        order: 3,
      },
    ],
  };

  const cashflowChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: '#1E1E1E',
        titleFont: { size: 11, weight: 'normal' as const },
        bodyFont: { size: 10 },
        padding: 10,
        cornerRadius: 8,
        displayColors: true,
        boxWidth: 8,
        boxHeight: 8,
        usePointStyle: true,
        callbacks: {
          label: (context: any) => {
            const val = Number(context.raw) || 0;
            return ` ${context.dataset.label}: ${val.toLocaleString()} DZ`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#888',
          font: { size: 9, weight: 'normal' as const },
        },
        border: {
          display: false,
        },
      },
      y: {
        grid: {
          color: '#F1ECE0',
        },
        ticks: {
          color: '#999',
          font: { size: 8, weight: 'normal' as const },
          callback: (value: any) => {
            const val = Number(value);
            if (Math.abs(val) >= 1000) {
              return `${(val / 1000).toFixed(0)}k`;
            }
            return val;
          },
        },
        border: {
          display: false,
        },
      },
    },
  };

  // Projects ratio statuses — done states share the forest hue (solid = delivered, tint = completed)
  const statusSegments = [
    { key: 'Delivered', label: language === 'ar' ? 'تم التسليم' : 'Delivered', color: forest },
    { key: 'Completed', label: language === 'ar' ? 'مكتمل' : 'Completed', color: `${forest}73` },
    { key: 'In Progress', label: language === 'ar' ? 'قيد التنفيذ' : 'In Progress', color: theme.colors.brand.purple },
    { key: 'Waiting Client', label: language === 'ar' ? 'بانتظار العميل' : 'Waiting Client', color: theme.colors.brand.orange },
    { key: 'Planned', label: language === 'ar' ? 'مخطط له' : 'Planned', color: theme.colors.text.placeholder },
  ].map((s) => ({ ...s, count: projects.filter((p) => p.status === s.key).length }));

  const totalProjects = projects.length;
  const doughnutData = {
    labels:
      totalProjects > 0
        ? statusSegments.map((s) => s.label)
        : [language === 'ar' ? 'لا توجد مشاريع بعد' : 'No Projects Yet'],
    datasets: [
      {
        data: totalProjects > 0 ? statusSegments.map((s) => s.count) : [1],
        backgroundColor:
          totalProjects > 0 ? statusSegments.map((s) => s.color) : [theme.colors.border.default],
        // Thin gaps in the card color keep neighbouring segments (e.g. the two greens) distinct
        borderColor: theme.colors.bg.card,
        borderWidth: totalProjects > 0 ? 2 : 0,
        hoverOffset: totalProjects > 0 ? 3 : 0,
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '76%',
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: '#1E1E1E',
        bodyFont: { size: 10 },
        padding: 8,
        displayColors: false,
        callbacks: {
          label: (context: any) =>
            ` ${context.label}: ${context.raw} ${language === 'ar' ? 'مشاريع' : 'projects'}`,
        },
      },
    },
  };

  // Quick actions: "create" opens a form in place, "go to" switches to the page that owns the flow
  type QuickAction = {
    id: string;
    icon: LucideIcon;
    tone: 'green' | 'purple' | 'orange' | 'blue';
    label: string;
    hint?: string;
    onClick: () => void;
  };
  const isAr = language === 'ar';

  const createActions: QuickAction[] = [
    { id: 'qaAddProjectBtn', icon: FolderPlus, tone: 'green', label: isAr ? 'إضافة مشروع' : 'Add Project', onClick: onOpenAddProject },
    { id: 'qaAddClientBtn', icon: UserPlus, tone: 'purple', label: isAr ? 'إضافة عميل' : 'Add Client', onClick: onOpenAddClient },
    ...(onOpenAddPayment
      ? [{ id: 'qaAddPaymentBtn', icon: Banknote, tone: 'blue' as const, label: isAr ? 'تسجيل دفعة' : 'Add Payment', onClick: onOpenAddPayment }]
      : []),
    { id: 'qaAddExpenseBtn', icon: Receipt, tone: 'orange', label: isAr ? 'تسجيل مصاريف' : 'Add Expense', onClick: onOpenAddExpense },
  ];

  const goToActions: QuickAction[] = onNavigate
    ? [
        { id: 'qaNewInvoiceBtn', icon: FileText, tone: 'blue', label: isAr ? 'إنشاء فاتورة' : 'New Invoice', hint: isAr ? 'يفتح صفحة الفواتير' : 'Opens the Invoices page', onClick: () => onNavigate('invoices') },
        { id: 'qaNewContractBtn', icon: FilePenLine, tone: 'purple', label: isAr ? 'إنشاء عقد' : 'New Contract', hint: isAr ? 'يفتح صفحة العقود' : 'Opens the Contracts page', onClick: () => onNavigate('contracts') },
        { id: 'qaAddMilestoneBtn', icon: CalendarPlus, tone: 'orange', label: isAr ? 'إضافة موعد' : 'Add Milestone', hint: isAr ? 'يفتح التقويم' : 'Opens the Calendar', onClick: () => onNavigate('calendar') },
        { id: 'qaFriendDebtBtn', icon: HandCoins, tone: 'green', label: isAr ? 'تسجيل دين' : 'Record Debt', hint: isAr ? 'يفتح صفحة الأصدقاء والديون' : 'Opens Friends & Debts', onClick: () => onNavigate('friends-debts') },
      ]
    : [];

  const renderQuickAction = ({ id, icon: Icon, tone, label, hint, onClick }: QuickAction) => (
    <button key={id} id={id} type="button" onClick={onClick} className="action-pill-btn" title={hint}>
      <span className={`pill-icon-circle tone-${tone}`} aria-hidden="true">
        <Icon size={14} strokeWidth={2} />
      </span>
      <span className="pill-label-text">{label}</span>
      {hint && <ArrowUpRight size={13} className="pill-goto-arrow" aria-hidden="true" />}
    </button>
  );

  return (
    <div className="dashboard-content-area">
      {/* Dashboard Top Header */}
      <header className="dashboard-header-bar">
        <div className="header-greeting-info">
          <h2 className="header-greeting-title">
            {language === 'ar' 
              ? `مرحباً بك مجدداً${freelancerName ? `، ${freelancerName}` : '!'}` 
              : `Welcome back, ${freelancerName || 'Freelancer'}!`}
          </h2>
          <p className="header-greeting-subtitle">
            {language === 'ar'
              ? 'إليك نظرة سريعة على سير عملك اليوم ومؤشرات السيولة المالية.'
              : "Here's an overview of your freelance workspace and cashflow health today."}
          </p>
        </div>
      </header>

      {/* KPI Bento Grid */}
      <section className="kpi-bento-grid">
        {/* Metric Card: Net Profit */}
        <div className={`kpi-card profit-widget ${isProfit ? 'profit-green' : 'profit-red'}`}>
          <div className="kpi-card-inner">
            <span className="kpi-badge-pill">
              {language === 'ar' ? 'صافي الأرباح' : 'Net Profit'}
            </span>
            <h3 className="kpi-main-number">{formatCurrency(netProfit)}</h3>
            <p className="kpi-description-sub">
              {language === 'ar' ? 'المدفوعات - المصاريف' : 'Total Revenue - Expenses'}
            </p>
          </div>
        </div>

        {/* Metric Card: Active Projects */}
        <div className="kpi-card">
          <div className="kpi-card-inner">
            <span className="kpi-badge-pill accent-purple-pill">
              {language === 'ar' ? 'مشاريع نشطة' : 'Active Projects'}
            </span>
            <h3 className="kpi-main-number">{activeProjectsCount}</h3>
            <p className="kpi-description-sub">
              {language === 'ar' ? 'قيد التنفيذ وبانتظار العميل' : 'In Progress & Waiting Client'}
            </p>
          </div>
        </div>

        {/* Metric Card: Monthly Expenses */}
        <div className="kpi-card">
          <div className="kpi-card-inner">
            <span className="kpi-badge-pill accent-orange-pill">
              {language === 'ar' ? 'المصاريف الشهرية' : 'Monthly Expenses'}
            </span>
            <h3 className="kpi-main-number">{formatCurrency(monthlyExpenses)}</h3>
            <p className="kpi-description-sub">
              {language === 'ar' ? 'إجمالي تكاليف هذا الشهر' : 'Total spent this month'}
            </p>
          </div>
        </div>

        {/* Metric Card: Pending Invoices */}
        <div className="kpi-card">
          <div className="kpi-card-inner">
            <span className="kpi-badge-pill accent-lime-pill">
              {language === 'ar' ? 'مدفوعات معلقة' : 'Pending Invoices'}
            </span>
            <h3 className="kpi-main-number">{formatCurrency(pendingPayments > 0 ? pendingPayments : 0)}</h3>
            <p className="kpi-description-sub">
              {language === 'ar' ? 'إجمالي المتبقي للتحصيل من المشاريع' : 'Outstanding client balances'}
            </p>
          </div>
        </div>
      </section>

      {/* Quick Actions Panel */}
      <section className="quick-actions-bar" aria-labelledby="quickActionsTitle">
        <div className="actions-header-row">
          <h4 id="quickActionsTitle" className="actions-title-header">
            {isAr ? 'إجراءات سريعة' : 'Quick Actions'}
          </h4>
          {onExportBackup && (
            <button
              id="qaExportBackupBtn"
              type="button"
              onClick={onExportBackup}
              className="actions-utility-btn"
            >
              <Download size={13} aria-hidden="true" />
              {isAr ? 'نسخة احتياطية' : 'Export Backup'}
            </button>
          )}
        </div>

        <div className="actions-group" role="group" aria-label={isAr ? 'إنشاء' : 'Create'}>
          <span className="actions-group-label">{isAr ? 'إنشاء' : 'Create'}</span>
          <div className="actions-button-grid">{createActions.map(renderQuickAction)}</div>
        </div>

        {goToActions.length > 0 && (
          <div className="actions-group" role="group" aria-label={isAr ? 'انتقال إلى' : 'Go to'}>
            <span className="actions-group-label">{isAr ? 'انتقال إلى' : 'Go to'}</span>
            <div className="actions-button-grid">{goToActions.map(renderQuickAction)}</div>
          </div>
        )}
      </section>

      {/* Charts & Graphs: High-End Cashflow & Project Status */}
      <section className="charts-double-grid">
        {/* Dynamic Cashflow & Profit Analytics Chart */}
        <div className="chart-card-wrapper">
          <div className="chart-header-row">
            <div className="chart-title-group">
              <h4 className="chart-title" style={{ marginBottom: 0 }}>
                {language === 'ar' ? 'تحليلات التدفقات والسيولة المالية' : 'Cashflow & Profit Analytics'}
              </h4>
              <span className="chart-subtitle">
                {language === 'ar'
                  ? 'مقارنة المقبوضات بالمصاريف الشهرية ومسار صافي الربح'
                  : 'Monthly inflows vs outflows and net profit trajectory'}
              </span>
            </div>

            {/* Time Range Selector */}
            <div className="chart-time-toggle">
              <button
                type="button"
                className={`time-toggle-btn ${timeRange === '6m' ? 'active' : ''}`}
                onClick={() => setTimeRange('6m')}
              >
                {language === 'ar' ? 'آخر 6 أشهر' : 'Last 6 Months'}
              </button>
              <button
                type="button"
                className={`time-toggle-btn ${timeRange === 'year' ? 'active' : ''}`}
                onClick={() => setTimeRange('year')}
              >
                {language === 'ar' ? 'هذا العام' : 'This Year'}
              </button>
            </div>
          </div>

          {/* Key Range Stats Ribbon */}
          <div className="cashflow-kpi-ribbon">
            <div className="cashflow-ribbon-item">
              <span className="cashflow-ribbon-label">
                <ArrowUpRight size={13} color={forest} />
                {language === 'ar' ? 'المقبوضات' : 'Total Inflow'}
              </span>
              <span className="cashflow-ribbon-val inflow-val">
                {formatCurrency(totalRangeInflow)}
              </span>
            </div>

            <div className="cashflow-ribbon-item">
              <span className="cashflow-ribbon-label">
                <ArrowDownRight size={13} color={orange} />
                {language === 'ar' ? 'المصاريف' : 'Total Outflow'}
              </span>
              <span className="cashflow-ribbon-val outflow-val">
                {formatCurrency(totalRangeOutflow)}
              </span>
            </div>

            <div className="cashflow-ribbon-item">
              <span className="cashflow-ribbon-label">
                <Wallet size={13} color={purple} />
                {language === 'ar' ? 'صافي السيولة' : 'Net Cashflow'}
              </span>
              <span className="cashflow-ribbon-val net-val">
                {formatCurrency(totalRangeNet)}
              </span>
            </div>

            <div className="cashflow-ribbon-item">
              <span className="cashflow-ribbon-label">
                <TrendingUp size={13} color={theme.colors.status.info} />
                {language === 'ar' ? 'هامش الربح' : 'Profit Margin'}
              </span>
              <span className="cashflow-ribbon-val">
                {marginPercentage}%
              </span>
            </div>
          </div>

          {/* Chart Canvas */}
          <div className="svg-chart-container" style={{ position: 'relative', height: '220px' }}>
            <Chart type="bar" data={cashflowChartData} options={cashflowChartOptions} />
          </div>

          {/* Visual Legend */}
          <div className="chart-legend-row" style={{ marginTop: '14px' }}>
            <div className="legend-item">
              <span className="legend-dot" style={{ backgroundColor: forest }}></span>
              <span className="legend-label">
                {language === 'ar' ? 'المقبوضات (التحصيلات)' : 'Inflow (Payments)'}
              </span>
            </div>
            <div className="legend-item">
              <span className="legend-dot" style={{ backgroundColor: orange }}></span>
              <span className="legend-label">
                {language === 'ar' ? 'المصاريف' : 'Outflow (Expenses)'}
              </span>
            </div>
            <div className="legend-item">
              <span className="legend-dot" style={{ backgroundColor: purple }}></span>
              <span className="legend-label">
                {language === 'ar' ? 'صافي الربح الشهري' : 'Net Cashflow (Line)'}
              </span>
            </div>
          </div>

          {/* Graceful 0-state banner if no transactions exist yet */}
          {!hasTransactions && (
            <div className="cashflow-zero-banner">
              <div className="cashflow-zero-info">
                <Wallet size={16} color="var(--text-muted)" />
                <span>
                  {language === 'ar'
                    ? 'لم يتم تسجيل أي مقبوضات أو مصاريف في هذه الفترة بعد.'
                    : 'No payments or expenses recorded in this period yet.'}
                </span>
              </div>
              <div className="cashflow-zero-actions">
                {onOpenAddPayment && (
                  <button
                    type="button"
                    onClick={onOpenAddPayment}
                    className="cashflow-quick-record-btn"
                  >
                    <Plus size={13} />
                    {language === 'ar' ? 'تسجيل أول دفعة' : 'Record Payment'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={onOpenAddExpense}
                  className="cashflow-quick-record-btn secondary-btn"
                >
                  <Plus size={13} />
                  {language === 'ar' ? 'تسجيل مصروف' : 'Add Expense'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Project Status Ratio Chart */}
        <div className="chart-card-wrapper">
          <h4 className="chart-title">
            {language === 'ar' ? 'حالة المشاريع الحالية' : 'Projects Status Ratio'}
          </h4>
          <div
            className="svg-chart-container pie-container"
            style={{ position: 'relative', height: '140px', width: '140px', margin: '0 auto' }}
          >
            <Doughnut data={doughnutData} options={doughnutOptions} />
            <div className="doughnut-center-overlay">
              <span className="doughnut-center-num">{projects.length}</span>
              <span className="doughnut-center-label">
                {language === 'ar' ? 'مشاريع' : 'PROJECTS'}
              </span>
            </div>
          </div>
          <div className="chart-legend-column" style={{ marginTop: '16px' }}>
            {statusSegments.map((s) => (
              <div key={s.key} className="legend-item flex-between">
                <div className="legend-label-group">
                  <span className="legend-dot" style={{ backgroundColor: s.color }}></span>
                  <span className="legend-label">{s.label}</span>
                </div>
                <span className="legend-val-num">{s.count}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Activity and Deadlines Split Columns */}
      <section className="activities-deadlines-grid">
        {/* Recent Activity Log */}
        <div className="activity-panel-card">
          <h4 className="panel-title-header">
            {language === 'ar' ? 'النشاطات الأخيرة' : 'Recent Activity'}
          </h4>
          <div className="activity-feed-scroller">
            {activities.length === 0 ? (
              <p className="no-activity-text">
                {language === 'ar' ? 'لا يوجد نشاط مسجل.' : 'No recent actions recorded.'}
              </p>
            ) : (
              activities.map((act) => (
                <div key={act.id} className="feed-activity-item">
                  <span className={`activity-indicator-dot type-${act.type}`}></span>
                  <div className="activity-text-info">
                    <p className="activity-msg-content">
                      {language === 'ar' ? act.text_ar : act.text}
                    </p>
                    <span className="activity-time-stamp">{act.timestamp}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Upcoming Deadlines */}
        <div className="activity-panel-card">
          <h4 className="panel-title-header">
            {language === 'ar' ? 'المواعيد النهائية القريبة' : 'Upcoming Deadlines'}
          </h4>
          <div className="deadlines-list-container">
            {projects.filter((p) => p.status !== 'Completed' && p.status !== 'Delivered' && p.status !== 'Cancelled' && p.end_date).length === 0 ? (
              <p className="no-activity-text">
                {language === 'ar' ? 'لا توجد مواعيد تسليم قريبة.' : 'No upcoming deadlines.'}
              </p>
            ) : (
              projects
                .filter((p) => p.status !== 'Completed' && p.status !== 'Delivered' && p.status !== 'Cancelled' && p.end_date)
                .map((proj) => {
                  const days = getDaysRemaining(proj.end_date);
                  const client = clients.find((c) => c.id === proj.client_id);
                  if (days === null) return null;

                  return (
                    <div key={proj.id} className="deadline-item-card">
                      <div className="deadline-project-details">
                        <span className="deadline-proj-name">{proj.name}</span>
                        <span className="deadline-client-name">
                          {language === 'ar' ? 'العميل: ' : 'Client: '} {client ? client.name : 'Unknown'}
                        </span>
                      </div>
                      <div className={`deadline-badge-status ${days <= 3 ? 'urgent-red' : 'warning-orange'}`}>
                        {days < 0 ? (
                          language === 'ar' ? 'متأخر' : 'Overdue'
                        ) : days === 0 ? (
                          language === 'ar' ? 'اليوم' : 'Today'
                        ) : (
                          language === 'ar' ? `متبقي ${days} يوم` : `${days} days left`
                        )}
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
