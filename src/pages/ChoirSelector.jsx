import { Link } from 'react-router-dom'
import { Plus, Users, ChevronRight, Music } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

function ChoirSelector() {
    const { choirs, selectChoir } = useAuth()

    return (
        <div className="choir-selector">
            <div className="choir-selector__header">
                <span className="choir-selector__icon">🎵</span>
                <h1 className="choir-selector__title">Хоровий Репертуар</h1>
                <p className="choir-selector__subtitle">Оберіть хор або створіть новий</p>
            </div>

            {choirs.length > 0 && (
                <div className="choir-list">
                    {choirs.map(choir => (
                        <button
                            key={choir.id}
                            className="choir-item"
                            onClick={() => selectChoir(choir)}
                        >
                            <div className="choir-item__avatar">
                                {choir.role === 'admin' ? '👑' : '🎤'}
                            </div>
                            <div className="choir-item__info">
                                <div className="choir-item__name">{choir.name}</div>
                                <div className="choir-item__members">
                                    {choir.role === 'admin' ? 'Керівник' : 'Учасник'}
                                    {choir.songCount !== undefined && ` • ${choir.songCount} пісень`}
                                </div>
                            </div>
                            <ChevronRight size={20} style={{ color: 'var(--color-text-muted)' }} />
                        </button>
                    ))}
                </div>
            )}

            <div className="choir-selector__options">
                <Link to="/join" className="option-card">
                    <div className="option-card__icon">
                        <Users size={24} />
                    </div>
                    <div className="option-card__content">
                        <div className="option-card__title">Приєднатися до хору</div>
                        <div className="option-card__description">Введіть код запрошення</div>
                    </div>
                    <ChevronRight size={20} className="option-card__arrow" />
                </Link>

                <Link to="/create" className="option-card">
                    <div className="option-card__icon">
                        <Plus size={24} />
                    </div>
                    <div className="option-card__content">
                        <div className="option-card__title">Створити свій хор</div>
                        <div className="option-card__description">Для керівників хорів</div>
                    </div>
                    <ChevronRight size={20} className="option-card__arrow" />
                </Link>
            </div>
        </div>
    )
}

export default ChoirSelector
