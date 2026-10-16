import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <section className="wrap page-narrow empty-state">
      <h1>That page isn&apos;t here</h1>
      <p className="lede">The link may be old or mistyped.</p>
      <Link to="/" className="btn btn-primary">Back to home</Link>
    </section>
  );
}
