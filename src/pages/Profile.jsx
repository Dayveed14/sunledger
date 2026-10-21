import { useState } from 'react';
import { ApiError, api } from '../api.js';
import { useAuth } from '../auth/AuthContext.jsx';
import AddressFields, { emptyAddress } from '../components/AddressFields.jsx';

export default function Profile() {
  const { user, setUser } = useAuth();
  const [fullName, setFullName] = useState(user.fullName);
  const [phone, setPhone] = useState(user.phone ?? '');
  const [address, setAddress] = useState(user.address ? { line: user.address.line, state: user.address.state, areaId: user.address.areaId } : emptyAddress);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    setFormError(null);
    setSaved(false);
    try {
      const r = await api.updateProfile({ fullName: fullName.trim(), phone: phone.trim(), address: { ...address, line: address.line.trim() } });
      setUser(r.user);
      setSaved(true);
    } catch (err) {
      if (err instanceof ApiError && err.code === 'VALIDATION_ERROR') setErrors(err.details?.fields ?? {});
      else setFormError(err.message);
    }
    setSaving(false);
  };

  const isVendor = user.role === 'vendor';
  return (
    <div className="wrap dash">
      <header className="dash-head">
        <div>
          <p className="eyebrow">{isVendor ? 'Vendor account' : 'Your account'}</p>
          <h1>Profile &amp; {isVendor ? 'location' : 'address'}</h1>
        </div>
      </header>
      <form onSubmit={submit} noValidate className="profile-form">
        <p className="muted">
          {isVendor
            ? 'Your location is where riders collect orders. Delivery prices to every area are worked out from it, so update it if you move.'
            : 'This is your default delivery address. You can still order for a different address in the shop.'}
        </p>
        <label className="field">
          <span>Full name</span>
          <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} aria-invalid={Boolean(errors.fullName)} />
          {errors.fullName && <small className="err">{errors.fullName}</small>}
        </label>
        <label className="field">
          <span>Email</span>
          <input type="email" value={user.email} disabled />
        </label>
        <label className="field">
          <span>Phone number</span>
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0803 123 4567" aria-invalid={Boolean(errors.phone)} />
          {errors.phone && <small className="err">{errors.phone}</small>}
        </label>
        <AddressFields value={address} onChange={setAddress} errors={errors} legend={isVendor ? 'Business location' : 'Delivery address'} />
        {formError && <p className="form-error" role="alert">{formError}</p>}
        {saved && <p className="form-ok" role="status">Saved.</p>}
        <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
      </form>
    </div>
  );
}
