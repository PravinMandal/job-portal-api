export const JOB_TYPES = ['full-time', 'part-time', 'internship', 'remote'];

export const APPLICATION_STATUSES = ['applied', 'shortlisted', 'rejected', 'hired'];

export function formatSalary(value) {
  return `Rs. ${Number(value).toLocaleString('en-IN')} / month`;
}

export function formatDate(value) {
  return new Date(value).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function statusClass(status) {
  return `status status-${status}`;
}
