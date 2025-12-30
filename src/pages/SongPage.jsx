import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, FileText, Send, Loader } from 'lucide-react'
import { useSongs } from '../context/SongsContext'
import api from '../api/client'

function SongPage() {
    const { songId } = useParams()
    const navigate = useNavigate()
    const { getSongById } = useSongs()
    const [sending, setSending] = useState(false)
    const [sent, setSent] = useState(false)
    const [error, setError] = useState(null)

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

    // Send PDF via Telegram bot
    const sendPdfToTelegram = async () => {
        if (sending || sent) return

        setSending(true)
        setError(null)

        try {
            await api.sendPdf(song.id)
            setSent(true)

            // Show success briefly
            setTimeout(() => setSent(false), 3000)
        } catch (err) {
            console.error('Error sending PDF:', err)
            setError('Не вдалося надіслати. Спробуйте ще раз.')
        } finally {
            setSending(false)
        }
    }

    return (
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

            {song.pdfPath ? (
                <button
                    className="song-page__open-btn"
                    onClick={sendPdfToTelegram}
                    disabled={sending}
                    style={sent ? { background: 'var(--color-success)' } : {}}
                >
                    {sending ? (
                        <>
                            <Loader size={24} className="spinning" />
                            Надсилаємо...
                        </>
                    ) : sent ? (
                        <>
                            ✓ Надіслано в Telegram
                        </>
                    ) : (
                        <>
                            <Send size={24} />
                            Отримати ноти
                        </>
                    )}
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

            {error && (
                <p style={{ color: 'var(--color-error)', marginTop: '12px', textAlign: 'center' }}>
                    {error}
                </p>
            )}
        </div>
    )
}

export default SongPage
