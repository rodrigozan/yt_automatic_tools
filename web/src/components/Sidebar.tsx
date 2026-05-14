import { Home, Upload, Box, Settings, LogOut, Youtube, History } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';

export function Sidebar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navItems = [
        { to: '/', icon: Home, label: 'Dashboard' },
        { to: '/upload', icon: Upload, label: 'Upload' },
        { to: '/channels', icon: Youtube, label: 'Channels' },
        { to: '/history', icon: History, label: 'History' },
        { to: '/tools', icon: Box, label: 'Tools' },
        { to: '/settings', icon: Settings, label: 'Settings' },
    ];

    return (
        <aside className="w-16 h-screen flex-col items-center py-6 border-r border-white/[0.06] bg-white/[0.02] hidden md:flex">
            {/* Logo */}
            <div className="mb-8">
                <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center">
                    <Youtube className="w-5 h-5 text-primary" />
                </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 flex flex-col items-center gap-1">
                {navItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        title={item.label}
                        end={item.to === '/'}
                        className={({ isActive }) =>
                            cn(
                                'w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200',
                                isActive
                                    ? 'bg-primary/15 text-primary'
                                    : 'text-muted-foreground hover:bg-white/[0.06] hover:text-foreground'
                            )
                        }
                    >
                        <item.icon className="w-[18px] h-[18px]" />
                    </NavLink>
                ))}
            </nav>

            {/* User & Logout */}
            <div className="flex flex-col items-center gap-3">
                <button
                    onClick={handleLogout}
                    title="Sign out"
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
                >
                    <LogOut className="w-[18px] h-[18px]" />
                </button>
                {user?.picture ? (
                    <img
                        src={user.picture}
                        alt={user.name}
                        title={user.name || user.email}
                        className="w-8 h-8 rounded-full ring-2 ring-white/10 object-cover"
                    />
                ) : (
                    <div
                        title={user?.name || user?.email}
                        className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-bold ring-2 ring-white/10"
                    >
                        {user?.name?.[0] || user?.email[0].toUpperCase()}
                    </div>
                )}
            </div>
        </aside>
    );
}
