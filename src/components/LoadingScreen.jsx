function LoadingScreen() {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            gap: '16px'
        }}>
            <div className="loading__spinner" />
            <span style={{ color: 'var(--color-text-muted)' }}>Завантаження...</span>
        </div>
    )
}

export default LoadingScreen
