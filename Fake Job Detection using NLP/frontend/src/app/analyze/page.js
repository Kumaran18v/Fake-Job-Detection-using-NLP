'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';

/* ─── Utility: format ISO date to local readable ─── */
function formatLocalTime(isoString) {
    if (!isoString) return '—';
    try {
        const dateStr = isoString.endsWith('Z') || isoString.includes('+')
            ? isoString
            : isoString + 'Z';
        const d = new Date(dateStr);
        return d.toLocaleString('en-IN', {
            month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit', hour12: true,
        });
    } catch {
        return isoString;
    }
}

const SAMPLE_TEXTS = [
    {
        label: 'SUSPICIOUS POST',
        text: 'EARN $5000 WEEKLY from home! No experience needed! Send your bank details and SSN to get started. Pay $200 processing fee to secure your position. Limited spots - act now before it\'s too late! Contact us on WhatsApp immediately.',
    },
    {
        label: 'LEGITIMATE POST',
        text: 'We are looking for a Senior Software Engineer with 5+ years of experience in Python and React. You will work with a team of 12 engineers building our cloud infrastructure platform. Requirements: BS in Computer Science, experience with AWS, strong communication skills. Benefits include health insurance, 401k matching, and 20 days PTO. Apply through our careers page with your resume.',
    },
];

