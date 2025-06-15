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
        let systemMessage = `You are Claude, an AI assistant helping with code and development tasks. 

When analyzing code:
- Provide clear, actionable feedback
- Explain complex concepts in simple terms
- Suggest improvements and best practices
- Point out potential issues or bugs
- Help with debugging and optimization

Be thorough but concise in your responses.`;

        if (repoContext && repoContext.selectedFiles && repoContext.selectedFiles.length > 0) {
            systemMessage += "\n\nYou have access to the following repository files:\n";

            repoContext.selectedFiles.forEach((file: any) => {
                if (file.content) {
                    // Truncate very long files to avoid token limits
                    const content = file.content.length > 10000
                        ? file.content.substring(0, 10000) + '\n\n... (file truncated due to length)'
                        : file.content;

                    systemMessage += `\n--- ${file.path} ---\n${content}\n`;
                }
            });

            systemMessage += `\nPlease use this code context to provide more accurate and relevant responses. When referencing the code, mention specific file names and line numbers when relevant.`;
        }

        // Convert messages to Claude format
        const claudeMessages = messages.map((msg: any) => ({
            role: msg.role,
            content: msg.content,
        }));

        // Add system message as the first user message if we have repo context
        const finalMessages = repoContext?.selectedFiles?.length > 0
            ? [
                { role: 'user', content: `<system_context>\n${systemMessage}\n</system_context>\n\nI'm ready to discuss the code. What would you like to know?` },
                ...claudeMessages.slice(1) // Skip the first message since we're replacing it
            ]
            : claudeMessages;

        const response = await anthropic.messages.create({
            model: 'claude-opus-4-0',
            max_tokens: 65536,
            messages: finalMessages,
        });

        return NextResponse.json({
            content: response.content[0].type === 'text' ? response.content[0].text : 'Unable to generate response',
            usage: response.usage,
        });
    } catch (error) {
        console.error('Error calling Claude API:', error);

        // Handle specific Anthropic API errors
        if (error instanceof Error) {
            if (error.message.includes('401')) {
                return NextResponse.json(
                    { error: 'Invalid API key. Please check your Anthropic API key.' },
                    { status: 401 }
                );
            }
            if (error.message.includes('429')) {
                return NextResponse.json(
                    { error: 'Rate limit exceeded. Please try again in a moment.' },
                    { status: 429 }
                );
            }
        }

        return NextResponse.json(
            { error: 'Failed to generate response. Please try again.' },
            { status: 500 }
        );
    }
}