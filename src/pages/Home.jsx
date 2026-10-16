import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAssessment } from '../components/AssessmentContext.jsx';

const EXAMPLE_BARS = [
  { label: 'Diesel generator', value: '₦420,000', pct: 100, tone: 'diesel' },
  { label: 'National grid', value: '₦180,000', pct: 43, tone: 'grid' },
  { label: 'Sunledger plan', value: '₦95,000', pct: 23, tone: 'solar' },
];

export default function Home() {
  const { open } = useAssessment();
  const [shown, setShown] = useState(false);

  // The example bars grow in once, on load.
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const t = setTimeout(() => setShown(true), reduce ? 0 : 250);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      <section className="hero">
        <div className="wrap hero-grid">
          <div className="hero-copy">
            <h1>
              Know what your power
              <br />
              is really costing you.
            </h1>
            <p className="lede">
              Tick the appliances you use. In three minutes Sunledger shows what your generator and your light bill really
              cost, what solar would save, and how to switch by renting, leasing or paying monthly, with vetted providers
              rather than sales pitches.
            </p>
            <div className="hero-actions">
              <button type="button" className="btn btn-primary" onClick={() => open()}>
                Run your free energy assessment
              </button>
              <Link to="/#how" className="btn btn-ghost">See how it works</Link>
            </div>
            <p className="hero-note">Free · No sign-up to see your results · No watts or volts to look up</p>
          </div>

          <div className="hero-panel" aria-label="Example monthly power cost comparison">
            <div className="panel-head">
              <span className="panel-title">Monthly power cost</span>
              <span className="panel-tag">Example · 20kVA retail outlet, Abuja</span>
            </div>
            <div className="chart">
              {EXAMPLE_BARS.map((b) => (
                <div className="bar-row" key={b.label}>
                  <div className="bar-label">{b.label}</div>
                  <div className="bar-track">
                    <div className={`bar-fill bar-${b.tone}`} style={{ '--pct': shown ? `${b.pct}%` : '0%' }} />
                  </div>
                  <div className="bar-value">{b.value}</div>
                </div>
              ))}
            </div>
            <div className="panel-foot">
              <div>
                <span className="foot-label">Estimated payback</span>
                <span className="foot-value">14 months</span>
              </div>
              <div>
                <span className="foot-label">Yours will be based on</span>
                <span className="foot-value">What you tick</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="reality">
        <div className="wrap reality-grid">
          <div className="reality-intro">
            <h2>Running on borrowed power</h2>
            <p>
              Generators fill the gap the grid leaves, but fuel is priced against the dollar and your business is priced in
              naira. Most people make six-figure energy decisions on gut feeling, because nobody hands them the numbers
              first.
            </p>
          </div>
          <div className="reality-stat">
            <span className="stat-figure">₦350k+</span>
            <span className="stat-label">
              what a typical small business can spend on diesel in a single month <em>(estimate, mid-size retail outlet)</em>
            </span>
          </div>
          <div className="reality-notes">
            <div className="note">
              <span className="note-mark" />
              <p>Light hours are rarely predictable enough to plan a day around.</p>
            </div>
            <div className="note">
              <span className="note-mark" />
              <p>Fuel, servicing and repairs quietly eat money that never shows up on one bill.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="how" id="how">
        <div className="wrap">
          <h2>How it works</h2>
          <div className="steps">
            <div className="step">
              <span className="step-num">1</span>
              <h3>Tick what you use</h3>
              <p>
                TV, fans, AC, fridge, office equipment, ATMs. Choose the size or type and how long it runs. We handle the
                watts and volts.
              </p>
            </div>
            <div className="step">
              <span className="step-num">2</span>
              <h3>See what it costs</h3>
              <p>
                Your daily kWh, what a generator costs per month, what each electricity band would cost you, and what solar
                would save.
              </p>
            </div>
            <div className="step">
              <span className="step-num">3</span>
              <h3>Choose how to switch</h3>
              <p>
                Buy, lease, rent, or pay monthly for energy as a service. Create a free account to save your results and
                get matched with vetted providers.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="platform" id="platform">
        <div className="wrap platform-grid">
          <div className="load-panel">
            <div className="panel-head">
              <span className="panel-title">Load profile intelligence</span>
              <span className="panel-tag">Illustrative</span>
            </div>
            <svg className="load-curve" viewBox="0 0 320 120" preserveAspectRatio="none" aria-hidden="true">
              <polyline
                points="0,95 20,92 40,70 60,55 80,40 100,30 120,26 140,24 160,26 180,32 200,42 220,58 240,72 260,84 280,90 300,93 320,94"
                fill="none" stroke="#F2A93C" strokeWidth="2.5"
              />
              <polyline
                points="0,105 20,104 40,100 60,96 80,90 100,86 120,83 140,82 160,83 180,86 200,90 220,95 240,99 260,102 280,104 300,105 320,105"
                fill="none" stroke="#33D6C0" strokeWidth="2" strokeDasharray="3 4" opacity="0.8"
              />
            </svg>
            <div className="curve-legend">
              <span><i className="dot dot-amber" />Grid + generator draw</span>
              <span><i className="dot dot-teal" />Projected with solar</span>
            </div>
          </div>

          <div className="capabilities">
            <h2>Built to answer real questions, not just show dashboards</h2>
            <ul className="cap-list">
              <li><h4>Provider matching</h4><p>Vetted installers and financiers ranked against your load, not their ad spend.</p></li>
              <li><h4>Rent, lease or pay monthly</h4><p>See every way to switch side by side before you talk to anyone.</p></li>
              <li><h4>Downtime tracking</h4><p>Log outages as they happen and watch your reliability case build itself.</p></li>
              <li><h4>Maintenance alerts</h4><p>Know when a panel, inverter or battery needs attention before it costs you a day.</p></li>
            </ul>
          </div>
        </div>
      </section>

      <section className="providers" id="providers">
        <div className="wrap providers-inner">
          <div>
            <h2>Built for installers and financiers too</h2>
            <p>
              Sunledger qualifies demand before it reaches you: real load data, real budgets, real intent. No cold
              outreach, no bidding against a discount code.
            </p>
          </div>
          <Link to="/signup?role=vendor" className="btn btn-ghost btn-on-dark">Join as a vendor</Link>
        </div>
      </section>

      <section className="final-cta">
        <div className="wrap">
          <h2>Stop guessing what your power costs you.</h2>
          <button type="button" className="btn btn-primary btn-large" onClick={() => open()}>
            Run your free assessment
          </button>
        </div>
      </section>
    </>
  );
}
