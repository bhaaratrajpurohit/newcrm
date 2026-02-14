module.exports = (req, res) => {
    // Enable CORS for external webhooks
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method === 'POST') {
        const { action, from, to, subject, batch_id, lead_id, metadata } = req.body;

        // Log activity
        console.log('[TRACK-ACTIVITY API] Received:', {
            action,
            from,
            to: to?.substring(0, 20) + '...',
            batch_id,
            timestamp: new Date().toISOString()
        });

        // In production, this would:
        // 1. Store in database
        // 2. Update analytics
        // 3. Trigger webhooks/notifications

        return res.status(200).json({
            success: true,
            activity_id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            message: 'Activity logged successfully'
        });
    }

    return res.status(405).json({ error: 'Method not allowed' });
};
