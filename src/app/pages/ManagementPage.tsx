import { useState } from 'react';
import { TrendingUp, TrendingDown, Plus, Trash2, Search } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useT } from '../i18n/translations';
import { TransactionModal } from '../components/TransactionModal';
import { toast } from 'sonner';

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style:'currency', currency:'USD', minimumFractionDigits:2 }).format(n);
}

export function ManagementPage() {
  const { getUserTransactions, getBalance, deleteTransaction, language } = useApp();
  const t = useT(language);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'income'|'spending'>('income');
  const [filter, setFilter] = useState<'all'|'income'|'spending'>('all');
  const [search, setSearch] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string|null>(null);

  const all = getUserTransactions();
  const balance = getBalance();
  const totalIncome   = all.filter(t => t.type==='income').reduce((s,t) => s+t.amount, 0);
  const totalSpending = all.filter(t => t.type==='spending').reduce((s,t) => s+t.amount, 0);

  const visible = all
    .filter(tx => filter==='all' || tx.type===filter)
    .filter(tx => !search || tx.reason.toLowerCase().includes(search.toLowerCase()))
    .sort((a,b) => new Date(b.date).getTime()-new Date(a.date).getTime());

  const handleDelete = (id: string) => {
    if (deleteConfirm===id) { deleteTransaction(id); toast.success(t('transactionDeleted')); setDeleteConfirm(null); }
    else { setDeleteConfirm(id); setTimeout(() => setDeleteConfirm(null), 3000); }
  };

  const openModal = (type: 'income'|'spending') => { setModalType(type); setModalOpen(true); };

  const cardCls = "liquid-glass rounded-2xl";

  return (
    <div className="p-4 lg:p-6 2xl:p-10 space-y-5">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-foreground" style={{ fontSize:'1.4rem', fontWeight:700 }}>{t('managementTitle')}</h1>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => openModal('income')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-income/12 border border-income/20 text-income hover:bg-income/20 transition-all"
            style={{ fontSize:'0.82rem', fontWeight:500 }}
          >
            <Plus size={14}/> {t('addIncome')}
          </button>
          <button onClick={() => openModal('spending')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-spending/12 border border-spending/20 text-spending hover:bg-spending/20 transition-all"
            style={{ fontSize:'0.82rem', fontWeight:500 }}
          >
            <Plus size={14}/> {t('addSpending')}
          </button>
        </div>
      </div>

      {/* Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 2xl:gap-5">
        {[
          { label: t('balance'),  value: balance,       color: balance>=0?'text-foreground':'text-spending', grad:'from-primary/5' },
          { label: t('income'),   value: totalIncome,   color:'text-income',   grad:'from-income/5',   icon:<TrendingUp size={13} className="text-income"/> },
          { label: t('spending'), value: totalSpending, color:'text-spending', grad:'from-spending/5', icon:<TrendingDown size={13} className="text-spending"/> },
        ].map((item,i) => (
          <div key={i} className={`${cardCls} p-4 text-center relative overflow-hidden`}>
            <div className={`absolute inset-0 bg-gradient-to-br ${item.grad} to-transparent`}/>
            <div className="relative flex items-center justify-center gap-1.5 mb-1">
              {item.icon}
              <p className="text-muted-foreground" style={{ fontSize:'0.68rem', textTransform:'uppercase', letterSpacing:'0.08em' }}>{item.label}</p>
            </div>
            <p className={`relative ${item.color}`} style={{ fontSize:'1.5rem', fontWeight:800, letterSpacing:'-0.02em' }}>
              {fmt(item.value)}
            </p>
          </div>
        ))}
      </div>

      {/* Table card */}
      <div className={`${cardCls} overflow-hidden`}>
        {/* Filters */}
        <div className="p-4 border-b border-white/20 dark:border-border flex flex-col sm:flex-row gap-3">
          <div className="flex bg-white/30 dark:bg-muted rounded-xl p-1 gap-1 backdrop-blur-sm border border-white/40 dark:border-border">
            {(['all','income','spending'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg transition-all ${filter===f ? 'bg-white/70 dark:bg-card text-foreground shadow-sm':'text-muted-foreground hover:text-foreground'}`}
                style={{ fontSize:'0.78rem', fontWeight:500 }}
              >
                {f==='all' ? t('allTransactions') : f==='income' ? t('incomeTab') : t('spendingTab')}
              </button>
            ))}
          </div>
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder={t('reason')}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/30 dark:bg-input-background border border-white/40 dark:border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all backdrop-blur-sm"
              style={{ fontSize:'0.82rem' }}
            />
          </div>
        </div>

        {visible.length===0 ? (
          <div className="flex flex-col items-center justify-center py-14 gap-3">
            <div className="w-12 h-12 rounded-full bg-white/30 dark:bg-muted flex items-center justify-center">
              <TrendingUp size={18} className="text-muted-foreground"/>
            </div>
            <p className="text-muted-foreground" style={{ fontSize:'0.88rem' }}>{t('noTransactions')}</p>
            <div className="flex gap-2 mt-1">
              <button onClick={() => openModal('income')} className="px-4 py-2 rounded-xl bg-income/10 text-income border border-income/20 hover:bg-income/20 transition-all" style={{ fontSize:'0.78rem' }}>
                {t('addIncome')}
              </button>
              <button onClick={() => openModal('spending')} className="px-4 py-2 rounded-xl bg-spending/10 text-spending border border-spending/20 hover:bg-spending/20 transition-all" style={{ fontSize:'0.78rem' }}>
                {t('addSpending')}
              </button>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-white/15 dark:divide-border">
            {visible.map(tx => (
              <div key={tx.id} className="flex items-center gap-3 px-4 py-3.5 hover:bg-white/15 dark:hover:bg-muted/20 transition-colors group">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${tx.type==='income' ? 'bg-income/12':'bg-spending/12'}`}>
                  {tx.type==='income' ? <TrendingUp size={14} className="text-income"/> : <TrendingDown size={14} className="text-spending"/>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-foreground truncate" style={{ fontSize:'0.88rem', fontWeight:500 }}>{tx.reason}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`px-1.5 py-0.5 rounded-full ${tx.type==='income' ? 'bg-income/10 text-income':'bg-spending/10 text-spending'}`} style={{ fontSize:'0.65rem', fontWeight:500 }}>
                      {tx.type==='income' ? t('incomeLabel') : t('spendingLabel')}
                    </span>
                    <span className="text-muted-foreground" style={{ fontSize:'0.72rem' }}>
                      {new Date(tx.date).toLocaleDateString(language==='ru'?'ru-RU':language==='uzb'?'uz-UZ':'en-US', { year:'numeric', month:'short', day:'numeric' })}
                    </span>
                  </div>
                </div>
                <span className={`flex-shrink-0 ${tx.type==='income' ? 'text-income':'text-spending'}`} style={{ fontSize:'0.95rem', fontWeight:700 }}>
                  {tx.type==='income'?'+':'-'}{fmt(tx.amount)}
                </span>
                <button
                  onClick={() => handleDelete(tx.id)}
                  className={`flex-shrink-0 p-1.5 rounded-lg transition-all sm:opacity-0 sm:group-hover:opacity-100 ${deleteConfirm===tx.id ? 'bg-destructive/15 text-destructive !opacity-100':'text-muted-foreground hover:text-destructive hover:bg-destructive/10'}`}
                >
                  <Trash2 size={14}/>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <TransactionModal isOpen={modalOpen} onClose={() => setModalOpen(false)} defaultType={modalType}/>
    </div>
  );
}
