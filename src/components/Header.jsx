import { Music, Settings, ChevronLeft } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function Header() {
    const navigate = useNavigate()
    const location = useLocation()
    const { currentChoir, isAdmin, clearChoir } = useAuth()

    const showBack = location.pathname !== '/' && currentChoir

    return (
        <header className="header">
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%'
            }}>
                {showBack ? (
                    <button
                        onClick={() => navigate(-1)}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--color-text-muted)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            padding: '4px'
                        }}
                    >
                        <ChevronLeft size={20} />
                    </button>
                ) : (
                    <div style={{ width: '28px' }} />
                )}

                <h1 className="header__title" style={{ flex: 1, justifyContent: 'center' }}>
                    <Music size={20} />
                    {currentChoir ? currentChoir.name : 'Хоровий Репертуар'}
                </h1>

                {currentChoir && isAdmin ? (
                    <button
                        onClick={() => navigate('/admin')}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--color-accent)',
                            cursor: 'pointer',
                            padding: '4px'
                        }}
                    >
                        <Settings size={20} />
                    </button>
                ) : currentChoir ? (
                    <button
                        onClick={clearChoir}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--color-text-muted)',
                            cursor: 'pointer',
                            padding: '4px',
                            fontSize: '0.75rem'
                        }}
                    >
                        Змінити
                    </button>
                ) : (
                    <div style={{ width: '28px' }} />
                )}
            </div>
        </header>
    )
}

export default Header
