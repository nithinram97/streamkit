import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';

export default function Login() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode]     = useState('login');
  const [form, setForm]     = useState({ email:'', password:'', name:'' });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    if (!form.email || !form.password) { setError('Please fill all fields.'); return; }
    if (mode === 'register' && !form.name) { setError('Name is required.'); return; }
    setLoading(true); setError('');
    try {
      if (mode === 'login') await login(form.email, form.password);
      else await register(form.email, form.password, form.name);
      navigate('/');
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">Stream<span>Kit</span></div>
        <div className="auth-sub">Free movies, no subscription needed</div>
        <h2 className="auth-title">{mode === 'login' ? 'Welcome back' : 'Create account'}</h2>

        {mode === 'register' && (
          <div className="form-field">
            <label className="form-label">Name</label>
            <input className="form-input" type="text" placeholder="Your name" value={form.name} onChange={set('name')} />
          </div>
        )}
        <div className="form-field">
          <label className="form-label">Email</label>
          <input className="form-input" type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} onKeyDown={e => e.key==='Enter' && submit()} />
        </div>
        <div className="form-field">
          <label className="form-label">Password</label>
          <input className="form-input" type="password" placeholder="••••••••" value={form.password} onChange={set('password')} onKeyDown={e => e.key==='Enter' && submit()} />
        </div>

        {error && <div className="error-msg">{error}</div>}

        <button className="btn btn-primary" style={{ width:'100%', marginTop:20, padding:13 }} onClick={submit} disabled={loading}>
          {loading ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}
        </button>

        <div className="auth-toggle">
          {mode === 'login'
            ? <>New here? <span onClick={() => setMode('register')}>Create account</span></>
            : <>Already have an account? <span onClick={() => setMode('login')}>Sign in</span></>
          }
        </div>
      </div>
    </div>
  );
}
