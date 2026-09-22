import React, { useState } from 'react';
import { useLanguage } from './LanguageContext';
import type { Project, Client, Task, Payment, ProjectStatus } from '../types';
import { UserAvatar } from './UserAvatar';

interface ProjectsViewProps {
  projects: Project[];
  clients: Client[];
  tasks: Task[];
  payments?: Payment[];
  onUpdateTask: (task: Task) => void;
  onUpdateProject: (project: Project) => void;
  onOpenAddProject: () => void;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  projects,
  clients,
  tasks,
  payments = [],
  onUpdateTask,
  onUpdateProject,
  onOpenAddProject,
}) => {
  const { language } = useLanguage();

  // View tabs state: board, calendar, table
  const [activeSubTab, setActiveSubTab] = useState<'board' | 'calendar' | 'table'>('board');

  // Table View Filter & Sort states
  const [tableSearch, setTableSearch] = useState('');
  const [tableStatusFilter, setTableStatusFilter] = useState<'All' | 'Planned' | 'In Progress' | 'Completed' | 'Delivered'>('All');
  const [tableSortField, setTableSortField] = useState<'name' | 'price_dzd' | 'progress_percentage' | 'end_date'>('name');
  const [tableSortAsc, setTableSortAsc] = useState(true);

  // Selected Project for slide-over detail
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);



  // Task inline creation state
  const [newTaskName, setNewTaskName] = useState('');

  // Payment calculation helper
  const getProjectPaid = (projectId: string) => {
    return payments
      .filter(p => p.project_id === projectId)
      .reduce((sum, p) => sum + (p.amount || 0), 0);
  };

  // Drag and drop event handlers
  const handleDragStart = (e: React.DragEvent, projectId: string) => {
    e.dataTransfer.setData('text/plain', projectId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, newStatus: ProjectStatus) => {
    e.preventDefault();
    const projectId = e.dataTransfer.getData('text/plain');
    const proj = projects.find(p => p.id === projectId);
    if (proj) {
      onUpdateProject({ ...proj, status: newStatus });
      // If selectedProject is open, update it
      if (selectedProject && selectedProject.id === projectId) {
        setSelectedProject({ ...selectedProject, status: newStatus });
      }
    }
  };

  // Project Column drag/click movement handler
  const handleMoveProjectStatus = (project: Project, newStatus: ProjectStatus, e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdateProject({ ...project, status: newStatus });
    if (selectedProject && selectedProject.id === project.id) {
      setSelectedProject({ ...selectedProject, status: newStatus });
    }
  };

  // Split all projects by column status
  const plannedProjects = projects.filter(p => p.status === 'Planned');
  const inProgressProjects = projects.filter(p => p.status === 'In Progress' || p.status === 'Waiting Client');
  const completedProjects = projects.filter(p => p.status === 'Completed');
  const deliveredProjects = projects.filter(p => p.status === 'Delivered');



  // --- Table Sorting & Filtering Logic ---
  const handleSort = (field: 'name' | 'price_dzd' | 'progress_percentage' | 'end_date') => {
    if (tableSortField === field) {
      setTableSortAsc(!tableSortAsc);
    } else {
      setTableSortField(field);
      setTableSortAsc(true);
    }
  };

  const filteredProjects = projects.filter(p => {
    const client = clients.find(c => c.id === p.client_id);
    const matchesSearch = 
      p.name.toLowerCase().includes(tableSearch.toLowerCase()) ||
      p.category.toLowerCase().includes(tableSearch.toLowerCase()) ||
      (client && client.name.toLowerCase().includes(tableSearch.toLowerCase()));

    const matchesStatus = 
      tableStatusFilter === 'All' ||
      (tableStatusFilter === 'In Progress' && (p.status === 'In Progress' || p.status === 'Waiting Client')) ||
      (tableStatusFilter === 'Planned' && p.status === 'Planned') ||
      (tableStatusFilter === 'Completed' && p.status === 'Completed') ||
      (tableStatusFilter === 'Delivered' && p.status === 'Delivered');

    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    let valA: any = a[tableSortField];
    let valB: any = b[tableSortField];

    if (tableSortField === 'price_dzd' || tableSortField === 'progress_percentage') {
      return tableSortAsc ? valA - valB : valB - valA;
    }

    valA = (valA || '').toString().toLowerCase();
    valB = (valB || '').toString().toLowerCase();
    if (valA < valB) return tableSortAsc ? -1 : 1;
    if (valA > valB) return tableSortAsc ? 1 : -1;
    return 0;
  });

  // Add a task to a project inside slide-over
  const handleAddTaskToProject = (e: React.FormEvent, projectId: string) => {
    e.preventDefault();
    if (!newTaskName.trim()) return;

    const newTask: Task = {
      id: 'tsk_' + Math.random().toString(36).substr(2, 9),
      project_id: projectId,
      name: newTaskName.trim(),
      status: 'Next up',
      created_at: new Date().toISOString().split('T')[0],
      labels: ['Task'],
      assignees: ['SH']
    };

    onUpdateTask(newTask);
    setNewTaskName('');
  };

  // Toggle task status
  const handleToggleTaskStatus = (task: Task) => {
    const nextStatus = task.status === 'Complete' ? 'Next up' : 'Complete';
    onUpdateTask({ ...task, status: nextStatus });
  };

  return (
    <div className="dashboard-content-area">
      
      {/* 1. Workspace Header Strip */}
      <div className="workspace-header-strip">
        <div className="project-breadcrumb">
          <span>{language === 'ar' ? 'المشاريع العامة' : 'All Projects'}</span>
          <span className="breadcrumb-divider">/</span>
          <span className="text-bold">{language === 'ar' ? 'محفظة الأعمال' : 'Portfolio Workspace'}</span>
        </div>

        {/* Member Invite Stack */}
        <div className="member-invite-stack">
          <div className="avatar-stack" style={{ display: 'flex', alignItems: 'center' }}>
            {clients.length > 0 ? (
              clients.slice(0, 3).map((c, idx) => (
                <UserAvatar
                  key={c.id}
                  name={c.name}
                  size={26}
                  animate="hover"
                  style={{ marginLeft: idx > 0 ? '-6px' : '0', border: '1.5px solid white' }}
                />
              ))
            ) : (
              ['Alex', 'Sam', 'Taylor'].map((n, idx) => (
                <UserAvatar
                  key={n}
                  name={n}
                  size={26}
                  animate="hover"
                  style={{ marginLeft: idx > 0 ? '-6px' : '0', border: '1.5px solid white' }}
                />
              ))
            )}
            {clients.length > 3 && (
              <span className="stack-avatar count-bg">+{clients.length - 3}</span>
            )}
          </div>
          <button onClick={onOpenAddProject} className="submit-btn compact-btn" style={{ height: '32px', padding: '0 12px', fontSize: '0.8rem' }}>
            {language === 'ar' ? '+ إضافة مشروع' : '+ Add Project'}
          </button>
        </div>
      </div>

      {/* 2. Main Title Header */}
      <div className="project-details-intro-block" style={{ marginBottom: '16px' }}>
        <div>
          <h2 className="project-title-heading">
            {language === 'ar' ? 'مسارات المشاريع العقارية والخدمية' : 'Workspace Projects Planner'}
          </h2>
          <p className="header-greeting-subtitle" style={{ margin: '4px 0 0 0' }}>
            {language === 'ar' ? 'نظرة شمولية وتخطيطية على كافة مشاريعك المتعاقد عليها.' : 'Unified view of all active, planned, and completed contracts.'}
          </p>
        </div>
      </div>

      {/* 3. View Switcher Tabs (Board, Calendar, Table) */}
      <div className="workspace-tabs-bar">
        <div className="tabs-selector-group">
          <button 
            onClick={() => setActiveSubTab('board')} 
            className={`workspace-tab-link ${activeSubTab === 'board' ? 'active' : ''}`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="7" height="9"></rect><rect x="14" y="3" width="7" height="5"></rect><rect x="14" y="12" width="7" height="9"></rect><rect x="3" y="16" width="7" height="5"></rect></svg>
            <span>{language === 'ar' ? 'لوحة المشاريع' : 'Board view'}</span>
          </button>



          <button 
            onClick={() => setActiveSubTab('table')} 
            className={`workspace-tab-link ${activeSubTab === 'table' ? 'active' : ''}`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
            <span>{language === 'ar' ? 'الجدول الشامل' : 'Table view'}</span>
          </button>
        </div>

        <div className="tabs-utilities-right">
          <button className="favorite-btn">★ {language === 'ar' ? 'المفضلة' : 'Favorite'}</button>
          <button className="more-actions-btn">•••</button>
        </div>
      </div>

      {/* 4. RENDER VIEWS FOR ALL PROJECTS */}

      {activeSubTab === 'board' && (
        <div className="kanban-board-workspace animate-slide-in">
          
          {/* COLUMN 1: Planned / Next up */}
          <div className="kanban-column column-nextup">
            <div className="column-header-row">
              <div className="col-label-group">
                <span className="col-counter-badge counter-nextup">{plannedProjects.length}</span>
                <span className="col-title-text">{language === 'ar' ? 'المخطط لها' : 'Planned'}</span>
              </div>
              <button onClick={onOpenAddProject} className="add-task-col-btn">+</button>
            </div>

            <div 
              className="kanban-cards-stack"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, 'Planned')}
            >
              {plannedProjects.map(proj => {
                const client = clients.find(c => c.id === proj.client_id);
                return (
                  <div 
                    key={proj.id} 
                    className="kanban-task-card"
                    onClick={() => setSelectedProject(proj)}
                    draggable={true}
                    onDragStart={(e) => handleDragStart(e, proj.id)}
                  >
                    <div className="card-client-label">{client ? client.name : 'Unknown Client'}</div>
                    <h5 className="card-task-title">{proj.name}</h5>
                    
                    <span className={`proj-category-badge category-${proj.category.toLowerCase()}`} style={{ alignSelf: 'flex-start', margin: '4px 0' }}>
                      {proj.category}
                    </span>

                    {/* Financial Progress & Debt Tracker */}
                    {(() => {
                      const paid = getProjectPaid(proj.id);
                      const remaining = Math.max(0, proj.price_dzd - paid);
                      const percent = proj.price_dzd > 0 ? Math.min(100, Math.round((paid / proj.price_dzd) * 100)) : 0;
                      return (
                        <div className="project-financial-bar-row">
                          <div className="financial-bar-label-wrap">
                            <span>{language === 'ar' ? 'المحصل:' : 'Paid:'} {paid.toLocaleString()} DZ</span>
                            <span style={{ color: remaining === 0 ? '#0E4F2F' : 'var(--accent-orange)' }}>
                              {remaining === 0 ? (language === 'ar' ? 'مسدد' : 'Cleared') : `${language === 'ar' ? 'باقي' : 'Due'}: ${remaining.toLocaleString()}`}
                            </span>
                          </div>
                          <div className="financial-bar-bg">
                            <div className="financial-bar-fill" style={{ width: `${percent}%` }} />
                          </div>
                        </div>
                      );
                    })()}

                    <div className="card-metadata-footer">
                      <div className="card-due-date">
                        📅 {proj.end_date || 'No deadline'}
                      </div>
                      <div className="card-move-controllers">
                        <button 
                          onClick={(e) => handleMoveProjectStatus(proj, 'In Progress', e)} 
                          title="Move to In Progress"
                          className="move-arrow-btn"
                        >
                          →
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* COLUMN 2: In Progress */}
          <div className="kanban-column column-inprogress">
            <div className="column-header-row">
              <div className="col-label-group">
                <span className="col-counter-badge counter-inprogress">{inProgressProjects.length}</span>
                <span className="col-title-text">{language === 'ar' ? 'قيد التنفيذ' : 'In Progress'}</span>
              </div>
              <button onClick={onOpenAddProject} className="add-task-col-btn">+</button>
            </div>

            <div 
              className="kanban-cards-stack"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, 'In Progress')}
            >
              {inProgressProjects.map(proj => {
                const client = clients.find(c => c.id === proj.client_id);
                return (
                  <div 
                    key={proj.id} 
                    className="kanban-task-card"
                    onClick={() => setSelectedProject(proj)}
                    draggable={true}
                    onDragStart={(e) => handleDragStart(e, proj.id)}
                  >
                    <div className="card-client-label">{client ? client.name : 'Unknown Client'}</div>
                    <h5 className="card-task-title">{proj.name}</h5>
                    
                    <span className={`proj-category-badge category-${proj.category.toLowerCase()}`} style={{ alignSelf: 'flex-start', margin: '4px 0' }}>
                      {proj.category}
                    </span>

                    {/* Progress Fill (Interactive Draggable Slider Track) */}
                    <div className="card-progress-wrapper" style={{ margin: '4px 0' }} onClick={(e) => e.stopPropagation()}>
                      <div className="progress-text-row">
                        <span style={{ fontSize: '0.72rem' }}>{language === 'ar' ? 'نسبة الإنجاز:' : 'Progress:'}</span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>{proj.progress_percentage}%</span>
                      </div>
                      
                      {/* Premium Drag Container */}
                      <div className="interactive-progress-container">
                        <div className="progress-bar-bg">
                          <div 
                            className="progress-bar-fill" 
                            style={{ width: `${proj.progress_percentage}%` }}
                          ></div>
                          <div 
                            className="progress-drag-thumb" 
                            style={{ left: `${proj.progress_percentage}%` }}
                          ></div>
                        </div>
                        
                        {/* Invisible Range Slider for Native Drag Interception */}
                        <input 
                          type="range"
                          min="0"
                          max="100"
                          value={proj.progress_percentage}
                          onChange={(e) => {
                            onUpdateProject({ ...proj, progress_percentage: parseInt(e.target.value) });
                          }}
                          className="progress-slider-overlay"
                        />
                      </div>
                    </div>

                    <div className="card-metadata-footer">
                      <div className="card-due-date">
                        📅 {proj.end_date || 'No deadline'}
                      </div>
                      <div className="card-move-controllers">
                        <button 
                          onClick={(e) => handleMoveProjectStatus(proj, 'Planned', e)} 
                          title="Move back to Planned"
                          className="move-arrow-btn"
                        >
                          ←
                        </button>
                        <button 
                          onClick={(e) => handleMoveProjectStatus(proj, 'Completed', e)} 
                          title="Move to Completed"
                          className="move-arrow-btn"
                        >
                          →
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* COLUMN 3: Completed */}
          <div className="kanban-column column-complete">
            <div className="column-header-row">
              <div className="col-label-group">
                <span className="col-counter-badge counter-complete">{completedProjects.length}</span>
                <span className="col-title-text">{language === 'ar' ? 'المكتملة' : 'Completed'}</span>
              </div>
              <button onClick={onOpenAddProject} className="add-task-col-btn">+</button>
            </div>

            <div 
              className="kanban-cards-stack"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, 'Completed')}
            >
              {completedProjects.map(proj => {
                const client = clients.find(c => c.id === proj.client_id);
                return (
                  <div 
                    key={proj.id} 
                    className="kanban-task-card completed-task-card"
                    onClick={() => setSelectedProject(proj)}
                    draggable={true}
                    onDragStart={(e) => handleDragStart(e, proj.id)}
                  >
                    <div className="card-client-label">{client ? client.name : 'Unknown Client'}</div>
                    <h5 className="card-task-title">{proj.name}</h5>
                    
                    <span className={`proj-category-badge category-${proj.category.toLowerCase()}`} style={{ alignSelf: 'flex-start', margin: '4px 0' }}>
                      {proj.category}
                    </span>

                    {/* Financial Progress & Debt Tracker */}
                    {(() => {
                      const paid = getProjectPaid(proj.id);
                      const remaining = Math.max(0, proj.price_dzd - paid);
                      const percent = proj.price_dzd > 0 ? Math.min(100, Math.round((paid / proj.price_dzd) * 100)) : 0;
                      return (
                        <div className="project-financial-bar-row">
                          <div className="financial-bar-label-wrap">
                            <span>{language === 'ar' ? 'المحصل:' : 'Paid:'} {paid.toLocaleString()} DZ</span>
                            <span style={{ color: remaining === 0 ? '#0E4F2F' : 'var(--accent-orange)' }}>
                              {remaining === 0 ? (language === 'ar' ? 'مسدد' : 'Cleared') : `${language === 'ar' ? 'باقي' : 'Due'}: ${remaining.toLocaleString()}`}
                            </span>
                          </div>
                          <div className="financial-bar-bg">
                            <div className="financial-bar-fill" style={{ width: `${percent}%` }} />
                          </div>
                        </div>
                      );
                    })()}

                    <div className="card-metadata-footer">
                      <div className="card-due-date text-muted">
                        ✓ {language === 'ar' ? 'مكتمل' : 'Completed'}
                      </div>
                      <div className="card-move-controllers">
                        <button 
                          onClick={(e) => handleMoveProjectStatus(proj, 'In Progress', e)} 
                          title="Move back to In Progress"
                          className="move-arrow-btn"
                        >
                          ←
                        </button>
                        <button 
                          onClick={(e) => handleMoveProjectStatus(proj, 'Delivered', e)} 
                          title="Move to Delivered"
                          className="move-arrow-btn"
                        >
                          →
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* COLUMN 4: Delivered */}
          <div className="kanban-column column-delivered">
            <div className="column-header-row">
              <div className="col-label-group">
                <span className="col-counter-badge counter-delivered">{deliveredProjects.length}</span>
                <span className="col-title-text">{language === 'ar' ? 'تم التسليم' : 'Delivered'}</span>
              </div>
              <button onClick={onOpenAddProject} className="add-task-col-btn">+</button>
            </div>

            <div 
              className="kanban-cards-stack"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, 'Delivered')}
            >
              {deliveredProjects.map(proj => {
                const client = clients.find(c => c.id === proj.client_id);
                return (
                  <div 
                    key={proj.id} 
                    className="kanban-task-card completed-task-card delivered-task-card"
                    onClick={() => setSelectedProject(proj)}
                    draggable={true}
                    onDragStart={(e) => handleDragStart(e, proj.id)}
                  >
                    <div className="card-client-label">{client ? client.name : 'Unknown Client'}</div>
                    <h5 className="card-task-title">{proj.name}</h5>
                    
                    <span className={`proj-category-badge category-${proj.category.toLowerCase()}`} style={{ alignSelf: 'flex-start', margin: '4px 0' }}>
                      {proj.category}
                    </span>

                    {/* Financial Progress & Debt Tracker */}
                    {(() => {
                      const paid = getProjectPaid(proj.id);
                      const remaining = Math.max(0, proj.price_dzd - paid);
                      const percent = proj.price_dzd > 0 ? Math.min(100, Math.round((paid / proj.price_dzd) * 100)) : 0;
                      return (
                        <div className="project-financial-bar-row">
                          <div className="financial-bar-label-wrap">
                            <span>{language === 'ar' ? 'المحصل:' : 'Paid:'} {paid.toLocaleString()} DZ</span>
                            <span style={{ color: remaining === 0 ? '#0E4F2F' : 'var(--accent-orange)' }}>
                              {remaining === 0 ? (language === 'ar' ? 'مسدد' : 'Cleared') : `${language === 'ar' ? 'باقي' : 'Due'}: ${remaining.toLocaleString()}`}
                            </span>
                          </div>
                          <div className="financial-bar-bg">
                            <div className="financial-bar-fill" style={{ width: `${percent}%` }} />
                          </div>
                        </div>
                      );
                    })()}

                    <div className="card-metadata-footer">
                      <div className="card-due-date" style={{ color: '#0E4F2F', fontWeight: 500 }}>
                        ✓✓ {language === 'ar' ? 'تم التسليم' : 'Delivered'}
                      </div>
                      <div className="card-move-controllers">
                        <button 
                          onClick={(e) => handleMoveProjectStatus(proj, 'Completed', e)} 
                          title="Move back to Completed"
                          className="move-arrow-btn"
                        >
                          ←
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}



      {activeSubTab === 'table' && (
        <div className="table-workspace-view animate-slide-in">
          
          {/* Table Metrics Summary Bar */}
          <div className="table-summary-strip">
            <div className="summary-metric-tile">
              <span className="metric-tile-label">{language === 'ar' ? 'قيمة المحفظة' : 'Portfolio Value'}</span>
              <span className="metric-tile-val">
                {filteredProjects.reduce((acc, curr) => acc + curr.price_dzd, 0).toLocaleString()} DZ
              </span>
            </div>
            <div className="summary-metric-tile">
              <span className="metric-tile-label">{language === 'ar' ? 'متوسط الإنجاز' : 'Average Progress'}</span>
              <span className="metric-tile-val">
                {filteredProjects.length > 0 
                  ? Math.round(filteredProjects.reduce((acc, curr) => acc + curr.progress_percentage, 0) / filteredProjects.length)
                  : 0}%
              </span>
            </div>
            <div className="summary-metric-tile">
              <span className="metric-tile-label">{language === 'ar' ? 'المشاريع الجارية' : 'Active Projects'}</span>
              <span className="metric-tile-val">
                {filteredProjects.filter(p => p.status === 'In Progress' || p.status === 'Waiting Client').length}
              </span>
            </div>
          </div>

          {/* Table Search & Filter Toolbar */}
          <div className="table-toolbar-panel">
            <div className="toolbar-search-box">
              <span className="search-icon">🔍</span>
              <input 
                type="text" 
                placeholder={language === 'ar' ? 'ابحث عن مشروع، عميل، تصنيف...' : 'Search projects, clients, categories...'}
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                className="toolbar-search-input"
              />
              {tableSearch && (
                <button onClick={() => setTableSearch('')} className="clear-search-btn">✕</button>
              )}
            </div>

            <div className="toolbar-filters-group">
              <select 
                value={tableStatusFilter} 
                onChange={(e) => setTableStatusFilter(e.target.value as any)}
                className="toolbar-select-filter"
              >
                <option value="All">{language === 'ar' ? 'جميع الحالات' : 'All Statuses'}</option>
                <option value="Planned">{language === 'ar' ? 'مخطط له' : 'Planned'}</option>
                <option value="In Progress">{language === 'ar' ? 'قيد التنفيذ' : 'In Progress'}</option>
                <option value="Completed">{language === 'ar' ? 'مكتمل' : 'Completed'}</option>
                <option value="Delivered">{language === 'ar' ? 'تم التسليم' : 'Delivered'}</option>
              </select>
            </div>
          </div>

          {/* Interactive Grid Table */}
          <div className="table-responsive-wrapper">
            <table className="workspace-table">
              <thead>
                <tr>
                  <th onClick={() => handleSort('name')} className="sortable-header">
                    {language === 'ar' ? 'المشروع' : 'Project'} {tableSortField === 'name' ? (tableSortAsc ? ' ▲' : ' ▼') : ''}
                  </th>
                  <th>{language === 'ar' ? 'العميل' : 'Client'}</th>
                  <th>{language === 'ar' ? 'التصنيف' : 'Category'}</th>
                  <th onClick={() => handleSort('price_dzd')} className="sortable-header">
                    {language === 'ar' ? 'الميزانية' : 'Budget'} {tableSortField === 'price_dzd' ? (tableSortAsc ? ' ▲' : ' ▼') : ''}
                  </th>
                  <th onClick={() => handleSort('progress_percentage')} className="sortable-header">
                    {language === 'ar' ? 'التقدم' : 'Progress'} {tableSortField === 'progress_percentage' ? (tableSortAsc ? ' ▲' : ' ▼') : ''}
                  </th>
                  <th onClick={() => handleSort('end_date')} className="sortable-header">
                    {language === 'ar' ? 'الجدول الزمني' : 'Timeline'} {tableSortField === 'end_date' ? (tableSortAsc ? ' ▲' : ' ▼') : ''}
                  </th>
                  <th>{language === 'ar' ? 'الحالة' : 'Status'}</th>
                </tr>
              </thead>
              <tbody>
                {filteredProjects.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center text-placeholder" style={{ padding: '30px 0' }}>
                      {language === 'ar' ? 'لم يتم العثور على نتائج تطابق البحث' : 'No matching projects found.'}
                    </td>
                  </tr>
                ) : (
                  filteredProjects.map(proj => {
                    const client = clients.find(c => c.id === proj.client_id);
                    return (
                      <tr 
                        key={proj.id} 
                        className="table-task-row-link" 
                        onClick={() => setSelectedProject(proj)}
                      >
                        <td className="font-bold">{proj.name}</td>
                        <td>{client ? client.name : 'Independent'}</td>
                        <td>
                          <span className={`proj-category-badge category-${proj.category.toLowerCase().replace(/\s+/g, '')}`}>
                            {proj.category}
                          </span>
                        </td>
                        <td className="font-bold">{proj.price_dzd.toLocaleString()} DZ</td>
                        <td>
                          {(() => {
                            const effectiveProg = (proj.status === 'Completed' || proj.status === 'Delivered') ? 100 : (proj.progress_percentage || 0);
                            return (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '0.78rem', fontWeight: 500, width: '32px' }}>{effectiveProg}%</span>
                                <div className="progress-bar-bg" style={{ width: '80px', height: '6px', margin: 0 }}>
                                  <div 
                                    className="progress-bar-fill" 
                                    style={{ width: `${effectiveProg}%`, height: '100%', backgroundColor: effectiveProg === 100 ? '#0E4F2F' : 'var(--accent-purple)' }}
                                  ></div>
                                </div>
                              </div>
                            );
                          })()}
                        </td>
                        <td>
                          <div style={{ fontSize: '0.78rem', fontWeight: 500 }}>
                            {proj.start_date ? proj.start_date.substring(5) : 'Jul'} ➔ {proj.end_date ? proj.end_date.substring(5) : 'Aug'}
                          </div>
                        </td>
                        <td>
                          <span className={`task-table-status-pill status-${proj.status.toLowerCase().replace(/\s+/g, '')}`}>
                            {proj.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. PROJECT DETAIL SLIDE-OVER CHECKLIST PANEL (Screenshot 2026-07-07 012323.png layout adapted to projects) */}
      {selectedProject && (
        <div className="slide-over-overlay" onClick={() => setSelectedProject(null)}>
          <div 
            className="slide-over-container animate-slide-in" 
            onClick={(e) => e.stopPropagation()}
            style={{ direction: language === 'ar' ? 'rtl' : 'ltr' }}
          >
            
            {/* Header */}
            <div className="slide-over-header" style={{ paddingBottom: '16px' }}>
              <div className="client-badge-profile">
                <div className="project-breadcrumb-mini">
                  <span>{language === 'ar' ? 'المشاريع' : 'Projects'}</span>
                  <span className="breadcrumb-divider">/</span>
                  <span className="text-bold">{selectedProject.name}</span>
                </div>
              </div>
              <button onClick={() => setSelectedProject(null)} className="close-slide-over-btn" aria-label="Close">
                ✕
              </button>
            </div>

            {/* Content Body */}
            <div className="slide-over-content-body" style={{ padding: '0 24px 24px 24px' }}>
              
              <h2 className="task-detail-title-heading">{selectedProject.name}</h2>

              {/* Project Meta Stack */}
              <div className="task-properties-stack">
                <div className="property-item-row">
                  <div className="property-item-label">
                    <span>⚙</span>
                    <span>{language === 'ar' ? 'حالة العقد' : 'Status'}</span>
                  </div>
                  <div className="property-item-value">
                    <span className={`task-table-status-pill status-${selectedProject.status.toLowerCase().replace(/\s+/g, '')}`}>
                      {selectedProject.status}
                    </span>
                  </div>
                </div>

                <div className="property-item-row">
                  <div className="property-item-label">
                    <span>📅</span>
                    <span>{language === 'ar' ? 'الفترة' : 'Timeline'}</span>
                  </div>
                  <div className="property-item-value font-bold">
                    {selectedProject.start_date || 'Jul 1'} ➔ {selectedProject.end_date || 'Aug 30'}
                  </div>
                </div>

                <div className="property-item-row">
                  <div className="property-item-label">
                    <span>DZ</span>
                    <span>{language === 'ar' ? 'الميزانية' : 'Budget'}</span>
                  </div>
                  <div className="property-item-value font-bold text-green">
                    {selectedProject.price_dzd.toLocaleString()} DZ
                  </div>
                </div>

                <div className="property-item-row">
                  <div className="property-item-label">
                    <span>🏷️</span>
                    <span>{language === 'ar' ? 'التصنيف' : 'Category'}</span>
                  </div>
                  <div className="property-item-value">
                    <span className={`proj-category-badge category-${selectedProject.category.toLowerCase()}`}>
                      {selectedProject.category}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tasks / Milestones Checklist section */}
              <div className="task-description-box-area" style={{ marginTop: '20px' }}>
                <h4 className="ledger-sub-title">{language === 'ar' ? 'المهام ومراحل التنفيذ' : 'Tasks Checklist'}</h4>
                
                <div className="project-tasks-checkbox-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px', margin: '12px 0' }}>
                  {tasks.filter(t => t.project_id === selectedProject.id).length === 0 ? (
                    <p className="no-comments-placeholder">{language === 'ar' ? 'لا توجد مهام مضافة بعد للمشروع.' : 'No tasks created for this project.'}</p>
                  ) : (
                    tasks.filter(t => t.project_id === selectedProject.id).map(task => (
                      <label key={task.id} className="payment-receipt-row" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', border: '1px solid var(--border-color)', borderRadius: '6px', cursor: 'pointer' }}>
                        <input 
                          type="checkbox" 
                          checked={task.status === 'Complete'} 
                          onChange={() => handleToggleTaskStatus(task)}
                          style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                        />
                        <div style={{ flex: 1, textDecoration: task.status === 'Complete' ? 'line-through' : 'none', opacity: task.status === 'Complete' ? 0.6 : 1 }}>
                          <div style={{ fontWeight: 500, fontSize: '0.88rem' }}>{task.name}</div>
                          {task.due_date && <div style={{ fontSize: '0.72rem', color: 'var(--text-placeholder)' }}>📅 {task.due_date}</div>}
                        </div>
                        <span className={`task-table-status-pill status-${task.status.toLowerCase().replace(/\s+/g, '')}`} style={{ fontSize: '0.62rem', padding: '2px 6px' }}>
                          {task.status}
                        </span>
                      </label>
                    ))
                  )}
                </div>

                {/* Add task inline form inside slide-over */}
                <form 
                  onSubmit={(e) => handleAddTaskToProject(e, selectedProject.id)}
                  style={{ display: 'flex', gap: '8px', marginTop: '12px' }}
                >
                  <input 
                    type="text" 
                    placeholder={language === 'ar' ? 'أضف مهمة جديدة للمشروع...' : 'Add a new task to this project...'}
                    value={newTaskName}
                    onChange={(e) => setNewTaskName(e.target.value)}
                    style={{ flex: 1, padding: '8px 12px', border: '1.5px solid var(--border-color)', borderRadius: '6px', fontSize: '0.85rem' }}
                    required
                  />
                  <button type="submit" className="submit-btn compact-btn" style={{ whiteSpace: 'nowrap' }}>
                    {language === 'ar' ? 'إضافة' : 'Add'}
                  </button>
                </form>
              </div>

              {/* Description */}
              {selectedProject.description && (
                <div className="task-description-box-area" style={{ marginTop: '20px' }}>
                  <h4 className="ledger-sub-title">{language === 'ar' ? 'تفاصيل المشروع' : 'Description'}</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                    {selectedProject.description}
                  </p>
                </div>
              )}

            </div>

          </div>
        </div>
      )}

    </div>
  );
};
