export function Dashboard() {
    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Metric Cards will go here */}
                <div className="p-6 bg-card rounded-xl border border-border shadow-sm">
                    <h3 className="font-semibold text-muted-foreground text-sm">Total Uploads</h3>
                    <p className="text-2xl font-bold mt-2">1,234</p>
                </div>
                <div className="p-6 bg-card rounded-xl border border-border shadow-sm">
                    <h3 className="font-semibold text-muted-foreground text-sm">Active Channels</h3>
                    <p className="text-2xl font-bold mt-2">5</p>
                </div>
            </div>
        </div>
    );
}
