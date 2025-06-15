// components/Chat.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Message, ChatResponse, RepoFile } from '@/lib/types';
import RepoBrowser from './RepoBrowser';

export default function Chat() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<RepoFile[]>([]);
    const [showRepoBrowser, setShowRepoBrowser] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const generateId = () => {
        return Date.now().toString() + Math.random().toString(36).substr(2, 9);
    };

    const sendMessage = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: Message = {
            role: 'user',
            content: input.trim(),
            timestamp: new Date(),
            id: generateId(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            // Format messages for Claude API
            const apiMessages = [...messages, userMessage].map(msg => ({
                role: msg.role,
                content: msg.content,
            }));

            // Include repo context if files are selected
            const repoContext = selectedFiles.length > 0 ? {
                selectedFiles: selectedFiles,
            } : null;

            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    messages: apiMessages,
                    repoContext: repoContext,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to get response');
            }

            const data: ChatResponse = await response.json();

            const assistantMessage: Message = {
                role: 'assistant',
                content: data.content,
                timestamp: new Date(),
                id: generateId(),
            };

            setMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
            console.error('Error sending message:', error);
            const errorMessage: Message = {
                role: 'assistant',
                content: 'Sorry, I encountered an error. Please try again.',
                timestamp: new Date(),
                id: generateId(),
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const clearChat = () => {
        setMessages([]);
    };

    const clearFiles = () => {
        setSelectedFiles([]);
    };

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar */}
            <div className={`${showRepoBrowser ? 'w-1/3' : 'w-0'} transition-all duration-300 overflow-hidden bg-white border-r`}>
                {showRepoBrowser && (
                    <div className="p-4 h-full overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold">Repository Browser</h2>
                            <button
                                onClick={() => setShowRepoBrowser(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                ✕
                            </button>
                        </div>
                        <RepoBrowser
                            onFilesSelected={setSelectedFiles}
                            selectedFiles={selectedFiles}
                        />
                    </div>
                )}
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col">
                {/* Header */}
                <div className="bg-blue-600 text-white p-4 flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                        <h1 className="text-xl font-semibold">Claude Chat with Git</h1>
                        {selectedFiles.length > 0 && (
                            <span className="bg-blue-700 px-2 py-1 rounded text-sm">
                                {selectedFiles.length} files loaded
                            </span>
                        )}
                    </div>
                    <div className="flex space-x-2">
                        <button
                            onClick={() => setShowRepoBrowser(!showRepoBrowser)}
                            className={`px-3 py-1 rounded text-sm transition-colors ${showRepoBrowser
                                    ? 'bg-blue-700 hover:bg-blue-800'
                                    : 'bg-blue-500 hover:bg-blue-600'
                                }`}
                        >
                            {showRepoBrowser ? 'Hide' : 'Show'} Repo
                        </button>
                        {selectedFiles.length > 0 && (
                            <button
                                onClick={clearFiles}
                                className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm transition-colors"
                            >
                                Clear Files
                            </button>
                        )}
                        <button
                            onClick={clearChat}
                            className="px-3 py-1 bg-blue-700 hover:bg-blue-800 rounded text-sm transition-colors"
                        >
                            Clear Chat
                        </button>
                    </div>
                </div>

                {/* File Context Indicator */}
                {selectedFiles.length > 0 && (
                    <div className="bg-green-50 border-b p-2">
                        <div className="text-sm text-green-800">
                            🔗 Context: {selectedFiles.map(f => f.name).join(', ')}
                            {selectedFiles.length > 3 && ` +${selectedFiles.length - 3} more`}
                        </div>
                    </div>
                )}

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.length === 0 && (
                        <div className="text-center text-gray-500 mt-8">
                            <div className="mb-4">
                                <h2 className="text-2xl font-semibold mb-2">Welcome to Claude Chat with Git!</h2>
                                <p className="text-lg">Connect your GitHub repositories and chat with Claude about your code.</p>
                            </div>
                            <div className="bg-blue-50 p-6 rounded-lg max-w-2xl mx-auto">
                                <h3 className="font-semibold mb-2">Features:</h3>
                                <ul className="text-left space-y-1">
                                    <li>• Browse and load files from GitHub repositories</li>
                                    <li>• Chat with Claude about your code with full context</li>
                                    <li>• Get code reviews, explanations, and suggestions</li>
                                    <li>• Support for public repositories (GitHub token optional)</li>
                                </ul>
                            </div>
                        </div>
                    )}

                    {messages.map((message) => (
                        <div
                            key={message.id}
                            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-xs lg:max-w-2xl px-4 py-3 rounded-lg ${message.role === 'user'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-white text-gray-800 border shadow-sm'
                                    }`}
                            >
                                <div className="whitespace-pre-wrap">{message.content}</div>
                                <div className={`text-xs mt-2 ${message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                                    }`}>
                                    {message.timestamp.toLocaleTimeString()}
                                </div>
                            </div>
                        </div>
                    ))}

                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="bg-white text-gray-800 max-w-xs lg:max-w-2xl px-4 py-3 rounded-lg border shadow-sm">
                                <div className="flex items-center space-x-2">
                                    <div className="flex space-x-1">
                                        <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                                        <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                        <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                    </div>
                                    <span className="text-sm">Claude is thinking...</span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="border-t bg-white p-4">
                    <div className="flex space-x-2">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder={
                                selectedFiles.length > 0
                                    ? "Ask Claude about your code..."
                                    : "Type your message... (Press Enter to send)"
                            }
                            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                            rows={2}
                            disabled={isLoading}
                        />
                        <button
                            onClick={sendMessage}
                            disabled={!input.trim() || isLoading}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors self-end"
                        >
                            Send
                        </button>
                    </div>
                    {selectedFiles.length > 0 && (
                        <div className="text-xs text-gray-500 mt-1">
                            💡 Claude has access to your selected files and can help with code analysis, debugging, and improvements.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}