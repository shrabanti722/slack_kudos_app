import { App } from '@slack/bolt';
import dotenv from 'dotenv';
import { initDatabase, saveKudos, closeDatabase } from './database.js';
import { startWebServer } from './web.js';
import { setSlackClient } from './slack-client.js';

// Load environment variables
dotenv.config();

// Initialize Slack app
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN,
});

// Set Slack client for use in API routes
setSlackClient(app.client);

// Initialize database (async)
let dbInitialized = false;
(async () => {
  try {
    await initDatabase(process.env.DB_PATH || './kudos.db');
    dbInitialized = true;
  } catch (error) {
    console.error('❌ Failed to initialize database:', error);
    process.exit(1);
  }
})();

// Emoji options for kudos
const KUDOS_EMOJIS = ['🎉', '👏', '🌟', '💯', '🔥', '✨', '🙌', '💪', '🚀', '⭐'];

// Handle /kudos slash command
app.command('/kudos', async ({ command, ack, client }) => {
  await ack();

  try {
    // Get list of users in the workspace
    const usersResult = await client.users.list();
    const users = usersResult.members
      .filter(user => !user.deleted && !user.is_bot && user.id !== 'USLACKBOT')
      .map(user => ({
        text: {
          type: 'plain_text',
          text: user.real_name || user.name,
        },
        value: user.id,
      }));

    // Get list of public channels
    const channelsResult = await client.conversations.list({
      types: 'public_channel,private_channel',
      exclude_archived: true,
    });
    const channels = channelsResult.channels.map(channel => ({
      text: {
        type: 'plain_text',
        text: `#${channel.name}`,
      },
      value: channel.id,
    }));

    // Open modal
    await client.views.open({
      trigger_id: command.trigger_id,
      view: {
        type: 'modal',
        callback_id: 'kudos_modal',
        title: {
          type: 'plain_text',
          text: 'Send Kudos',
          emoji: true,
        },
        submit: {
          type: 'plain_text',
          text: 'Send Kudos',
          emoji: true,
        },
        close: {
          type: 'plain_text',
          text: 'Cancel',
        },
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*Hey ${command.user_name}!* 👋\n\nSend kudos to recognize your team member's great work!`,
            },
          },
          {
            type: 'divider',
          },
          {
            type: 'input',
            block_id: 'recipient_block',
            label: {
              type: 'plain_text',
              text: 'Team Member',
              emoji: true,
            },
            element: {
              type: 'static_select',
              action_id: 'recipient',
              placeholder: {
                type: 'plain_text',
                text: 'Select a team member',
              },
              options: users,
            },
          },
          {
            type: 'input',
            block_id: 'message_block',
            label: {
              type: 'plain_text',
              text: 'Kudos Message',
              emoji: true,
            },
            element: {
              type: 'plain_text_input',
              action_id: 'message',
              placeholder: {
                type: 'plain_text',
                text: 'What did they do that deserves kudos?',
              },
              multiline: true,
              min_length: 10,
            },
          },
          {
            type: 'input',
            block_id: 'emoji_block',
            label: {
              type: 'plain_text',
              text: 'Emoji',
              emoji: true,
            },
            element: {
              type: 'static_select',
              action_id: 'emoji',
              placeholder: {
                type: 'plain_text',
                text: 'Choose an emoji',
              },
              initial_option: {
                text: {
                  type: 'plain_text',
                  text: '🎉',
                },
                value: '🎉',
              },
              options: KUDOS_EMOJIS.map(emoji => ({
                text: {
                  type: 'plain_text',
                  text: emoji,
                },
                value: emoji,
              })),
            },
            optional: true,
          },
          {
            type: 'divider',
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: '*Visibility*',
            },
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: 'Choose who can see this Kudos:\n• *Public*: Visible to everyone (default)\n• *Private*: Only visible to you, recipient, and managers',
            },
          },
          {
            type: 'input',
            block_id: 'visibility_block',
            label: {
              type: 'plain_text',
              text: 'Visibility',
              emoji: true,
            },
            element: {
              type: 'radio_buttons',
              action_id: 'visibility',
              initial_option: {
                text: {
                  type: 'plain_text',
                  text: '🌐 Public',
                },
                value: 'public',
              },
              options: [
                {
                  text: {
                    type: 'plain_text',
                    text: '🌐 Public',
                  },
                  value: 'public',
                  description: {
                    type: 'plain_text',
                    text: 'Visible to everyone',
                  },
                },
                {
                  text: {
                    type: 'plain_text',
                    text: '🔒 Private',
                  },
                  value: 'private',
                  description: {
                    type: 'plain_text',
                    text: 'Only visible to you, recipient, and managers',
                  },
                },
              ],
            },
            optional: true,
          },
          {
            type: 'divider',
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: '*Where should this kudos be sent?*',
            },
          },
          {
            type: 'input',
            block_id: 'posting_options_block',
            label: {
              type: 'plain_text',
              text: 'Posting Options',
              emoji: true,
            },
            element: {
              type: 'checkboxes',
              action_id: 'posting_options',
              options: [
                {
                  text: {
                    type: 'plain_text',
                    text: 'Send Direct Message to recipient',
                  },
                  value: 'dm',
                },
                {
                  text: {
                    type: 'plain_text',
                    text: 'Post in a channel',
                  },
                  value: 'channel',
                },
              ],
              initial_options: [
                {
                  text: {
                    type: 'plain_text',
                    text: 'Send Direct Message to recipient',
                  },
                  value: 'dm',
                },
              ],
            },
          },
          {
            type: 'input',
            block_id: 'channel_block',
            label: {
              type: 'plain_text',
              text: 'Channel (if posting to channel)',
              emoji: true,
            },
            element: {
              type: 'static_select',
              action_id: 'channel',
              placeholder: {
                type: 'plain_text',
                text: 'Select a channel',
              },
              options: channels,
            },
            optional: true,
          },
        ],
      },
    });
  } catch (error) {
    console.error('Error opening modal:', error);
    await client.chat.postEphemeral({
      channel: command.channel_id,
      user: command.user_id,
      text: 'Sorry, there was an error opening the kudos form. Please try again.',
    });
  }
});

