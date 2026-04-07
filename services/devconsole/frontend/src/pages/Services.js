import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../auth';
import { PageHeader, Card, CardHeader, Button, Input, Badge, Alert, Spinner, Icon } from '../components/ui';

const INFRA_NAMES = new Set([
  'api-gateway', 'devconsole', 'postgres', 'redis', 'monitoring',
  'strimzi-operator', 'opensearch', 'opensearch-dashboards', 'loki', 'localstack',
]);

function isInfra(name) {
  return INFRA_NAMES.has(name) || name.startsWith('monitoring-') || name.startsWith('strimzi');
}

// ── Pod Status Indicator ──────────────────────────────────────────────────────
function PodStatusRow({ pod }) {
  const isReady = pod.ready === 'True';
  const restarts = parseInt(pod.restarts || '0', 10);
  const color = isReady && restarts < 5 ? 'emerald' : isReady && restarts >= 5 ? 'amber' : 'red';

  return (
    <div className="flex items-center justify-between text-xs py-1.5">
      <div className="flex items-center gap-2">
        <span className={`w-1.5 h-1.5 rounded-full bg-${color}-500`}></span>
        <span className="font-mono text-slate-600 truncate max-w-[200px]">{pod.name}</span>
      </div>
      <div className="flex items-center gap-3 text-slate-500">
        <span>{pod.status}</span>
        {restarts > 0 && <span className={restarts >= 5 ? 'text-amber-600 font-medium' : ''}>{restarts} restarts</span>}
      </div>
    </div>
  );
}

