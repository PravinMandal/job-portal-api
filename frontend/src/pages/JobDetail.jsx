import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../auth';
import { formatDate, formatSalary } from '../utils';

export default function JobDetail() {
  const { id } = useParams();
  const { auth } = useAuth();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [coverLetter, setCoverLetter] = useState('');
  const [applying, setApplying] = useState(false);
  const [message, setMessage] = useState('');
  const [applyError, setApplyError] = useState('');

  useEffect(() => {
    let ignore = false;
    setLoading(true);

    api(`/api/jobs/${id}`)
      .then((data) => {
        if (!ignore) setJob(data.job);
      })
      .catch((err) => {
        if (!ignore) setError(err.message);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [id]);

  async function handleApply(event) {
    event.preventDefault();
    setApplying(true);
    setApplyError('');
    setMessage('');

    try {
      await api(`/api/jobs/${id}/apply`, {
        method: 'POST',
        token: auth.token,
        body: { coverLetter },
      });
      setMessage('Application submitted. You can track it under My applications.');
      setCoverLetter('');
    } catch (err) {
      setApplyError(err.message);
    } finally {
      setApplying(false);
    }
  }

  if (loading) return <p className="empty">Loading job...</p>;
  if (error) return <p className="alert alert-error">{error}</p>;
  if (!job) return null;

  const isOwner = auth?.user.role === 'employer' && job.postedBy._id === auth.user.id;
  const canApply = auth?.user.role === 'candidate' && job.status === 'open';

  return (
    <div className="stack">
      <Link className="back-link" to="/">
        ← Back to jobs
      </Link>

      <div className="detail-layout">
        <article className="card detail-main">
          <div className="job-card-top">
            <div>
              <h1>{job.title}</h1>
              <p className="muted">
                {job.companyName} · {job.location}
              </p>
            </div>
            <span className={job.status === 'open' ? 'status status-open' : 'status status-closed'}>
              {job.status}
            </span>
          </div>

          <div className="tags">
            <span className="tag">{job.type}</span>
            {job.skills.map((skill) => (
              <span className="tag" key={skill}>
                {skill}
              </span>
            ))}
          </div>

          <h2>About the role</h2>
          <p className="description">{job.description}</p>

          {isOwner && (
            <p className="notice">
              This is your job.{' '}
              <Link to={`/jobs/${job._id}/applications`}>Review the applications</Link>.
            </p>
          )}

          {job.status === 'closed' && (
            <p className="alert alert-info">This job is closed and no longer accepts applications.</p>
          )}

          {canApply && (
            <section className="apply-box">
              <h2>Apply for this job</h2>
              <form className="stack-sm" onSubmit={handleApply}>
                <div className="field">
                  <label htmlFor="coverLetter">Cover letter (optional)</label>
                  <textarea
                    id="coverLetter"
                    rows="5"
                    maxLength="2000"
                    placeholder="Tell the employer why you are a good fit."
                    value={coverLetter}
                    onChange={(event) => setCoverLetter(event.target.value)}
                  />
                </div>
                {applyError && <p className="alert alert-error">{applyError}</p>}
                {message && <p className="alert alert-success">{message}</p>}
                <button className="btn btn-primary" type="submit" disabled={applying}>
                  {applying ? 'Submitting...' : 'Submit application'}
                </button>
              </form>
            </section>
          )}

          {!auth && job.status === 'open' && (
            <p className="notice">
              <Link to="/login">Log in</Link> as a candidate to apply for this job.
            </p>
          )}

          {auth?.user.role === 'employer' && !isOwner && (
            <p className="notice">Employers cannot apply to jobs.</p>
          )}
        </article>

        <aside className="card detail-side">
          <h2>Job details</h2>
          <dl>
            <div>
              <dt>Salary</dt>
              <dd>{formatSalary(job.salary)}</dd>
            </div>
            <div>
              <dt>Type</dt>
              <dd>{job.type}</dd>
            </div>
            <div>
              <dt>Location</dt>
              <dd>{job.location}</dd>
            </div>
            <div>
              <dt>Posted</dt>
              <dd>{formatDate(job.createdAt)}</dd>
            </div>
            <div>
              <dt>Employer</dt>
              <dd>{job.postedBy.name}</dd>
            </div>
          </dl>
        </aside>
      </div>
    </div>
  );
}
