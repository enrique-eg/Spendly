import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getTransactionsByUser, createTransaction } from '../../services/transactionsService';
import { getAccountsByUser } from '../../services/accountsService';
import { getCurrencies } from '../../services/currenciesService';
import { getUserProfile } from '../../services/profilesService';
import { getExchangeRate } from '../../services/exchangeRatesService';
import SettingsSidebar from '../../components/settings-sidebar/SettingsSidebar';
import type { Transaction } from '../../models/Transaction';
import './home-page.css';

export default function HomePage() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [defaultCurrency, setDefaultCurrency] = useState('USD');
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    type: 'expense' as 'income' | 'expense' | 'transfer',
    currency: 'USD',
    account_id: '',
    transaction_date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      setLoading(true);
      const { data: transData, error: transError } = await getTransactionsByUser(user.id);
      const { data: accData, error: accError } = await getAccountsByUser(user.id);
      const { data: currData, error: currError } = await getCurrencies();
      const { data: profileData, error: profileError } = await getUserProfile(user.id);
      
      if (transError) {
        setError('Error al cargar las transacciones');
      } else {
        setTransactions(transData || []);
      }

      if (!accError && accData) {
        setAccounts(accData);
        if (accData.length > 0 && !formData.account_id) {
          setFormData(prev => ({ ...prev, account_id: accData[0].id }));
        }
      }

      if (!currError && currData) {
        setCurrencies(currData);
        if (currData.length > 0) {
          setFormData(prev => ({ ...prev, currency: currData[0].code }));
        }
      }

      if (!profileError && profileData?.default_currency) {
        setDefaultCurrency(profileData.default_currency);
      }

      setLoading(false);
    };

    loadData();
  }, [user]);

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      alert('Por favor, inicia sesión');
      return;
    }

    if (!formData.description || !formData.amount) {
      alert('Por favor, completa los campos requeridos');
      return;
    }

    if ((formData.type === 'expense' || formData.type === 'income') && !formData.account_id) {
      alert('Por favor, selecciona una cuenta');
      return;
    }

    let amount = parseFloat(formData.amount);
    let currency = formData.currency;

    // Si la moneda es diferente a la default, convertir automáticamente
    if (currency !== defaultCurrency) {
      const { data: rateData, error: rateError } = await getExchangeRate(currency, defaultCurrency);
      if (rateError || !rateData?.rate) {
        alert('No se encontró tasa de cambio para esta moneda');
        return;
      }
      amount = amount * rateData.rate;
      currency = defaultCurrency;
    }

    const newTransaction: Partial<Transaction> = {
      user_id: user.id,
      type: formData.type,
      amount,
      currency,
      transaction_date: new Date(formData.transaction_date).toISOString(),
      description: formData.description,
      ...(formData.type !== 'transfer' && { account_id: formData.account_id })
    };

    const { data, error: createError } = await createTransaction(newTransaction);

    if (createError) {
      console.error('Error detallado:', createError);
      alert('Error al crear la transacción: ' + (createError as any).message);
    } else {
      setTransactions([data as Transaction, ...transactions]);
      setShowModal(false);
      setFormData({
        description: '',
        amount: '',
        type: 'expense',
        currency: currencies.length > 0 ? currencies[0].code : 'USD',
        account_id: accounts.length > 0 ? accounts[0].id : '',
        transaction_date: new Date().toISOString().split('T')[0]
      });
    }
  };

  if (!user) {
    return <div className="home-page"><p>Por favor, inicia sesión</p></div>;
  }

  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalBalance = totalIncome - totalExpenses;

  return (
    <div className="home-page">
      <header className="home-header">
        <div className="header-left">
          <div className="logo-circle">
            <span className="material-symbols-outlined">wallet</span>
          </div>
          <h1>Spendly</h1>
        </div>
        <button className="settings-btn" onClick={() => setShowSettings(true)}>
          <span className="material-symbols-outlined">settings</span>
        </button>
      </header>

      <main className="home-main">
        <div className="cards-section">
          <div className="balance-card">
            <div className="card-header-top">
              <span className="balance-label">Balance</span>
              <span className="material-symbols-outlined">payments</span>
            </div>
            <div className="balance-amount">${totalBalance.toFixed(2)}</div>
          </div>

          <div className="stats-grid">
            <div className="stat-card income">
              <div className="stat-header">
                <span className="stat-label">Income</span>
              </div>
              <div className="stat-amount">${totalIncome.toFixed(2)}</div>
            </div>

            <div className="stat-card expense">
              <div className="stat-header">
                <span className="stat-label">Expenses</span>
              </div>
              <div className="stat-amount">-${totalExpenses.toFixed(2)}</div>
            </div>
          </div>
        </div>

        <section className="transactions-section">
          <div className="section-header">
            <h2>Transactions</h2>
          </div>

          {loading && <p>Cargando...</p>}
          {error && <p style={{ color: 'red' }}>{error}</p>}
          {!loading && transactions.length === 0 && <p>Sin transacciones</p>}

          <div className="transactions-list">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="transaction-card">
                <div className={`transaction-icon ${transaction.type}`}>
                  <span className="material-symbols-outlined">receipt</span>
                </div>
                <div className="transaction-info">
                  <p className="transaction-name">{transaction.description || 'Transacción'}</p>
                  <p className="transaction-meta">{transaction.currency} • {transaction.transaction_date}</p>
                </div>
                <p className={`transaction-amount ${transaction.type}`}>
                  {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <button className="fab" onClick={() => setShowModal(true)}>
        <span className="material-symbols-outlined">add</span>
      </button>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Nueva Transacción</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <form onSubmit={handleAddTransaction} className="modal-form">
              <div className="form-group">
                <label>Descripción</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Ej: Café, Compra..."
                  required
                />
              </div>

              <div className="form-group">
                <label>Importe</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0.00"
                  required
                />
              </div>

              <div className="form-group">
                <label>Tipo</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as 'income' | 'expense' | 'transfer' })}
                >
                  <option value="expense">Gasto</option>
                  <option value="income">Ingreso</option>
                  <option value="transfer">Transferencia</option>
                </select>
              </div>

              {(formData.type === 'expense' || formData.type === 'income') && (
                <div className="form-group">
                  <label>Cuenta</label>
                  <select
                    value={formData.account_id}
                    onChange={(e) => setFormData({ ...formData, account_id: e.target.value })}
                    required
                  >
                    <option value="">Selecciona una cuenta</option>
                    {accounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name || account.id}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="form-group">
                <label>Moneda</label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  required
                >
                  <option value="">Selecciona una moneda</option>
                  {currencies.map((currency) => (
                    <option key={currency.code} value={currency.code}>
                      {currency.name} ({currency.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Fecha</label>
                <input
                  type="date"
                  value={formData.transaction_date}
                  onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
                  required
                />
              </div>

              <button type="submit" className="submit-btn">Crear</button>
            </form>
          </div>
        </div>
      )}

      <SettingsSidebar 
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        userId={user?.id || ''}
        defaultCurrency={defaultCurrency}
        onDefaultCurrencyChange={setDefaultCurrency}
      />
    </div>
  );
}
