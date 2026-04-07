import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../auth';
import { PageHeader, Button, Input, Badge, Spinner, Icon } from '../components/ui';

export default function Logs({ apiBase }) {
  const { authFetch } = useAuth();
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState('');
  const [logs, setLogs] = useState('');
  const [lines, setLines] = useState(200);
  const [filter, setFilter] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [loading, setLoading] = useState(false);
  const logRef = useRef(null);
  const intervalRef = useRef(null);

  // Get service from URL query param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const svc = params.get('service');
    if (svc) setSelectedService(svc);
  }, []);

  // Load service list
  useEffect(() => {
    authFetch(`${apiBase}/api/services`).then(r => r.ok ? r.json() : [])
      .then(svcs => setServices(svcs.filter(s => s.name)))
      .catch(() => {});
  }, [apiBase, authFetch]);

  const fetchLogs = useCallback(async () => {
    if (!selectedService) return;
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/services/${selectedService}/logs?lines=${lines}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || 'No logs available.');
      } else {
        setLogs('Failed to fetch logs.');
      }
    } catch (e) {
      setLogs('Error: ' + e.message);
    }
    setLoading(false);
    // Auto-scroll to bottom
    if (logRef.current) {
      setTimeout(() => { logRef.current.scrollTop = logRef.current.scrollHeight; }, 50);
    }
  }, [apiBase, selectedService, lines]);

  // Fetch on service change
  useEffect(() => {
    if (selectedService) fetchLogs();
  }, [selectedService, fetchLogs]);

  // Auto-refresh
  useEffect(() => {
    if (autoRefresh && selectedService) {
      intervalRef.current = setInterval(fetchLogs, 5000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [autoRefresh, selectedService, fetchLogs]);

  // Filter logs
  const displayedLogs = filter
    ? logs.split('\n').filter(line => line.toLowerCase().includes(filter.toLowerCase())).join('\n')
    : logs;

  return (
    <div className="max-w-6xl">
      <PageHeader title="Logs" description="Live log viewer for deployed services" />

      {/* Controls */}
      <div className="flex items-end gap-3 mb-4">
        <div className="flex-1 max-w-xs">
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Service</label>
          <select
            value={selectedService}
            onChange={e => setSelectedService(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
          >
            <option value="">Select a service...</option>
            {services.map(svc => (
              <option key={svc.name} value={svc.name}>{svc.name}</option>
            ))}
          </select>
        </div>
        <div className="w-24">
          <Input label="Lines" type="number" min="50" max="1000" step="50" value={lines}
            onChange={e => setLines(parseInt(e.target.value) || 200)} />
        </div>
        <div className="flex-1 max-w-xs">
          <Input label="Filter" placeholder="Search logs..." value={filter}
            onChange={e => setFilter(e.target.value)} />
        </div>
        <Button variant="secondary" onClick={fetchLogs} disabled={!selectedService}>
          <Icon name="refresh" className="w-4 h-4" /> Refresh
        </Button>
        <Button variant={autoRefresh ? 'primary' : 'secondary'} onClick={() => setAutoRefresh(!autoRefresh)}
          disabled={!selectedService}>
          <Icon name="signal" className="w-4 h-4" /> {autoRefresh ? 'Stop' : 'Auto'}
        </Button>
      </div>

      {/* Status bar */}
      {selectedService && (
        <div className="flex items-center gap-3 mb-3">
          <Badge variant={autoRefresh ? 'success' : 'neutral'} dot>
            {autoRefresh ? 'Live tailing' : 'Paused'}
          </Badge>
          <span className="text-xs text-slate-400">
            {displayedLogs.split('\n').filter(l => l.trim()).length} lines
            {filter && ` (filtered from ${logs.split('\n').length})`}
          </span>
        </div>
      )}

      {/* Log output */}
      {loading && !logs ? <Spinner /> : (
        <div ref={logRef}
          className="bg-slate-900 rounded-xl overflow-auto border border-slate-800 shadow-xl"
          style={{ height: 'calc(100vh - 320px)', minHeight: '400px' }}>
          {!selectedService ? (
            <div className="flex items-center justify-center h-full text-slate-500 text-sm">
              Select a service to view logs
            </div>
          ) : (
            <pre className="p-4 text-xs font-mono text-slate-300 leading-5 whitespace-pre-wrap break-all">
              {displayedLogs || 'No logs available.'}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
