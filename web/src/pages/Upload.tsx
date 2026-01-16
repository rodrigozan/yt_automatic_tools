export function Upload() {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold tracking-tight">Upload Video</h2>
            </div>
            <div className="p-8 border border-dashed border-border rounded-xl bg-muted/20 flex flex-col items-center justify-center min-h-[400px]">
                <p className="text-muted-foreground">Drag and drop video files here or click to browse</p>
                <button className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md shadow hover:bg-primary/90 transition-colors">
                    Select Files
                </button>
            </div>
        </div>
    );
}
