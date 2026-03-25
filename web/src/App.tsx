import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MainLayout } from './layout/MainLayout';
import { Dashboard } from './pages/Dashboard';
import { Upload } from './pages/Upload';
import { Tools } from './pages/Tools';
import { Settings } from './pages/Settings';
import { Channels } from './pages/Channels';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { GoogleOAuthProvider } from '@react-oauth/google';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

function App() {
  return (
    <ThemeProvider>
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />

              <Route element={<ProtectedRoute />}>
                <Route element={<MainLayout />}>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/upload" element={<Upload />} />
                  <Route path="/channels" element={<Channels />} />
                  <Route path="/tools" element={<Tools />} />
                  <Route path="/settings" element={<Settings />} />
                </Route>
              </Route>
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </GoogleOAuthProvider>
    </ThemeProvider>
  );
}

export default App;
