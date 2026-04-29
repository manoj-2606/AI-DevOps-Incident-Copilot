const sev = {
    LOW: { color: '#22c55e', bg: '#052010', border: '#22c55e20' },
    MEDIUM: { color: '#f59e0b', bg: '#1a1000', border: '#f59e0b20' },
    HIGH: { color: '#f97316', bg: '#1a0a00', border: '#f97316020' },
    CRITICAL: { color: '#ef4444', bg: '#1a0000', border: '#ef444420' }
}

export default function AnalysisCard({ result }) {
    if (!result) return null
    const s = sev[result.severity] || sev.MEDIUM

    return (
        <div style={{ ...styles.card, borderColor: s.border, background: '#0d0d0d' }}>

            {/* Top bar */}
            <div style={styles.topBar}>
                <div style={styles.titleRow}>
                    <div style={{ ...styles.sevDot, background: s.color, boxShadow: `0 0 10px ${s.color}` }} />
                    <span style={styles.cardTitle}>Analysis Result</span>
                </div>
                <span style={{ ...styles.badge, color: s.color, background: s.bg, borderColor: s.border }}>
                    {result.severity}
                </span>
            </div>

            {/* Root Cause */}
            <div style={styles.section}>
                <div style={styles.sectionLabel}>ROOT CAUSE</div>
                <p style={styles.sectionText}>{result.root_cause}</p>
            </div>

            <div style={styles.divider} />

            {/* Fix */}
            <div style={styles.section}>
                <div style={styles.sectionLabel}>RECOMMENDED FIX</div>
                <p style={styles.sectionText}>{result.fix}</p>
            </div>

        </div>
    )
}

const styles = {
    card: {
        position: 'relative', zIndex: 1,
        border: '1px solid #1a1a1a',
        borderRadius: 16, overflow: 'hidden',
        marginTop: 16
    },
    topBar: {
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center',
        padding: '18px 24px',
        borderBottom: '1px solid #1a1a1a'
    },
    titleRow: { display: 'flex', alignItems: 'center', gap: 10 },
    sevDot: { width: 8, height: 8, borderRadius: '50%' },
    cardTitle: {
        fontFamily: "'Syne', sans-serif",
        fontSize: 15, fontWeight: 700, color: '#fff'
    },
    badge: {
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 10, fontWeight: 600,
        letterSpacing: 2, padding: '5px 12px',
        borderRadius: 6, border: '1px solid'
    },
    section: { padding: '20px 24px' },
    sectionLabel: {
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 9, letterSpacing: 3,
        color: '#333', marginBottom: 12
    },
    sectionText: {
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 13, color: '#aaa',
        lineHeight: 1.8, margin: 0
    },
    divider: { borderTop: '1px solid #1a1a1a', margin: '0 24px' }
}