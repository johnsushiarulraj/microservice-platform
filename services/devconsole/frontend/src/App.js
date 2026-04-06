import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom';
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

const API_BASE = '/devconsole';

const PUBLIC_NAV = [
  { path: '/create', label: 'Create Service', icon: 'plus' },
  { path: '/learn', label: 'Learn', icon: 'book' },
];

const PROTECTED_NAV = [
  { path: '/', label: 'Dashboard', icon: 'home' },
  { path: '/services', label: 'Services', icon: 'server' },
  { path: '/data/sqs', label: 'SQS Queues', icon: 'queue' },
  { path: '/data/s3', label: 'S3 Storage', icon: 'folder' },
];

const INFRA_LINKS = [
  { label: 'Grafana', path: '/grafana/', color: 'bg-amber-500' },
  { label: 'Prometheus', path: '/prometheus/', color: 'bg-yellow-500' },
  { label: 'pgAdmin', path: '/pgadmin/', color: 'bg-sky-500' },
  { label: 'Kafka UI', path: '/kafka-ui/', color: 'bg-indigo-500' },
  { label: 'OpenSearch', path: '/opensearch/', color: 'bg-violet-500' },
  { label: 'DynamoDB', path: '/dynamodb/', color: 'bg-emerald-500' },
  { label: 'Keycloak', path: '/keycloak-admin/', color: 'bg-rose-500' },
];

function RequireAuth({ children }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
}

function Sidebar() {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <aside className="w-60 bg-slate-900 text-white min-h-screen flex flex-col shadow-xl">
      <div className="px-5 py-5 border-b border-slate-700/50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
            <Icon name="cube" className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-base font-semibold tracking-tight">DevConsole</h1>
            <p className="text-[10px] text-slate-400 tracking-wide uppercase">Microservice Platform</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2">Public</p>
        {PUBLIC_NAV.map(item => (
          <NavLink key={item.path} to={item.path} end={item.path === '/'}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-all duration-150 ${
                isActive ? 'bg-slate-700/70 text-white font-medium' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}>
            <Icon name={item.icon} className="w-4 h-4 flex-shrink-0" />
            {item.label}
          </NavLink>
        ))}

        {isAuthenticated && (
          <>
            <div className="pt-3 pb-1">
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2">Management</p>
            </div>
            {PROTECTED_NAV.map(item => (
              <NavLink key={item.path} to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-all duration-150 ${
                    isActive ? 'bg-slate-700/70 text-white font-medium' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                  }`}>
                <Icon name={item.icon} className="w-4 h-4 flex-shrink-0" />
                {item.label}
              </NavLink>
            ))}

            <div className="pt-3 pb-1">
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2">Infrastructure</p>
            </div>
            {INFRA_LINKS.map(link => (
              <a key={link.label} href={link.path} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2.5 px-3 py-1.5 text-[13px] text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 rounded-lg transition-all duration-150 group">
                <span className={`w-1.5 h-1.5 rounded-full ${link.color} flex-shrink-0`}></span>
                <span className="flex-1">{link.label}</span>
                <Icon name="external" className="w-3 h-3 text-slate-600 group-hover:text-slate-400" />
              </a>
            ))}
          </>
        )}
      </nav>

      {/* User section */}
      <div className="px-3 py-3 border-t border-slate-700/50">
        {isAuthenticated ? (
          <div>
            <div className="flex items-center gap-2.5 px-3 py-1.5 mb-1">
              <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-300">
                {user?.username?.[0]?.toUpperCase() || '?'}
              </div>
              <span className="text-xs text-slate-400 truncate">{user?.username}</span>
            </div>
            <NavLink to="/change-password"
              className="block px-3 py-1.5 text-[12px] text-slate-500 hover:text-slate-300 hover:bg-slate-800/60 rounded-lg transition-all">
              Change Password
            </NavLink>
            <button onClick={logout}
              className="block w-full text-left px-3 py-1.5 text-[12px] text-slate-500 hover:text-red-400 hover:bg-slate-800/60 rounded-lg transition-all">
              Sign Out
            </button>
          </div>
        ) : (
          <NavLink to="/login"
            className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors">
            Sign In
          </NavLink>
        )}
        <p className="text-[10px] text-slate-600 px-3 mt-2">v1.0.0</p>
      </div>
    </aside>
  );
}

function AppLayout() {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  if (isLoginPage) return <Login />;

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 p-8 overflow-auto">
        <Routes>
          {/* Public routes */}
          <Route path="/create" element={<CreateService apiBase={API_BASE} />} />
          <Route path="/learn/*" element={<Learn />} />

          {/* Protected routes */}
          <Route path="/" element={<RequireAuth><Dashboard apiBase={API_BASE} /></RequireAuth>} />
          <Route path="/services" element={<RequireAuth><Services apiBase={API_BASE} /></RequireAuth>} />
          <Route path="/data/sqs" element={<RequireAuth><SqsManager apiBase={API_BASE} /></RequireAuth>} />
          <Route path="/data/s3" element={<RequireAuth><S3Manager apiBase={API_BASE} /></RequireAuth>} />
          <Route path="/change-password" element={<RequireAuth><ChangePassword /></RequireAuth>} />
        </Routes>
      </main>
    </div>
  );
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
