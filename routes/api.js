import express from 'express';
import {
  getKudosByUser,
  getAllKudos,
  getKudosSentByUser,
  getKudosStats,
  getLeaderboard,
  saveKudos,
} from '../database.js';
import { getSlackClient } from '../slack-client.js';

const router = express.Router();

// Get all kudos (with optional limit and visibility filter)
router.get('/kudos', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const visibility = req.query.visibility; // 'public', 'private', or undefined (all)

    // If visibility is specified, use it; otherwise get all
    let kudos;
    if (visibility === 'public') {
      const { getPublicKudos } = await import('../database.js');
      kudos = await getPublicKudos(limit);
    } else {
      kudos = await getAllKudos(limit, visibility || null);
    }

    res.json({ success: true, data: kudos, count: kudos.length });
  } catch (error) {
    console.error('Error fetching kudos:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch kudos' });
  }
});

// Get only public kudos (for public feeds)
router.get('/kudos/public', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const { getPublicKudos } = await import('../database.js');
    const kudos = await getPublicKudos(limit);
    res.json({ success: true, data: kudos, count: kudos.length });
  } catch (error) {
    console.error('Error fetching public kudos:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch public kudos' });
  }
});

// Get kudos received by a specific user
router.get('/kudos/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit) || 10;
    // For now, include private kudos (in future, check if requester is authorized)
    // TODO: Add authorization check to only show private kudos to sender, recipient, or managers
    const includePrivate = req.query.includePrivate !== 'false'; // Default to true
    const kudos = await getKudosByUser(userId, limit, includePrivate);
    res.json({ success: true, data: kudos, count: kudos.length });
  } catch (error) {
    console.error('Error fetching user kudos:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch user kudos' });
  }
});

// Get kudos sent by a specific user
router.get('/kudos/sent/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit) || 10;
    const kudos = await getKudosSentByUser(userId, limit);
    res.json({ success: true, data: kudos, count: kudos.length });
  } catch (error) {
    console.error('Error fetching sent kudos:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch sent kudos' });
  }
});

// Get kudos statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await getKudosStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch stats' });
  }
});

// Get leaderboard (top kudos recipients)
router.get('/leaderboard', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const leaderboard = await getLeaderboard(limit);
    res.json({ success: true, data: leaderboard });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch leaderboard' });
  }
});

// Get team members (for Kudos form)
router.get('/team-members', async (req, res) => {
  try {
    const slackClient = getSlackClient();
    const usersResult = await slackClient.users.list();
    const teamMembers = usersResult.members
      .filter(user => !user.deleted && !user.is_bot && user.id !== 'USLACKBOT')
      .map(user => ({
        id: user.id,
        name: user.real_name || user.name,
        displayName: user.profile?.display_name || user.real_name || user.name,
        email: user.profile?.email || null,
        image: user.profile?.image_72 || null,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    res.json({ success: true, data: teamMembers });
  } catch (error) {
    console.error('Error fetching team members:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch team members' });
  }
});

// Get channels (for Kudos form)
router.get('/channels', async (req, res) => {
  try {
    const slackClient = getSlackClient();
    const result = await slackClient.conversations.list({
      types: 'public_channel,private_channel',
      exclude_archived: true,
      limit: 1000, // Get a reasonable amount
    });

    const channels = result.channels
      .map(channel => ({
        id: channel.id,
        name: channel.name,
        is_private: channel.is_private,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    res.json({ success: true, data: channels });
  } catch (error) {
    console.error('Error fetching channels:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch channels' });
  }
});

// Send Kudos via web portal
router.post('/kudos/send', async (req, res) => {
  try {
    const { fromUserId, fromUserName, toUserId, message, emoji, visibility, sendDm, channelId } = req.body;

    // Validation
    if (!fromUserId || !fromUserName || !toUserId || !message) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: fromUserId, fromUserName, toUserId, message'
      });
    }

    if (message.length < 10) {
      return res.status(400).json({
        success: false,
        error: 'Message must be at least 10 characters long'
      });
    }

    // Get recipient info
    const slackClient = getSlackClient();
    let recipientName;
    try {
      const recipientInfo = await slackClient.users.info({ user: toUserId });
      recipientName = recipientInfo.user.real_name || recipientInfo.user.name;
    } catch (error) {
      console.error('Error fetching recipient info:', error);
      return res.status(400).json({ success: false, error: 'Invalid recipient user ID' });
    }

    const selectedEmoji = emoji || '🎉';
    const selectedVisibility = visibility || 'public';
    const shouldSendDm = sendDm !== false; // Default to true
    const shouldPostChannel = channelId && selectedVisibility === 'public';

    // Format kudos message
    const visibilityLabel = selectedVisibility === 'private' ? '🔒 Private' : '🌐 Public';
    const kudosMessage = `${selectedEmoji} *Kudos to <@${toUserId}>!* ${visibilityLabel}\n\n*From:* <@${fromUserId}>\n*Message:* ${message}`;

    let sentDm = false;
    let sentChannel = false;
    let channelName = null;

    // Send DM if requested
    if (shouldSendDm) {
      try {
        await slackClient.chat.postMessage({
          channel: toUserId,
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

    // Post to channel if requested and public
    if (shouldPostChannel && channelId) {
      try {
        const channelInfo = await slackClient.conversations.info({ channel: channelId });
        channelName = channelInfo.channel.name;

        await slackClient.chat.postMessage({
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
      fromUserId,
      fromUserName,
      toUserId,
      toUserName: recipientName,
      message,
      channelId: shouldPostChannel ? channelId : null,
      channelName,
      sentDm,
      sentChannel,
      visibility: selectedVisibility,
    });

    res.json({
      success: true,
      message: 'Kudos sent successfully!',
      data: {
        sentDm,
        sentChannel,
        visibility: selectedVisibility,
      }
    });
  } catch (error) {
    console.error('Error sending kudos:', error);
    res.status(500).json({ success: false, error: 'Failed to send kudos' });
  }
});

export default router;

