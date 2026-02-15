'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function RegisterPage() {
    const [form, setForm] = useState({ username: '', email: '', password: '', confirmPassword: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const router = useRouter();

    const update = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!form.username || !form.email || !form.password) { setError('All fields required.'); return; }
        if (form.password !== form.confirmPassword) { setError('Passwords do not match.'); return; }
        if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
        setLoading(true);
        try {
            await register(form.username, form.email, form.password);
            router.push('/analyze');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const fields = [
        { key: 'username', label: 'USERNAME', type: 'text', placeholder: 'Choose a username', autoComplete: 'username' },
        { key: 'email', label: 'EMAIL', type: 'email', placeholder: 'your@email.com', autoComplete: 'email' },
        { key: 'password', label: 'PASSWORD', type: 'password', placeholder: 'Min 6 characters', autoComplete: 'new-password' },
        { key: 'confirmPassword', label: 'CONFIRM PASSWORD', type: 'password', placeholder: 'Re-enter password', autoComplete: 'new-password' },
    ];

    return (
        <>
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--charcoal)',
                position: 'relative',
            }}>
                {/* Grid decoration */}
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage: `
            linear-gradient(var(--charcoal-lighter) 1px, transparent 1px),
            linear-gradient(90deg, var(--charcoal-lighter) 1px, transparent 1px)
          `,
                    backgroundSize: '60px 60px',
                    opacity: 0.3,
                }} />

                <div style={{
                    position: 'relative',
                    zIndex: 2,
                    width: '100%',
                    maxWidth: 420,
                    padding: '0 24px',
                }}>
                    {/* Header */}
                    <div style={{ marginBottom: 40 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
                            <div style={{
                                width: 8,
                                height: 8,
                                background: 'var(--red)',
                                transform: 'rotate(45deg)',
                            }} />
                            <Link href="/" style={{
                                fontFamily: 'var(--font-display)',
                                fontSize: '1.3rem',
                                letterSpacing: '0.1em',
                                color: 'var(--off-white)',
                                textDecoration: 'none',
                            }}>
                                JOBCHECK
                            </Link>
                        </div>

                        <h1 style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: 'clamp(2.2rem, 6vw, 3rem)',
                            color: 'var(--off-white)',
                            lineHeight: 0.95,
                            marginBottom: 12,
                        }}>
                            REQUEST<br />ACCESS
                        </h1>
                        <p style={{
                            fontFamily: 'var(--font-body)',
                            fontSize: '0.85rem',
                            fontWeight: 300,
                            color: 'var(--bone-muted)',
                        }}>
                            Create your account to start detecting fraud.
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

                        {fields.map(({ key, label, type, placeholder, autoComplete }) => (
                            <div key={key}>
                                <label className="mono" style={{
                                    display: 'block',
                                    marginBottom: 8,
                                    fontSize: '0.68rem',
                                    letterSpacing: '0.1em',
                                }}>
                                    {label}
                                </label>
                                <input
                                    type={type}
                                    value={form[key]}
                                    onChange={update(key)}
                                    placeholder={placeholder}
                                    className="input-field"
                                    autoComplete={autoComplete}
                                />
                            </div>
                        ))}

                        <button
                            type="submit"
                            className="btn-primary"
                            disabled={loading}
                            style={{ marginTop: 8, width: '100%', textAlign: 'center' }}
                        >
                            {loading ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}
                        </button>
                    </form>

                    {/* Footer */}
                    <div style={{
                        marginTop: 28,
                        paddingTop: 20,
                        borderTop: '1px solid var(--charcoal-lighter)',
                    }}>
                        <p style={{
                            fontFamily: 'var(--font-body)',
                            fontSize: '0.82rem',
                            color: 'var(--bone-muted)',
                            fontWeight: 300,
                        }}>
                            Already have access?{' '}
                            <Link href="/login" style={{
                                color: 'var(--off-white)',
                                textDecoration: 'none',
                                borderBottom: '1px solid var(--red)',
                                paddingBottom: 1,
                                fontWeight: 500,
                            }}>
                                Authenticate
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}
