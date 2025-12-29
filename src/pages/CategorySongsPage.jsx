import { useParams, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useSongs } from '../context/SongsContext'
import SongCard from '../components/SongCard'

function CategorySongsPage() {
    const { categoryId } = useParams()
    const { getCategoryById, getSongsByCategory, loading } = useSongs()

    if (loading) {
        return (
            <div className="loading">
                <div className="loading__spinner" />
                <span className="loading__text">Завантаження...</span>
            </div>
        )
    }

    const category = getCategoryById(categoryId)
    const songs = getSongsByCategory(categoryId)

    if (!category) {
        return (
            <div className="empty-state">
                <span className="empty-state__icon">❓</span>
                <p className="empty-state__text">Категорію не знайдено</p>
                <Link to="/categories" style={{ color: 'var(--color-accent)' }}>
                    Повернутися до категорій
                </Link>
            </div>
        )
    }

    return (
        <div>
            <Link to="/categories" className="song-page__back">
                <ArrowLeft size={18} />
                Назад до категорій
            </Link>

            <h2 className="page-title">
                <span>{category.icon}</span>
                {category.name}
            </h2>

            {songs.length > 0 ? (
                <div>
                    {songs.map(song => (
                        <SongCard key={song.id} song={song} />
                    ))}
                </div>
            ) : (
                <div className="empty-state">
                    <span className="empty-state__icon">📂</span>
                    <p className="empty-state__text">
                        У цій категорії ще немає пісень
                    </p>
                </div>
            )}
        </div>
    )
}

export default CategorySongsPage
