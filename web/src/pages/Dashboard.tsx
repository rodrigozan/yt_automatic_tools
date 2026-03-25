import { Upload, Youtube, Clock, BarChart2, Video, TrendingUp } from 'lucide-react';

const stats = [
    { label: 'Total Uploads', value: '1,234', change: '+12%', icon: Upload },
    { label: 'Active Channels', value: '5', change: '+1', icon: Youtube },
    { label: 'Videos Published', value: '48', change: '+3.2%', icon: Video },
    { label: 'Scheduled', value: '12', change: '+5', icon: Clock },
];

const weeklyBars = [40, 65, 55, 80, 70, 88, 60];
const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const quickMetrics = [
    { label: 'Total Views', value: '24.5K', icon: BarChart2 },
    { label: 'Subscribers', value: '1.2K', icon: TrendingUp },
    { label: 'In Queue', value: '7', icon: Clock },
];

export function Dashboard() {
    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
                <span className="text-xs text-muted-foreground px-3 py-1.5 glass rounded-full">
                    YT Automatic Tools
                </span>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {stats.map(({ label, value, change, icon: Icon }) => (
                    <div key={label} className="glass rounded-2xl p-5 space-y-3">
                        <div className="flex items-center justify-between">
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                                {label}
                            </p>
                            <Icon className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <p className="text-2xl font-bold">{value}</p>
                        <p className="text-xs text-primary font-medium">{change}</p>
                    </div>
                ))}
            </div>

            {/* Main grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                {/* Activity chart — 2 cols */}
                <div className="lg:col-span-2 glass rounded-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="font-semibold text-sm">Upload Activity</h2>
                        <span className="text-xs text-muted-foreground">Weekly</span>
                    </div>
                    <div className="flex items-end gap-2 h-28">
                        {weeklyBars.map((h, i) => (
                            <div
                                key={i}
                                className="flex-1 rounded-lg bg-white/[0.05] flex items-end overflow-hidden"
                            >
                                <div
                                    className="w-full rounded-lg bg-primary/50 transition-all duration-500"
                                    style={{ height: `${h}%` }}
                                />
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between">
                        {weekDays.map((d) => (
                            <span key={d} className="flex-1 text-center text-xs text-muted-foreground">
                                {d}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Quick metrics — 1 col */}
                <div className="flex flex-col gap-3">
                    {quickMetrics.map(({ label, value, icon: Icon }) => (
                        <div key={label} className="glass rounded-2xl p-4 flex items-center gap-4 flex-1">
                            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <Icon className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">{label}</p>
                                <p className="text-xl font-bold">{value}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
