import express from 'express';
import {
  getKudosByUser,
  getAllKudos,
  getKudosSentByUser,
  getKudosStats,
  getLeaderboard,
} from '../database.js';

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

export default router;

