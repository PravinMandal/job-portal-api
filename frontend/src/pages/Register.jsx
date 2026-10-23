import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../auth';

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'candidate',
    companyName: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError('');

    const body = {
      name: form.name,
      email: form.email,
      password: form.password,
      role: form.role,
    };

    if (form.role === 'employer') {
      body.companyName = form.companyName;
    }

    try {
      const data = await api('/api/auth/register', { method: 'POST', body });
      login(data.token, data.user);
      navigate(data.user.role === 'employer' ? '/dashboard' : '/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-wrap">
      <form className="card auth-card" onSubmit={handleSubmit}>
        <h1>Create an account</h1>
        <p className="muted">Candidates can apply for jobs. Employers can post them.</p>

        <div className="field">
          <label htmlFor="name">Name</label>
          <input
            id="name"
            required
            maxLength="80"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
          />
        </div>

        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
          />
        </div>

        <div className="field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            minLength="6"
            required
            value={form.password}
            onChange={(event) => setForm({ ...form, password: event.target.value })}
          />
          <span className="hint">At least 6 characters.</span>
        </div>

        <div className="field">
          <label htmlFor="role">I am a</label>
          <select
            id="role"
            value={form.role}
            onChange={(event) => setForm({ ...form, role: event.target.value })}
          >
            <option value="candidate">Candidate</option>
            <option value="employer">Employer</option>
          </select>
        </div>

        {form.role === 'employer' && (
          <div className="field">
            <label htmlFor="companyName">Company name</label>
            <input
              id="companyName"
              required
              maxLength="100"
              value={form.companyName}
              onChange={(event) => setForm({ ...form, companyName: event.target.value })}
            />
          </div>
        )}

        {error && <p className="alert alert-error">{error}</p>}

        <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
          {loading ? 'Creating account...' : 'Create account'}
        </button>

        <p className="muted small">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </form>
    </div>
  );
}
