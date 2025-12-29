import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

function SongCard({ song, number }) {
    const categoryNames = song.categories?.map(c => c.name).filter(Boolean) || []

    return (
        <Link to={`/song/${song.id}`} className="song-card">
            {number && (
                <span className="song-card__number">{number}</span>
            )}

            <div className="song-card__content">
                <h3 className="song-card__title">{song.title}</h3>
                <div className="song-card__categories">
                    {categoryNames.map(name => (
                        <span key={name} className="song-card__category">{name}</span>
                    ))}
                    {song.author && categoryNames.length === 0 && (
                        <span className="song-card__category">{song.author}</span>
                    )}
                </div>
            </div>

            <ChevronRight size={20} className="song-card__arrow" />
        </Link>
    )
}

export default SongCard
