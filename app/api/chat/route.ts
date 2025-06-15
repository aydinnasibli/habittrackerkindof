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
                    // More aggressive truncation to avoid token limits and timeouts
                    const content = file.content.length > 5000
                        ? file.content.substring(0, 5000) + '\n\n... (file truncated due to length)'
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

        // Use streaming for better performance and to avoid timeouts
        const stream = await anthropic.messages.create({
            model: 'claude-sonnet-4-0', // Switch to Sonnet 4 - it's faster and more efficient
            max_tokens: 32000, // Reduced max_tokens for faster responses
            messages: finalMessages,
            stream: true, // Enable streaming
        });

        // Create a ReadableStream to handle the streaming response
        const encoder = new TextEncoder();
        const readable = new ReadableStream({
            async start(controller) {
                try {
                    let fullContent = '';
                    let usage = null;

                    for await (const chunk of stream) {
                        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
                            const text = chunk.delta.text;
                            fullContent += text;

                            // Send each chunk to the client
                            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: text, type: 'chunk' })}\n\n`));
                        } else if (chunk.type === 'message_stop') {
                            usage = chunk.usage || null;
                        }
                    }

                    // Send final message with complete content and usage
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                        content: fullContent,
                        usage: usage,
                        type: 'complete'
                    })}\n\n`));

                    controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                    controller.close();
                } catch (error) {
                    console.error('Streaming error:', error);
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                        error: 'Streaming failed',
                        type: 'error'
                    })}\n\n`));
                    controller.close();
                }
            },
        });

        return new Response(readable, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
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