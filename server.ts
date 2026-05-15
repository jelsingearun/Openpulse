import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs-extra';
import { orchestrator } from './app/core/orchestrator.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', engine: 'OpenPulse v1' });
  });

  app.post('/api/jobs', async (req, res) => {
    try {
      const jobId = await orchestrator.createJob();
      res.json({ jobId });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/jobs/:id', (req, res) => {
    const job = orchestrator.getJob(req.params.id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    res.json(job);
  });

  // Serve generated renders
  const rendersPath = path.join(__dirname, 'generated/renders');
  await fs.ensureDir(rendersPath);
  app.use('/generated/renders', express.static(rendersPath));

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`OpenPulse Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
