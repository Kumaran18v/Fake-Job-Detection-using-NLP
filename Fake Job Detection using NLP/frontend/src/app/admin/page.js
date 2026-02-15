'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import {
    LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, BarChart, Bar, AreaChart, Area,
    CartesianGrid, Legend,
} from 'recharts';

const PIE_COLORS = ['#e63946', '#5f9ea0'];
const BAR_COLORS = ['#e63946', '#5f9ea0', '#d4a373'];

/* ─── Utility: format ISO date to local readable ─── */
function formatLocalTime(isoString) {
    if (!isoString) return '—';
    try {
        // Append Z if no timezone info, since backend stores UTC
        const dateStr = isoString.endsWith('Z') || isoString.includes('+')
            ? isoString
            : isoString + 'Z';
        const d = new Date(dateStr);
        return d.toLocaleString('en-IN', {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit', hour12: true,
        });
    } catch {
        return isoString;
    }
}

/* ─── Stat Card Component ─── */
function StatCard({ label, value, accent, sub }) {
    return (
        <div style={{
            background: 'var(--charcoal)',
            border: '1px solid var(--charcoal-lighter)',
            padding: '28px 24px',
        }}>
            <div className="mono" style={{ fontSize: '0.6rem', marginBottom: 12, letterSpacing: '0.1em' }}>
                {label}
            </div>
            <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: '2.5rem',
                lineHeight: 1,
                color: accent || 'var(--off-white)',
            }}>
                {value}
            </div>
            {sub && (
                <div className="mono" style={{ fontSize: '0.55rem', marginTop: 8, color: 'var(--bone-muted)' }}>
                    {sub}
                </div>
            )}
        </div>
    );
}

/* ─── Custom Tooltip ─── */
const customTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={{
            background: 'var(--charcoal)',
            border: '1px solid var(--charcoal-lighter)',
            padding: '10px 14px',
        }}>
            <div className="mono" style={{ fontSize: '0.6rem', marginBottom: 4 }}>{label}</div>
            {payload.map((p, i) => (
                <div key={i} style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.72rem',
                    color: p.color || p.fill,
                }}>
                    {p.name}: {p.value}
                </div>
            ))}
        </div>
    );
};

/* ─── Chart Axis Styles ─── */
const axisTickStyle = { fontFamily: 'JetBrains Mono', fontSize: 9, fill: '#8a8278' };
const gridStyle = { stroke: '#2a2825', strokeDasharray: '3 3' };

