import React from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../components/ui';

// ── Architecture Diagram (SVG) ────────────────────────────────────────────────
function ArchitectureDiagram() {
  const services = [
    { x: 110, y: 30, label: 'PostgreSQL', sub: 'Database', color: '#3b82f6' },
    { x: 240, y: 30, label: 'Redis', sub: 'Cache', color: '#ef4444' },
    { x: 370, y: 30, label: 'Kafka', sub: 'Events', color: '#6366f1' },
    { x: 500, y: 30, label: 'S3 / SQS', sub: 'AWS (Local)', color: '#f59e0b' },
    { x: 630, y: 30, label: 'OpenSearch', sub: 'Search', color: '#8b5cf6' },
  ];

  return (
    <div className="relative w-full max-w-3xl mx-auto">
      <svg viewBox="0 0 740 370" className="w-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Background grid dots */}
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="0.5" fill="#e2e8f0" />
          </pattern>
        </defs>
        <rect width="740" height="370" fill="url(#grid)" rx="16" />

        {/* User / Browser — outside the K8s cluster */}
        <rect x="290" y="310" width="160" height="44" rx="10" fill="#0f172a" />
        <text x="370" y="336" textAnchor="middle" fill="white" fontSize="13" fontWeight="600">Your Browser</text>

        {/* Gateway */}
        <rect x="240" y="185" width="260" height="50" rx="10" fill="#0f172a" stroke="#3b82f6" strokeWidth="2" />
        <text x="370" y="206" textAnchor="middle" fill="white" fontSize="12" fontWeight="600">Spring Cloud Gateway</text>
        <text x="370" y="222" textAnchor="middle" fill="#94a3b8" fontSize="9">JWT Auth  ·  Rate Limit  ·  Circuit Breaker</text>

        {/* Arrow: Browser → Gateway */}
        <line x1="370" y1="310" x2="370" y2="240" stroke="#3b82f6" strokeWidth="2" markerEnd="url(#arrow)" />

        {/* Your Service */}
        <rect x="280" y="110" width="180" height="44" rx="10" fill="white" stroke="#0f172a" strokeWidth="2" />
        <text x="370" y="130" textAnchor="middle" fill="#0f172a" fontSize="12" fontWeight="700">Your Service</text>
        <text x="370" y="144" textAnchor="middle" fill="#64748b" fontSize="9">Spring Boot · Docker · K8s</text>

        {/* Arrow: Gateway → Service */}
        <line x1="370" y1="185" x2="370" y2="158" stroke="#0f172a" strokeWidth="2" markerEnd="url(#arrow)" />

        {/* Infrastructure services */}
        {services.map((s, i) => (
          <g key={i}>
            <rect x={s.x - 55} y={s.y} width="110" height="40" rx="8" fill="white" stroke={s.color} strokeWidth="1.5" />
            <circle cx={s.x - 38} cy={s.y + 20} r="4" fill={s.color} />
            <text x={s.x + 2} y={s.y + 17} textAnchor="middle" fill="#0f172a" fontSize="10" fontWeight="600">{s.label}</text>
            <text x={s.x + 2} y={s.y + 30} textAnchor="middle" fill="#94a3b8" fontSize="8">{s.sub}</text>
            {/* Arrow: Service → Infra */}
            <line x1={s.x} y1={s.y + 40} x2={370 + (s.x - 370) * 0.3} y2={110} stroke={s.color} strokeWidth="1" strokeDasharray="4 3" opacity="0.5" />
          </g>
        ))}

        {/* Keycloak (side) */}
        <rect x="545" y="185" width="130" height="50" rx="10" fill="white" stroke="#10b981" strokeWidth="1.5" />
        <text x="610" y="206" textAnchor="middle" fill="#0f172a" fontSize="10" fontWeight="600">Keycloak</text>
        <text x="610" y="220" textAnchor="middle" fill="#94a3b8" fontSize="8">OAuth2 · JWT · SSO</text>
        <line x1="500" y1="210" x2="545" y2="210" stroke="#10b981" strokeWidth="1.5" strokeDasharray="4 3" />

        {/* Grafana (side) */}
        <rect x="65" y="185" width="130" height="50" rx="10" fill="white" stroke="#f97316" strokeWidth="1.5" />
        <text x="130" y="206" textAnchor="middle" fill="#0f172a" fontSize="10" fontWeight="600">Grafana + Prometheus</text>
        <text x="130" y="220" textAnchor="middle" fill="#94a3b8" fontSize="8">Metrics · Logs · Traces</text>
        <line x1="195" y1="210" x2="240" y2="210" stroke="#f97316" strokeWidth="1.5" strokeDasharray="4 3" />

        {/* K8s cluster border */}
        <rect x="40" y="15" width="660" height="240" rx="12" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="6 4" fill="none" />
        <text x="370" y="268" textAnchor="middle" fill="#94a3b8" fontSize="9" fontWeight="500">Kubernetes Cluster (Kind · 3 nodes)</text>

        {/* Arrow marker */}
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#0f172a" />
          </marker>
        </defs>
      </svg>
    </div>
  );
}

