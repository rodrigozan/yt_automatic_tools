import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';

export function MainLayout() {
    return (
        <div className="flex min-h-screen bg-background text-foreground font-sans antialiased">
            <Sidebar />
            <main className="flex-1 flex flex-col h-screen overflow-hidden pt-14 md:pt-0">
                <div className="flex-1 overflow-auto p-6 lg:p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
