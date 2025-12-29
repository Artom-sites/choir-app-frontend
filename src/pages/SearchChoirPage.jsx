import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Search, ChevronRight } from 'lucide-react'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'

function SearchChoirPage() {
    const navigate = useNavigate()
    const { refreshChoirs } = useAuth()
    const [query, setQuery] = useState('')
    const [results, setResults] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [joining, setJoining] = useState(null)

    const handleSearch = async (searchQuery) => {
        setQuery(searchQuery)
        if (searchQuery.length < 2) {
            setResults([])
            return
        }

        setLoading(true)
        setError(null)

        try {
            const data = await api.searchChoirs(searchQuery)
            setResults(data.choirs || [])
        } catch (err) {
            console.error('Search error:', err)
            setError('Помилка пошуку')
        } finally {
            setLoading(false)
        }
    }

    const handleJoin = async (choirId) => {
        setJoining(choirId)
        setError(null)

        try {
            await api.requestJoinChoir(choirId)
            await refreshChoirs()
            navigate('/')
        } catch (err) {
            setError(err.message)
            setJoining(null)
        }
    }

    return (
        <div className="main">
            <button className="back-link" onClick={() => navigate(-1)}>
                <ArrowLeft size={18} />
                Назад
            </button>

            <h1 className="page-title">
                <Search size={24} />
                Знайти хор
            </h1>
            <p className="page-subtitle">Введіть назву церкви або хору</p>

            <div className="search-container">
                <Search size={20} className="search-icon" />
                <input
                    type="text"
                    className="search-input"
                    placeholder="Наприклад: Свято-Михайлівська..."
                    value={query}
                    onChange={(e) => handleSearch(e.target.value)}
                    autoFocus
                />
            </div>

            {error && (
                <div className="error-message">{error}</div>
            )}

            {loading && (
                <div className="loading">
                    <div className="loading__spinner" />
                    <span className="loading__text">Шукаємо...</span>
                </div>
            )}

            {!loading && results.length > 0 && (
                <div className="choir-list">
                    {results.map(choir => (
                        <button
                            key={choir.id}
                            className="choir-item"
                            onClick={() => handleJoin(choir.id)}
                            disabled={joining === choir.id}
                        >
                            <div className="choir-item__avatar">🎵</div>
                            <div className="choir-item__info">
                                <div className="choir-item__name">{choir.name}</div>
                                <div className="choir-item__members">
                                    {choir.memberCount || 0} учасників
                                </div>
                            </div>
                            {joining === choir.id ? (
                                <div className="loading__spinner" style={{ width: 20, height: 20 }} />
                            ) : (
                                <ChevronRight size={20} style={{ color: 'var(--color-text-muted)' }} />
                            )}
                        </button>
                    ))}
                </div>
            )}

            {!loading && query.length >= 2 && results.length === 0 && (
                <div className="empty-state">
                    <span className="empty-state__icon">🔍</span>
                    <p className="empty-state__text">Хорів не знайдено</p>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginTop: '8px' }}>
                        Спробуйте інші ключові слова або попросіть регента надіслати код
                    </p>
                </div>
            )}

            {query.length < 2 && (
                <div className="empty-state" style={{ opacity: 0.6 }}>
                    <span className="empty-state__icon">⌨️</span>
                    <p className="empty-state__text">Почніть вводити назву</p>
                </div>
            )}
        </div>
    )
}

export default SearchChoirPage
