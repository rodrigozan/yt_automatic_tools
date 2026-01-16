import { Home, Upload, Box, Settings } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { cn } from '../lib/utils';

export function Sidebar() {
    const navItems = [
        { to: '/', icon: Home, label: 'Dashboard' },
        { to: '/upload', icon: Upload, label: 'Upload' },
        { to: '/tools', icon: Box, label: 'Tools' },
        { to: '/settings', icon: Settings, label: 'Settings' },
    ];

    return (
        <aside className="w-64 h-screen bg-card border-r border-border flex flex-col hidden md:flex">
            <div className="p-6">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                    YT Tools
                </h1>
            </div>
            <nav className="flex-1 px-4 py-4 space-y-2">
                {navItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) =>
                            cn(
                                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group",
                                isActive
                                    ? "bg-primary/10 text-primary font-medium shadow-sm"
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            )
                        }
                    >
                        <item.icon className="w-5 h-5" />
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </nav>
            <div className="p-4 border-t border-border">
                <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Logged in as</p>
                    <p className="text-sm font-medium">User</p>
                </div>
            </div>
        </aside>
    );
}
