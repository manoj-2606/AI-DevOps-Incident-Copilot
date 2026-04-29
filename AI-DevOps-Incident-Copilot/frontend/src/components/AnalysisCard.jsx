const severityColor = {
    LOW: '#22c55e',
    MEDIUM: '#f59e0b',
    HIGH: '#f97316',
    CRITICAL: '#ef4444'
}

export default function AnalysisCard({ result }) {
    if (!result) return null

    const color = severityColor[result.severity] || '#888'

    return (
        <div style={styles.card}>
            <div style={styles.header}>
                <span style={styles.label}>Analysis Result</span>
                <span style={{ ...styles.badge, background: color }}>
                    {result.severity}
                </span>
            </div>

            <div style={styles.section}>
                <p style={styles.sectionLabel}>Root Cause</p>
                <p style={styles.sectionText}>{result.root_cause}</p>
            </div>

            <div style={styles.divider} />

            <div style={styles.section}>
                <p style={styles.sectionLabel}>Recommended Fix</p>
                <p style={styles.sectionText}>{result.fix}</p>
            </div>
        </div>
    )
}

const styles = {
    card: {
        background: '#1a1a2e', border: '1px solid #333',
        borderRadius: 12, padding: 24, marginTop: 24
    },
    header: {
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: 20
    },
    label: { color: '#fff', fontSize: 16, fontWeight: 700 },
    badge: {
        padding: '4px 12px', borderRadius: 20,
        color: '#fff', fontSize: 12, fontWeight: 700
    },
    section: { marginBottom: 16 },
    sectionLabel: {
        color: '#888', fontSize: 12,
        fontWeight: 600, letterSpacing: 1, marginBottom: 6
    },
    sectionText: { color: '#e0e0e0', fontSize: 14, lineHeight: 1.6, margin: 0 },
    divider: { borderTop: '1px solid #2a2a3e', margin: '16px 0' }
}