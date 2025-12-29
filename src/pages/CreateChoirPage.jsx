import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

function CreateChoirPage() {
    const navigate = useNavigate()
    const { createChoir } = useAuth()
    const [name, setName] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(null)

    async function handleSubmit(e) {
        e.preventDefault()

        if (!name.trim()) {
            setError('Введіть назву хору')
            return
        }

        setLoading(true)
        setError('')

        try {
            const choir = await createChoir(name.trim())
            setSuccess(choir)
        } catch (err) {
            setError('Помилка створення. Спробуйте ще раз')
        } finally {
            setLoading(false)
        }
    }

    if (success) {
        return (
            <div>
                <div style={{ textAlign: 'center', padding: '32px 0' }}>
                    <span style={{ fontSize: '4rem' }}>🎉</span>
                    <h2 style={{ marginTop: '16px', marginBottom: '8px' }}>
                        Хор створено!
                    </h2>
                    <p style={{ color: 'var(--color-text-muted)', marginBottom: '24px' }}>
                        {success.name}
                    </p>

                    <div style={{
                        background: 'var(--color-surface)',
                        border: '2px dashed var(--color-accent)',
                        borderRadius: '12px',
                        padding: '24px',
                        marginBottom: '24px'
                    }}>
                        <p style={{
                            fontSize: '0.875rem',
                            color: 'var(--color-text-muted)',
                            marginBottom: '8px'
                        }}>
                            Код для приєднання:
                        </p>
                        <p style={{
                            fontSize: '2rem',
                            fontWeight: '700',
                            letterSpacing: '4px',
                            color: 'var(--color-accent)'
                        }}>
                            {success.inviteCode}
                        </p>
                        <p style={{
                            fontSize: '0.75rem',
                            color: 'var(--color-text-muted)',
                            marginTop: '8px'
                        }}>
                            Поділіться цим кодом з учасниками хору
                        </p>
                    </div>

                    <button
                        className="song-page__open-btn"
                        onClick={() => navigate('/')}
                    >
                        Почати роботу
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div>
            <button className="song-page__back" onClick={() => navigate('/')}>
                <ArrowLeft size={18} />
                Назад
            </button>

            <h2 className="page-title">
                <Plus size={20} />
                Створити хор
            </h2>

            <p style={{
                color: 'var(--color-text-muted)',
                marginBottom: '24px',
                fontSize: '0.875rem'
            }}>
                Введіть назву вашого хору. Ви станете його керівником і зможете:
            </p>

            <ul style={{
                color: 'var(--color-text-muted)',
                marginBottom: '24px',
                fontSize: '0.875rem',
                paddingLeft: '20px'
            }}>
                <li>Додавати пісні до бібліотеки</li>
                <li>Призначати репертуар на сьогодні</li>
                <li>Запрошувати учасників за кодом</li>
            </ul>

            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    className="search-input"
                    placeholder="Назва хору"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{ paddingLeft: '16px' }}
                    autoFocus
                />

                {error && (
                    <p style={{
                        color: 'var(--color-error)',
                        marginTop: '8px',
                        fontSize: '0.875rem'
                    }}>
                        ❌ {error}
                    </p>
                )}

                <button
                    type="submit"
                    className="song-page__open-btn"
                    style={{ marginTop: '24px' }}
                    disabled={loading || !name.trim()}
                >
                    {loading ? 'Створення...' : 'Створити хор'}
                </button>
            </form>
        </div>
    )
}

export default CreateChoirPage
