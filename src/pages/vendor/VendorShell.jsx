import { useEffect, useState } from 'react';
import { api } from '../../api.js';
import { useAuth } from '../../auth/AuthContext.jsx';
import { VENDOR_REGISTRATION_FEE_REQUIRED } from '../../config/launch.js';
import VendorFeeGate from './VendorFeeGate.jsx';

const VERIFY_LABEL = { pending: 'Pending verification', verified: 'Verified vendor', rejected: 'Not approved' };

// The frame every vendor page sits in: who you are, your verification status, and the tabs.
export default function VendorShell({ children }) {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    let cancelled = false;
    api.vendorSummary().then((s) => !cancelled && setSummary(s)).catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="wrap dash">
      <header className="dash-head">
        <div>
          <p className="eyebrow">Vendor account{user.companyName ? ` · ${user.companyName}` : ''}</p>
          <h1>Vendor dashboard</h1>
        </div>
        {summary && <span className={`badge badge-${summary.verification}`}>{VERIFY_LABEL[summary.verification]}</span>}
      </header>

      {VENDOR_REGISTRATION_FEE_REQUIRED && summary?.registrationFee?.mustPay ? <VendorFeeGate fee={summary.registrationFee} /> : children}
    </div>
  );
}
