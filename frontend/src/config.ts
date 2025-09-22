export const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://web-production-1c60b.up.railway.app'  // Railway backend
  : 'http://localhost:3001';           // Local development 