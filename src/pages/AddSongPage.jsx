import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Upload } from 'lucide-react'
import { useSongs } from '../context/SongsContext'
import { useAuth } from '../context/AuthContext'

function AddSongPage() {
    const navigate = useNavigate()
    const { createSong, categories } = useSongs()
    const { isAdmin } = useAuth()

    const [title, setTitle] = useState('')
    const [author, setAuthor] = useState('')
    const [key, setKey] = useState('')
    const [voices, setVoices] = useState('SATB')
    const [difficulty, setDifficulty] = useState('Середня')
    const [selectedCategories, setSelectedCategories] = useState([])
    const [pdfFile, setPdfFile] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    if (!isAdmin) {
        return (
            <div className="empty-state">
                <span className="empty-state__icon">🔒</span>
                <p className="empty-state__text">Доступ тільки для керівників</p>
            </div>
        )
    }

    function toggleCategory(catId) {
        setSelectedCategories(prev =>
            prev.includes(catId)
                ? prev.filter(id => id !== catId)
                : [...prev, catId]
        )
    }

    async function handleSubmit(e) {
        e.preventDefault()

        if (!title.trim()) {
            setError('Введіть назву пісні')
            return
        }

        setLoading(true)
        setError('')

        try {
            const formData = new FormData()
            formData.append('title', title.trim())
            if (author.trim()) formData.append('author', author.trim())
            if (key.trim()) formData.append('key', key.trim())
            if (voices.trim()) formData.append('voices', voices.trim())
            if (difficulty) formData.append('difficulty', difficulty)
            if (selectedCategories.length > 0) {
                formData.append('categoryIds', JSON.stringify(selectedCategories))
            }
            if (pdfFile) {
                formData.append('pdf', pdfFile)
            }

            await createSong(formData)
            navigate('/')
        } catch (err) {
            setError('Помилка збереження. Спробуйте ще раз.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div>
            <button className="song-page__back" onClick={() => navigate('/admin')}>
                <ArrowLeft size={18} />
                Назад
            </button>

            <h2 className="page-title">
                <Upload size={20} />
                Додати пісню
            </h2>

            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '16px' }}>
                    <label style={{
                        display: 'block',
                        marginBottom: '6px',
                        fontSize: '0.875rem',
                        color: 'var(--color-text-muted)'
                    }}>
                        Назва пісні *
                    </label>
                    <input
                        type="text"
                        className="search-input"
                        style={{ paddingLeft: '16px' }}
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Херувимська пісня"
                    />
                </div>

                <div style={{ marginBottom: '16px' }}>
                    <label style={{
                        display: 'block',
                        marginBottom: '6px',
                        fontSize: '0.875rem',
                        color: 'var(--color-text-muted)'
                    }}>
                        Автор
                    </label>
                    <input
                        type="text"
                        className="search-input"
                        style={{ paddingLeft: '16px' }}
                        value={author}
                        onChange={(e) => setAuthor(e.target.value)}
                        placeholder="Д. Бортнянський"
                    />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                    <div>
                        <label style={{
                            display: 'block',
                            marginBottom: '6px',
                            fontSize: '0.875rem',
                            color: 'var(--color-text-muted)'
                        }}>
                            Тональність
                        </label>
                        <input
                            type="text"
                            className="search-input"
                            style={{ paddingLeft: '16px' }}
                            value={key}
                            onChange={(e) => setKey(e.target.value)}
                            placeholder="До мажор"
                        />
                    </div>
                    <div>
                        <label style={{
                            display: 'block',
                            marginBottom: '6px',
                            fontSize: '0.875rem',
                            color: 'var(--color-text-muted)'
                        }}>
                            Голоси
                        </label>
                        <input
                            type="text"
                            className="search-input"
                            style={{ paddingLeft: '16px' }}
                            value={voices}
                            onChange={(e) => setVoices(e.target.value)}
                            placeholder="SATB"
                        />
                    </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                    <label style={{
                        display: 'block',
                        marginBottom: '6px',
                        fontSize: '0.875rem',
                        color: 'var(--color-text-muted)'
                    }}>
                        Складність
                    </label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        {['Легка', 'Середня', 'Складна'].map(d => (
                            <button
                                key={d}
                                type="button"
                                onClick={() => setDifficulty(d)}
                                style={{
                                    flex: 1,
                                    padding: '8px',
                                    background: difficulty === d ? 'var(--color-accent)' : 'var(--color-surface)',
                                    color: difficulty === d ? 'var(--color-primary)' : 'var(--color-text)',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontSize: '0.875rem'
                                }}
                            >
                                {d}
                            </button>
                        ))}
                    </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                    <label style={{
                        display: 'block',
                        marginBottom: '6px',
                        fontSize: '0.875rem',
                        color: 'var(--color-text-muted)'
                    }}>
                        Категорії
                    </label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {categories.map(cat => (
                            <button
                                key={cat.id}
                                type="button"
                                onClick={() => toggleCategory(cat.id)}
                                style={{
                                    padding: '6px 12px',
                                    background: selectedCategories.includes(cat.id)
                                        ? 'rgba(201, 162, 39, 0.3)'
                                        : 'var(--color-surface)',
                                    color: selectedCategories.includes(cat.id)
                                        ? 'var(--color-accent)'
                                        : 'var(--color-text)',
                                    border: selectedCategories.includes(cat.id)
                                        ? '1px solid var(--color-accent)'
                                        : '1px solid var(--color-border)',
                                    borderRadius: '16px',
                                    cursor: 'pointer',
                                    fontSize: '0.875rem'
                                }}
                            >
                                {cat.icon} {cat.name}
                            </button>
                        ))}
                    </div>
                </div>

                <div style={{ marginBottom: '24px' }}>
                    <label style={{
                        display: 'block',
                        marginBottom: '6px',
                        fontSize: '0.875rem',
                        color: 'var(--color-text-muted)'
                    }}>
                        PDF файл
                    </label>
                    <input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => setPdfFile(e.target.files[0])}
                        style={{
                            width: '100%',
                            padding: '12px',
                            background: 'var(--color-surface)',
                            border: '1px solid var(--color-border)',
                            borderRadius: '8px',
                            color: 'var(--color-text)'
                        }}
                    />
                    {pdfFile && (
                        <p style={{
                            fontSize: '0.75rem',
                            color: 'var(--color-success)',
                            marginTop: '4px'
                        }}>
                            ✓ {pdfFile.name}
                        </p>
                    )}
                </div>

                {error && (
                    <p style={{
                        color: 'var(--color-error)',
                        marginBottom: '16px',
                        fontSize: '0.875rem'
                    }}>
                        ❌ {error}
                    </p>
                )}

                <button
                    type="submit"
                    className="song-page__open-btn"
                    disabled={loading || !title.trim()}
                >
                    {loading ? 'Збереження...' : 'Зберегти пісню'}
                </button>
            </form>
        </div>
    )
}

export default AddSongPage
