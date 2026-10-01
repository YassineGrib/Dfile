import React, { useState, useMemo } from 'react';
import { useLanguage } from './LanguageContext';
import { UserAvatar } from './UserAvatar';
import type { Friend, FriendTransaction, FriendSettlement } from '../types';
import { 
  X, Plus, CheckCircle2, Trash2, Phone, Calendar, 
  ChevronDown, ChevronUp, ArrowDownLeft, ArrowUpRight,
  ExternalLink, CreditCard, Banknote, Wrench, Building
} from 'lucide-react';

interface FriendLedgerModalProps {
  isOpen: boolean;
  onClose: () => void;
  friend: Friend | null;
  transactions: FriendTransaction[];
  settlements: FriendSettlement[];
  onOpenAddTransaction: (friendId: string) => void;
  onOpenSettle: (tx: FriendTransaction) => void;
  onDeleteTransaction: (txId: string) => void;
  onDeleteFriend?: (friendId: string) => void;
}

export const FriendLedgerModal: React.FC<FriendLedgerModalProps> = ({
  isOpen,
  onClose,
  friend,
  transactions,
  settlements,
  onOpenAddTransaction,
  onOpenSettle,
  onDeleteTransaction,
  onDeleteFriend,
}) => {
  const { language } = useLanguage();
  const [expandedTxId, setExpandedTxId] = useState<string | null>(null);

  // Filter transactions for this friend
  const friendTxs = useMemo(() => {
    if (!friend) return [];
    return transactions
      .filter((t) => t.friend_id === friend.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [friend, transactions]);

  // Calculations for this friend
  const summary = useMemo(() => {
    let totalLentUnpaid = 0;
    let totalBorrowedUnpaid = 0;
    let settledCount = 0;
    let pendingCount = 0;

    for (const t of friendTxs) {
      const rem = Math.max(0, t.amount - (t.paid_amount || 0));
      if (t.status === 'settled' || rem === 0) {
        settledCount++;
      } else {
        pendingCount++;
        if (t.direction === 'lent') {
          totalLentUnpaid += rem;
        } else {
          totalBorrowedUnpaid += rem;
        }
      }
    }

    const netBalance = totalLentUnpaid - totalBorrowedUnpaid;

    return {
      totalLentUnpaid,
      totalBorrowedUnpaid,
      netBalance,
      settledCount,
      pendingCount,
    };
  }, [friendTxs]);

  if (!isOpen || !friend) return null;

  const toggleExpand = (txId: string) => {
    setExpandedTxId(expandedTxId === txId ? null : txId);
  };

  const handleDeleteFriendClick = () => {
    if (summary.pendingCount > 0) {
      const confirmed = window.confirm(
        language === 'ar'
          ? `تنبيه: هناك ${summary.pendingCount} معاملات معلقة برصيد غير مسدد. هل أنت متأكد من رغبتك في حذف الصديق وسجلاته؟`
          : `Warning: There are ${summary.pendingCount} open transactions. Are you sure you want to delete this friend and all records?`
      );
      if (!confirmed) return;
    } else {
      const confirmed = window.confirm(
        language === 'ar'
          ? `هل أنت متأكد من حذف الصديق '${friend.name}'؟`
          : `Are you sure you want to delete '${friend.name}'?`
      );
      if (!confirmed) return;
    }

    if (onDeleteFriend) {
      onDeleteFriend(friend.id);
      onClose();
    }
  };

  const getMethodIcon = (m: string) => {
    switch (m) {
      case 'baridimob': return <CreditCard size={12} />;
      case 'cash': return <Banknote size={12} />;
      case 'service_offset': return <Wrench size={12} />;
      case 'bank_transfer': return <Building size={12} />;
      default: return <CheckCircle2 size={12} />;
    }
  };

  const getMethodLabel = (m: string) => {
    switch (m) {
      case 'baridimob': return 'BaridiMob';
      case 'cash': return language === 'ar' ? 'كاش' : 'Cash';
      case 'service_offset': return language === 'ar' ? 'مقاصة خدمة' : 'Service Offset';
      case 'bank_transfer': return language === 'ar' ? 'تحويل بنكي' : 'Bank';
      default: return language === 'ar' ? 'أخرى' : 'Other';
    }
  };

  return (
    <div className="modal-overlay animate-fade-in" onClick={onClose}>
      <div 
        className="modal-container animate-scale-up" 
        style={{ maxWidth: '780px', maxHeight: '90vh', overflowY: 'auto' }} 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3 className="modal-title" style={{ fontSize: '1.1rem', fontWeight: 450 }}>
              {language === 'ar' ? 'كشف الحساب وسجل المعاملات' : 'Account Statement & Ledger'}
            </h3>
          </div>
          <button type="button" onClick={onClose} className="modal-close-btn" title="Close">
            <X size={16} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Friend Profile & Balance Summary Banner */}
          <div className="statement-summary-header">
            <div className="statement-friend-meta">
              <UserAvatar name={friend.name} size={46} animate="hover" />
              <div>
                <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 450, color: 'var(--text-primary)' }}>
                  {friend.name}
                </h4>
                {friend.phone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                    <a 
                      href={`tel:${friend.phone}`} 
                      className="friend-contact-subtext"
                      style={{ textDecoration: 'none', color: 'var(--text-secondary)' }}
                    >
                      <Phone size={12} />
                      <span>{friend.phone}</span>
                    </a>
                    <a
                      href={`https://wa.me/${friend.phone.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{ fontSize: '0.72rem', color: '#16A34A', display: 'inline-flex', alignItems: 'center', gap: '2px', textDecoration: 'none' }}
                      title="WhatsApp"
                    >
                      <span>WhatsApp</span>
                      <ExternalLink size={10} />
                    </a>
                  </div>
                )}
                {friend.notes && (
                  <p style={{ margin: '4px 0 0', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                    {friend.notes}
                  </p>
                )}
              </div>
            </div>

            {/* Net Balance Banner */}
            <div className="statement-balance-banner">
              <span className="balance-box-label">
                {language === 'ar' ? 'صافي الحساب الكلي' : 'Net Balance Status'}
              </span>
              <div 
                className={`balance-box-amount ${summary.netBalance > 0 ? 'lent' : summary.netBalance < 0 ? 'borrowed' : 'settled'}`}
                style={{ fontSize: '1.25rem' }}
              >
                {summary.netBalance > 0 ? (
                  <span>+{summary.netBalance.toLocaleString()} DZ</span>
                ) : summary.netBalance < 0 ? (
                  <span>-{Math.abs(summary.netBalance).toLocaleString()} DZ</span>
                ) : (
                  <span>0 DZ</span>
                )}
              </div>
              <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                {summary.netBalance > 0
                  ? (language === 'ar' ? 'مطلوب منه (لك في ذمته)' : 'Owed to you')
                  : summary.netBalance < 0
                  ? (language === 'ar' ? 'يطلب منك (عليك له)' : 'You owe him')
                  : (language === 'ar' ? 'الحساب مصفّر تماماً' : 'Completely Settled')}
              </span>
            </div>
          </div>

          {/* KPI Mini Strip */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '10px 12px' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{language === 'ar' ? 'ديون لك' : 'Owed to You'}</div>
              <div style={{ fontSize: '0.92rem', fontWeight: 450, color: '#16A34A', marginTop: '2px' }}>
                {summary.totalLentUnpaid.toLocaleString()} DZ
              </div>
            </div>

            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '10px 12px' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{language === 'ar' ? 'ديون عليك' : 'You Owe'}</div>
              <div style={{ fontSize: '0.92rem', fontWeight: 450, color: '#DC2626', marginTop: '2px' }}>
                {summary.totalBorrowedUnpaid.toLocaleString()} DZ
              </div>
            </div>

            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '10px 12px' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{language === 'ar' ? 'معاملات نشطة' : 'Active'}</div>
              <div style={{ fontSize: '0.92rem', fontWeight: 450, color: '#EA580C', marginTop: '2px' }}>
                {summary.pendingCount}
              </div>
            </div>

            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '10px 12px' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{language === 'ar' ? 'معاملات مسددة' : 'Settled'}</div>
              <div style={{ fontSize: '0.92rem', fontWeight: 450, color: 'var(--text-muted)', marginTop: '2px' }}>
                {summary.settledCount}
              </div>
            </div>
          </div>

          {/* Quick Actions Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
            <button
              type="button"
              onClick={() => onOpenAddTransaction(friend.id)}
              className="submit-btn"
              style={{ padding: '8px 14px', fontSize: '0.82rem', gap: '6px' }}
            >
              <Plus size={14} />
              <span>{language === 'ar' ? 'تسجيل دين أو خدمة جديدة' : 'Add Transaction'}</span>
            </button>

            {onDeleteFriend && (
              <button
                type="button"
                onClick={handleDeleteFriendClick}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#DC2626',
                  fontSize: '0.78rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer',
                  padding: '6px 8px',
                  borderRadius: 'var(--radius-md)',
                }}
                title={language === 'ar' ? 'حذف الصديق' : 'Delete Friend'}
              >
                <Trash2 size={13} />
                <span>{language === 'ar' ? 'حذف هذا الصديق' : 'Delete Friend'}</span>
              </button>
            )}
          </div>

          {/* Transactions List */}
          <div style={{ marginTop: '8px' }}>
            <h5 style={{ fontSize: '0.85rem', fontWeight: 450, color: 'var(--text-primary)', marginBottom: '8px' }}>
              {language === 'ar' ? 'سجل العمليات والديون المتبادلة' : 'Transaction History'}
            </h5>

            {friendTxs.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '30px 16px',
                background: 'var(--bg-hover)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-muted)',
                fontSize: '0.84rem'
              }}>
                {language === 'ar' ? 'لا توجد معاملات مسجلة مع هذا الصديق بعد.' : 'No transactions recorded with this friend yet.'}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {friendTxs.map((tx) => {
                  const rem = Math.max(0, tx.amount - (tx.paid_amount || 0));
                  const isExpanded = expandedTxId === tx.id;
                  const txSettlements = settlements.filter((s) => s.transaction_id === tx.id);

                  return (
                    <div 
                      key={tx.id}
                      style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-md)',
                        padding: '12px 14px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span className={`badge-direction ${tx.direction}`}>
                              {tx.direction === 'lent' ? <ArrowDownLeft size={11} /> : <ArrowUpRight size={11} />}
                              <span>{tx.direction === 'lent' ? (language === 'ar' ? 'دين لك' : 'Lent') : (language === 'ar' ? 'دين عليك' : 'Borrowed')}</span>
                            </span>

                            <span className={`badge-type-tag ${tx.type}`}>
                              {tx.type === 'service' ? (language === 'ar' ? 'خدمة' : 'Service') : tx.type === 'expense' ? (language === 'ar' ? 'نفقة' : 'Expense') : (language === 'ar' ? 'نقدي' : 'Money')}
                            </span>

                            <span className={`badge-status-tag ${tx.status}`}>
                              {tx.status === 'settled' 
                                ? (language === 'ar' ? 'مسدد' : 'Settled') 
                                : tx.status === 'partially_paid' 
                                ? (language === 'ar' ? 'مسدد جزئياً' : 'Partial') 
                                : (language === 'ar' ? 'معلق' : 'Pending')}
                            </span>

                            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <Calendar size={11} />
                              <span>{tx.date}</span>
                            </span>
                          </div>

                          <div style={{ fontSize: '0.9rem', fontWeight: 450, color: 'var(--text-primary)', marginTop: '6px' }}>
                            {tx.description}
                          </div>
                        </div>

                        {/* Amount & Remaining */}
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '1rem', fontWeight: 450, color: tx.direction === 'lent' ? '#16A34A' : '#DC2626' }}>
                            {tx.direction === 'lent' ? '+' : '-'}{tx.amount.toLocaleString()} DZ
                          </div>
                          {rem > 0 && rem < tx.amount && (
                            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                              {language === 'ar' ? 'المتبقي:' : 'Rem:'} {rem.toLocaleString()} DZ
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions & Settle button */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: '8px', marginTop: '4px' }}>
                        <div>
                          {txSettlements.length > 0 && (
                            <button
                              type="button"
                              onClick={() => toggleExpand(tx.id)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--text-secondary)',
                                fontSize: '0.74rem',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <span>{language === 'ar' ? `سجل الدفعات (${txSettlements.length})` : `Settlements (${txSettlements.length})`}</span>
                              {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                            </button>
                          )}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {rem > 0 && (
                            <button
                              type="button"
                              onClick={() => onOpenSettle(tx)}
                              className="submit-btn"
                              style={{ padding: '4px 10px', fontSize: '0.76rem', gap: '4px', background: '#16A34A' }}
                            >
                              <CheckCircle2 size={12} />
                              <span>{language === 'ar' ? 'تسجيل سداد' : 'Settle'}</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(language === 'ar' ? 'هل أنت متأكد من حذف هذه المعاملة؟' : 'Delete this transaction?')) {
                                onDeleteTransaction(tx.id);
                              }
                            }}
                            className="task-remove-btn"
                            title="Delete"
                            style={{ width: '26px', height: '26px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>

                      {/* Expanded Settlement History */}
                      {isExpanded && txSettlements.length > 0 && (
                        <div style={{
                          background: 'var(--bg-hover)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '8px 12px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px',
                          marginTop: '4px'
                        }}>
                          {txSettlements.map((st) => (
                            <div key={st.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.76rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                {getMethodIcon(st.payment_method)}
                                <span style={{ fontWeight: 450 }}>{getMethodLabel(st.payment_method)}</span>
                                <span style={{ color: 'var(--text-muted)' }}>({st.date})</span>
                                {st.notes && <span style={{ color: 'var(--text-secondary)' }}>- {st.notes}</span>}
                              </div>
                              <span style={{ fontWeight: 450, color: '#16A34A' }}>
                                +{st.amount.toLocaleString()} DZ
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        <div className="modal-footer" style={{ marginTop: '16px' }}>
          <button type="button" onClick={onClose} className="secondary-btn">
            {language === 'ar' ? 'إغلاق' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
