export default function LogInput({ value, onChange, onAnalyze, loading }) {
    return (
        <div style={styles.wrapper}>
            <label style={styles.label}>Paste Pipeline Log</label>
            <textarea
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder="Paste your Azure DevOps or GitHub Actions log here..."
                style={styles.textarea}
                rows={14}
            />
            <button
                onClick={onAnalyze}
                disabled={loading || !value.trim()}
                style={{
                    ...styles.button,
                    opacity: loading || !value.trim() ? 0.5 : 1,
                    cursor: loading || !value.trim() ? 'not-allowed' : 'pointer'
                }}
            >
                {loading ? 'Analyzing...' : 'Analyze Log'}
            </button>
        </div>
    )
}

const styles = {
    wrapper: { display: 'flex', flexDirection: 'column', gap: 12 },
    label: { color: '#aaa', fontSize: 13, fontWeight: 600, letterSpacing: 1 },
    textarea: {
        background: '#0f0f1a', border: '1px solid #333', borderRadius: 8,
        color: '#e0e0e0', fontFamily: 'monospace', fontSize: 13,
        padding: 14, resize: 'vertical', outline: 'none'
    },
    button: {
        padding: '12px 0', borderRadius: 8, background: '#4f46e5',
        color: '#fff', border: 'none', fontSize: 15, fontWeight: 600
    }
}