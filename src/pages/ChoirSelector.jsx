import { Link } from 'react-router-dom'
import { Plus, Users, ChevronRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

function ChoirSelector() {
    const { choirs, selectChoir } = useAuth()

    return (
        <div>
            <h2 className="page-title">
                🎵 Оберіть хор
            </h2>

            {choirs.length > 0 ? (
                <div style={{ marginBottom: '24px' }}>
                    {choirs.map(choir => (
                        <button
                            key={choir.id}
                            className="song-card"
                            onClick={() => selectChoir(choir)}
                            style={{ width: '100%', textAlign: 'left' }}
                        >
                            <span className="song-card__number" style={{
                                background: choir.role === 'admin' ? 'var(--color-accent)' : 'var(--color-border)'
                            }}>
                                {choir.role === 'admin' ? '👑' : '🎤'}
                            </span>

                            <div className="song-card__content">
                                <h3 className="song-card__title">{choir.name}</h3>
                                <div className="song-card__categories">
                                    <span className="song-card__category">
                                        {choir.role === 'admin' ? 'Керівник' : 'Учасник'}
                                    </span>
                                    {choir.songCount !== undefined && (
                                        <span className="song-card__category">
                                            {choir.songCount} пісень
                                        </span>
                                    )}
                                </div>
                            </div>

                            <ChevronRight size={20} className="song-card__arrow" />
                        </button>
                    ))}
                </div>
            ) : (
                <div className="empty-state" style={{ marginBottom: '24px' }}>
                    <span className="empty-state__icon">📋</span>
                    <p className="empty-state__text">
                        У вас ще немає хорів
                    </p>
                </div>
            )}

            <hr style={{
                border: 'none',
                borderTop: '1px solid var(--color-border)',
                margin: '24px 0'
            }} />

            <Link to="/join" className="song-card" style={{ textDecoration: 'none' }}>
                <span className="song-card__number" style={{ background: 'var(--color-success)' }}>
                    <Users size={16} />
                </span>
                <div className="song-card__content">
                    <h3 className="song-card__title">Приєднатися до хору</h3>
                    <div className="song-card__categories">
                        <span className="song-card__category">Введіть код запрошення</span>
                    </div>
                </div>
                <ChevronRight size={20} className="song-card__arrow" />
            </Link>

            <Link to="/create" className="song-card" style={{ textDecoration: 'none', marginTop: '8px' }}>
                <span className="song-card__number" style={{ background: 'var(--color-accent)' }}>
                    <Plus size={16} />
                </span>
                <div className="song-card__content">
                    <h3 className="song-card__title">Створити свій хор</h3>
                    <div className="song-card__categories">
                        <span className="song-card__category">Для керівників</span>
                    </div>
                </div>
                <ChevronRight size={20} className="song-card__arrow" />
            </Link>
        </div>
    )
}

export default ChoirSelector
