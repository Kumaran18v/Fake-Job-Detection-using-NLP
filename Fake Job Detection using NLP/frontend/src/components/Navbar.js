'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function Navbar() {
    const pathname = usePathname();
    const router = useRouter();
    const { user, logout } = useAuth();
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        const handler = () => setScrolled(window.scrollY > 10);
        window.addEventListener('scroll', handler);
        return () => window.removeEventListener('scroll', handler);
    }, []);

    const isActive = (path) => pathname === path;

    const navLinks = [
        { href: '/', label: 'Home' },
        { href: '/analyze', label: 'Analyze' },
        ...(user ? [{ href: '/dashboard', label: 'Dashboard' }] : []),
        ...(user?.role === 'admin' ? [{ href: '/admin', label: 'Admin' }] : []),
    ];

    return (
        <nav style={{
            position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
            padding: '0 clamp(16px, 4vw, 40px)', height: 64,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: scrolled ? 'var(--nav-bg)' : 'rgba(255,255,255,0.8)',
            backdropFilter: 'blur(12px)',
            borderBottom: scrolled ? '1px solid var(--border)' : '1px solid transparent',
            transition: 'all 0.3s ease',
        }}>
            {/* Logo */}
            <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
                {/* Shield + Magnifying Glass Icon */}
                <div style={{
                    width: 34, height: 34, borderRadius: 8,
                    background: 'linear-gradient(135deg, var(--primary), var(--primary-light))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontSize: '1rem',
                }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        <circle cx="12" cy="11" r="3" />
                    </svg>
                </div>
                <span style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '1.2rem',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    letterSpacing: '-0.01em',
                }}>
                    JobCheck
                </span>
            </Link>

            {/* Desktop Nav Links */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {navLinks.map(({ href, label }) => (
                    <Link
                        key={href} href={href}
                        style={{
                            textDecoration: 'none',
                            fontFamily: 'var(--font-body)',
                            fontSize: '0.875rem',
                            fontWeight: 500,
                            color: isActive(href) ? 'var(--primary)' : 'var(--text-secondary)',
                            padding: '8px 16px',
                            borderRadius: 'var(--radius-md)',
                            background: isActive(href) ? 'var(--primary-lighter)' : 'transparent',
                            transition: 'all 0.2s ease',
                        }}
                    >
                        {label}
                    </Link>
                ))}

                <div style={{ width: 1, height: 24, background: 'var(--border)', margin: '0 8px' }} />

                {user ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.78rem',
                            color: 'var(--text-muted)',
                            padding: '4px 10px',
                            background: 'var(--bg-subtle)',
                            borderRadius: 'var(--radius-sm)',
                        }}>
                            {user.username}
                        </span>
                        <button
                            onClick={() => { logout(); router.push('/'); }}
                            style={{
                                fontFamily: 'var(--font-body)',
                                fontSize: '0.875rem',
                                fontWeight: 500,
                                color: 'var(--text-secondary)',
                                background: 'none',
                                border: '1px solid var(--border)',
                                borderRadius: 'var(--radius-md)',
                                padding: '8px 16px',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                            }}
                        >
                            Sign Out
                        </button>
                    </div>
                ) : (
                    <Link href="/login" style={{
                        fontFamily: 'var(--font-body)',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        color: 'var(--text-inverse)',
                        background: 'var(--primary)',
                        padding: '8px 20px',
                        borderRadius: 'var(--radius-md)',
                        textDecoration: 'none',
                        transition: 'all 0.2s ease',
                    }}>
                        Sign In
                    </Link>
                )}
            </div>
        </nav>
    );
}
