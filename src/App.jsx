import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSelector from './components/LanguageSelector/LanguageSelector';
import Home from './pages/Home';
import CreatePublicMod from './pages/CreatePublicMod';
import CreateLocalMod from './pages/CreateLocalMod';
import EditPublicMod from './pages/EditPublicMod';
import EditLocalMod from './pages/EditLocalMod';

function App() {
  return (
    <BrowserRouter basename="/DH-MCE">
      <LanguageSelector />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/create/public" element={<CreatePublicMod />} />
        <Route path="/create/local" element={<CreateLocalMod />} />
        <Route path="/edit/public" element={<EditPublicMod />} />
        <Route path="/edit/local" element={<EditLocalMod />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

