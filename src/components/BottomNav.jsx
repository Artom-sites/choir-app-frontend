import { NavLink } from 'react-router-dom'
import { Home, Search, FolderOpen, Settings } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

function BottomNav() {
    const { isAdmin } = useAuth()

    return (
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

            <NavLink
                to="/categories"
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
                <FolderOpen size={20} className="nav-item__icon" />
                <span>Категорії</span>
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
    )
}

export default BottomNav
