'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navigation() {
  const pathname = usePathname();

  const navLinks = [
    { href: '/', label: 'Lista angajati' },
    { href: '/add-employee', label: 'Adauga angajat' },
    { href: '/settings', label: 'Setari legale' },
    { href: '/zile-lucratoare', label: 'Zile lucratoare' },
    { href: '/deducere-personala-oug-16-2022', label: 'Deducere personala - OUG 16/2022' },
  ];

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <nav style={{
      backgroundColor: '#ffffff',
      borderBottom: '1px solid #e0e0e0',
      padding: '0 40px',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        gap: '32px',
        alignItems: 'center',
        height: '64px'
      }}>
        {navLinks.map((link) => {
          const active = isActive(link.href);
          return (
            <Link 
              key={link.href}
              href={link.href} 
              style={{
                textDecoration: 'none',
                color: active ? '#1a1a1a' : '#808080',
                fontWeight: active ? '600' : '500',
                fontSize: active ? '18px' : '16px',
                padding: '8px 0',
                borderBottom: active ? '2px solid #D66185' : '2px solid transparent',
                transition: 'border-color 0.2s, color 0.2s',
                boxSizing: 'border-box'
              }}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

