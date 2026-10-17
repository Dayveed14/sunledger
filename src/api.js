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
const put = (path, body) => request(path, { method: 'PUT', body });
const patch = (path, body) => request(path, { method: 'PATCH', body });
const del = (path) => request(path, { method: 'DELETE' });
const qs = (params) => {
  const q = new URLSearchParams(Object.entries(params).filter(([, v]) => v)).toString();
  return q ? `?${q}` : '';
};

export const api = {
  // password reset
  forgotPassword: (email) => post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => post('/auth/reset-password', { token, password }),

  // admin
  adminSummary: () => request('/admin/summary'),
  adminVendors: (status) => request(`/admin/vendors${qs({ status })}`),
  adminVendorVerification: (id, status) => patch(`/admin/vendors/${id}/verification`, { status }),
  adminUsers: (params) => request(`/admin/users${qs(params)}`),
  adminUserStatus: (id, status) => patch(`/admin/users/${id}/status`, { status }),
  adminSettings: () => request('/admin/settings'),
  adminSaveSettings: (changes) => put('/admin/settings', { changes }),
  adminAudit: () => request('/admin/audit'),

  // energy analysis
  catalog: (segment) => request(`/analysis/catalog/${segment}`),
  estimate: (input) => post('/analysis/estimate', input),
  saveAssessment: (input) => post('/analysis/assessments', input),
  listAssessments: () => request('/analysis/assessments'),
  getAssessment: (id) => request(`/analysis/assessments/${id}`),

  // vendor dashboard
  vendorSummary: () => request('/vendor/summary'),
  vendorProducts: () => request('/vendor/products'),
  vendorCreateProduct: (body) => post('/vendor/products', body),
  vendorUpdateProduct: (id, body) => put(`/vendor/products/${id}`, body),
  vendorDeleteProduct: (id) => del(`/vendor/products/${id}`),
  vendorDeals: () => request('/vendor/deals'),
  vendorCreateDeal: (body) => post('/vendor/deals', body),
  vendorUpdateDeal: (id, body) => put(`/vendor/deals/${id}`, body),
  vendorEaasRules: () => request('/vendor/eaas-rules'),
  vendorEaasPreview: (body) => post('/vendor/eaas-preview', body),
  vendorDealStatus: (id, status) => patch(`/vendor/deals/${id}/status`, { status }),
  vendorDeleteDeal: (id) => del(`/vendor/deals/${id}`),
  vendorRequests: () => request('/vendor/requests'),
  vendorRequestStatus: (id, status) => patch(`/vendor/requests/${id}/status`, { status }),

  // customer offers
  offers: (assessmentId, plan) => request(`/offers/assessments/${assessmentId}?plan=${plan}`),
  diyQuote: (assessmentId, items) => post(`/offers/assessments/${assessmentId}/diy-quote`, { items }),
  sendRequest: (assessmentId, body) => post(`/offers/assessments/${assessmentId}/requests`, body),
  myRequests: () => request('/offers/requests'),
  cancelRequest: (id) => post(`/offers/requests/${id}/cancel`),

  // public shop
  shopProducts: (params = {}) => request(`/shop/products${qs(params)}`),
  shopDeals: () => request('/shop/deals'),

  // auth
  register: (body) => post('/auth/register', body),
  verifyOtp: (body) => post('/auth/verify-otp', body),
  resendOtp: (body) => post('/auth/resend-otp', body),
  login: (body) => post('/auth/login', body),
  logout: () => post('/auth/logout'),
  me: () => request('/auth/me'),
};
