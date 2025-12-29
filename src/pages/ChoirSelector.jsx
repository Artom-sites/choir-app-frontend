import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Users, ChevronRight, Music, Search, Hash, Crown, Mic } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

function ChoirSelector() {
    const { choirs, selectChoir } = useAuth()
    const navigate = useNavigate()
    const [step, setStep] = useState(choirs.length > 0 ? 'select' : 'role')

    // Step 1: If user has choirs, show them first
    if (step === 'select' && choirs.length > 0) {
        return (
            <div className="choir-selector">
                <div className="choir-selector__header">
                    <span className="choir-selector__icon">🎵</span>
                    <h1 className="choir-selector__title">Мої хори</h1>
                    <p className="choir-selector__subtitle">Оберіть хор для роботи</p>
                </div>

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
                                    {choir.role === 'admin' ? 'Регент' : 'Хорист'}
                                    {choir.songCount !== undefined && ` • ${choir.songCount} пісень`}
                                </div>
                            </div>
                            <ChevronRight size={20} style={{ color: 'var(--color-text-muted)' }} />
                        </button>
                    ))}
                </div>

                <button
                    className="btn btn--secondary btn--full"
                    onClick={() => setStep('role')}
                    style={{ marginTop: 'var(--spacing-md)' }}
                >
                    + Додати ще один хор
                </button>
            </div>
        )
    }

    // Step 2: Role selection
    if (step === 'role') {
        return (
            <div className="choir-selector">
                <div className="choir-selector__header">
                    <span className="choir-selector__icon">🎵</span>
                    <h1 className="choir-selector__title">Вітаємо!</h1>
                    <p className="choir-selector__subtitle">Хто ви в хорі?</p>
                </div>

                <div className="choir-selector__options">
                    <button className="option-card" onClick={() => setStep('join')}>
                        <div className="option-card__icon" style={{ background: 'linear-gradient(135deg, #3b82f6, #06b6d4)' }}>
                            <Mic size={24} />
                        </div>
                        <div className="option-card__content">
                            <div className="option-card__title">Я хорист</div>
                            <div className="option-card__description">Приєднатися до хору</div>
                        </div>
                        <ChevronRight size={20} className="option-card__arrow" />
                    </button>

                    <button className="option-card" onClick={() => navigate('/create')}>
                        <div className="option-card__icon" style={{ background: 'linear-gradient(135deg, #a855f7, #ec4899)' }}>
                            <Crown size={24} />
                        </div>
                        <div className="option-card__content">
                            <div className="option-card__title">Я регент</div>
                            <div className="option-card__description">Створити свій хор</div>
                        </div>
                        <ChevronRight size={20} className="option-card__arrow" />
                    </button>
                </div>

                {choirs.length > 0 && (
                    <button
                        className="back-link"
                        onClick={() => setStep('select')}
                        style={{ marginTop: 'var(--spacing-lg)' }}
                    >
                        ← Назад до моїх хорів
                    </button>
                )}
            </div>
        )
    }

    // Step 3: Join options for choir members
    if (step === 'join') {
        return (
            <div className="choir-selector">
                <div className="choir-selector__header">
                    <span className="choir-selector__icon">🎤</span>
                    <h1 className="choir-selector__title">Приєднатися</h1>
                    <p className="choir-selector__subtitle">Як знайти ваш хор?</p>
                </div>

                <div className="choir-selector__options">
                    <Link to="/join" className="option-card">
                        <div className="option-card__icon" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                            <Hash size={24} />
                        </div>
                        <div className="option-card__content">
                            <div className="option-card__title">Ввести код</div>
                            <div className="option-card__description">Отримайте код від регента</div>
                        </div>
                        <ChevronRight size={20} className="option-card__arrow" />
                    </Link>

                    <Link to="/search-choir" className="option-card">
                        <div className="option-card__icon" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                            <Search size={24} />
                        </div>
                        <div className="option-card__content">
                            <div className="option-card__title">Знайти за назвою</div>
                            <div className="option-card__description">Пошук по назві церкви</div>
                        </div>
                        <ChevronRight size={20} className="option-card__arrow" />
                    </Link>
                </div>

                <button
                    className="back-link"
                    onClick={() => setStep('role')}
                    style={{ marginTop: 'var(--spacing-lg)' }}
                >
                    ← Назад
                </button>
            </div>
        )
    }

    return null
}

export default ChoirSelector
