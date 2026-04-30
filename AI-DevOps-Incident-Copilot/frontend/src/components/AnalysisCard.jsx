const sev = {
    LOW: { color: '#22c55e', bg: '#052010', border: '#22c55e25' },
    MEDIUM: { color: '#f59e0b', bg: '#1a1000', border: '#f59e0b25' },
    HIGH: { color: '#f97316', bg: '#1a0800', border: '#f9731625' },
    CRITICAL: { color: '#ef4444', bg: '#1a0000', border: '#ef444425' }
}

function StatusDot({ color }) {
    return (
        <span style={{
            display: 'inline-block', width: 9, height: 9,
            borderRadius: '50%', background: color,
            boxShadow: `0 0 8px ${color}`, flexShrink: 0
        }} />
    )
}

export default function AnalysisCard({ result }) {
    if (!result) return null
    const s = sev[result.severity] || sev.MEDIUM
    const fixSteps = result.fix
        .split(/(?:\d+\.\s|\n|,\s(?=[A-Z]))/)
        .map(s => s.trim())
        .filter(Boolean)

    return (
        <div style={{ ...styles.card, borderColor: s.border }}>

            {/* Header */}
            <div style={{ ...styles.header, borderBottomColor: s.border }}>
                <div style={styles.headerLeft}>
                    <StatusDot color={s.color} />
                    <span style={styles.headerTitle}>Analysis Complete</span>
                    <span style={styles.runId}>#{Date.now().toString().slice(-6)}</span>
                </div>
                <div style={{ ...styles.badge, color: s.color, background: s.bg, borderColor: s.border }}>
                    ● {result.severity}
                </div>
            </div>

            {/* Root cause */}
            <div style={styles.block}>
                <div style={styles.blockLabel}>ROOT CAUSE</div>
                <div style={styles.logLine}>
                    <span style={styles.lineNum}>1</span>
                    <span style={{ color: '#ef4444' }}>##[error]</span>
                    <span style={styles.lineText}>{result.root_cause}</span>
                </div>
            </div>

            <div style={styles.divider} />

            {/* Fix steps */}
            <div style={styles.block}>
                <div style={styles.blockLabel}>RECOMMENDED FIX</div>
                {fixSteps.map((step, i) => (
                    <div key={i} style={styles.logLine}>
                        <span style={styles.lineNum}>{i + 1}</span>
                        <span style={{ color: '#22c55e' }}>$</span>
                        <span style={styles.lineText}>{step}</span>
                    </div>
                ))}
            </div>

        </div>
    )
}

const styles = {
    card: {
        border: '1px solid',
        borderRadius: 8,
        overflow: 'hidden',
        marginTop: 0,
        animation: 'fadeSlideIn 0.3s ease',
        background: '#0d0d0d'
    },
    header: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '12px 16px', borderBottom: '1px solid',
        background: '#111'
    },
    headerLeft: { display: 'flex', alignItems: 'center', gap: 10 },
    headerTitle: {
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 12, color: '#ccc', fontWeight: 600
    },
    runId: {
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 10, color: '#333'
    },
    badge: {
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 10, letterSpacing: 2,
        padding: '4px 10px', borderRadius: 4,
        border: '1px solid', fontWeight: 700
    },
    block: { padding: '14px 0' },
    blockLabel: {
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 9, color: '#ccc', letterSpacing: 3,
        padding: '0 16px', marginBottom: 10
    },
    logLine: {
        display: 'flex', gap: 12, padding: '3px 16px',
        alignItems: 'flex-start',
        fontFamily: "'JetBrains Mono', monospace", fontSize: 12,
        lineHeight: 1.7,
        transition: 'background 0.15s'
    },
    lineNum: {
        color: '#2a2a2a', minWidth: 24,
        textAlign: 'right', userSelect: 'none',
        fontSize: 11, paddingTop: 1
    },
    lineText: { color: '#d1d5db', flex: 1 },
    detailText: { color: '#ccc' },
    divider: { borderTop: '1px solid #1a1a1a', margin: '0 16px' },
}