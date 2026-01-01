const ALLOWED_ORIGINS = [
  'https://transit.det.city',
  'http://localhost:8888',
  'http://localhost:8000',
];

function isAllowedOrigin(event) {
  const origin = event.headers.origin || event.headers.Origin;
  const referer = event.headers.referer || event.headers.Referer;

  if (origin && ALLOWED_ORIGINS.some(allowed => origin.startsWith(allowed))) {
    return true;
  }

  if (referer && ALLOWED_ORIGINS.some(allowed => referer.startsWith(allowed))) {
    return true;
  }

  return false;
}

function getCorsOrigin(event) {
  const origin = event.headers.origin || event.headers.Origin || 'https://transit.det.city';
  return ALLOWED_ORIGINS.find(allowed => origin.startsWith(allowed)) || ALLOWED_ORIGINS[0];
}

module.exports = { ALLOWED_ORIGINS, isAllowedOrigin, getCorsOrigin };
