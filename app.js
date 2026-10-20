import {
  InteractionResponseFlags,
  InteractionResponseType,
  InteractionType,
  MessageComponentTypes,
  verifyKey,
} from 'discord-interactions';
import customCommands from './custom-commands.json';

const CUSTOM_COMMANDS_BY_VARIABLE = new Map(
  customCommands.map(({ variable, content }) => [variable, content]),
);

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function getUserId(interaction) {
  const userId =
    interaction.context === 0
      ? interaction.member?.user?.id
      : interaction.user?.id;

  if (!userId) {
    throw new Error('interaction did not include a user ID');
  }

  return userId;
}

async function createReplyMessage(channelId, messageId, content, token) {
  const response = await fetch(
    `https://discord.com/api/v10/channels/${channelId}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bot ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content,
        message_reference: { message_id: messageId },
        allowed_mentions: { parse: [] },
      }),
    },
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Discord API returned ${response.status}: ${error}`);
  }
}

async function handleInteraction(interaction, env) {
  const { id, type, data } = interaction;

  if (type === InteractionType.PING) {
    return jsonResponse({ type: InteractionResponseType.PONG });
  }

  if (type === InteractionType.APPLICATION_COMMAND) {
    const { name } = data;

    if (name === 'Hydrate') {
      const targetMessage = data.resolved?.messages?.[data.target_id];
      if (!id || !data.target_id || !targetMessage || !interaction.channel_id) {
        console.error('message command interaction did not include its target message');
        return jsonResponse({ error: 'target message not found' }, 400);
      }

      const userId = getUserId(interaction);
      const now = Date.now();
      await env.DB.batch([
        env.DB.prepare('DELETE FROM hydration_interactions WHERE expires_at <= ?')
          .bind(now),
        env.DB.prepare(
          `INSERT INTO hydration_interactions
             (interaction_id, user_id, channel_id, message_id, expires_at)
           VALUES (?, ?, ?, ?, ?)
           ON CONFLICT(interaction_id) DO UPDATE SET
             user_id = excluded.user_id,
             channel_id = excluded.channel_id,
             message_id = excluded.message_id,
             expires_at = excluded.expires_at`,
        ).bind(
          id,
          userId,
          interaction.channel_id,
          data.target_id,
          now + 24 * 60 * 60 * 1000,
        ),
      ]);

      return jsonResponse({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          flags: InteractionResponseFlags.EPHEMERAL,
          content: 'Select a hydration message:',
          components: [
            {
              type: MessageComponentTypes.ACTION_ROW,
              components: [
                {
                  type: MessageComponentTypes.STRING_SELECT,
                  custom_id: `hydrate_select_${id}`,
                  options: customCommands.map(({ variable, content }) => ({
                    label: content.slice(0, 100),
                    value: variable,
                  })),
                  min_values: 1,
                  max_values: 1,
                },
              ],
            },
          ],
        },
      });
    }

    console.error(`unknown command: ${name}`);
    return jsonResponse({ error: 'unknown command' }, 400);
  }

  if (type === InteractionType.MESSAGE_COMPONENT) {
    const customId = data.custom_id;
    const prefix = 'hydrate_select_';

    if (customId.startsWith(prefix)) {
      const interactionId = customId.slice(prefix.length);
      const [selectedVariable] = data.values ?? [];
      const content = CUSTOM_COMMANDS_BY_VARIABLE.get(selectedVariable);

      if (!content) {
        return jsonResponse({ error: 'unknown hydration message' }, 400);
      }

      const { results } = await env.DB.prepare(
        `DELETE FROM hydration_interactions
         WHERE interaction_id = ? AND user_id = ? AND expires_at > ?
         RETURNING channel_id, message_id`,
      )
        .bind(interactionId, getUserId(interaction), Date.now())
        .run();
      const target = results[0];

      if (!target) {
        return jsonResponse({
          type: InteractionResponseType.UPDATE_MESSAGE,
          data: {
            content: 'This hydration selection has expired or was already used.',
            components: [],
          },
        });
      }

      await createReplyMessage(
        target.channel_id,
        target.message_id,
        content,
        env.DISCORD_TOKEN,
      );

      return jsonResponse({
        type: InteractionResponseType.UPDATE_MESSAGE,
        data: {
          content: 'Hydration message sent.',
          components: [],
        },
      });
    }

    console.error(`unknown component: ${customId}`);
    return jsonResponse({ error: 'unknown component' }, 400);
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
      return await handleInteraction(interaction, env);
    } catch (error) {
      console.error('Error handling interaction:', error);
      return jsonResponse({ error: 'internal server error' }, 500);
    }
  },
};
