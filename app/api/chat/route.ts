// app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function POST(request: NextRequest) {
    try {
        const { messages, repoContext } = await request.json();

        if (!messages || !Array.isArray(messages)) {
            return NextResponse.json(
                { error: 'Messages array is required' },
                { status: 400 }
            );
        }

        // Prepare system message with repo context if available
        let systemMessage = "You are Claude, an AI assistant helping with code and development tasks.";

        if (repoContext && repoContext.selectedFiles && repoContext.selectedFiles.length > 0) {
            systemMessage += "\n\nYou have access to the following repository files:\n";

            repoContext.selectedFiles.forEach((file: any) => {
                if (file.content) {
                    systemMessage += `\n--- ${file.path} ---\n${file.content}\n`;
                }
            });

            systemMessage += "\nPlease use this code context to provide more accurate and relevant responses.";
        }

        // Add system message to the beginning if we have repo context
        const apiMessages = repoContext?.selectedFiles?.length > 0
            ? [{ role: 'system', content: systemMessage }, ...messages]
            : messages;

        const response = await anthropic.messages.create({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 4096,
            messages: apiMessages.map((msg: any) => ({
                role: msg.role === 'system' ? 'user' : msg.role,
                content: msg.role === 'system' ? `<system>${msg.content}</system>` : msg.content,
            })),
        });

        return NextResponse.json({
            content: response.content[0].text,
            usage: response.usage,
        });
    } catch (error) {
        console.error('Error calling Claude API:', error);
        return NextResponse.json(
            { error: 'Failed to generate response' },
            { status: 500 }
        );
    }
}