export default function AdminPage() {
    const { user, token } = useAuth();
    const router = useRouter();
    const [stats, setStats] = useState(null);
    const [predictions, setPredictions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [retraining, setRetraining] = useState(false);
    const [exportingPDF, setExportingPDF] = useState(false);
    const reportRef = useRef(null);

    useEffect(() => {
        if (!token) { router.push('/login'); return; }
        fetchData();
    }, [token, router]);

    const fetchData = async () => {
        try {
            const headers = { Authorization: `Bearer ${token}` };
            const [statsRes, predRes] = await Promise.all([
                fetch('http://localhost:8000/api/stats', { headers }),
                fetch('http://localhost:8000/api/predictions', { headers }),
            ]);
            const statsData = await statsRes.json();
            const predData = await predRes.json();
            setStats(statsData);
            setPredictions(predData.predictions || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleRetrain = async () => {
        if (!confirm('Retrain the model? This may take a few minutes.')) return;
        setRetraining(true);
        try {
            await fetch('http://localhost:8000/api/retrain', {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });
            alert('Model retrained successfully.');
            fetchData();
        } catch (err) {
            alert('Retrain failed.');
        } finally {
            setRetraining(false);
        }
    };

    const exportCSV = () => {
        const rows = [['ID', 'Prediction', 'Confidence', 'Date']];
        predictions.forEach(p => {
            rows.push([p.id, p.prediction, p.confidence, formatLocalTime(p.created_at)]);
        });
        const csv = rows.map(r => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `jobcheck_report_${new Date().toISOString().slice(0, 10)}.csv`; a.click();
        URL.revokeObjectURL(url);
    };

    const exportPDF = async () => {
        if (!reportRef.current) return;
        setExportingPDF(true);
        try {
            const html2canvas = (await import('html2canvas')).default;
            const { jsPDF } = await import('jspdf');

            const canvas = await html2canvas(reportRef.current, {
                backgroundColor: '#1e1d1b',
                scale: 2,
                useCORS: true,
                logging: false,
            });

            const imgData = canvas.toDataURL('image/png');
            const imgWidth = 210; // A4 width in mm
            const pageHeight = 297; // A4 height in mm
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            const pdf = new jsPDF('p', 'mm', 'a4');

            // Add pages if content is taller than one page
            let heightLeft = imgHeight;
            let position = 0;

            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            while (heightLeft > 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }

            pdf.save(`jobcheck_report_${new Date().toISOString().slice(0, 10)}.pdf`);
        } catch (err) {
            console.error('PDF export failed:', err);
            alert('PDF export failed. Check console.');
        } finally {
            setExportingPDF(false);
        }
    };

    if (loading) {
        return (
            <>
                <div style={{
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}>
                    <span className="mono" style={{ animation: 'blink 1s infinite' }}>
                        ■ LOADING DASHBOARD
                    </span>
                </div>
            </>
        );
    }

    /* ── Derived Data ── */
    const pieData = stats ? [
        { name: 'Fraud', value: stats.total_fake || 0 },
        { name: 'Legit', value: stats.total_real || 0 },
    ] : [];

    const trendData = stats?.daily_trend || [];

    // Model comparison bar chart data from all_results
    const modelCompData = stats?.model_info?.all_results?.map(r => ({
        name: r.model?.replace('Regression', 'Reg.').replace('Gradient Boosting', 'GBoosting'),
        Accuracy: Math.round((r.accuracy || 0) * 100),
        Precision: Math.round((r.precision || 0) * 100),
        Recall: Math.round((r.recall || 0) * 100),
    })) || [];

    // Confidence distribution from recent predictions
    const confBuckets = { '0-20%': 0, '20-40%': 0, '40-60%': 0, '60-80%': 0, '80-100%': 0 };
    predictions.forEach(p => {
        const c = p.confidence;
        if (c <= 20) confBuckets['0-20%']++;
        else if (c <= 40) confBuckets['20-40%']++;
        else if (c <= 60) confBuckets['40-60%']++;
        else if (c <= 80) confBuckets['60-80%']++;
        else confBuckets['80-100%']++;
    });
    const confDistData = Object.entries(confBuckets).map(([range, count]) => ({ range, count }));

    // Fraud rate percentage
    const fraudRate = stats?.total_predictions > 0
        ? ((stats.total_fake / stats.total_predictions) * 100).toFixed(1)
        : '0';

    return (
        <>
            <div style={{
                minHeight: '100vh',
                paddingTop: 80,
                background: 'var(--charcoal-warm)',
            }}>
                <div ref={reportRef} style={{
                    maxWidth: 1200,
                    margin: '0 auto',
                    padding: '40px',
                }}>
                    {/* ═══ HEADER ═══ */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: 48,
                    }}>
                        <div>
                            <div className="mono" style={{ color: 'var(--red)', marginBottom: 12 }}>
                                ■ ADMIN CONSOLE
                            </div>
                            <h1 style={{
                                fontFamily: 'var(--font-display)',
                                fontSize: 'clamp(2rem, 5vw, 3.5rem)',
                                color: 'var(--off-white)',
                                lineHeight: 0.95,
                            }}>
                                SYSTEM<br />OVERVIEW
                            </h1>
                        </div>
                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                            <button onClick={exportCSV} className="btn-outline" style={{ fontSize: '0.7rem', padding: '10px 18px' }}>
                                ↓ CSV
                            </button>
                            <button
                                onClick={exportPDF}
                                className="btn-outline"
                                disabled={exportingPDF}
                                style={{ fontSize: '0.7rem', padding: '10px 18px' }}
                            >
                                {exportingPDF ? '⏳ EXPORTING...' : '↓ PDF REPORT'}
                            </button>
                            <button
                                onClick={handleRetrain}
                                className="btn-danger"
                                disabled={retraining}
                                style={{ fontSize: '0.7rem', padding: '10px 18px' }}
                            >
                                {retraining ? 'TRAINING...' : '⟳ RETRAIN MODEL'}
                            </button>
                        </div>
                    </div>

                    {/* ═══ STATS GRID ═══ */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(4, 1fr)',
                        gap: 1,
                        background: 'var(--charcoal-lighter)',
                        marginBottom: 48,
                    }}>
                        <StatCard label="TOTAL SCANS" value={stats?.total_predictions || 0} />
                        <StatCard label="FRAUD DETECTED" value={stats?.total_fake || 0} accent="var(--red)" sub={`${fraudRate}% OF TOTAL`} />
                        <StatCard label="VERIFIED LEGIT" value={stats?.total_real || 0} accent="var(--teal)" />
                        <StatCard
                            label="MODEL ACCURACY"
                            value={stats?.model_info?.accuracy ? `${(stats.model_info.accuracy * 100).toFixed(0)}%` : '—'}
                            sub={stats?.model_info?.model_name || ''}
                        />
                    </div>

                    {/* ═══ ROW 1: Trend + Donut ═══ */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '2fr 1fr',
                        gap: 1,
                        background: 'var(--charcoal-lighter)',
                        marginBottom: 2,
                    }}>
                        {/* Area Trend Chart */}
                        <div style={{ background: 'var(--charcoal)', padding: '28px 24px' }}>
                            <div className="mono" style={{ fontSize: '0.6rem', marginBottom: 20, letterSpacing: '0.1em' }}>
                                ■ DAILY SCAN VOLUME
                            </div>
                            {trendData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={220}>
                                    <AreaChart data={trendData}>
                                        <CartesianGrid {...gridStyle} />
                                        <XAxis dataKey="date" tick={axisTickStyle} axisLine={{ stroke: '#3a3835' }} tickLine={false} />
                                        <YAxis tick={axisTickStyle} axisLine={false} tickLine={false} />
                                        <Tooltip content={customTooltip} />
                                        <Area type="monotone" dataKey="fake" stroke="#e63946" fill="#e6394620" strokeWidth={2} name="Fraud" />
                                        <Area type="monotone" dataKey="real" stroke="#5f9ea0" fill="#5f9ea020" strokeWidth={2} name="Legit" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <span className="mono" style={{ fontSize: '0.65rem' }}>NO TREND DATA</span>
                                </div>
                            )}
                        </div>

                        {/* Donut Chart */}
                        <div style={{ background: 'var(--charcoal)', padding: '28px 24px' }}>
                            <div className="mono" style={{ fontSize: '0.6rem', marginBottom: 20, letterSpacing: '0.1em' }}>
                                ■ CLASSIFICATION SPLIT
                            </div>
                            <ResponsiveContainer width="100%" height={180}>
                                <PieChart>
                                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={2} dataKey="value" stroke="none">
                                        {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                                    </Pie>
                                    <Tooltip content={customTooltip} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 8 }}>
                                {[{ c: '#e63946', l: 'FRAUD' }, { c: '#5f9ea0', l: 'LEGIT' }].map(({ c, l }) => (
                                    <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <div style={{ width: 8, height: 8, background: c }} />
                                        <span className="mono" style={{ fontSize: '0.6rem' }}>{l}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* ═══ ROW 2: Model Comparison + Confidence Distribution ═══ */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: 1,
                        background: 'var(--charcoal-lighter)',
                        marginBottom: 48,
                    }}>
                        {/* Model Comparison Bar Chart */}
                        <div style={{ background: 'var(--charcoal)', padding: '28px 24px' }}>
                            <div className="mono" style={{ fontSize: '0.6rem', marginBottom: 20, letterSpacing: '0.1em' }}>
                                ■ MODEL COMPARISON
                            </div>
                            {modelCompData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={220}>
                                    <BarChart data={modelCompData} barCategoryGap="20%">
                                        <CartesianGrid {...gridStyle} />
                                        <XAxis dataKey="name" tick={{ ...axisTickStyle, fontSize: 8 }} axisLine={{ stroke: '#3a3835' }} tickLine={false} />
                                        <YAxis domain={[0, 100]} tick={axisTickStyle} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                                        <Tooltip content={customTooltip} />
                                        <Bar dataKey="Accuracy" fill="#e63946" radius={[2, 2, 0, 0]} />
                                        <Bar dataKey="Precision" fill="#5f9ea0" radius={[2, 2, 0, 0]} />
                                        <Bar dataKey="Recall" fill="#d4a373" radius={[2, 2, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <span className="mono" style={{ fontSize: '0.65rem' }}>NO MODEL DATA</span>
                                </div>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 12 }}>
                                {[{ c: '#e63946', l: 'ACCURACY' }, { c: '#5f9ea0', l: 'PRECISION' }, { c: '#d4a373', l: 'RECALL' }].map(({ c, l }) => (
                                    <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                        <div style={{ width: 8, height: 8, background: c }} />
                                        <span className="mono" style={{ fontSize: '0.5rem' }}>{l}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Confidence Distribution */}
                        <div style={{ background: 'var(--charcoal)', padding: '28px 24px' }}>
                            <div className="mono" style={{ fontSize: '0.6rem', marginBottom: 20, letterSpacing: '0.1em' }}>
                                ■ CONFIDENCE DISTRIBUTION
                            </div>
                            <ResponsiveContainer width="100%" height={220}>
                                <BarChart data={confDistData} barCategoryGap="15%">
                                    <CartesianGrid {...gridStyle} />
                                    <XAxis dataKey="range" tick={{ ...axisTickStyle, fontSize: 8 }} axisLine={{ stroke: '#3a3835' }} tickLine={false} />
                                    <YAxis tick={axisTickStyle} axisLine={false} tickLine={false} />
                                    <Tooltip content={customTooltip} />
                                    <Bar dataKey="count" name="Predictions" radius={[2, 2, 0, 0]}>
                                        {confDistData.map((_, i) => (
                                            <Cell key={i} fill={i < 2 ? '#5f9ea020' : i < 4 ? '#d4a37380' : '#e6394690'}
                                                stroke={i < 2 ? '#5f9ea0' : i < 4 ? '#d4a373' : '#e63946'}
                                                strokeWidth={1}
                                            />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                            <div className="mono" style={{ textAlign: 'center', fontSize: '0.5rem', color: 'var(--bone-muted)', marginTop: 8 }}>
                                LOWER = UNCERTAIN · HIGHER = CONFIDENT
                            </div>
                        </div>
                    </div>

                    {/* ═══ ACTIVE MODEL INFO ═══ */}
                    {stats?.model_info && (
                        <div style={{
                            background: 'var(--charcoal)',
                            border: '1px solid var(--charcoal-lighter)',
                            padding: '28px 24px',
                            marginBottom: 48,
                        }}>
                            <div className="mono" style={{ fontSize: '0.6rem', marginBottom: 16, letterSpacing: '0.1em' }}>
                                ■ ACTIVE MODEL
                            </div>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(5, 1fr)',
                                gap: 24,
                            }}>
                                {[
                                    { k: 'NAME', v: stats.model_info.model_name || '—' },
                                    { k: 'VERSION', v: stats.model_info.version || '—' },
                                    { k: 'ACCURACY', v: stats.model_info.accuracy ? `${(stats.model_info.accuracy * 100).toFixed(1)}%` : '—' },
                                    { k: 'F1 SCORE', v: stats.model_info.f1_score ? `${(stats.model_info.f1_score * 100).toFixed(1)}%` : '—' },
                                    { k: 'TRAINED', v: formatLocalTime(stats.model_info.trained_at) },
                                ].map(({ k, v }) => (
                                    <div key={k}>
                                        <div className="mono" style={{ fontSize: '0.55rem', marginBottom: 6, color: 'var(--bone-muted)' }}>{k}</div>
                                        <div style={{
                                            fontFamily: 'var(--font-mono)',
                                            fontSize: '0.82rem',
                                            color: 'var(--off-white)',
                                        }}>
                                            {v}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ═══ PREDICTIONS TABLE ═══ */}
                    <div>
                        <div className="mono" style={{ fontSize: '0.6rem', marginBottom: 16, letterSpacing: '0.1em' }}>
                            ■ RECENT PREDICTIONS ({predictions.length})
                        </div>
                        <div style={{
                            background: 'var(--charcoal)',
                            border: '1px solid var(--charcoal-lighter)',
                            overflow: 'hidden',
                        }}>
                            {/* Table Header */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: '60px 1fr 100px 80px 200px',
                                borderBottom: '1px solid var(--charcoal-lighter)',
                                padding: '12px 20px',
                            }}>
                                {['ID', 'JOB TEXT', 'VERDICT', 'CONF.', 'DATE & TIME'].map(h => (
                                    <div key={h} className="mono" style={{ fontSize: '0.55rem', letterSpacing: '0.1em' }}>
                                        {h}
                                    </div>
                                ))}
                            </div>

                            {/* Table Rows */}
                            {predictions.slice(0, 20).map((p, i) => (
                                <div
                                    key={p.id}
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: '60px 1fr 100px 80px 200px',
                                        padding: '14px 20px',
                                        borderBottom: i < Math.min(predictions.length, 20) - 1 ? '1px solid var(--charcoal-lighter)' : 'none',
                                        transition: 'background 0.1s',
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'var(--charcoal-light)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                >
                                    <div style={{
                                        fontFamily: 'var(--font-mono)',
                                        fontSize: '0.75rem',
                                        color: 'var(--bone-muted)',
                                    }}>
                                        #{p.id}
                                    </div>
                                    <div style={{
                                        fontSize: '0.82rem',
                                        color: 'var(--bone-dim)',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                        paddingRight: 20,
                                    }}>
                                        {p.job_text}
                                    </div>
                                    <div>
                                        <span className={p.prediction === 'Fake' ? 'tag-red' : 'tag-teal'}>
                                            {p.prediction === 'Fake' ? 'FRAUD' : 'LEGIT'}
                                        </span>
                                    </div>
                                    <div style={{
                                        fontFamily: 'var(--font-mono)',
                                        fontSize: '0.75rem',
                                        color: p.prediction === 'Fake' ? 'var(--red)' : 'var(--teal)',
                                    }}>
                                        {p.confidence}%
                                    </div>
                                    <div style={{
                                        fontFamily: 'var(--font-mono)',
                                        fontSize: '0.7rem',
                                        color: 'var(--bone-muted)',
                                    }}>
                                        {formatLocalTime(p.created_at)}
                                    </div>
                                </div>
                            ))}

                            {predictions.length === 0 && (
                                <div style={{
                                    padding: '40px 20px',
                                    textAlign: 'center',
                                }}>
                                    <span className="mono" style={{ fontSize: '0.65rem' }}>NO PREDICTIONS YET</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ═══ REPORT FOOTER ═══ */}
                    <div style={{
                        marginTop: 40,
                        paddingTop: 20,
                        borderTop: '1px solid var(--charcoal-lighter)',
                        display: 'flex',
                        justifyContent: 'space-between',
                    }}>
                        <span className="mono" style={{ fontSize: '0.55rem', color: 'var(--bone-muted)' }}>
                            JOBCHECK ADMIN REPORT — GENERATED {new Date().toLocaleDateString('en-IN')}
                        </span>
                        <span className="mono" style={{ fontSize: '0.55rem', color: 'var(--charcoal-lighter)' }}>
                            CONFIDENTIAL — INTERNAL USE ONLY
                        </span>
                    </div>
                </div>
            </div>
        </>
    );
}
