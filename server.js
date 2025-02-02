const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const feedbackFile = path.join(__dirname, 'feedbacks.json');

// Ensure file exists
if (!fs.existsSync(feedbackFile)) {
  fs.writeFileSync(feedbackFile, '[]', 'utf8');
}

app.post('/submit-feedback', (req, res) => {
  const { name, email, comments } = req.body;

  fs.readFile(feedbackFile, 'utf8', (err, data) => {
    const feedbacks = data ? JSON.parse(data) : [];
    feedbacks.push({ name, email, comments, date: new Date() });
    fs.writeFile(feedbackFile, JSON.stringify(feedbacks, null, 2), 'utf8', () => {
      res.send(`
        <h1 style="font-family:sans-serif;color:green;">Thank you for your feedback!</h1>
        <p style="font-family:sans-serif;">We appreciate your input and will use it to improve.</p>
        <a href="/">Back to Home</a>
      `);
    });
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
