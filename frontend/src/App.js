import React, { useEffect, useRef, useState } from 'react';
import './App.css';
import { demoReply, topics, articles } from './content';

export function Icon({ name, size = 20 }) {
  const paths = {
    spark: 'm12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z',
    chat: 'M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7A8.4 8.4 0 0 1 4 11.5a8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5Z',
    book: 'M3 3h6a3 3 0 0 1 3 3v15a3 3 0 0 0-3-3H3V3Zm9 3a3 3 0 0 1 3-3h6v15h-6a3 3 0 0 0-3 3',
    arrow: 'M7 17 17 7M7 7h10v10', send: 'm5 12 7-7 7 7M12 5v14', plus: 'M12 5v14M5 12h14',
    box: 'm3 7 9-4 9 4-9 4-9-4Zm0 0v10l9 4 9-4V7M12 11v10M7.5 5l9 4',
    return: 'M9 4 4 9l5 5M4 9h9a6 6 0 0 1 0 12h-2', person: 'M20 21v-2a8 8 0 0 0-16 0v2M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z',
    download: 'M12 3v12m-5-5 5 5 5-5M5 16v5h14v-5', moon: 'M21 13a9 9 0 0 1-10-10 9 9 0 1 0 10 10Z',
    sun: 'M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1 1m12 12 1 1M5 19l1-1M18 6l1-1M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z',
    close: 'm6 6 12 12M6 18 18 6', shield: 'm12 3 8 4v5c0 5-8 9-8 9s-8-4-8-9V7l8-4Z',
    search: 'M21 21l-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z', clock: 'M12 8v4l3 2M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z',
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name] || paths.spark} /></svg>;
}
const greeting = () => ({ role: 'model', text: 'Hi there! I’m Assistly, your support companion. Let’s make your day a little easier. What can I help you with?', time: new Date().toISOString() });
const read = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
const save = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* Chat remains usable without storage. */ } };
const API = process.env.REACT_APP_API_URL || '';

