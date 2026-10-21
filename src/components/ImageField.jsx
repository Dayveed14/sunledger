import { useRef, useState } from 'react';
import { api } from '../api.js';

// Shrinks a picked photo in the browser (phone photos are huge), then uploads it. One picture per product or deal.
async function shrink(file, maxSide = 1200) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not read that picture.'))), 'image/jpeg', 0.85));
}

export default function ImageField({ label = 'Picture', imageId, imageUrl, onChange, upload }) {
  const input = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [preview, setPreview] = useState(imageUrl ?? null);

  const pick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) { setError('Choose a JPEG, PNG or WebP picture.'); return; }
    setBusy(true);
    setError(null);
    try {
      const blob = await shrink(file);
      const res = await (upload ?? api.uploadImage)(blob);
      setPreview(res.url);
      onChange(res.id);
    } catch (err) {
      setError(err.message || 'Could not upload that picture.');
    }
    setBusy(false);
  };

  return (
    <div className="field image-field">
      <span>{label} <em>(optional)</em></span>
      <div className="image-row">
        <div className="image-box" aria-hidden="true">{preview ? <img src={`${import.meta.env.VITE_API_URL ?? ''}${preview}`} alt="" /> : <span>No picture</span>}</div>
        <div>
          <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" onChange={pick} hidden />
          <button type="button" className="btn btn-quiet" disabled={busy} onClick={() => input.current?.click()}>{busy ? 'Uploading…' : preview ? 'Change picture' : 'Add a picture'}</button>
          {preview && !busy && <button type="button" className="btn btn-quiet" onClick={() => { setPreview(null); onChange(null); }}>Remove</button>}
          <small>One clear photo. We shrink it for you.</small>
        </div>
      </div>
      {error && <small className="err">{error}</small>}
      {imageId === undefined && null}
    </div>
  );
}
