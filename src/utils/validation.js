export function validateModName(name) {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: 'dialogs.mod_name_empty' };
  }
  return { valid: true };
}

export function validateModAuthor(author, isPublic) {
  if (isPublic && (!author || author.trim().length === 0)) {
    return { valid: false, error: 'dialogs.mod_author_empty' };
  }
  return { valid: true };
}

export function validateVersion(version) {
  if (!version || version.trim().length === 0) {
    return { valid: false, error: 'Version is required' };
  }
  if (version.length > 50) {
    return { valid: false, error: 'dialogs.mod_version_too_long' };
  }
  return { valid: true };
}

export function validateURL(url, allowEmpty = false) {
  if (allowEmpty && (!url || url.trim().length === 0)) {
    return { valid: true };
  }
  if (!url || url.trim().length === 0) {
    return { valid: false, error: 'URL is required' };
  }
  try {
    const urlObj = new URL(url);
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return { valid: false, error: 'URL must be HTTP or HTTPS' };
    }
    return { valid: true };
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }
}

export function validateExternalURL(url, allowEmpty = true) {
  if (allowEmpty && (!url || url.trim().length === 0)) {
    return { valid: true };
  }
  const urlValidation = validateURL(url, false);
  if (!urlValidation.valid) {
    return { valid: false, error: 'dialogs.invalid_external_url' };
  }
  const urlLower = url.toLowerCase();
  const directDownloadExtensions = ['.zip', '.rar', '.7z', '.exe', '.dmg', '.pkg', '.deb', '.rpm'];
  if (directDownloadExtensions.some(ext => urlLower.includes(ext))) {
    return { valid: false, error: 'dialogs.invalid_external_url_direct_download' };
  }
  return { valid: true };
}

export function validateDescriptionURL(url, allowEmpty = false) {
  if (allowEmpty && (!url || url.trim().length === 0)) {
    return { valid: true };
  }
  const urlValidation = validateURL(url, false);
  if (!urlValidation.valid) {
    return { valid: false, error: 'errors.description_md_txt_required' };
  }
  const urlLower = url.toLowerCase();
  if (!urlLower.endsWith('.md') && !urlLower.endsWith('.txt')) {
    return { valid: false, error: 'errors.description_md_txt_required' };
  }
  return { valid: true };
}

export function validateIconURL(url, allowEmpty = true) {
  if (allowEmpty && (!url || url.trim().length === 0)) {
    return { valid: true };
  }
  return validateURL(url, false);
}

export function validateFileURL(url, allowEmpty = false) {
  if (allowEmpty && (!url || url.trim().length === 0)) {
    return { valid: true };
  }
  return validateURL(url, false);
}

export async function validateImageURL(url) {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    if (!response.ok) {
      return { valid: false, error: 'errors.file_not_available' };
    }
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.startsWith('image/')) {
      return { valid: false, error: 'errors.not_an_image' };
    }
    const contentLength = response.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > 2 * 1024 * 1024) {
      return { valid: false, error: 'errors.file_too_large', errorParams: { max_size: 2 } };
    }
    return { valid: true };
  } catch {
    return { valid: false, error: 'errors.url_error' };
  }
}

