'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { login } = useAuth();
    const router = useRouter();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!username || !password) { setError('All fields required.'); return; }
        setLoading(true);
        try {
            await login(username, password);
            router.push('/analyze');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div style={{
                position: 'relative',
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
            }}>
                {/* Video Background */}
                <div className="video-bg-container">
                    <video autoPlay muted loop playsInline>
                        <source src="/videos/login-bg.mp4" type="video/mp4" />
                    </video>
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'rgba(17, 17, 17, 0.82)',
                        zIndex: 1,
                    }} />
                </div>

                {/* Login Card */}
                <div style={{
                    position: 'relative',
                    zIndex: 2,
                    width: '100%',
                    maxWidth: 420,
                    padding: '0 24px',
                }}>
                    {/* Header */}
                    <div style={{ marginBottom: 48 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
                            <div style={{
                                width: 8,
                                height: 8,
                                background: 'var(--red)',
                                transform: 'rotate(45deg)',
                            }} />
                            <span style={{
                                fontFamily: 'var(--font-display)',
                                fontSize: '1.3rem',
                                letterSpacing: '0.1em',
                                color: 'var(--off-white)',
                            }}>
                                JOBCHECK
                            </span>
                        </div>

                        <h1 style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: 'clamp(2.5rem, 6vw, 3.5rem)',
                            color: 'var(--off-white)',
                            lineHeight: 0.95,
                            marginBottom: 12,
                        }}>
                            SECURE<br />ACCESS
                        </h1>
                        <p style={{
                            fontFamily: 'var(--font-body)',
                            fontSize: '0.88rem',
                            fontWeight: 300,
                            color: 'var(--bone-muted)',
                            lineHeight: 1.5,
                        }}>
                            Authenticate to access the fraud detection system.
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {error && (
                            <div style={{
                                padding: '12px 16px',
                                background: 'var(--red-dim)',
                                borderLeft: '3px solid var(--red)',
                                fontFamily: 'var(--font-mono)',
                                fontSize: '0.75rem',
                                color: 'var(--red)',
                                letterSpacing: '0.04em',
                            }}>
                                ■ {error.toUpperCase()}
                            </div>
                        )}

                        <div>
                            <label className="mono" style={{
                                display: 'block',
                                marginBottom: 8,
                                fontSize: '0.68rem',
                                letterSpacing: '0.1em',
                            }}>
                                USERNAME
                            </label>
                            <input
                                type="text"
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                placeholder="Enter username"
                                className="input-field"
                                autoComplete="username"
                            />
                        </div>

                        <div>
                            <label className="mono" style={{
                                display: 'block',
                                marginBottom: 8,
                                fontSize: '0.68rem',
                                letterSpacing: '0.1em',
                            }}>
                                PASSWORD
                            </label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="Enter password"
                                    className="input-field"
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{
                                        position: 'absolute',
                                        right: 12,
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'none',
                                        border: 'none',
                                        fontFamily: 'var(--font-mono)',
                                        fontSize: '0.65rem',
                                        color: 'var(--bone-muted)',
                                        cursor: 'pointer',
                                        letterSpacing: '0.06em',
                                    }}
                                >
                                    {showPassword ? 'HIDE' : 'SHOW'}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="btn-primary"
                            disabled={loading}
                            style={{ marginTop: 8, width: '100%', textAlign: 'center' }}
                        >
                            {loading ? 'AUTHENTICATING...' : 'AUTHENTICATE'}
                        </button>
                    </form>

                    {/* Footer */}
                    <div style={{
                        marginTop: 32,
                        paddingTop: 24,
                        borderTop: '1px solid var(--charcoal-lighter)',
                    }}>
                        <p style={{
                            fontFamily: 'var(--font-body)',
                            fontSize: '0.82rem',
                            color: 'var(--bone-muted)',
                            fontWeight: 300,
                        }}>
                            Need an account?{' '}
                            <Link href="/register" style={{
                                color: 'var(--off-white)',
                                textDecoration: 'none',
                                borderBottom: '1px solid var(--red)',
                                paddingBottom: 1,
                                fontWeight: 500,
                            }}>
                                Request access
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Corner Decorations */}
                <div style={{
                    position: 'absolute',
                    top: 32,
                    right: 40,
                    zIndex: 2,
                }}>
                    <span className="mono" style={{ fontSize: '0.6rem', color: 'var(--bone-muted)' }}>
                        ■ SYS // AUTH_GATEWAY
                    </span>
                </div>
                <div style={{
                    position: 'absolute',
                    bottom: 32,
                    left: 40,
                    zIndex: 2,
                }}>
                    <span className="mono" style={{ fontSize: '0.6rem', color: 'var(--charcoal-lighter)' }}>
                        JOBCHECK V1.0 — ENCRYPTED SESSION
                    </span>
                </div>
            </div>
        </>
    );
}
