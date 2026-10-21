import { useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { ApiError, api } from '../api.js';
import { useAuth } from '../auth/AuthContext.jsx';
import AddressFields from '../components/AddressFields.jsx';

const COPY = {
  vendor: { title: 'Sell on Sunledger', text: 'Open a vendor account on the same email and password. Your shopping account stays as it is; switch between them from the menu.', company: 'Company name', loc: 'Business location (where orders are picked up)' },
  business: { title: 'Open a business account', text: 'Use the same email and password for your company. Switch between accounts from the menu.', company: 'Business or organisation name', loc: 'Business delivery address' },
  individual: { title: 'Open an individual account', text: 'Use the same email and password for your home.', company: null, loc: 'Delivery address' },
};

export default function AddAccount() {
  const [params] = useSearchParams();
  const role = params.get('role');
  const { user, accounts, refresh } = useAuth();
  const navigate = useNavigate();
  const copy = COPY[role];
  const [companyName, setCompanyName] = useState('');
  const [address, setAddress] = useState(user.address ? { line: user.address.line, state: user.address.state, areaId: user.address.areaId } : { line: '', state: '', areaId: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);

  if (!copy || accounts.some((a) => a.role === role)) return <Navigate to="/app" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    setFormError(null);
    try {
      await api.addAccount({ role, ...(copy.company ? { companyName: companyName.trim() } : {}), address: { ...address, line: address.line.trim() } });
      await refresh();
      navigate('/app', { replace: true });
    } catch (err) {
      if (err instanceof ApiError && err.code === 'VALIDATION_ERROR') setErrors(err.details?.fields ?? {});
      else setFormError(err.message);
      setSaving(false);
    }
  };

  return (
    <div className="wrap dash">
      <header className="dash-head"><div><p className="eyebrow">New account</p><h1>{copy.title}</h1></div></header>
      <form onSubmit={submit} noValidate className="profile-form">
        <p className="muted">{copy.text}</p>
        {copy.company && (
          <label className="field">
            <span>{copy.company}</span>
            <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} aria-invalid={Boolean(errors.companyName)} />
            {errors.companyName && <small className="err">{errors.companyName}</small>}
          </label>
        )}
        <AddressFields value={address} onChange={setAddress} errors={errors} legend={copy.loc} />
        {formError && <p className="form-error" role="alert">{formError}</p>}
        <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Opening…' : 'Open account'}</button>
      </form>
    </div>
  );
}