export default function App() {
  const [messages, setMessages] = useState(() => {
    const stored = read('assistly.messages', []);
    return Array.isArray(stored) && stored.length && stored.every(m => ['user', 'model'].includes(m.role) && typeof m.text === 'string' && !isNaN(Date.parse(m.time))) ? stored.slice(-60) : [greeting()];
  });
  const [theme, setTheme] = useState(() => read('assistly.theme', 'light') === 'dark' ? 'dark' : 'light');
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [page, setPage] = useState('chat');
  const [mode, setMode] = useState('demo');
  const [notice, setNotice] = useState('');
  const [search, setSearch] = useState('');
  const [article, setArticle] = useState(null);
  const [project, setProject] = useState(false);
  const end = useRef(null), composer = useRef(null), locked = useRef(false), dialog = useRef(null), previousFocus = useRef(null);
  useEffect(() => { document.documentElement.dataset.theme = theme; save('assistly.theme', theme); }, [theme]);
  useEffect(() => { save('assistly.messages', messages); }, [messages]);
  useEffect(() => { if (messages.length > 1 || busy) end.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, [messages, busy]);
  useEffect(() => {
    if (window.__ASSISTLY_PREVIEW__ || window.location.protocol === 'file:') return;
    const controller = new AbortController(), timeout = setTimeout(() => controller.abort(), 4000);
    fetch(`${API}/api/health`, { signal: controller.signal }).then(r => r.ok ? r.json() : null).then(data => { if (data?.mode === 'live') setMode('live'); }).catch(() => {}).finally(() => clearTimeout(timeout));
    return () => { clearTimeout(timeout); controller.abort(); };
  }, []);
  useEffect(() => {
    if (!article && !project) return;
    previousFocus.current = document.activeElement; dialog.current?.focus();
    const keydown = event => {
      if (event.key === 'Escape') { setArticle(null); setProject(false); }
      if (event.key === 'Tab') {
        const nodes = dialog.current?.querySelectorAll('button, a[href], input, [tabindex="0"]');
        if (!nodes?.length) return;
        const first = nodes[0], last = nodes[nodes.length - 1];
        if (event.shiftKey && [first, dialog.current].includes(document.activeElement)) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && [last, dialog.current].includes(document.activeElement)) { event.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', keydown);
    return () => { document.removeEventListener('keydown', keydown); previousFocus.current?.focus(); };
  }, [article, project]);
  async function send(text = input, retry = false) {
    text = text.trim();
    if (!text || locked.current) return;
    locked.current = true; setBusy(true); setNotice(''); setPage('chat'); setInput('');
    const history = messages.slice(1, retry ? -1 : undefined).slice(-20).map(m => ({ role: m.role, text: m.text }));
    if (!retry) setMessages(prev => [...prev, { role: 'user', text, time: new Date().toISOString() }]);
    try {
      let answer;
      if (mode === 'live') {
        const controller = new AbortController(), timeout = setTimeout(() => controller.abort(), 35000);
        try {
          const res = await fetch(`${API}/api/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: text, history }), signal: controller.signal });
          const data = await res.json();
          if (!res.ok || typeof data.response !== 'string' || !data.response.trim()) throw new Error('unavailable');
          answer = data.response;
        } finally { clearTimeout(timeout); }
      } else { await new Promise(resolve => setTimeout(resolve, 550)); answer = demoReply(text, history); }
      setMessages(prev => [...prev, { role: 'model', text: answer, time: new Date().toISOString() }]);
    } catch { setNotice('The AI service is unavailable. Your message is saved. Try again, or continue in sample demo mode.'); }
    finally { setBusy(false); locked.current = false; composer.current?.focus(); }
  }
  function exportChat() {
    const transcript = `ASSISTLY • ${mode === 'demo' ? 'SAMPLE DEMO' : 'AI SUPPORT'}\nExported ${new Date().toLocaleString()}\n\n` + messages.map(m => `${m.role === 'user' ? 'You' : 'Assistly'} • ${new Date(m.time).toLocaleTimeString()}\n${m.text}`).join('\n\n');
    const url = URL.createObjectURL(new Blob([transcript], { type: 'text/plain;charset=utf-8' }));
    const a = document.createElement('a'); a.href = url; a.download = 'assistly-conversation.txt'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const starters = [{ icon: 'box', label: 'Track an order', text: 'Track my order' }, { icon: 'return', label: 'Returns & refunds', text: 'What is your return policy?' }, { icon: 'person', label: 'Talk to support', text: 'I need to speak to a human' }];
  const filtered = articles.filter(a => `${a.title} ${a.body}`.toLowerCase().includes(search.toLowerCase()));
  return <div className="app-shell">
    <aside className="sidebar" aria-label="Workspace navigation">
      <a className="brand" href="#chat" onClick={() => setPage('chat')}><span className="brand-icon"><Icon name="spark" size={23} /></span>assistly<span className="brand-period">.</span></a>
      <div className="workspace-label">YOUR SUPPORT SPACE</div>
      <nav aria-label="Main navigation"><button className={`nav-item ${page === 'chat' ? 'active' : ''}`} onClick={() => setPage('chat')}><Icon name="chat" />AI assistant <span className="nav-count">1</span></button><button className={`nav-item ${page === 'help' ? 'active' : ''}`} onClick={() => setPage('help')}><Icon name="book" />Help center <Icon name="arrow" size={16} /></button></nav>
      <button className="new-chat" disabled={busy || messages.length === 1} onClick={() => { setMessages([greeting()]); setNotice(''); setPage('chat'); composer.current?.focus(); }}><Icon name="plus" size={18} />New conversation</button>
      <div className="sidebar-bottom"><div className="demo-card"><span className="eyebrow"><span className="dot" />PORTFOLIO PROJECT</span><h3>Small details.<br />Better support.</h3><p>A thoughtful customer experience, built for the web.</p><button onClick={() => setProject(true)}>Explore the project <Icon name="arrow" size={16} /></button></div><div className="workspace-owner"><div className="owner-avatar">A</div><div><strong>Assistly workspace</strong><span>Customer experience demo</span></div></div></div>
    </aside>
    <div className="main-shell">
      <header className="topbar"><div className="breadcrumb">Workspace <span>/</span> <strong>{page === 'chat' ? 'AI assistant' : 'Help center'}</strong></div><div className="top-actions"><span className="mode-pill"><span className="dot" />{mode === 'demo' ? 'Sample demo' : 'AI configured'}</span><button className="icon-button" aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`} onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}><Icon name={theme === 'light' ? 'moon' : 'sun'} /></button><span className="top-avatar">JD</span></div></header>
      <main className="content-layout">
        <section className="primary-content"><div className="page-heading"><div className="eyebrow">A LITTLE HELP GOES A LONG WAY</div><h1>{page === 'chat' ? <>Support, made <em>simple.</em></> : <>Answers, within <em>reach.</em></>}</h1><p>{page === 'chat' ? 'Good questions deserve great answers. Let’s find yours.' : 'A few helpful reads to get you on your way.'}</p></div>
          {page === 'chat' ? <section className="chat-card" aria-label="Support conversation">
            <div className="chat-header"><div className="assistant-avatar"><Icon name="spark" size={23} /><span /></div><div className="assistant-title"><h2>Assistly assistant <span>AI</span></h2><p>{mode === 'demo' ? 'Here to help · Sample support experience' : 'Here to help · Powered by Gemini'}</p></div><button className="icon-button mobile-reset" aria-label="Start a new conversation" disabled={busy || messages.length === 1} onClick={() => { setMessages([greeting()]); setNotice(''); }}><Icon name="plus" size={18} /></button><button className="icon-button" aria-label="Download conversation" onClick={exportChat}><Icon name="download" size={19} /></button></div>
            <div className="chat-scroll" role="log" aria-label="Messages" aria-live="polite" aria-relevant="additions"><div className="date-divider"><span>YOUR CONVERSATION</span></div>
              {messages.map((m, i) => <div key={i} className={`message-row ${m.role === 'user' ? 'user-message' : ''}`}>{m.role === 'model' && <div className="message-avatar"><Icon name="spark" size={16} /></div>}<div className="message-content"><div className="message-meta">{m.role === 'user' ? 'You' : 'Assistly'}<time dateTime={m.time}>{new Date(m.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time></div><div className="message-bubble">{m.text}</div></div></div>)}
              {messages.length === 1 && <div className="starter-section"><p>Not sure where to start? Try one of these.</p><div className="starter-grid">{starters.map(s => <button key={s.label} disabled={busy} onClick={() => send(s.text)}><Icon name={s.icon} size={22} /><span>{s.label}</span><Icon name="arrow" size={15} /></button>)}</div><div className="welcome-note"><Icon name="shield" size={15} />A friendly space for every question.</div></div>}
              {busy && <div className="typing" role="status"><span /><span /><span /><span className="sr-only">Assistly is thinking</span></div>}<div ref={end} /></div>
            {notice && <div className="error-notice" role="alert">{notice}<div><button onClick={() => send(messages.filter(m => m.role === 'user').at(-1)?.text || '', true)}>Try again</button><button onClick={() => { setMode('demo'); setNotice(''); }}>Use sample demo</button></div></div>}
            <div className="composer-area">{messages.length > 1 && <div className="followups">{starters.map(s => <button key={s.label} onClick={() => send(s.text)} disabled={busy}>{s.label}</button>)}</div>}<form className="composer" onSubmit={e => { e.preventDefault(); send(); }}><label htmlFor="message" className="sr-only">Your message</label><input ref={composer} id="message" placeholder="Ask a question. We’re all ears." value={input} onChange={e => setInput(e.target.value)} maxLength={2000} disabled={busy} autoComplete="off" /><button type="submit" aria-label="Send message" disabled={busy || !input.trim()}><Icon name="send" size={19} /></button></form><div className="composer-caption"><span><Icon name="spark" size={12} />{mode === 'demo' ? 'Sample replies · No real orders or agent transfers' : 'AI replies may be inaccurate. Verify important details.'}</span><span>Enter to send</span></div></div>
          </section> : <section className="help-card"><label className="search-field"><Icon name="search" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search sample help articles" aria-label="Search help articles" /></label><div className="article-list">{filtered.map(a => <button key={a.title} onClick={() => setArticle(a)}><span><Icon name={a.icon} /><strong>{a.title}</strong><small>{a.summary}</small></span><Icon name="arrow" /></button>)}{!filtered.length && <p className="empty-state">No articles found. Try “shipping”, “returns”, or “support”.</p>}</div><p className="help-disclaimer">These articles describe a fictional store for demonstration purposes.</p></section>}
          <div className="page-footer"><span>Thoughtfully built. Effortlessly helpful.</span><span>ASSISTLY / CUSTOMER EXPERIENCE</span></div>
        </section>
        <aside className="insights" aria-label="Support resources"><div className="help-intro"><span className="line-icon"><Icon name="book" size={24} /></span><h2>A good place to start.</h2><p>Find a quick answer, or let Assistly guide you through it.</p></div><div className="topic-list">{topics.map((t, i) => <button disabled={busy} key={t.title} onClick={() => send(t.prompt)}><span className="topic-number">0{i + 1}</span><span><strong>{t.title}</strong><small>{t.subtitle}</small></span><Icon name="arrow" size={17} /></button>)}</div><div className="human-card"><div className="human-icon"><Icon name="person" /></div><h3>Some things need<br />a human touch.</h3><p>Find out how to reach the support team.</p><button disabled={busy} onClick={() => send('I need to speak to a human')}>Contact options <Icon name="arrow" size={16} /></button><span><Icon name="clock" size={13} />Sample hours: Mon–Fri, 9–6 UTC</span></div><div className="context-note"><Icon name="shield" size={17} /><p>{mode === 'demo' ? 'This is a portfolio demo. Use fictional details when trying it out.' : 'Messages are sent to the AI provider. Avoid sharing sensitive information.'}</p></div></aside>
      </main>
    </div>
    {(article || project) && <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) { setArticle(null); setProject(false); } }}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" tabIndex={-1} ref={dialog}><button className="icon-button modal-close" aria-label="Close dialog" onClick={() => { setArticle(null); setProject(false); }}><Icon name="close" /></button><span className="eyebrow">{article ? 'SAMPLE HELP CENTER' : 'DESIGN & DEVELOPMENT'}</span><h2 id="modal-title">{article ? article.title : 'Better support starts with a better experience.'}</h2>{article ? <><p className="article-body">{article.body}</p><button className="primary-button" onClick={() => { const prompt = article.prompt; setArticle(null); send(prompt); }}>Ask Assistly about this <Icon name="arrow" size={16} /></button></> : <><p>Assistly is a concept customer support product that brings conversational assistance, a searchable help center, and clear support pathways into one calm workspace.</p><div className="project-features"><span>Responsive React interface</span><span>Flask + Gemini integration</span><span>Light & dark themes</span><span>Saved chat & transcript export</span></div><p className="modal-footnote">A portfolio demonstration with fictional store policies. Sample mode works without an API key. Live AI can be configured on the server; order systems and agent handoff are future integrations.</p></>}</section></div>}
  </div>;
}
