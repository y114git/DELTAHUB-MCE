const BASE_URL = import.meta.env.VITE_CLOUD_FUNCTIONS_BASE_URL || '';

function getReferer() {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return 'https://y114git.github.io';
}

async function request(method, endpoint, data = null) {
  const url = `${BASE_URL}${endpoint}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Referer': getReferer(),
    },
  };

  if (data && method !== 'GET') {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, options);
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || `HTTP ${response.status}`);
    }
    
    return result;
  } catch (error) {
    throw error;
  }
}

export async function getGlobalSettings() {
  return request('GET', '/getGlobalSettings');
}

export async function getModData(modId) {
  return request('GET', `/getModData?modId=${encodeURIComponent(modId)}`);
}

export async function getPendingModData(modId) {
  return request('GET', `/getPendingModData?modId=${encodeURIComponent(modId)}`);
}

export async function getPendingChangeData(modId) {
  return request('GET', `/getPendingChangeData?modId=${encodeURIComponent(modId)}`);
}

export async function submitNewMod(modData, hashedKey) {
  return request('POST', '/submitNewMod', { modData, hashedKey });
}

export async function submitModChange(modData, hashedKey) {
  return request('POST', '/submitModChange', { modData, hashedKey });
}

export async function withdrawPendingMod(hashedKey) {
  return request('POST', '/withdrawPendingMod', { hashedKey });
}

export async function withdrawPendingChange(hashedKey) {
  return request('POST', '/withdrawPendingChange', { hashedKey });
}

export async function deletePublicMod(hashedKey) {
  return request('POST', '/deletePublicMod', { hashedKey });
}

