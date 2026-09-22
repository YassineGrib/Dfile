import React, { useState } from 'react';
import { useLanguage } from './LanguageContext';
import { UserAvatar } from './UserAvatar';
import type { Project, Client, Payment, FreelancerProfile } from '../types';
import { 
  LayoutDashboard, Users, Calendar, 
  Settings, Plus, ChevronDown, ChevronRight,
  ClipboardList, Landmark, LayoutGrid, Banknote
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
  onOpenAddProject: () => void;
  onOpenAddClient: () => void;
  onOpenAddExpense: () => void;
  onOpenAddPayment?: () => void;
  projects: Project[];
  clients: Client[];
  payments?: Payment[];
  userProfile?: FreelancerProfile;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  onLogout,
  onOpenAddProject,
  onOpenAddExpense,
  projects,
  clients,
  payments = [],
  userProfile,
}) => {
  const { language } = useLanguage();

  // Collapsible workspace section states
  const [isActiveProjectsOpen, setIsActiveProjectsOpen] = useState(true);
  const [isInvoicesOpen, setIsInvoicesOpen] = useState(true);
  const [isExpensesOpen, setIsExpensesOpen] = useState(false);

  // Take first 3 projects for sidebar rendering
  const sidebarProjects = projects.slice(0, 3);

  const displayName = userProfile?.name?.trim() || 'Workspace User';
  const displayRole = userProfile?.designation?.trim() || (language === 'ar' ? 'حساب فريلانس' : 'Freelance Plan');

  return (
    <aside className="sidebar">
      
      {/* 1. USER PROFILE HEADER WITH BLOBATAR AVATAR */}
      <div className="sidebar-profile-header" onClick={onLogout} title={language === 'ar' ? 'تسجيل الخروج' : 'Logout'}>
        <UserAvatar name={displayName} size={38} animate="hover" />
        <div className="profile-info-column">
          <span className="profile-name-text">{displayName}</span>
          <span className="profile-plan-text">
            {displayRole}
          </span>
        </div>
        <div className="profile-select-chevrons">
          <ChevronDown size={14} />
        </div>
      </div>

      {/* 2. SEARCH BOX */}
      <div className="sidebar-search-box">
        <div className="search-inner">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <input 
            type="text" 
            className="search-input" 
            placeholder={language === 'ar' ? 'بحث سريع...' : 'Quick find'} 
            readOnly
          />
          <div className="shortcut-badges-row">
            <span className="shortcut-key">⌘</span>
            <span className="shortcut-key">K</span>
          </div>
        </div>
      </div>

      {/* Group 1: OVERVIEW & CLIENTS */}
      <div className="sidebar-section-container" style={{ marginBottom: '16px' }}>
        <span className="section-title-label" style={{ padding: '0 12px', marginBottom: '4px' }}>
          {language === 'ar' ? 'نظرة عامة والجهات' : 'Overview & Clients'}
        </span>
        <nav className="sidebar-nav-group" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {/* Dashboard */}
          <button
            onClick={() => onTabChange('dashboard')}
            className={`nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          >
            <span className="nav-icon">
              <LayoutDashboard size={16} />
            </span>
            <span className="nav-label">
              {language === 'ar' ? 'لوحة التحكم' : 'Dashboard'}
            </span>
            {projects.filter(p => p.status === 'In Progress').length > 0 && (
              <span className="nav-badge-purple">{projects.filter(p => p.status === 'In Progress').length}</span>
            )}
          </button>

          {/* Clients Hub */}
          <button
            onClick={() => onTabChange('clients')}
            className={`nav-btn ${activeTab === 'clients' ? 'active' : ''}`}
          >
            <span className="nav-icon">
              <Users size={16} />
            </span>
            <span className="nav-label">
              {language === 'ar' ? 'دليل العملاء' : 'Clients Hub'}
            </span>
            <div className="nav-avatar-stack" style={{ display: 'flex', alignItems: 'center' }}>
              {clients.slice(0, 2).map((c) => (
                <UserAvatar 
                  key={c.id} 
                  name={c.name} 
                  size={20} 
                  animate="hover"
                  style={{ marginLeft: '-4px', border: '1.5px solid white' }} 
                />
              ))}
              {clients.length > 2 && (
                <span className="stack-avatar count">+{clients.length - 2}</span>
              )}
            </div>
          </button>
        </nav>
      </div>

      {/* Group 2: PLANNING & PROJECTS */}
      <div className="sidebar-section-container" style={{ marginBottom: '16px' }}>
        <div className="section-header-row" style={{ padding: '0 12px', marginBottom: '4px' }}>
          <span className="section-title-label">
            {language === 'ar' ? 'المشاريع والجدولة' : 'Planning & Projects'}
          </span>
          <button onClick={onOpenAddProject} className="section-add-btn" title={language === 'ar' ? 'مشروع جديد' : 'New Project'}>
            <Plus size={13} />
          </button>
        </div>

        <nav className="sidebar-nav-group" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {/* All Projects Directory */}
          <button
            onClick={() => onTabChange('all-projects')}
            className={`nav-btn ${activeTab === 'all-projects' ? 'active' : ''}`}
          >
            <span className="nav-icon">
              <LayoutGrid size={16} />
            </span>
            <span className="nav-label">
              {language === 'ar' ? 'جميع المشاريع' : 'All Projects'}
            </span>
            <span className="nav-badge-purple">{projects.length}</span>
          </button>

          {/* Calendar & Deadlines */}
          <button
            onClick={() => onTabChange('calendar')}
            className={`nav-btn ${activeTab === 'calendar' ? 'active' : ''}`}
          >
            <span className="nav-icon">
              <Calendar size={16} />
            </span>
            <span className="nav-label">
              {language === 'ar' ? 'التقويم والمهام' : 'Calendar'}
            </span>
            {projects.filter(p => Boolean(p.end_date)).length > 0 && (
              <span className="nav-badge-orange">{projects.filter(p => Boolean(p.end_date)).length}</span>
            )}
          </button>

          {/* Active Projects Collapsible Folder */}
          <div className={`workspace-folder-group ${isActiveProjectsOpen ? 'open' : ''}`}>
            <button 
              onClick={() => setIsActiveProjectsOpen(!isActiveProjectsOpen)} 
              className="folder-toggle-btn"
              style={{ display: 'flex', alignItems: 'center', width: '100%', padding: '8px 12px' }}
            >
              <span style={{ display: 'inline-flex', transform: isActiveProjectsOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.15s ease' }}>
                <ChevronRight size={12} />
              </span>
              <span className="folder-label" style={{ flex: 1, paddingLeft: '6px' }}>
                {language === 'ar' ? 'المشاريع النشطة' : 'Active Projects'}
              </span>
            </button>
            
            {isActiveProjectsOpen && (
              <div className="workspace-tree-nested" style={{ paddingLeft: '24px' }}>
                {sidebarProjects.map((p) => (
                  <div key={p.id} className="tree-node-item" onClick={() => onTabChange('projects')} style={{ cursor: 'pointer', padding: '4px 0', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className="tree-square-bullet" style={{ width: '4px', height: '4px', background: 'var(--text-muted)', borderRadius: '50%' }}></span>
                    <span className="tree-item-label">{p.name}</span>
                  </div>
                ))}
                <div className="tree-node-item add-new-node" onClick={onOpenAddProject} style={{ cursor: 'pointer', padding: '4px 0', fontSize: '0.82rem', color: 'var(--accent-orange)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="tree-plus-icon">+</span>
                  <span className="tree-item-label">{language === 'ar' ? 'إضافة مشروع' : 'Add Project'}</span>
                </div>
              </div>
            )}
          </div>
        </nav>
      </div>

      {/* Group 3: FINANCIALS & AGREEMENTS */}
      <div className="sidebar-section-container" style={{ marginBottom: '16px' }}>
        <span className="section-title-label" style={{ padding: '0 12px', marginBottom: '4px' }}>
          {language === 'ar' ? 'المالية والاتفاقيات' : 'Financials & Contracts'}
        </span>

        <nav className="sidebar-nav-group" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {/* Payments & Inflow Ledger */}
          <button
            id="sidebarPaymentsBtn"
            onClick={() => onTabChange('payments')}
            className={`nav-btn ${activeTab === 'payments' ? 'active' : ''}`}
          >
            <span className="nav-icon">
              <Banknote size={16} />
            </span>
            <span className="nav-label">
              {language === 'ar' ? 'المدفوعات والتحصيلات' : 'Payments & Inflow'}
            </span>
            {payments.length > 0 && (
              <span className="nav-badge-purple" style={{ background: '#E2FFEF', color: '#0E4F2F' }}>
                {payments.length}
              </span>
            )}
          </button>

          {/* Contracts & AI Builder */}
          <button
            id="sidebarContractsBtn"
            onClick={() => onTabChange('contracts')}
            className={`nav-btn ${activeTab === 'contracts' ? 'active' : ''}`}
          >
            <span className="nav-icon">
              <ClipboardList size={16} />
            </span>
            <span className="nav-label">
              {language === 'ar' ? 'العقود والاتفاقيات' : 'Contracts Hub'}
            </span>
          </button>

          {/* Invoices & Quotes Collapsible */}
          <div className={`workspace-folder-group ${isInvoicesOpen ? 'open' : ''}`}>
            <button 
              onClick={() => setIsInvoicesOpen(!isInvoicesOpen)} 
              className="folder-toggle-btn"
              style={{ display: 'flex', alignItems: 'center', width: '100%', padding: '8px 12px' }}
            >
              <span style={{ display: 'inline-flex', transform: isInvoicesOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.15s ease' }}>
                <ChevronRight size={12} />
              </span>
              <span className="folder-label" style={{ flex: 1, paddingLeft: '6px' }}>
                {language === 'ar' ? 'الفواتير والأسعار' : 'Invoices & Quotes'}
              </span>
            </button>
            
            {isInvoicesOpen && (
              <div className="workspace-tree-nested" style={{ paddingLeft: '24px' }}>
                <div className="tree-node-item" onClick={() => onTabChange('invoices')} style={{ cursor: 'pointer', padding: '4px 0', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="tree-square-bullet" style={{ width: '4px', height: '4px', background: 'var(--text-muted)', borderRadius: '50%' }}></span>
                  <span className="tree-item-label">Proforma Quotes</span>
                </div>
                <div className="tree-node-item" onClick={() => onTabChange('invoices')} style={{ cursor: 'pointer', padding: '4px 0', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="tree-square-bullet" style={{ width: '4px', height: '4px', background: 'var(--text-muted)', borderRadius: '50%' }}></span>
                  <span className="tree-item-label">Final Invoices</span>
                </div>
              </div>
            )}
          </div>

          {/* Expenses & Outlays Collapsible */}
          <div className={`workspace-folder-group ${isExpensesOpen ? 'open' : ''}`}>
            <button 
              onClick={() => setIsExpensesOpen(!isExpensesOpen)} 
              className="folder-toggle-btn"
              style={{ display: 'flex', alignItems: 'center', width: '100%', padding: '8px 12px' }}
            >
              <span style={{ display: 'inline-flex', transform: isExpensesOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.15s ease' }}>
                <ChevronRight size={12} />
              </span>
              <span className="folder-label" style={{ flex: 1, paddingLeft: '6px' }}>
                {language === 'ar' ? 'المصاريف والتكاليف' : 'Expenses & Fees'}
              </span>
            </button>
            
            {isExpensesOpen && (
              <div className="workspace-tree-nested" style={{ paddingLeft: '24px' }}>
                <div className="tree-node-item" onClick={() => onTabChange('expenses')} style={{ cursor: 'pointer', padding: '4px 0', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="tree-square-bullet" style={{ width: '4px', height: '4px', background: 'var(--text-muted)', borderRadius: '50%' }}></span>
                  <span className="tree-item-label">Software Tools</span>
                </div>
                <div className="tree-node-item" onClick={() => onTabChange('expenses')} style={{ cursor: 'pointer', padding: '4px 0', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="tree-square-bullet" style={{ width: '4px', height: '4px', background: 'var(--text-muted)', borderRadius: '50%' }}></span>
                  <span className="tree-item-label">General Outlays</span>
                </div>
                <div className="tree-node-item add-new-node" onClick={onOpenAddExpense} style={{ cursor: 'pointer', padding: '4px 0', fontSize: '0.82rem', color: 'var(--accent-orange)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="tree-plus-icon">+</span>
                  <span className="tree-item-label">{language === 'ar' ? 'سجل مصاريف' : 'Add Expense'}</span>
                </div>
              </div>
            )}
          </div>
        </nav>
      </div>

      {/* Group 4: UTILITIES & SYSTEM */}
      <div className="sidebar-section-container bottom-utilities" style={{ marginTop: 'auto', marginBottom: '0' }}>
        <span className="section-title-label" style={{ padding: '0 12px', marginBottom: '4px' }}>
          {language === 'ar' ? 'النظام والأدوات' : 'System & Tools'}
        </span>
        <div className="utilities-links-list" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {/* CCP / PDF Import */}
          <button onClick={() => onTabChange('invoices')} className="utility-link-btn" style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px' }}>
            <span className="utility-icon">
              <Landmark size={16} />
            </span>
            <span className="utility-label">
              {language === 'ar' ? 'استيراد CCP / PDF' : 'CCP / PDF Import'}
            </span>
          </button>

          {/* Settings */}
          <button id="sidebarSettingsBtn" onClick={() => onTabChange('settings')} className="utility-link-btn" style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px' }}>
            <span className="utility-icon">
              <Settings size={16} />
            </span>
            <span className="utility-label">
              {language === 'ar' ? 'إعدادات النظام' : 'System Settings'}
            </span>
          </button>
        </div>
      </div>

    </aside>
  );
};
