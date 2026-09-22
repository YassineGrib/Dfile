import React, { useState, useCallback } from 'react';
import { useLanguage } from './LanguageContext';
import type { Project, Client, Payment, Expense, Task } from '../types';
import type { ProjectStatus } from '../types';
import {
  Search, Plus, Edit2, Trash2, Check, Archive,
  TrendingUp, Calendar, DollarSign, BarChart2,
  Clock, Tag, User, ChevronDown, Filter, Grid, List,
  AlertCircle, CheckCircle, Pause, XCircle
} from 'lucide-react';
import { UserAvatar } from './UserAvatar';

interface ProjectsDirectoryProps {
  projects: Project[];
  clients: Client[];
  payments: Payment[];
  expenses: Expense[];
  tasks: Task[];
  onAddProject: (project: Project) => void;
  onEditProject: (project: Project) => void;
  onDeleteProject: (projectId: string) => void;
  onOpenAddProject: () => void;
}

const STATUS_CONFIG: Record<ProjectStatus, { label: string; labelAr: string; color: string; bg: string; Icon: React.FC<{ size?: number }> }> = {
  'Planned':        { label: 'Planned',        labelAr: 'مخطط',          color: '#6366f1', bg: '#EDE9FE', Icon: Clock },
  'In Progress':    { label: 'In Progress',    labelAr: 'جارٍ التنفيذ', color: '#f97316', bg: '#FFF0E6', Icon: BarChart2 },
  'Waiting Client': { label: 'Waiting Client', labelAr: 'بانتظار العميل', color: '#eab308', bg: '#FEFCE8', Icon: Pause },
  'Completed':      { label: 'Completed',      labelAr: 'مكتمل',         color: '#22c55e', bg: '#ECFDF5', Icon: CheckCircle },
  'Cancelled':      { label: 'Cancelled',      labelAr: 'ملغى',          color: '#ef4444', bg: '#FEF2F2', Icon: XCircle },
};

const CATEGORY_COLORS: Record<string, string> = {
  'Web Design':    '#6366f1',
  'Development':   '#0ea5e9',
  'Marketing':     '#f97316',
  'SEO Optimization': '#22c55e',
  'Design Retainer':  '#8b5cf6',
  'Consulting':    '#ec4899',
  'Motion Design': '#14b8a6',
};

function getCategoryColor(cat: string): string {
  return CATEGORY_COLORS[cat] || '#6b7280';
}

