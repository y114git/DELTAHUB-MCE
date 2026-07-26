import LanguageSelector from './components/LanguageSelector/LanguageSelector';
import { NavigationProvider, useCurrentPath } from './navigation';
import Home from './pages/Home';
import CreateMod from './pages/CreateMod';
import EditMod from './pages/EditMod';

function CurrentPage() {
  const path = useCurrentPath();
  if (path === '/create') return <CreateMod />;
  if (path === '/edit') return <EditMod />;
  return <Home />;
}

function App() {
  return (
    <NavigationProvider>
      <LanguageSelector />
      <CurrentPage />
    </NavigationProvider>
  );
}

export default App;
