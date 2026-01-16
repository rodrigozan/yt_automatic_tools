import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MainLayout } from './layout/MainLayout';
import { Dashboard } from './pages/Dashboard';
import { Upload } from './pages/Upload';
import { Tools } from './pages/Tools';
import { Settings } from './pages/Settings';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/tools" element={<Tools />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