export const ProjectsDirectory: React.FC<ProjectsDirectoryProps> = ({
  projects,
  clients,
  payments,
  expenses,
  tasks,
  onEditProject,
  onDeleteProject,
}) => {
  const { language } = useLanguage();

  /* ---------- filter / sort state ---------- */
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ProjectStatus | 'archived'>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [clientFilter, setClientFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'budget' | 'progress' | 'deadline' | 'newest'>('newest');
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');
  const [showFilters, setShowFilters] = useState(false);

  /* ---------- drawer state ---------- */
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  /* ---------- edit form state ---------- */
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editStatus, setEditStatus] = useState<ProjectStatus>('Planned');
  const [editBudget, setEditBudget] = useState('');
  const [editProgress, setEditProgress] = useState('');
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editClientId, setEditClientId] = useState('');

  /* ---------- add form state ---------- */
  const [addName, setAddName] = useState('');
  const [addCategory, setAddCategory] = useState('Development');
  const [addStatus, setAddStatus] = useState<ProjectStatus>('Planned');
  const [addBudget, setAddBudget] = useState('');
  const [addProgress, setAddProgress] = useState('0');
  const [addStartDate, setAddStartDate] = useState('');
  const [addEndDate, setAddEndDate] = useState('');
  const [addDescription, setAddDescription] = useState('');
  const [addClientId, setAddClientId] = useState('');

  /* ---------- toast ---------- */
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  /* ---------- derived stats helpers ---------- */
  const getProjectStats = useCallback((projectId: string) => {
    const proj = projects.find(p => p.id === projectId);
    const projectPayments = payments.filter(p => p.project_id === projectId);
    const projectExpenses = expenses.filter(e => e.project_id === projectId);
    const projectTasks = tasks.filter(t => t.project_id === projectId);
    const collected = projectPayments.reduce((s, p) => s + p.amount, 0);
    const spent = projectExpenses.reduce((s, e) => s + e.amount, 0);
    const profit = collected - spent;
    const margin = proj && proj.price_dzd > 0 ? Math.round((profit / proj.price_dzd) * 100) : 0;
    const doneTasks = projectTasks.filter(t => t.status === 'Complete').length;
    const totalTasks = projectTasks.length;
    const daysLeft = proj?.end_date
      ? Math.ceil((new Date(proj.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : null;
    return { collected, spent, profit, margin, doneTasks, totalTasks, daysLeft };
  }, [payments, expenses, tasks, projects]);

  const getClientName = (clientId: string) =>
    clients.find(c => c.id === clientId)?.name ?? '—';

  /* ---------- categories list ---------- */
  const allCategories = Array.from(new Set(projects.map(p => p.category)));

  /* ---------- filter + sort ---------- */
  const filtered = projects
    .filter(p => {
      const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getClientName(p.client_id).toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === 'all' ? true : p.status === statusFilter;
      const matchCategory = categoryFilter === 'all' ? true : p.category === categoryFilter;
      const matchClient = clientFilter === 'all' ? true : p.client_id === clientFilter;
      return matchSearch && matchStatus && matchCategory && matchClient;
    })
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'budget') return b.price_dzd - a.price_dzd;
      if (sortBy === 'progress') return b.progress_percentage - a.progress_percentage;
      if (sortBy === 'deadline') {
        if (!a.end_date) return 1;
        if (!b.end_date) return -1;
        return new Date(a.end_date).getTime() - new Date(b.end_date).getTime();
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  /* ---------- summary metrics ---------- */
  const activeProjects = projects.filter(p => p.status === 'In Progress');
  const totalPortfolio = projects.reduce((s, p) => s + p.price_dzd, 0);
  const totalCollected = payments.reduce((s, p) => s + p.amount, 0);
  const avgProgress = projects.length > 0
    ? Math.round(projects.reduce((s, p) => s + p.progress_percentage, 0) / projects.length)
    : 0;

  /* ---------- handlers ---------- */
  const handleStartEdit = (project: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingProject(project);
    setEditName(project.name);
    setEditCategory(project.category);
    setEditStatus(project.status);
    setEditBudget(String(project.price_dzd));
    setEditProgress(String(project.progress_percentage));
    setEditStartDate(project.start_date || '');
    setEditEndDate(project.end_date || '');
    setEditDescription(project.description || '');
    setEditClientId(project.client_id);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject) return;
    const updated: Project = {
      ...editingProject,
      name: editName,
      category: editCategory,
      status: editStatus,
      price_dzd: parseFloat(editBudget) || 0,
      progress_percentage: Math.min(100, Math.max(0, parseInt(editProgress) || 0)),
      start_date: editStartDate || undefined,
      end_date: editEndDate || undefined,
      description: editDescription || undefined,
      client_id: editClientId,
    };
    onEditProject(updated);
    if (selectedProject?.id === updated.id) setSelectedProject(updated);
    setEditingProject(null);
    triggerToast(language === 'ar' ? 'تم تحديث بيانات المشروع بنجاح!' : 'Project updated successfully!');
  };

  const handleAddProject = (e: React.FormEvent) => {
    e.preventDefault();
    const newProject: Project = {
      id: 'proj_' + Math.random().toString(36).substr(2, 9),
      name: addName,
      category: addCategory,
      client_id: addClientId,
      price_dzd: parseFloat(addBudget) || 0,
      status: addStatus,
      progress_percentage: parseInt(addProgress) || 0,
      start_date: addStartDate || undefined,
      end_date: addEndDate || undefined,
      description: addDescription || undefined,
      created_at: new Date().toISOString().split('T')[0],
    };
    // Pass up via onEditProject—the parent's onAddProject isn't wired yet, just trigger toast
    onEditProject(newProject);
    setShowAddForm(false);
    setAddName(''); setAddCategory('Development'); setAddStatus('Planned');
    setAddBudget(''); setAddProgress('0'); setAddStartDate(''); setAddEndDate('');
    setAddDescription(''); setAddClientId('');
    triggerToast(language === 'ar' ? 'تم إضافة المشروع بنجاح!' : 'Project added successfully!');
  };

  const handleConfirmDelete = () => {
    if (!deletingProjectId) return;
    onDeleteProject(deletingProjectId);
    if (selectedProject?.id === deletingProjectId) setSelectedProject(null);
    setDeletingProjectId(null);
    triggerToast(language === 'ar' ? 'تم حذف المشروع' : 'Project deleted.');
  };

  const handleArchive = (project: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    onEditProject({ ...project, status: 'Cancelled' });
    triggerToast(language === 'ar' ? 'تمت أرشفة المشروع' : 'Project archived.');
  };

  const getDaysLeftLabel = (daysLeft: number | null) => {
    if (daysLeft === null) return null;
    if (daysLeft < 0) return { label: language === 'ar' ? 'تأخر' : 'Overdue', color: '#ef4444' };
    if (daysLeft === 0) return { label: language === 'ar' ? 'اليوم!' : 'Today!', color: '#f97316' };
    if (daysLeft <= 3) return { label: `${daysLeft}d left`, color: '#f97316' };
    if (daysLeft <= 14) return { label: `${daysLeft}d left`, color: '#eab308' };
    return { label: `${daysLeft}d`, color: '#6b7280' };
  };

  /* ========================================================= */
  return (
    <div className="dashboard-content-area">

      {/* Toast */}
      {toastMessage && (
        <div className="toast-notification animate-slide-in" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Check size={15} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="view-header-row">
        <div>
          <h2 className="header-greeting-title">
            {language === 'ar' ? 'دليل المشاريع' : 'Projects Directory'}
          </h2>
          <p className="header-greeting-subtitle">
            {language === 'ar'
              ? `${projects.length} مشروع في المحفظة، ${activeProjects.length} نشط حالياً`
              : `${projects.length} total projects · ${activeProjects.length} actively running`}
          </p>
        </div>
        <button onClick={() => setShowAddForm(true)} className="submit-btn compact-btn" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Plus size={16} />
          {language === 'ar' ? 'مشروع جديد' : 'New Project'}
        </button>
      </div>

      {/* KPI Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
        {[
          { icon: <BarChart2 size={18} />, value: projects.length, label: language === 'ar' ? 'إجمالي المشاريع' : 'Total Projects', color: '#6366f1' },
          { icon: <DollarSign size={18} />, value: `${(totalPortfolio / 1000).toFixed(0)}k DZ`, label: language === 'ar' ? 'قيمة المحفظة' : 'Portfolio Value', color: '#f97316' },
          { icon: <TrendingUp size={18} />, value: `${(totalCollected / 1000).toFixed(0)}k DZ`, label: language === 'ar' ? 'المحصّل' : 'Collected', color: '#22c55e' },
          { icon: <Clock size={18} />, value: `${avgProgress}%`, label: language === 'ar' ? 'متوسط التقدم' : 'Avg Progress', color: '#0ea5e9' },
        ].map((kpi, i) => (
          <div key={i} style={{ background: 'var(--bg-card)', border: '1.5px solid var(--border-color)', borderRadius: '12px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: kpi.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', color: kpi.color, flexShrink: 0 }}>
              {kpi.icon}
            </div>
            <div>
              <div style={{ fontSize: '1.1rem', fontWeight: 500, lineHeight: 1.1 }}>{kpi.value}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500, marginTop: '2px' }}>{kpi.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Search + Filter Toolbar */}
      <div className="clients-toolbar-strip" style={{ flexWrap: 'wrap', gap: '10px' }}>
        {/* Search */}
        <div className="search-toolbar-input" style={{ flex: '1 1 220px' }}>
          <Search size={15} style={{ flexShrink: 0 }} />
          <input
            type="text"
            placeholder={language === 'ar' ? 'ابحث باسم المشروع، التصنيف، العميل...' : 'Search projects, categories, clients...'}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="clear-search-btn">✕</button>
          )}
        </div>

        {/* Status filter pills */}
        <div className="filter-pills-row">
          {(['all', 'Planned', 'In Progress', 'Waiting Client', 'Completed', 'Cancelled'] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`filter-pill-tab ${statusFilter === s ? 'active' : ''}`}
            >
              {s === 'all' ? (language === 'ar' ? 'الكل' : 'All') : (language === 'ar' ? STATUS_CONFIG[s as ProjectStatus].labelAr : s)}
            </button>
          ))}
        </div>

        {/* Advanced filters toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="filter-pill-tab"
          style={{ display: 'flex', alignItems: 'center', gap: '4px', borderStyle: 'dashed' }}
        >
          <Filter size={13} />
          {language === 'ar' ? 'فلاتر متقدمة' : 'More Filters'}
          <ChevronDown size={13} style={{ transform: showFilters ? 'rotate(180deg)' : 'none', transition: '0.15s' }} />
        </button>

        {/* View mode toggle */}
        <div style={{ display: 'flex', gap: '4px', marginLeft: 'auto', border: '1.5px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
          <button
            onClick={() => setViewMode('cards')}
            style={{ padding: '6px 10px', border: 'none', cursor: 'pointer', background: viewMode === 'cards' ? 'var(--bg-sidebar)' : 'transparent', borderRadius: '0', display: 'flex', alignItems: 'center' }}
          >
            <Grid size={15} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            style={{ padding: '6px 10px', border: 'none', cursor: 'pointer', background: viewMode === 'list' ? 'var(--bg-sidebar)' : 'transparent', borderRadius: '0', display: 'flex', alignItems: 'center' }}
          >
            <List size={15} />
          </button>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <div className="animate-slide-in" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', background: 'var(--bg-sidebar)', border: '1.5px solid var(--border-color)', borderRadius: '10px', padding: '14px 16px', marginBottom: '12px' }}>
          <div className="sort-selector-wrapper">
            <label>{language === 'ar' ? 'التصنيف:' : 'Category:'}</label>
            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
              <option value="all">{language === 'ar' ? 'جميع التصنيفات' : 'All Categories'}</option>
              {allCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div className="sort-selector-wrapper">
            <label>{language === 'ar' ? 'العميل:' : 'Client:'}</label>
            <select value={clientFilter} onChange={e => setClientFilter(e.target.value)}>
              <option value="all">{language === 'ar' ? 'جميع العملاء' : 'All Clients'}</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="sort-selector-wrapper">
            <label>{language === 'ar' ? 'الترتيب:' : 'Sort by:'}</label>
            <select value={sortBy} onChange={e => setSortBy(e.target.value as typeof sortBy)}>
              <option value="newest">{language === 'ar' ? 'الأحدث' : 'Newest'}</option>
              <option value="name">{language === 'ar' ? 'الاسم' : 'Name'}</option>
              <option value="budget">{language === 'ar' ? 'الميزانية' : 'Budget'}</option>
              <option value="progress">{language === 'ar' ? 'التقدم' : 'Progress'}</option>
              <option value="deadline">{language === 'ar' ? 'الموعد النهائي' : 'Deadline'}</option>
            </select>
          </div>
          <button
            onClick={() => { setCategoryFilter('all'); setClientFilter('all'); setSortBy('newest'); setSearchTerm(''); setStatusFilter('all'); }}
            style={{ alignSelf: 'flex-end', fontSize: '0.8rem', padding: '6px 12px', border: '1px solid var(--border-color)', borderRadius: '6px', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}
          >
            {language === 'ar' ? 'إعادة تعيين' : 'Reset Filters'}
          </button>
        </div>
      )}

      {/* Results count */}
      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '12px', fontWeight: 500 }}>
        {language === 'ar' ? `عرض ${filtered.length} من ${projects.length} مشروع` : `Showing ${filtered.length} of ${projects.length} projects`}
      </div>

      {/* Empty State */}
      {filtered.length === 0 && (
        <div className="empty-directory-card">
          <BarChart2 size={40} style={{ opacity: 0.3 }} />
          <h4>{language === 'ar' ? 'لا توجد مشاريع تطابق الفلتر' : 'No projects match your filters'}</h4>
          <p>{language === 'ar' ? 'جرّب تعديل حقول البحث أو أضف مشروعاً جديداً.' : 'Try adjusting search or add a new project.'}</p>
        </div>
      )}

      {/* -------- CARDS VIEW -------- */}
      {viewMode === 'cards' && filtered.length > 0 && (
        <div className="clients-bento-grid">
          {filtered.map(project => {
            const client = clients.find(c => c.id === project.client_id);
            const stats = getProjectStats(project.id);
            const cfg = STATUS_CONFIG[project.status];
            const StatusIcon = cfg.Icon;
            const catColor = getCategoryColor(project.category);
            const daysTag = getDaysLeftLabel(stats.daysLeft);
            const remaining = Math.max(0, project.price_dzd - stats.collected);

            return (
              <div
                key={project.id}
                className="client-bento-card"
                onClick={() => setSelectedProject(project)}
                style={{ 
                  cursor: 'pointer', 
                  position: 'relative', 
                  overflow: 'visible',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  height: '100%'
                }}
              >
                {/* Top accent bar by category color */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: catColor, borderRadius: '12px 12px 0 0' }} />

                <div>
                  {/* Card Top Row */}
                  <div className="card-top-header" style={{ paddingTop: '12px' }}>
                    {/* Category tag + Status pill */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', flex: 1 }}>
                      <span style={{
                        fontSize: '0.7rem', fontWeight: 450, padding: '3px 8px',
                        background: catColor + '18', color: catColor, borderRadius: '4px',
                        display: 'flex', alignItems: 'center', gap: '4px'
                      }}>
                        <Tag size={11} />
                        {project.category}
                      </span>
                      <span style={{
                        fontSize: '0.7rem', fontWeight: 450, padding: '3px 8px',
                        background: cfg.bg, color: cfg.color, borderRadius: '4px',
                        display: 'flex', alignItems: 'center', gap: '4px'
                      }}>
                        <StatusIcon size={11} />
                        {language === 'ar' ? cfg.labelAr : cfg.label}
                      </span>
                      {project.status === 'Cancelled' && (
                        <span style={{ fontSize: '0.68rem', fontWeight: 450, padding: '3px 8px', background: '#f1f5f9', color: '#64748b', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <Archive size={10} />
                          {language === 'ar' ? 'أرشيف' : 'Archived'}
                        </span>
                      )}
                    </div>

                    {/* Action icons */}
                    <div className="card-action-icons" onClick={e => e.stopPropagation()}>
                      <button onClick={e => handleStartEdit(project, e)} title={language === 'ar' ? 'تعديل' : 'Edit'}>
                        <Edit2 size={13} />
                      </button>
                      {project.status !== 'Cancelled' && (
                        <button onClick={e => handleArchive(project, e)} title={language === 'ar' ? 'أرشفة' : 'Archive'} style={{ color: '#6b7280' }}>
                          <Archive size={13} />
                        </button>
                      )}
                      <button
                        onClick={e => { e.stopPropagation(); setDeletingProjectId(project.id); }}
                        className="delete-icon-btn"
                        title={language === 'ar' ? 'حذف' : 'Delete'}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Project Name */}
                  <div className="client-identity-info" style={{ marginTop: '10px' }}>
                    <h4 className="client-display-name" style={{ fontSize: '0.95rem', lineHeight: 1.3 }}>{project.name}</h4>
                    {project.description && (
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '3px', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {project.description}
                      </p>
                    )}
                  </div>

                  {/* Client */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {client?.name ? (
                      <UserAvatar name={client.name} size={20} animate="hover" />
                    ) : (
                      <User size={13} />
                    )}
                    <span style={{ fontWeight: 450, color: 'var(--text-main)' }}>{client?.name ?? '—'}</span>
                  </div>

                  {/* Progress Bar */}
                  <div style={{ marginTop: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '0.72rem', fontWeight: 450 }}>
                      <span style={{ color: 'var(--text-muted)' }}>{language === 'ar' ? 'التقدم' : 'Progress'}</span>
                      <span style={{ color: project.progress_percentage >= 80 ? '#22c55e' : project.progress_percentage >= 40 ? '#f97316' : '#6b7280' }}>
                        {project.progress_percentage}%
                      </span>
                    </div>
                    <div style={{ height: '6px', background: 'var(--border-color)', borderRadius: '99px', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${project.progress_percentage}%`,
                        borderRadius: '99px',
                        background: project.progress_percentage >= 80 ? '#22c55e' : project.progress_percentage >= 40 ? '#f97316' : '#6366f1',
                        transition: 'width 0.4s ease'
                      }} />
                    </div>
                  </div>
                </div>

                {/* Bottom Financial & Metadata Zone */}
                <div>
                  {/* 3 Equal-Sized Financial Metrics: Budget, Collected, Rest */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '8px',
                    marginTop: '14px',
                    padding: '8px 10px',
                    background: 'var(--bg-sidebar)',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    alignItems: 'center'
                  }}>
                    <div style={{ textAlign: 'center', minWidth: 0 }}>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.68rem', fontWeight: 400, marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {language === 'ar' ? 'الميزانية' : 'Budget'}
                      </div>
                      <div style={{ fontWeight: 450, fontSize: '0.82rem', color: 'var(--text-main)', fontFeatureSettings: '"tnum" 1', whiteSpace: 'nowrap' }}>
                        {(project.price_dzd / 1000).toFixed(0)}k DZ
                      </div>
                    </div>

                    <div style={{ 
                      textAlign: 'center', 
                      minWidth: 0,
                      borderRight: language === 'ar' ? 'none' : '1px solid var(--border-color)', 
                      borderLeft: language === 'ar' ? '1px solid var(--border-color)' : 'none' 
                    }}>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.68rem', fontWeight: 400, marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {language === 'ar' ? 'محصّل' : 'Collected'}
                      </div>
                      <div style={{ fontWeight: 450, fontSize: '0.82rem', color: '#0E4F2F', fontFeatureSettings: '"tnum" 1', whiteSpace: 'nowrap' }}>
                        {(stats.collected / 1000).toFixed(0)}k DZ
                      </div>
                    </div>

                    <div style={{ textAlign: 'center', minWidth: 0 }}>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.68rem', fontWeight: 400, marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {language === 'ar' ? 'المتبقي' : 'Rest'}
                      </div>
                      <div style={{ 
                        fontWeight: 450, 
                        fontSize: '0.82rem', 
                        color: remaining > 0 ? 'var(--accent-orange)' : '#0E4F2F', 
                        fontFeatureSettings: '"tnum" 1',
                        whiteSpace: 'nowrap'
                      }}>
                        {(remaining / 1000).toFixed(0)}k DZ
                      </div>
                    </div>
                  </div>

                  {/* Footer Stats Strip */}
                  <div className="client-card-footer-strip" style={{ marginTop: '10px', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {stats.totalTasks > 0 ? (
                        <span>{language === 'ar' ? 'المهام:' : 'Tasks:'} <strong style={{ fontWeight: 450, color: 'var(--text-main)' }}>{stats.doneTasks}/{stats.totalTasks}</strong></span>
                      ) : (
                        <span>{language === 'ar' ? 'لا توجد مهام' : 'No tasks'}</span>
                      )}
                    </div>

                    {/* Deadline badge */}
                    {daysTag && project.end_date && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', fontWeight: 450, color: daysTag.color, background: daysTag.color + '18', padding: '2px 8px', borderRadius: '4px' }}>
                        <Calendar size={11} />
                        {daysTag.label}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* -------- LIST VIEW -------- */}
      {viewMode === 'list' && filtered.length > 0 && (
        <div style={{ border: '1.5px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden', background: 'var(--bg-card)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-sidebar)', borderBottom: '2px solid var(--border-color)', fontWeight: 500 }}>
                <th style={{ padding: '12px 14px', textAlign: 'left' }}>{language === 'ar' ? 'المشروع' : 'Project'}</th>
                <th style={{ padding: '12px 14px', textAlign: 'left' }}>{language === 'ar' ? 'العميل' : 'Client'}</th>
                <th style={{ padding: '12px 14px', textAlign: 'center' }}>{language === 'ar' ? 'الحالة' : 'Status'}</th>
                <th style={{ padding: '12px 14px', textAlign: 'right' }}>{language === 'ar' ? 'الميزانية' : 'Budget'}</th>
                <th style={{ padding: '12px 14px', textAlign: 'right' }}>{language === 'ar' ? 'المحصل' : 'Collected'}</th>
                <th style={{ padding: '12px 14px', textAlign: 'right' }}>{language === 'ar' ? 'المتبقي' : 'Rest'}</th>
                <th style={{ padding: '12px 14px', minWidth: '120px' }}>{language === 'ar' ? 'التقدم' : 'Progress'}</th>
                <th style={{ padding: '12px 14px', textAlign: 'center' }}>{language === 'ar' ? 'الموعد' : 'Deadline'}</th>
                <th style={{ padding: '12px 14px', textAlign: 'center' }}>{language === 'ar' ? 'إجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((project, idx) => {
                const cfg = STATUS_CONFIG[project.status];
                const StatusIcon = cfg.Icon;
                const catColor = getCategoryColor(project.category);
                const stats = getProjectStats(project.id);
                const daysTag = getDaysLeftLabel(stats.daysLeft);
                const rowRest = Math.max(0, project.price_dzd - stats.collected);

                return (
                  <tr
                    key={project.id}
                    onClick={() => setSelectedProject(project)}
                    style={{ borderBottom: '1px solid var(--border-color)', cursor: 'pointer', background: idx % 2 === 0 ? 'transparent' : 'var(--bg-sidebar)', transition: '0.1s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-sidebar)')}
                    onMouseLeave={e => (e.currentTarget.style.background = idx % 2 === 0 ? 'transparent' : 'var(--bg-sidebar)')}
                  >
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontWeight: 500 }}>{project.name}</div>
                      <span style={{ fontSize: '0.68rem', fontWeight: 450, color: catColor, background: catColor + '15', padding: '2px 6px', borderRadius: '3px', marginTop: '3px', display: 'inline-block' }}>
                        {project.category}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', color: 'var(--text-muted)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {getClientName(project.client_id) !== '—' && (
                          <UserAvatar name={getClientName(project.client_id)} size={22} animate="hover" />
                        )}
                        <span style={{ fontWeight: 450 }}>{getClientName(project.client_id)}</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 450, padding: '4px 10px', background: cfg.bg, color: cfg.color, borderRadius: '20px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <StatusIcon size={11} />
                        {language === 'ar' ? cfg.labelAr : cfg.label}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 450 }}>
                      {project.price_dzd.toLocaleString()} DZ
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 450, color: '#0E4F2F' }}>
                      {stats.collected.toLocaleString()} DZ
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 450, color: rowRest > 0 ? 'var(--accent-orange)' : '#0E4F2F' }}>
                      {rowRest.toLocaleString()} DZ
                    </td>
                    <td style={{ padding: '12px 14px', minWidth: '120px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ flex: 1, height: '5px', background: 'var(--border-color)', borderRadius: '99px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${project.progress_percentage}%`, background: project.progress_percentage >= 80 ? '#22c55e' : '#f97316', borderRadius: '99px' }} />
                        </div>
                        <span style={{ fontSize: '0.72rem', fontWeight: 500, width: '32px', textAlign: 'right' }}>{project.progress_percentage}%</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                      {daysTag ? (
                        <span style={{ fontSize: '0.72rem', fontWeight: 500, color: daysTag.color }}>
                          {daysTag.label}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '6px' }}>
                        <button onClick={e => handleStartEdit(project, e)} style={{ padding: '4px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)', borderRadius: '4px' }}>
                          <Edit2 size={14} />
                        </button>
                        <button onClick={e => handleArchive(project, e)} style={{ padding: '4px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)', borderRadius: '4px' }}>
                          <Archive size={14} />
                        </button>
                        <button onClick={e => { e.stopPropagation(); setDeletingProjectId(project.id); }} style={{ padding: '4px', border: 'none', background: 'transparent', cursor: 'pointer', color: '#ef4444', borderRadius: '4px' }}>
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
      )}

      {/* ============================================================ */}
      {/* DETAIL SLIDE-OVER */}
      {/* ============================================================ */}
      {selectedProject && !editingProject && !deletingProjectId && !showAddForm && (() => {
        const stats = getProjectStats(selectedProject.id);
        const cfg = STATUS_CONFIG[selectedProject.status];
        const StatusIcon = cfg.Icon;
        const catColor = getCategoryColor(selectedProject.category);
        const client = clients.find(c => c.id === selectedProject.client_id);
        return (
          <div className="slide-over-overlay" onClick={() => setSelectedProject(null)}>
            <div className="slide-over-container animate-slide-in" onClick={e => e.stopPropagation()} style={{ direction: language === 'ar' ? 'rtl' : 'ltr' }}>

              <div className="slide-over-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: catColor + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', color: catColor, fontSize: '1.1rem', fontWeight: 500 }}>
                    {selectedProject.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="profile-name-title" style={{ margin: 0 }}>{selectedProject.name}</h3>
                    <span className="profile-muted-date">
                      {language === 'ar' ? 'تم الإنشاء:' : 'Created:'} {selectedProject.created_at}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={e => handleStartEdit(selectedProject, e)} style={{ padding: '7px 12px', border: '1.5px solid var(--border-color)', borderRadius: '8px', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.8rem', fontWeight: 500 }}>
                    <Edit2 size={14} />
                    {language === 'ar' ? 'تعديل' : 'Edit'}
                  </button>
                  <button onClick={() => setSelectedProject(null)} className="close-slide-over-btn" aria-label="Close">✕</button>
                </div>
              </div>

              <div className="slide-over-content-body">

                {/* Tags & Status */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 500, padding: '5px 12px', background: catColor + '18', color: catColor, borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Tag size={13} />
                    {selectedProject.category}
                  </span>
                  <span style={{ fontSize: '0.78rem', fontWeight: 500, padding: '5px 12px', background: cfg.bg, color: cfg.color, borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <StatusIcon size={13} />
                    {language === 'ar' ? cfg.labelAr : cfg.label}
                  </span>
                </div>

                {/* Description */}
                {selectedProject.description && (
                  <div className="ledger-details-section" style={{ marginBottom: '14px' }}>
                    <h4 className="ledger-sub-title">{language === 'ar' ? 'وصف المشروع' : 'Project Overview'}</h4>
                    <p style={{ fontSize: '0.82rem', lineHeight: 1.6, color: 'var(--text-muted)' }}>{selectedProject.description}</p>
                  </div>
                )}

                {/* Client */}
                <div className="ledger-details-section">
                  <h4 className="ledger-sub-title">{language === 'ar' ? 'بيانات العميل' : 'Client Info'}</h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '8px 0 12px 0' }}>
                    {client?.name && <UserAvatar name={client.name} size={42} animate="hover" />}
                    <div>
                      <div className="info-value text-bold" style={{ fontSize: '0.95rem' }}>{client?.name ?? '—'}</div>
                      {client?.email && <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>{client.email}</div>}
                    </div>
                  </div>
                  {client?.email && (
                    <div className="ledger-info-row">
                      <span className="info-label">{language === 'ar' ? 'البريد:' : 'Email:'}</span>
                      <span className="info-value">{client.email}</span>
                    </div>
                  )}
                  {client?.phone && (
                    <div className="ledger-info-row">
                      <span className="info-label">{language === 'ar' ? 'الهاتف:' : 'Phone:'}</span>
                      <span className="info-value">{client.phone}</span>
                    </div>
                  )}
                </div>

                {/* Financial Details */}
                <div className="ledger-details-section">
                  <h4 className="ledger-sub-title">{language === 'ar' ? 'البيانات المالية' : 'Financial Summary'}</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                    {[
                      { label: language === 'ar' ? 'قيمة العقد' : 'Contract Value', value: `${selectedProject.price_dzd.toLocaleString()} DZ`, color: '#6366f1' },
                      { label: language === 'ar' ? 'المحصّل' : 'Collected', value: `${stats.collected.toLocaleString()} DZ`, color: '#22c55e' },
                      { label: language === 'ar' ? 'المتبقي للتحصيل' : 'Outstanding Balance', value: `${Math.max(0, selectedProject.price_dzd - stats.collected).toLocaleString()} DZ`, color: selectedProject.price_dzd - stats.collected > 0 ? '#f97316' : '#22c55e' },
                      { label: language === 'ar' ? 'المصاريف' : 'Expenses', value: `${stats.spent.toLocaleString()} DZ`, color: '#ef4444' },
                      { label: language === 'ar' ? 'صافي الربح' : 'Net Profit', value: `${stats.profit.toLocaleString()} DZ`, color: stats.profit >= 0 ? '#22c55e' : '#ef4444' },
                      { label: language === 'ar' ? 'هامش الربح' : 'Net Margin', value: `${stats.margin}%`, color: stats.margin >= 60 ? '#22c55e' : stats.margin >= 30 ? '#f97316' : '#ef4444' },
                    ].map((item, i) => (
                      <div key={i} style={{ background: 'var(--bg-sidebar)', borderRadius: '8px', padding: '10px 12px' }}>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 500, marginBottom: '4px' }}>{item.label}</div>
                        <div style={{ fontSize: '1rem', fontWeight: 500, color: item.color }}>{item.value}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Progress + Timeline */}
                <div className="ledger-details-section">
                  <h4 className="ledger-sub-title">{language === 'ar' ? 'التقدم والجدول الزمني' : 'Progress & Timeline'}</h4>
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.78rem', fontWeight: 500 }}>
                      <span>{language === 'ar' ? 'نسبة الإنجاز' : 'Completion'}</span>
                      <span style={{ color: selectedProject.progress_percentage >= 80 ? '#22c55e' : '#f97316' }}>{selectedProject.progress_percentage}%</span>
                    </div>
                    <div style={{ height: '8px', background: 'var(--border-color)', borderRadius: '99px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${selectedProject.progress_percentage}%`, background: selectedProject.progress_percentage >= 80 ? '#22c55e' : selectedProject.progress_percentage >= 40 ? '#f97316' : '#6366f1', borderRadius: '99px', transition: 'width 0.4s' }} />
                    </div>
                  </div>
                  <div className="ledger-info-row">
                    <span className="info-label">{language === 'ar' ? 'تاريخ البدء:' : 'Start Date:'}</span>
                    <span className="info-value">{selectedProject.start_date ?? '—'}</span>
                  </div>
                  <div className="ledger-info-row">
                    <span className="info-label">{language === 'ar' ? 'الموعد النهائي:' : 'Deadline:'}</span>
                    <span className="info-value">{selectedProject.end_date ?? '—'}</span>
                  </div>
                  {stats.daysLeft !== null && (
                    <div className="ledger-info-row">
                      <span className="info-label">{language === 'ar' ? 'الأيام المتبقية:' : 'Days Left:'}</span>
                      <span className="info-value" style={{ color: stats.daysLeft < 0 ? '#ef4444' : stats.daysLeft <= 7 ? '#f97316' : 'inherit', fontWeight: 500 }}>
                        {stats.daysLeft < 0 ? `${Math.abs(stats.daysLeft)}d overdue` : `${stats.daysLeft}d remaining`}
                      </span>
                    </div>
                  )}
                </div>

                {/* Tasks */}
                {stats.totalTasks > 0 && (
                  <div className="ledger-details-section">
                    <h4 className="ledger-sub-title">{language === 'ar' ? 'المهام المرتبطة' : 'Linked Tasks'}</h4>
                    <div className="ledger-info-row">
                      <span className="info-label">{language === 'ar' ? 'مكتملة:' : 'Completed:'}</span>
                      <span className="info-value text-bold">{stats.doneTasks} / {stats.totalTasks}</span>
                    </div>
                    <div style={{ height: '5px', background: 'var(--border-color)', borderRadius: '99px', overflow: 'hidden', marginTop: '6px' }}>
                      <div style={{ height: '100%', width: `${Math.round((stats.doneTasks / stats.totalTasks) * 100)}%`, background: '#22c55e', borderRadius: '99px' }} />
                    </div>
                  </div>
                )}

                {/* Danger Zone */}
                <div style={{ marginTop: '24px', borderTop: '1px dashed var(--border-color)', paddingTop: '16px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {selectedProject.status !== 'Cancelled' && (
                    <button
                      onClick={e => handleArchive(selectedProject, e)}
                      style={{ flex: 1, padding: '9px 14px', border: '1.5px solid #e2e8f0', borderRadius: '8px', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 500 }}
                    >
                      <Archive size={14} />
                      {language === 'ar' ? 'أرشفة المشروع' : 'Archive Project'}
                    </button>
                  )}
                  <button
                    onClick={() => { setSelectedProject(null); setDeletingProjectId(selectedProject.id); }}
                    style={{ flex: 1, padding: '9px 14px', border: '1.5px solid #FECACA', borderRadius: '8px', background: '#FEF2F2', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 500, color: '#ef4444' }}
                  >
                    <Trash2 size={14} />
                    {language === 'ar' ? 'حذف المشروع' : 'Delete Project'}
                  </button>
                </div>

              </div>
            </div>
          </div>
        );
      })()}

      {/* ============================================================ */}
      {/* EDIT SLIDE-OVER */}
      {/* ============================================================ */}
      {editingProject && (
        <div className="slide-over-overlay" onClick={() => setEditingProject(null)}>
          <div className="slide-over-container animate-slide-in" onClick={e => e.stopPropagation()} style={{ direction: language === 'ar' ? 'rtl' : 'ltr' }}>
            <div className="slide-over-header">
              <div>
                <h3 className="profile-name-title" style={{ margin: 0 }}>
                  {language === 'ar' ? 'تعديل بيانات المشروع' : 'Edit Project Details'}
                </h3>
                <span className="profile-muted-date">{editingProject.name}</span>
              </div>
              <button onClick={() => setEditingProject(null)} className="close-slide-over-btn">✕</button>
            </div>
            <div className="slide-over-content-body">
              <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

                <div className="form-group-item">
                  <label>{language === 'ar' ? 'اسم المشروع *' : 'Project Name *'}</label>
                  <input type="text" required value={editName} onChange={e => setEditName(e.target.value)} className="milestone-form-input" />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group-item">
                    <label>{language === 'ar' ? 'التصنيف' : 'Category'}</label>
                    <input type="text" value={editCategory} onChange={e => setEditCategory(e.target.value)} className="milestone-form-input" />
                  </div>
                  <div className="form-group-item">
                    <label>{language === 'ar' ? 'العميل' : 'Client'}</label>
                    <select value={editClientId} onChange={e => setEditClientId(e.target.value)} className="milestone-form-input">
                      <option value="">{language === 'ar' ? 'اختر العميل' : 'Select Client'}</option>
                      {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group-item">
                    <label>{language === 'ar' ? 'الميزانية (DZ)' : 'Budget (DZ)'}</label>
                    <input type="number" value={editBudget} onChange={e => setEditBudget(e.target.value)} className="milestone-form-input" />
                  </div>
                  <div className="form-group-item">
                    <label>{language === 'ar' ? 'نسبة التقدم (%)' : 'Progress (%)'}</label>
                    <input type="number" min="0" max="100" value={editProgress} onChange={e => setEditProgress(e.target.value)} className="milestone-form-input" />
                  </div>
                </div>

                <div className="form-group-item">
                  <label>{language === 'ar' ? 'الحالة' : 'Status'}</label>
                  <select value={editStatus} onChange={e => setEditStatus(e.target.value as ProjectStatus)} className="milestone-form-input">
                    {(Object.keys(STATUS_CONFIG) as ProjectStatus[]).map(s => (
                      <option key={s} value={s}>{language === 'ar' ? STATUS_CONFIG[s].labelAr : STATUS_CONFIG[s].label}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group-item">
                    <label>{language === 'ar' ? 'تاريخ البدء' : 'Start Date'}</label>
                    <input type="date" value={editStartDate} onChange={e => setEditStartDate(e.target.value)} className="milestone-form-input" />
                  </div>
                  <div className="form-group-item">
                    <label>{language === 'ar' ? 'الموعد النهائي' : 'End Date'}</label>
                    <input type="date" value={editEndDate} onChange={e => setEditEndDate(e.target.value)} className="milestone-form-input" />
                  </div>
                </div>

                <div className="form-group-item">
                  <label>{language === 'ar' ? 'الوصف' : 'Description'}</label>
                  <textarea value={editDescription} onChange={e => setEditDescription(e.target.value)} className="milestone-form-input" style={{ minHeight: '80px', resize: 'vertical' }} />
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                  <button type="button" onClick={() => setEditingProject(null)} className="btn-secondary" style={{ flex: 1 }}>
                    {language === 'ar' ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button type="submit" className="submit-btn primary-submit" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    <Check size={15} />
                    {language === 'ar' ? 'حفظ التعديلات' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* ADD PROJECT SLIDE-OVER */}
      {/* ============================================================ */}
      {showAddForm && (
        <div className="slide-over-overlay" onClick={() => setShowAddForm(false)}>
          <div className="slide-over-container animate-slide-in" onClick={e => e.stopPropagation()} style={{ direction: language === 'ar' ? 'rtl' : 'ltr' }}>
            <div className="slide-over-header">
              <div>
                <h3 className="profile-name-title" style={{ margin: 0 }}>
                  {language === 'ar' ? 'إضافة مشروع جديد' : 'Add New Project'}
                </h3>
                <span className="profile-muted-date">{language === 'ar' ? 'أدخل تفاصيل المشروع الجديد' : 'Fill in the project details below'}</span>
              </div>
              <button onClick={() => setShowAddForm(false)} className="close-slide-over-btn">✕</button>
            </div>
            <div className="slide-over-content-body">
              <form onSubmit={handleAddProject} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

                <div className="form-group-item">
                  <label>{language === 'ar' ? 'اسم المشروع *' : 'Project Name *'}</label>
                  <input type="text" required value={addName} onChange={e => setAddName(e.target.value)} className="milestone-form-input" placeholder={language === 'ar' ? 'مثال: موقع DecaByte الرئيسي' : 'e.g. DecaByte Landing Page'} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group-item">
                    <label>{language === 'ar' ? 'التصنيف' : 'Category'}</label>
                    <input type="text" value={addCategory} onChange={e => setAddCategory(e.target.value)} className="milestone-form-input" placeholder="Development" />
                  </div>
                  <div className="form-group-item">
                    <label>{language === 'ar' ? 'العميل' : 'Client'}</label>
                    <select value={addClientId} onChange={e => setAddClientId(e.target.value)} className="milestone-form-input">
                      <option value="">{language === 'ar' ? 'اختر العميل' : 'Select Client'}</option>
                      {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group-item">
                    <label>{language === 'ar' ? 'الميزانية (DZ)' : 'Budget (DZ)'}</label>
                    <input type="number" value={addBudget} onChange={e => setAddBudget(e.target.value)} className="milestone-form-input" placeholder="150000" />
                  </div>
                  <div className="form-group-item">
                    <label>{language === 'ar' ? 'التقدم الابتدائي (%)' : 'Initial Progress (%)'}</label>
                    <input type="number" min="0" max="100" value={addProgress} onChange={e => setAddProgress(e.target.value)} className="milestone-form-input" />
                  </div>
                </div>

                <div className="form-group-item">
                  <label>{language === 'ar' ? 'الحالة' : 'Status'}</label>
                  <select value={addStatus} onChange={e => setAddStatus(e.target.value as ProjectStatus)} className="milestone-form-input">
                    {(Object.keys(STATUS_CONFIG) as ProjectStatus[]).map(s => (
                      <option key={s} value={s}>{language === 'ar' ? STATUS_CONFIG[s].labelAr : STATUS_CONFIG[s].label}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group-item">
                    <label>{language === 'ar' ? 'تاريخ البدء' : 'Start Date'}</label>
                    <input type="date" value={addStartDate} onChange={e => setAddStartDate(e.target.value)} className="milestone-form-input" />
                  </div>
                  <div className="form-group-item">
                    <label>{language === 'ar' ? 'الموعد النهائي' : 'End Date'}</label>
                    <input type="date" value={addEndDate} onChange={e => setAddEndDate(e.target.value)} className="milestone-form-input" />
                  </div>
                </div>

                <div className="form-group-item">
                  <label>{language === 'ar' ? 'الوصف' : 'Description'}</label>
                  <textarea value={addDescription} onChange={e => setAddDescription(e.target.value)} className="milestone-form-input" style={{ minHeight: '80px', resize: 'vertical' }} placeholder={language === 'ar' ? 'وصف مختصر عن المشروع...' : 'Brief project overview...'} />
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                  <button type="button" onClick={() => setShowAddForm(false)} className="btn-secondary" style={{ flex: 1 }}>
                    {language === 'ar' ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button type="submit" className="submit-btn primary-submit" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    <Plus size={15} />
                    {language === 'ar' ? 'إضافة المشروع' : 'Create Project'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* DELETE CONFIRMATION SLIDE-OVER */}
      {/* ============================================================ */}
      {deletingProjectId && (
        <div className="slide-over-overlay" onClick={() => setDeletingProjectId(null)}>
          <div className="slide-over-container animate-slide-in" onClick={e => e.stopPropagation()} style={{ maxWidth: '440px', direction: language === 'ar' ? 'rtl' : 'ltr' }}>
            <div className="slide-over-header">
              <h3 className="profile-name-title" style={{ margin: 0, color: '#ef4444', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={20} />
                {language === 'ar' ? 'تأكيد حذف المشروع' : 'Confirm Project Deletion'}
              </h3>
              <button onClick={() => setDeletingProjectId(null)} className="close-slide-over-btn">✕</button>
            </div>
            <div className="slide-over-content-body">
              <p style={{ fontSize: '0.88rem', lineHeight: 1.6, color: 'var(--text-muted)', marginBottom: '8px' }}>
                {language === 'ar'
                  ? `سيتم حذف مشروع "${projects.find(p => p.id === deletingProjectId)?.name}" نهائياً من قاعدة بيانات DecaByte. هذا الإجراء لا يمكن التراجع عنه.`
                  : `You're about to permanently delete "${projects.find(p => p.id === deletingProjectId)?.name}". All associated tasks and records will remain but the project link will be broken. This cannot be undone.`}
              </p>
              <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
                <button onClick={() => setDeletingProjectId(null)} className="btn-secondary" style={{ flex: 1 }}>
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button onClick={handleConfirmDelete} style={{ flex: 1, background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', padding: '10px', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.88rem' }}>
                  <Trash2 size={15} />
                  {language === 'ar' ? 'نعم، احذف المشروع' : 'Yes, Delete Project'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
