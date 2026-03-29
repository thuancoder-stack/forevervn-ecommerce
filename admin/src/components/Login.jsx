import React, { useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { useNavigate } from 'react-router-dom'
import { Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react'
import logo from '../assets/logo.png'
import { backendUrl } from '../config'

const Login = ({ setToken }) => {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [showPw,   setShowPw]   = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!backendUrl) { toast.error('Missing VITE_BACKEND_URL in .env'); return }
    setLoading(true)
    try {
      const { data } = await axios.post(`${backendUrl}/api/user/admin/login`, {
        email: email.trim(), password,
      })
      if (!data?.success) { toast.error(data?.message || 'Login failed'); return }
      if (!data?.token)   { toast.error('Server did not return a token'); return }
      setToken(data.token)
      toast.success('Welcome back!')
      navigate('/dashboard', { replace: true })
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Playfair+Display:ital,wght@0,700;1,600&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .fv-login-root {
          font-family: 'Outfit', sans-serif;
          min-height: 100vh;
          display: flex;
          background: #eef0f5;
          align-items: center;
          justify-content: center;
          padding: 24px 16px;
        }

        /* ── floating shell ── */
        .fv-login-card {
          width: 100%;
          max-width: 980px;
          background: #fff;
          border-radius: 32px;
          box-shadow:
            0 2px 4px rgba(0,0,0,0.04),
            0 12px 40px rgba(0,0,0,0.09),
            0 0 0 1px rgba(0,0,0,0.03);
          overflow: hidden;
          display: grid;
          grid-template-columns: 1fr 1fr;
          animation: fv-fadein 0.5s cubic-bezier(.16,1,.3,1);
        }
        @keyframes fv-fadein {
          from { opacity:0; transform: translateY(18px) scale(0.98); }
          to   { opacity:1; transform: translateY(0)    scale(1); }
        }

        /* ── LEFT PANEL ── */
        .fv-panel-left {
          position: relative;
          background: #1a2035;
          padding: 52px 48px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          overflow: hidden;
          min-height: 560px;
        }

        /* decorative blobs */
        .fv-blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(60px);
          pointer-events: none;
        }
        .fv-blob-1 {
          width: 320px; height: 320px;
          background: rgba(240,98,146,0.18);
          top: -80px; right: -80px;
        }
        .fv-blob-2 {
          width: 240px; height: 240px;
          background: rgba(99,120,220,0.12);
          bottom: 40px; left: -60px;
        }
        .fv-blob-3 {
          width: 180px; height: 180px;
          background: rgba(240,98,146,0.10);
          bottom: 120px; right: 40px;
        }

        /* grid lines decoration */
        .fv-grid-lines {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
          background-size: 48px 48px;
        }

        .fv-left-content { position: relative; z-index: 2; }

        /* logo on dark */
        .fv-logo-wrap {
          display: flex; align-items: center; gap: 10px;
        }
        .fv-logo-img {
          height: 28px; width: auto; object-fit: contain;
          filter: brightness(0) invert(1);
        }
        .fv-logo-sep {
          width: 1px; height: 16px;
          background: rgba(255,255,255,0.2);
        }
        .fv-logo-tag {
          font-size: 10px; font-weight: 600;
          letter-spacing: 0.22em; text-transform: uppercase;
          color: rgba(255,255,255,0.4);
        }

        /* hero headline */
        .fv-hero {
          margin-top: 56px;
        }
        .fv-hero-eyebrow {
          display: inline-flex; align-items: center; gap: 8px;
          font-size: 10.5px; font-weight: 600; letter-spacing: 0.2em;
          text-transform: uppercase; color: #f06292;
          margin-bottom: 20px;
        }
        .fv-hero-eyebrow::before {
          content: '';
          display: block; width: 20px; height: 1.5px;
          background: #f06292; border-radius: 2px;
        }
        .fv-hero-title {
          font-family: 'Playfair Display', serif;
          font-size: 42px;
          font-weight: 700;
          line-height: 1.12;
          color: #fff;
          letter-spacing: -0.01em;
        }
        .fv-hero-title em {
          font-style: italic;
          color: rgba(255,255,255,0.55);
        }
        .fv-hero-desc {
          margin-top: 20px;
          font-size: 13.5px;
          font-weight: 400;
          line-height: 1.75;
          color: rgba(255,255,255,0.45);
          max-width: 300px;
        }

        /* feature chips */
        .fv-chips {
          position: relative; z-index: 2;
          display: flex; flex-direction: column; gap: 10px;
          margin-top: 0;
        }
        .fv-chip {
          display: flex; align-items: center; gap: 12px;
          padding: 13px 16px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 14px;
          backdrop-filter: blur(10px);
        }
        .fv-chip-dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: #f06292; flex-shrink: 0;
        }
        .fv-chip-text {
          font-size: 12.5px; font-weight: 400;
          color: rgba(255,255,255,0.6);
        }

        /* ── RIGHT PANEL ── */
        .fv-panel-right {
          padding: 52px 52px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          background: #fff;
        }

        .fv-form-header { margin-bottom: 36px; }
        .fv-form-eyebrow {
          font-size: 10.5px; font-weight: 700;
          letter-spacing: 0.2em; text-transform: uppercase;
          color: #9ca3af;
        }
        .fv-form-title {
          font-family: 'Playfair Display', serif;
          font-size: 38px; font-weight: 700;
          color: #1a2035;
          margin-top: 10px; line-height: 1.15;
          letter-spacing: -0.01em;
        }
        .fv-form-sub {
          font-size: 13.5px; color: #9ca3af;
          margin-top: 10px; line-height: 1.65;
          font-weight: 400;
        }

        /* form fields */
        .fv-field { margin-bottom: 20px; }
        .fv-label {
          display: block;
          font-size: 10.5px; font-weight: 700;
          letter-spacing: 0.18em; text-transform: uppercase;
          color: #6b7280; margin-bottom: 9px;
        }
        .fv-input-wrap {
          position: relative;
        }
        .fv-input-icon {
          position: absolute; left: 16px; top: 50%;
          transform: translateY(-50%);
          color: #c4c9d4; pointer-events: none;
          transition: color 0.2s;
        }
        .fv-input-wrap:focus-within .fv-input-icon { color: #1a2035; }
        .fv-input {
          width: 100%; height: 52px;
          padding: 0 16px 0 46px;
          border: 1.5px solid #e9ebf0;
          border-radius: 14px;
          background: #f9fafb;
          font-family: 'Outfit', sans-serif;
          font-size: 14px; font-weight: 400;
          color: #1a2035;
          outline: none;
          transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
        }
        .fv-input::placeholder { color: #b4b9c6; }
        .fv-input:focus {
          border-color: #1a2035;
          background: #fff;
          box-shadow: 0 0 0 4px rgba(26,32,53,0.07);
        }
        .fv-pw-toggle {
          position: absolute; right: 14px; top: 50%;
          transform: translateY(-50%);
          background: none; border: none; cursor: pointer;
          color: #b4b9c6; padding: 4px;
          transition: color 0.15s;
        }
        .fv-pw-toggle:hover { color: #1a2035; }
        .fv-input.pw-input { padding-right: 44px; }

        /* submit button */
        .fv-submit {
          width: 100%; height: 54px;
          border-radius: 14px;
          border: none; cursor: pointer;
          background: #1a2035;
          color: #fff;
          font-family: 'Outfit', sans-serif;
          font-size: 14px; font-weight: 700;
          letter-spacing: 0.04em;
          display: flex; align-items: center; justify-content: center; gap: 10px;
          margin-top: 28px;
          transition: background 0.2s, box-shadow 0.2s, transform 0.15s;
          box-shadow: 0 8px 24px rgba(26,32,53,0.22);
        }
        .fv-submit:hover:not(:disabled) {
          background: #252f4a;
          box-shadow: 0 12px 32px rgba(26,32,53,0.3);
          transform: translateY(-1px);
        }
        .fv-submit:active:not(:disabled) { transform: translateY(0); }
        .fv-submit:disabled { opacity: 0.6; cursor: not-allowed; }

        /* submit arrow icon circle */
        .fv-submit-arrow {
          width: 28px; height: 28px; border-radius: 50%;
          background: rgba(255,255,255,0.15);
          display: flex; align-items: center; justify-content: center;
          transition: background 0.15s;
        }
        .fv-submit:hover .fv-submit-arrow { background: rgba(255,255,255,0.25); }

        /* loading dots */
        .fv-dots span {
          display: inline-block; width: 6px; height: 6px;
          border-radius: 50%; background: #fff;
          animation: fv-bounce 1.2s ease-in-out infinite;
          margin: 0 2px;
        }
        .fv-dots span:nth-child(2) { animation-delay: 0.2s; }
        .fv-dots span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes fv-bounce {
          0%,80%,100% { transform: scale(0.7); opacity: 0.5; }
          40%          { transform: scale(1);   opacity: 1;   }
        }

        /* footer */
        .fv-footer {
          margin-top: 36px; padding-top: 20px;
          border-top: 1px solid #f3f4f6;
          font-size: 11.5px; color: #c4c9d4;
        }

        /* ── MOBILE ── */
        @media (max-width: 767px) {
          .fv-login-root { padding: 16px; align-items: flex-start; }
          .fv-login-card {
            grid-template-columns: 1fr;
            border-radius: 24px;
            max-width: 480px;
            margin: auto;
          }
          .fv-panel-left { padding: 36px 32px; min-height: auto; }
          .fv-hero { margin-top: 28px; }
          .fv-hero-title { font-size: 32px; }
          .fv-chips { margin-top: 28px; }
          .fv-panel-right { padding: 36px 32px; }
          .fv-form-title { font-size: 30px; }
          .fv-blob-1 { width: 220px; height: 220px; }
        }
      `}</style>

      <div className="fv-login-root">
        <div className="fv-login-card">

          {/* ══════ LEFT PANEL ══════ */}
          <div className="fv-panel-left">
            <div className="fv-blob fv-blob-1" />
            <div className="fv-blob fv-blob-2" />
            <div className="fv-blob fv-blob-3" />
            <div className="fv-grid-lines" />

            {/* Logo */}
            <div className="fv-left-content">
              <div className="fv-logo-wrap">
                <img src={logo} alt="Forever" className="fv-logo-img" />
                <span className="fv-logo-sep" />
                <span className="fv-logo-tag">Admin</span>
              </div>

              {/* Hero */}
              <div className="fv-hero">
                <div className="fv-hero-eyebrow">Admin Panel</div>
                <h1 className="fv-hero-title">
                  Clean control,<br />
                  <em>sharper</em> focus.
                </h1>
                <p className="fv-hero-desc">
                  Manage products, orders and store performance from one refined editorial dashboard.
                </p>
              </div>
            </div>

            {/* Feature chips */}
            <div className="fv-chips">
              {[
                'Product publishing with cleaner structure',
                'Faster inventory and order review',
                'Same backend logic, cleaner admin surface',
              ].map((t) => (
                <div key={t} className="fv-chip">
                  <span className="fv-chip-dot" />
                  <span className="fv-chip-text">{t}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ══════ RIGHT PANEL ══════ */}
          <div className="fv-panel-right">
            <div className="fv-form-header">
              <p className="fv-form-eyebrow">Secure Access</p>
              <h2 className="fv-form-title">Sign in</h2>
              <p className="fv-form-sub">
                Use your admin credentials to continue.
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Email */}
              <div className="fv-field">
                <label className="fv-label" htmlFor="fv-email">Email address</label>
                <div className="fv-input-wrap">
                  <Mail size={16} className="fv-input-icon" />
                  <input
                    id="fv-email"
                    type="email"
                    className="fv-input"
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="fv-field">
                <label className="fv-label" htmlFor="fv-password">Password</label>
                <div className="fv-input-wrap">
                  <Lock size={16} className="fv-input-icon" />
                  <input
                    id="fv-password"
                    type={showPw ? 'text' : 'password'}
                    className="fv-input pw-input"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="fv-pw-toggle"
                    onClick={() => setShowPw(p => !p)}
                    tabIndex={-1}
                    aria-label={showPw ? 'Hide password' : 'Show password'}
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button type="submit" className="fv-submit" disabled={loading}>
                {loading ? (
                  <span className="fv-dots">
                    <span /><span /><span />
                  </span>
                ) : (
                  <>
                    Sign in
                    <span className="fv-submit-arrow">
                      <ArrowRight size={14} />
                    </span>
                  </>
                )}
              </button>
            </form>

            <div className="fv-footer">
              © {new Date().getFullYear()} Forever. All rights reserved.
            </div>
          </div>

        </div>
      </div>
    </>
  )
}

export default Login