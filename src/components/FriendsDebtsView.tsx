import React, { useState, useMemo } from 'react';
import { useLanguage } from './LanguageContext';
import { UserAvatar } from './UserAvatar';
import { AddFriendModal } from './AddFriendModal';
import { AddFriendTransactionModal } from './AddFriendTransactionModal';
import { FriendLedgerModal } from './FriendLedgerModal';
import { SettleTransactionModal } from './SettleTransactionModal';
import type { Friend, FriendTransaction, FriendSettlement, FriendTransactionDirection, FriendTransactionType, FriendTransactionStatus } from '../types';
import { 
  Users, Handshake, Plus, Search, 
  ArrowDownLeft, ArrowUpRight, Scale, CheckCircle2, 
  Clock, Trash2, FileText, ChevronRight, LayoutGrid, List, Phone
} from 'lucide-react';

interface FriendsDebtsViewProps {
  friends: Friend[];
  transactions: FriendTransaction[];
  settlements: FriendSettlement[];
  onAddFriend: (friend: Friend) => void;
  onDeleteFriend: (id: string) => void;
  onAddTransaction: (tx: FriendTransaction) => void;
  onDeleteTransaction: (id: string) => void;
  onSettleTransaction: (st: FriendSettlement, updatedTx: FriendTransaction) => void;
}

