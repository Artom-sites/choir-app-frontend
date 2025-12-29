import { Link } from 'react-router-dom'
import { FolderOpen } from 'lucide-react'
import { useSongs } from '../context/SongsContext'

function CategoriesPage() {
    const { categories, getSongsByCategory, loading } = useSongs()

    if (loading) {
        return (
            <div className="loading">
                <div className="loading__spinner" />
                <span className="loading__text">Завантаження...</span>
            </div>
        )
    }

    return (
        <div>
            <h2 className="page-title">
                <FolderOpen size={20} />
                Категорії
            </h2>

            <div className="categories-grid">
                {categories.map(category => {
                    const songCount = getSongsByCategory(category.id).length

                    return (
                        <Link
                            key={category.id}
                            to={`/categories/${category.id}`}
                            className="category-card"
                        >
                            <div className="category-card__icon">{category.icon}</div>
                            <div className="category-card__name">{category.name}</div>
                            <div className="category-card__count">({songCount})</div>
                        </Link>
                    )
                })}
            </div>
        </div>
    )
}

export default CategoriesPage
