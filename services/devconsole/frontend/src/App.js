import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, Navigate, useLocation, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth';
import { Icon } from './components/ui';
import Dashboard from './pages/Dashboard';
import Services from './pages/Services';
import CreateService from './pages/CreateService';
import SqsManager from './pages/SqsManager';
import S3Manager from './pages/S3Manager';
import Login from './pages/Login';
import ChangePassword from './pages/ChangePassword';
import Logs from './pages/Logs';

const API_BASE = '/devconsole';

const PROTECTED_NAV = [
  { path: '/dashboard', label: 'Dashboard', icon: 'home' },
  { path: '/services', label: 'Services', icon: 'server' },
  { path: '/logs', label: 'Logs', icon: 'document' },
  { path: '/data/sqs', label: 'SQS Queues', icon: 'queue' },
  { path: '/data/s3', label: 'S3 Storage', icon: 'folder' },
];

const INFRA_LINKS = [
  { label: 'Grafana', path: 'http://localhost:13000', color: 'bg-amber-500' },
  { label: 'Prometheus', path: 'http://localhost:19090', color: 'bg-yellow-500' },
  { label: 'pgAdmin', path: 'http://localhost:15050', color: 'bg-sky-500' },
  { label: 'Kafka UI', path: 'http://localhost:18002', color: 'bg-indigo-500' },
  { label: 'OpenSearch', path: 'http://localhost:15601', color: 'bg-violet-500' },
  { label: 'DynamoDB', path: 'http://localhost:18001', color: 'bg-emerald-500' },
  { label: 'Keycloak', path: 'http://localhost:18081/auth/admin/', color: 'bg-rose-500' },
];

function RequireAuth({ children }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
}

// ── Sidebar (DevConsole pages) ────────────────────────────────────────────────
function Sidebar() {
  const { user, logout } = useAuth();

  return (
    <aside className="w-60 bg-slate-900 text-white h-screen flex flex-col shadow-xl sticky top-0">
      <div className="px-5 py-4 border-b border-slate-700/50">
        <Link to="/dashboard" className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
            <Icon name="cube" className="w-3.5 h-3.5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-tight">DevConsole</h1>
            <p className="text-[9px] text-slate-400 tracking-wide uppercase">JavaBackend</p>
          </div>
        </Link>
      </div>

      <nav className="px-3 py-3 space-y-0.5">
        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-3 mb-1">Management</p>
        {PROTECTED_NAV.map(item => (
          <NavLink key={item.path} to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[13px] transition-all duration-150 ${
                isActive ? 'bg-slate-700/70 text-white font-medium' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}>
            <Icon name={item.icon} className="w-4 h-4 flex-shrink-0" />
            {item.label}
          </NavLink>
        ))}

        <div className="pt-2 pb-0.5">
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-3 mb-1">Infrastructure</p>
        </div>
        <div className="grid grid-cols-2 gap-0.5 px-1">
          {INFRA_LINKS.map(link => (
            <a key={link.label} href={link.path} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-2 py-1 text-[11px] text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 rounded-md transition-all">
              <span className={`w-1.5 h-1.5 rounded-full ${link.color} flex-shrink-0`}></span>
              {link.label}
            </a>
          ))}
        </div>
      </nav>

      <div className="flex-1"></div>

      {/* User section */}
      <div className="px-3 py-2 border-t border-slate-700/50">
        <div className="flex items-center justify-between px-2 py-1">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center text-[9px] font-bold text-slate-300">
              {user?.username?.[0]?.toUpperCase() || '?'}
            </div>
            <span className="text-xs text-slate-400 truncate">{user?.username}</span>
          </div>
          <button onClick={logout} className="text-[11px] text-slate-500 hover:text-red-400 transition-colors">
            Sign Out
          </button>
        </div>
      </div>
    </aside>
  );
}

// ── Layout ───────────────────────────────────────────────────────────────────
function ConsoleLayout() {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 p-8 overflow-auto">
        <Routes>
          <Route path="/dashboard" element={<RequireAuth><Dashboard apiBase={API_BASE} /></RequireAuth>} />
          <Route path="/services" element={<RequireAuth><Services apiBase={API_BASE} /></RequireAuth>} />
          <Route path="/create" element={<RequireAuth><CreateService apiBase={API_BASE} /></RequireAuth>} />
          <Route path="/logs" element={<RequireAuth><Logs apiBase={API_BASE} /></RequireAuth>} />
          <Route path="/data/sqs" element={<RequireAuth><SqsManager apiBase={API_BASE} /></RequireAuth>} />
          <Route path="/data/s3" element={<RequireAuth><S3Manager apiBase={API_BASE} /></RequireAuth>} />
          <Route path="/change-password" element={<RequireAuth><ChangePassword /></RequireAuth>} />
        </Routes>
      </main>
    </div>
  );
}

function AppLayout() {
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  if (location.pathname === '/login') return <Login />;
  if (location.pathname === '/' || location.pathname === '') {
    return <Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />;
  }
  return <ConsoleLayout />;
}

export default function App() {
  return (
    <Router basename="/devconsole">
      <AuthProvider>
        <AppLayout />
      </AuthProvider>
    </Router>
  );
}
