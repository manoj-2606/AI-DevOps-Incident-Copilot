import { Link } from 'react-router-dom'

function StatusDot({ status }) {
    const colors = { success: '#22c55e', failed: '#ef4444', warning: '#f59e0b' }
    return (
        <span style={{
            display: 'inline-block', width: 8, height: 8,
            borderRadius: '50%', background: colors[status] || '#555',
            boxShadow: `0 0 6px ${colors[status] || '#555'}`,
            flexShrink: 0
        }} />
    )
}

export default function History() {
    return (
        <div style={styles.page}>

            {/* Top bar */}
            <div style={styles.topBar}>
                <div style={styles.topLeft}>
                    <StatusDot status="warning" />
                    <span style={styles.pipelineName}>incident-copilot</span>
                    <span style={styles.breadcrumb}>/</span>
                    <span style={styles.breadcrumbSub}>Pipelines</span>
                    <span style={styles.breadcrumb}>/</span>
                    <span style={styles.breadcrumbActive}>History</span>
                </div>
                <Link to="/" style={styles.topBtn}>← Back to Analyzer</Link>
            </div>

            {/* Summary bar */}
            <div style={styles.summaryBar}>
                <div style={styles.summaryItem}>
                    <span style={styles.summaryLabel}>TOTAL RUNS</span>
                    <span style={styles.summaryValue}>0</span>
                </div>
                <div style={styles.summaryItem}>
                    <span style={styles.summaryLabel}>CRITICAL</span>
                    <span style={{ ...styles.summaryValue, color: '#ef4444' }}>0</span>
                </div>
                <div style={styles.summaryItem}>
                    <span style={styles.summaryLabel}>HIGH</span>
                    <span style={{ ...styles.summaryValue, color: '#f97316' }}>0</span>
                </div>
                <div style={styles.summaryItem}>
                    <span style={styles.summaryLabel}>PHASE</span>
                    <span style={{ ...styles.summaryValue, color: '#3b82f6' }}>2 — Coming Soon</span>
                </div>
            </div>

            {/* Main */}
            <div style={styles.main}>

                {/* Sidebar */}
                <div style={styles.sidebar}>
                    <div style={styles.sidebarTitle}>FILTERS</div>
                    {['All', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(f => (
                        <div key={f} style={styles.filterItem}>
                            <span style={styles.filterText}>{f}</span>
                            <span style={styles.filterCount}>0</span>
                        </div>
                    ))}
                </div>

                {/* Content */}
                <div style={styles.content}>
                    <div style={styles.tableHeader}>
                        <span style={{ flex: 2 }}>RUN</span>
                        <span style={{ flex: 3 }}>ROOT CAUSE</span>
                        <span style={{ flex: 1 }}>SEVERITY</span>
                        <span style={{ flex: 1 }}>TIME</span>
                    </div>

                    {/* Empty state */}
                    <div style={styles.emptyState}>
                        <div style={styles.emptyIcon}>⬡</div>
                        <p style={styles.emptyTitle}>No incidents recorded yet</p>
                        <p style={styles.emptyText}>
                            History tracking requires Supabase integration.<br />
                            Coming in Phase 2.
                        </p>
                        <Link to="/" style={styles.ctaBtn}>
                            ▶ Analyze a Log
                        </Link>
                    </div>
                </div>
            </div>

            <div style={styles.footer}>
                <span style={styles.footerText}>
                    INCIDENT COPILOT · Phase 2: Supabase · History · Export
                </span>
            </div>
        </div>
    )
}

const styles = {
    page: {
        minHeight: '100vh', background: '#0e0e0e',
        color: '#fff', fontFamily: "'JetBrains Mono', monospace"
    },
    topBar: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '10px 20px', background: '#141414',
        borderBottom: '1px solid #1e1e1e'
    },
    topLeft: { display: 'flex', alignItems: 'center', gap: 8 },
    pipelineName: { fontSize: 13, color: '#fff', fontWeight: 600 },
    breadcrumb: { color: '#333', fontSize: 13 },
    breadcrumbSub: { fontSize: 12, color: '#555' },
    breadcrumbActive: { fontSize: 12, color: '#3b82f6' },
    topBtn: {
        background: 'transparent', border: '1px solid #222',
        color: '#555', borderRadius: 4, padding: '5px 12px',
        fontSize: 11, cursor: 'pointer', textDecoration: 'none',
        fontFamily: "'JetBrains Mono', monospace"
    },
    summaryBar: {
        display: 'flex', background: '#111',
        borderBottom: '1px solid #1e1e1e'
    },
    summaryItem: {
        display: 'flex', flexDirection: 'column', gap: 2,
        padding: '12px 32px', borderRight: '1px solid #1e1e1e'
    },
    summaryLabel: { fontSize: 9, color: '#333', letterSpacing: 2 },
    summaryValue: { fontSize: 13, color: '#888' },
    main: { display: 'flex', minHeight: 'calc(100vh - 120px)' },
    sidebar: {
        width: 200, background: '#111',
        borderRight: '1px solid #1e1e1e',
        flexShrink: 0, paddingTop: 12
    },
    sidebarTitle: {
        fontSize: 9, color: '#333', letterSpacing: 3,
        padding: '8px 16px 6px'
    },
    filterItem: {
        display: 'flex', justifyContent: 'space-between',
        padding: '8px 16px', borderBottom: '1px solid #ffffff08',
        cursor: 'pointer'
    },
    filterText: { fontSize: 11, color: '#555' },
    filterCount: { fontSize: 11, color: '#333' },
    content: { flex: 1, display: 'flex', flexDirection: 'column' },
    tableHeader: {
        display: 'flex', padding: '10px 20px',
        borderBottom: '1px solid #1e1e1e',
        background: '#111',
        fontSize: 9, color: '#333', letterSpacing: 2
    },
    emptyState: {
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 12, padding: 40, minHeight: 400
    },
    emptyIcon: { fontSize: 40, color: '#1e1e1e' },
    emptyTitle: { fontSize: 14, color: '#444', margin: 0 },
    emptyText: {
        fontSize: 11, color: '#333',
        textAlign: 'center', lineHeight: 1.8, margin: 0
    },
    ctaBtn: {
        marginTop: 8, padding: '8px 20px',
        background: '#1a3a2a', color: '#22c55e',
        border: '1px solid #22c55e30', borderRadius: 4,
        fontSize: 11, textDecoration: 'none',
        fontFamily: "'JetBrains Mono', monospace"
    },
    footer: {
        padding: '12px 20px', borderTop: '1px solid #1a1a1a',
        textAlign: 'center'
    },
    footerText: { fontSize: 9, color: '#222', letterSpacing: 3 }
}