import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../auth';
import { formatDate, formatSalary } from '../utils';

export default function MyApplications() {
  const { auth } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');

  async function loadApplications() {
    setLoading(true);
    try {
      const data = await api('/api/applications/my', { token: auth.token });
      setApplications(data.applications);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadApplications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function withdraw(application) {
    if (!window.confirm(`Withdraw your application for ${application.job.title}?`)) return;

    setBusyId(application._id);
    try {
      await api(`/api/applications/${application._id}`, {
        method: 'DELETE',
        token: auth.token,
      });
      setApplications((current) => current.filter((item) => item._id !== application._id));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId('');
    }
  }

  if (loading) return <p className="empty">Loading applications...</p>;

  return (
    <div className="stack">
      <div className="page-head">
        <div>
          <p className="eyebrow">Candidate</p>
          <h1>My applications</h1>
        </div>
        <Link className="btn btn-primary" to="/">
          Find more jobs
        </Link>
      </div>

      {error && <p className="alert alert-error">{error}</p>}

      {applications.length === 0 ? (
        <p className="empty">
          You have not applied to any jobs yet. <Link to="/">Browse jobs</Link>.
        </p>
      ) : (
        <div className="stack-sm">
          {applications.map((application) => (
            <article className="card application-card" key={application._id}>
              <div className="job-card-top">
                <div>
                  <h3>
                    <Link to={`/jobs/${application.job._id}`}>{application.job.title}</Link>
                  </h3>
                  <p className="muted">
                    {application.job.companyName} · {application.job.location}
                  </p>
                </div>
                <span className={`status status-${application.status}`}>{application.status}</span>
              </div>

              <div className="meta-row">
                <span>{application.job.type}</span>
                <span>{formatSalary(application.job.salary)}</span>
                <span>Applied {formatDate(application.createdAt)}</span>
                {application.job.status === 'closed' && <span>Job closed</span>}
              </div>

              {application.coverLetter && (
                <p className="cover-letter">{application.coverLetter}</p>
              )}

              {application.status === 'applied' && (
                <button
                  className="btn btn-danger"
                  type="button"
                  disabled={busyId === application._id}
                  onClick={() => withdraw(application)}
                >
                  {busyId === application._id ? 'Withdrawing...' : 'Withdraw'}
                </button>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
