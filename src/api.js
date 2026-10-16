const BASE = `${import.meta.env.VITE_API_URL ?? ''}/api`;

export class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

async function request(path, { method = 'GET', body } = {}) {
  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      credentials: 'include',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, 'NETWORK', 'Could not reach Sunledger. Check your connection and try again.');
  }

  if (res.status === 204) return null;
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* non-JSON response */
  }
  if (!res.ok) {
    throw new ApiError(
      res.status,
      data?.error?.code ?? 'UNKNOWN',
      data?.error?.message ?? 'Something went wrong. Please try again.',
      data?.error?.details
    );
  }
  return data;
}

const post = (path, body) => request(path, { method: 'POST', body });

export const api = {
  // energy analysis
  catalog: (segment) => request(`/analysis/catalog/${segment}`),
  estimate: (input) => post('/analysis/estimate', input),
  saveAssessment: (input) => post('/analysis/assessments', input),
  listAssessments: () => request('/analysis/assessments'),
  getAssessment: (id) => request(`/analysis/assessments/${id}`),

  // auth
  register: (body) => post('/auth/register', body),
  verifyOtp: (body) => post('/auth/verify-otp', body),
  resendOtp: (body) => post('/auth/resend-otp', body),
  login: (body) => post('/auth/login', body),
  logout: () => post('/auth/logout'),
  me: () => request('/auth/me'),
};
