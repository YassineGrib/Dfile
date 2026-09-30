import React, { useState, useMemo } from 'react';
import { useLanguage } from './LanguageContext';
import type { Project, Client, Milestone, Task } from '../types';
import { 
  Trash2, 
  Calendar as CalendarIcon, 
  Clock, 
  Flag, 
  Sparkles, 
  CheckCircle2, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight, 
  Layers
} from 'lucide-react';

interface CalendarViewProps {
  projects: Project[];
  clients: Client[];
  tasks?: Task[];
  milestones?: Milestone[];
  onAddMilestone?: (milestone: Milestone) => void;
  onToggleMilestone?: (id: string, completed: boolean) => void;
  onDeleteMilestone?: (id: string) => void;
}

// Curated distinctive palettes for Gantt chart rows
const GANTT_PALETTES = [
  { name: 'blue', bg: '#EFF6FF', border: '#BFDBFE', text: '#1E40AF', bar: '#3B82F6', badge: '#DBEAFE' },
  { name: 'emerald', bg: '#ECFDF5', border: '#A7F3D0', text: '#065F46', bar: '#10B981', badge: '#D1FAE5' },
  { name: 'purple', bg: '#F5F3FF', border: '#DDD6FE', text: '#5B21B6', bar: '#8B5CF6', badge: '#EDE9FE' },
  { name: 'orange', bg: '#FFF7ED', border: '#FED7AA', text: '#9A3412', bar: '#F97316', badge: '#FFEDD5' },
  { name: 'teal', bg: '#F0FDFA', border: '#99F6E4', text: '#115E59', bar: '#14B8A6', badge: '#CCFBF1' },
  { name: 'indigo', bg: '#EEF2FF', border: '#C7D2FE', text: '#3730A3', bar: '#6366F1', badge: '#E0E7FF' },
  { name: 'amber', bg: '#FFFBEB', border: '#FDE68A', text: '#92400E', bar: '#F59E0B', badge: '#FEF3C7' },
  { name: 'rose', bg: '#FFF1F2', border: '#FECDD3', text: '#9F1239', bar: '#F43F5E', badge: '#FFE4E6' },
];

