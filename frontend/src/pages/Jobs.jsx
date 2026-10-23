import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { formatDate, formatSalary, JOB_TYPES } from '../utils';

const EMPTY_FILTERS = {
  search: '',
  location: '',
  type: '',
  minSalary: '',
  sort: '-createdAt',
};

function JobCard({ job }) {
  return (
    <article className="card job-card">
      <div className="job-card-top">
        <div>
          <h3>
            <Link to={`/jobs/${job._id}`}>{job.title}</Link>
          </h3>
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
        {job.skills.slice(0, 4).map((skill) => (
          <span className="tag" key={skill}>
            {skill}
          </span>
        ))}
      </div>

      <div className="job-card-bottom">
        <strong>{formatSalary(job.salary)}</strong>
        <span className="muted">Posted {formatDate(job.createdAt)}</span>
      </div>
    </article>
  );
}

export default function Jobs() {
  const [form, setForm] = useState(EMPTY_FILTERS);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [result, setResult] = useState({ data: [], total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let ignore = false;
    setLoading(true);

    const params = new URLSearchParams({ page: String(page), limit: '9' });
    if (filters.search) params.set('search', filters.search);
    if (filters.location) params.set('location', filters.location);
    if (filters.type) params.set('type', filters.type);
    if (filters.minSalary) params.set('minSalary', filters.minSalary);
    if (filters.sort) params.set('sort', filters.sort);

    api(`/api/jobs?${params}`)
      .then((data) => {
        if (!ignore) {
          setResult(data);
          setError('');
        }
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
  }, [filters, page]);

  function handleSubmit(event) {
    event.preventDefault();
    setPage(1);
    setFilters({ ...form });
  }

  function handleReset() {
    setForm(EMPTY_FILTERS);
    setFilters(EMPTY_FILTERS);
    setPage(1);
  }

  return (
    <div className="stack">
      <section className="hero">
        <div>
          <p className="eyebrow">Find your next role</p>
          <h1>Jobs that fit what you do.</h1>
          <p className="muted">
            Search roles from employers, filter by location and type, and apply in a couple of
            clicks.
          </p>
        </div>
      </section>

      <form className="card filters" onSubmit={handleSubmit}>
        <div className="field grow">
          <label htmlFor="search">Search</label>
          <input
            id="search"
            placeholder="Job title or company"
            value={form.search}
            onChange={(event) => setForm({ ...form, search: event.target.value })}
          />
        </div>
        <div className="field">
          <label htmlFor="location">Location</label>
          <input
            id="location"
            placeholder="Kathmandu"
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
            <option value="">Any type</option>
            {JOB_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="minSalary">Min salary</label>
          <input
            id="minSalary"
            type="number"
            min="0"
            placeholder="50000"
            value={form.minSalary}
            onChange={(event) => setForm({ ...form, minSalary: event.target.value })}
          />
        </div>
        <div className="field">
          <label htmlFor="sort">Sort</label>
          <select
            id="sort"
            value={form.sort}
            onChange={(event) => setForm({ ...form, sort: event.target.value })}
          >
            <option value="-createdAt">Newest first</option>
            <option value="createdAt">Oldest first</option>
            <option value="-salary">Salary high to low</option>
            <option value="salary">Salary low to high</option>
            <option value="title">Title A to Z</option>
          </select>
        </div>
        <div className="filter-actions">
          <button className="btn btn-primary" type="submit">
            Search
          </button>
          <button className="btn btn-ghost" type="button" onClick={handleReset}>
            Reset
          </button>
        </div>
      </form>

      {error && <p className="alert alert-error">{error}</p>}
      {loading && <p className="empty">Loading jobs...</p>}

      {!loading && !error && (
        <>
          <div className="results-head">
            <h2>{result.total} roles</h2>
            <span className="muted">
              Page {result.page} of {result.pages || 1}
            </span>
          </div>

          {result.data.length === 0 ? (
            <p className="empty">No jobs matched your search. Try a broader filter.</p>
          ) : (
            <div className="job-grid">
              {result.data.map((job) => (
                <JobCard job={job} key={job._id} />
              ))}
            </div>
          )}

          {result.pages > 1 && (
            <div className="pagination">
              <button
                className="btn btn-ghost"
                type="button"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </button>
              <span className="muted">
                {page} / {result.pages}
              </span>
              <button
                className="btn btn-ghost"
                type="button"
                disabled={page >= result.pages}
                onClick={() => setPage(page + 1)}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
