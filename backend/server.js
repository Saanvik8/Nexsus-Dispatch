require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const fleetRoutes = require('./routes/fleet');

const app = express();
const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/nexus_dispatch';

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'nexus-dispatch-api', time: new Date().toISOString() });
});

app.use('/api/fleet', fleetRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found.' });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Unexpected server error.' });
});

async function start() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('[nexus-dispatch] connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`[nexus-dispatch] API listening on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('[nexus-dispatch] failed to connect to MongoDB:', err.message);
    process.exit(1);
  }
}

start();
