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

    useEffect(() => {
        const handler = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handler);
        return () => window.removeEventListener('scroll', handler);
    }, []);

    const isActive = (path) => pathname === path;

    return (
        <nav
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                zIndex: 100,
                padding: '0 40px',
                height: 60,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: scrolled ? 'rgba(26, 26, 26, 0.95)' : 'transparent',
                backdropFilter: scrolled ? 'blur(10px)' : 'none',
                borderBottom: scrolled ? '1px solid var(--charcoal-lighter)' : '1px solid transparent',
                transition: 'all 0.3s ease',
            }}
        >
            {/* Logo */}
            <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                    width: 8,
                    height: 8,
                    background: 'var(--red)',
                    transform: 'rotate(45deg)',
                }} />
                <span style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '1.4rem',
                    letterSpacing: '0.1em',
                    color: 'var(--off-white)',
                }}>
                    JOBCHECK
                </span>
            </Link>

            {/* Nav Links */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
                {[
                    { href: '/', label: 'HOME' },
                    { href: '/analyze', label: 'ANALYZE' },
                    ...(user?.role === 'admin' ? [{ href: '/admin', label: 'ADMIN' }] : []),
                ].map(({ href, label }) => (
                    <Link
                        key={href}
                        href={href}
                        style={{
                            textDecoration: 'none',
                            fontFamily: 'var(--font-body)',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            letterSpacing: '0.12em',
                            color: isActive(href) ? 'var(--off-white)' : 'var(--bone-muted)',
                            borderBottom: isActive(href) ? '1px solid var(--red)' : '1px solid transparent',
                            paddingBottom: 2,
                            transition: 'all 0.2s ease',
                        }}
                    >
                        {label}
                    </Link>
                ))}

                {user ? (
                    <button
                        onClick={() => { logout(); router.push('/'); }}
                        style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.7rem',
                            fontWeight: 500,
                            letterSpacing: '0.06em',
                            color: 'var(--bone-muted)',
                            background: 'none',
                            border: '1px solid var(--charcoal-lighter)',
                            padding: '6px 16px',
                            cursor: 'pointer',
                            textTransform: 'uppercase',
                            transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={e => e.target.style.borderColor = 'var(--red)'}
                        onMouseLeave={e => e.target.style.borderColor = 'var(--charcoal-lighter)'}
                    >
                        EXIT
                    </button>
                ) : (
                    <Link
                        href="/login"
                        style={{
                            fontFamily: 'var(--font-body)',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            letterSpacing: '0.1em',
                            color: 'var(--charcoal)',
                            background: 'var(--off-white)',
                            padding: '8px 20px',
                            textDecoration: 'none',
                            textTransform: 'uppercase',
                            transition: 'all 0.15s ease',
                        }}
                    >
                        ACCESS
                    </Link>
                )}
            </div>
        </nav>
    );
}
