import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const NavigationContext = createContext(null);
const basePath = import.meta.env.BASE_URL.replace(/\/+$/, '');

function readPath() {
  const path = window.location.pathname;
  const relative = basePath && path.startsWith(basePath) ? path.slice(basePath.length) : path;
  return relative.startsWith('/') ? relative : `/${relative}`;
}

export function NavigationProvider({ children }) {
  const [path, setPath] = useState(readPath);

  useEffect(() => {
    const handlePopState = () => setPath(readPath());
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = useCallback((nextPath) => {
    const normalized = nextPath.startsWith('/') ? nextPath : `/${nextPath}`;
    window.history.pushState(null, '', `${basePath}${normalized}`);
    setPath(normalized);
  }, []);

  const value = useMemo(() => ({ path, navigate }), [path, navigate]);
  return <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>;
}

function useNavigation() {
  const value = useContext(NavigationContext);
  if (!value) throw new Error('NavigationProvider is missing');
  return value;
}

export function useCurrentPath() {
  return useNavigation().path;
}

export function useNavigate() {
  return useNavigation().navigate;
}
