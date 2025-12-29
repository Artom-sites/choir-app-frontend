import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Users } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

function JoinChoirPage() {
    const navigate = useNavigate()
    const { joinChoir } = useAuth()
    const [code, setCode] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    async function handleSubmit(e) {
        e.preventDefault()

        if (!code.trim()) {
            setError('Введіть код')
            return
        }

        setLoading(true)
        setError('')

        try {
            const result = await joinChoir(code.trim())

            if (result.alreadyMember) {
                // Already member, just navigate
            }

            navigate('/')
        } catch (err) {
            setError(err.message === 'Choir not found'
                ? 'Хор з таким кодом не знайдено'
                : 'Помилка. Спробуйте ще раз')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div>
            <button className="song-page__back" onClick={() => navigate('/')}>
                <ArrowLeft size={18} />
                Назад
            </button>

            <h2 className="page-title">
                <Users size={20} />
                Приєднатися до хору
            </h2>

            <p style={{
                color: 'var(--color-text-muted)',
                marginBottom: '24px',
                fontSize: '0.875rem'
            }}>
                Введіть код, який надав вам керівник хору
            </p>

            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    className="search-input"
                    placeholder="Код хору (напр. ABC123)"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    style={{
                        paddingLeft: '16px',
                        textAlign: 'center',
                        fontSize: '1.5rem',
                        letterSpacing: '4px',
                        fontWeight: '600'
                    }}
                    maxLength={10}
                    autoFocus
                />

                {error && (
                    <p style={{
                        color: 'var(--color-error)',
                        marginTop: '8px',
                        fontSize: '0.875rem',
                        textAlign: 'center'
                    }}>
                        ❌ {error}
                    </p>
                )}

                <button
                    type="submit"
                    className="song-page__open-btn"
                    style={{ marginTop: '24px' }}
                    disabled={loading || !code.trim()}
                >
                    {loading ? 'Приєднання...' : 'Приєднатися'}
                </button>
            </form>
        </div>
    )
}

export default JoinChoirPage
