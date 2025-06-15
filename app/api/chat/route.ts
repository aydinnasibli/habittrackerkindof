// app/api/chat/route.ts (Enhanced version)
import { openai } from '@/lib/openai';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const { message } = await request.json();

        if (!message) {
            return NextResponse.json(
                { error: 'Message is required' },
                { status: 400 }
            );
        }

        // Check if this is a message with GitHub context
        const isContextualMessage = message.includes('Context from GitHub files:');

        const systemMessage = isContextualMessage
            ? `You are a helpful AI assistant analyzing code and project files. The user has provided specific files from their GitHub repository for context. Use this context to provide accurate, detailed answers about their codebase. When referencing code, be specific about which files you're referring to.`
            : `You are a helpful AI assistant.`;

        const completion = await openai.chat.completions.create({
            model: 'gpt-4', // Using GPT-4 for better code analysis
            messages: [
                {
                    role: 'system',
                    content: systemMessage,
                },
                {
                    role: 'user',
                    content: message,
                },
            ],
            max_tokens: isContextualMessage ? 800 : 150, // More tokens for code analysis
            temperature: 0.3, // Lower temperature for more focused responses
        });

        const reply = completion.choices[0]?.message?.content;

        return NextResponse.json({ reply });
    } catch (error) {
        console.error('OpenAI API error:', error);
        return NextResponse.json(
            { error: 'Failed to process request' },
            { status: 500 }
        );
    }
}