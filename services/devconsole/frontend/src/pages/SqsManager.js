import React, { useState, useEffect } from 'react';

export default function SqsManager({ apiBase }) {
  const [queues, setQueues] = useState([]);
  const [newQueue, setNewQueue] = useState('');
  const [selectedQueue, setSelectedQueue] = useState(null);
  const [messageBody, setMessageBody] = useState('');
  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState('');

  const loadQueues = () => {
    fetch(`${apiBase}/api/sqs/queues`).then(r => r.json()).then(setQueues).catch(() => {});
  };

  useEffect(() => { loadQueues(); }, [apiBase]);

  const createQueue = async () => {
    if (!newQueue) return;
    await fetch(`${apiBase}/api/sqs/queues`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newQueue }),
    });
    setNewQueue('');
    setStatus(`Queue "${newQueue}" created`);
    loadQueues();
  };

  const deleteQueue = async (name) => {
    if (!window.confirm(`Delete queue "${name}"?`)) return;
    await fetch(`${apiBase}/api/sqs/queues/${name}`, { method: 'DELETE' });
    setStatus(`Queue "${name}" deleted`);
    if (selectedQueue === name) setSelectedQueue(null);
    loadQueues();
  };

  const sendMessage = async () => {
    if (!selectedQueue || !messageBody) return;
    const res = await fetch(`${apiBase}/api/sqs/queues/${selectedQueue}/send`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: messageBody }),
    });
    const data = await res.json();
    setStatus(`Message sent (ID: ${data.messageId})`);
    setMessageBody('');
    loadQueues();
  };

  const receiveMessages = async () => {
    if (!selectedQueue) return;
    const res = await fetch(`${apiBase}/api/sqs/queues/${selectedQueue}/receive?maxMessages=10`);
    const data = await res.json();
    setMessages(data);
    setStatus(`Received ${data.length} message(s)`);
  };

  const purgeQueue = async () => {
    if (!selectedQueue || !window.confirm(`Purge all messages from "${selectedQueue}"?`)) return;
    await fetch(`${apiBase}/api/sqs/queues/${selectedQueue}/purge`, { method: 'POST' });
    setStatus(`Queue "${selectedQueue}" purged`);
    setMessages([]);
    loadQueues();
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">SQS Manager</h2>

      {status && <div className="mb-4 p-3 bg-blue-50 text-blue-700 rounded text-sm">{status}</div>}

      <div className="grid grid-cols-2 gap-6">
        {/* Left: Queue List */}
        <div>
          <div className="bg-white rounded-lg shadow p-4 mb-4">
            <h3 className="font-semibold mb-3">Queues</h3>
            <div className="flex gap-2 mb-3">
              <input type="text" placeholder="Queue name" value={newQueue}
                onChange={e => setNewQueue(e.target.value)}
                className="border rounded px-3 py-1.5 text-sm flex-1"
                onKeyDown={e => e.key === 'Enter' && createQueue()} />
              <button onClick={createQueue} className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm">Create</button>
            </div>
            <div className="space-y-1">
              {queues.map(q => (
                <div key={q.name}
                  className={`flex items-center justify-between p-2 rounded cursor-pointer text-sm ${selectedQueue === q.name ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'}`}
                  onClick={() => setSelectedQueue(q.name)}>
                  <div>
                    <div className="font-medium">{q.name}</div>
                    <div className="text-xs text-gray-500">{q.messagesAvailable} msgs / {q.messagesInFlight} in-flight</div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); deleteQueue(q.name); }}
                    className="text-red-500 text-xs hover:underline">Delete</button>
                </div>
              ))}
              {queues.length === 0 && <div className="text-sm text-gray-400">No queues</div>}
            </div>
          </div>
        </div>

        {/* Right: Message Operations */}
        <div>
          {selectedQueue ? (
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-semibold mb-3">{selectedQueue}</h3>

              <div className="mb-4">
                <label className="block text-sm text-gray-600 mb-1">Send Message</label>
                <textarea value={messageBody} onChange={e => setMessageBody(e.target.value)}
                  placeholder='{"orderId": "123", "amount": 99.99}'
                  className="border rounded px-3 py-2 text-sm w-full h-24 font-mono" />
                <button onClick={sendMessage}
                  className="bg-green-600 text-white px-3 py-1.5 rounded text-sm mt-2">Send</button>
              </div>

              <div className="flex gap-2 mb-3">
                <button onClick={receiveMessages}
                  className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm">Receive Messages</button>
                <button onClick={purgeQueue}
                  className="bg-red-500 text-white px-3 py-1.5 rounded text-sm">Purge</button>
              </div>

              {messages.length > 0 && (
                <div className="space-y-2">
                  {messages.map(m => (
                    <div key={m.messageId} className="bg-gray-50 p-2 rounded text-xs font-mono">
                      <div className="text-gray-500 mb-1">ID: {m.messageId}</div>
                      <div>{m.body}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm text-gray-400 mt-10 text-center">Select a queue to manage messages</div>
          )}
        </div>
      </div>
    </div>
  );
}
