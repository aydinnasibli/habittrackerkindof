// components/EnhancedChatComponent.tsx
'use client';

import { useState } from 'react';
import GitHubIntegration from './GitHubIntegration';
import { XIcon, FileTextIcon } from 'lucide-react';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

interface GitHubFile {
    path: string;
    content: string;
    name: string;
}

export default function ChatComponent() {
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(false);
    const [githubFiles, setGithubFiles] = useState<GitHubFile[]>([]);
    const [showGitHubIntegration, setShowGitHubIntegration] = useState(false);

    const handleGitHubFiles = (files: GitHubFile[]) => {
        setGithubFiles(prev => [...prev, ...files]);
        setShowGitHubIntegration(false);

        // Add a system message about the added files
        const fileNames = files.map(f => f.name).join(', ');
        setMessages(prev => [...prev, {
            role: 'assistant',
            content: `✅ Added ${files.length} file${files.length !== 1 ? 's' : ''} to context: ${fileNames}`
        }]);
    };

    const removeGitHubFile = (index: number) => {
        setGithubFiles(prev => prev.filter((_, i) => i !== index));
    };

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim()) return;

        const userMessage = message;
        setMessage('');
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setLoading(true);

        try {
            // Prepare context with GitHub files
            let contextualMessage = userMessage;

            if (githubFiles.length > 0) {
                const fileContext = githubFiles.map(file =>
                    `File: ${file.path}\n\`\`\`\n${file.content}\n\`\`\``
                ).join('\n\n');

                contextualMessage = `Context from GitHub files:\n\n${fileContext}\n\nUser Question: ${userMessage}`;
            }

            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: contextualMessage }),
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
        <div className="max-w-4xl mx-auto p-4">
            {/* GitHub Integration Panel */}
            {showGitHubIntegration && (
                <div className="mb-4">
                    <GitHubIntegration onFilesSelected={handleGitHubFiles} />
                </div>
            )}

            {/* Active GitHub Files */}
            {githubFiles.length > 0 && (
                <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                    <h4 className="text-sm font-medium mb-2">Active Context Files:</h4>
                    <div className="flex flex-wrap gap-2">
                        {githubFiles.map((file, index) => (
                            <div
                                key={index}
                                className="flex items-center bg-white px-3 py-1 rounded-full text-sm border"
                            >
                                <FileTextIcon className="w-3 h-3 mr-1" />
                                <span>{file.name}</span>
                                <button
                                    onClick={() => removeGitHubFile(index)}
                                    className="ml-2 text-red-500 hover:text-red-700"
                                >
                                    <XIcon className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Chat Interface */}
            <div className="border rounded-lg p-4 h-96 overflow-y-auto mb-4">
                {messages.length === 0 ? (
                    <div className="text-center text-gray-500 mt-8">
                        <p>Start a conversation...</p>
                        <p className="text-sm mt-2">
                            You can add GitHub files to provide context for your questions.
                        </p>
                    </div>
                ) : (
                    messages.map((msg, index) => (
                        <div
                            key={index}
                            className={`mb-4 p-3 rounded-lg ${msg.role === 'user'
                                    ? 'bg-blue-100 text-blue-900 ml-8'
                                    : 'bg-gray-100 text-gray-900 mr-8'
                                }`}
                        >
                            <div className="font-semibold mb-1">
                                {msg.role === 'user' ? 'You' : 'AI'}
                            </div>
                            <div className="whitespace-pre-wrap">{msg.content}</div>
                        </div>
                    ))
                )}
                {loading && (
                    <div className="text-center text-gray-500 py-4">
                        AI is thinking...
                    </div>
                )}
            </div>

            {/* Input Form */}
            <form onSubmit={sendMessage} className="flex gap-2 mb-2">
                <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Ask a question about your code..."
                    className="flex-1 p-3 border rounded-lg"
                    disabled={loading}
                />
                <button
                    type="submit"
                    disabled={loading || !message.trim()}
                    className="px-6 py-3 bg-blue-500 text-white rounded-lg disabled:opacity-50 hover:bg-blue-600"
                >
                    Send
                </button>
            </form>

            {/* GitHub Integration Toggle */}
            <div className="flex justify-center">
                <button
                    onClick={() => setShowGitHubIntegration(!showGitHubIntegration)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                    {showGitHubIntegration ? 'Hide' : 'Add'} GitHub Files
                </button>
            </div>
        </div>
    );
}