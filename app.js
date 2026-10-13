import {
  InteractionResponseFlags,
  InteractionResponseType,
  InteractionType,
  MessageComponentTypes,
  verifyKey,
} from 'discord-interactions';
import customCommands from './custom-commands.json';
import { getRandomEmoji } from './utils.js';

const CUSTOM_COMMANDS_BY_NAME = new Map(
  customCommands.map(({ name, content }) => [name, content]),
);

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function handleInteraction(interaction) {
  const { type, data } = interaction;

  if (type === InteractionType.PING) {
    return jsonResponse({ type: InteractionResponseType.PONG });
  }

  if (type === InteractionType.APPLICATION_COMMAND) {
    const { name } = data;

    if (name === 'testcommand') {
      return jsonResponse({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          flags: InteractionResponseFlags.IS_COMPONENTS_V2,
          components: [
            {
              type: MessageComponentTypes.TEXT_DISPLAY,
              content: `hello world ${getRandomEmoji()}`,
            },
          ],
        },
      });
    }

    if (name === 'Test Message Command') {
      const targetMessage = data.resolved?.messages?.[data.target_id];
      if (!targetMessage) {
        console.error('message command interaction did not include its target message');
        return jsonResponse({ error: 'target message not found' }, 400);
      }

      const content = targetMessage.content;
      return jsonResponse({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: content
            ? `Selected message: ${content.slice(0, 1979)}${content.length > 1979 ? '...' : ''}`
            : 'The selected message has no text content.',
        },
      });
    }

    if (CUSTOM_COMMANDS_BY_NAME.has(name)) {
      const targetMessage = data.resolved?.messages?.[data.target_id];
      if (!targetMessage) {
        console.error('message command interaction did not include its target message');
        return jsonResponse({ error: 'target message not found' }, 400);
      }

      return jsonResponse({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: CUSTOM_COMMANDS_BY_NAME.get(name),
        },
      });
    }

    console.error(`unknown command: ${name}`);
    return jsonResponse({ error: 'unknown command' }, 400);
  }

  console.error('unknown interaction type', type);
  return jsonResponse({ error: 'unknown interaction type' }, 400);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname !== '/interactions' || request.method !== 'POST') {
      return new Response('Not found', { status: 404 });
    }

    const rawBody = await request.text();
    const signature = request.headers.get('X-Signature-Ed25519');
    const timestamp = request.headers.get('X-Signature-Timestamp');
    if (
      !signature ||
      !timestamp ||
      !(await verifyKey(rawBody, signature, timestamp, env.PUBLIC_KEY))
    ) {
      return new Response('invalid request signature', { status: 401 });
    }

    let interaction;
    try {
      interaction = JSON.parse(rawBody);
    } catch {
      return jsonResponse({ error: 'invalid JSON' }, 400);
    }

    try {
      return handleInteraction(interaction);
    } catch (error) {
      console.error('Error handling interaction:', error);
      return jsonResponse({ error: 'internal server error' }, 500);
    }
  },
};
