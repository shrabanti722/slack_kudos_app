import pkg from '@slack/bolt';
const { App } = pkg;
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
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl || databaseUrl.trim() === '') {
      console.error('❌ DATABASE_URL is required! Please set it in your .env file.');
      console.error('💡 Get your Supabase connection string from Project Settings → Database');
      console.error('💡 Format: DATABASE_URL=postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres');
      process.exit(1);
    }

    console.log('🔌 Connecting to database...');
    await initDatabase();
    dbInitialized = true;
  } catch (error) {
    console.error('❌ Failed to initialize database:', error.message);
    console.error('💡 Make sure your DATABASE_URL is correct and your Supabase project is active.');
    console.error('💡 Check that:');
    console.error('   1. Your .env file exists and has DATABASE_URL set');
    console.error('   2. The connection string starts with "postgresql://"');
    console.error('   3. Your Supabase project is not paused');
    process.exit(1);
  }
})();

// Emoji options for kudos
const KUDOS_EMOJIS = ['🎉', '👏', '🌟', '💯', '🔥', '✨', '🙌', '💪', '🚀', '⭐'];

// Handle /kudos slash command
app.command('/kudos', async ({ command, ack, client }) => {
  console.log('🔔 /kudos command handler triggered');
  console.log('Command details:', {
    user_id: command.user_id,
    user_name: command.user_name,
    channel_id: command.channel_id,
    trigger_id: command.trigger_id ? `${command.trigger_id.substring(0, 20)}...` : 'missing',
  });

  try {
    await ack();
    console.log(`✅ Command acknowledged for user: ${command.user_name} (${command.user_id})`);
  } catch (error) {
    console.error('❌ Error acknowledging command:', error);
    return;
  }

  try {
    // Note: We don't need to fetch users anymore since users_select handles this automatically
    // with built-in search functionality and no 100-item limit
    console.log('👥 Using users_select for team member selection (supports search, no limit)');

    // Validate trigger_id
    if (!command.trigger_id) {
      console.error('❌ Missing trigger_id! Cannot open modal.');
      throw new Error('Missing trigger_id. Please try the command again.');
    }

    console.log('🚀 Opening modal...');
    console.log(`   Trigger ID: ${command.trigger_id.substring(0, 20)}...`);
    console.log(`   Using users_select (searchable, no limit)`);
    console.log(`   Using conversations_select (searchable, all channel types)`);

    // Open modal
    const modalResponse = await client.views.open({
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
              text: `*Hey ${command.user_name}!* 👋\n\nSend kudos to recognize your team member's great work!\n\n_💡 Tip: Use the search box to find any team member._`,
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
              type: 'users_select',
              action_id: 'recipient',
              placeholder: {
                type: 'plain_text',
                text: 'Select a team member (searchable)',
              },
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
              // initial_option must exactly match one of the options above
              initial_option: {
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
              type: 'conversations_select',
              action_id: 'channel',
              placeholder: {
                type: 'plain_text',
                text: 'Select a channel',
              },
              filter: {
                include: ['public', 'private'],
                exclude_bot_users: true,
                exclude_external_shared_channels: false,
              },
            },
            optional: true,
          },
        ],
      },
    });

    console.log('✅ Modal opened successfully!');
    console.log('   Modal response:', {
      ok: modalResponse.ok,
      view_id: modalResponse.view?.id,
    });
  } catch (error) {
    console.error('❌ Error opening modal:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      data: error.data,
      trigger_id: command.trigger_id,
    });

    // Try to send an error message to the user
    try {
      // Use postEphemeral for channels, postMessage for DMs
      if (command.channel_id && command.channel_id.startsWith('C')) {
        // It's a channel
        await client.chat.postEphemeral({
          channel: command.channel_id,
          user: command.user_id,
          text: `Sorry, there was an error opening the kudos form: ${error.message}. Please check the bot logs or try again.`,
        });
      } else {
        // It's a DM - use postMessage instead
        await client.chat.postMessage({
          channel: command.user_id,
          text: `Sorry, there was an error opening the kudos form: ${error.message}. Please check the bot logs or try again.`,
        });
      }
    } catch (ephemeralError) {
      console.error('❌ Failed to send error message to user:', ephemeralError);
    }
  }
});

// Handle modal submission
app.view('kudos_modal', async ({ ack, view, client, body }) => {
  const values = view.state.values;
  const userId = body.user.id;
  const userName = body.user.name;

  // Extract form values
  // users_select returns selected_user instead of selected_option
  const recipientId = values.recipient_block.recipient.selected_user;

  // Get recipient name from Slack API
  let recipientName;
  try {
    const recipientInfo = await client.users.info({ user: recipientId });
    recipientName = recipientInfo.user.real_name || recipientInfo.user.name;
  } catch (error) {
    console.error('Error fetching recipient name:', error);
    recipientName = 'Unknown User';
  }
  const message = values.message_block.message.value;
  const emoji = values.emoji_block?.emoji?.selected_option?.value || '🎉';
  const visibility = values.visibility_block?.visibility?.selected_option?.value || 'public';
  const postingOptions = values.posting_options_block.posting_options.selected_options || [];
  const shouldSendDm = postingOptions.some(opt => opt.value === 'dm');
  const shouldPostChannel = postingOptions.some(opt => opt.value === 'channel');
  const channelId = shouldPostChannel
    ? values.channel_block?.channel?.selected_conversation
    : null;

  // Since we use conversations_select, we might not have the channel name immediately
  // We'll fetch it if needed during the save phase or just use the ID
  let channelName = null;

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

  // Fetch channel name and verify accessibility if posting to a channel
  if (shouldPostChannel && channelId) {
    try {
      // First try to join the channel (if it's public, this will ensure we're in it)
      // If it's private, this will fail with channel_not_found if we're not in it
      try {
        await client.conversations.join({ channel: channelId });
      } catch (joinError) {
        console.log(`Note: Could not join channel ${channelId} (might be private or already a member)`);
      }

      const channelInfo = await client.conversations.info({ channel: channelId });
      if (channelInfo.ok) {
        channelName = channelInfo.channel.name;
      }
    } catch (error) {
      console.error('Error fetching channel info:', error);

      if (error.data?.error === 'channel_not_found') {
        await ack({
          response_action: 'errors',
          errors: {
            channel_block: 'Bot cannot access this channel. If it is private, please invite the bot to the channel first.',
          },
        });
        return;
      }
      // For other errors, we'll try to proceed but it might fail later
    }
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
  // Start web server first (so API is available even if database is slow)
  startWebServer();

  // Wait for database to be initialized (with timeout)
  const maxWaitTime = 30000; // 30 seconds
  const startTime = Date.now();
  while (!dbInitialized && (Date.now() - startTime) < maxWaitTime) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  if (!dbInitialized) {
    console.warn('⚠️  Database initialization is taking longer than expected. Server is running but some features may not work.');
  }

  // Start Slack bot (Socket Mode doesn't require a port)
  try {
    await app.start();
    console.log(`⚡️ Slack Kudos Bot is running!`);
    console.log('Ready to receive /kudos commands!');
  } catch (error) {
    console.error('❌ Failed to start Slack bot:', error.message);
    console.log('💡 Web server is still running for API access');
  }
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

