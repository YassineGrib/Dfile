import React, { useState } from 'react';
import { useLanguage } from './LanguageContext';
import type { Project, Client, Milestone, Task } from '../types';
import { Trash2 } from 'lucide-react';

interface CalendarViewProps {
  projects: Project[];
  clients: Client[];
  tasks?: Task[];
  milestones?: Milestone[];
  onAddMilestone?: (milestone: Milestone) => void;
  onToggleMilestone?: (id: string, completed: boolean) => void;
  onDeleteMilestone?: (id: string) => void;
}

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

  // Calendar sub-view mode ('gantt' | 'month')
  const [calendarViewMode, setCalendarViewMode] = useState<'month' | 'gantt'>('month');

  // Selected month index state for dynamic calendar
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(1); // Default to July (index 1 of Jun-Nov)

  // Mizaman (Sync) states
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('Never');

  // Real milestones from Firestore / props (clean empty default, zero fake seeds)
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
    }, 1500);
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

  // --- Workload & Availability Predictor Calculations ---
  const activeContracts = projects.filter(p => p.status === 'In Progress' || p.status === 'Waiting Client');
  const maxWorkload = 3;
  const currentWorkloadPercentage = Math.round((activeContracts.length / maxWorkload) * 100);

  let nextAvailableDate = '';
  let nextAvailableDateAr = 'Available Now';
  let nextProjectFreeingUp = '';

  if (activeContracts.length >= maxWorkload) {
    const activeSorted = [...activeContracts].sort((a, b) => {
      const dateA = a.end_date ? new Date(a.end_date).getTime() : Infinity;
      const dateB = b.end_date ? new Date(b.end_date).getTime() : Infinity;
      return dateA - dateB;
    });

    if (activeSorted[0] && activeSorted[0].end_date) {
      const earliestEndDate = new Date(activeSorted[0].end_date);
      const nextDay = new Date(earliestEndDate);
      nextDay.setDate(nextDay.getDate() + 1);
      nextAvailableDate = nextDay.toISOString().split('T')[0];
      nextAvailableDateAr = nextDay.toLocaleDateString(language === 'ar' ? 'ar-DZ' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      nextProjectFreeingUp = activeSorted[0].name;
    }
  }

  // --- Dynamic Month Range Calculations ---
  const projectDates = projects.flatMap(p => [
    p.start_date ? new Date(p.start_date) : null,
    p.end_date ? new Date(p.end_date) : null
  ]).filter((d): d is Date => d !== null);

  let minDate = new Date('2026-06-01');
  let maxDate = new Date('2026-11-30');

  if (projectDates.length > 0) {
    const calculatedMin = new Date(Math.min(...projectDates.map(d => d.getTime())));
    const calculatedMax = new Date(Math.max(...projectDates.map(d => d.getTime())));
    minDate = new Date(calculatedMin.getFullYear(), calculatedMin.getMonth(), 1);
    maxDate = new Date(calculatedMax.getFullYear(), calculatedMax.getMonth(), 1);
  }

  const getSpannedMonths = () => {
    const list: Array<{ year: number; month: number; label: string; labelAr: string }> = [];
    const current = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
    const end = new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);
    
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const monthNamesAr = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    
    while (current <= end) {
      const y = current.getFullYear();
      const m = current.getMonth();
      list.push({
        year: y,
        month: m,
        label: `${monthNames[m]} ${y}`,
        labelAr: `${monthNamesAr[m]} ${y}`
      });
      if (list.length > 36) break;
      current.setMonth(current.getMonth() + 1);
    }
    return list;
  };

  const spannedMonths = getSpannedMonths();
  const clampedMonthIndex = Math.max(0, Math.min(spannedMonths.length - 1, selectedMonthIndex));
  const activeMonth = spannedMonths[clampedMonthIndex] || { year: 2026, month: 6, label: 'July 2026', labelAr: 'يوليو 2026' };

  // Gantt chart horizontal position calculator
  const getTimelinePosition = (startDateStr?: string, endDateStr?: string) => {
    const minTime = minDate.getTime();
    const maxTime = maxDate.getTime();
    const totalDuration = maxTime - minTime;

    const start = startDateStr ? new Date(startDateStr).getTime() : minTime;
    const end = endDateStr ? new Date(endDateStr).getTime() : maxTime;

    const leftPercent = Math.max(0, Math.min(95, ((start - minTime) / totalDuration) * 100));
    const widthPercent = Math.max(8, Math.min(100 - leftPercent, ((end - start) / totalDuration) * 100));

    return { left: `${leftPercent}%`, width: `${widthPercent}%` };
  };

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
              <h3 className="calendar-date-header" style={{ fontSize: '1.25rem', fontWeight: 500 }}>
                {language === 'ar' ? 'مخطط وجدول المواعيد الذكي' : 'Smart Deadlines & Planner'}
              </h3>
              <p className="availability-subtitle" style={{ fontSize: '0.82rem', color: 'var(--text-placeholder)', margin: '4px 0 0 0' }}>
                {language === 'ar'
                  ? 'رصد تواريخ تسليم العقود، بدايات المشاريع، والمهام المطلوبة ديناميكياً'
                  : 'Monitor active delivery contracts, starting dates, and custom milestone deadlines.'
                }
              </p>
            </div>
            
            {/* View Mode Selector Pill */}
            <div className="calendar-view-type-tabs">
              <button 
                onClick={() => setCalendarViewMode('month')}
                className={`view-type-tab-pill ${calendarViewMode === 'month' ? 'active' : ''}`}
              >
                {language === 'ar' ? 'تقويم شهري' : 'Monthly Grid'}
              </button>
              <button 
                onClick={() => setCalendarViewMode('gantt')}
                className={`view-type-tab-pill ${calendarViewMode === 'gantt' ? 'active' : ''}`}
              >
                {language === 'ar' ? 'مخطط Gantt' : 'Gantt Chart'}
              </button>
            </div>
          </div>

          {calendarViewMode === 'month' ? (
            /* Dynamic Monthly Grid Calendar */
            <div className="month-grid-wrapper">
              <div className="month-grid-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <span className="month-grid-title">
                  {language === 'ar' ? activeMonth.labelAr : activeMonth.label}
                </span>
                
                {/* Month Navigation Controls */}
                <div className="month-pagination-controls" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button 
                    onClick={() => setSelectedMonthIndex(Math.max(0, clampedMonthIndex - 1))}
                    disabled={clampedMonthIndex === 0}
                    className="month-pager-btn"
                    title={language === 'ar' ? 'الشهر السابق' : 'Previous Month'}
                  >
                    ◀
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
                    ▶
                  </button>
                </div>
              </div>

              <div className="month-days-names-row">
                <span>{language === 'ar' ? 'أحد' : 'Sun'}</span>
                <span>{language === 'ar' ? 'إثنين' : 'Mon'}</span>
                <span>{language === 'ar' ? 'ثلاثاء' : 'Tue'}</span>
                <span>{language === 'ar' ? 'أربعاء' : 'Wed'}</span>
                <span>{language === 'ar' ? 'خميس' : 'Thu'}</span>
                <span>{language === 'ar' ? 'جمعة' : 'Fri'}</span>
                <span>{language === 'ar' ? 'سبت' : 'Sat'}</span>
              </div>

              <div className="month-grid-cells">
                {/* Dynamic blank padding cells */}
                {Array.from({ length: new Date(activeMonth.year, activeMonth.month, 1).getDay() }).map((_, idx) => (
                  <div key={`empty-${idx}`} className="grid-cell empty-cell"></div>
                ))}

                {/* Dynamic day cells */}
                {Array.from({ length: new Date(activeMonth.year, activeMonth.month + 1, 0).getDate() }).map((_, i) => {
                  const dayNum = i + 1;
                  const dateStr = `${activeMonth.year}-${String(activeMonth.month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                  
                  const projectsStarting = projects.filter(p => p.start_date === dateStr);
                  const projectsEnding = projects.filter(p => p.end_date === dateStr);
                  const milestonesDue = milestones.filter(m => m.date === dateStr);

                  const hasEvents = projectsStarting.length > 0 || projectsEnding.length > 0 || milestonesDue.length > 0;

                  return (
                    <div key={dayNum} className={`grid-cell day-cell ${hasEvents ? 'has-events' : ''}`}>
                      <span className="day-number">{dayNum}</span>
                      <div className="day-events-container">
                        {projectsStarting.map(p => (
                          <div 
                            key={`start-${p.id}`} 
                            className="day-event-badge event-start" 
                            title={`Start: ${p.name}`}
                          >
                            🚀 {p.name.substring(0, 10)}...
                          </div>
                        ))}
                        {projectsEnding.map(p => (
                          <div 
                            key={`end-${p.id}`} 
                            className="day-event-badge event-deadline" 
                            title={`Deadline: ${p.name}`}
                          >
                            🏁 {p.name.substring(0, 10)}...
                          </div>
                        ))}
                        {milestonesDue.map(m => {
                          const proj = projects.find(p => p.id === m.project_id);
                          return (
                            <div 
                              key={`m-${m.id}`} 
                              className={`day-event-badge event-milestone ${m.completed ? 'completed' : ''}`}
                              onClick={() => handleToggleMilestone(m.id)}
                              title={`Milestone: ${m.title} (${proj ? proj.name : ''}) - Click to toggle completion`}
                            >
                              📌 {m.title}
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
            /* Gantt Chart (Spans across calculated range) */
            <div className="gantt-chart-wrapper">
              <div className="gantt-months-header-row">
                <div className="gantt-y-axis-spacer">
                  <span>{language === 'ar' ? 'المشروع' : 'PROJECT'}</span>
                </div>
                <div className="gantt-months-cols-wrapper">
                  {spannedMonths.map((m, idx) => (
                    <div key={idx} className="gantt-month-col-label">
                      <span>{language === 'ar' ? m.labelAr.split(' ')[0] : m.label.split(' ')[0]}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="gantt-rows-stack">
                {projects.map((proj) => {
                  const client = clients.find(c => c.id === proj.client_id);
                  const { left, width } = getTimelinePosition(proj.start_date, proj.end_date);
                  const catClass = 
                    proj.category.toLowerCase().includes('design') ? 'yellow-block' :
                    proj.category.toLowerCase().includes('dev') ? 'pink-block' :
                    proj.category.toLowerCase().includes('market') ? 'blue-block' : 'red-block';

                  return (
                    <div key={proj.id} className="gantt-row-item">
                      <div className="gantt-row-project-label">
                        <span className="gantt-proj-name-txt">{proj.name}</span>
                        <span className="gantt-proj-cat-txt">{proj.category}</span>
                      </div>

                      <div className="gantt-row-track-lane">
                        <div className="gantt-track-month-grids">
                          {spannedMonths.map((_, idx) => (
                            <div key={idx} className="grid-separator-col"></div>
                          ))}
                        </div>

                        <div 
                          className={`gantt-project-span-bar ${catClass}`}
                          style={{ left, width }}
                          title={`${proj.name} (${proj.start_date || 'Jul 1'} - ${proj.end_date || 'Aug 30'})`}
                        >
                          <div className="span-bar-content">
                            <span className="span-client-txt">{client ? client.name : 'Independent'}</span>
                            <span className="span-dates-txt">({proj.start_date ? proj.start_date.substring(5) : 'Jul'} - {proj.end_date ? proj.end_date.substring(5) : 'Aug'})</span>
                          </div>
                          <div className="span-bar-progress-line" style={{ width: `${proj.status === 'Completed' || proj.status === 'Delivered' ? 100 : proj.progress_percentage}%` }}></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Availability Predictor */}
          <div className="availability-predictor-widget" style={{ marginTop: '24px' }}>
            <div className="availability-widget-inner">
              <div className="availability-status-head">
                <span className={`availability-glow-dot ${activeContracts.length >= maxWorkload ? 'busy' : 'free'}`}></span>
                <div>
                  <h4 className="availability-title">
                    {activeContracts.length >= maxWorkload 
                      ? (language === 'ar' ? 'حالة العمل: ممتلئ بالكامل (القدرة الاستيعابية قصوى)' : 'Workspace Status: Fully Booked (At Maximum Capacity)')
                      : (language === 'ar' ? 'حالة العمل: متاح حالياً لاستقبال مشاريع جديدة' : 'Workspace Status: Open for New Projects')
                    }
                  </h4>
                  <p className="availability-subtitle" style={{ fontSize: '0.78rem', color: 'var(--text-placeholder)', margin: '2px 0 0 0' }}>
                    {language === 'ar' 
                      ? `المشاريع الجارية قيد التنفيذ حالياً: ${activeContracts.length} من أصل ${maxWorkload}`
                      : `Active contracts in progress: ${activeContracts.length} out of ${maxWorkload} maximum target workload`
                    }
                  </p>
                </div>
              </div>

              <div className="availability-details-grid" style={{ marginTop: '20px' }}>
                <div className="availability-kpi-item">
                  <span className="availability-kpi-label">{language === 'ar' ? 'أقرب وقت لاستقبال مشروع جديد' : 'Next Available Slot'}</span>
                  <span className={`availability-kpi-val ${activeContracts.length >= maxWorkload ? 'highlight-orange' : 'highlight-green'}`} title={nextAvailableDate}>
                    {nextAvailableDateAr}
                  </span>
                </div>
                
                {activeContracts.length >= maxWorkload && (
                  <div className="availability-kpi-item">
                    <span className="availability-kpi-label">{language === 'ar' ? 'السبب (المشروع الأول اكتمالاً)' : 'Earliest Freeing Contract'}</span>
                    <span className="availability-kpi-val" style={{ fontSize: '0.85rem' }}>{nextProjectFreeingUp}</span>
                  </div>
                )}

                <div className="availability-kpi-item">
                  <span className="availability-kpi-label">{language === 'ar' ? 'مستوى ضغط العمل الجاري' : 'Current Workload'}</span>
                  <div className="availability-progress-capsule">
                    <div 
                      className="availability-progress-fill" 
                      style={{ 
                        width: `${currentWorkloadPercentage}%`, 
                        backgroundColor: currentWorkloadPercentage >= 100 ? '#D32F2F' : (currentWorkloadPercentage >= 65 ? 'var(--accent-orange)' : 'var(--btn-primary)') 
                      }}
                    ></div>
                    <span className="availability-percent-text">{currentWorkloadPercentage}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Sidebar controls (30%) */}
        <div className="calendar-right-section">
          
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
              {isSyncing ? (
                <>
                  <span className="sync-spinner">🔄</span>
                  <span>{language === 'ar' ? 'جاري المزامنة...' : 'Syncing Deadlines...'}</span>
                </>
              ) : (
                <>
                  <span>🔄</span>
                  <span>{language === 'ar' ? 'مزامنة المواعيد' : 'Sync Calendar Now'}</span>
                </>
              )}
            </button>
            <div className="sync-timestamp-row">
              <span className="timestamp-lbl">{language === 'ar' ? 'آخر مزامنة:' : 'Last Synced:'}</span>
              <span className="timestamp-val">{lastSyncTime}</span>
            </div>
          </div>

          {/* Milestones Checklist */}
          <div className="calendar-sidebar-card widget-milestones">
            <h4 className="sidebar-card-title">{language === 'ar' ? 'المواعيد والمراحل الهامة' : 'Milestones & Deadlines'}</h4>
            
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
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const diffTime = dueDate.getTime() - today.getTime();
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

      </div>

    </div>
  );
};
