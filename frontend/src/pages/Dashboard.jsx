import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../auth';
import { formatSalary, JOB_TYPES } from '../utils';

const EMPTY_FORM = {
  title: '',
  description: '',
  location: '',
  type: 'full-time',
  salary: '',
  skills: '',
};

export default function Dashboard() {
  const { auth } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState('');

  async function loadJobs() {
    setLoading(true);
    try {
      const data = await api('/api/jobs?limit=100&sort=-createdAt');
      setJobs(data.data.filter((job) => job.postedBy._id === auth.user.id));
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function createJob(event) {
    event.preventDefault();
    setSaving(true);
    setError('');

    try {
      await api('/api/jobs', {
        method: 'POST',
        token: auth.token,
        body: {
          title: form.title,
          description: form.description,
          location: form.location,
          type: form.type,
          salary: Number(form.salary),
          skills: form.skills
            .split(',')
            .map((skill) => skill.trim())
            .filter(Boolean),
        },
      });
      setForm(EMPTY_FORM);
      setShowForm(false);
      await loadJobs();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function closeJob(job) {
    setBusyId(job._id);
    try {
      await api(`/api/jobs/${job._id}/close`, { method: 'PATCH', token: auth.token });
      await loadJobs();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId('');
    }
  }

  async function deleteJob(job) {
    if (!window.confirm(`Delete "${job.title}"? Its applications will be deleted too.`)) return;

    setBusyId(job._id);
    try {
      await api(`/api/jobs/${job._id}`, { method: 'DELETE', token: auth.token });
      setJobs((current) => current.filter((item) => item._id !== job._id));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId('');
    }
  }

  return (
    <div className="stack">
      <div className="page-head">
        <div>
          <p className="eyebrow">Employer</p>
          <h1>Dashboard</h1>
          <p className="muted">{auth.user.companyName}</p>
        </div>
        <button className="btn btn-primary" type="button" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'Post a job'}
        </button>
      </div>

      {error && <p className="alert alert-error">{error}</p>}

      {showForm && (
        <form className="card stack-sm" onSubmit={createJob}>
          <h2>New job</h2>

          <div className="field">
            <label htmlFor="title">Title</label>
            <input
              id="title"
              required
              maxLength="100"
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
            />
          </div>

          <div className="field">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              rows="5"
              required
              maxLength="5000"
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
            />
          </div>

          <div className="form-row">
            <div className="field grow">
              <label htmlFor="location">Location</label>
              <input
                id="location"
                required
                maxLength="100"
                value={form.location}
                onChange={(event) => setForm({ ...form, location: event.target.value })}
              />
            </div>
            <div className="field">
              <label htmlFor="type">Type</label>
              <select
                id="type"
                value={form.type}
                onChange={(event) => setForm({ ...form, type: event.target.value })}
              >
                {JOB_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="salary">Salary per month</label>
              <input
                id="salary"
                type="number"
                min="1"
                required
                value={form.salary}
                onChange={(event) => setForm({ ...form, salary: event.target.value })}
              />
            </div>
          </div>

          <div className="field">
            <label htmlFor="skills">Skills</label>
            <input
              id="skills"
              placeholder="Node.js, MongoDB, Express"
              value={form.skills}
              onChange={(event) => setForm({ ...form, skills: event.target.value })}
            />
            <span className="hint">Separate skills with commas.</span>
          </div>

          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? 'Posting...' : 'Post job'}
          </button>
        </form>
      )}

      {loading && <p className="empty">Loading your jobs...</p>}

      {!loading && jobs.length === 0 && (
        <p className="empty">You have not posted any jobs yet. Use the button above to add one.</p>
      )}

      {!loading && jobs.length > 0 && (
        <div className="stack-sm">
          {jobs.map((job) => (
            <article className="card job-row" key={job._id}>
              <div>
                <div className="job-card-top">
                  <div>
                    <h3>
                      <Link to={`/jobs/${job._id}`}>{job.title}</Link>
                    </h3>
                    <p className="muted">
                      {job.location} · {job.type} · {formatSalary(job.salary)}
                    </p>
                  </div>
                  <span className={job.status === 'open' ? 'status status-open' : 'status status-closed'}>
                    {job.status}
                  </span>
                </div>
              </div>

              <div className="row-actions">
                <Link className="btn btn-ghost" to={`/jobs/${job._id}/applications`}>
                  Applications
                </Link>
                {job.status === 'open' && (
                  <button
                    className="btn btn-ghost"
                    type="button"
                    disabled={busyId === job._id}
                    onClick={() => closeJob(job)}
                  >
                    Close
                  </button>
                )}
                <button
                  className="btn btn-danger"
                  type="button"
                  disabled={busyId === job._id}
                  onClick={() => deleteJob(job)}
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