export default function AnalyzePage() {
    const { user, token } = useAuth();
    const [jobText, setJobText] = useState('');
    const [loading, setLoading] = useState(false);
    const [phase, setPhase] = useState('input'); // input | scanning | verdict
    const [result, setResult] = useState(null);
    const [scanProgress, setScanProgress] = useState(0);
    const [myHistory, setMyHistory] = useState([]);
    const [showHistory, setShowHistory] = useState(false);
    const textareaRef = useRef(null);

    // Fetch user's recent analyses if logged in
    useEffect(() => {
        if (token) {
            fetchMyHistory();
        }
    }, [token]);

    const fetchMyHistory = async () => {
        try {
            const res = await fetch('http://localhost:8000/api/my-predictions', {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setMyHistory(data.predictions || []);
            }
        } catch (err) {
            console.error('Failed to fetch history:', err);
        }
    };

    const analyze = async () => {
        if (!jobText.trim()) return;
        setLoading(true);
        setPhase('scanning');
        setScanProgress(0);
        setResult(null);

        // Scanning animation
        const scanInterval = setInterval(() => {
            setScanProgress(p => {
                if (p >= 95) { clearInterval(scanInterval); return 95; }
                return p + Math.random() * 15;
            });
        }, 120);

        try {
            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const res = await fetch('http://localhost:8000/api/predict', {
                method: 'POST',
                headers,
                body: JSON.stringify({ job_text: jobText }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || 'Analysis failed');

            clearInterval(scanInterval);
            setScanProgress(100);

            // Pause for dramatic effect
            setTimeout(() => {
                setResult(data);
                setPhase('verdict');
                setLoading(false);
                // Refresh history if logged in
                if (token) fetchMyHistory();
            }, 600);
        } catch (err) {
            clearInterval(scanInterval);
            setLoading(false);
            setPhase('input');
            alert(err.message);
        }
    };

    const reset = () => {
        setPhase('input');
        setResult(null);
        setJobText('');
        setScanProgress(0);
    };

    return (
        <>
            <div style={{
                minHeight: '100vh',
                paddingTop: 80,
                background: 'var(--charcoal-warm)',
            }}>
                {/* ═══ INPUT PHASE ═══ */}
                {phase === 'input' && (
                    <div style={{
                        maxWidth: 800,
                        margin: '0 auto',
                        padding: '60px 40px',
                    }}>
                        <div className="mono" style={{ color: 'var(--red)', marginBottom: 16 }}>
                            ■ ANALYSIS MODULE
                        </div>
                        <h1 style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: 'clamp(2.5rem, 6vw, 4rem)',
                            color: 'var(--off-white)',
                            lineHeight: 0.95,
                            marginBottom: 12,
                        }}>
                            PASTE THE<br />JOB POST.
                        </h1>
                        <p style={{
                            fontFamily: 'var(--font-body)',
                            fontWeight: 300,
                            fontSize: '0.95rem',
                            color: 'var(--bone-muted)',
                            marginBottom: 40,
                            maxWidth: 500,
                            lineHeight: 1.5,
                        }}>
                            Our NLP engine will scan for scam patterns, deceptive language, and structural red flags.
                            {!user && (
                                <span style={{ display: 'block', marginTop: 8, fontSize: '0.82rem', color: 'var(--bone-dim)' }}>
                                    <a href="/login" style={{ color: 'var(--teal)', textDecoration: 'none', borderBottom: '1px solid var(--teal)' }}>Sign in</a> to save and view your analysis history.
                                </span>
                            )}
                        </p>

                        {/* Sample buttons */}
                        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                            {SAMPLE_TEXTS.map(({ label, text }) => (
                                <button
                                    key={label}
                                    onClick={() => setJobText(text)}
                                    className="btn-outline"
                                    style={{ fontSize: '0.7rem', padding: '8px 14px' }}
                                >
                                    ↓ {label}
                                </button>
                            ))}
                        </div>

                        {/* Textarea */}
                        <textarea
                            ref={textareaRef}
                            value={jobText}
                            onChange={e => setJobText(e.target.value)}
                            placeholder="Paste job description here..."
                            style={{
                                width: '100%',
                                minHeight: 260,
                                resize: 'vertical',
                                padding: '20px',
                                background: 'var(--charcoal)',
                                border: '1px solid var(--charcoal-lighter)',
                                color: 'var(--off-white)',
                                fontFamily: 'var(--font-body)',
                                fontSize: '0.95rem',
                                lineHeight: 1.7,
                                outline: 'none',
                                transition: 'border-color 0.2s',
                            }}
                            onFocus={e => e.target.style.borderColor = 'var(--bone-muted)'}
                            onBlur={e => e.target.style.borderColor = 'var(--charcoal-lighter)'}
                        />

                        {/* Char count + Submit */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginTop: 16,
                        }}>
                            <span className="mono" style={{ fontSize: '0.65rem' }}>
                                {jobText.length} CHARACTERS
                            </span>
                            <button
                                onClick={analyze}
                                className="btn-primary"
                                disabled={!jobText.trim() || loading}
                                style={{ minWidth: 200 }}
                            >
                                RUN ANALYSIS
                            </button>
                        </div>

                        {/* ═══ USER HISTORY — only for logged-in users ═══ */}
                        {user && myHistory.length > 0 && (
                            <div style={{ marginTop: 56 }}>
                                <div
                                    onClick={() => setShowHistory(!showHistory)}
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        cursor: 'pointer',
                                        marginBottom: 16,
                                    }}
                                >
                                    <div className="mono" style={{ fontSize: '0.6rem', letterSpacing: '0.1em', color: 'var(--teal)' }}>
                                        ■ YOUR RECENT ANALYSES ({myHistory.length})
                                    </div>
                                    <span className="mono" style={{ fontSize: '0.65rem', color: 'var(--bone-muted)' }}>
                                        {showHistory ? '▲ HIDE' : '▼ SHOW'}
                                    </span>
                                </div>

                                {showHistory && (
                                    <div style={{
                                        background: 'var(--charcoal)',
                                        border: '1px solid var(--charcoal-lighter)',
                                        overflow: 'hidden',
                                    }}>
                                        {/* History Header */}
                                        <div style={{
                                            display: 'grid',
                                            gridTemplateColumns: '1fr 90px 70px 120px',
                                            borderBottom: '1px solid var(--charcoal-lighter)',
                                            padding: '10px 16px',
                                        }}>
                                            {['JOB TEXT', 'VERDICT', 'CONF.', 'TIME'].map(h => (
                                                <div key={h} className="mono" style={{ fontSize: '0.5rem', letterSpacing: '0.1em' }}>
                                                    {h}
                                                </div>
                                            ))}
                                        </div>

                                        {/* History Rows */}
                                        {myHistory.map((p, i) => (
                                            <div
                                                key={p.id}
                                                style={{
                                                    display: 'grid',
                                                    gridTemplateColumns: '1fr 90px 70px 120px',
                                                    padding: '12px 16px',
                                                    borderBottom: i < myHistory.length - 1 ? '1px solid var(--charcoal-lighter)' : 'none',
                                                    transition: 'background 0.1s',
                                                    cursor: 'default',
                                                }}
                                                onMouseEnter={e => e.currentTarget.style.background = 'var(--charcoal-light)'}
                                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                            >
                                                <div style={{
                                                    fontSize: '0.8rem',
                                                    color: 'var(--bone-dim)',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                    paddingRight: 12,
                                                }}>
                                                    {p.job_text}
                                                </div>
                                                <div>
                                                    <span className={p.prediction === 'Fake' ? 'tag-red' : 'tag-teal'}
                                                        style={{ fontSize: '0.6rem', padding: '2px 8px' }}
                                                    >
                                                        {p.prediction === 'Fake' ? 'FRAUD' : 'LEGIT'}
                                                    </span>
                                                </div>
                                                <div style={{
                                                    fontFamily: 'var(--font-mono)',
                                                    fontSize: '0.72rem',
                                                    color: p.prediction === 'Fake' ? 'var(--red)' : 'var(--teal)',
                                                }}>
                                                    {p.confidence}%
                                                </div>
                                                <div style={{
                                                    fontFamily: 'var(--font-mono)',
                                                    fontSize: '0.65rem',
                                                    color: 'var(--bone-muted)',
                                                }}>
                                                    {formatLocalTime(p.created_at)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* ═══ SCANNING PHASE ═══ */}
                {phase === 'scanning' && (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: 'calc(100vh - 80px)',
                        padding: '40px',
                    }}>
                        <div className="mono" style={{
                            color: 'var(--red)',
                            marginBottom: 32,
                            fontSize: '0.72rem',
                            animation: 'blink 1s infinite',
                        }}>
                            ■ SCANNING IN PROGRESS
                        </div>

                        <h2 style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: 'clamp(2rem, 5vw, 3.5rem)',
                            color: 'var(--off-white)',
                            textAlign: 'center',
                            marginBottom: 48,
                        }}>
                            ANALYZING<br />SIGNALS
                        </h2>

                        {/* Progress bar */}
                        <div style={{
                            width: '100%',
                            maxWidth: 400,
                            height: 2,
                            background: 'var(--charcoal-lighter)',
                            marginBottom: 16,
                            overflow: 'hidden',
                        }}>
                            <div style={{
                                height: '100%',
                                width: `${Math.min(scanProgress, 100)}%`,
                                background: 'var(--red)',
                                transition: 'width 0.1s linear',
                            }} />
                        </div>

                        <span className="mono" style={{ fontSize: '0.65rem' }}>
                            {Math.min(Math.round(scanProgress), 100)}% — CHECKING FRAUD VECTORS
                        </span>

                        {/* Scanning details */}
                        <div style={{
                            marginTop: 48,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 8,
                            opacity: 0.5,
                        }}>
                            {['Language patterns', 'Financial red flags', 'Identity harvesting signals', 'Structural anomalies', 'Urgency indicators'].map((item, i) => (
                                <div key={item} style={{
                                    fontFamily: 'var(--font-mono)',
                                    fontSize: '0.68rem',
                                    color: scanProgress > i * 20 ? 'var(--bone-dim)' : 'var(--charcoal-lighter)',
                                    letterSpacing: '0.04em',
                                    transition: 'color 0.3s',
                                }}>
                                    {scanProgress > i * 20 ? '✓' : '○'} {item.toUpperCase()}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ═══ VERDICT PHASE — THE BIG MOMENT ═══ */}
                {phase === 'verdict' && result && (
                    <div style={{
                        minHeight: 'calc(100vh - 80px)',
                        display: 'flex',
                        flexDirection: 'column',
                    }}>
                        {/* Verdict Hero */}
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '100px 40px 60px',
                            flex: 1,
                        }}>
                            {/* Stamp */}
                            <div
                                className={`verdict-stamp ${result.prediction === 'Fake' ? 'verdict-fraud' : 'verdict-legit'}`}
                                style={{
                                    animation: 'stamp-in 0.5s cubic-bezier(0.22, 0.61, 0.36, 1) forwards',
                                    marginBottom: 40,
                                }}
                            >
                                {result.prediction === 'Fake' ? 'LIKELY FRAUD' : 'LIKELY LEGIT'}
                            </div>

                            {/* Confidence */}
                            <div style={{
                                fontFamily: 'var(--font-mono)',
                                fontSize: '0.78rem',
                                letterSpacing: '0.06em',
                                color: 'var(--bone-muted)',
                                marginBottom: 24,
                            }}>
                                CONFIDENCE: <span style={{
                                    color: result.prediction === 'Fake' ? 'var(--red)' : 'var(--teal)',
                                    fontWeight: 600,
                                }}>
                                    {result.confidence}%
                                </span>
                            </div>

                            {/* Brutal explanation */}
                            <div style={{
                                maxWidth: 500,
                                padding: '20px 24px',
                                borderLeft: `3px solid ${result.prediction === 'Fake' ? 'var(--red)' : 'var(--teal)'}`,
                                background: result.prediction === 'Fake' ? 'var(--red-glow)' : 'var(--teal-glow)',
                                marginBottom: 48,
                            }}>
                                <p style={{
                                    fontFamily: 'var(--font-body)',
                                    fontSize: '0.95rem',
                                    fontWeight: 400,
                                    lineHeight: 1.6,
                                    color: 'var(--bone)',
                                    fontStyle: 'italic',
                                }}>
                                    {result.prediction === 'Fake'
                                        ? `This job posting shows patterns commonly associated with recruitment fraud. Our AI detected signals with ${result.confidence}% confidence that this is not a legitimate opportunity.`
                                        : `This job posting appears to be a legitimate opportunity. Standard job requirements, professional language, and structural integrity all check out.`
                                    }
                                </p>
                            </div>

                            {/* Confidence meter  */}
                            <div style={{
                                width: '100%',
                                maxWidth: 500,
                                marginBottom: 40,
                            }}>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    marginBottom: 8,
                                }}>
                                    <span className="mono" style={{ fontSize: '0.65rem', color: 'var(--teal)' }}>LEGIT</span>
                                    <span className="mono" style={{ fontSize: '0.65rem', color: 'var(--red)' }}>FRAUD</span>
                                </div>
                                <div style={{
                                    width: '100%',
                                    height: 4,
                                    background: 'var(--charcoal-lighter)',
                                    position: 'relative',
                                }}>
                                    <div style={{
                                        position: 'absolute',
                                        left: result.prediction === 'Fake'
                                            ? `${50 + (result.confidence / 2)}%`
                                            : `${50 - (result.confidence / 2)}%`,
                                        top: -4,
                                        width: 12,
                                        height: 12,
                                        background: result.prediction === 'Fake' ? 'var(--red)' : 'var(--teal)',
                                        transform: 'rotate(45deg)',
                                        transition: 'left 1s ease',
                                    }} />
                                    <div style={{
                                        position: 'absolute',
                                        left: '50%',
                                        top: -2,
                                        width: 1,
                                        height: 8,
                                        background: 'var(--bone-muted)',
                                    }} />
                                </div>
                            </div>

                            {/* Actions */}
                            <div style={{ display: 'flex', gap: 12 }}>
                                <button onClick={reset} className="btn-primary">
                                    ANALYZE ANOTHER
                                </button>
                                {result.prediction === 'Fake' && token && (
                                    <button
                                        className="btn-outline"
                                        onClick={async () => {
                                            try {
                                                await fetch('http://localhost:8000/api/flag', {
                                                    method: 'POST',
                                                    headers: {
                                                        'Content-Type': 'application/json',
                                                        'Authorization': `Bearer ${token}`,
                                                    },
                                                    body: JSON.stringify({
                                                        prediction_id: result.prediction_id,
                                                        reason: 'Flagged by user review',
                                                    }),
                                                });
                                                alert('Post flagged for review.');
                                            } catch (err) {
                                                alert('Failed to flag.');
                                            }
                                        }}
                                    >
                                        ⚑ FLAG FOR REVIEW
                                    </button>
                                )}
                            </div>

                            {/* Login prompt for guests */}
                            {!user && (
                                <div style={{
                                    marginTop: 24,
                                    padding: '12px 20px',
                                    border: '1px solid var(--charcoal-lighter)',
                                    background: 'var(--charcoal)',
                                }}>
                                    <span className="mono" style={{ fontSize: '0.6rem', color: 'var(--bone-muted)' }}>
                                        <a href="/login" style={{ color: 'var(--teal)', textDecoration: 'none', borderBottom: '1px solid var(--teal)' }}>
                                            Sign in
                                        </a>{' '}
                                        to save this result and access your analysis history
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Case File Details */}
                        <div style={{
                            borderTop: '1px solid var(--charcoal-lighter)',
                            padding: '40px',
                            background: 'var(--charcoal)',
                        }}>
                            <div style={{ maxWidth: 700, margin: '0 auto' }}>
                                <div className="mono" style={{ color: 'var(--bone-muted)', marginBottom: 16, fontSize: '0.68rem' }}>
                                    ■ CASE FILE #{result.prediction_id || '—'}
                                </div>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(3, 1fr)',
                                    gap: 1,
                                    background: 'var(--charcoal-lighter)',
                                }}>
                                    {[
                                        { label: 'CLASSIFICATION', value: result.prediction?.toUpperCase(), color: result.prediction === 'Fake' ? 'var(--red)' : 'var(--teal)' },
                                        { label: 'CONFIDENCE', value: `${result.confidence}%`, color: 'var(--off-white)' },
                                        { label: 'ANALYZED', value: formatLocalTime(result.analyzed_at), color: 'var(--bone-dim)' },
                                    ].map(({ label, value, color }) => (
                                        <div key={label} style={{ background: 'var(--charcoal)', padding: '20px 24px' }}>
                                            <div className="mono" style={{ fontSize: '0.6rem', marginBottom: 8 }}>{label}</div>
                                            <div style={{
                                                fontFamily: 'var(--font-display)',
                                                fontSize: '1.3rem',
                                                color,
                                            }}>
                                                {value}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
