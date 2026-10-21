// Launch switches for the app screens. Each one is a pair of lines: keep ONE active and comment the other.
// Keep this in step with server/src/config/launch.js (the server enforces the rules; this only shows or hides screens).

// 1. VENDOR REGISTRATION FEE
//    FREE = new vendors go straight to their dashboard (current).
//    PAID = a vendor who has not paid sees a "pay the registration fee" screen first.
// FREE (active):
export const VENDOR_REGISTRATION_FEE_REQUIRED = false;
// PAID (to switch on: comment the FREE line above, uncomment this one):
// export const VENDOR_REGISTRATION_FEE_REQUIRED = true;

// 2. WHO IS OFFERED "ENERGY AS A SERVICE" (the EaaS code is untouched; this only decides who sees it)
// Businesses only (active):
export const EAAS_ROLES = ['business'];
// Individuals and businesses (to switch back: comment the line above, uncomment this one):
// export const EAAS_ROLES = ['individual', 'business'];
