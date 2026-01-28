'use client';

import { useChat } from '@ai-sdk/react';
import { useState } from 'react';

export default function CoachPage() {
  const [goal, setGoal] = useState('');
  const [context, setContext] = useState('');

  const { messages, input, setInput, handleSubmit, isLoading } = useChat({
    body: { goal, context }
  });

  return (
    <div style={{ maxWidth: 900, margin: '24px auto', padding: 16 }}>
      <h1>AI Coach (MVP)</h1>

      <label>Goal</label>
      <input value={goal} onChange={e => setGoal(e.target.value)} style={{ width: '100%' }} />

      <label style={{ display: 'block', marginTop: 12 }}>Context (code/diff)</label>
      <textarea value={context} onChange={e => setContext(e.target.value)} rows={8} style={{ width: '100%' }} />

      <div style={{ marginTop: 16, padding: 12, border: '1px solid #ddd' }}>
        {messages.map(m => (
          <div key={m.id} style={{ whiteSpace: 'pre-wrap', marginBottom: 10 }}>
            <strong>{m.role}:</strong>{' '}
            {m.parts.map((p, i) => (p.type === 'text' ? <span key={i}>{p.text}</span> : null))}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} style={{ marginTop: 12, display: 'flex', gap: 8 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask what to improve…"
          style={{ flex: 1 }}
        />
        <button disabled={isLoading} type="submit">
          {isLoading ? '…' : 'Send'}
        </button>
      </form>
    </div>
  );
}