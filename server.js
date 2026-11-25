const express = require('express');
const path = require('node:path');
const fs = require('node:fs/promises');
const crypto = require('node:crypto');

function createApp({ feedbackFile = process.env.FEEDBACK_FILE || path.join(__dirname, 'feedbacks.json') } = {}) {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.static(path.join(__dirname, 'public')));
  app.use(express.urlencoded({ extended: false, limit: '16kb' }));
  app.use(express.json({ limit: '16kb' }));
  // Serialize mutations within this demo process. Multi-worker deployment needs a database.
  let pending = Promise.resolve();
  app.post('/submit-feedback', async (req, res) => {
    const { name, email, comments } = req.body || {};
    const text = (value, max) => typeof value === 'string' && value.trim().length > 0 && value.length <= max;
    if (!text(name, 100) || !text(email, 254) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !text(comments, 5000)) {
      return res.status(400).json({ ok: false, error: 'Provide a name, valid email, and message within the field limits.' });
    }
    const save = async () => {
      let feedbacks;
      try { feedbacks = JSON.parse(await fs.readFile(feedbackFile, 'utf8')); }
      catch (error) { if (error.code === 'ENOENT') feedbacks = []; else throw error; }
      if (!Array.isArray(feedbacks)) throw new Error('Invalid storage format');
      feedbacks.push({ name: name.trim(), email: email.trim(), comments: comments.trim(), date: new Date().toISOString() });
      const temporary = `${feedbackFile}.${crypto.randomUUID()}.tmp`;
      try {
        await fs.writeFile(temporary, JSON.stringify(feedbacks, null, 2), { mode: 0o600, flag: 'wx' });
        await fs.rename(temporary, feedbackFile);
      } finally { await fs.unlink(temporary).catch(() => {}); }
    };
    const result = pending.then(save);
    pending = result.catch(() => {});
    try {
      await result;
      return res.type('html').send('<h1>Thank you for your feedback!</h1><p>Your feedback has been saved.</p><a href="/">Back to Home</a>');
    } catch {
      return res.status(503).json({ ok: false, error: 'We could not save the feedback. Please try again.' });
    }
  });
  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    const status = error.type === 'entity.too.large' ? 413 : error.type === 'entity.parse.failed' ? 400 : 500;
    res.status(status).json({ ok: false, error: status === 413 ? 'Request is too large.' : 'Request could not be processed.' });
  });
  return app;
}

if (require.main === module) createApp().listen(Number(process.env.PORT || 3000), '127.0.0.1', () => console.log('Feedback demo listening on localhost.'));
module.exports = { createApp };
