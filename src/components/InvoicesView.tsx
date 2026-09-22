import React, { useState } from 'react';
import { useLanguage } from './LanguageContext';
import type { Invoice, Project, Client, Payment, InvoiceLineItem } from '../types';
import { 
  Search, Plus, Trash2, X, Printer, Share2, 
  Sparkles, FileText, Check, AlertTriangle
} from 'lucide-react';

interface InvoicesViewProps {
  invoices: Invoice[];
  projects: Project[];
  clients: Client[];
  payments: Payment[];
  onAddInvoice: (invoice: Invoice) => void;
  onDeleteInvoice: (invoiceId: string) => void;
}

export const InvoicesView: React.FC<InvoicesViewProps> = ({
  invoices,
  projects,
  clients,
  payments,
  onAddInvoice,
  onDeleteInvoice
}) => {
  const { language } = useLanguage();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [invoiceTypeFilter, setInvoiceTypeFilter] = useState<'all' | 'proforma' | 'final'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Slide-over states (Details, Add, Delete)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isAddingInvoice, setIsAddingExpense] = useState(false);
  const [deletingInvoiceId, setDeletingInvoiceId] = useState<string | null>(null);

  // Form states for creating new Invoice
  const [projectId, setProjectId] = useState('');
  const [invoiceType, setInvoiceType] = useState<'proforma' | 'final'>('proforma');
  const [dueDate, setDueDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('BaridiMob');
  const [notes, setNotes] = useState('');
  
  // Custom Line Items builder
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([
    { id: 'item_1', description: 'Initial Phase Development', quantity: 1, unit_price: 45000 }
  ]);
  const [itemDesc, setItemDesc] = useState('');
  const [itemQty, setItemQty] = useState('1');
  const [itemPrice, setItemPrice] = useState('');

  // Toast confirmation
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2000);
  };

  // Add Item to Line Items Builder
  const handleAddLineItem = () => {
    if (!itemDesc || !itemPrice) return;
    const newItem: InvoiceLineItem = {
      id: 'item_' + Math.random().toString(36).substr(2, 9),
      description: itemDesc.trim(),
      quantity: parseInt(itemQty) || 1,
      unit_price: parseFloat(itemPrice) || 0
    };
    setLineItems([...lineItems, newItem]);
    setItemDesc('');
    setItemQty('1');
    setItemPrice('');
  };

  // Remove Item
  const handleRemoveLineItem = (id: string) => {
    setLineItems(lineItems.filter(item => item.id !== id));
  };

  // Save new Invoice submit
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) return;

    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    const total = lineItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
    
    // Auto-generate invoice number (e.g. INV-2026-802)
    const randomNum = Math.floor(100 + Math.random() * 900);
    const invoiceNum = `${invoiceType === 'proforma' ? 'PROF' : 'INV'}-${new Date().getFullYear()}-${randomNum}`;

    const newInvoice: Invoice = {
      id: 'inv_' + Math.random().toString(36).substr(2, 9),
      invoice_number: invoiceNum,
      invoice_type: invoiceType,
      client_id: project.client_id,
      project_id: projectId,
      invoice_date: new Date().toISOString().split('T')[0],
      due_date: dueDate || undefined,
      total_amount: total,
      payment_method: paymentMethod,
      notes: notes.trim() || undefined,
      line_items: lineItems,
      status: invoiceType === 'proforma' ? 'sent' : 'draft',
      created_at: new Date().toISOString()
    };

    onAddInvoice(newInvoice);
    setIsAddingExpense(false);

    // Clear form
    setProjectId('');
    setInvoiceType('proforma');
    setDueDate('');
    setPaymentMethod('BaridiMob');
    setNotes('');
    setLineItems([{ id: 'item_1', description: 'Initial Phase Development', quantity: 1, unit_price: 45000 }]);

    triggerToast(language === 'ar' ? 'تم إنشاء الفاتورة وحفظها بنجاح!' : 'Invoice created successfully!');
  };

  // Delete Click Helper
  const handleDeleteClick = (invoiceId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingInvoiceId(invoiceId);
  };

  const handleConfirmDelete = (id: string) => {
    onDeleteInvoice(id);
    setDeletingInvoiceId(null);
    if (selectedInvoice && selectedInvoice.id === id) {
      setSelectedInvoice(null);
    }
    triggerToast(language === 'ar' ? 'تم حذف الفاتورة بنجاح' : 'Invoice deleted successfully.');
  };

  // Copy shareable link
  const handleCopyLink = (invoiceNum: string) => {
    const link = `https://decabyte.space/view/invoice/${invoiceNum}`;
    navigator.clipboard.writeText(link);
    triggerToast(language === 'ar' ? 'تم نسخ رابط الفاتورة الآمن للمشاركة!' : 'Secure sharing link copied to clipboard!');
  };

  // Print PDF helper
  const handlePrint = () => {
    window.print();
  };

  // Filter & Sort Invoices
  const filteredInvoices = invoices.filter(inv => {
    const project = projects.find(p => p.id === inv.project_id);
    const client = clients.find(c => c.id === inv.client_id);
    
    const matchesSearch = 
      inv.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (project && project.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (client && client.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType = 
      invoiceTypeFilter === 'all' || inv.invoice_type === invoiceTypeFilter;

    const matchesStatus = 
      statusFilter === 'all' || inv.status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  // Financial statistics calculated dynamically
  const proformaTotal = invoices.filter(i => i.invoice_type === 'proforma').reduce((acc, curr) => acc + curr.total_amount, 0);
  const finalTotal = invoices.filter(i => i.invoice_type === 'final').reduce((acc, curr) => acc + curr.total_amount, 0);
  const totalPaid = payments.reduce((acc, curr) => acc + curr.amount, 0);
  const totalPending = Math.max(0, finalTotal - totalPaid);

  return (
    <div className="dashboard-content-area">
      
      {/* Print stylesheet media overrides to print clean A4 paper layouts */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          /* Hide workspace dashboard elements */
          body * {
            visibility: hidden;
            background: transparent !important;
          }
          .printable-invoice-document, .printable-invoice-document * {
            visibility: visible;
          }
          .printable-invoice-document {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 20px !important;
            background: white !important;
            color: black !important;
            box-shadow: none !important;
            border: none !important;
          }
          /* Hide print button on PDF */
          .print-btn-strip {
            display: none !important;
          }
        }
      `}} />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="toast-notification animate-slide-in">
          <Check size={16} style={{ marginRight: '6px' }} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Breadcrumb */}
      <div className="workspace-header-strip">
        <div className="project-breadcrumb">
          <span>{language === 'ar' ? 'الفواتير والأسعار' : 'Invoices & Quotes'}</span>
          <span className="breadcrumb-divider">/</span>
          <span className="text-bold">{language === 'ar' ? 'عرض الحسابات والمالية' : 'Billing & Proposals'}</span>
        </div>

        <button onClick={() => setIsAddingExpense(true)} className="submit-btn compact-btn" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Plus size={16} />
          {language === 'ar' ? 'إنشاء فاتورة جديدة' : 'Create Invoice'}
        </button>
      </div>

      {/* Title block */}
      <div className="project-details-intro-block" style={{ marginBottom: '16px' }}>
        <div>
          <h2 className="project-title-heading">
            {language === 'ar' ? 'دفتر الفواتير وعروض الأسعار' : 'Billing Ledger & Quotes'}
          </h2>
          <p className="header-greeting-subtitle" style={{ margin: '4px 0 0 0' }}>
            {language === 'ar' ? 'إصدار عروض أسعار Proforma وتتبع سداد الفواتير النهائية للعملاء.' : 'Issue proforma proposals or track payment schedules of final invoices.'}
          </p>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="table-summary-strip" style={{ marginBottom: '20px' }}>
        <div className="summary-metric-tile">
          <span className="metric-tile-label">{language === 'ar' ? 'عروض الأسعار المعلقة' : 'Total Proposals (Proforma)'}</span>
          <span className="metric-tile-val text-orange" style={{ color: 'var(--accent-orange)' }}>
            {proformaTotal.toLocaleString()} DZ
          </span>
        </div>
        <div className="summary-metric-tile">
          <span className="metric-tile-label">{language === 'ar' ? 'إجمالي المفوتر النهائي' : 'Invoiced Revenue'}</span>
          <span className="metric-tile-val">
            {finalTotal.toLocaleString()} DZ
          </span>
        </div>
        <div className="summary-metric-tile">
          <span className="metric-tile-label">{language === 'ar' ? 'المدفوعات المحصلة' : 'Revenue Collected'}</span>
          <span className="metric-tile-val text-green" style={{ color: '#2E7D32' }}>
            {totalPaid.toLocaleString()} DZ
          </span>
        </div>
        <div className="summary-metric-tile">
          <span className="metric-tile-label">{language === 'ar' ? 'المستحقات المعلقة' : 'Pending Receivables'}</span>
          <span className="metric-tile-val text-red" style={{ color: '#D32F2F' }}>
            {totalPending.toLocaleString()} DZ
          </span>
        </div>
      </div>

      {/* Toolbar Strip */}
      <div className="clients-toolbar-strip" style={{ marginBottom: '20px' }}>
        <div className="search-toolbar-input">
          <Search size={15} />
          <input 
            type="text" 
            placeholder={language === 'ar' ? 'ابحث برقم الفاتورة، المشروع، العميل...' : 'Search invoice no., project, client...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="clear-search-btn">
              <X size={12} />
            </button>
          )}
        </div>

        <div className="filter-pills-row" style={{ gap: '8px' }}>
          <select 
            value={invoiceTypeFilter} 
            onChange={(e) => setInvoiceTypeFilter(e.target.value as any)}
            className="toolbar-select-filter"
            style={{ border: 'none', background: 'transparent', fontWeight: 500 }}
          >
            <option value="all">{language === 'ar' ? 'جميع الفواتير' : 'All Types'}</option>
            <option value="proforma">{language === 'ar' ? 'عرض سعر (Proforma)' : 'Quotes (Proforma)'}</option>
            <option value="final">{language === 'ar' ? 'فاتورة نهائية (Final)' : 'Invoices (Final)'}</option>
          </select>

          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="toolbar-select-filter"
            style={{ border: 'none', background: 'transparent', fontWeight: 500 }}
          >
            <option value="all">{language === 'ar' ? 'جميع الحالات' : 'All Statuses'}</option>
            <option value="draft">{language === 'ar' ? 'مسودة' : 'Draft'}</option>
            <option value="sent">{language === 'ar' ? 'مرسلة' : 'Sent'}</option>
            <option value="paid">{language === 'ar' ? 'مدفوعة' : 'Paid'}</option>
          </select>
        </div>
      </div>

      {/* Bento Grid layout of Invoices */}
      <div className="clients-grid-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
        {filteredInvoices.length === 0 ? (
          <div className="no-milestones-txt" style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px' }}>
            {language === 'ar' ? 'لم يتم العثور على أي فواتير مطابقة.' : 'No invoices on file.'}
          </div>
        ) : (
          filteredInvoices.map(inv => {
            const client = clients.find(c => c.id === inv.client_id);
            const project = projects.find(p => p.id === inv.project_id);

            return (
              <div 
                key={inv.id}
                onClick={() => setSelectedInvoice(inv)}
                className="client-bento-card"
                style={{ cursor: 'pointer' }}
              >
                {/* Upper header */}
                <div className="card-top-header">
                  <span className={`status-badge-inline ${inv.invoice_type === 'proforma' ? 'status-planned' : 'status-completed'}`} style={{ fontSize: '0.68rem', fontWeight: 500 }}>
                    {inv.invoice_type === 'proforma' ? 'Proforma' : 'Final Invoice'}
                  </span>
                  <div className="card-action-icons">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleCopyLink(inv.invoice_number); }}
                      title={language === 'ar' ? 'مشاركة الرابط' : 'Share secure link'}
                    >
                      <Share2 size={13} />
                    </button>
                    <button 
                      onClick={(e) => handleDeleteClick(inv.id, e)}
                      className="delete-icon-btn"
                      title={language === 'ar' ? 'حذف الفاتورة' : 'Delete'}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Main Body */}
                <div className="client-identity-info">
                  <span style={{ fontSize: '0.78rem', fontFamily: 'monospace', color: 'var(--text-placeholder)' }}>
                    {inv.invoice_number}
                  </span>
                  <h4 className="client-display-name" style={{ marginTop: '4px' }}>
                    {project ? project.name : 'Unknown Project'}
                  </h4>
                  <span style={{ fontSize: '1.1rem', fontWeight: 500, color: 'var(--text-main)', marginTop: '8px', display: 'block' }}>
                    {inv.total_amount.toLocaleString()} DZ
                  </span>
                </div>

                {/* Card footer */}
                <div className="client-card-footer-strip">
                  <div className="client-card-small-stats">
                    <span className="stat-value">{inv.invoice_date}</span>
                    <span className="stat-separator">•</span>
                    <span className="stat-value" style={{ textTransform: 'capitalize' }}>
                      {client ? client.name : 'Unknown Client'}
                    </span>
                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 1. SLIDE-OVER DETAIL & PRINT PREVIEW DRAWERS */}
      {/* ------------------------------------------------------------- */}
      {selectedInvoice && (
        <div className="slide-over-overlay" onClick={() => setSelectedInvoice(null)}>
          <div 
            className="slide-over-container animate-slide-in" 
            onClick={(e) => e.stopPropagation()}
            style={{ 
              direction: language === 'ar' ? 'rtl' : 'ltr',
              width: '800px',
              maxWidth: '90%',
            }}
          >
            {/* Header controls */}
            <div className="slide-over-header print-btn-strip">
              <div className="client-badge-profile">
                <div className="profile-large-avatar" style={{ backgroundColor: 'var(--bg-sidebar)', color: 'var(--accent-orange)' }}>
                  <FileText size={24} />
                </div>
                <div>
                  <h3 className="profile-name-title">{selectedInvoice.invoice_number}</h3>
                  <span className="profile-muted-date">{selectedInvoice.invoice_type === 'proforma' ? 'Proforma Quote' : 'Final Tax Invoice'}</span>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={handlePrint} className="submit-btn compact-btn" style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-card)', border: '1.5px solid var(--border-color)', color: 'var(--text-main)' }}>
                  <Printer size={15} />
                  {language === 'ar' ? 'طباعة PDF' : 'Print PDF'}
                </button>
                <button onClick={() => handleCopyLink(selectedInvoice.invoice_number)} className="submit-btn compact-btn" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Share2 size={15} />
                  {language === 'ar' ? 'مشاركة' : 'Share'}
                </button>
                <button onClick={() => setSelectedInvoice(null)} className="close-slide-over-btn" aria-label="Close" style={{ margin: 0, padding: '8px' }}>
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* A4 Paper Editorial Document Preview */}
            <div className="slide-over-content-body" style={{ background: '#F8F9FA', padding: '24px' }}>
              
              <div 
                className="printable-invoice-document"
                style={{
                  background: 'white',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                  padding: '40px',
                  fontFamily: '"Georgia", "Times New Roman", serif',
                  color: '#212529',
                  minHeight: '700px',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                {/* Brand Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2.5px solid #212529', paddingBottom: '20px', marginBottom: '24px' }}>
                  <div>
                    <h2 style={{ fontSize: '1.6rem', fontWeight: 500, margin: 0, fontFamily: 'monospace', letterSpacing: '-0.5px' }}>
                      DECABYTE
                    </h2>
                    <span style={{ fontSize: '0.8rem', color: '#6C757D', fontFamily: 'sans-serif' }}>
                      {language === 'ar' ? 'حلول البرمجيات الاحترافية' : 'Enterprise Digital Engineering'}
                    </span>
                  </div>
                  
                  <div style={{ textAlign: 'right' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 500, margin: 0, textTransform: 'uppercase' }}>
                      {selectedInvoice.invoice_type === 'proforma' ? 'Proforma Invoice' : 'Final Invoice'}
                    </h3>
                    <span style={{ fontSize: '0.82rem', color: '#495057', fontFamily: 'monospace' }}>
                      NO: {selectedInvoice.invoice_number}
                    </span>
                  </div>
                </div>

                {/* Contact Columns */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', fontSize: '0.88rem', fontFamily: 'sans-serif', marginBottom: '32px' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#6C757D', fontWeight: 500, display: 'block', marginBottom: '6px' }}>
                      From (Freelancer):
                    </span>
                    <strong style={{ display: 'block', fontSize: '0.9rem' }}>DecaByte Studio</strong>
                    <span style={{ display: 'block', marginTop: '2px' }}>Algiers, Algeria</span>
                    <span style={{ display: 'block' }}>contact@decabyte.space</span>
                    <span style={{ display: 'block' }}>+213 (0) 550 00 00 00</span>
                  </div>
                  
                  <div>
                    <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#6C757D', fontWeight: 500, display: 'block', marginBottom: '6px' }}>
                      Bill To (Client):
                    </span>
                    {(() => {
                      const client = clients.find(c => c.id === selectedInvoice.client_id);
                      if (!client) return <strong>-</strong>;
                      return (
                        <>
                          <strong style={{ display: 'block', fontSize: '0.9rem' }}>{client.name}</strong>
                          <span style={{ display: 'block', marginTop: '2px' }}>{client.address || 'Address on file'}</span>
                          <span style={{ display: 'block' }}>{client.email || '-'}</span>
                          <span style={{ display: 'block' }}>{client.phone || '-'}</span>
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* Dates & Payment Details */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', border: '1px solid #DEE2E6', borderRadius: '4px', padding: '12px', fontSize: '0.8rem', fontFamily: 'sans-serif', marginBottom: '32px', background: '#F8F9FA' }}>
                  <div>
                    <span style={{ color: '#6C757D', display: 'block' }}>Issue Date:</span>
                    <strong>{selectedInvoice.invoice_date}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#6C757D', display: 'block' }}>Due Date:</span>
                    <strong>{selectedInvoice.due_date || 'Due on receipt'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#6C757D', display: 'block' }}>Payment Method:</span>
                    <strong>{selectedInvoice.payment_method}</strong>
                  </div>
                </div>

                {/* Line Items Table */}
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem', fontFamily: 'sans-serif', marginBottom: '40px' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #212529', textAlign: 'left', fontWeight: 500 }}>
                      <th style={{ padding: '8px 0' }}>Description</th>
                      <th style={{ padding: '8px', textAlign: 'center' }}>Qty</th>
                      <th style={{ padding: '8px', textAlign: 'right' }}>Unit Price</th>
                      <th style={{ padding: '8px 0', textAlign: 'right' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedInvoice.line_items.map((item) => (
                      <tr key={item.id} style={{ borderBottom: '1px solid #DEE2E6' }}>
                        <td style={{ padding: '12px 0' }}>{item.description}</td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>{item.quantity}</td>
                        <td style={{ padding: '12px', textAlign: 'right' }}>{item.unit_price.toLocaleString()} DZ</td>
                        <td style={{ padding: '12px 0', textAlign: 'right', fontWeight: 500 }}>
                          {(item.quantity * item.unit_price).toLocaleString()} DZ
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Invoice Financial Summary Card */}
                <div style={{ marginLeft: 'auto', width: '300px', fontSize: '0.88rem', fontFamily: 'sans-serif', borderTop: '2px solid #212529', paddingTop: '12px', marginBottom: '40px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ color: '#6C757D' }}>Subtotal:</span>
                    <span>{selectedInvoice.total_amount.toLocaleString()} DZ</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span style={{ color: '#6C757D' }}>Tax (0.0%):</span>
                    <span>0 DZ</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.05rem', fontWeight: 500, borderTop: '1px solid #DEE2E6', paddingTop: '10px' }}>
                    <span>Total Price:</span>
                    <span>{selectedInvoice.total_amount.toLocaleString()} DZ</span>
                  </div>
                </div>

                {/* Standard terms & Legal notes */}
                <div style={{ marginTop: 'auto', borderTop: '1px solid #DEE2E6', paddingTop: '20px', fontSize: '0.72rem', color: '#6C757D', fontFamily: 'sans-serif', lineHeight: '1.5' }}>
                  <strong>Terms & Conditions:</strong>
                  <p style={{ margin: '4px 0 0 0' }}>
                    All services rendered by DecaByte are subject to intellectual property rights as detailed in the master agreement. Please settle due payments within 15 calendar days from the invoice date. Late payments are subject to a standard 2.5% monthly fee. Thank you for your partnership.
                  </p>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. SLIDE-OVER ADD INVOICE PANEL */}
      {/* ------------------------------------------------------------- */}
      {isAddingInvoice && (
        <div className="slide-over-overlay" onClick={() => setIsAddingExpense(false)}>
          <div 
            className="slide-over-container animate-slide-in" 
            onClick={(e) => e.stopPropagation()}
            style={{ 
              direction: language === 'ar' ? 'rtl' : 'ltr',
              width: '600px',
              maxWidth: '95%'
            }}
          >
            {/* Header */}
            <div className="slide-over-header">
              <div className="client-badge-profile">
                <div className="profile-large-avatar" style={{ backgroundColor: 'var(--accent-orange)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Sparkles size={24} />
                </div>
                <div>
                  <h3 className="profile-name-title">{language === 'ar' ? 'إنشاء مستند فوترة' : 'Draft Proposal / Invoice'}</h3>
                  <span className="profile-muted-date">{language === 'ar' ? 'توليد عروض أسعار وفواتير نهائية' : 'Configure line items and pricing schedule'}</span>
                </div>
              </div>
              <button onClick={() => setIsAddingExpense(false)} className="close-slide-over-btn" aria-label="Close">
                <X size={18} />
              </button>
            </div>

            {/* Form wizard content */}
            <form onSubmit={handleAddSubmit} className="slide-over-content-body" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
                
                <div className="form-group-item">
                  <label>{language === 'ar' ? 'المشروع المستهدف *' : 'Target Project *'}</label>
                  <select 
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    required
                    className="milestone-form-select"
                  >
                    <option value="">{language === 'ar' ? '-- اختر المشروع لتعبئة بيانات العميل --' : '-- Choose Project --'}</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group-item">
                  <label>{language === 'ar' ? 'نوع المستند الفاتورة' : 'Document Invoice Type'}</label>
                  <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 500, cursor: 'pointer' }}>
                      <input 
                        type="radio" 
                        name="inv_type" 
                        checked={invoiceType === 'proforma'} 
                        onChange={() => setInvoiceType('proforma')}
                      />
                      {language === 'ar' ? 'عرض سعر (Proforma Quote)' : 'Proforma (Proposal quote)'}
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 500, cursor: 'pointer' }}>
                      <input 
                        type="radio" 
                        name="inv_type" 
                        checked={invoiceType === 'final'} 
                        onChange={() => setInvoiceType('final')}
                      />
                      {language === 'ar' ? 'فاتورة سداد نهائية (Final Tax Invoice)' : 'Final (Invoice for payment)'}
                    </label>
                  </div>
                </div>

                <div className="modal-dates-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group-item">
                    <label>{language === 'ar' ? 'تاريخ الاستحقاق' : 'Payment Due Date'}</label>
                    <input 
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="milestone-form-input"
                    />
                  </div>

                  <div className="form-group-item">
                    <label>{language === 'ar' ? 'طريقة الدفع' : 'Payment Method'}</label>
                    <select 
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="milestone-form-select"
                    >
                      <option value="BaridiMob">BaridiMob</option>
                      <option value="CCP Transfer">CCP Transfer</option>
                      <option value="Cash">Cash / CCP</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                    </select>
                  </div>
                </div>

                {/* Line Items Builder */}
                <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '16px', background: 'var(--bg-sidebar)' }}>
                  <h4 style={{ fontSize: '0.8rem', fontWeight: 500, margin: '0 0 12px 0', borderBottom: '1px dashed var(--border-color)', paddingBottom: '6px' }}>
                    {language === 'ar' ? 'بنود التكلفة (Line Items)' : 'Invoice Items Checklist'}
                  </h4>

                  {/* Added Items List */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                    {lineItems.map(item => (
                      <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-card)', padding: '8px 12px', borderRadius: '6px', fontSize: '0.8rem', border: '1px solid var(--border-color)' }}>
                        <div>
                          <strong style={{ display: 'block' }}>{item.description}</strong>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-placeholder)' }}>
                            Qty: {item.quantity} x {item.unit_price.toLocaleString()} DZ
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontWeight: 500 }}>{(item.quantity * item.unit_price).toLocaleString()} DZ</span>
                          <button type="button" onClick={() => handleRemoveLineItem(item.id)} style={{ border: 'none', background: 'transparent', color: '#D32F2F', cursor: 'pointer', fontSize: '1rem', padding: '2px' }}>
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add New Item Form */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <input 
                      type="text"
                      placeholder={language === 'ar' ? 'وصف البند... (مثال: تصميم نموذج واجهات Figma)' : 'Item description... (e.g. UX UI Design)'}
                      value={itemDesc}
                      onChange={(e) => setItemDesc(e.target.value)}
                      className="milestone-form-input"
                    />
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 100px', gap: '8px', alignItems: 'center' }}>
                      <input 
                        type="number"
                        placeholder="Qty"
                        value={itemQty}
                        onChange={(e) => setItemQty(e.target.value)}
                        className="milestone-form-input"
                      />
                      <input 
                        type="number"
                        placeholder={language === 'ar' ? 'سعر الوحدة (DZ)' : 'Unit Price (DZ)'}
                        value={itemPrice}
                        onChange={(e) => setItemPrice(e.target.value)}
                        className="milestone-form-input"
                      />
                      <button 
                        type="button"
                        onClick={handleAddLineItem}
                        className="submit-btn compact-btn"
                        style={{ width: '100%', height: '36px' }}
                      >
                        + Add Item
                      </button>
                    </div>
                  </div>
                </div>

                <div className="form-group-item">
                  <label>{language === 'ar' ? 'ملاحظات الفاتورة' : 'Invoice Comments / Notes'}</label>
                  <textarea 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={language === 'ar' ? 'شروط خاصة، أرقام حسابات البنك...' : 'Bank details, CCP transfer notes...'}
                    className="milestone-form-input"
                    style={{ minHeight: '60px', resize: 'vertical' }}
                  />
                </div>

              </div>

              {/* Footer Save */}
              <div className="modal-footer" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: '24px' }}>
                <button type="button" onClick={() => setIsAddingExpense(false)} className="btn-secondary" style={{ flex: 1 }}>
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button type="submit" className="submit-btn primary-submit" style={{ flex: 1 }}>
                  {language === 'ar' ? 'توليد وحفظ الفاتورة' : 'Generate Document'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3. SLIDE-OVER DELETE CONFIRMATION PANEL */}
      {/* ------------------------------------------------------------- */}
      {deletingInvoiceId && (() => {
        const inv = invoices.find(i => i.id === deletingInvoiceId);
        if (!inv) return null;
        return (
          <div className="slide-over-overlay" onClick={() => setDeletingInvoiceId(null)}>
            <div 
              className="slide-over-container animate-slide-in" 
              onClick={(e) => e.stopPropagation()}
              style={{ direction: language === 'ar' ? 'rtl' : 'ltr' }}
            >
              {/* Header */}
              <div className="slide-over-header" style={{ backgroundColor: '#FFF0F0', borderBottom: '1px solid #FFE0E0' }}>
                <div className="client-badge-profile">
                  <div className="profile-large-avatar" style={{ backgroundColor: '#D32F2F', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <AlertTriangle size={24} />
                  </div>
                  <div>
                    <h3 className="profile-name-title" style={{ color: '#C62828' }}>
                      {language === 'ar' ? 'تأكيد حذف الفاتورة' : 'Delete Invoice Record'}
                    </h3>
                    <span className="profile-muted-date" style={{ color: '#A31D1D' }}>
                      {language === 'ar' ? 'تحذير: هذا الإجراء لا يمكن التراجع عنه' : 'Warning: This action is permanent'}
                    </span>
                  </div>
                </div>
                <button onClick={() => setDeletingInvoiceId(null)} className="close-slide-over-btn" aria-label="Close">
                  <X size={18} />
                </button>
              </div>

              {/* Content body warning */}
              <div className="slide-over-content-body" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ padding: '16px', border: '1px solid #FFE0E0', borderRadius: '12px', backgroundColor: '#FFF5F5', color: '#B82C2C', fontSize: '0.88rem', lineHeight: '1.5', fontWeight: '500' }}>
                  {language === 'ar' ? (
                    `أنت على وشك حذف الفاتورة رقم ${inv.invoice_number} بقيمة ${inv.total_amount.toLocaleString()} DZ بالكامل من أرشيف DecaByte.`
                  ) : (
                    `You are about to delete invoice ${inv.invoice_number} of ${inv.total_amount.toLocaleString()} DZ from billing logs.`
                  )}
                  <br /><br />
                  {language === 'ar' ? (
                    'سيتم مسح سجلات الفاتورة والبنود الملحقة نهائياً. الإجراء لن يؤثر على المدفوعات المسجلة فعلياً في كشف الحساب.'
                  ) : (
                    'This action deletes the proposal document permanently. Historic transactions logged in the payments ledger will remain intact.'
                  )}
                </div>
              </div>

              {/* Footer controls */}
              <div className="modal-footer" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: 'auto' }}>
                <button type="button" onClick={() => setDeletingInvoiceId(null)} className="btn-secondary" style={{ flex: 1 }}>
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button 
                  type="button" 
                  onClick={() => handleConfirmDelete(inv.id)}
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
