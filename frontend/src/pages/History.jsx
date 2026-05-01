import { useState } from 'react'
import { Link } from 'react-router-dom'
import { getHistory, clearHistory } from '../utils/storage'

const SEV_COLOR = {
    LOW: '#22c55e', MEDIUM: '#f59e0b',
    HIGH: '#f97316', CRITICAL: '#ef4444'
}
const SEV_BG = {
    LOW: '#052010', MEDIUM: '#1a1000',
    HIGH: '#1a0800', CRITICAL: '#1a0000'
}

function StatusDot({ status }) {
    const c = { success: '#22c55e', failed: '#ef4444', warning: '#f59e0b', idle: '#333', running: '#3b82f6' }[status] || '#333'
    return <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: c, boxShadow: `0 0 8px ${c}`, flexShrink: 0 }} />
}

function timeAgo(iso) {
    const diff = Math.floor((Date.now() - new Date(iso)) / 1000)
    if (diff < 60) return `${diff}s ago`
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
}

const ADO_META = [
    ['Organization', 'dev.azure.com'],
    ['Pipeline', 'log-analyzer-ci'],
    ['Agent Pool', 'Azure Pipelines'],
    ['Trigger', 'CI · Push to main'],
    ['Retention', '30 days (policy)'],
    ['Artifact', 'drop/ · Published'],
    ['Environment', 'Production · AKS'],
    ['Service Conn.', 'Azure RM (OIDC)'],
]

const ADO_TIPS = [
    ['AKS Deployment', 'Use rolling updates with maxSurge: 1 to avoid downtime during releases'],
    ['Terraform State', 'Store state in Azure Blob Storage with versioning and soft-delete enabled'],
    ['ACR Auth', 'Use Managed Identity over admin credentials — no secrets to rotate'],
    ['Self-hosted Agent', 'VMSS agent pools reduce parallelism cost vs Microsoft-hosted agents'],
    ['Key Vault Ref', 'Reference secrets via @Microsoft.KeyVault() in variable groups'],
    ['Helm in CI', 'Pin chart versions — never use latest tag in production pipelines'],
    ['OIDC Federation', 'Use federated credentials on Service Principal — no client secrets'],
    ['Policy Gates', 'Add approval gates before Production stage in multi-stage pipelines'],
]

