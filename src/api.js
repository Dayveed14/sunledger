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

async function request(path, { method = 'GET', body, raw, headers } = {}) {
  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      credentials: 'include',
      headers: raw ? { 'Content-Type': raw.type, ...headers } : body ? { 'Content-Type': 'application/json', ...headers } : headers,
      body: raw ?? (body ? JSON.stringify(body) : undefined),
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
  adminProducts: (params) => request(`/admin/products${qs(params)}`),
  adminUpdateProduct: (id, body) => put(`/admin/products/${id}`, body),
  adminDeleteProduct: (id) => del(`/admin/products/${id}`),
  adminUploadImage: (blob) => request('/admin/images', { method: 'POST', raw: blob }),

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

  uploadImage: (blob) => request('/vendor/images', { method: 'POST', raw: blob }),
  // vendor registration fee (only used once registration is switched to paid)
  vendorFeeStart: () => post('/vendor/fee/start'),
  vendorFeeVerify: (reference) => post('/vendor/fee/verify', { reference }),
  vendorFeeMockPay: (reference) => post('/vendor/fee/mock-pay', { reference }),
  vendorLeasePreview: (body) => post('/vendor/lease-preview', body),

  // public shop (always for one state)
  shopProducts: (params = {}) => request(`/shop/products${qs(params)}`),
  shopDeals: (params = {}) => request(`/shop/deals${qs(params)}`),
  shopProduct: (id, dest) => request(`/shop/products/${id}${qs(dest ?? {})}`),
  shopDeal: (id, dest) => request(`/shop/deals/${id}${qs(dest ?? {})}`),

  // checkout and orders
  quote: (items, destination) => post('/checkout/quote', { items, destination }),
  checkout: (items, destination, key) => request('/checkout', { method: 'POST', body: { items, destination }, headers: { 'Idempotency-Key': key } }),
  payAgain: (ref) => post(`/checkout/${ref}/pay`),
  verifyPayment: (reference) => post('/checkout/verify', { reference }),
  mockPay: (reference) => post('/checkout/mock-pay', { reference }),
  myOrders: () => request('/orders'),
  myOrder: (ref) => request(`/orders/${ref}`),
  confirmReceived: (ref, voId) => post(`/orders/${ref}/received/${voId}`),
  vendorOrders: (status) => request(`/vendor/orders${qs({ status })}`),
  vendorOrderAction: (id, action, note) => post(`/vendor/orders/${id}/${action}`, note ? { note } : {}),
  adminOrders: (params) => request(`/admin/orders${qs(params)}`),
  adminOrderStats: () => request('/admin/orders/stats'),
  adminOrderAction: (id, action) => post(`/admin/orders/${id}/${action}`, {}),
  adminOrderEvents: (ref) => request(`/admin/orders/ref/${ref}/events`),
  dispatchInfo: (t) => request(`/dispatch/info${qs({ t })}`),
  dispatchConfirm: (t) => post('/dispatch/confirm', { t }),

  // auth
  register: (body) => post('/auth/register', body),
  verifyOtp: (body) => post('/auth/verify-otp', body),
  resendOtp: (body) => post('/auth/resend-otp', body),
  login: (body) => post('/auth/login', body),
  logout: () => post('/auth/logout'),
  me: () => request('/auth/me'),
  areas: () => request('/auth/areas'),
  switchAccount: (role) => post('/auth/switch', { role }),
  addAccount: (body) => post('/auth/accounts', body),
  updateProfile: (body) => put('/auth/profile', body),
};
