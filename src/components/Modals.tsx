import React, { useState } from 'react';
import { useLanguage } from './LanguageContext';
import type { Client, Project, ProjectStatus, Expense } from '../types';

interface AddProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: Client[];
  onAddProject: (project: Project, tasks: string[]) => void;
  onQuickAddClient: (name: string) => Client;
  categories: string[];
}

export const AddProjectModal: React.FC<AddProjectModalProps> = ({
  isOpen,
  onClose,
  clients,
  onAddProject,
  onQuickAddClient,
  categories,
}) => {
  const { language } = useLanguage();
  const [step, setStep] = useState(1);

  // Step 1 states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Development');

  // Step 2 states
  const [clientId, setClientId] = useState('');
  const [priceDzd, setPriceDzd] = useState('');
  const [showQuickClient, setShowQuickClient] = useState(false);
  const [quickClientName, setQuickClientName] = useState('');

  // Step 3 states
  const [taskInput, setTaskInput] = useState('');
  const [tasks, setTasks] = useState<string[]>([]);

  // Step 4 states
  const [status, setStatus] = useState<ProjectStatus>('In Progress');
  const [progress, setProgress] = useState(0);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  if (!isOpen) return null;

  const handleAddTask = () => {
    if (taskInput.trim()) {
      setTasks([...tasks, taskInput.trim()]);
      setTaskInput('');
    }
  };

  const handleRemoveTask = (index: number) => {
    setTasks(tasks.filter((_, i) => i !== index));
  };

  const handleQuickClientSubmit = (e: React.MouseEvent) => {
    e.preventDefault();
    if (quickClientName.trim()) {
      const newClient = onQuickAddClient(quickClientName.trim());
      setClientId(newClient.id);
      setQuickClientName('');
      setShowQuickClient(false);
    }
  };

  const handleNext = () => {
    if (step === 1 && !name) return;
    if (step === 2 && (!clientId || !priceDzd)) return;
    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const project: Project = {
      id: 'proj_' + Math.random().toString(36).substr(2, 9),
      name,
      description,
      category,
      client_id: clientId,
      price_dzd: parseFloat(priceDzd) || 0,
      status,
      progress_percentage: progress,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
      created_at: new Date().toISOString(),
    };

    onAddProject(project, tasks);
    
    // Reset all states
    setName('');
    setDescription('');
    setCategory('Development');
    setClientId('');
    setPriceDzd('');
    setTasks([]);
    setStatus('In Progress');
    setProgress(0);
    setStartDate('');
    setEndDate('');
    setStep(1);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        
        {/* Modal Header */}
        <div className="modal-header">
          <h3 className="modal-title">
            {language === 'ar' ? 'إضافة مشروع جديد' : 'Add New Project'}
          </h3>
          <button onClick={onClose} className="modal-close-btn" aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        {/* Steps indicator */}
        <div className="modal-steps-indicator">
          {[1, 2, 3, 4].map((s) => (
            <div 
              key={s} 
              className={`step-dot ${step === s ? 'active' : ''} ${step > s ? 'completed' : ''}`}
            >
              <span className="step-num">{step > s ? '✓' : s}</span>
              <span className="step-label">
                {s === 1 && (language === 'ar' ? 'التفاصيل' : 'Details')}
                {s === 2 && (language === 'ar' ? 'العميل والسعر' : 'Client & Cost')}
                {s === 3 && (language === 'ar' ? 'المهام' : 'Tasks')}
                {s === 4 && (language === 'ar' ? 'الحالة' : 'Status')}
              </span>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="modal-form-content">
          
          {/* STEP 1: Basic Info */}
          {step === 1 && (
            <div className="modal-step-body animate-slide-in">
              <div className="form-group">
                <label className="form-label">{language === 'ar' ? 'اسم المشروع' : 'Project Name'} *</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={language === 'ar' ? 'مثال: تصميم تطبيق DecaByte' : 'e.g. DecaByte Design'}
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">{language === 'ar' ? 'التصنيف' : 'Category'}</label>
                <select 
                  className="form-input" 
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">{language === 'ar' ? 'الوصف' : 'Description'}</label>
                <textarea 
                  className="form-input" 
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={language === 'ar' ? 'اكتب نبذة مختصرة عن المشروع...' : 'Enter project overview...'}
                />
              </div>
            </div>
          )}

          {/* STEP 2: Client & Pricing */}
          {step === 2 && (
            <div className="modal-step-body animate-slide-in">
              <div className="form-group">
                <div className="label-row">
                  <label className="form-label">{language === 'ar' ? 'العميل' : 'Client'} *</label>
                  <button 
                    type="button" 
                    onClick={() => setShowQuickClient(!showQuickClient)}
                    className="form-link"
                  >
                    {showQuickClient 
                      ? (language === 'ar' ? 'اختر عميل متوفر' : 'Select client') 
                      : (language === 'ar' ? '+ إضافة عميل سريع' : '+ Quick add client')}
                  </button>
                </div>

                {!showQuickClient ? (
                  <select 
                    className="form-input"
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    required
                  >
                    <option value="">{language === 'ar' ? '-- اختر عميل --' : '-- Choose client --'}</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                ) : (
                  <div className="quick-client-add-row">
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder={language === 'ar' ? 'اسم العميل الجديد' : 'New client name'}
                      value={quickClientName}
                      onChange={(e) => setQuickClientName(e.target.value)}
                    />
                    <button 
                      type="button" 
                      onClick={handleQuickClientSubmit} 
                      className="submit-btn compact-btn"
                    >
                      {language === 'ar' ? 'إضافة' : 'Add'}
                    </button>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">{language === 'ar' ? 'ميزانية المشروع (DZ)' : 'Project Budget (DZD)'} *</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={priceDzd}
                  onChange={(e) => setPriceDzd(e.target.value)}
                  placeholder="50,000"
                  required 
                />
              </div>
            </div>
          )}

          {/* STEP 3: Tasks list */}
          {step === 3 && (
            <div className="modal-step-body animate-slide-in">
              <div className="form-group">
                <label className="form-label">{language === 'ar' ? 'إضافة مهام فرعية (اختياري)' : 'Add Sub-tasks (Optional)'}</label>
                <div className="task-input-row">
                  <input 
                    type="text" 
                    className="form-input" 
                    value={taskInput}
                    onChange={(e) => setTaskInput(e.target.value)}
                    placeholder={language === 'ar' ? 'مثال: تصميم نموذج الشعار الأول' : 'e.g. Logo mockup sketches'}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTask(); } }}
                  />
                  <button type="button" onClick={handleAddTask} className="submit-btn compact-btn">
                    +
                  </button>
                </div>
              </div>

              <div className="tasks-preview-list">
                {tasks.length === 0 ? (
                  <p className="no-tasks-text">
                    {language === 'ar' ? 'لا توجد مهام مضافة بعد.' : 'No sub-tasks added yet.'}
                  </p>
                ) : (
                  tasks.map((t, idx) => (
                    <div key={idx} className="task-preview-item">
                      <span className="task-num-label">#{idx + 1}</span>
                      <span className="task-preview-name">{t}</span>
                      <button 
                        type="button" 
                        onClick={() => handleRemoveTask(idx)} 
                        className="task-remove-btn"
                      >
                        ✕
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* STEP 4: Status & Dates */}
          {step === 4 && (
            <div className="modal-step-body animate-slide-in">
              <div className="form-group">
                <label className="form-label">{language === 'ar' ? 'حالة المشروع' : 'Project Status'}</label>
                <select 
                  className="form-input" 
                  value={status}
                  onChange={(e) => {
                    const newStatus = e.target.value as ProjectStatus;
                    setStatus(newStatus);
                    if (newStatus === 'Completed' || newStatus === 'Delivered') {
                      setProgress(100);
                    }
                  }}
                >
                  <option value="Planned">{language === 'ar' ? 'مخطط له (Planned)' : 'Planned'}</option>
                  <option value="In Progress">{language === 'ar' ? 'قيد التنفيذ (In Progress)' : 'In Progress'}</option>
                  <option value="Waiting Client">{language === 'ar' ? 'بانتظار العميل (Waiting)' : 'Waiting Client'}</option>
                  <option value="Completed">{language === 'ar' ? 'مكتمل (Completed)' : 'Completed'}</option>
                  <option value="Delivered">{language === 'ar' ? 'تم التسليم (Delivered)' : 'Delivered'}</option>
                  <option value="Cancelled">{language === 'ar' ? 'ملغي (Cancelled)' : 'Cancelled'}</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">{language === 'ar' ? 'نسبة الإنجاز (%)' : 'Progress Percentage (%)'}</label>
                <div className="range-slider-row">
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    className="slider-range" 
                    value={progress}
                    onChange={(e) => setProgress(parseInt(e.target.value))}
                  />
                  <span className="slider-value-text">{progress}%</span>
                </div>
              </div>

              <div className="modal-dates-row">
                <div className="form-group">
                  <label className="form-label">{language === 'ar' ? 'تاريخ البدء' : 'Start Date'}</label>
                  <input 
                    type="date" 
                    className="form-input" 
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">{language === 'ar' ? 'الموعد النهائي' : 'Deadline'}</label>
                  <input 
                    type="date" 
                    className="form-input" 
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Modal Footer Controls */}
          <div className="modal-footer">
            {step > 1 && (
              <button type="button" onClick={handleBack} className="btn-secondary">
                {language === 'ar' ? 'السابق' : 'Back'}
              </button>
            )}
            
            {step < 4 ? (
              <button 
                type="button" 
                onClick={handleNext} 
                className="submit-btn"
                disabled={(step === 1 && !name) || (step === 2 && (!clientId || !priceDzd))}
              >
                {language === 'ar' ? 'التالي' : 'Next'}
              </button>
            ) : (
              <button type="submit" className="submit-btn primary-submit">
                {language === 'ar' ? 'حفظ المشروع' : 'Save Project'}
              </button>
            )}
          </div>
        </form>

      </div>
    </div>
  );
};

// Add Client Slide-over Panel (replaces centered modal)
interface AddClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddClient: (
    name: string,
    email: string,
    phone: string,
    address?: string,
    notes?: string,
    social_links?: { linkedin?: string; twitter?: string; github?: string; website?: string }
  ) => void;
}

export const AddClientModal: React.FC<AddClientModalProps> = ({ isOpen, onClose, onAddClient }) => {
  const { language } = useLanguage();
  const [mode, setMode] = useState<'quick' | 'advanced'>('quick');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  // Social states
  const [linkedin, setLinkedin] = useState('');
  const [twitter, setTwitter] = useState('');
  const [github, setGithub] = useState('');
  const [website, setWebsite] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      const social = (linkedin || twitter || github || website) ? {
        linkedin: linkedin.trim() || undefined,
        twitter: twitter.trim() || undefined,
        github: github.trim() || undefined,
        website: website.trim() || undefined,
      } : undefined;

      onAddClient(
        name.trim(),
        email.trim(),
        phone.trim(),
        mode === 'advanced' ? address.trim() || undefined : undefined,
        mode === 'advanced' ? notes.trim() || undefined : undefined,
        mode === 'advanced' ? social : undefined
      );

      // Reset
      setName('');
      setEmail('');
      setPhone('');
      setAddress('');
      setNotes('');
      setLinkedin('');
      setTwitter('');
      setGithub('');
      setWebsite('');
      onClose();
    }
  };

  return (
    <div className="slide-over-overlay" onClick={onClose}>
      <div 
        className="slide-over-container animate-slide-in" 
        onClick={(e) => e.stopPropagation()}
        style={{ direction: language === 'ar' ? 'rtl' : 'ltr' }}
      >
        
        {/* Header */}
        <div className="slide-over-header">
          <div className="client-badge-profile">
            <div className="profile-large-avatar" style={{ backgroundColor: 'var(--accent-orange)' }}>+</div>
            <div>
              <h3 className="profile-name-title">
                {language === 'ar' ? 'إضافة عميل جديد' : 'Add New Client'}
              </h3>
              <span className="profile-muted-date">
                {language === 'ar' ? 'سجل عميل جديد في مساحة العمل' : 'Add a new client ledger entry'}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="close-slide-over-btn" aria-label="Close">
            ✕
          </button>
        </div>

        {/* Mode Toggle Tabs */}
        <div className="modal-mode-toggle-bar">
          <button 
            type="button" 
            onClick={() => setMode('quick')}
            className={`mode-toggle-tab ${mode === 'quick' ? 'active' : ''}`}
          >
            {language === 'ar' ? 'الوضع السريع' : 'Quick Mode'}
          </button>
          <button 
            type="button" 
            onClick={() => setMode('advanced')}
            className={`mode-toggle-tab ${mode === 'advanced' ? 'active' : ''}`}
          >
            {language === 'ar' ? 'الوضع المتقدم' : 'Advanced Mode'}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="slide-over-content-body" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Name */}
            <div className="form-group">
              <label className="form-label">{language === 'ar' ? 'اسم العميل *' : 'Client Name *'}</label>
              <input 
                type="text" 
                id="modalClientName"
                className="form-input" 
                placeholder={language === 'ar' ? 'مثال: محمد البشير' : 'e.g. Mohamed Bachir'}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required 
              />
            </div>

            {/* Quick mode contact fields */}
            {mode === 'quick' && (
              <div className="modal-step-body animate-slide-in">
                <div className="form-group">
                  <label className="form-label">{language === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}</label>
                  <input 
                    type="email" 
                    id="modalClientEmail"
                    className="form-input" 
                    placeholder="client@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{language === 'ar' ? 'رقم الهاتف' : 'Phone Number'}</label>
                  <input 
                    type="tel" 
                    id="modalClientPhone"
                    className="form-input" 
                    placeholder="0550 00 00 00"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Advanced mode fields */}
            {mode === 'advanced' && (
              <div className="modal-step-body animate-slide-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                <div className="modal-dates-row">
                  <div className="form-group">
                    <label className="form-label">{language === 'ar' ? 'البريد الإلكتروني' : 'Email'}</label>
                    <input 
                      type="email" 
                      className="form-input" 
                      placeholder="client@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{language === 'ar' ? 'رقم الهاتف' : 'Phone'}</label>
                    <input 
                      type="tel" 
                      className="form-input" 
                      placeholder="0660 00 00 00"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">{language === 'ar' ? 'العنوان / المقر' : 'Physical Address'}</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder={language === 'ar' ? 'الجزائر العاصمة، الجزائر' : 'e.g. Algiers, Algeria'}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>

                {/* Social inputs */}
                <div className="form-group">
                  <label className="form-label">{language === 'ar' ? 'روابط شبكات التواصل' : 'Social Media Links'}</label>
                  <div className="social-inputs-stack">
                    <div className="social-input-row">
                      <span className="social-input-label">LinkedIn</span>
                      <input 
                        type="url" 
                        className="form-input" 
                        placeholder="https://linkedin.com/in/username"
                        value={linkedin}
                        onChange={(e) => setLinkedin(e.target.value)}
                      />
                    </div>
                    <div className="social-input-row">
                      <span className="social-input-label">Twitter</span>
                      <input 
                        type="url" 
                        className="form-input" 
                        placeholder="https://twitter.com/username"
                        value={twitter}
                        onChange={(e) => setTwitter(e.target.value)}
                      />
                    </div>
                    <div className="social-input-row">
                      <span className="social-input-label">GitHub</span>
                      <input 
                        type="url" 
                        className="form-input" 
                        placeholder="https://github.com/username"
                        value={github}
                        onChange={(e) => setGithub(e.target.value)}
                      />
                    </div>
                    <div className="social-input-row">
                      <span className="social-input-label">Website</span>
                      <input 
                        type="url" 
                        className="form-input" 
                        placeholder="https://company.com"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">{language === 'ar' ? 'ملاحظات / شروط خاصة' : 'Personal & Business Notes'}</label>
                  <textarea 
                    className="form-input" 
                    rows={3}
                    placeholder={language === 'ar' ? 'سجل أي تفاصيل إجرائية...' : 'Enter client details...'}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>

              </div>
            )}

          </div>

          {/* Footer controls inside slide-over */}
          <div className="modal-footer" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: 'auto' }}>
            <button type="button" onClick={onClose} className="btn-secondary">
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </button>
            <button type="submit" id="modalClientSubmit" className="submit-btn primary-submit" disabled={!name}>
              {language === 'ar' ? 'حفظ العميل' : 'Save Client'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

// Simple Add Expense Modal
interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  onAddExpense: (expense: Expense) => void;
}

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({ isOpen, onClose, projects, onAddExpense }) => {
  const { language } = useLanguage();
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Software/Tools');
  const [projectId, setProjectId] = useState('');
  const [description, setDescription] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount) {
      const exp: Expense = {
        id: 'exp_' + Math.random().toString(36).substr(2, 9),
        amount: parseFloat(amount),
        project_id: projectId || undefined,
        category,
        description: description.trim() || undefined,
        expense_date: new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString(),
      };
      onAddExpense(exp);
      setAmount('');
      setCategory('Software/Tools');
      setProjectId('');
      setDescription('');
      onClose();
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container small-modal">
        <div className="modal-header">
          <h3 className="modal-title">
            {language === 'ar' ? 'تسجيل مصاريف جديدة' : 'Add New Expense'}
          </h3>
          <button onClick={onClose} className="modal-close-btn" aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form-content">
          <div className="form-group">
            <label className="form-label">{language === 'ar' ? 'المبلغ (DZ)' : 'Amount (DZD)'} *</label>
            <input 
              type="number" 
              className="form-input" 
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="3,500" 
              required 
            />
          </div>

          <div className="form-group">
            <label className="form-label">{language === 'ar' ? 'التصنيف' : 'Category'}</label>
            <select 
              className="form-input" 
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="Software/Tools">{language === 'ar' ? 'برامج وأدوات' : 'Software/Tools'}</option>
              <option value="Hosting/Services">{language === 'ar' ? 'استضافة خدمات' : 'Hosting/Services'}</option>
              <option value="Equipment">{language === 'ar' ? 'معدات وأجهزة' : 'Equipment'}</option>
              <option value="Transportation">{language === 'ar' ? 'النقل والمواصلات' : 'Transportation'}</option>
              <option value="Marketing">{language === 'ar' ? 'إعلان وتسويق' : 'Marketing'}</option>
              <option value="Other">{language === 'ar' ? 'أخرى' : 'Other'}</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">{language === 'ar' ? 'ربط بمشروع (اختياري)' : 'Link to Project (Optional)'}</label>
            <select 
              className="form-input" 
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
            >
              <option value="">{language === 'ar' ? '-- عام (غير مرتبط بمشروع) --' : '-- General (Not Linked) --'}</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">{language === 'ar' ? 'التفاصيل / الملاحظات' : 'Details / Notes'}</label>
            <input 
              type="text" 
              className="form-input" 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={language === 'ar' ? 'مثال: اشتراك شهري في Figma' : 'e.g. Figma Monthly Pro Plan'} 
            />
          </div>

          <div className="modal-footer">
            <button type="submit" className="submit-btn primary-submit" disabled={!amount}>
              {language === 'ar' ? 'حفظ المصاريف' : 'Save Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