export const CalendarView: React.FC<CalendarViewProps> = ({
  projects,
  clients,
  tasks: _tasks = [],
  milestones: externalMilestones,
  onAddMilestone,
  onToggleMilestone,
  onDeleteMilestone,
}) => {
  const { language } = useLanguage();

  // Current real-world reference date
  const today = useMemo(() => new Date(), []);

  // Calendar sub-view mode ('month' | 'gantt')
  const [calendarViewMode, setCalendarViewMode] = useState<'month' | 'gantt'>('month');

  // Sidebar panel visibility (hidden by default)
  const [showSidebar, setShowSidebar] = useState(false);

  // Mizaman (Sync) states
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('Never');

  // Real milestones from Firestore / props
  const [localMilestones, setLocalMilestones] = useState<Milestone[]>([]);
  const milestones = externalMilestones ?? localMilestones;

  // Milestone creation form states
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');
  const [newMilestoneDate, setNewMilestoneDate] = useState('');
  const [newMilestoneProjId, setNewMilestoneProjId] = useState('');

  // Handle simulated deadline/calendar sync
  const handleSyncCalendar = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      const now = new Date();
      setLastSyncTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1200);
  };

  // Add a new milestone deadline
  const handleAddMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMilestoneTitle.trim() || !newMilestoneDate || !newMilestoneProjId) return;

    const newM: Milestone = {
      id: `m-${Date.now()}`,
      project_id: newMilestoneProjId,
      title: newMilestoneTitle.trim(),
      date: newMilestoneDate,
      completed: false,
      created_at: new Date().toISOString()
    };

    if (onAddMilestone) {
      onAddMilestone(newM);
    } else {
      setLocalMilestones(prev => [...prev, newM]);
    }
    setNewMilestoneTitle('');
    setNewMilestoneDate('');
    setNewMilestoneProjId('');
  };

  // Toggle milestone completion
  const handleToggleMilestone = (id: string) => {
    const target = milestones.find(m => m.id === id);
    if (!target) return;
    if (onToggleMilestone) {
      onToggleMilestone(id, !target.completed);
    } else {
      setLocalMilestones(milestones.map(m => m.id === id ? { ...m, completed: !m.completed } : m));
    }
  };

  // --- Dynamic Month Range Calculations (Encompassing Today + All Projects) ---
  const spannedMonths = useMemo(() => {
    const dates = projects.flatMap(p => [
      p.start_date ? new Date(p.start_date) : null,
      p.end_date ? new Date(p.end_date) : null
    ]).filter((d): d is Date => d !== null && !isNaN(d.getTime()));

    // For Monthly Grid: encompass 2 months before today and 3 months ahead (or active project dates)
    const minD = new Date(today.getFullYear(), today.getMonth() - 2, 1);
    const maxD = new Date(today.getFullYear(), today.getMonth() + 3, 1);

    if (dates.length > 0) {
      const minProject = new Date(Math.min(...dates.map(d => d.getTime())));
      const maxProject = new Date(Math.max(...dates.map(d => d.getTime())));
      if (minProject < minD) minD.setFullYear(minProject.getFullYear(), minProject.getMonth(), 1);
      if (maxProject > maxD) maxD.setFullYear(maxProject.getFullYear(), maxProject.getMonth(), 1);
    }

    const list: Array<{ year: number; month: number; label: string; labelAr: string }> = [];
    const current = new Date(minD.getFullYear(), minD.getMonth(), 1);
    const end = new Date(maxD.getFullYear(), maxD.getMonth(), 1);

    const monthNamesEn = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const monthNamesAr = ['جانفي', 'فيفري', 'مارس', 'أفريل', 'ماي', 'جوان', 'جويلية', 'أوت', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

    while (current <= end) {
      const y = current.getFullYear();
      const m = current.getMonth();
      list.push({
        year: y,
        month: m,
        label: `${monthNamesEn[m]} ${y}`,
        labelAr: `${monthNamesAr[m]} ${y}`
      });
      if (list.length > 36) break;
      current.setMonth(current.getMonth() + 1);
    }
    return list;
  }, [projects, today]);

  // Determine the default month index matching TODAY
  const defaultCurrentMonthIndex = useMemo(() => {
    const idx = spannedMonths.findIndex(
      m => m.year === today.getFullYear() && m.month === today.getMonth()
    );
    return idx >= 0 ? idx : 0;
  }, [spannedMonths, today]);

  // Selected month index state (defaults to today's month, can be changed by user)
  const [selectedMonthIndex, setSelectedMonthIndex] = useState<number | null>(null);
  const activeMonthIndex = selectedMonthIndex ?? defaultCurrentMonthIndex;
  const clampedMonthIndex = Math.max(0, Math.min(spannedMonths.length - 1, activeMonthIndex));
  const activeMonth = spannedMonths[clampedMonthIndex] || spannedMonths[0];

  // --- Gantt Chart Focused Planning Range ("En cours" Only by Default) ---
  const [showAllInGantt, setShowAllInGantt] = useState(false);

  // Active / Ongoing projects for Gantt timeline
  const ganttProjects = useMemo(() => {
    if (showAllInGantt) return projects;
    return projects.filter(p => 
      p.status !== 'Completed' && 
      p.status !== 'Delivered' && 
      p.status !== 'Cancelled'
    );
  }, [projects, showAllInGantt]);

  // Gantt months strictly between earliest active project and latest active project (+ today)
  const ganttMonths = useMemo(() => {
    const dates: Date[] = [];

    ganttProjects.forEach(p => {
      if (p.start_date) {
        const d = new Date(p.start_date);
        if (!isNaN(d.getTime())) dates.push(d);
      }
      if (p.end_date) {
        const d = new Date(p.end_date);
        if (!isNaN(d.getTime())) dates.push(d);
      }
    });

    // Always include current real date so "Today" is within the range
    dates.push(today);

    const minTime = Math.min(...dates.map(d => d.getTime()));
    const maxTime = Math.max(...dates.map(d => d.getTime()));

    const minD = new Date(minTime);
    const maxD = new Date(maxTime);

    const current = new Date(minD.getFullYear(), minD.getMonth(), 1);
    const end = new Date(maxD.getFullYear(), maxD.getMonth(), 1);

    const list: Array<{ year: number; month: number; label: string; labelAr: string }> = [];
    const monthNamesEn = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const monthNamesAr = ['جانفي', 'فيفري', 'مارس', 'أفريل', 'ماي', 'جوان', 'جويلية', 'أوت', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

    while (current <= end) {
      const y = current.getFullYear();
      const m = current.getMonth();
      list.push({
        year: y,
        month: m,
        label: `${monthNamesEn[m]} ${y}`,
        labelAr: `${monthNamesAr[m]} ${y}`
      });
      if (list.length > 24) break;
      current.setMonth(current.getMonth() + 1);
    }

    return list;
  }, [ganttProjects, today]);

  // Min and Max dates for Gantt timeline
  const ganttTimelineMinDate = useMemo(() => {
    if (ganttMonths.length === 0) return new Date(today.getFullYear(), today.getMonth(), 1);
    const first = ganttMonths[0];
    return new Date(first.year, first.month, 1, 0, 0, 0);
  }, [ganttMonths, today]);

  const ganttTimelineMaxDate = useMemo(() => {
    if (ganttMonths.length === 0) return new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);
    const last = ganttMonths[ganttMonths.length - 1];
    return new Date(last.year, last.month + 1, 0, 23, 59, 59);
  }, [ganttMonths, today]);

  // Gantt chart horizontal position calculator
  const getTimelinePosition = (startDateStr?: string, endDateStr?: string) => {
    const minTime = ganttTimelineMinDate.getTime();
    const maxTime = ganttTimelineMaxDate.getTime();
    const totalDuration = maxTime - minTime || 1;

    let start = startDateStr ? new Date(startDateStr).getTime() : minTime;
    let end = endDateStr 
      ? new Date(endDateStr).getTime() 
      : (startDateStr ? new Date(startDateStr).getTime() + 21 * 86400000 : maxTime);

    if (isNaN(start)) start = minTime;
    if (isNaN(end)) end = maxTime;
    if (end < start) end = start + 86400000;

    const clampStart = Math.max(minTime, Math.min(maxTime, start));
    const clampEnd = Math.max(clampStart, Math.min(maxTime, end));

    const leftPercent = ((clampStart - minTime) / totalDuration) * 100;
    const rawWidthPercent = ((clampEnd - clampStart) / totalDuration) * 100;
    const widthPercent = Math.max(10, Math.min(100 - leftPercent, rawWidthPercent));

    return { 
      left: `${Math.max(0, Math.min(100 - widthPercent, leftPercent))}%`, 
      width: `${widthPercent}%` 
    };
  };

  // --- Real-World Workload & Capacity Logic (Remaining Effort Calculation) ---
  // Workload is driven by REMAINING effort across active projects (100% - progress)
  const activeContracts = projects.filter(p => p.status === 'In Progress' || p.status === 'Waiting Client');

  const totalRemainingUnits = useMemo(() => {
    return activeContracts.reduce((sum, p) => {
      const isFinished = p.status === 'Completed' || p.status === 'Delivered';
      const progress = isFinished ? 100 : Math.min(100, Math.max(0, p.progress_percentage || 0));
      const remainingEffort = (100 - progress) / 100; // e.g. 1% prog -> 0.99 unit; 99% prog -> 0.01 unit
      return sum + remainingEffort;
    }, 0);
  }, [activeContracts]);

  // Baseline concurrency capacity: 3 full projects at 100% remaining effort
  const targetCapacityUnits = 3.0;
  const currentWorkloadPercentage = Math.min(100, Math.round((totalRemainingUnits / targetCapacityUnits) * 100));

  const avgActiveProgress = activeContracts.length > 0
    ? Math.round(activeContracts.reduce((s, p) => s + (p.progress_percentage || 0), 0) / activeContracts.length)
    : 0;

  // Predict availability and next freeing contract
  const sortedActiveByDeadline = useMemo(() => {
    return [...activeContracts]
      .filter(p => p.end_date)
      .sort((a, b) => new Date(a.end_date!).getTime() - new Date(b.end_date!).getTime());
  }, [activeContracts]);

  let nextAvailableDateAr = language === 'ar' ? 'متاح الآن لاستقبال مشاريع' : 'Available Now for Projects';
  let nextProjectFreeingUp = '';

  if (sortedActiveByDeadline.length > 0 && currentWorkloadPercentage >= 70) {
    const earliest = sortedActiveByDeadline[0];
    const dateObj = new Date(earliest.end_date!);
    nextAvailableDateAr = dateObj.toLocaleDateString(language === 'ar' ? 'ar-DZ' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    nextProjectFreeingUp = earliest.name;
  }

  // Workload status presentation
  const workloadStatusTitle = currentWorkloadPercentage >= 75
    ? (language === 'ar' ? 'حالة العمل: ضغط مرتفع (القدرة الاستيعابية مشغولة)' : 'Workspace: High Workload (Near Full Capacity)')
    : currentWorkloadPercentage >= 35
      ? (language === 'ar' ? 'حالة العمل: ضغط معتدل (قبول مشاريع مختارة)' : 'Workspace: Moderate Workload (Selective)')
      : (language === 'ar' ? 'حالة العمل: متاح وجاهز لمشاريع جديدة' : 'Workspace: Open & Ready for New Projects');

  const workloadStatusClass = currentWorkloadPercentage >= 75 ? 'busy' : currentWorkloadPercentage >= 35 ? 'moderate' : 'free';

  const workloadSubtitle = language === 'ar'
    ? `المشاريع الجارية: ${activeContracts.length} | متوسط الإنجاز: ${avgActiveProgress}% | الجهد المتبقي المطلوب: ${totalRemainingUnits.toFixed(1)} مشروع كامل`
    : `${activeContracts.length} active projects · ${avgActiveProgress}% avg progress · ${totalRemainingUnits.toFixed(1)} full project units remaining`;

  return (
    <div className="dashboard-content-area animate-fade-in">
      
      {/* 1. Page Header */}
      <div className="workspace-header-strip">
        <div className="project-breadcrumb">
          <span>{language === 'ar' ? 'التقويم' : 'Calendar'}</span>
          <span className="breadcrumb-divider">/</span>
          <span className="text-bold">{language === 'ar' ? 'المواعيد والمراحل الهامة' : 'Deadlines & Planner'}</span>
        </div>
      </div>

      {/* 2. Main 2-Column Suite Layout */}
      <div className="calendar-two-col-layout" style={{ marginTop: '20px' }}>
        
        {/* Left Column: Calendar Grid / Gantt Chart (70%) */}
        <div className="calendar-left-section">
          
          <div className="calendar-header-timeline-row">
            <div>
              <h3 className="calendar-date-header" style={{ fontSize: '1.25rem', fontWeight: 600 }}>
                {language === 'ar' ? 'مخطط وجدول المواعيد الذكي' : 'Smart Deadlines & Planner'}
              </h3>
              <p className="availability-subtitle" style={{ fontSize: '0.82rem', color: 'var(--text-placeholder)', margin: '4px 0 0 0' }}>
                {language === 'ar'
                  ? 'رصد تواريخ تسليم العقود، بدايات المشاريع، والمهام المطلوبة بدقة'
                  : 'Monitor contract delivery deadlines, starting dates, and custom milestones.'
                }
              </p>
            </div>
            
            {/* View Mode Selector Pill & Sidebar Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <div className="calendar-view-type-tabs">
                <button 
                  onClick={() => setCalendarViewMode('month')}
                  className={`view-type-tab-pill ${calendarViewMode === 'month' ? 'active' : ''}`}
                >
                  <CalendarIcon size={14} style={{ display: 'inline', marginInlineEnd: '6px' }} />
                  {language === 'ar' ? 'تقويم شهري' : 'Monthly Grid'}
                </button>
                <button 
                  onClick={() => setCalendarViewMode('gantt')}
                  className={`view-type-tab-pill ${calendarViewMode === 'gantt' ? 'active' : ''}`}
                >
                  <Layers size={14} style={{ display: 'inline', marginInlineEnd: '6px' }} />
                  {language === 'ar' ? 'مخطط Gantt' : 'Gantt Chart'}
                </button>
              </div>

              {/* Sidebar Panel Toggle Button (Hidden by default) */}
              <button
                type="button"
                onClick={() => setShowSidebar(prev => !prev)}
                className={`calendar-panel-toggle-btn ${showSidebar ? 'active' : ''}`}
                title={showSidebar 
                  ? (language === 'ar' ? 'إخفاء لوحة المراحل والمزامنة' : 'Hide Milestones & Sync Panel') 
                  : (language === 'ar' ? 'إظهار لوحة المراحل والمزامنة' : 'Show Milestones & Sync Panel')}
              >
                <Flag size={13} />
                <span>
                  {showSidebar
                    ? (language === 'ar' ? 'إخفاء المراحل والمزامنة' : 'Hide Panel')
                    : (language === 'ar' ? 'المراحل والمزامنة' : 'Milestones & Sync')
                  }
                </span>
                {milestones.filter(m => !m.completed).length > 0 && (
                  <span className="panel-toggle-counter">
                    {milestones.filter(m => !m.completed).length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {calendarViewMode === 'month' ? (
            /* Dynamic Monthly Grid Calendar */
            <div className="month-grid-wrapper">
              <div className="month-grid-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className="month-grid-title">
                    {language === 'ar' ? activeMonth.labelAr : activeMonth.label}
                  </span>
                  {activeMonth.year === today.getFullYear() && activeMonth.month === today.getMonth() && (
                    <span className="current-month-badge">
                      {language === 'ar' ? 'الشهر الحالي' : 'Current Month'}
                    </span>
                  )}
                </div>
                
                {/* Month Navigation Controls */}
                <div className="month-pagination-controls" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button 
                    onClick={() => setSelectedMonthIndex(Math.max(0, clampedMonthIndex - 1))}
                    disabled={clampedMonthIndex === 0}
                    className="month-pager-btn"
                    title={language === 'ar' ? 'الشهر السابق' : 'Previous Month'}
                  >
                    <ChevronLeft size={14} />
                  </button>
                  
                  <select 
                    value={clampedMonthIndex} 
                    onChange={(e) => setSelectedMonthIndex(parseInt(e.target.value))}
                    className="month-picker-select"
                  >
                    {spannedMonths.map((m, idx) => (
                      <option key={idx} value={idx}>
                        {language === 'ar' ? m.labelAr : m.label}
                      </option>
                    ))}
                  </select>

                  <button 
                    onClick={() => setSelectedMonthIndex(Math.min(spannedMonths.length - 1, clampedMonthIndex + 1))}
                    disabled={clampedMonthIndex === spannedMonths.length - 1}
                    className="month-pager-btn"
                    title={language === 'ar' ? 'الشهر التالي' : 'Next Month'}
                  >
                    <ChevronRight size={14} />
                  </button>

                  <button
                    onClick={() => setSelectedMonthIndex(defaultCurrentMonthIndex)}
                    className="btn-today-shortcut"
                    title={language === 'ar' ? 'الرجوع لليوم' : 'Jump to Today'}
                  >
                    {language === 'ar' ? 'اليوم' : 'Today'}
                  </button>
                </div>
              </div>

              {/* Day names header */}
              <div className="month-days-names-row">
                <span>{language === 'ar' ? 'الأحد' : 'Sun'}</span>
                <span>{language === 'ar' ? 'الإثنين' : 'Mon'}</span>
                <span>{language === 'ar' ? 'الثلاثاء' : 'Tue'}</span>
                <span>{language === 'ar' ? 'الأربعاء' : 'Wed'}</span>
                <span>{language === 'ar' ? 'الخميس' : 'Thu'}</span>
                <span>{language === 'ar' ? 'الجمعة' : 'Fri'}</span>
                <span>{language === 'ar' ? 'السبت' : 'Sat'}</span>
              </div>

              {/* Calendar Grid Cells */}
              <div className="month-grid-cells">
                {/* Blank padding cells before 1st of month */}
                {Array.from({ length: new Date(activeMonth.year, activeMonth.month, 1).getDay() }).map((_, idx) => (
                  <div key={`empty-${idx}`} className="grid-cell empty-cell"></div>
                ))}

                {/* Day cells */}
                {Array.from({ length: new Date(activeMonth.year, activeMonth.month + 1, 0).getDate() }).map((_, i) => {
                  const dayNum = i + 1;
                  const dateStr = `${activeMonth.year}-${String(activeMonth.month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                  
                  const isToday = 
                    activeMonth.year === today.getFullYear() && 
                    activeMonth.month === today.getMonth() && 
                    dayNum === today.getDate();

                  const projectsStarting = projects.filter(p => p.start_date === dateStr);
                  const projectsEnding = projects.filter(p => p.end_date === dateStr);
                  const milestonesDue = milestones.filter(m => m.date === dateStr);

                  const hasEvents = projectsStarting.length > 0 || projectsEnding.length > 0 || milestonesDue.length > 0;
                  const hasDeadline = projectsEnding.length > 0;

                  return (
                    <div 
                      key={dayNum} 
                      className={`grid-cell day-cell ${hasEvents ? 'has-events' : ''} ${hasDeadline ? 'has-deadline-cell' : ''} ${isToday ? 'is-today' : ''}`}
                    >
                      <div className="day-cell-top-bar">
                        <span className={`day-number ${isToday ? 'today-badge' : ''}`}>{dayNum}</span>
                        {isToday && (
                          <span className="today-marker-pill">
                            {language === 'ar' ? 'اليوم' : 'Today'}
                          </span>
                        )}
                        {hasDeadline && !isToday && (
                          <span className="deadline-dot-indicator" title={language === 'ar' ? 'يوجد موعد تسليم' : 'Project Deadline'} />
                        )}
                      </div>

                      <div className="day-events-container">
                        {/* 1. Projects with Deadlines (Highest priority visual) */}
                        {projectsEnding.map(p => {
                          const client = clients.find(c => c.id === p.client_id);
                          const cellDate = new Date(dateStr);
                          const diffTime = cellDate.getTime() - today.setHours(0, 0, 0, 0);
                          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                          const isOverdue = diffDays < 0 && p.status !== 'Completed' && p.status !== 'Delivered';
                          const isUrgent = diffDays >= 0 && diffDays <= 3 && p.status !== 'Completed' && p.status !== 'Delivered';

                          return (
                            <div 
                              key={`end-${p.id}`} 
                              className={`day-event-badge event-deadline ${isOverdue ? 'overdue' : isUrgent ? 'urgent' : ''}`} 
                              title={`${language === 'ar' ? 'موعد تسليم' : 'Deadline'}: ${p.name} · ${client ? client.name : ''} (${p.status})`}
                            >
                              <Flag size={10} className="event-badge-icon" />
                              <span className="event-badge-text">{p.name}</span>
                              <span className="event-badge-type-tag">
                                {isOverdue ? (language === 'ar' ? 'متأخر' : 'Overdue') : (language === 'ar' ? 'تسليم' : 'Due')}
                              </span>
                            </div>
                          );
                        })}

                        {/* 2. Projects Starting */}
                        {projectsStarting.map(p => (
                          <div 
                            key={`start-${p.id}`} 
                            className="day-event-badge event-start" 
                            title={`${language === 'ar' ? 'بداية المشروع' : 'Start Date'}: ${p.name}`}
                          >
                            <Sparkles size={10} className="event-badge-icon" />
                            <span className="event-badge-text">{p.name}</span>
                            <span className="event-badge-type-tag">{language === 'ar' ? 'بداية' : 'Start'}</span>
                          </div>
                        ))}

                        {/* 3. Milestones Due */}
                        {milestonesDue.map(m => {
                          const proj = projects.find(p => p.id === m.project_id);
                          return (
                            <div 
                              key={`m-${m.id}`} 
                              className={`day-event-badge event-milestone ${m.completed ? 'completed' : ''}`}
                              onClick={() => handleToggleMilestone(m.id)}
                              title={`${m.title} (${proj ? proj.name : ''}) - ${language === 'ar' ? 'انقر لتأكيد الإنجاز' : 'Click to toggle completion'}`}
                            >
                              <CheckCircle2 size={10} className="event-badge-icon" />
                              <span className="event-badge-text">{m.title}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Gantt Chart (Focused range between first and last active project with distinct palettes) */
            <div className="gantt-chart-wrapper">
              
              {/* Gantt Top Range & Filter Bar */}
              <div className="gantt-top-filter-bar">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
                    {language === 'ar' ? 'المخطط الزمني للمشاريع' : 'Project Timeline'}
                  </span>
                  {ganttMonths.length > 0 && (
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      ({language === 'ar' ? ganttMonths[0].labelAr : ganttMonths[0].label}
                      {' → '}
                      {language === 'ar' ? ganttMonths[ganttMonths.length - 1].labelAr : ganttMonths[ganttMonths.length - 1].label})
                    </span>
                  )}
                </div>
                <div className="gantt-filter-pill-group">
                  <button 
                    type="button"
                    onClick={() => setShowAllInGantt(false)}
                    className={`gantt-filter-pill-btn ${!showAllInGantt ? 'active' : ''}`}
                    title={language === 'ar' ? 'عرض المشاريع الجارية فقط' : 'Show ongoing projects only'}
                  >
                    {language === 'ar' 
                      ? `المشاريع الجارية (${projects.filter(p => p.status !== 'Completed' && p.status !== 'Delivered' && p.status !== 'Cancelled').length})` 
                      : `In Progress (${projects.filter(p => p.status !== 'Completed' && p.status !== 'Delivered' && p.status !== 'Cancelled').length})`
                    }
                  </button>
                  <button 
                    type="button"
                    onClick={() => setShowAllInGantt(true)}
                    className={`gantt-filter-pill-btn ${showAllInGantt ? 'active' : ''}`}
                    title={language === 'ar' ? 'عرض جميع المشاريع بما فيها المنتهية' : 'Show all projects including completed'}
                  >
                    {language === 'ar' ? `جميع المشاريع (${projects.length})` : `All Projects (${projects.length})`}
                  </button>
                </div>
              </div>

              <div className="gantt-months-header-row">
                <div className="gantt-y-axis-spacer">
                  <span>{language === 'ar' ? 'المشروع' : 'PROJECT'}</span>
                </div>
                <div className="gantt-months-cols-wrapper">
                  {ganttMonths.map((m, idx) => {
                    const isCurrentM = m.year === today.getFullYear() && m.month === today.getMonth();
                    return (
                      <div key={idx} className={`gantt-month-col-label ${isCurrentM ? 'current-col' : ''}`}>
                        <span>{language === 'ar' ? m.labelAr.split(' ')[0] : m.label.split(' ')[0]}</span>
                        {isCurrentM && <div className="gantt-today-line-indicator" />}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="gantt-rows-stack">
                {ganttProjects.length === 0 ? (
                  <div style={{ padding: '36px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    {language === 'ar' ? 'لا توجد مشاريع جارية في هذه الفترة.' : 'No active projects scheduled on timeline.'}
                  </div>
                ) : (
                  ganttProjects.map((proj, idx) => {
                    const client = clients.find(c => c.id === proj.client_id);
                    const { left, width } = getTimelinePosition(proj.start_date, proj.end_date);
                    const palette = GANTT_PALETTES[idx % GANTT_PALETTES.length];
                    const isFinished = proj.status === 'Completed' || proj.status === 'Delivered';
                    const effectiveProgress = isFinished ? 100 : (proj.progress_percentage || 0);

                    return (
                      <div key={proj.id} className="gantt-row-item">
                        <div className="gantt-row-project-label">
                          <span className="gantt-proj-name-txt">{proj.name}</span>
                          <div className="gantt-proj-meta-row">
                            <span className="gantt-proj-cat-txt">{proj.category}</span>
                            <span 
                              className="gantt-status-tag"
                              style={{ 
                                backgroundColor: palette.badge, 
                                color: palette.text,
                                borderColor: palette.border 
                              }}
                            >
                              {proj.status}
                            </span>
                          </div>
                        </div>

                        <div className="gantt-row-track-lane">
                          <div className="gantt-track-month-grids">
                            {ganttMonths.map((_, mIdx) => (
                              <div key={mIdx} className="grid-separator-col"></div>
                            ))}
                          </div>

                          <div 
                            className="gantt-project-span-bar"
                            style={{ 
                              left, 
                              width,
                              backgroundColor: palette.bg,
                              borderColor: palette.border,
                              color: palette.text
                            }}
                            title={`${proj.name} (${proj.start_date || 'Start'} → ${proj.end_date || 'End'}) · ${effectiveProgress}%`}
                          >
                            <div className="span-bar-content">
                              <div className="span-bar-top-row">
                                <span className="span-client-txt">{client ? client.name : (language === 'ar' ? 'مشروع مستقل' : 'Independent')}</span>
                                <span className="span-progress-badge">{effectiveProgress}%</span>
                              </div>
                              <span className="span-dates-txt">
                                {proj.start_date ? proj.start_date.substring(5) : '—'} 
                                {' → '} 
                                {proj.end_date ? proj.end_date.substring(5) : (language === 'ar' ? 'قيد التنفيذ' : 'Ongoing')}
                              </span>
                            </div>
                            <div 
                              className="span-bar-progress-line" 
                              style={{ 
                                width: `${effectiveProgress}%`,
                                backgroundColor: palette.bar
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* 3. Availability & Workload Predictor Widget */}
          <div className="availability-predictor-widget" style={{ marginTop: '24px' }}>
            <div className="availability-widget-inner">
              <div className="availability-status-head">
                <span className={`availability-glow-dot ${workloadStatusClass}`}></span>
                <div>
                  <h4 className="availability-title">
                    {workloadStatusTitle}
                  </h4>
                  <p className="availability-subtitle" style={{ fontSize: '0.78rem', color: 'var(--text-placeholder)', margin: '2px 0 0 0' }}>
                    {workloadSubtitle}
                  </p>
                </div>
              </div>

              <div className="availability-details-grid" style={{ marginTop: '20px' }}>
                <div className="availability-kpi-item">
                  <span className="availability-kpi-label">
                    <Clock size={12} style={{ display: 'inline', marginInlineEnd: '4px', verticalAlign: '-1px' }} />
                    {language === 'ar' ? 'أقرب وقت لاستقبال مشروع جديد' : 'Next Available Slot'}
                  </span>
                  <span className={`availability-kpi-val ${currentWorkloadPercentage >= 75 ? 'highlight-orange' : 'highlight-green'}`}>
                    {nextAvailableDateAr}
                  </span>
                </div>
                
                {sortedActiveByDeadline.length > 0 && currentWorkloadPercentage >= 70 && (
                  <div className="availability-kpi-item">
                    <span className="availability-kpi-label">{language === 'ar' ? 'أول مشروع يكتمل ويفرغ وقتاً' : 'Earliest Freeing Contract'}</span>
                    <span className="availability-kpi-val" style={{ fontSize: '0.85rem' }}>{nextProjectFreeingUp}</span>
                  </div>
                )}

                <div className="availability-kpi-item">
                  <span className="availability-kpi-label">{language === 'ar' ? 'متوسط إنجاز المشاريع الجارية' : 'Active Projects Progress'}</span>
                  <span className="availability-kpi-val font-mono" style={{ color: avgActiveProgress >= 70 ? '#0E4F2F' : 'var(--text-main)' }}>
                    {avgActiveProgress}%
                  </span>
                </div>

                <div className="availability-kpi-item">
                  <span className="availability-kpi-label">{language === 'ar' ? 'مستوى ضغط العمل الفعلي' : 'Effective Workload Pressure'}</span>
                  <div className="availability-progress-capsule">
                    <div 
                      className="availability-progress-fill" 
                      style={{ 
                        width: `${currentWorkloadPercentage}%`, 
                        backgroundColor: currentWorkloadPercentage >= 75 ? '#D32F2F' : (currentWorkloadPercentage >= 40 ? 'var(--accent-orange)' : '#0E4F2F') 
                      }}
                    ></div>
                    <span className="availability-percent-text">{currentWorkloadPercentage}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Sidebar controls (30%) - Hidden by default */}
        {showSidebar && (
          <div className="calendar-right-section animate-fade-in">
            
            {/* Header Close Strip */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px 4px 4px' }}>
              <span style={{ fontSize: '0.80rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                {language === 'ar' ? 'المراحل وجدولة المواعيد' : 'Milestones & Sync'}
              </span>
              <button 
                type="button"
                onClick={() => setShowSidebar(false)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-placeholder)', padding: '4px', fontSize: '0.9rem', lineHeight: 1 }}
                title={language === 'ar' ? 'إغلاق اللوحة' : 'Close panel'}
              >
                ✕
              </button>
            </div>

            {/* Sync Widget */}
            <div className="calendar-sidebar-card widget-sync">
            <h4 className="sidebar-card-title">{language === 'ar' ? 'مزامنة المواعيد' : 'Calendar Synchronization'}</h4>
            <p className="sidebar-card-desc" style={{ margin: '4px 0 12px 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              {language === 'ar' ? 'مزامنة مواعيد العقود مع حساب Google أو Outlook الخاص بك.' : 'Sync deadline milestones with your external schedule calendars.'}
            </p>
            <button 
              onClick={handleSyncCalendar} 
              disabled={isSyncing} 
              className={`btn-sync-action ${isSyncing ? 'loading' : ''}`}
            >
              <RefreshCw size={14} className={isSyncing ? 'sync-spinner' : ''} />
              <span>
                {isSyncing 
                  ? (language === 'ar' ? 'جاري المزامنة...' : 'Syncing Deadlines...') 
                  : (language === 'ar' ? 'مزامنة المواعيد الآن' : 'Sync Calendar Now')}
              </span>
            </button>
            <div className="sync-timestamp-row">
              <span className="timestamp-lbl">{language === 'ar' ? 'آخر مزامنة:' : 'Last Synced:'}</span>
              <span className="timestamp-val">{lastSyncTime}</span>
            </div>
          </div>

          {/* Milestones Checklist */}
          <div className="calendar-sidebar-card widget-milestones">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <h4 className="sidebar-card-title" style={{ margin: 0 }}>
                {language === 'ar' ? 'المواعيد والمراحل الهامة' : 'Milestones & Deadlines'}
              </h4>
              <span className="milestone-counter-badge">
                {milestones.filter(m => !m.completed).length}
              </span>
            </div>
            
            <div className="milestones-checklist">
              {milestones.length === 0 ? (
                <div style={{ padding: '24px 12px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <p style={{ margin: '0 0 6px 0', fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-main)' }}>
                    {language === 'ar' ? 'لا توجد مراحل مسجلة حالياً.' : 'No milestones registered yet.'}
                  </p>
                  <p style={{ margin: 0, fontSize: '0.75rem', lineHeight: 1.5 }}>
                    {language === 'ar' ? 'سجّل موعداً أو مرحلة جديدة مرتبطة بمشاريعك باستخدام النموذج أدناه.' : 'Register a real deadline for any of your projects using the form below.'}
                  </p>
                </div>
              ) : (
                milestones.map(m => {
                  const proj = projects.find(p => p.id === m.project_id);
                  const dueDate = new Date(m.date);
                  const todayMidnight = new Date();
                  todayMidnight.setHours(0, 0, 0, 0);
                  const diffTime = dueDate.getTime() - todayMidnight.getTime();
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  
                  let deadlineTagClass = 'tag-later';
                  let deadlineTagText = `${diffDays}d left`;
                  if (language === 'ar') deadlineTagText = `متبقي ${diffDays} يوم`;

                  if (m.completed) {
                    deadlineTagClass = 'tag-completed';
                    deadlineTagText = language === 'ar' ? 'مكتمل' : 'Done';
                  } else if (diffDays < 0) {
                    deadlineTagClass = 'tag-overdue';
                    deadlineTagText = language === 'ar' ? 'متأخر' : 'Overdue';
                  } else if (diffDays === 0) {
                    deadlineTagClass = 'tag-urgent';
                    deadlineTagText = language === 'ar' ? 'اليوم!' : 'Today!';
                  } else if (diffDays <= 3) {
                    deadlineTagClass = 'tag-urgent';
                    deadlineTagText = language === 'ar' ? 'عاجل' : 'Urgent';
                  }

                  return (
                    <div key={m.id} className={`milestone-item-row ${m.completed ? 'checked' : ''}`}>
                      <input 
                        type="checkbox" 
                        checked={m.completed}
                        onChange={() => handleToggleMilestone(m.id)}
                        className="milestone-checkbox-ctrl"
                      />
                      <div className="milestone-item-info">
                        <span className="milestone-item-title">{m.title}</span>
                        <span className="milestone-item-project-lbl">
                          {proj ? proj.name : (language === 'ar' ? 'مشروع عام' : 'General Project')}
                        </span>
                        <span className="milestone-item-date">{m.date}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className={`milestone-status-tag ${deadlineTagClass}`}>
                          {deadlineTagText}
                        </span>
                        {onDeleteMilestone && (
                          <button 
                            type="button"
                            onClick={() => onDeleteMilestone(m.id)}
                            style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-placeholder)', padding: '2px', display: 'flex', alignItems: 'center' }}
                            title={language === 'ar' ? 'حذف الموعد' : 'Delete milestone'}
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Quick Add Milestone Form */}
          <div className="calendar-sidebar-card widget-add-milestone">
            <h4 className="sidebar-card-title">{language === 'ar' ? 'إضافة موعد نهائي جديد' : 'New Milestone Deadline'}</h4>
            <form onSubmit={handleAddMilestone} className="milestone-quick-form">
              <div className="form-group-item">
                <label>{language === 'ar' ? 'المشروع المرتبط' : 'Link Project'}</label>
                <select 
                  value={newMilestoneProjId}
                  onChange={(e) => setNewMilestoneProjId(e.target.value)}
                  required
                  className="milestone-form-select"
                >
                  <option value="">{language === 'ar' ? 'اختر المشروع...' : 'Select project...'}</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group-item">
                <label>{language === 'ar' ? 'العنوان / المرحلة الهامة' : 'Milestone Title'}</label>
                <input 
                  type="text" 
                  placeholder={language === 'ar' ? 'مثال: تسليم واجهات التصميم' : 'e.g., Client Review Session'}
                  value={newMilestoneTitle}
                  onChange={(e) => setNewMilestoneTitle(e.target.value)}
                  required
                  className="milestone-form-input"
                />
              </div>

              <div className="form-group-item">
                <label>{language === 'ar' ? 'تاريخ الاستحقاق' : 'Due Date'}</label>
                <input 
                  type="date"
                  value={newMilestoneDate}
                  onChange={(e) => setNewMilestoneDate(e.target.value)}
                  required
                  className="milestone-form-input"
                />
              </div>

              <button type="submit" className="btn-add-milestone-action">
                {language === 'ar' ? 'إضافة الموعد' : 'Register Milestone'}
              </button>
            </form>
          </div>

        </div>
      )}

      </div>

    </div>
  );
};
