import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Upload, Check } from 'lucide-react'
import { useSongs } from '../context/SongsContext'
import { useAuth } from '../context/AuthContext'

function AddSongPage() {
    const navigate = useNavigate()
    const { createSong, categories } = useSongs()
    const { isAdmin } = useAuth()

    const [title, setTitle] = useState('')
    const [selectedCategory, setSelectedCategory] = useState(null)
    const [pdfFile, setPdfFile] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    if (!isAdmin) {
        return (
            <div className="empty-state">
                <span className="empty-state__icon">🔒</span>
                <p className="empty-state__text">Доступ тільки для регентів</p>
            </div>
        )
    }

    async function handleSubmit(e) {
        e.preventDefault()

        if (!title.trim()) {
            setError('Введіть назву пісні')
            return
        }

        if (!selectedCategory) {
            setError('Оберіть категорію')
            return
        }

        if (!pdfFile) {
            setError('Завантажте PDF файл')
            return
        }

        setLoading(true)
        setError('')

        try {
            const formData = new FormData()
            formData.append('title', title.trim())
            formData.append('categoryIds', JSON.stringify([selectedCategory]))
            formData.append('pdf', pdfFile)

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
            <button className="back-link" onClick={() => navigate('/admin')}>
                <ArrowLeft size={16} />
                Назад
            </button>

            <h2 className="page-title">Додати пісню</h2>

            <form onSubmit={handleSubmit}>
                {/* Title */}
                <div className="form-group">
                    <label className="form-label">Назва пісні *</label>
                    <input
                        type="text"
                        className="form-input"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Херувимська пісня"
                    />
                </div>

                {/* Category - required */}
                <div className="form-group">
                    <label className="form-label">Категорія *</label>
                    <div className="category-select">
                        {categories.map(cat => (
                            <button
                                key={cat.id}
                                type="button"
                                onClick={() => setSelectedCategory(cat.id)}
                                className={`category-chip ${selectedCategory === cat.id ? 'selected' : ''}`}
                            >
                                {cat.icon} {cat.name}
                                {selectedCategory === cat.id && <Check size={14} />}
                            </button>
                        ))}
                    </div>
                </div>

                {/* PDF File - required */}
                <div className="form-group">
                    <label className="form-label">PDF файл *</label>
                    <div className="file-upload">
                        <input
                            type="file"
                            accept=".pdf"
                            onChange={(e) => setPdfFile(e.target.files[0])}
                            id="pdf-input"
                        />
                        <label htmlFor="pdf-input" className="file-upload__label">
                            <Upload size={20} />
                            {pdfFile ? pdfFile.name : 'Обрати PDF файл'}
                        </label>
                    </div>
                    {pdfFile && (
                        <p className="file-upload__success">✓ Файл обрано</p>
                    )}
                </div>

                {error && (
                    <div className="error-message">❌ {error}</div>
                )}

                <button
                    type="submit"
                    className="primary-button"
                    disabled={loading}
                >
                    {loading ? 'Збереження...' : 'Зберегти'}
                </button>
            </form>
        </div>
    )
}

export default AddSongPage
