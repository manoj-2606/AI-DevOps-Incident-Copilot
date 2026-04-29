import { Link } from 'react-router-dom'

export default function History() {
    return (
        <div style={styles.page}>
            <div style={styles.header}>
                <h1 style={styles.title}>Incident History</h1>
                <Link to="/" style={styles.link}>Back to Analyzer</Link>
            </div>
            <p style={styles.sub}>History tracking coming in Phase 2 (Supabase integration).</p>
        </div>
    )
}

const styles = {
    page: {
        minHeight: '100vh', background: '#0f0f1a',
        color: '#fff', padding: '40px 24px', maxWidth: 760, margin: '0 auto'
    },
    header: {
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: 24
    },
    title: { fontSize: 26, fontWeight: 700, margin: 0 },
    link: { color: '#4f46e5', fontSize: 14, textDecoration: 'none' },
    sub: { color: '#888', fontSize: 14 }
}