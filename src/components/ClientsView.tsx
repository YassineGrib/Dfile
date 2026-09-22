import React, { useState } from 'react';
import { useLanguage } from './LanguageContext';
import { UserAvatar } from './UserAvatar';
import type { Client, Project, Payment, Expense } from '../types';

interface ClientsViewProps {
  clients: Client[];
  projects: Project[];
  payments: Payment[];
  expenses: Expense[];
  onOpenAddClient: () => void;
  onEditClient: (client: Client) => void;
  onDeleteClient: (clientId: string) => void;
}

export const ClientsView: React.FC<ClientsViewProps> = ({
  clients,
  projects,
  payments,
  expenses,
  onOpenAddClient,
  onEditClient,
  onDeleteClient,
}) => {
  const { language } = useLanguage();
  
  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'revenue' | 'newest'>('name');

  // Slide-over selected client state
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  // Slide-over delete client state
  const [deletingClientId, setDeletingClientId] = useState<string | null>(null);

  // Edit modal state
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [editMode, setEditMode] = useState<'quick' | 'advanced'>('quick');
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editLinkedin, setEditLinkedin] = useState('');
  const [editTwitter, setEditTwitter] = useState('');
  const [editGithub, setEditGithub] = useState('');
  const [editWebsite, setEditWebsite] = useState('');

  // Copy toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Helper to trigger temporary toast
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2000);
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    triggerToast(language === 'ar' ? `تم نسخ ${label}` : `Copied ${label}!`);
  };

  // 1. Calculate Client stats
  const getClientStats = (clientId: string) => {
    const clientProjects = projects.filter(p => p.client_id === clientId);
    const clientPayments = payments.filter(p => p.client_id === clientId);
    const totalRev = clientPayments.reduce((acc, curr) => acc + curr.amount, 0);
    const activeCount = clientProjects.filter(p => p.status === 'In Progress' || p.status === 'Waiting Client').length;
    return {
      projectsCount: clientProjects.length,
      activeProjectsCount: activeCount,
      totalRevenue: totalRev,
    };
  };

  // 2. Filter & Sort logic
  const filteredClients = clients
    .filter(client => {
      // Search matches name, email, or phone
      const matchesSearch = 
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (client.email && client.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (client.phone && client.phone.includes(searchTerm));

      // Filter matches active projects
      const stats = getClientStats(client.id);
      if (filterType === 'active') {
        return matchesSearch && stats.activeProjectsCount > 0;
      }
      if (filterType === 'inactive') {
        return matchesSearch && stats.activeProjectsCount === 0;
      }
      return matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === 'revenue') {
        const revA = getClientStats(a.id).totalRevenue;
        const revB = getClientStats(b.id).totalRevenue;
        return revB - revA; // Descending
      }
      // newest date added
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  // Open Edit Modal & Populate fields
  const handleStartEdit = (client: Client, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingClient(client);
    setEditName(client.name);
    setEditEmail(client.email || '');
    setEditPhone(client.phone || '');
    setEditAddress(client.address || '');
    setEditNotes(client.notes || '');
    setEditLinkedin(client.social_links?.linkedin || '');
    setEditTwitter(client.social_links?.twitter || '');
    setEditGithub(client.social_links?.github || '');
    setEditWebsite(client.social_links?.website || '');
    setEditMode(client.address || client.notes || client.social_links ? 'advanced' : 'quick');
  };

  // Save Edit submit
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient) return;

    const updated: Client = {
      ...editingClient,
      name: editName,
      email: editEmail || undefined,
      phone: editPhone || undefined,
      address: editAddress || undefined,
      notes: editNotes || undefined,
      social_links: (editLinkedin || editTwitter || editGithub || editWebsite) ? {
        linkedin: editLinkedin || undefined,
        twitter: editTwitter || undefined,
        github: editGithub || undefined,
        website: editWebsite || undefined,
      } : undefined,
      updated_at: new Date().toISOString().split('T')[0]
    };

    onEditClient(updated);
    
    // Update active profile panel details if selected
    if (selectedClient && selectedClient.id === updated.id) {
      setSelectedClient(updated);
    }

    setEditingClient(null);
    triggerToast(language === 'ar' ? 'تم تحديث بيانات العميل بنجاح' : 'Client updated successfully');
  };

  const handleDeleteClick = (clientId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingClientId(clientId);
  };

  return (
    <div className="dashboard-content-area">
      
      {/* Toast Notification Pop-up */}
      {toastMessage && (
        <div className="toast-notification animate-slide-in">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Row */}
      <div className="view-header-row">
        <div>
          <h2 className="header-greeting-title">
            {language === 'ar' ? 'دليل العملاء' : 'Clients Directory'}
          </h2>
          <p className="header-greeting-subtitle">
            {language === 'ar' 
              ? `إجمالي المسجلين: ${clients.length} عميل في قاعدة بيانات DecaByte` 
              : `Total recorded: ${clients.length} clients in DecaByte directory.`}
          </p>
        </div>
        <button onClick={onOpenAddClient} className="submit-btn compact-btn">
          {language === 'ar' ? '+ إضافة عميل جديد' : '+ Add Client'}
        </button>
      </div>

      {/* Search and Filters Toolbar (Restrained Bento-strip) */}
      <div className="clients-toolbar-strip">
        {/* Search */}
        <div className="search-toolbar-input">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <input 
            type="text" 
            placeholder={language === 'ar' ? 'ابحث باسم العميل أو بريده أو هاتفه...' : 'Search by name, email, or phone...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="clear-search-btn">✕</button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="filter-pills-row">
          <button 
            onClick={() => setFilterType('all')} 
            className={`filter-pill-tab ${filterType === 'all' ? 'active' : ''}`}
          >
            {language === 'ar' ? 'الكل' : 'All'}
          </button>
          <button 
            onClick={() => setFilterType('active')} 
            className={`filter-pill-tab ${filterType === 'active' ? 'active' : ''}`}
          >
            {language === 'ar' ? 'نشط (مشاريع قائمة)' : 'Active Projects'}
          </button>
          <button 
            onClick={() => setFilterType('inactive')} 
            className={`filter-pill-tab ${filterType === 'inactive' ? 'active' : ''}`}
          >
            {language === 'ar' ? 'غير نشط' : 'No Active Projects'}
          </button>
        </div>

        {/* Sort selector */}
        <div className="sort-selector-wrapper">
          <label>{language === 'ar' ? 'ترتيب حسب:' : 'Sort by:'}</label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}>
            <option value="name">{language === 'ar' ? 'الاسم (أبجدي)' : 'Alphabetical'}</option>
            <option value="revenue">{language === 'ar' ? 'الأعلى دخلاً' : 'Revenue generated'}</option>
            <option value="newest">{language === 'ar' ? 'الأحدث إضافة' : 'Newest'}</option>
          </select>
        </div>
      </div>

      {/* Grid List View of Clients */}
      {filteredClients.length === 0 ? (
        <div className="empty-directory-card">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
          <h4>{language === 'ar' ? 'لم يتم العثور على عملاء' : 'No clients found'}</h4>
          <p>{language === 'ar' ? 'جرّب تعديل حقول البحث أو أضف عميلاً جديداً للمشروع.' : 'Try adjusting search queries or record a new client entry.'}</p>
        </div>
      ) : (
        <div className="clients-bento-grid">
          {filteredClients.map(client => {
            const stats = getClientStats(client.id);

            return (
              <div 
                key={client.id} 
                className="client-bento-card"
                onClick={() => setSelectedClient(client)}
              >
                {/* Upper row: Avatar & Profile Actions */}
                <div className="card-top-header">
                  <UserAvatar name={client.name} size={46} animate="hover" />
                  <div className="card-action-icons">
                    <button 
                      onClick={(e) => handleStartEdit(client, e)}
                      title={language === 'ar' ? 'تعديل البيانات' : 'Edit profile'}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    </button>
                    <button 
                      onClick={(e) => handleDeleteClick(client.id, e)}
                      className="delete-icon-btn"
                      title={language === 'ar' ? 'حذف العميل' : 'Delete client'}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                  </div>
                </div>

                {/* Name and Date */}
                <div className="client-identity-info">
                  <h4 className="client-display-name">{client.name}</h4>
                  <span className="client-date-added">
                    {language === 'ar' ? 'مسجل منذ:' : 'Added:'} {client.created_at}
                  </span>
                </div>

                {/* Footer strip: compact stats & small social dots */}
                <div className="client-card-footer-strip">
                  <div className="client-card-small-stats">
                    <span className="stat-value">{stats.totalRevenue.toLocaleString()} DZ</span>
                    <span className="stat-separator">•</span>
                    <span className={`stat-value ${stats.activeProjectsCount > 0 ? 'text-green' : ''}`}>
                      {stats.activeProjectsCount} {language === 'ar' ? 'مشاريع نشطة' : 'active projs'}
                    </span>
                  </div>

                  <div className="client-socials-mini-row">
                    {client.social_links?.linkedin && <span className="social-mini-dot linkedin" title="LinkedIn">in</span>}
                    {client.social_links?.twitter && <span className="social-mini-dot twitter" title="Twitter">𝕏</span>}
                    {client.social_links?.github && <span className="social-mini-dot github" title="GitHub">gh</span>}
                    {client.social_links?.website && <span className="social-mini-dot website" title="Website">🌐</span>}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3. RIGHT SLIDE-OVER DETAIL LEDGER PANEL */}
      {/* ------------------------------------------------------------- */}
      {selectedClient && (
        <div className="slide-over-overlay" onClick={() => setSelectedClient(null)}>
          <div 
            className="slide-over-container animate-slide-in" 
            onClick={(e) => e.stopPropagation()}
            style={{ direction: language === 'ar' ? 'rtl' : 'ltr' }}
          >
            
            {/* Header */}
            <div className="slide-over-header">
              <div className="client-badge-profile">
                <UserAvatar name={selectedClient.name} size={54} animate="hover" />
                <div>
                  <h3 className="profile-name-title">{selectedClient.name}</h3>
                  <span className="profile-muted-date">Joined: {selectedClient.created_at}</span>
                </div>
              </div>
              <button onClick={() => setSelectedClient(null)} className="close-slide-over-btn" aria-label="Close">
                ✕
              </button>
            </div>

            {/* Content Scroll */}
            <div className="slide-over-content-body">
              
              {/* SECTION A: Details Summary */}
              <div className="ledger-details-section">
                <h4 className="ledger-sub-title">{language === 'ar' ? 'بيانات الاتصال والعناوين' : 'Contact & Address'}</h4>
                <div className="ledger-info-grid">
                  
                  <div className="ledger-info-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span className="info-label">{language === 'ar' ? 'البريد الإلكتروني:' : 'Email Address:'}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="info-value text-bold select-all">{selectedClient.email || '-'}</span>
                      {selectedClient.email && (
                        <button 
                          className="copy-text-btn" 
                          onClick={() => handleCopy(selectedClient.email!, 'Email')}
                          title="Copy Email"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="ledger-info-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span className="info-label">{language === 'ar' ? 'الهاتف:' : 'Phone Number:'}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="info-value text-bold">{selectedClient.phone || '-'}</span>
                      {selectedClient.phone && (
                        <button 
                          className="copy-text-btn" 
                          onClick={() => handleCopy(selectedClient.phone!, 'Phone')}
                          title="Copy Phone"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="ledger-info-row">
                    <span className="info-label">{language === 'ar' ? 'العنوان المقر:' : 'Physical Address:'}</span>
                    <span className="info-value">{selectedClient.address || '-'}</span>
                  </div>
                </div>

                {selectedClient.notes && (
                  <div className="ledger-notes-box">
                    <h5 className="notes-box-header">{language === 'ar' ? 'ملاحظات العميل:' : 'Client Notes:'}</h5>
                    <p className="notes-box-content">{selectedClient.notes}</p>
                  </div>
                )}
              </div>

              {/* SECTION B: Client Ledger (Financial & project grid) */}
              <div className="ledger-details-section">
                <h4 className="ledger-sub-title">{language === 'ar' ? 'السجل المالي للمشروعات' : 'Project Financial Ledger'}</h4>
                
                {/* Client specific financial calculations */}
                {(() => {
                  const clientProjectsIds = projects.filter(p => p.client_id === selectedClient.id).map(p => p.id);
                  const clientExpenses = expenses.filter(e => e.project_id && clientProjectsIds.includes(e.project_id));
                  const totalClientExpenses = clientExpenses.reduce((acc, curr) => acc + curr.amount, 0);
                  const paymentsCleared = payments.filter(p => p.client_id === selectedClient.id).reduce((acc, curr) => acc + curr.amount, 0);
                  const clientProfitability = paymentsCleared - totalClientExpenses;
                  const isProfit = clientProfitability >= 0;

                  const totalBudget = projects
                    .filter(p => p.client_id === selectedClient.id)
                    .reduce((acc, curr) => acc + (curr.price_dzd || 0), 0);
                  const remainingDebt = Math.max(0, totalBudget - paymentsCleared);

                  return (
                    <>
                      <div className="ledger-financial-summary-row">
                        <div className="ledger-metric-tile">
                          <span className="tile-label">{language === 'ar' ? 'إجمالي ميزانية العقود' : 'Total Contract Budget'}</span>
                          <span className="tile-value">
                            {totalBudget.toLocaleString()} DZ
                          </span>
                        </div>

                        <div className="ledger-metric-tile">
                          <span className="tile-label">{language === 'ar' ? 'المدفوعات المستلمة' : 'Payments Cleared'}</span>
                          <span className="tile-value text-green">
                            {paymentsCleared.toLocaleString()} DZ
                          </span>
                        </div>
                      </div>

                      <div className="ledger-financial-summary-row" style={{ marginTop: '12px' }}>
                        <div className="ledger-metric-tile">
                          <span className="tile-label">{language === 'ar' ? 'المتبقي غير المحصّل' : 'Outstanding Balance'}</span>
                          <span className={`tile-value ${remainingDebt > 0 ? 'text-orange' : 'text-green'}`}>
                            {remainingDebt.toLocaleString()} DZ
                          </span>
                        </div>

                        <div className="ledger-metric-tile">
                          <span className="tile-label">{language === 'ar' ? 'صافي الربحية من العميل' : 'Net Client Profit'}</span>
                          <span className={`tile-value ${isProfit ? 'text-green' : 'text-red'}`}>
                            {clientProfitability.toLocaleString()} DZ
                          </span>
                        </div>
                      </div>
                    </>
                  );
                })()}

                {/* Client Projects List */}
                <h5 className="ledger-list-header">{language === 'ar' ? 'مشاريع العميل' : 'Associated Projects'}</h5>
                <div className="ledger-projects-list">
                  {projects.filter(p => p.client_id === selectedClient.id).length === 0 ? (
                    <p className="no-records-text">{language === 'ar' ? 'لا توجد مشاريع مسجلة لهذا العميل.' : 'No projects associated with this client.'}</p>
                  ) : (
                    projects
                      .filter(p => p.client_id === selectedClient.id)
                      .map(proj => (
                        <div key={proj.id} className="ledger-project-card-row">
                          <div className="proj-row-meta">
                            <span className="proj-row-name">{proj.name}</span>
                            <span className={`proj-row-status status-${proj.status.replace(/\s+/g, '-').toLowerCase()}`}>
                              {proj.status}
                            </span>
                          </div>
                          <div className="proj-row-finances">
                            <span>{language === 'ar' ? 'الميزانية:' : 'Budget:'} {proj.price_dzd.toLocaleString()} DZ</span>
                            <span>{proj.progress_percentage}% {language === 'ar' ? 'إنجاز' : 'Done'}</span>
                          </div>
                          {/* Progress bar fill */}
                          <div className="proj-row-progress-bar-bg">
                            <div className="proj-row-progress-bar-fill" style={{ width: `${proj.progress_percentage}%` }}></div>
                          </div>
                        </div>
                      ))
                  )}
                </div>

                {/* Client Payments History list */}
                <h5 className="ledger-list-header">{language === 'ar' ? 'سجل المدفوعات والتحصيلات المستلمة' : 'Collected Payments History'}</h5>
                <div className="ledger-payments-list">
                  {payments.filter(p => p.client_id === selectedClient.id).length === 0 ? (
                    <p className="no-records-text">{language === 'ar' ? 'لا توجد دفعات مستلمة حتى الآن.' : 'No payment records on file.'}</p>
                  ) : (
                    payments
                      .filter(p => p.client_id === selectedClient.id)
                      .map(pay => (
                        <div key={pay.id} className="ledger-payment-item-row">
                          <div className="pay-row-left">
                            <span className="pay-row-method">{pay.payment_method} ({pay.payment_type})</span>
                            <span className="pay-row-date">
                              {pay.payment_date} {pay.reference_number ? `• #${pay.reference_number}` : ''}
                            </span>
                          </div>
                          <span className="pay-row-amount">
                            +{pay.amount.toLocaleString()} DZ
                          </span>
                        </div>
                      ))
                  )}
                </div>

              </div>

            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 4. EDIT CLIENT MODAL (SUPPORT QUICK & ADVANCED MODES) */}
      {/* ------------------------------------------------------------- */}
      {editingClient && (
        <div className="slide-over-overlay" onClick={() => setEditingClient(null)}>
          <div 
            className="slide-over-container animate-slide-in" 
            onClick={(e) => e.stopPropagation()}
            style={{ direction: language === 'ar' ? 'rtl' : 'ltr' }}
          >
            
            {/* Header */}
            <div className="slide-over-header">
              <div className="client-badge-profile">
                <div className="profile-large-avatar" style={{ backgroundColor: 'var(--accent-purple)' }}>✎</div>
                <div>
                  <h3 className="profile-name-title">
                    {language === 'ar' ? 'تعديل بيانات العميل' : 'Edit Client Profile'}
                  </h3>
                  <span className="profile-muted-date">
                    {language === 'ar' ? 'تحديث السجل المالي ومعلومات الاتصال' : 'Update contact data and social links'}
                  </span>
                </div>
              </div>
              <button onClick={() => setEditingClient(null)} className="close-slide-over-btn" aria-label="Close">
                ✕
              </button>
            </div>

            {/* Quick vs Advanced Toggle Mode */}
            <div className="modal-mode-toggle-bar">
              <button 
                type="button" 
                onClick={() => setEditMode('quick')}
                className={`mode-toggle-tab ${editMode === 'quick' ? 'active' : ''}`}
              >
                {language === 'ar' ? 'الوضع السريع' : 'Quick Mode'}
              </button>
              <button 
                type="button" 
                onClick={() => setEditMode('advanced')}
                className={`mode-toggle-tab ${editMode === 'advanced' ? 'active' : ''}`}
              >
                {language === 'ar' ? 'الوضع المتقدم' : 'Advanced Mode'}
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="slide-over-content-body" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* Client Name (Required in both) */}
                <div className="form-group">
                  <label className="form-label">{language === 'ar' ? 'اسم العميل *' : 'Client Name *'}</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required 
                  />
                </div>

                {/* Quick Mode fields */}
                {editMode === 'quick' && (
                  <div className="modal-step-body animate-slide-in">
                    <div className="form-group">
                      <label className="form-label">{language === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}</label>
                      <input 
                        type="email" 
                        className="form-input" 
                        placeholder="client@company.com"
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">{language === 'ar' ? 'رقم الهاتف' : 'Phone Number'}</label>
                      <input 
                        type="tel" 
                        className="form-input" 
                        placeholder="0660 00 00 00"
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {/* Advanced Mode fields */}
                {editMode === 'advanced' && (
                  <div className="modal-step-body animate-slide-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    
                    <div className="modal-dates-row">
                      <div className="form-group">
                        <label className="form-label">{language === 'ar' ? 'البريد الإلكتروني' : 'Email'}</label>
                        <input 
                          type="email" 
                          className="form-input" 
                          placeholder="client@company.com"
                          value={editEmail}
                          onChange={(e) => setEditEmail(e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">{language === 'ar' ? 'رقم الهاتف' : 'Phone'}</label>
                        <input 
                          type="tel" 
                          className="form-input" 
                          placeholder="0660 00 00 00"
                          value={editPhone}
                          onChange={(e) => setEditPhone(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">{language === 'ar' ? 'العنوان / المقر' : 'Physical Address'}</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder={language === 'ar' ? 'الجزائر العاصمة، الجزائر' : 'e.g. Algiers, Algeria'}
                        value={editAddress}
                        onChange={(e) => setEditAddress(e.target.value)}
                      />
                    </div>

                    {/* Social Media Links group */}
                    <div className="form-group">
                      <label className="form-label">{language === 'ar' ? 'روابط شبكات التواصل' : 'Social Media Links'}</label>
                      <div className="social-inputs-stack">
                        <div className="social-input-row">
                          <span className="social-input-label">LinkedIn</span>
                          <input 
                            type="url" 
                            className="form-input" 
                            placeholder="https://linkedin.com/in/username"
                            value={editLinkedin}
                            onChange={(e) => setEditLinkedin(e.target.value)}
                          />
                        </div>
                        <div className="social-input-row">
                          <span className="social-input-label">Twitter / 𝕏</span>
                          <input 
                            type="url" 
                            className="form-input" 
                            placeholder="https://twitter.com/username"
                            value={editTwitter}
                            onChange={(e) => setEditTwitter(e.target.value)}
                          />
                        </div>
                        <div className="social-input-row">
                          <span className="social-input-label">GitHub</span>
                          <input 
                            type="url" 
                            className="form-input" 
                            placeholder="https://github.com/username"
                            value={editGithub}
                            onChange={(e) => setEditGithub(e.target.value)}
                          />
                        </div>
                        <div className="social-input-row">
                          <span className="social-input-label">Website</span>
                          <input 
                            type="url" 
                            className="form-input" 
                            placeholder="https://company.com"
                            value={editWebsite}
                            onChange={(e) => setEditWebsite(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">{language === 'ar' ? 'ملاحظات / شروط خاصة' : 'Personal & Business Notes'}</label>
                      <textarea 
                        className="form-input" 
                        rows={3}
                        placeholder={language === 'ar' ? 'سجل أي تفاصيل إجرائية أو شروط دفع متفق عليها...' : 'Enter client preferences, payment policies, etc.'}
                        value={editNotes}
                        onChange={(e) => setEditNotes(e.target.value)}
                      />
                    </div>

                  </div>
                )}

              </div>

              {/* Footer controls inside slide-over */}
              <div className="modal-footer" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: 'auto' }}>
                <button type="button" onClick={() => setEditingClient(null)} className="btn-secondary">
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button type="submit" className="submit-btn primary-submit" disabled={!editName}>
                  {language === 'ar' ? 'حفظ التعديلات' : 'Save Changes'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}
      {deletingClientId && (() => {
        const client = clients.find(c => c.id === deletingClientId);
        if (!client) return null;
        return (
          <div className="slide-over-overlay" onClick={() => setDeletingClientId(null)}>
            <div 
              className="slide-over-container animate-slide-in" 
              onClick={(e) => e.stopPropagation()}
              style={{ direction: language === 'ar' ? 'rtl' : 'ltr' }}
            >
              
              {/* Header */}
              <div className="slide-over-header" style={{ backgroundColor: '#FFF0F0', borderBottom: '1px solid #FFE0E0' }}>
                <div className="client-badge-profile">
                  <div className="profile-large-avatar" style={{ backgroundColor: '#D32F2F', color: 'white' }}>!</div>
                  <div>
                    <h3 className="profile-name-title" style={{ color: '#D32F2F' }}>
                      {language === 'ar' ? 'تأكيد حذف العميل' : 'Delete Client'}
                    </h3>
                    <span className="profile-muted-date" style={{ color: '#A31D1D' }}>
                      {language === 'ar' ? 'تحذير أمان: هذا الإجراء لا يمكن التراجع عنه' : 'Warning: This action is permanent'}
                    </span>
                  </div>
                </div>
                <button onClick={() => setDeletingClientId(null)} className="close-slide-over-btn" aria-label="Close">
                  ✕
                </button>
              </div>

              {/* Body */}
              <div className="slide-over-content-body" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ padding: '16px', border: '1px solid #FFE0E0', borderRadius: '12px', backgroundColor: '#FFF5F5', color: '#B82C2C', fontSize: '0.88rem', lineHeight: '1.5', fontWeight: '500' }}>
                  {language === 'ar' ? (
                    `أنت على وشك حذف ملف العميل "${client.name}" بالكامل من قاعدة بيانات DecaByte.`
                  ) : (
                    `You are about to delete client "${client.name}" from your workspace.`
                  )}
                  <br /><br />
                  {language === 'ar' ? (
                    'سيتم إلغاء ربط ملف العميل ومعلومات الاتصال وشبكات التواصل الخاصة به. البيانات التاريخية للفواتير والمدفوعات ستبقى مسجلة للنظام المحاسبي.'
                  ) : (
                    'All contact details and social media links will be permanently removed. Historic payments and ledger transactions will remain in financial archives.'
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="modal-footer" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: 'auto' }}>
                <button type="button" onClick={() => setDeletingClientId(null)} className="btn-secondary" style={{ flex: 1 }}>
                  {language === 'ar' ? 'إلغاء وتراجع' : 'Cancel'}
                </button>
                <button 
                  type="button" 
                  onClick={() => {
                    onDeleteClient(client.id);
                    if (selectedClient && selectedClient.id === client.id) {
                      setSelectedClient(null);
                    }
                    setDeletingClientId(null);
                    triggerToast(language === 'ar' ? 'تم حذف العميل بنجاح' : 'Client deleted successfully');
                  }} 
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
