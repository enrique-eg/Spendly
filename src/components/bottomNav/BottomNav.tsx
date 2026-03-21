import { NavLink } from 'react-router-dom';
import './bottomNav.css';

export default function BottomNav() {
  const items = [
    { to: '/home', icon: 'home', label: 'HOME' },
    { to: '/subscriptions', icon: 'credit_card', label: 'SUBS' },
    { to: '/goals', icon: 'bolt', label: 'GOALS' },
    { to: '/budgets', icon: 'wallet', label: 'BUDGETS' },
    { to: '/ai', icon: 'sparkles', label: 'AI' }
  ];

  return (
    <nav className="bottom-nav">
      {items.map((it) => (
        <NavLink
          key={it.to}
          to={it.to}
          className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}
        >
          <span className="material-symbols-outlined nav-icon">{it.icon}</span>
          <span className="nav-label">{it.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
