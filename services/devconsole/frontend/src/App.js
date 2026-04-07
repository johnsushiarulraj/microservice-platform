import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, Navigate, useLocation, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth';
import { Icon } from './components/ui';
import Dashboard from './pages/Dashboard';
import Services from './pages/Services';
import CreateService from './pages/CreateService';
import SqsManager from './pages/SqsManager';
import S3Manager from './pages/S3Manager';
import Learn from './pages/Learn';
import Login from './pages/Login';
import ChangePassword from './pages/ChangePassword';
import Landing from './pages/Landing';
import Tutorial from './pages/Tutorial';
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

// ── Top Navigation (public pages) ─────────────────────────────────────────────
function TopNav() {
  const { isAuthenticated } = useAuth();

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-200/80">
      <div className="max-w-5xl mx-auto px-6 flex items-center justify-between h-14">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-slate-900">JavaBackend</span>
        </Link>

        <nav className="hidden sm:flex items-center gap-1">
          <NavLink to="/create" className={({ isActive }) =>
            `px-3 py-1.5 rounded-lg text-sm transition-colors ${isActive ? 'bg-slate-100 text-slate-900 font-medium' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`
          }>Create</NavLink>
          <NavLink to="/learn" className={({ isActive }) =>
            `px-3 py-1.5 rounded-lg text-sm transition-colors ${isActive ? 'bg-slate-100 text-slate-900 font-medium' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`
          }>Learn</NavLink>
          <NavLink to="/tutorial" className={({ isActive }) =>
            `px-3 py-1.5 rounded-lg text-sm transition-colors ${isActive ? 'bg-slate-100 text-slate-900 font-medium' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`
          }>Tutorial</NavLink>
        </nav>

        <div className="flex items-center gap-2">
          <a href="https://github.com/johnsushiarulraj/microservice-platform" target="_blank" rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
            GitHub
          </a>
        </div>
      </div>
    </header>
  );
}

// ── Sidebar (DevConsole pages) ────────────────────────────────────────────────
function Sidebar() {
  const { user, logout } = useAuth();

  return (
    <aside className="w-60 bg-slate-900 text-white h-screen flex flex-col shadow-xl sticky top-0">
      <div className="px-5 py-4 border-b border-slate-700/50">
        <Link to="/" className="flex items-center gap-2.5">
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

      {/* User section — always at bottom */}
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

// ── Layouts ───────────────────────────────────────────────────────────────────
function PublicLayout() {
  return (
    <div className="min-h-screen bg-white">
      <TopNav />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/create" element={<CreateService apiBase={API_BASE} />} />
        <Route path="/learn/*" element={<Learn />} />
        <Route path="/tutorial" element={<Tutorial />} />
      </Routes>
    </div>
  );
}

function ConsoleLayout() {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 p-8 overflow-auto">
        <Routes>
          <Route path="/dashboard" element={<RequireAuth><Dashboard apiBase={API_BASE} /></RequireAuth>} />
          <Route path="/services" element={<RequireAuth><Services apiBase={API_BASE} /></RequireAuth>} />
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
  const isLoginPage = location.pathname === '/login';
  const isConsolePage = ['/dashboard', '/services', '/logs', '/data/sqs', '/data/s3', '/change-password'].some(p => location.pathname.startsWith(p));

  if (isLoginPage) return <Login />;
  if (isConsolePage) return <ConsoleLayout />;
  return <PublicLayout />;
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