export default function History() {
    const [filter, setFilter] = useState('All')
    const [selected, setSelected] = useState(null)
    const [history, setHistory] = useState(getHistory())

    const filters = ['All', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW']
    const filtered = filter === 'All' ? history : history.filter(h => h.severity === filter)
    const counts = filters.reduce((acc, f) => {
        acc[f] = f === 'All' ? history.length : history.filter(h => h.severity === f).length
        return acc
    }, {})

    const handleClear = () => {
        if (!window.confirm('Clear all incident history?')) return
        clearHistory(); setHistory([]); setSelected(null)
    }

    return (
        <div style={s.page}>
            <style>{`
        @keyframes fadeIn { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
        .inc-row:hover { background: #ffffff08 !important; }
        .filter-item:hover { background: #ffffff06 !important; }
        .crumb-link { text-decoration: none; transition: color 0.15s; }
        .crumb-link:hover { color: #fff !important; }
        .tip-row:hover { background: #ffffff04 !important; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #2a2a2a; border-radius: 2px; }
      `}</style>

            {/* Top bar */}
            <div style={s.topBar}>
                <div style={s.topLeft}>
                    <StatusDot status={history.length > 0 ? 'warning' : 'idle'} />
                    <Link to="/" className="crumb-link" style={s.orgName}>incident-copilot</Link>
                    <span style={s.slash}>/</span>
                    <span style={s.crumb}>Pipelines</span>
                    <span style={s.slash}>/</span>
                    <span style={s.crumbActive}>Incident History</span>
                </div>
                <div style={s.topRight}>
                    <Link to="/" style={s.topBtn}>+ Analyzer</Link>
                    {history.length > 0 && (
                        <button onClick={handleClear} style={{ ...s.topBtn, color: '#f87171', borderColor: '#ef444430' }}>
                            Clear All
                        </button>
                    )}
                </div>
            </div>

            {/* Summary strip */}
            <div style={s.strip}>
                {[
                    ['TOTAL RUNS', history.length, '#ffffff'],
                    ['CRITICAL', counts['CRITICAL'], counts['CRITICAL'] > 0 ? '#ef4444' : '#444'],
                    ['HIGH', counts['HIGH'], counts['HIGH'] > 0 ? '#f97316' : '#444'],
                    ['MEDIUM', counts['MEDIUM'], counts['MEDIUM'] > 0 ? '#f59e0b' : '#444'],
                    ['LOW', counts['LOW'], counts['LOW'] > 0 ? '#22c55e' : '#444'],
                    ['STORAGE', 'localStorage', '#aaa'],
                ].map(([label, val, color]) => (
                    <div key={label} style={s.stripItem}>
                        <span style={s.stripLabel}>{label}</span>
                        <span style={{ ...s.stripVal, color }}>{val}</span>
                    </div>
                ))}
            </div>

            {/* Main — fixed height, no scroll on page */}
            <div style={s.main}>

                {/* Sidebar */}
                <div style={s.sidebar}>
                    <div style={s.sideLabel}>FILTER BY SEVERITY</div>
                    {filters.map(f => (
                        <div
                            key={f}
                            className="filter-item"
                            onClick={() => { setFilter(f); setSelected(null) }}
                            style={{
                                ...s.filterRow,
                                background: filter === f ? '#ffffff0a' : 'transparent',
                                borderLeft: filter === f
                                    ? `3px solid ${f === 'All' ? '#3b82f6' : SEV_COLOR[f]}`
                                    : '3px solid transparent'
                            }}
                        >
                            <span style={{
                                ...s.filterLabel,
                                color: filter === f ? (f === 'All' ? '#3b82f6' : SEV_COLOR[f]) : '#ccc',
                                fontWeight: filter === f ? 700 : 500
                            }}>{f}</span>
                            <span style={s.filterCount}>{counts[f]}</span>
                        </div>
                    ))}

                    <div style={{ ...s.sideLabel, marginTop: 20 }}>PIPELINE METADATA</div>
                    {ADO_META.map(([k, v]) => (
                        <div key={k} style={s.metaRow}>
                            <span style={s.metaKey}>{k}</span>
                            <span style={s.metaVal}>{v}</span>
                        </div>
                    ))}

                    <div style={{ ...s.sideLabel, marginTop: 20 }}>AZURE DEVOPS TIPS</div>
                    {ADO_TIPS.map(([title, detail], i) => (
                        <div key={i} className="tip-row" style={s.tipRow}>
                            <span style={s.tipDot}>⬢</span>
                            <div>
                                <div style={s.tipTitle}>{title}</div>
                                <div style={s.tipDetail}>{detail}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Content */}
                <div style={s.content}>
                    <div style={s.tableHead}>
                        <span style={{ ...s.th, flex: '0 0 120px' }}>RUN ID</span>
                        <span style={{ ...s.th, flex: 3 }}>ROOT CAUSE</span>
                        <span style={{ ...s.th, flex: '0 0 110px' }}>SEVERITY</span>
                        <span style={{ ...s.th, flex: '0 0 90px' }}>TIME</span>
                    </div>

                    <div style={s.listWrap}>
                        {filtered.length === 0 ? (
                            <div style={s.empty}>
                                <div style={s.emptyHex}>⬡</div>
                                <p style={s.emptyTitle}>
                                    {history.length === 0 ? 'No incidents recorded yet' : `No ${filter} incidents`}
                                </p>
                                <p style={s.emptyText}>
                                    {history.length === 0 ? 'Run an analysis to start recording history.' : 'Try a different filter.'}
                                </p>
                                {history.length === 0 && <Link to="/" style={s.ctaBtn}>▶  Analyze a Log</Link>}
                            </div>
                        ) : (
                            filtered.map((inc, i) => (
                                <div key={inc.id}>
                                    <div
                                        className="inc-row"
                                        onClick={() => setSelected(selected?.id === inc.id ? null : inc)}
                                        style={{
                                            ...s.row,
                                            background: selected?.id === inc.id ? '#ffffff0a' : 'transparent',
                                            borderLeft: selected?.id === inc.id ? `3px solid ${SEV_COLOR[inc.severity]}` : '3px solid transparent',
                                            animation: `fadeIn 0.2s ease ${i * 0.03}s both`
                                        }}
                                    >
                                        <span style={{ ...s.td, flex: '0 0 120px', color: '#3b82f6', fontSize: 14 }}>#{String(inc.id).slice(-6)}</span>
                                        <span style={{ ...s.td, flex: 3, color: '#ffffff', fontSize: 15 }}>
                                            {inc.root_cause?.slice(0, 80)}{inc.root_cause?.length > 80 ? '...' : ''}
                                        </span>
                                        <span style={{ ...s.td, flex: '0 0 110px' }}>
                                            <span style={{ color: SEV_COLOR[inc.severity], background: SEV_BG[inc.severity], padding: '4px 12px', borderRadius: 3, fontSize: 12, letterSpacing: 1.5, fontWeight: 700 }}>
                                                {inc.severity}
                                            </span>
                                        </span>
                                        <span style={{ ...s.td, flex: '0 0 90px', color: '#888', fontSize: 13 }}>{timeAgo(inc.timestamp)}</span>
                                    </div>

                                    {selected?.id === inc.id && (
                                        <div style={{ ...s.detail, borderLeft: `3px solid ${SEV_COLOR[inc.severity]}50` }}>
                                            <div style={s.detailBlock}>
                                                <div style={s.detailLabel}>ROOT CAUSE</div>
                                                <div style={s.detailLine}>
                                                    <span style={{ color: '#f87171' }}>##[error]</span>{' '}
                                                    <span style={s.detailText}>{inc.root_cause}</span>
                                                </div>
                                            </div>
                                            <div style={s.detailBlock}>
                                                <div style={s.detailLabel}>FIX</div>
                                                <div style={s.detailLine}>
                                                    <span style={{ color: '#4ade80' }}>$</span>{' '}
                                                    <span style={s.detailText}>{inc.fix}</span>
                                                </div>
                                            </div>
                                            {inc.log_preview && (
                                                <div style={s.detailBlock}>
                                                    <div style={s.detailLabel}>LOG PREVIEW</div>
                                                    <div style={{ ...s.detailLine, color: '#aaa' }}>{inc.log_preview}</div>
                                                </div>
                                            )}
                                            <div style={s.detailMeta}>
                                                <span>ID: #{inc.id}</span><span>·</span>
                                                <span>{new Date(inc.timestamp).toLocaleString()}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            <div style={s.footer}>
                <span style={s.footerText}>INCIDENT COPILOT · localStorage · {history.length}/50 · Phase 2: Supabase + Export</span>
            </div>
        </div>
    )
}

const s = {
    page: {
        height: '100vh', background: '#0a0a0a',
        backgroundImage: `
      linear-gradient(rgba(59,130,246,0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(59,130,246,0.03) 1px, transparent 1px)
    `,
        backgroundSize: '40px 40px',
        color: '#fff', fontFamily: "'JetBrains Mono', monospace",
        display: 'flex', flexDirection: 'column', overflow: 'hidden'
    },
    topBar: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '12px 24px', background: '#111',
        borderBottom: '1px solid #2a2a2a', flexShrink: 0
    },
    topLeft: { display: 'flex', alignItems: 'center', gap: 10 },
    orgName: { fontSize: 16, color: '#ffffff', fontWeight: 700 },
    slash: { color: '#444', fontSize: 16 },
    crumb: { fontSize: 14, color: '#aaa' },
    crumbActive: { fontSize: 14, color: '#3b82f6' },
    topRight: { display: 'flex', gap: 10 },
    topBtn: {
        background: 'transparent', border: '1px solid #2a2a2a',
        color: '#ccc', borderRadius: 4, padding: '7px 16px',
        fontSize: 13, cursor: 'pointer',
        fontFamily: "'JetBrains Mono', monospace",
        textDecoration: 'none'
    },
    strip: {
        display: 'flex', background: '#0d0d0d',
        borderBottom: '1px solid #2a2a2a', flexShrink: 0
    },
    stripItem: {
        display: 'flex', flexDirection: 'column', gap: 4,
        padding: '12px 24px', borderRight: '1px solid #2a2a2a', minWidth: 0
    },
    stripLabel: { fontSize: 10, color: '#666', letterSpacing: 3 },
    stripVal: { fontSize: 22, fontWeight: 700 },
    main: { display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 },
    sidebar: {
        width: 240, background: '#0d0d0d',
        borderRight: '1px solid #2a2a2a',
        flexShrink: 0, overflowY: 'auto', paddingTop: 12
    },
    sideLabel: { fontSize: 10, color: '#666', letterSpacing: 3, padding: '8px 18px 6px' },
    filterRow: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '11px 18px', cursor: 'pointer',
        borderBottom: '1px solid #1a1a1a', transition: 'background 0.15s'
    },
    filterLabel: { fontSize: 16, transition: 'color 0.15s' },
    filterCount: { fontSize: 15, color: '#888' },
    metaRow: {
        display: 'flex', justifyContent: 'space-between',
        padding: '7px 18px', borderBottom: '1px solid #1a1a1a'
    },
    metaKey: { fontSize: 11, color: '#666' },
    metaVal: { fontSize: 11, color: '#bbb' },
    tipRow: {
        display: 'flex', gap: 8, padding: '9px 18px',
        borderBottom: '1px solid #1a1a1a',
        cursor: 'default', transition: 'background 0.15s', alignItems: 'flex-start'
    },
    tipDot: { fontSize: 10, color: '#3b82f6', marginTop: 2, flexShrink: 0 },
    tipTitle: { fontSize: 12, color: '#e2e8f0', marginBottom: 2, fontWeight: 600 },
    tipDetail: { fontSize: 10, color: '#777', lineHeight: 1.6 },
    content: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
    tableHead: {
        display: 'flex', padding: '10px 24px',
        background: '#0d0d0d', borderBottom: '1px solid #2a2a2a', flexShrink: 0
    },
    th: { fontSize: 12, color: '#888', letterSpacing: 2, fontWeight: 600 },
    listWrap: { flex: 1, overflowY: 'auto' },
    row: {
        display: 'flex', alignItems: 'center',
        padding: '13px 24px', borderBottom: '1px solid #1a1a1a',
        cursor: 'pointer', transition: 'background 0.15s'
    },
    td: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
    detail: {
        background: '#0d0d0d', padding: '18px 24px',
        borderBottom: '1px solid #2a2a2a',
        animation: 'fadeIn 0.2s ease'
    },
    detailBlock: { marginBottom: 14 },
    detailLabel: { fontSize: 10, color: '#666', letterSpacing: 3, marginBottom: 8 },
    detailLine: { fontFamily: "'JetBrains Mono', monospace", fontSize: 14, lineHeight: 1.8 },
    detailText: { color: '#e2e8f0' },
    detailMeta: { display: 'flex', gap: 8, fontSize: 11, color: '#555', marginTop: 12 },
    empty: {
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 14, minHeight: 300
    },
    emptyHex: { fontSize: 48, color: '#222' },
    emptyTitle: { fontSize: 18, color: '#888', margin: 0 },
    emptyText: { fontSize: 14, color: '#555', margin: 0, textAlign: 'center' },
    ctaBtn: {
        marginTop: 8, padding: '10px 24px',
        background: '#0f2a1a', color: '#4ade80',
        border: '1px solid #22c55e40', borderRadius: 4,
        fontSize: 14, textDecoration: 'none',
        fontFamily: "'JetBrains Mono', monospace"
    },
    footer: { padding: '10px 24px', borderTop: '1px solid #1a1a1a', textAlign: 'center', flexShrink: 0 },
    footerText: { fontSize: 11, color: '#444', letterSpacing: 3 }
}