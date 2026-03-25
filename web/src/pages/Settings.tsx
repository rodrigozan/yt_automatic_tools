import { useTheme } from '../contexts/ThemeContext';
import { Sun, Moon, Monitor } from 'lucide-react';
import { cn } from '../lib/utils';

export function Settings() {
    const { theme, setTheme } = useTheme();

    const themes = [
        { id: 'light', label: 'Light', icon: Sun },
        { id: 'dark', label: 'Dark', icon: Moon },
    ] as const;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
                <p className="text-muted-foreground mt-1">Manage your application preferences and appearance.</p>
            </div>

            <div className="grid gap-6">
                <section className="p-8 glass rounded-2xl border border-white/[0.05]">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-lg bg-primary/10">
                            <Sun className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold">Appearance</h3>
                            <p className="text-sm text-muted-foreground">Customize how the application looks for you.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
                        {themes.map(({ id, label, icon: Icon }) => (
                            <button
                                key={id}
                                onClick={() => setTheme(id)}
                                className={cn(
                                    "relative flex flex-col items-start gap-4 p-4 rounded-xl border-2 transition-all duration-200 group",
                                    theme === id
                                        ? "bg-primary/5 border-primary shadow-[0_0_20px_rgba(var(--primary),0.1)]"
                                        : "bg-muted/30 border-transparent hover:bg-muted/50 hover:border-white/10"
                                )}
                            >
                                <div className={cn(
                                    "p-2 rounded-lg transition-colors",
                                    theme === id ? "bg-primary text-primary-foreground" : "bg-white/5 text-muted-foreground group-hover:text-foreground"
                                )}>
                                    <Icon className="w-5 h-5" />
                                </div>
                                <div className="text-left">
                                    <p className={cn(
                                        "font-medium transition-colors",
                                        theme === id ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
                                    )}>{label}</p>
                                    <p className="text-xs text-muted-foreground/60">
                                        {id === 'light' ? 'Lighter background with dark text' : 'Darker background with light text'}
                                    </p>
                                </div>
                                {theme === id && (
                                    <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-primary" />
                                )}
                            </button>
                        ))}
                    </div>
                </section>

                <section className="p-8 glass rounded-2xl border border-white/[0.05] opacity-50 cursor-not-allowed">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-lg bg-white/5">
                            <Monitor className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold">System Sync</h3>
                            <p className="text-sm text-muted-foreground">Automatically match your system theme (Coming soon).</p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