// ── Workflow Steps ─────────────────────────────────────────────────────────────
function WorkflowDemo() {
  return (
    <div className="grid lg:grid-cols-2 gap-8 items-start">
      {/* Left: steps */}
      <div className="space-y-6">
        {[
          {
            num: '1', title: 'Start the platform',
            desc: 'One command spins up a 3-node Kubernetes cluster with 10+ services.',
            detail: 'PostgreSQL, Kafka, Redis, S3, OpenSearch, Keycloak, Grafana — all wired together.',
          },
          {
            num: '2', title: 'Create your service',
            desc: 'Pick a name, select dependencies, download a ready-to-go Spring Boot project.',
            detail: 'Database migrations, Kafka consumers, S3 clients, JWT auth — all pre-configured.',
          },
          {
            num: '3', title: 'Build & deploy',
            desc: 'Build a Docker image, deploy to the cluster. Your service runs in K8s, just like production.',
            detail: 'Connected to all infrastructure. Metrics in Grafana. Logs in Loki. Traces everywhere.',
          },
        ].map((s, i) => (
          <div key={i} className="flex gap-4">
            <div className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
              {s.num}
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">{s.title}</h3>
              <p className="text-sm text-slate-600 mt-1">{s.desc}</p>
              <p className="text-xs text-slate-500 mt-1">{s.detail}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Right: terminal */}
      <div className="bg-slate-900 rounded-2xl shadow-2xl shadow-slate-900/20 overflow-hidden">
        <div className="flex items-center gap-1.5 px-4 py-3 border-b border-slate-800">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500/80"></span>
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></span>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></span>
          <span className="text-xs text-slate-500 ml-2 font-mono">terminal</span>
        </div>
        <div className="p-5 font-mono text-[13px] leading-7">
          <p><span className="text-slate-500"># Clone and start</span></p>
          <p><span className="text-emerald-400">$</span> <span className="text-slate-300">git clone https://github.com/johnsushiarulraj/microservice-platform</span></p>
          <p><span className="text-emerald-400">$</span> <span className="text-slate-300">cd microservice-platform</span></p>
          <p><span className="text-emerald-400">$</span> <span className="text-slate-300">./scripts/start-infra.sh</span></p>
          <p className="text-emerald-400 mt-2">  All services running.</p>
          <p className="text-slate-500 mt-3"># Create and deploy a service</p>
          <p><span className="text-emerald-400">$</span> <span className="text-slate-300">unzip order-service.zip && cd order-service</span></p>
          <p><span className="text-emerald-400">$</span> <span className="text-slate-300">./scripts/build.sh 1.0.0</span></p>
          <p className="text-emerald-400 mt-2">  order-service:1.0.0 deployed to cluster</p>
          <p className="text-slate-500 mt-3"># Test it</p>
          <p><span className="text-emerald-400">$</span> <span className="text-slate-300">curl localhost:18090/order/api/items</span></p>
          <p><span className="text-cyan-300">{'  [{"id":1,"name":"Widget","status":"ACTIVE"}]'}</span></p>
        </div>
      </div>
    </div>
  );
}

// ── Comparison Table ──────────────────────────────────────────────────────────
function ComparisonTable() {
  const rows = [
    ['Set up PostgreSQL + migrations', '2-4 hours', '0 min (included)'],
    ['Configure Kafka producers/consumers', '1-2 days', '0 min (included)'],
    ['Wire S3/SQS via LocalStack', '4-8 hours', '0 min (included)'],
    ['Set up Keycloak + JWT auth', '1-2 days', '0 min (included)'],
    ['Grafana + Prometheus + Loki', '1-2 days', '0 min (included)'],
    ['API Gateway with rate limiting', '4-8 hours', '0 min (included)'],
    ['Dockerfile + K8s deployment', '4-8 hours', '0 min (included)'],
    ['Total', '1-3 weeks', '5 minutes'],
  ];
  return (
    <div className="border border-slate-200 rounded-2xl overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-100 border-b border-slate-200">
            <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Task</th>
            <th className="text-center px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Without JavaBackend</th>
            <th className="text-center px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">With JavaBackend</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map(([task, without, withJB], i) => (
            <tr key={i} className={i === rows.length - 1 ? 'bg-slate-900 text-white' : 'hover:bg-slate-100/50'}>
              <td className={`px-5 py-3 ${i === rows.length - 1 ? 'font-bold' : 'text-slate-600'}`}>{task}</td>
              <td className={`px-5 py-3 text-center ${i === rows.length - 1 ? 'text-red-300 font-bold' : 'text-red-500'}`}>{without}</td>
              <td className={`px-5 py-3 text-center ${i === rows.length - 1 ? 'text-emerald-300 font-bold' : 'text-emerald-600 font-medium'}`}>{withJB}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Main Landing ──────────────────────────────────────────────────────────────
export default function Landing() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-blue-50"></div>
        <div className="relative max-w-5xl mx-auto px-6 pt-16 pb-20 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium mb-6 ring-1 ring-blue-100">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
            Open Source — Clone and Run
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 tracking-tight leading-tight">
            Your Local<br />
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Production Backend</span>
          </h1>
          <p className="mt-6 text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            A complete microservice platform on your machine. In companies, infra teams wire everything together.
            This gives you that same setup. Create a service, build, deploy — everything else is ready.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/create"
              className="w-full sm:w-auto px-8 py-3 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/10">
              Create a Service
            </Link>
            <Link to="/tutorial"
              className="w-full sm:w-auto px-8 py-3 bg-white text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-100 transition-colors ring-1 ring-slate-200">
              View Tutorial
            </Link>
            <a href="https://github.com/johnsushiarulraj/microservice-platform" target="_blank" rel="noopener noreferrer"
              className="w-full sm:w-auto px-8 py-3 bg-white text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-100 transition-colors ring-1 ring-slate-200 flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
              GitHub
            </a>
          </div>
        </div>
      </section>

      {/* Architecture Diagram */}
      <section className="bg-slate-50 border-y border-slate-200">
        <div className="max-w-5xl mx-auto px-6 py-16">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">What's running in your cluster</h2>
            <p className="mt-3 text-slate-500">10 production services, pre-configured and connected. Your service plugs right in.</p>
          </div>
          <ArchitectureDiagram />
        </div>
      </section>

      {/* How it works — Steps + Terminal side by side */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">From zero to deployed in 5 minutes</h2>
          <p className="mt-3 text-slate-500">No Docker Compose files. No config hell. Just clone, run, deploy.</p>
        </div>
        <WorkflowDemo />
      </section>

      {/* Time saved comparison */}
      <section className="max-w-3xl mx-auto px-6 py-16">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Time you'll save</h2>
          <p className="mt-3 text-slate-500">Infrastructure that takes weeks to set up — ready in minutes.</p>
        </div>
        <ComparisonTable />
      </section>

      {/* What you get — feature cards */}
      <section className="bg-slate-50 border-y border-slate-200">
        <div className="max-w-5xl mx-auto px-6 py-20">
          <div className="text-center mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Everything you need to build microservices</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: '🗄️', title: 'Database', items: ['PostgreSQL + Liquibase', 'Redis cache', 'DynamoDB (NoSQL)', 'Connection pooling'] },
              { icon: '📨', title: 'Messaging', items: ['Kafka (Strimzi)', 'SQS queues', 'Dead letter queues', 'Event sourcing'] },
              { icon: '🔐', title: 'Security', items: ['Keycloak OAuth2', 'JWT validation', 'Role-based access', 'Google SSO'] },
              { icon: '📊', title: 'Observability', items: ['Grafana dashboards', 'Prometheus metrics', 'Loki logs', 'Distributed tracing'] },
            ].map((cat, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5">
                <div className="text-2xl mb-3">{cat.icon}</div>
                <h3 className="text-sm font-semibold text-slate-900 mb-3">{cat.title}</h3>
                <ul className="space-y-1.5">
                  {cat.items.map((item, j) => (
                    <li key={j} className="flex items-center gap-2 text-xs text-slate-600">
                      <svg className="w-3 h-3 text-emerald-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why not Docker Compose? */}
      <section className="max-w-4xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Why not Docker Compose?</h2>
          <p className="mt-3 text-slate-500 max-w-2xl mx-auto">Docker Compose is great for simple setups. But microservice development needs more than containers.</p>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {[
            {
              compose: 'Containers run on localhost ports',
              platform: 'Services run in Kubernetes with DNS, ingress, and service discovery — same as production',
              icon: 'signal',
            },
            {
              compose: 'No auth, no gateway, no rate limiting',
              platform: 'Spring Cloud Gateway with JWT auth, rate limiting, circuit breaking — built in',
              icon: 'key',
            },
            {
              compose: 'You configure each service manually',
              platform: 'Select dependencies in a UI, get a ready-to-deploy project with everything wired',
              icon: 'cube',
            },
            {
              compose: 'No metrics, no dashboards, no tracing',
              platform: 'Grafana + Prometheus + Loki pre-configured. Every service auto-reports metrics and logs',
              icon: 'chart',
            },
            {
              compose: 'Restart to apply changes, manual rebuilds',
              platform: 'One-command deploy: build, push to cluster, provision infrastructure, health check',
              icon: 'bolt',
            },
            {
              compose: 'Services don\'t survive host restart',
              platform: 'Kubernetes tracks desired state. Stop/start the cluster — all services redeploy automatically',
              icon: 'refresh',
            },
          ].map((row, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-all">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Icon name={row.icon} className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm text-red-500 line-through mb-1.5">{row.compose}</p>
                  <p className="text-sm text-slate-700 font-medium">{row.platform}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Who it's for */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Built for backend developers</h2>
        </div>
        <div className="grid sm:grid-cols-3 gap-6">
          {[
            {
              title: 'Learning microservices',
              desc: 'You want to understand how services talk to each other, how Kafka events flow, how JWT auth works. This gives you a real environment to learn in — not just theory.',
              tag: 'Students & Juniors',
            },
            {
              title: 'Building a side project',
              desc: 'You want a production-like backend without spending weeks on infrastructure. Create a service, write your logic, deploy. Everything else is handled.',
              tag: 'Indie Developers',
            },
            {
              title: 'Preparing for interviews',
              desc: 'You want to show you understand distributed systems. This is a portfolio project that demonstrates real infrastructure knowledge, not just CRUD apps.',
              tag: 'Job Seekers',
            },
          ].map((p, i) => (
            <div key={i} className="p-6 rounded-2xl border border-slate-200 hover:border-slate-300 transition-all">
              <span className="inline-block px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-[10px] font-semibold uppercase tracking-wider mb-3">{p.tag}</span>
              <h3 className="text-base font-semibold text-slate-900 mb-2">{p.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-slate-900 text-white">
        <div className="max-w-3xl mx-auto px-6 py-20 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">Ready to build?</h2>
          <p className="text-slate-400 mb-8 text-lg">Create your first microservice in minutes. No infrastructure wiring needed.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a href="http://localhost:18090/devconsole/login"
              className="w-full sm:w-auto px-8 py-3 bg-white text-slate-900 rounded-xl text-sm font-medium hover:bg-slate-100 transition-colors">
              Try it Now (localhost)
            </a>
            <Link to="/create"
              className="w-full sm:w-auto px-8 py-3 text-white rounded-xl text-sm font-medium hover:bg-slate-800 transition-colors ring-1 ring-slate-600">
              Create a Service
            </Link>
            <a href="https://github.com/johnsushiarulraj/microservice-platform" target="_blank" rel="noopener noreferrer"
              className="w-full sm:w-auto px-8 py-3 text-white rounded-xl text-sm font-medium hover:bg-slate-800 transition-colors ring-1 ring-slate-600 flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
              GitHub
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-8">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <span className="text-sm font-medium text-slate-600">JavaBackend</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-slate-500">
            <Link to="/learn" className="hover:text-slate-700 transition-colors">Documentation</Link>
            <Link to="/tutorial" className="hover:text-slate-700 transition-colors">Tutorial</Link>
            <a href="https://github.com/johnsushiarulraj/microservice-platform" className="hover:text-slate-700 transition-colors">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
