import React, { useState, useRef } from 'react';
import { useLanguage } from './LanguageContext';
import type { Project, Client, Contract } from '../types';

interface ContractsViewProps {
  projects: Project[];
  clients: Client[];
  contractClauses?: string;
  freelancerProfile?: {
    name: string;
    designation: string;
    email: string;
    phone: string;
    address: string;
  };
  contracts?: Contract[];
  onAddContract?: (contract: Contract) => void;
  onUpdateContract?: (contract: Contract) => void;
  onDeleteContract?: (id: string) => void;
}

export const ContractsView: React.FC<ContractsViewProps> = ({
  projects,
  clients,
  contractClauses,
  freelancerProfile,
  contracts: externalContracts,
  onAddContract,
  onUpdateContract,
  onDeleteContract: _onDeleteContract,
}) => {
  const { language } = useLanguage();

  // Active view: 'list' | 'create'
  const [contractsTab, setContractsTab] = useState<'list' | 'create'>('list');

  // Real contracts from Firestore / props (clean empty default, zero fake seeds)
  const [localContracts, setLocalContracts] = useState<Contract[]>([]);
  const contracts = externalContracts ?? localContracts;

  // Selected contract for viewer panel
  const [selectedContractId, setSelectedContractId] = useState<string>('');
  const activeContract = contracts.find(c => c.id === selectedContractId) || contracts[0] || null;

  // AI Generator form inputs
  const [generatorClientId, setGeneratorClientId] = useState('');
  const [generatorProjectId, setGeneratorProjectId] = useState('');
  const [generatorScope, setGeneratorScope] = useState('');
  const [generatorTerms, setGeneratorTerms] = useState('50_50'); // upfront/completion
  const [generatorTone, setGeneratorTone] = useState('Corporate Legal');
  
  // AI generation simulation states
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);

  // Form custom contract details
  const [customTitle, setCustomTitle] = useState('');

  // Editing state for active viewer
  const [viewerContent, setViewerContent] = useState('');
  const [isEditingViewer, setIsEditingViewer] = useState(false);

  // Sharing toast notification
  const [shareToastOpen, setShareToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Reference to printable area
  const printableRef = useRef<HTMLDivElement>(null);

  // Set local state when active contract changes
  React.useEffect(() => {
    if (activeContract) {
      setViewerContent(activeContract.content);
    }
  }, [selectedContractId, contracts]);

  // Trigger Print Dialog
  const handlePrint = () => {
    window.print();
  };

  // Trigger Share simulated copy
  const handleShare = () => {
    const shareUrl = `${window.location.origin}/share/contract/${activeContract?.id || 'doc'}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setToastMessage(language === 'ar' ? 'تم نسخ رابط العقد للمشاركة بنجاح!' : 'Contract secure link copied to clipboard!');
      setShareToastOpen(true);
      setTimeout(() => setShareToastOpen(false), 3000);
    });
  };

  // AI contract generator simulation
  const handleGenerateAIContract = (e: React.FormEvent) => {
    e.preventDefault();
    if (!generatorClientId || !generatorProjectId) return;

    const clientObj = clients.find(c => c.id === generatorClientId);
    const projectObj = projects.find(p => p.id === generatorProjectId);
    if (!clientObj || !projectObj) return;

    setIsGenerating(true);
    setGenerationProgress(0);

    // Progress bar speed simulation
    const interval = setInterval(() => {
      setGenerationProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          
          // Generate unified layout text
          const paymentRule = 
            generatorTerms === '50_50' ? '50% deposit upfront and 50% upon final website delivery and approval.' :
            generatorTerms === 'milestones' ? '30% upfront, 40% on milestone approval, and 30% on production release.' :
            '100% full project payment upon complete launch and acceptance.';

          const flName = freelancerProfile?.name || 'Sadek Rahman';
          const flAddr = freelancerProfile?.address || 'Algiers, Algeria';
          const defaultClauses = `3. INTELLECTUAL PROPERTY & TRANSFER
All title, rights, and interest in and to the custom source code, assets, and layouts created under this project shall remain with the Freelancer until all outstanding invoices are cleared by the Client. Upon final settlement, full IP transfers automatically to the Client.

4. LIABILITY & WARRANTY
The Freelancer warrants that all deliverables are functional and built in accordance with modern standards. The Freelancer does not warrant uninterrupted error-free operation.`;
          const clausesSection = contractClauses || defaultClauses;

          const generatedText = `FREELANCE MASTER SERVICES AGREEMENT

Date: ${new Date().toISOString().split('T')[0]}
Document ID: CTR-${Math.floor(1000 + Math.random() * 9000)}

BETWEEN:
Freelancer: ${flName}, ${flAddr} ("Freelancer").
Client: ${clientObj.name}, ${clientObj.email || 'Independent Client'} ("Client").

1. ENGAGEMENT AND SCOPE OF WORK
The Client hereby engages the Freelancer to design and build the project: "${projectObj.name}". 
Specified Scope of Deliverables:
${generatorScope || 'Custom design templates, interactive user interfaces, animations, and database configurations as requested by the client.'}

2. COMPENSATION & PAYMENT TERMS
The Client shall pay the Freelancer a total contract sum of ${projectObj.price_dzd.toLocaleString()} DZ.
Payments shall be processed under the following terms:
- ${paymentRule}

${clausesSection}

5. SIGNATURES & EXECUTION
Both parties acknowledge they have read, understood, and agreed to this contract under ${generatorTone.toUpperCase()} regulations.

Freelancer Representative: ${flName}
Client Representative: ${clientObj.name} (Signed Electronically)`;

          // Create new contract record
          const newCtr: Contract = {
            id: `ctr_${Date.now()}`,
            title: customTitle || `${projectObj.name} Service Agreement`,
            project_id: generatorProjectId,
            client_id: generatorClientId,
            status: 'Draft',
            date_created: new Date().toISOString().split('T')[0],
            amount: projectObj.price_dzd,
            content: generatedText
          };

          if (onAddContract) {
            onAddContract(newCtr);
          } else {
            setLocalContracts([newCtr, ...contracts]);
          }
          setSelectedContractId(newCtr.id);
          setIsGenerating(false);
          setContractsTab('list');
          
          // Clear inputs
          setGeneratorScope('');
          setCustomTitle('');
          return 100;
        }
        return prev + 10;
      });
    }, 150);
  };

  const handleSaveChanges = () => {
    if (!activeContract) return;
    const updated = { ...activeContract, content: viewerContent };
    if (onUpdateContract) {
      onUpdateContract(updated);
    } else {
      setLocalContracts(contracts.map(c => c.id === activeContract.id ? updated : c));
    }
    setIsEditingViewer(false);
  };

  return (
    <div className="dashboard-content-area">
      
      {/* Toast alert */}
      {shareToastOpen && (
        <div className="share-toast-notification animate-fade-in">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header breadcrumb */}
      <div className="workspace-header-strip">
        <div className="project-breadcrumb">
          <span>{language === 'ar' ? 'العقود والاتفاقيات' : 'Contracts & Agreements'}</span>
          <span className="breadcrumb-divider">/</span>
          <span className="text-bold">{language === 'ar' ? 'إدارة العقود الذكية' : 'AI Contract Workspace'}</span>
        </div>
      </div>

      {/* Workspace top toolbar */}
      <div className="workspace-tabs-bar" style={{ marginBottom: '20px' }}>
        <div className="tabs-selector-group">
          <button 
            onClick={() => setContractsTab('list')}
            className={`workspace-tab-link ${contractsTab === 'list' ? 'active' : ''}`}
          >
            <span>{language === 'ar' ? 'العقود النشطة والمسودات' : 'Contracts list'}</span>
          </button>
          <button 
            onClick={() => setContractsTab('create')}
            className={`workspace-tab-link ${contractsTab === 'create' ? 'active' : ''}`}
          >
            <span style={{ color: 'var(--accent-orange)' }}>✨</span>
            <span>{language === 'ar' ? 'منشئ العقود بالذكاء الاصطناعي' : 'AI Contract Generator'}</span>
          </button>
        </div>
      </div>

      {contractsTab === 'list' ? (
        <div className="calendar-two-col-layout" style={{ gap: '24px' }}>
          
          {/* Left Column: Contracts list (40%) */}
          <div className="calendar-left-section" style={{ flex: '0 0 35%', maxWidth: '35%' }}>
            
            <div className="calendar-sidebar-card" style={{ padding: '16px', background: 'white' }}>
              <h3 className="ledger-sub-title" style={{ marginBottom: '16px', fontSize: '1rem' }}>
                {language === 'ar' ? 'قائمة العقود والمسودات' : 'My Contracts'}
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {contracts.length === 0 ? (
                  <div style={{ padding: '24px 12px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <p style={{ margin: '0 0 8px 0', fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-main)' }}>
                      {language === 'ar' ? 'لا توجد عقود مسجلة حالياً.' : 'No contracts registered yet.'}
                    </p>
                    <button 
                      onClick={() => setContractsTab('create')}
                      className="submit-btn compact-btn"
                      style={{ fontSize: '0.78rem', margin: '0 auto' }}
                    >
                      ✨ {language === 'ar' ? 'إنشاء عقد بالذكاء الاصطناعي' : 'Generate AI Contract'}
                    </button>
                  </div>
                ) : (
                  contracts.map(c => {
                  const client = clients.find(cl => cl.id === c.client_id);
                  const isSelected = c.id === selectedContractId;
                  
                  return (
                    <div 
                      key={c.id}
                      onClick={() => setSelectedContractId(c.id)}
                      className={`client-card-item ${isSelected ? 'active' : ''}`}
                      style={{ cursor: 'pointer', padding: '12px', border: '1.5px solid var(--border-color)', borderRadius: '8px' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-main)' }}>{c.title}</span>
                        <span className={`status-badge-inline ${c.status.toLowerCase()}`} style={{ fontSize: '0.65rem' }}>
                          {c.status}
                        </span>
                      </div>
                      
                      <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        <span>{client ? client.name : 'Independent'}</span>
                        <span style={{ fontWeight: 500 }}>{c.amount.toLocaleString()} DZ</span>
                      </div>
                    </div>
                  );
                }))}
              </div>
            </div>

            {/* Quick metrics */}
            <div className="calendar-sidebar-card" style={{ marginTop: '16px', background: 'white', padding: '16px' }}>
              <h4 className="sidebar-card-title" style={{ fontSize: '0.85rem' }}>{language === 'ar' ? 'ملخص المحفظة القانونية' : 'Legal Portfolio summary'}</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                  <span style={{ color: 'var(--text-placeholder)' }}>{language === 'ar' ? 'إجمالي العقود الموقعة' : 'Signed Contracts'}</span>
                  <span style={{ fontWeight: 500 }}>{contracts.filter(c => c.status === 'Signed').length}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                  <span style={{ color: 'var(--text-placeholder)' }}>{language === 'ar' ? 'إجمالي مسودات العمل' : 'Draft Agreements'}</span>
                  <span style={{ fontWeight: 500 }}>{contracts.filter(c => c.status === 'Draft').length}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                  <span style={{ color: 'var(--text-placeholder)' }}>{language === 'ar' ? 'القيمة القانونية الإجمالية' : 'Total Contract Value'}</span>
                  <span style={{ fontWeight: 500, color: 'var(--btn-primary)' }}>
                    {contracts.reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()} DZ
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Printable Contract Viewer (65%) */}
          <div className="calendar-right-section" style={{ flex: '0 0 62%', maxWidth: '62%' }}>
            {!activeContract ? (
              <div style={{ padding: '48px 24px', textAlign: 'center', background: 'var(--bg-card)', borderRadius: '12px', border: '1.5px dashed var(--border-color)', color: 'var(--text-muted)' }}>
                <p style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-main)', marginBottom: '8px' }}>
                  {language === 'ar' ? 'لم يتم اختيار أو إنشاء أي عقد' : 'No contract selected'}
                </p>
                <p style={{ fontSize: '0.82rem', marginBottom: '16px' }}>
                  {language === 'ar' ? 'استخدم منشئ العقود الذكي لإنشاء اتفاقية قانونية موثقة لمشاريعك.' : 'Use the AI Contract Generator to draft professional legal agreements for your projects.'}
                </p>
                <button onClick={() => setContractsTab('create')} className="submit-btn compact-btn" style={{ margin: '0 auto' }}>
                  ✨ {language === 'ar' ? 'منشئ العقود بالذكاء الاصطناعي' : 'AI Contract Generator'}
                </button>
              </div>
            ) : (
              <>
                {/* Viewer control toolbar */}
                <div className="contracts-viewer-toolbar" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                {isEditingViewer ? (
                  <>
                    <button onClick={handleSaveChanges} className="submit-btn compact-btn" style={{ background: 'var(--accent-orange)' }}>
                      💾 {language === 'ar' ? 'حفظ التعديلات' : 'Save Changes'}
                    </button>
                    <button onClick={() => { setViewerContent(activeContract.content); setIsEditingViewer(false); }} className="clear-search-btn" style={{ padding: '0 12px' }}>
                      {language === 'ar' ? 'إلغاء' : 'Cancel'}
                    </button>
                  </>
                ) : (
                  <button onClick={() => setIsEditingViewer(true)} className="submit-btn compact-btn" style={{ background: 'var(--bg-card)', border: '1.5px solid var(--border-color)', color: 'var(--text-main)' }}>
                    📝 {language === 'ar' ? 'تعديل البنود' : 'Edit clauses'}
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={handleShare} className="submit-btn compact-btn" style={{ background: 'white', color: 'var(--text-main)', border: '1.5px solid var(--border-color)' }}>
                  🔗 {language === 'ar' ? 'مشاركة رابط آمن' : 'Share Link'}
                </button>
                <button onClick={handlePrint} className="submit-btn compact-btn">
                  🖨️ {language === 'ar' ? 'طباعة / حفظ PDF' : 'Print / Save PDF'}
                </button>
              </div>
            </div>

            {/* Document Paper Container */}
            <div className="printable-contract-document-wrapper">
              <div ref={printableRef} className="printable-contract-document">
                {isEditingViewer ? (
                  <textarea 
                    value={viewerContent}
                    onChange={(e) => setViewerContent(e.target.value)}
                    className="contract-textarea-editor"
                    style={{ 
                      width: '100%', 
                      height: '600px', 
                      fontFamily: 'var(--font-mono)', 
                      fontSize: '0.85rem', 
                      lineHeight: 1.6,
                      border: 'none', 
                      outline: 'none',
                      resize: 'vertical',
                      backgroundColor: 'transparent'
                    }}
                  />
                ) : (
                  <pre 
                    style={{ 
                      whiteSpace: 'pre-wrap', 
                      fontFamily: 'Georgia, serif', 
                      fontSize: '0.9rem', 
                      lineHeight: 1.7, 
                      color: '#222' 
                    }}
                  >
                    {viewerContent}
                  </pre>
                )}
              </div>
            </div>
          </>
        )}
      </div>

    </div>
      ) : (
        /* AI Generator Wizard */
        <div className="calendar-sidebar-card" style={{ background: 'white', padding: '24px', borderRadius: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <span style={{ fontSize: '1.75rem' }}>🤖</span>
            <div>
              <h3 className="ledger-sub-title" style={{ fontSize: '1.1rem', margin: 0 }}>
                {language === 'ar' ? 'منشئ العقود والاتفاقيات بالذكاء الاصطناعي' : 'AI Contract Generator Wizard'}
              </h3>
              <p className="availability-subtitle" style={{ fontSize: '0.8rem', color: 'var(--text-placeholder)', margin: '4px 0 0 0' }}>
                {language === 'ar'
                  ? 'أدخل المعطيات الأساسية ليقوم المساعد بصياغة عقد قانوني مهني بأسلوب فني موحد'
                  : 'Provide core inputs and let AI generate a legally standard contract with unified branding styles.'
                }
              </p>
            </div>
          </div>

          <form onSubmit={handleGenerateAIContract} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group-item">
                <label>{language === 'ar' ? 'عنوان العقد (اختياري)' : 'Contract Title (Optional)'}</label>
                <input 
                  type="text"
                  placeholder={language === 'ar' ? 'مثال: اتفاقية تصميم موقع ديكابايت' : 'e.g., DecaByte Design Agreement'}
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="milestone-form-input"
                />
              </div>

              <div className="form-group-item">
                <label>{language === 'ar' ? 'العميل المتعاقد' : 'Contracting Client'}</label>
                <select 
                  value={generatorClientId}
                  onChange={(e) => setGeneratorClientId(e.target.value)}
                  required
                  className="milestone-form-select"
                >
                  <option value="">{language === 'ar' ? 'اختر العميل...' : 'Select client...'}</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group-item">
                <label>{language === 'ar' ? 'المشروع المرتبط' : 'Associated Project'}</label>
                <select 
                  value={generatorProjectId}
                  onChange={(e) => setGeneratorProjectId(e.target.value)}
                  required
                  className="milestone-form-select"
                >
                  <option value="">{language === 'ar' ? 'اختر المشروع...' : 'Select project...'}</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.price_dzd.toLocaleString()} DZ)</option>
                  ))}
                </select>
              </div>

              <div className="form-group-item">
                <label>{language === 'ar' ? 'هيكلة الدفعات والبنود المالية' : 'Payment Milestone Terms'}</label>
                <select 
                  value={generatorTerms}
                  onChange={(e) => setGeneratorTerms(e.target.value)}
                  className="milestone-form-select"
                >
                  <option value="50_50">{language === 'ar' ? '50% مقدم / 50% عند التسليم' : '50% Upfront / 50% Completion'}</option>
                  <option value="milestones">{language === 'ar' ? 'أقساط مجزأة (30% / 40% / 30%)' : 'Milestones Split (30% / 40% / 30%)'}</option>
                  <option value="100">{language === 'ar' ? '100% دفعة كاملة بعد القبول النهائي' : '100% full payment upon completion'}</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group-item">
                <label>{language === 'ar' ? 'الأسلوب القانوني والصياغة' : 'Drafting Tone & Regulation'}</label>
                <select 
                  value={generatorTone}
                  onChange={(e) => setGeneratorTone(e.target.value)}
                  className="milestone-form-select"
                >
                  <option value="Corporate Legal">{language === 'ar' ? 'قانوني رسمي وشركة' : 'Corporate Legal terms'}</option>
                  <option value="Creative Partnership">{language === 'ar' ? 'شراكة إبداعية مرنة' : 'Creative Flexible Partnership'}</option>
                  <option value="Strict NDA Compliance">{language === 'ar' ? 'التزام صارم بحماية السرية والـ NDA' : 'Strict NDA Compliance terms'}</option>
                </select>
              </div>

              <div className="form-group-item">
                <label>{language === 'ar' ? 'تفاصيل نطاق العمل والمهام' : 'Scope of Work Description'}</label>
                <textarea 
                  placeholder={language === 'ar' ? 'مثال: تصميم وتطوير واجهات المستخدم، تفعيل المدفوعات، تهيئة محركات البحث...' : 'e.g., custom UI designs, responsive mobile layout, hosting setup...'}
                  value={generatorScope}
                  onChange={(e) => setGeneratorScope(e.target.value)}
                  className="milestone-form-input"
                  style={{ height: '42px', minHeight: '42px', padding: '10px' }}
                />
              </div>
            </div>

            {isGenerating ? (
              <div style={{ marginTop: '12px' }}>
                <div className="availability-progress-capsule" style={{ height: '24px' }}>
                  <div className="availability-progress-fill" style={{ width: `${generationProgress}%`, backgroundColor: 'var(--accent-orange)' }}></div>
                  <span className="availability-percent-text">{language === 'ar' ? `جاري الصياغة والتحليل بالذكاء الاصطناعي... ${generationProgress}%` : `AI Drafting Contract... ${generationProgress}%`}</span>
                </div>
              </div>
            ) : (
              <button type="submit" className="submit-btn" style={{ alignSelf: 'flex-start', marginTop: '10px', padding: '12px 24px' }}>
                ✨ {language === 'ar' ? 'إنشاء العقد وتوثيقه بالذكاء الاصطناعي' : 'Draft Contract with AI Helper'}
              </button>
            )}

          </form>
        </div>
      )}

    </div>
  );
};
