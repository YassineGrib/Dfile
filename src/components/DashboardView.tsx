import React, { useState, useMemo } from 'react';
import { useLanguage } from './LanguageContext';
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
import { TrendingUp, ArrowUpRight, ArrowDownRight, Wallet, Plus } from 'lucide-react';

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
}) => {
  const { language } = useLanguage();
  const [timeRange, setTimeRange] = useState<'6m' | 'year'>('6m');

  // 1. Calculate Metrics
  const totalRevenue = payments.reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);
  const netProfit = totalRevenue - totalExpenses;
  const isProfit = netProfit >= 0;

  const activeProjectsCount = projects.filter(
    (p) => p.status === 'In Progress' || p.status === 'Waiting Client'
  ).length;

  const monthlyExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);

  // Total budget of projects that are not completed, delivered, or cancelled
  const activeProjectsBudget = projects
    .filter((p) => p.status !== 'Completed' && p.status !== 'Delivered' && p.status !== 'Cancelled')
    .reduce((acc, curr) => acc + curr.price_dzd, 0);

  const activePaymentsReceived = payments.reduce((acc, curr) => {
    const proj = projects.find((p) => p.id === curr.project_id);
    if (proj && proj.status !== 'Completed' && proj.status !== 'Delivered' && proj.status !== 'Cancelled') {
      return acc + curr.amount;
    }
    return acc;
  }, 0);

  const pendingPayments = activeProjectsBudget - activePaymentsReceived;

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

  // Chart Data Configuration (Mixed Chart: Bar + Spline Line)
  const cashflowChartData = {
    labels: monthsData.map((m) => m.label),
    datasets: [
      {
        type: 'line' as const,
        label: language === 'ar' ? 'صافي التدفق (Net Profit)' : 'Net Cashflow',
        data: monthsData.map((m) => m.net),
        borderColor: '#6E59DB',
        backgroundColor: 'rgba(110, 89, 219, 0.08)',
        borderWidth: 2.5,
        tension: 0.35,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: '#6E59DB',
        pointBorderColor: '#FFFFFF',
        pointBorderWidth: 2,
        fill: true,
        order: 1,
      },
      {
        type: 'bar' as const,
        label: language === 'ar' ? 'المقبوضات (Inflow)' : 'Inflow (Payments)',
        data: monthsData.map((m) => m.inflow),
        backgroundColor: '#0E4F2F',
        hoverBackgroundColor: '#0A3B23',
        borderRadius: 5,
        barThickness: timeRange === '6m' ? 14 : 9,
        order: 2,
      },
      {
        type: 'bar' as const,
        label: language === 'ar' ? 'المصاريف (Outflow)' : 'Outflow (Expenses)',
        data: monthsData.map((m) => m.outflow),
        backgroundColor: '#E77C40',
        hoverBackgroundColor: '#D4692E',
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

  // Projects ratio statuses
  const deliveredCount = projects.filter((p) => p.status === 'Delivered').length;
  const completedCount = projects.filter((p) => p.status === 'Completed').length;
  const inProgressCount = projects.filter((p) => p.status === 'In Progress').length;
  const waitingCount = projects.filter((p) => p.status === 'Waiting Client').length;
  const plannedCount = projects.filter((p) => p.status === 'Planned').length;

  const totalProjects = projects.length;
  const doughnutData = {
    labels:
      totalProjects > 0
        ? [
            language === 'ar' ? 'تم التسليم' : 'Delivered',
            language === 'ar' ? 'مكتمل' : 'Completed',
            language === 'ar' ? 'قيد التنفيذ' : 'In Progress',
            language === 'ar' ? 'بانتظار العميل' : 'Waiting Client',
            language === 'ar' ? 'مخطط له' : 'Planned',
          ]
        : [language === 'ar' ? 'لا توجد مشاريع بعد' : 'No Projects Yet'],
    datasets: [
      {
        data:
          totalProjects > 0
            ? [deliveredCount, completedCount, inProgressCount, waitingCount, plannedCount]
            : [1],
        backgroundColor:
          totalProjects > 0
            ? [
                '#0E4F2F', // Delivered - Emerald
                '#22C55E', // Completed - Bright Green
                '#E77C40', // In Progress - Orange
                '#8C7CF0', // Waiting Client - Purple
                '#E6E5E0', // Planned - Warm Gray
              ]
            : ['#E6E5E0'],
        borderWidth: 0,
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

  return (
    <div className="dashboard-content-area">
      {/* Dashboard Top Header */}
      <header className="dashboard-header-bar">
        <div className="header-greeting-info">
          <h2 className="header-greeting-title">
            {language === 'ar' ? 'مرحباً بك مجدداً، صادق!' : 'Welcome back, Sadek!'}
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
              {language === 'ar' ? 'إجمالي تكاليف هذا الشهر' : 'Total business expenses'}
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
              {language === 'ar' ? 'مستحقات مشاريع قيد العمل' : 'Outstanding client balances'}
            </p>
          </div>
        </div>
      </section>

      {/* Quick Actions Panel */}
      <section className="quick-actions-bar">
        <h4 className="actions-title-header">
          {language === 'ar' ? 'إجراءات سريعة' : 'Quick Actions'}
        </h4>
        <div className="actions-button-grid">
          <button id="qaAddProjectBtn" onClick={onOpenAddProject} className="action-pill-btn">
            <span className="pill-icon-circle">+</span>
            <span className="pill-label-text">
              {language === 'ar' ? 'إضافة مشروع' : 'Add Project'}
            </span>
          </button>

          <button id="qaAddClientBtn" onClick={onOpenAddClient} className="action-pill-btn">
            <span className="pill-icon-circle accent-purple-icon">+</span>
            <span className="pill-label-text">
              {language === 'ar' ? 'إضافة عميل' : 'Add Client'}
            </span>
          </button>

          {onOpenAddPayment && (
            <button id="qaAddPaymentBtn" onClick={onOpenAddPayment} className="action-pill-btn">
              <span
                className="pill-icon-circle"
                style={{ backgroundColor: 'rgba(14, 79, 47, 0.12)', color: '#0E4F2F' }}
              >
                +
              </span>
              <span className="pill-label-text">
                {language === 'ar' ? 'تسجيل دفعة' : 'Add Payment'}
              </span>
            </button>
          )}

          <button id="qaAddExpenseBtn" onClick={onOpenAddExpense} className="action-pill-btn">
            <span className="pill-icon-circle accent-orange-icon">+</span>
            <span className="pill-label-text">
              {language === 'ar' ? 'تسجيل مصاريف' : 'Add Expense'}
            </span>
          </button>
        </div>
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
                <ArrowUpRight size={13} color="#0E4F2F" />
                {language === 'ar' ? 'المقبوضات' : 'Total Inflow'}
              </span>
              <span className="cashflow-ribbon-val inflow-val">
                {formatCurrency(totalRangeInflow)}
              </span>
            </div>

            <div className="cashflow-ribbon-item">
              <span className="cashflow-ribbon-label">
                <ArrowDownRight size={13} color="#E77C40" />
                {language === 'ar' ? 'المصاريف' : 'Total Outflow'}
              </span>
              <span className="cashflow-ribbon-val outflow-val">
                {formatCurrency(totalRangeOutflow)}
              </span>
            </div>

            <div className="cashflow-ribbon-item">
              <span className="cashflow-ribbon-label">
                <Wallet size={13} color="#6E59DB" />
                {language === 'ar' ? 'صافي السيولة' : 'Net Cashflow'}
              </span>
              <span className="cashflow-ribbon-val net-val">
                {formatCurrency(totalRangeNet)}
              </span>
            </div>

            <div className="cashflow-ribbon-item">
              <span className="cashflow-ribbon-label">
                <TrendingUp size={13} color="#3B82F6" />
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
              <span className="legend-dot" style={{ backgroundColor: '#0E4F2F' }}></span>
              <span className="legend-label">
                {language === 'ar' ? 'المقبوضات (التحصيلات)' : 'Inflow (Payments)'}
              </span>
            </div>
            <div className="legend-item">
              <span className="legend-dot" style={{ backgroundColor: '#E77C40' }}></span>
              <span className="legend-label">
                {language === 'ar' ? 'المصاريف' : 'Outflow (Expenses)'}
              </span>
            </div>
            <div className="legend-item">
              <span className="legend-dot" style={{ backgroundColor: '#6E59DB' }}></span>
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
            <div className="legend-item flex-between">
              <div className="legend-label-group">
                <span className="legend-dot" style={{ backgroundColor: '#0E4F2F' }}></span>
                <span className="legend-label">{language === 'ar' ? 'تم التسليم' : 'Delivered'}</span>
              </div>
              <span className="legend-val-num">{deliveredCount}</span>
            </div>
            <div className="legend-item flex-between">
              <div className="legend-label-group">
                <span className="legend-dot" style={{ backgroundColor: '#22C55E' }}></span>
                <span className="legend-label">{language === 'ar' ? 'مكتمل' : 'Completed'}</span>
              </div>
              <span className="legend-val-num">{completedCount}</span>
            </div>
            <div className="legend-item flex-between">
              <div className="legend-label-group">
                <span className="legend-dot" style={{ backgroundColor: '#E77C40' }}></span>
                <span className="legend-label">{language === 'ar' ? 'قيد التنفيذ' : 'In Progress'}</span>
              </div>
              <span className="legend-val-num">{inProgressCount}</span>
            </div>
            <div className="legend-item flex-between">
              <div className="legend-label-group">
                <span className="legend-dot" style={{ backgroundColor: '#8C7CF0' }}></span>
                <span className="legend-label">{language === 'ar' ? 'بانتظار العميل' : 'Waiting Client'}</span>
              </div>
              <span className="legend-val-num">{waitingCount}</span>
            </div>
            <div className="legend-item flex-between">
              <div className="legend-label-group">
                <span className="legend-dot" style={{ backgroundColor: '#E6E5E0' }}></span>
                <span className="legend-label">{language === 'ar' ? 'مخطط له' : 'Planned'}</span>
              </div>
              <span className="legend-val-num">{plannedCount}</span>
            </div>
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
