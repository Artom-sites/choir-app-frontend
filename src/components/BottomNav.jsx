import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { Home, Search, Music, Plus, Settings, X, Calendar, FileUp } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

function BottomNav() {
    const { isAdmin } = useAuth()
    const navigate = useNavigate()
    const [showMenu, setShowMenu] = useState(false)

    const handleAddSong = () => {
        setShowMenu(false)
        // Show instruction to use bot
        if (window.Telegram?.WebApp) {
            window.Telegram.WebApp.showPopup({
                title: '📤 Додати пісню',
                message: 'Щоб додати нову пісню, надішліть PDF файл боту @musicviewer_bot у Telegram.\n\nПісня автоматично з\'явиться в категорії "Інше".',
                buttons: [{ type: 'ok' }]
            })
        } else {
            alert('Щоб додати нову пісню, надішліть PDF файл боту @musicviewer_bot у Telegram.')
        }
    }

    const handleAddRepertoire = () => {
        setShowMenu(false)
        navigate('/admin/set-repertoire')
    }

    return (
        <>
            {/* Menu Backdrop */}
            {showMenu && (
                <div
                    className="fab-backdrop"
                    onClick={() => setShowMenu(false)}
                />
            )}

            {/* Action Menu */}
            {showMenu && (
                <div className="fab-menu">
                    <button className="fab-menu__item" onClick={handleAddSong}>
                        <div className="fab-menu__icon" style={{ background: 'var(--color-accent)' }}>
                            <FileUp size={20} />
                        </div>
                        <span>Додати пісню (через бота)</span>
                    </button>
                    <button className="fab-menu__item" onClick={handleAddRepertoire}>
                        <div className="fab-menu__icon" style={{ background: 'var(--color-accent-secondary)' }}>
                            <Calendar size={20} />
                        </div>
                        <span>Репертуар на сьогодні</span>
                    </button>
                </div>
            )}

            <nav className="bottom-nav">
                <NavLink
                    to="/"
                    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                    end
                >
                    <Home size={20} className="nav-item__icon" />
                    <span>Головна</span>
                </NavLink>

                <NavLink
                    to="/search"
                    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                >
                    <Search size={20} className="nav-item__icon" />
                    <span>Пошук</span>
                </NavLink>

                {isAdmin && (
                    <button
                        className={`nav-item nav-item--plus ${showMenu ? 'active' : ''}`}
                        onClick={() => setShowMenu(!showMenu)}
                    >
                        {showMenu ? (
                            <X size={24} className="nav-item__icon" />
                        ) : (
                            <Plus size={24} className="nav-item__icon" />
                        )}
                    </button>
                )}

                <NavLink
                    to="/songs"
                    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                >
                    <Music size={20} className="nav-item__icon" />
                    <span>Пісні</span>
                </NavLink>

                {isAdmin && (
                    <NavLink
                        to="/admin"
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                    >
                        <Settings size={20} className="nav-item__icon" />
                        <span>Керування</span>
                    </NavLink>
                )}
            </nav>
        </>
    )
}

export default BottomNav
