import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../auth';
import { APPLICATION_STATUSES, formatDate } from '../utils';

const NEXT_STATUSES = {
  applied: ['shortlisted', 'rejected'],
  shortlisted: ['hired', 'rejected'],
  rejected: [],
  hired: [],
};

export default function JobApplications() {
  const { id } = useParams();
  const { auth } = useAuth();
  const [job, setJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');

  async function loadData() {
    setLoading(true);
    try {
      const query = statusFilter ? `?status=${statusFilter}` : '';
      const [jobData, applicationData, statsData] = await Promise.all([
        api(`/api/jobs/${id}`),
        api(`/api/jobs/${id}/applications${query}`, { token: auth.token }),
        api(`/api/jobs/${id}/stats`, { token: auth.token }),
      ]);
      setJob(jobData.job);
      setApplications(applicationData.applications);
      setStats(statsData.stats);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, statusFilter]);

  async function changeStatus(application, status) {
    setBusyId(application._id);
    try {
      await api(`/api/applications/${application._id}/status`, {
        method: 'PATCH',
        token: auth.token,
        body: { status },
      });
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId('');
    }
  }

  if (loading && !job) return <p className="empty">Loading applications...</p>;

  return (
    <div className="stack">
      <Link className="back-link" to="/dashboard">
        ← Back to dashboard
      </Link>

      {error && <p className="alert alert-error">{error}</p>}

      {job && (
        <div className="page-head">
          <div>
            <p className="eyebrow">Applications</p>
            <h1>{job.title}</h1>
            <p className="muted">
              {job.companyName} · {job.location} · {job.status}
            </p>
          </div>
          <Link className="btn btn-ghost" to={`/jobs/${job._id}`}>
            View job
          </Link>
        </div>
      )}

      {stats && (
        <div className="stat-grid">
          {APPLICATION_STATUSES.map((status) => (
            <div className="card stat" key={status}>
              <span className="muted">{status}</span>
              <strong>{stats[status]}</strong>
            </div>
          ))}
          <div className="card stat">
            <span className="muted">total</span>
            <strong>{stats.applied + stats.shortlisted + stats.rejected + stats.hired}</strong>
          </div>
        </div>
      )}

      <div className="results-head">
        <h2>{applications.length} applications</h2>
        <div className="field">
          <label htmlFor="statusFilter">Filter by status</label>
          <select
            id="statusFilter"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="">All</option>
            {APPLICATION_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading && <p className="empty">Refreshing...</p>}

      {!loading && applications.length === 0 && (
        <p className="empty">No applications in this view.</p>
      )}

      {!loading && applications.length > 0 && (
        <div className="stack-sm">
          {applications.map((application) => (
            <article className="card application-card" key={application._id}>
              <div className="job-card-top">
                <div>
                  <h3>{application.candidate.name}</h3>
                  <p className="muted">{application.candidate.email}</p>
                </div>
                <span className={`status status-${application.status}`}>{application.status}</span>
              </div>

              <p className="muted small">Applied {formatDate(application.createdAt)}</p>

              {application.coverLetter && (
                <p className="cover-letter">{application.coverLetter}</p>
              )}

              {NEXT_STATUSES[application.status].length > 0 && (
                <div className="row-actions">
                  {NEXT_STATUSES[application.status].map((status) => (
                    <button
                      className={status === 'rejected' ? 'btn btn-danger' : 'btn btn-primary'}
                      type="button"
                      key={status}
                      disabled={busyId === application._id}
                      onClick={() => changeStatus(application, status)}
                    >
                      {status === 'shortlisted' && 'Shortlist'}
                      {status === 'hired' && 'Hire'}
                      {status === 'rejected' && 'Reject'}
                    </button>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