export const FriendsDebtsView: React.FC<FriendsDebtsViewProps> = ({
  friends,
  transactions,
  settlements,
  onAddFriend,
  onDeleteFriend,
  onAddTransaction,
  onDeleteTransaction,
  onSettleTransaction,
}) => {
  const { language } = useLanguage();

  // State: View Modes & Modals
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [searchQuery, setSearchQuery] = useState('');
  const [directionFilter, setDirectionFilter] = useState<'all' | FriendTransactionDirection>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | FriendTransactionStatus>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | FriendTransactionType>('all');

  const [isAddFriendOpen, setIsAddFriendOpen] = useState(false);
  const [isAddTxOpen, setIsAddTxOpen] = useState(false);
  const [defaultFriendIdForTx, setDefaultFriendIdForTx] = useState<string | undefined>();
  const [selectedLedgerFriend, setSelectedLedgerFriend] = useState<Friend | null>(null);
  const [selectedSettleTx, setSelectedSettleTx] = useState<FriendTransaction | null>(null);

  // 1. Calculations: Global KPIs
  const metrics = useMemo(() => {
    let totalLentUnpaid = 0;
    let totalBorrowedUnpaid = 0;
    let activeLentCount = 0;
    let activeBorrowedCount = 0;
    let settledCount = 0;

    for (const t of transactions) {
      const rem = Math.max(0, t.amount - (t.paid_amount || 0));
      if (t.status === 'settled' || rem === 0) {
        settledCount++;
      } else {
        if (t.direction === 'lent') {
          totalLentUnpaid += rem;
          activeLentCount++;
        } else {
          totalBorrowedUnpaid += rem;
          activeBorrowedCount++;
        }
      }
    }

    const netBalance = totalLentUnpaid - totalBorrowedUnpaid;

    return {
      totalLentUnpaid,
      totalBorrowedUnpaid,
      netBalance,
      activeLentCount,
      activeBorrowedCount,
      activeTotalCount: activeLentCount + activeBorrowedCount,
      settledCount,
    };
  }, [transactions]);

  // 2. Friend Balances Map
  const friendBalances = useMemo(() => {
    const map = new Map<string, { lentUnpaid: number; borrowedUnpaid: number; net: number; pendingCount: number; settledCount: number }>();

    for (const f of friends) {
      map.set(f.id, { lentUnpaid: 0, borrowedUnpaid: 0, net: 0, pendingCount: 0, settledCount: 0 });
    }

    for (const t of transactions) {
      const current = map.get(t.friend_id) || { lentUnpaid: 0, borrowedUnpaid: 0, net: 0, pendingCount: 0, settledCount: 0 };
      const rem = Math.max(0, t.amount - (t.paid_amount || 0));

      if (t.status === 'settled' || rem === 0) {
        current.settledCount++;
      } else {
        current.pendingCount++;
        if (t.direction === 'lent') {
          current.lentUnpaid += rem;
        } else {
          current.borrowedUnpaid += rem;
        }
      }
      current.net = current.lentUnpaid - current.borrowedUnpaid;
      map.set(t.friend_id, current);
    }

    return map;
  }, [friends, transactions]);

  // 3. Filtered Friends
  const filteredFriends = useMemo(() => {
    return friends.filter((f) => {
      const matchesSearch = 
        searchQuery.trim() === '' ||
        f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (f.phone && f.phone.includes(searchQuery)) ||
        (f.notes && f.notes.toLowerCase().includes(searchQuery.toLowerCase()));

      const bal = friendBalances.get(f.id);
      if (!bal) return matchesSearch;

      if (directionFilter === 'lent' && bal.net <= 0) return false;
      if (directionFilter === 'borrowed' && bal.net >= 0) return false;
      if (statusFilter === 'pending' && bal.pendingCount === 0) return false;
      if (statusFilter === 'settled' && bal.pendingCount > 0) return false;

      return matchesSearch;
    });
  }, [friends, searchQuery, directionFilter, statusFilter, friendBalances]);

  // 4. Filtered Transactions
  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((t) => {
        const friend = friends.find((f) => f.id === t.friend_id);
        const friendName = friend ? friend.name.toLowerCase() : '';

        const matchesSearch =
          searchQuery.trim() === '' ||
          friendName.includes(searchQuery.toLowerCase()) ||
          t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.amount.toString().includes(searchQuery);

        const matchesDirection = directionFilter === 'all' || t.direction === directionFilter;
        const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
        const matchesType = typeFilter === 'all' || t.type === typeFilter;

        return matchesSearch && matchesDirection && matchesStatus && matchesType;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, friends, searchQuery, directionFilter, statusFilter, typeFilter]);

  const handleOpenAddTxForFriend = (friendId?: string) => {
    setDefaultFriendIdForTx(friendId);
    setIsAddTxOpen(true);
  };

  return (
    <div className="dashboard-content-area friends-view-container">
      
      {/* 1. Header Row */}
      <div className="view-header-row">
        <div>
          <h2 className="header-greeting-title" style={{ fontSize: '1.6rem', fontWeight: 450, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Handshake size={24} style={{ color: 'var(--btn-primary)' }} />
            <span>{language === 'ar' ? 'ديون ومعاملات الأصدقاء' : 'Friends Ledger & Exchanges'}</span>
          </h2>
          <p className="header-greeting-subtitle" style={{ fontSize: '0.85rem', fontWeight: 400 }}>
            {language === 'ar' 
              ? 'تنظيم ومتابعة الديون المتبادلة والخدمات ومقاصة الحسابات مع الأصدقاء والزملاء' 
              : 'Track mutual loans, shared expenses, favor offsets, and peer balances'}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            id="btnAddFriendBtn"
            onClick={() => setIsAddFriendOpen(true)}
            className="friends-header-action-btn secondary"
          >
            <Users size={15} />
            <span>{language === 'ar' ? 'صديق جديد' : 'New Friend'}</span>
          </button>

          <button 
            id="btnRecordFriendTx"
            onClick={() => handleOpenAddTxForFriend()}
            className="friends-header-action-btn primary"
          >
            <Plus size={15} />
            <span>{language === 'ar' ? 'تسجيل دين / معاملة' : 'Record Transaction'}</span>
          </button>
        </div>
      </div>

      {/* 2. Top KPI Grid */}
      <div className="friends-kpi-grid">
        
        {/* KPI 1: Global Net Balance */}
        <div className={`payments-kpi-card ${metrics.netBalance > 0 ? 'net-positive' : metrics.netBalance < 0 ? 'net-negative' : 'net-neutral'}`}>
          <div className="kpi-card-header">
            <span className="kpi-card-label">
              {language === 'ar' ? 'صافي الحساب العام' : 'Overall Net Balance'}
            </span>
            <div className={`kpi-card-icon-bubble ${metrics.netBalance > 0 ? 'green' : metrics.netBalance < 0 ? 'red' : 'purple'}`}>
              <Scale size={16} />
            </div>
          </div>
          <div className="kpi-card-value-row">
            <span 
              className="kpi-card-metric-huge"
              style={{ color: metrics.netBalance > 0 ? '#16A34A' : metrics.netBalance < 0 ? '#DC2626' : 'var(--text-primary)' }}
            >
              {metrics.netBalance > 0 ? `+${metrics.netBalance.toLocaleString()}` : metrics.netBalance < 0 ? `-${Math.abs(metrics.netBalance).toLocaleString()}` : '0'}
            </span>
            <span className="kpi-currency-unit">DZ</span>
          </div>
          <span className="kpi-subtext-note">
            {metrics.netBalance > 0
              ? (language === 'ar' ? 'لك في ذمة أصدقائك (رصيد إيجابي)' : 'Net owed to you across friends')
              : metrics.netBalance < 0
              ? (language === 'ar' ? 'عليك لأصدقائك (رصيد مستحق)' : 'Net you owe across friends')
              : (language === 'ar' ? 'الحسابات متوازنة تماماً' : 'All accounts balanced')}
          </span>
        </div>

        {/* KPI 2: Total Owed to You */}
        <div className="payments-kpi-card green">
          <div className="kpi-card-header">
            <span className="kpi-card-label">
              {language === 'ar' ? 'ديون لك (أقرضتها أو خدمات)' : 'Owed to You'}
            </span>
            <div className="kpi-card-icon-bubble green">
              <ArrowDownLeft size={16} />
            </div>
          </div>
          <div className="kpi-card-value-row">
            <span className="kpi-card-metric-huge" style={{ color: '#16A34A' }}>
              +{metrics.totalLentUnpaid.toLocaleString()}
            </span>
            <span className="kpi-currency-unit">DZ</span>
          </div>
          <span className="kpi-subtext-note">
            {language === 'ar'
              ? `${metrics.activeLentCount} معاملة معلقة لصالحك`
              : `${metrics.activeLentCount} active loans & favors to collect`}
          </span>
        </div>

        {/* KPI 3: Total You Owe */}
        <div className="payments-kpi-card orange">
          <div className="kpi-card-header">
            <span className="kpi-card-label">
              {language === 'ar' ? 'ديون عليك (اقترضتها أو خدمات)' : 'You Owe'}
            </span>
            <div className="kpi-card-icon-bubble orange">
              <ArrowUpRight size={16} />
            </div>
          </div>
          <div className="kpi-card-value-row">
            <span className="kpi-card-metric-huge" style={{ color: 'var(--accent-orange)' }}>
              -{metrics.totalBorrowedUnpaid.toLocaleString()}
            </span>
            <span className="kpi-currency-unit">DZ</span>
          </div>
          <span className="kpi-subtext-note">
            {language === 'ar'
              ? `${metrics.activeBorrowedCount} ديون ومستحقات عليك لأصدقائك`
              : `${metrics.activeBorrowedCount} active debts to pay back`}
          </span>
        </div>

        {/* KPI 4: Active Friends & Engagements */}
        <div className="payments-kpi-card purple">
          <div className="kpi-card-header">
            <span className="kpi-card-label">
              {language === 'ar' ? 'الأصدقاء والنشاط' : 'Friends & Activity'}
            </span>
            <div className="kpi-card-icon-bubble purple">
              <Users size={16} />
            </div>
          </div>
          <div className="kpi-card-value-row">
            <span className="kpi-card-metric-huge" style={{ color: 'var(--accent-purple)' }}>
              {friends.length}
            </span>
            <span className="kpi-currency-unit" style={{ fontSize: '0.85rem' }}>
              {language === 'ar' ? 'صديق' : 'friends'}
            </span>
          </div>
          <span className="kpi-subtext-note">
            {language === 'ar'
              ? `${metrics.activeTotalCount} نشطة • ${metrics.settledCount} مسددة`
              : `${metrics.activeTotalCount} active • ${metrics.settledCount} settled`}
          </span>
        </div>

      </div>

      {/* 3. Toolbar & View Switcher */}
      <div className="friends-toolbar-row">
        {/* Search */}
        <div className="sidebar-search-box" style={{ width: '280px', margin: 0 }}>
          <div className="search-inner">
            <Search size={14} />
            <input
              type="text"
              className="search-input"
              placeholder={language === 'ar' ? 'بحث باسم الصديق أو المعاملة...' : 'Search friend or note...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* View Switcher Pills */}
        <div className="view-mode-pill-group">
          <button
            type="button"
            className={`view-mode-pill-btn ${viewMode === 'cards' ? 'active' : ''}`}
            onClick={() => setViewMode('cards')}
          >
            <LayoutGrid size={13} />
            <span>{language === 'ar' ? 'دليل الأصدقاء' : 'Friends Grid'}</span>
          </button>
          <button
            type="button"
            className={`view-mode-pill-btn ${viewMode === 'table' ? 'active' : ''}`}
            onClick={() => setViewMode('table')}
          >
            <List size={13} />
            <span>{language === 'ar' ? 'سجل المعاملات' : 'All Transactions'}</span>
          </button>
        </div>

        {/* Filters */}
        <div className="friends-filters-group">
          <select 
            className="friends-select-filter"
            value={directionFilter}
            onChange={(e) => setDirectionFilter(e.target.value as any)}
          >
            <option value="all">{language === 'ar' ? 'كل الاتجاهات (لي وعليّ)' : 'All Directions'}</option>
            <option value="lent">{language === 'ar' ? 'لي فقط (أنا الدائن)' : 'Owed to Me'}</option>
            <option value="borrowed">{language === 'ar' ? 'عليّ فقط (أنا المدين)' : 'I Owe'}</option>
          </select>

          <select 
            className="friends-select-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
          >
            <option value="all">{language === 'ar' ? 'جميع الحالات' : 'All Statuses'}</option>
            <option value="pending">{language === 'ar' ? 'معلق / غير مسدد' : 'Pending'}</option>
            <option value="settled">{language === 'ar' ? 'مسدد بالكامل' : 'Settled'}</option>
          </select>

          {viewMode === 'table' && (
            <select 
              className="friends-select-filter"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
            >
              <option value="all">{language === 'ar' ? 'كل الأنواع' : 'All Types'}</option>
              <option value="money">{language === 'ar' ? 'ديون نقدية' : 'Money Loans'}</option>
              <option value="service">{language === 'ar' ? 'خدمات متبادلة' : 'Services'}</option>
              <option value="expense">{language === 'ar' ? 'نفقات مشتركة' : 'Shared Costs'}</option>
            </select>
          )}
        </div>
      </div>

      {/* 4. Mode 1: Friends Cards Grid */}
      {viewMode === 'cards' && (
        <>
          {filteredFriends.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              backgroundColor: 'var(--bg-card)',
              border: '1px dashed var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              marginTop: '10px'
            }}>
              <Users size={32} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
              <h4 style={{ fontSize: '1rem', fontWeight: 450, color: 'var(--text-primary)', margin: '0 0 6px' }}>
                {language === 'ar' ? 'لا يوجد أصدقاء يطابقون البحث' : 'No friends found matching criteria'}
              </h4>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0 0 16px' }}>
                {language === 'ar' 
                  ? 'يمكنك إضافة صديق جديد للبدء في تتبع الديون والخدمات المتبادلة' 
                  : 'Add a new friend to start organizing mutual balances and favors'}
              </p>
              <button 
                onClick={() => setIsAddFriendOpen(true)}
                className="submit-btn" 
                style={{ padding: '8px 16px', fontSize: '0.82rem', margin: '0 auto' }}
              >
                <Plus size={14} />
                <span>{language === 'ar' ? 'إضافة صديق جديد' : 'Add New Friend'}</span>
              </button>
            </div>
          ) : (
            <div className="friends-cards-grid">
              {filteredFriends.map((f) => {
                const bal = friendBalances.get(f.id) || { lentUnpaid: 0, borrowedUnpaid: 0, net: 0, pendingCount: 0, settledCount: 0 };
                const net = bal.net;

                return (
                  <div key={f.id} className="friend-summary-card">
                    {/* Top Row: Avatar & Details */}
                    <div className="friend-card-top-row">
                      <div className="friend-info-left">
                        <UserAvatar name={f.name} size={40} animate="hover" />
                        <div className="friend-text-details">
                          <span className="friend-name-heading" title={f.name}>{f.name}</span>
                          {f.phone && (
                            <span className="friend-contact-subtext">
                              <Phone size={11} />
                              <span>{f.phone}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleOpenAddTxForFriend(f.id)}
                        className="friend-card-btn-add-tx"
                        title={language === 'ar' ? 'تسجيل دين/معاملة مع هذا الصديق' : 'Add transaction with friend'}
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    {/* Balance Box */}
                    <div className="friend-card-balance-box">
                      <div>
                        <div className="balance-box-label">
                          {language === 'ar' ? 'صافي الرصيد' : 'Net Balance'}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {net > 0 
                            ? (language === 'ar' ? 'مطلوب منه' : 'Owed to you')
                            : net < 0 
                            ? (language === 'ar' ? 'يطلبك' : 'You owe him')
                            : (language === 'ar' ? 'مصفّر تماماً' : 'Settled')}
                        </div>
                      </div>

                      <div className={`balance-box-amount ${net > 0 ? 'lent' : net < 0 ? 'borrowed' : 'settled'}`}>
                        {net > 0 ? (
                          <span>+{net.toLocaleString()}</span>
                        ) : net < 0 ? (
                          <span>-{Math.abs(net).toLocaleString()}</span>
                        ) : (
                          <span>0</span>
                        )}
                        <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>DZ</span>
                      </div>
                    </div>

                    {/* Stats & Activity */}
                    <div className="friend-card-stats-row">
                      <span>
                        {language === 'ar' 
                          ? `${bal.pendingCount} معلقة • ${bal.settledCount} مسددة` 
                          : `${bal.pendingCount} active • ${bal.settledCount} cleared`}
                      </span>
                      {f.notes && (
                        <span style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={f.notes}>
                          {f.notes}
                        </span>
                      )}
                    </div>

                    {/* Action Button: Statement */}
                    <div className="friend-card-actions-row">
                      <button
                        type="button"
                        onClick={() => setSelectedLedgerFriend(f)}
                        className="friend-card-btn-statement"
                      >
                        <FileText size={13} />
                        <span>{language === 'ar' ? 'كشف الحساب والتسوية' : 'Statement & Settle'}</span>
                        <ChevronRight size={13} />
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* 5. Mode 2: All Transactions Table */}
      {viewMode === 'table' && (
        <div className="friends-table-card">
          <div className="friends-table-responsive">
            {filteredTransactions.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '60px 20px',
                color: 'var(--text-muted)',
                fontSize: '0.85rem'
              }}>
                {language === 'ar' ? 'لا توجد معاملات مسجلة مطابقة للبحث.' : 'No transactions found matching criteria.'}
              </div>
            ) : (
              <table className="friends-transactions-table">
                <thead>
                  <tr>
                    <th>{language === 'ar' ? 'التاريخ' : 'Date'}</th>
                    <th>{language === 'ar' ? 'الصديق' : 'Friend'}</th>
                    <th>{language === 'ar' ? 'الاتجاه' : 'Direction'}</th>
                    <th>{language === 'ar' ? 'النوع' : 'Nature'}</th>
                    <th>{language === 'ar' ? 'الوصف / البيان' : 'Description'}</th>
                    <th>{language === 'ar' ? 'المبلغ' : 'Amount'}</th>
                    <th>{language === 'ar' ? 'المسدد' : 'Paid'}</th>
                    <th>{language === 'ar' ? 'المتبقي' : 'Remaining'}</th>
                    <th>{language === 'ar' ? 'الحالة' : 'Status'}</th>
                    <th style={{ textAlign: 'center' }}>{language === 'ar' ? 'الإجراءات' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((tx) => {
                    const friend = friends.find((f) => f.id === tx.friend_id) || { id: tx.friend_id, name: 'Unknown' };
                    const rem = Math.max(0, tx.amount - (tx.paid_amount || 0));

                    return (
                      <tr key={tx.id}>
                        <td style={{ whiteSpace: 'nowrap', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                          {tx.date}
                        </td>

                        <td>
                          <div 
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                            onClick={() => {
                              const found = friends.find((f) => f.id === tx.friend_id);
                              if (found) setSelectedLedgerFriend(found);
                            }}
                          >
                            <UserAvatar name={friend.name} size={24} animate="hover" />
                            <span style={{ fontWeight: 450 }}>{friend.name}</span>
                          </div>
                        </td>

                        <td>
                          <span className={`badge-direction ${tx.direction}`}>
                            {tx.direction === 'lent' ? <ArrowDownLeft size={11} /> : <ArrowUpRight size={11} />}
                            <span>{tx.direction === 'lent' ? (language === 'ar' ? 'دين لك' : 'Lent') : (language === 'ar' ? 'دين عليك' : 'Borrowed')}</span>
                          </span>
                        </td>

                        <td>
                          <span className={`badge-type-tag ${tx.type}`}>
                            {tx.type === 'service' ? (language === 'ar' ? 'خدمة' : 'Service') : tx.type === 'expense' ? (language === 'ar' ? 'نفقة' : 'Expense') : (language === 'ar' ? 'نقدي' : 'Money')}
                          </span>
                        </td>

                        <td>
                          <div style={{ fontWeight: 400, maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={tx.description}>
                            {tx.description}
                          </div>
                          {tx.due_date && (
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                              <Clock size={10} />
                              <span>{language === 'ar' ? 'استحقاق:' : 'Due:'} {tx.due_date}</span>
                            </div>
                          )}
                        </td>

                        <td style={{ fontWeight: 450, color: tx.direction === 'lent' ? '#16A34A' : '#DC2626', whiteSpace: 'nowrap' }}>
                          {tx.direction === 'lent' ? '+' : '-'}{tx.amount.toLocaleString()} DZ
                        </td>

                        <td style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                          {(tx.paid_amount || 0).toLocaleString()} DZ
                        </td>

                        <td style={{ fontWeight: 450, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                          {rem.toLocaleString()} DZ
                        </td>

                        <td>
                          <span className={`badge-status-tag ${tx.status}`}>
                            {tx.status === 'settled' 
                              ? (language === 'ar' ? 'مسدد' : 'Settled') 
                              : tx.status === 'partially_paid' 
                              ? (language === 'ar' ? 'مسدد جزئياً' : 'Partial') 
                              : (language === 'ar' ? 'معلق' : 'Pending')}
                          </span>
                        </td>

                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                            {rem > 0 && (
                              <button
                                type="button"
                                onClick={() => setSelectedSettleTx(tx)}
                                className="submit-btn"
                                style={{ padding: '4px 8px', fontSize: '0.74rem', gap: '4px', background: '#16A34A' }}
                                title={language === 'ar' ? 'تسجيل سداد أو مقاصة' : 'Settle'}
                              >
                                <CheckCircle2 size={11} />
                                <span>{language === 'ar' ? 'تسوية' : 'Settle'}</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(language === 'ar' ? 'هل أنت متأكد من حذف هذه المعاملة؟' : 'Delete transaction?')) {
                                  onDeleteTransaction(tx.id);
                                }
                              }}
                              className="task-remove-btn"
                              title="Delete"
                              style={{ width: '24px', height: '24px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* 6. Modals */}
      <AddFriendModal
        isOpen={isAddFriendOpen}
        onClose={() => setIsAddFriendOpen(false)}
        onAddFriend={onAddFriend}
      />

      <AddFriendTransactionModal
        isOpen={isAddTxOpen}
        onClose={() => {
          setIsAddTxOpen(false);
          setDefaultFriendIdForTx(undefined);
        }}
        friends={friends}
        defaultFriendId={defaultFriendIdForTx}
        onAddTransaction={onAddTransaction}
        onOpenAddFriend={() => {
          setIsAddTxOpen(false);
          setIsAddFriendOpen(true);
        }}
      />

      <FriendLedgerModal
        isOpen={Boolean(selectedLedgerFriend)}
        onClose={() => setSelectedLedgerFriend(null)}
        friend={selectedLedgerFriend}
        transactions={transactions}
        settlements={settlements}
        onOpenAddTransaction={(friendId) => {
          setSelectedLedgerFriend(null);
          handleOpenAddTxForFriend(friendId);
        }}
        onOpenSettle={(tx) => setSelectedSettleTx(tx)}
        onDeleteTransaction={onDeleteTransaction}
        onDeleteFriend={onDeleteFriend}
      />

      <SettleTransactionModal
        isOpen={Boolean(selectedSettleTx)}
        onClose={() => setSelectedSettleTx(null)}
        transaction={selectedSettleTx}
        friendName={friends.find((f) => f.id === selectedSettleTx?.friend_id)?.name}
        onSettle={onSettleTransaction}
      />

    </div>
  );
};
