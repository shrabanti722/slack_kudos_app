import express from 'express';
import {
  getKudosByUser,
  getAllKudos,
  getKudosSentByUser,
  getKudosStats,
  getLeaderboard,
} from '../database.js';

const router = express.Router();

// Get all kudos (with optional limit)
router.get('/kudos', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const kudos = await getAllKudos(limit);
    res.json({ success: true, data: kudos, count: kudos.length });
  } catch (error) {
    console.error('Error fetching kudos:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch kudos' });
  }
});

// Get kudos received by a specific user
router.get('/kudos/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit) || 10;
    const kudos = await getKudosByUser(userId, limit);
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

