import React, { useState, useEffect, useRef } from 'react';

const SendIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
);
const BotIcon = () => (
    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
);
const SunIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M12 12a5 5 0 100-10 5 5 0 000 10z" /></svg>
);
const MoonIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
);

const getSuggestedReplies = (messages) => {
    const lastMessage = messages[messages.length - 1]?.text.toLowerCase() || '';
    if (lastMessage.includes('order') || lastMessage.includes('track')) {
        return ["What's the status of my order?", "Can I get a tracking number?", "I have an issue with an order."];
    }
    if (lastMessage.includes('hour') || lastMessage.includes('open')) {
        return ["What are your business hours?", "Are you open on weekends?", "Contact support"];
    }
    if (lastMessage.includes('agent') || lastMessage.includes('human') || lastMessage.includes('speak')) {
        return ["I'd like to speak to a human.", "Transfer me to a live agent.", "What's the wait time?"];
    }
    return ["What are your hours?", "Track my order", "I need to speak to an agent"];
};

const ThemeToggle = ({ theme, setTheme }) => {
  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');
  return (
    <button onClick={toggleTheme} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-dark-primary focus:outline-none transition-all duration-300">
        <div className="relative w-6 h-6">
            <div className={`absolute transition-all duration-300 transform ${theme === 'dark' ? 'rotate-0 opacity-0' : 'rotate-90 opacity-100'}`}><SunIcon /></div>
            <div className={`absolute transition-all duration-300 transform ${theme === 'dark' ? 'rotate-0 opacity-100' : '-rotate-90 opacity-0'}`}><MoonIcon /></div>
        </div>
    </button>
  );
};

const WelcomeScreen = ({ onStartNew, onContinue }) => (
    <div className="absolute inset-0 bg-white dark:bg-dark-bg bg-opacity-90 dark:bg-opacity-90 backdrop-blur-sm flex items-center justify-center z-20">
        <div className="text-center p-8 bg-white dark:bg-dark-card rounded-2xl shadow-2xl max-w-sm mx-auto">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Welcome Back!</h2>
            <p className="text-gray-600 dark:text-dark-subtext mb-8">We found a previous conversation. Would you like to continue or start a new one?</p>
            <div className="flex justify-center gap-4">
                <button onClick={onContinue} className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-all">Continue</button>
                <button onClick={onStartNew} className="px-6 py-2 bg-gray-200 dark:bg-dark-primary text-gray-800 dark:text-white font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-opacity-80 transition-all">Start New</button>
            </div>
        </div>
    </div>
);

const App = () => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
    const [showWelcome, setShowWelcome] = useState(false);
    const messagesEndRef = useRef(null);
    const suggestedReplies = getSuggestedReplies(messages);

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('theme', theme);
    }, [theme]);

    useEffect(() => {
        const savedMessages = localStorage.getItem('chat_history');
        if (savedMessages && JSON.parse(savedMessages).length > 1) { 
            setShowWelcome(true);
        } else {
            setMessages([{ text: "Hello! I'm your AI assistant. How can I help you today?", isUser: false, timestamp: new Date() }]);
        }
    }, []);

    useEffect(() => {
        if (messages.length > 0) {
            localStorage.setItem('chat_history', JSON.stringify(messages));
        }
    }, [messages]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    const handleContinue = () => {
        const savedMessages = JSON.parse(localStorage.getItem('chat_history'));
        const parsedMessages = savedMessages.map(msg => ({ ...msg, timestamp: new Date(msg.timestamp) }));
        setMessages(parsedMessages);
        setShowWelcome(false);
    };

    const handleStartNew = () => {
        setMessages([{ text: "Hello! I'm your AI assistant. How can I help you today?", isUser: false, timestamp: new Date() }]);
        localStorage.removeItem('chat_history');
        setShowWelcome(false);
    };

    const handleSend = async (messageText = input) => {
        if (!messageText.trim()) return;
        const userMessage = { text: messageText, isUser: true, timestamp: new Date() };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsTyping(true);

        try {
            const response = await fetch('http://127.0.0.1:5000/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: messageText }),
            });
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();
            const botMessage = { text: data.response, isUser: false, timestamp: new Date() };
            setMessages(prev => [...prev, botMessage]);
        } catch (error) {
            console.error('Error fetching bot response:', error);
            const errorMessage = { text: "I'm sorry, I'm having trouble connecting. Please try again later.", isUser: false, timestamp: new Date() };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsTyping(false);
        }
    };

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-dark-bg font-sans">
        {showWelcome && <WelcomeScreen onContinue={handleContinue} onStartNew={handleStartNew} />}
        <header className="bg-white/70 dark:bg-dark-card/70 backdrop-blur-lg border-b border-gray-200 dark:border-dark-primary p-4 shadow-sm z-10">
            <div className="max-w-4xl mx-auto flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0"><BotIcon/></div>
                    <div>
                        <h1 className="text-lg font-bold text-gray-800 dark:text-white">AI Support</h1>
                        <p className="text-xs text-green-500 flex items-center"><span className="relative flex h-2 w-2 mr-1.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span></span>Online</p>
                    </div>
                </div>
                <ThemeToggle theme={theme} setTheme={setTheme} />
            </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 space-y-6"><div className="max-w-4xl mx-auto">
            {messages.map((msg, index) => (
              <div key={index} className={`flex items-end gap-2 ${msg.isUser ? 'justify-end' : 'justify-start'}`}>
                {!msg.isUser && (<div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0"><BotIcon/></div>)}
                <div className={`rounded-xl p-3 max-w-sm lg:max-w-md shadow-md ${msg.isUser ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white dark:bg-dark-card text-gray-800 dark:text-gray-200 rounded-bl-none'}`}>
                  <p className="text-sm">{msg.text}</p>
                  <span className="text-xs opacity-60 dark:opacity-40 mt-2 block text-right">{msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            ))}
            {isTyping && (
                 <div className="flex items-end gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0"><BotIcon /></div>
                    <div className="bg-white dark:bg-dark-card rounded-xl rounded-bl-none p-3 shadow-md">
                        <div className="flex items-center space-x-1"><div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" /><div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]" /><div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]" /></div>
                    </div>
                </div>
            )}
            <div ref={messagesEndRef} />
        </div></main>

        <footer className="bg-white/80 dark:bg-dark-card/80 backdrop-blur-lg border-t border-gray-200 dark:border-dark-primary p-4">
            <div className="max-w-4xl mx-auto">
                <div className="flex flex-wrap gap-2 mb-3">
                    {suggestedReplies.map((text, i) => <button key={i} onClick={() => handleSend(text)} className="bg-gray-100 dark:bg-dark-primary border border-gray-200 dark:border-gray-700 text-sm text-blue-600 dark:text-blue-400 py-1.5 px-4 rounded-full hover:bg-gray-200 dark:hover:bg-opacity-80 transition-all">{text}</button>)}
                </div>
                <div className="flex items-center bg-gray-100 dark:bg-dark-bg rounded-full p-1 shadow-inner">
                    <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSend()} placeholder="Type your message..." className="flex-1 bg-transparent border-0 py-2 px-4 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-0" />
                    <button onClick={() => handleSend()} disabled={!input.trim()} className="bg-blue-600 text-white rounded-full p-2.5 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-dark-card transition-all disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"><SendIcon /></button>
                </div>
            </div>
        </footer>
    </div>
  );
};

export default App;
