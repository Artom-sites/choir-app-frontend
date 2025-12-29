import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, X, Music, Calendar } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

function FloatingActionButton() {
    const [isOpen, setIsOpen] = useState(false)
    const navigate = useNavigate()
    const { isAdmin } = useAuth()

    if (!isAdmin) return null

    const handleAddSong = () => {
        setIsOpen(false)
        navigate('/admin/add-song')
    }

    const handleAddRepertoire = () => {
        setIsOpen(false)
        navigate('/admin/set-repertoire')
    }

    return (
        <>
            {/* Backdrop */}
            {isOpen && (
                <div
                    className="fab-backdrop"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Action Menu */}
            {isOpen && (
                <div className="fab-menu">
                    <button className="fab-menu__item" onClick={handleAddSong}>
                        <div className="fab-menu__icon" style={{ background: 'var(--color-accent)' }}>
                            <Music size={20} />
                        </div>
                        <span>Додати пісню</span>
                    </button>
                    <button className="fab-menu__item" onClick={handleAddRepertoire}>
                        <div className="fab-menu__icon" style={{ background: 'var(--color-accent-secondary)' }}>
                            <Calendar size={20} />
                        </div>
                        <span>Репертуар на сьогодні</span>
                    </button>
                </div>
            )}

            {/* FAB Button */}
            <button
                className={`fab ${isOpen ? 'fab--open' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                {isOpen ? <X size={24} /> : <Plus size={24} />}
            </button>
        </>
    )
}

export default FloatingActionButton
