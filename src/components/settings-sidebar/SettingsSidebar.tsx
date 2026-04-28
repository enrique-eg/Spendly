import { useState, useEffect } from 'react';
import { getCurrencies } from '../../services/currenciesService';
import { updateUserProfile } from '../../services/profilesService';
import { logout } from '../../services/authService';
import './settings-sidebar.css';

interface SettingsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  defaultCurrency: string;
  onDefaultCurrencyChange: (currency: string) => void;
}

export default function SettingsSidebar({ isOpen, onClose, userId, defaultCurrency, onDefaultCurrencyChange }: SettingsSidebarProps) {
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCurrencies = async () => {
      const { data } = await getCurrencies();
      if (data) {
        setCurrencies(data);
      }
      setLoading(false);
    };
    loadCurrencies();
  }, []);

  const handleCurrencyChange = async (newCurrency: string) => {
    onDefaultCurrencyChange(newCurrency);
    
    // Actualizar en la base de datos
    const { error } = await updateUserProfile(userId, { default_currency: newCurrency });
    if (error) {
      console.error('Error al actualizar moneda por defecto:', error);
    }
  };

  const handleLogout = async () => {
    const { error } = await logout();
    if (error) {
      console.error('Error al cerrar sesión:', error);
      alert('No se pudo cerrar sesión');
      return;
    }
    onClose();
  };

  return (
    <>
      {isOpen && <div className="settings-overlay" onClick={onClose} />}
      <div className={`settings-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="settings-header">
          <h2>Configuración</h2>
          <button className="settings-close" onClick={onClose} aria-label="Cerrar">✕</button>
        </div>

        <div className="settings-content">
          <div className="settings-group">
            <label>Moneda por Defecto</label>
            {loading ? (
              <p>Cargando monedas...</p>
            ) : (
              <select
                value={defaultCurrency}
                onChange={(e) => handleCurrencyChange(e.target.value)}
              >
                {currencies.map((currency) => (
                  <option key={currency.code} value={currency.code}>
                    {currency.name} ({currency.code})
                  </option>
                ))}
              </select>
            )}
          </div>
          <div style={{ marginTop: '1.5rem' }}>
            <button className="logout-btn" onClick={handleLogout}>Cerrar sesión</button>
          </div>
        </div>
      </div>
    </>
  );
}
