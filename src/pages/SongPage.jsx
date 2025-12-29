import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, FileText } from 'lucide-react'
import { useSongs } from '../context/SongsContext'
import PDFViewer from '../components/PDFViewer'
import api from '../api/client'

function SongPage() {
    const { songId } = useParams()
    const navigate = useNavigate()
    const { getSongById } = useSongs()
    const [showPDF, setShowPDF] = useState(false)

    const song = getSongById(songId)

    if (!song) {
        return (
            <div className="empty-state">
                <span className="empty-state__icon">❓</span>
                <p className="empty-state__text">Пісню не знайдено</p>
                <button
                    onClick={() => navigate('/')}
                    style={{ color: 'var(--color-accent)', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                    Повернутися на головну
                </button>
            </div>
        )
    }

    const categoryNames = song.categories?.map(c => c.name).filter(Boolean) || []
    const pdfUrl = api.getPdfUrl(song.pdfPath)

    return (
        <>
            <div className="song-page">
                <button className="song-page__back" onClick={() => navigate(-1)}>
                    <ArrowLeft size={18} />
                    Назад
                </button>

                <h1 className="song-page__title">{song.title}</h1>

                {song.author && (
                    <p className="song-page__author">{song.author}</p>
                )}

                {categoryNames.length > 0 && (
                    <div className="song-page__categories">
                        {categoryNames.map(name => (
                            <span key={name} className="song-page__category">{name}</span>
                        ))}
                    </div>
                )}

                <hr className="song-page__divider" />

                {pdfUrl ? (
                    <button
                        className="song-page__open-btn"
                        onClick={() => setShowPDF(true)}
                    >
                        <FileText size={24} />
                        Відкрити ноти
                    </button>
                ) : (
                    <div style={{
                        padding: '24px',
                        textAlign: 'center',
                        background: 'var(--color-surface)',
                        borderRadius: '12px',
                        color: 'var(--color-text-muted)'
                    }}>
                        📄 PDF ще не завантажено
                    </div>
                )}

                {(song.key || song.voices || song.difficulty) && (
                    <div className="song-page__info">
                        <h3 className="song-page__info-title">ℹ️ Додаткова інформація:</h3>
                        <ul className="song-page__info-list">
                            {song.key && (
                                <li className="song-page__info-item">• Тональність: {song.key}</li>
                            )}
                            {song.voices && (
                                <li className="song-page__info-item">• Голоси: {song.voices}</li>
                            )}
                            {song.difficulty && (
                                <li className="song-page__info-item">• Складність: {song.difficulty}</li>
                            )}
                        </ul>
                    </div>
                )}
            </div>

            {showPDF && pdfUrl && (
                <PDFViewer
                    url={pdfUrl}
                    title={song.title}
                    onClose={() => setShowPDF(false)}
                />
            )}
        </>
    )
}

export default SongPage
