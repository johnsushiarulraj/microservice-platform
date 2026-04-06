import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth';
import { PageHeader, Card, CardHeader, Button, Input, Badge, Table, Alert, Spinner, EmptyState, Icon } from '../components/ui';

export default function Services({ apiBase }) {
  const { authFetch } = useAuth();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deploying, setDeploying] = useState(false);
  const [alert, setAlert] = useState(null);
  const [showDeploy, setShowDeploy] = useState(false);
  const [form, setForm] = useState({ name: '', tag: 'latest', contextPath: '' });

  const load = () => {
    setLoading(true);
    authFetch(`${apiBase}/api/services`).then(r => r.ok ? r.json() : []).then(s => { setServices(s); setLoading(false); }).catch(() => setLoading(false));
  };
  useEffect(() => { load(); }, [apiBase]);

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
        setAlert({ type: 'success', msg: `Deployed ${form.name}:${form.tag}` });
        setShowDeploy(false);
        setForm({ name: '', tag: 'latest', contextPath: '' });
        load();
      } else {
        setAlert({ type: 'error', msg: 'Deploy failed' });
      }
    } catch (err) { setAlert({ type: 'error', msg: err.message }); }
    setDeploying(false);
  };

  const destroy = async (name) => {
    if (!window.confirm(`Are you sure you want to destroy "${name}"? This will remove it from the cluster.`)) return;
    try {
      await authFetch(`${apiBase}/api/services/${name}`, { method: 'DELETE' });
      setAlert({ type: 'success', msg: `Destroyed ${name}` });
      load();
    } catch (err) { setAlert({ type: 'error', msg: err.message }); }
  };

  const restart = async (name) => {
    await authFetch(`${apiBase}/api/services/${name}/restart`, { method: 'POST' });
    setAlert({ type: 'info', msg: `Restarting ${name}...` });
  };

  return (
    <div className="max-w-5xl">
      <PageHeader title="Services" description="Manage deployed services in the cluster"
        action={<Button onClick={() => setShowDeploy(!showDeploy)}><Icon name="plus" className="w-4 h-4" /> Deploy Service</Button>} />

      {alert && <Alert variant={alert.type} onDismiss={() => setAlert(null)}>{alert.msg}</Alert>}

      {showDeploy && (
        <Card className="mb-6">
          <CardHeader title="Deploy a Service" subtitle="Pull from registry and deploy to cluster" />
          <form onSubmit={deploy} className="p-5">
            <div className="grid grid-cols-3 gap-4 mb-4">
              <Input label="Service Name" required placeholder="payment-service" value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })} />
              <Input label="Image Tag" required placeholder="1.0.0" value={form.tag}
                onChange={e => setForm({ ...form, tag: e.target.value })} />
              <Input label="Context Path" placeholder="/payment (auto)" value={form.contextPath}
                onChange={e => setForm({ ...form, contextPath: e.target.value })} />
            </div>
            <div className="flex gap-2">
              <Button type="submit" loading={deploying}>Deploy</Button>
              <Button variant="ghost" onClick={() => setShowDeploy(false)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      <Card>
        <CardHeader title="Helm Releases" subtitle={`${services.length} releases in the cluster`} action={
          <Button variant="ghost" size="sm" onClick={load}><Icon name="refresh" className="w-3.5 h-3.5" /> Refresh</Button>
        } />
        {loading ? <Spinner /> : services.length === 0 ? (
          <EmptyState icon="server" title="No services deployed" description="Deploy a service to get started" />
        ) : (
          <Table headers={['Name', 'Chart', 'Status', '']}>
            {services.map(svc => (
              <tr key={svc.name} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-5 py-3.5">
                  <span className="font-medium text-sm text-slate-900">{svc.name}</span>
                </td>
                <td className="px-5 py-3.5">
                  <span className="font-mono text-xs text-slate-500">{svc.chart}</span>
                </td>
                <td className="px-5 py-3.5">
                  <Badge variant={svc.status === 'deployed' ? 'success' : 'warning'} dot>{svc.status}</Badge>
                </td>
                <td className="px-5 py-3.5 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="sm" onClick={() => restart(svc.name)}>
                      <Icon name="refresh" className="w-3.5 h-3.5" /> Restart
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => destroy(svc.name)} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                      <Icon name="trash" className="w-3.5 h-3.5" /> Destroy
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </div>
  );
}
