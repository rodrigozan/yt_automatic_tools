export function Settings() {
    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
            <div className="grid gap-6">
                <div className="p-6 bg-card rounded-xl border border-border">
                    <h3 className="text-lg font-medium mb-4">Appearance</h3>
                    {/* Theme toggle will go here */}
                    <p className="text-sm text-muted-foreground">Theme settings configuration.</p>
                </div>
            </div>
        </div>
    );
}
