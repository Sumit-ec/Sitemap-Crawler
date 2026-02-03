const normalizeUrl = (url) => {
  if (!url || typeof url !== 'string') return "";
  
  let normalized = url.trim().toLowerCase();

  if (normalized.endsWith("/") && normalized.length > 8) {
    normalized = normalized.slice(0, -1);
  }
  
  return normalized;
};

module.exports = { normalizeUrl };