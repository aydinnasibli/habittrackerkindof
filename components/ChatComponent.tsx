'use client';

import { useState } from 'react';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

export default function ChatComponent() {
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(false);

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim()) return;

        const userMessage = message;
        setMessage('');
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setLoading(true);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: userMessage }),
            });

            const data = await response.json();

            if (data.reply) {
                setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
            } else {
                throw new Error('No reply received');
            }
        } catch (error) {
            console.error('Error:', error);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'Sorry, there was an error processing your request.'
            }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-4">
            <div className="border rounded-lg p-4 h-96 overflow-y-auto mb-4">
                {messages.length === 0 ? (
                    <p className="text-gray-500">Start a conversation...</p>
                ) : (
                    messages.map((msg, index) => (
                        <div
                            key={index}
                            className={`mb-2 p-2 rounded ${msg.role === 'user'
                                    ? 'bg-blue-100 text-blue-900 ml-8'
                                    : 'bg-gray-100 text-gray-900 mr-8'
                                }`}
                        >
                            <strong>{msg.role === 'user' ? 'You' : 'AI'}:</strong> {msg.content}
                        </div>
                    ))
                )}
                {loading && <p className="text-gray-500">AI is typing...</p>}
            </div>

            <form onSubmit={sendMessage} className="flex gap-2">
                <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 p-2 border rounded"
                    disabled={loading}
                />
                <button
                    type="submit"
                    disabled={loading || !message.trim()}
                    className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
                >
                    Send
                </button>
            </form>
        </div>
    );
}