// Handle modal submission
app.view('kudos_modal', async ({ ack, view, client, body }) => {
  const values = view.state.values;
  const userId = body.user.id;
  const userName = body.user.name;

  // Extract form values
  const recipientId = values.recipient_block.recipient.selected_option.value;
  const recipientName = values.recipient_block.recipient.selected_option.text.text;
  const message = values.message_block.message.value;
  const emoji = values.emoji_block?.emoji?.selected_option?.value || '🎉';
  const visibility = values.visibility_block?.visibility?.selected_option?.value || 'public';
  const postingOptions = values.posting_options_block.posting_options.selected_options || [];
  const shouldSendDm = postingOptions.some(opt => opt.value === 'dm');
  const shouldPostChannel = postingOptions.some(opt => opt.value === 'channel');
  const channelId = shouldPostChannel
    ? values.channel_block?.channel?.selected_option?.value
    : null;
  const channelName = shouldPostChannel
    ? values.channel_block?.channel?.selected_option?.text.text
    : null;

  // Private kudos should not be posted to channels (only DM)
  if (visibility === 'private' && shouldPostChannel) {
    await ack({
      response_action: 'errors',
      errors: {
        posting_options_block: 'Private Kudos can only be sent via Direct Message, not to channels.',
      },
    });
    return;
  }

  // Validate
  if (!shouldSendDm && !shouldPostChannel) {
    await ack({
      response_action: 'errors',
      errors: {
        posting_options_block: 'Please select at least one posting option (DM or Channel).',
      },
    });
    return;
  }

  if (shouldPostChannel && !channelId) {
    await ack({
      response_action: 'errors',
      errors: {
        channel_block: 'Please select a channel when posting to channel is enabled.',
      },
    });
    return;
  }

  await ack();

  try {
    // Get recipient user info
    const recipientInfo = await client.users.info({ user: recipientId });
    const recipientDisplayName = recipientInfo.user.real_name || recipientInfo.user.name;

    // Get sender user info
    const senderInfo = await client.users.info({ user: userId });
    const senderDisplayName = senderInfo.user.real_name || senderInfo.user.name;

    // Format kudos message with visibility indicator
    const visibilityLabel = visibility === 'private' ? '🔒 Private' : '🌐 Public';
    const kudosMessage = `${emoji} *Kudos to <@${recipientId}>!* ${visibilityLabel}\n\n*From:* <@${userId}>\n*Message:* ${message}`;

    let sentDm = false;
    let sentChannel = false;

    // Send DM if requested
    if (shouldSendDm) {
      try {
        await client.chat.postMessage({
          channel: recipientId,
          text: kudosMessage,
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: kudosMessage,
              },
            },
          ],
        });
        sentDm = true;
      } catch (error) {
        console.error('Error sending DM:', error);
      }
    }

    // Post to channel if requested
    if (shouldPostChannel && channelId) {
      try {
        await client.chat.postMessage({
          channel: channelId,
          text: kudosMessage,
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: kudosMessage,
              },
            },
          ],
        });
        sentChannel = true;
      } catch (error) {
        console.error('Error posting to channel:', error);
      }
    }

    // Save to database
    await saveKudos({
      fromUserId: userId,
      fromUserName: senderDisplayName,
      toUserId: recipientId,
      toUserName: recipientDisplayName,
      message: message,
      channelId: channelId,
      channelName: channelName,
      sentDm: sentDm,
      sentChannel: sentChannel,
      visibility: visibility,
    });

    // Send confirmation to user
    const confirmationVisibilityLabel = visibility === 'private' ? '🔒 Private' : '🌐 Public';
    const confirmationMessage = `✅ Kudos sent successfully! ${emoji}\n\n`;
    const details = [];
    details.push(`Visibility: ${confirmationVisibilityLabel}`);
    if (sentDm) details.push('✓ Direct message sent');
    if (sentChannel) details.push(`✓ Posted in ${channelName || 'channel'}`);
    if (!sentDm && !sentChannel) {
      details.push('⚠️ Note: There was an issue sending the kudos. Please try again.');
    }

    await client.chat.postEphemeral({
      channel: body.view.private_metadata || body.user.id,
      user: userId,
      text: confirmationMessage + details.join('\n'),
    });
  } catch (error) {
    console.error('Error processing kudos:', error);
    await client.chat.postEphemeral({
      channel: body.view.private_metadata || body.user.id,
      user: userId,
      text: 'Sorry, there was an error sending the kudos. Please try again.',
    });
  }
});

// Start the app
(async () => {
  // Wait for database to be initialized
  while (!dbInitialized) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Start Slack bot (Socket Mode doesn't require a port)
  await app.start();
  console.log(`⚡️ Slack Kudos Bot is running!`);
  console.log('Ready to receive /kudos commands!');

  // Start web server
  startWebServer();
})();

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  await app.stop();
  await closeDatabase();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await app.stop();
  await closeDatabase();
  process.exit(0);
});

