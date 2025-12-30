import { Link } from 'react-router-dom'
import { Settings, Library, Users, Copy, Check } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useState } from 'react'

function AdminPage() {
    const { currentChoir, isAdmin, clearChoir } = useAuth()
    const [copied, setCopied] = useState(false)

    if (!isAdmin) {
        return (
            <div className="empty-state">
                <span className="empty-state__icon">🔒</span>
                <p className="empty-state__text">
                    Доступ тільки для керівників хору
                </p>
            </div>
        )
    }

    function copyCode() {
        navigator.clipboard.writeText(currentChoir.inviteCode)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div>
            <h2 className="page-title">
                <Settings size={20} />
                Керування
            </h2>

            {/* Choir info */}
            <div style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '24px'
            }}>
                <h3 style={{ marginBottom: '12px' }}>{currentChoir.name}</h3>

                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '8px'
                }}>
                    <span style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                        Код для приєднання:
                    </span>
                    <code style={{
                        background: 'var(--color-background)',
                        padding: '4px 12px',
                        borderRadius: '6px',
                        fontWeight: '600',
                        letterSpacing: '2px',
                        color: 'var(--color-accent)'
                    }}>
                        {currentChoir.inviteCode}
                    </code>
                    <button
                        onClick={copyCode}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: copied ? 'var(--color-success)' : 'var(--color-text-muted)',
                            cursor: 'pointer',
                            padding: '4px'
                        }}
                    >
                        {copied ? <Check size={18} /> : <Copy size={18} />}
                    </button>
                </div>

                <p style={{
                    fontSize: '0.8rem',
                    color: 'var(--color-text-muted)',
                    marginTop: '8px'
                }}>
                    Поділіться цим кодом з учасниками хору
                </p>
            </div>

            {/* Admin actions - placeholder for future features */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                    Щоб додати пісні, натисніть "+" і оберіть "Додати пісню"
                </p>
            </div>

            <hr style={{
                border: 'none',
                borderTop: '1px solid var(--color-border)',
                margin: '24px 0'
            }} />

            <button
                onClick={clearChoir}
                style={{
                    width: '100%',
                    padding: '12px',
                    background: 'transparent',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    color: 'var(--color-text-muted)',
                    cursor: 'pointer',
                    fontSize: '0.875rem'
                }}
            >
                Змінити хор
            </button>
        </div>
    )
}

export default AdminPage
