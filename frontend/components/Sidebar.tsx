'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Target, Search, Settings, LogOut, Zap } from 'lucide-react';
import { getSession, clearSession } from '@/services/auth';
import { useEffect, useState } from 'react';

const NAV = [
  { href: '/dashboard',          label: 'Dashboard',           icon: LayoutDashboard },
  { href: '/leads',              label: 'Meus Leads',          icon: Target },
  { href: '/search',             label: 'Buscar Leads',        icon: Search },
  { href: '/opportunity-engine', label: 'Opportunity Engine',  icon: Zap },
  { href: '/settings',           label: 'Configurações',       icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router   = useRouter();
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);

  useEffect(() => {
    const { user } = getSession();
    setUser(user);
  }, []);

  function handleLogout() {
    clearSession();
    router.push('/login');
  }

  const initials = user?.name
    ? user.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
    : 'U';

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <Link href="/dashboard" className="logo-mark">
          <div className="logo-icon">
            <Zap size={18} color="#fff" />
          </div>
          <span className="logo-text">Lead<span>Hunter</span> AI</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        <span className="nav-section-label">Menu</span>
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link key={href} href={href} className={`nav-item ${active ? 'active' : ''}`}>
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        {user && (
          <div className="user-chip" style={{ marginBottom: 8 }}>
            <div className="user-avatar">{initials}</div>
            <div className="user-info">
              <div className="user-name">{user.name}</div>
              <div className="user-email">{user.email}</div>
            </div>
          </div>
        )}
        <button className="nav-item" style={{ color: 'var(--danger)' }} onClick={handleLogout}>
          <LogOut size={16} />
          Sair
        </button>
      </div>
    </aside>
  );
}
