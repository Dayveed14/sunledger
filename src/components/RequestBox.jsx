import { useState } from 'react';
import { ApiError } from '../api.js';

// "Request this" button that opens a small confirmation with an optional note to the vendor.
export default function RequestBox({ user, vendorName, label, onSend, onSent }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [sent, setSent] = useState(false);

  const send = async () => {
    setBusy(true);
    setError(null);
    try {
      await onSend(message.trim() || null);
      setSent(true);
      onSent?.();
    } catch (err) {
      if (err instanceof ApiError && err.code === 'ALREADY_REQUESTED') setSent(true);
      else setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (sent) {
    return <p className="r-callout good request-sent" role="status">Request sent to {vendorName}. They&apos;ll contact you on {user.phone || user.email}.</p>;
  }

  if (!open) {
    return <button type="button" className="btn btn-primary btn-small opt-cta" onClick={() => setOpen(true)}>{label}</button>;
  }

  return (
    <div className="request-box">
      <p className="muted">{vendorName} will see your name and contact details ({user.email}{user.phone ? `, ${user.phone}` : ''}) and what you need.</p>
      <label className="field">
        <span>Note to the vendor <em>(optional)</em></span>
        <textarea rows={2} maxLength={500} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Best time to call, site details…" />
      </label>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="row-actions">
        <button type="button" className="btn btn-primary btn-small" onClick={send} disabled={busy}>{busy ? 'Sending…' : 'Send request'}</button>
        <button type="button" className="btn btn-quiet btn-small" onClick={() => setOpen(false)} disabled={busy}>Cancel</button>
      </div>
    </div>
  );
}
