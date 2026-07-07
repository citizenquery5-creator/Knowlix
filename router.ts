import { useState, useEffect } from 'react';

export function getRoute(): string {
  const hash = window.location.hash.slice(1) || '/';
  return hash.split('?')[0] || '/';
}

export function getQueryParams(): URLSearchParams {
  const hash = window.location.hash.slice(1) || '/';
  const qIdx = hash.indexOf('?');
  if (qIdx === -1) return new URLSearchParams();
  return new URLSearchParams(hash.slice(qIdx + 1));
}

export function navigate(path: string, replace = false) {
  const newHash = path.startsWith('#') ? path : `#${path}`;
  if (replace) {
    window.location.replace(newHash);
  } else {
    window.location.hash = path;
  }
}

export function useRoute(): string {
  const [route, setRoute] = useState(getRoute);
  useEffect(() => {
    const handler = () => setRoute(getRoute());
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);
  return route;
}

export function useQueryParams(): URLSearchParams {
  const [params, setParams] = useState(getQueryParams);
  useEffect(() => {
    const handler = () => setParams(getQueryParams());
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);
  return params;
}
