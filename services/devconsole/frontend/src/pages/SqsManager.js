import { useAuth } from '../auth';
import React, { useState, useEffect } from 'react';
import { PageHeader, Card, CardHeader, Button, Input, Badge, Alert, Spinner, EmptyState, Icon } from '../components/ui';

export default function SqsManager({ apiBase }) {
  const { authFetch } = useAuth();
  const [queues, setQueues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newQueue, setNewQueue] = useState('');
  const [selected, setSelected] = useState(null);
  const [msgBody, setMsgBody] = useState('{\n  "orderId": "123",\n  "amount": 99.99\n}');
  const [messages, setMessages] = useState([]);
  const [alert, setAlert] = useState(null);

  const load = () => {
    setLoading(true);
    authFetch(`${apiBase}/api/sqs/queues`).then(r => r.ok ? r.json() : []).then(q => { setQueues(q); setLoading(false); }).catch(() => setLoading(false));
  };
  useEffect(() => { load(); }, [apiBase]);

  const create = async () => {
    if (!newQueue.trim()) return;
    await authFetch(`${apiBase}/api/sqs/queues`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newQueue }) });
    setAlert({ type: 'success', msg: `Queue "${newQueue}" created` });
    setNewQueue('');
    load();
  };

  const remove = async (name) => {
    if (!window.confirm(`Delete queue "${name}"?`)) return;
    await authFetch(`${apiBase}/api/sqs/queues/${name}`, { method: 'DELETE' });
    if (selected === name) { setSelected(null); setMessages([]); }
    setAlert({ type: 'success', msg: `Queue "${name}" deleted` });
    load();
  };

  const send = async () => {
    if (!selected || !msgBody.trim()) return;
    const res = await authFetch(`${apiBase}/api/sqs/queues/${selected}/send`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ body: msgBody }) });
    const data = await res.json();
    setAlert({ type: 'success', msg: `Message sent (${data.messageId?.slice(0, 8)}...)` });
    load();
  };

  const receive = async () => {
    if (!selected) return;
    const res = await authFetch(`${apiBase}/api/sqs/queues/${selected}/receive?maxMessages=10`);
    const data = await res.json();
    setMessages(data);
    setAlert({ type: 'info', msg: `Received ${data.length} message(s)` });
  };

  const purge = async () => {
    if (!selected || !window.confirm(`Purge all messages from "${selected}"?`)) return;
    await authFetch(`${apiBase}/api/sqs/queues/${selected}/purge`, { method: 'POST' });
    setMessages([]);
    setAlert({ type: 'success', msg: `Queue "${selected}" purged` });
    load();
  };

  return (
    <div className="max-w-6xl">
      <PageHeader title="SQS Queues" description="Manage message queues in LocalStack" />
      {alert && <Alert variant={alert.type} onDismiss={() => setAlert(null)}>{alert.msg}</Alert>}

      <div className="grid grid-cols-5 gap-6">
        {/* Sidebar: Queue List */}
        <div className="col-span-2">
          <Card>
            <CardHeader title="Queues" subtitle={`${queues.length} queue${queues.length !== 1 ? 's' : ''}`} />
            <div className="p-4 border-b border-slate-100">
              <div className="flex gap-2">
                <Input placeholder="New queue name" value={newQueue} onChange={e => setNewQueue(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && create()} />
                <Button size="sm" onClick={create} className="flex-shrink-0"><Icon name="plus" className="w-3.5 h-3.5" /></Button>
              </div>
            </div>
            {loading ? <Spinner size="sm" /> : queues.length === 0 ? (
              <EmptyState icon="queue" title="No queues" description="Create your first queue above" />
            ) : (
              <div className="divide-y divide-slate-50">
                {queues.map(q => (
                  <div key={q.name} onClick={() => { setSelected(q.name); setMessages([]); }}
                    className={`flex items-center justify-between px-4 py-3 cursor-pointer transition-colors ${
                      selected === q.name ? 'bg-slate-50 border-l-2 border-slate-900' : 'hover:bg-slate-50/50 border-l-2 border-transparent'}`}>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-slate-900 truncate">{q.name}</div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs text-slate-400">{q.messagesAvailable || 0} available</span>
                        <span className="text-xs text-slate-400">{q.messagesInFlight || 0} in-flight</span>
                      </div>
                    </div>
                    <button onClick={e => { e.stopPropagation(); remove(q.name); }} className="text-slate-300 hover:text-red-500 transition-colors p-1">
                      <Icon name="trash" className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Main: Message Operations */}
        <div className="col-span-3">
          {selected ? (
            <div className="space-y-4">
              <Card>
                <CardHeader title={selected} subtitle="Send a message to this queue" />
                <div className="p-4">
                  <textarea value={msgBody} onChange={e => setMsgBody(e.target.value)} rows={5}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono text-slate-900 placeholder-slate-400
                      focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all resize-none" />
                  <div className="flex gap-2 mt-3">
                    <Button onClick={send}><Icon name="send" className="w-3.5 h-3.5" /> Send Message</Button>
                    <Button variant="secondary" onClick={receive}><Icon name="download" className="w-3.5 h-3.5" /> Receive</Button>
                    <Button variant="ghost" onClick={purge} className="text-red-600 hover:text-red-700 hover:bg-red-50 ml-auto">Purge Queue</Button>
                  </div>
                </div>
              </Card>

              {messages.length > 0 && (
                <Card>
                  <CardHeader title="Received Messages" subtitle={`${messages.length} message(s)`} />
                  <div className="divide-y divide-slate-50">
                    {messages.map(m => (
                      <div key={m.messageId} className="px-4 py-3">
                        <div className="flex items-center gap-2 mb-1.5">
                          <Badge variant="neutral">{m.messageId?.slice(0, 12)}...</Badge>
                        </div>
                        <pre className="text-xs font-mono text-slate-700 bg-slate-50 rounded-lg p-3 overflow-x-auto">{
                          (() => { try { return JSON.stringify(JSON.parse(m.body), null, 2); } catch { return m.body; } })()
                        }</pre>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          ) : (
            <Card className="h-full flex items-center justify-center min-h-[300px]">
              <EmptyState icon="queue" title="Select a queue" description="Choose a queue from the left to send and receive messages" />
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