// ── Infrastructure Detail Panel ───────────────────────────────────────────────
function InfraDetail({ infra }) {
  if (!infra || !infra.provisionYml) return null;

  // Parse the YAML into sections to display
  const lines = infra.provisionYml.split('\n');
  const sections = [];
  let currentSection = null;

  for (const line of lines) {
    if (line.match(/^[a-z]/) && line.includes(':')) {
      const key = line.split(':')[0].trim();
      if (['database', 'kafka', 'sqs', 's3', 'dynamodb', 'opensearch', 'keycloak'].includes(key)) {
        currentSection = { name: key, items: [] };
        sections.push(currentSection);
      }
    } else if (currentSection && line.trim().startsWith('- ')) {
      currentSection.items.push(line.trim().substring(2));
    } else if (currentSection && line.trim().startsWith('name:')) {
      currentSection.items.push(line.trim().split(':')[1].trim());
    }
  }

  const SECTION_ICONS = {
    database: { icon: 'database', color: 'text-blue-600 bg-blue-50' },
    kafka: { icon: 'bolt', color: 'text-indigo-600 bg-indigo-50' },
    sqs: { icon: 'queue', color: 'text-amber-600 bg-amber-50' },
    s3: { icon: 'folder', color: 'text-emerald-600 bg-emerald-50' },
    dynamodb: { icon: 'server', color: 'text-teal-600 bg-teal-50' },
    opensearch: { icon: 'search', color: 'text-violet-600 bg-violet-50' },
    keycloak: { icon: 'key', color: 'text-rose-600 bg-rose-50' },
  };

  return (
    <div className="mt-3 pt-3 border-t border-slate-100">
      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Provisioned Infrastructure</p>
      <div className="flex flex-wrap gap-1.5">
        {sections.map(s => {
          const cfg = SECTION_ICONS[s.name] || { icon: 'cube', color: 'text-slate-600 bg-slate-50' };
          return (
            <div key={s.name} className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium ${cfg.color}`}
              title={s.items.length > 0 ? s.items.join(', ') : s.name}>
              <Icon name={cfg.icon} className="w-3 h-3" />
              <span className="capitalize">{s.name}</span>
              {s.items.length > 0 && <span className="opacity-60">({s.items.length})</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Service Card ──────────────────────────────────────────────────────────────
function ServiceCard({ svc, pods, infra, onRestart, onDestroy, onViewLogs }) {
  const isInfraService = isInfra(svc.name);
  const [expanded, setExpanded] = useState(false);

  // Determine overall health color from pods
  let statusColor = 'amber';
  if (pods && pods.length > 0) {
    const allReady = pods.every(p => p.ready === 'True');
    const anyFailed = pods.some(p => p.status === 'Failed' || p.status === 'CrashLoopBackOff');
    const highRestarts = pods.some(p => parseInt(p.restarts || '0', 10) >= 5);
    if (anyFailed) statusColor = 'red';
    else if (allReady && !highRestarts) statusColor = 'emerald';
    else statusColor = 'amber';
  } else if (svc.status === 'deployed') {
    statusColor = 'emerald';
  } else if (svc.status === 'failed') {
    statusColor = 'red';
  }

  return (
    <div className={`group rounded-xl border transition-all ${
      isInfraService ? 'border-slate-200 bg-white' : 'border-blue-200 bg-blue-50/30 ring-1 ring-blue-100'
    }`}>
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2.5">
            <div className={`w-2.5 h-2.5 rounded-full ${
              statusColor === 'emerald' ? 'bg-emerald-500' : statusColor === 'red' ? 'bg-red-500 animate-pulse' : 'bg-amber-500'
            }`}></div>
            <span className="font-semibold text-sm text-slate-900">{svc.name}</span>
          </div>
          {isInfraService ? (
            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded-full">Infrastructure</span>
          ) : (
            <span className="text-[10px] font-medium text-blue-600 uppercase tracking-wider bg-blue-100 px-2 py-0.5 rounded-full">Your Service</span>
          )}
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-500 mb-2">
          {svc.chart && <span className="font-mono">{svc.chart}</span>}
          <Badge variant={statusColor === 'emerald' ? 'success' : statusColor === 'red' ? 'error' : 'warning'} dot>{svc.status}</Badge>
          {pods && pods.length > 0 && (
            <span className="text-slate-400">
              {pods.filter(p => p.ready === 'True').length}/{pods.length} pods ready
            </span>
          )}
        </div>

        {/* Expandable pod details */}
        {pods && pods.length > 0 && expanded && (
          <div className="bg-slate-50 rounded-lg p-2.5 mb-2">
            {pods.map(pod => <PodStatusRow key={pod.name} pod={pod} />)}
          </div>
        )}

        {/* Provisioned infrastructure for user services */}
        {!isInfraService && infra && expanded && <InfraDetail infra={infra} />}

        {/* Actions */}
        <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100 mt-2">
          {pods && pods.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)}>
              <Icon name={expanded ? 'x' : 'chart'} className="w-3.5 h-3.5" /> {expanded ? 'Collapse' : 'Details'}
            </Button>
          )}
          {!isInfraService && (
            <>
              <Button variant="ghost" size="sm" onClick={() => onViewLogs(svc.name)}>
                <Icon name="document" className="w-3.5 h-3.5" /> Logs
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onRestart(svc.name)}>
                <Icon name="refresh" className="w-3.5 h-3.5" /> Restart
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onDestroy(svc.name)} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                <Icon name="trash" className="w-3.5 h-3.5" /> Destroy
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Services({ apiBase }) {
  const { authFetch } = useAuth();
  const [services, setServices] = useState([]);
  const [podData, setPodData] = useState({});
  const [infraData, setInfraData] = useState({});
  const [loading, setLoading] = useState(true);
  const [deploying, setDeploying] = useState(false);
  const [alert, setAlert] = useState(null);
  const [showDeploy, setShowDeploy] = useState(false);
  const [form, setForm] = useState({ name: '', tag: 'latest', contextPath: '' });

  const load = useCallback(() => {
    setLoading(true);
    authFetch(`${apiBase}/api/services`).then(r => r.ok ? r.json() : []).then(svcs => {
      setServices(svcs);
      setLoading(false);

      // Load pod status and infrastructure for user services
      const userSvcs = svcs.filter(s => !isInfra(s.name));
      userSvcs.forEach(svc => {
        authFetch(`${apiBase}/api/services/${svc.name}/pods`).then(r => r.ok ? r.json() : [])
          .then(pods => setPodData(prev => ({ ...prev, [svc.name]: pods })))
          .catch(() => {});

        fetch(`${apiBase}/api/services/${svc.name}/infrastructure`).then(r => r.ok ? r.json() : null)
          .then(infra => { if (infra && !infra.error) setInfraData(prev => ({ ...prev, [svc.name]: infra })); })
          .catch(() => {});
      });
    }).catch(() => setLoading(false));
  }, [apiBase, authFetch]);

  useEffect(() => { load(); }, [load]);

  const deploy = async (e) => {
    e.preventDefault();
    setDeploying(true);
    setAlert(null);
    try {
      const res = await authFetch(`${apiBase}/api/services/deploy`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, tag: form.tag, contextPath: form.contextPath || '/' + form.name.replace('-service', '') }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.error) {
          setAlert({ type: 'error', msg: data.error });
        } else {
          setAlert({ type: 'success', msg: `Deployed ${form.name}:${form.tag}` });
          setShowDeploy(false);
          setForm({ name: '', tag: 'latest', contextPath: '' });
          load();
        }
      } else {
        setAlert({ type: 'error', msg: 'Deploy failed — check service name and tag' });
      }
    } catch (err) { setAlert({ type: 'error', msg: err.message }); }
    setDeploying(false);
  };

  const destroy = async (name) => {
    const doDeprovision = window.confirm(
      `Destroy "${name}"?\n\nClick OK to remove from cluster AND deprovision infrastructure (database, queues, topics, etc.).\n\nThis is irreversible.`
    );
    if (doDeprovision === null) return; // cancel pressed via Escape — but confirm only returns bool
    try {
      await authFetch(`${apiBase}/api/services/${name}?deprovision=${doDeprovision}`, { method: 'DELETE' });
      setAlert({ type: 'success', msg: `Destroyed ${name}${doDeprovision ? ' (infrastructure deprovisioned)' : ''}` });
      load();
    } catch (err) { setAlert({ type: 'error', msg: err.message }); }
  };

  const restart = async (name) => {
    await authFetch(`${apiBase}/api/services/${name}/restart`, { method: 'POST' });
    setAlert({ type: 'info', msg: `Restarting ${name}...` });
  };

  const viewLogs = (name) => {
    window.location.href = `/devconsole/logs?service=${name}`;
  };

  const userServices = services.filter(s => !isInfra(s.name));
  const infraServices = services.filter(s => isInfra(s.name));

  return (
    <div className="max-w-5xl">
      <PageHeader title="Services" description="Manage deployed services in the cluster"
        action={<Button onClick={() => setShowDeploy(!showDeploy)}><Icon name="plus" className="w-4 h-4" /> Deploy Service</Button>} />

      {alert && <Alert variant={alert.type} onDismiss={() => setAlert(null)}>{alert.msg}</Alert>}

      {showDeploy && (
        <Card className="mb-6">
          <CardHeader title="Deploy a Service" subtitle="Enter the service name and image tag to deploy" />
          <form onSubmit={deploy} className="p-5">
            <div className="grid grid-cols-3 gap-4 mb-4">
              <Input label="Service Name" required placeholder="order-service" value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })} />
              <Input label="Image Tag" required placeholder="1.0.0" value={form.tag}
                onChange={e => setForm({ ...form, tag: e.target.value })} />
              <Input label="Context Path" placeholder="/order (auto)" value={form.contextPath}
                onChange={e => setForm({ ...form, contextPath: e.target.value })} />
            </div>
            <div className="flex items-center gap-3">
              <Button type="submit" loading={deploying}>Deploy</Button>
              <Button variant="ghost" onClick={() => setShowDeploy(false)}>Cancel</Button>
              <span className="text-xs text-slate-400 ml-2">Image must be loaded into Kind first: <code className="bg-slate-100 px-1.5 py-0.5 rounded">kind load docker-image name:tag --name template-local</code></span>
            </div>
          </form>
        </Card>
      )}

      {loading ? <Spinner /> : (
        <>
          {/* User services */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Your Services</h3>
              <Button variant="ghost" size="sm" onClick={load}><Icon name="refresh" className="w-3.5 h-3.5" /> Refresh</Button>
            </div>
            {userServices.length === 0 ? (
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center">
                <Icon name="plus" className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-500 mb-1">No services deployed yet</p>
                <p className="text-xs text-slate-400 mb-4">Create a service, build it, then deploy here</p>
                <a href="/devconsole/create" className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-medium hover:bg-slate-800 transition-colors">
                  <Icon name="plus" className="w-3.5 h-3.5" /> Create a Service
                </a>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {userServices.map(svc => (
                  <ServiceCard key={svc.name} svc={svc}
                    pods={podData[svc.name]}
                    infra={infraData[svc.name]}
                    onRestart={restart} onDestroy={destroy} onViewLogs={viewLogs} />
                ))}
              </div>
            )}
          </div>

          {/* Infrastructure services */}
          <div>
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Infrastructure ({infraServices.length})</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {infraServices.map(svc => (
                <ServiceCard key={svc.name} svc={svc} pods={null} infra={null}
                  onRestart={restart} onDestroy={destroy} onViewLogs={viewLogs} />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
