module.exports = (req, res) => {
    // Enable CORS for n8n
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method === 'POST') {
        const { leads, batch_id, filename, timestamp, sender_email } = req.body;

        // Log the incoming request
        console.log('[SEND-EMAIL API] Received:', {
            batch_id,
            filename,
            leads_count: leads?.length || 0,
            timestamp
        });

        // In a real implementation, this would:
        // 1. Queue emails for sending via Zoho API
        // 2. Return job IDs for tracking
        // 3. Store activity logs

        // For now, just acknowledge receipt
        return res.status(200).json({
            success: true,
            message: `Batch received: ${leads?.length || 0} leads`,
            batch_id,
            timestamp: new Date().toISOString()
        });
    }

    return res.status(405).json({ error: 'Method not allowed' });
};
