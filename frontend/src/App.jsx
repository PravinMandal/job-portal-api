import { Link, Navigate, NavLink, Route, Routes, useNavigate } from 'react-router-dom';
import { useAuth } from './auth';
import Jobs from './pages/Jobs';
import JobDetail from './pages/JobDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import MyApplications from './pages/MyApplications';
import Dashboard from './pages/Dashboard';
import JobApplications from './pages/JobApplications';

function RequireAuth({ role, children }) {
  const { auth } = useAuth();

  if (!auth) return <Navigate to="/login" replace />;
  if (role && auth.user.role !== role) return <Navigate to="/" replace />;
  return children;
}

function Header() {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <header className="topbar">
      <div className="container topbar-inner">
        <Link to="/" className="brand">
          Job<span>Portal</span>
        </Link>

        <nav className="nav">
          <NavLink to="/" end>
            Jobs
          </NavLink>
          {auth?.user.role === 'candidate' && <NavLink to="/applications">My applications</NavLink>}
          {auth?.user.role === 'employer' && <NavLink to="/dashboard">Dashboard</NavLink>}
        </nav>

        <div className="nav-actions">
          {auth ? (
            <>
              <span className="nav-user">{auth.user.name}</span>
              <button type="button" className="btn btn-ghost" onClick={handleLogout}>
                Log out
              </button>
            </>
          ) : (
            <>
              <Link className="btn btn-ghost" to="/login">
                Log in
              </Link>
              <Link className="btn btn-primary" to="/register">
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export default function App() {
  return (
    <>
      <Header />
      <main className="container page">
        <Routes>
          <Route path="/" element={<Jobs />} />
          <Route path="/jobs/:id" element={<JobDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/applications"
            element={
              <RequireAuth role="candidate">
                <MyApplications />
              </RequireAuth>
            }
          />
          <Route
            path="/dashboard"
            element={
              <RequireAuth role="employer">
                <Dashboard />
              </RequireAuth>
            }
          />
          <Route
            path="/jobs/:id/applications"
            element={
              <RequireAuth role="employer">
                <JobApplications />
              </RequireAuth>
            }
          />
          <Route path="*" element={<p className="empty">Page not found. Go back to <Link to="/">jobs</Link>.</p>} />
        </Routes>
      </main>
      <footer className="footer">
        <div className="container">Job Portal API — Node.js, Express, MongoDB and React</div>
      </footer>
    </>
  );
}
