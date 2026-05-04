import express from 'express';
import { createServer as createViteServer } from 'vite';
import { google } from 'googleapis';
import path from 'path';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cookieParser(process.env.SESSION_SECRET || 'kinettix-secret'));

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  // We'll determine the redirect URI dynamically in the request
);

// Helper to get dynamically generated app URL
const getBaseUrl = (req: express.Request) => {
  return `${req.protocol}://${req.get('host')}`;
};

// --- API Routes ---

const FETCH_ROSTER_URL = 'https://script.google.com/macros/s/AKfycbzzEqwPiILxfZo4tp0lrTXKAI8pDLHFCKmzCRh_2wa2Y2KoqxKTz5znQW3X0-BT-bEoUA/exec';

// Proxy for fetching roster to bypass CORS
app.get('/api/roster', async (req, res) => {
  try {
    const fetchUrl = `${FETCH_ROSTER_URL}?t=${Date.now()}`;
    console.log('Proxying fetch to Google Apps Script:', fetchUrl);
    const response = await fetch(fetchUrl);
    
    if (!response.ok) {
      throw new Error(`Google Script returned ${response.status}: ${response.statusText}`);
    }

    const text = await response.text();
    const trimmed = text.trim();

    // 1. Try JSON parsing first (Apps Scripts often return JSON)
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        const data = JSON.parse(trimmed);
        return res.json(data);
      } catch (e) {
        console.warn('JSON parsing failed, falling back to CSV');
      }
    }

    // 2. Check for HTML (Google login page or error)
    if (trimmed.toLowerCase().includes('<!doctype h') || trimmed.toLowerCase().includes('<html')) {
      return res.status(500).json({ 
        error: 'The Google script returned a login page or an error. Please ensure the Apps Script is deployed as "Web App" and set to "Access: Anyone".',
        isHtml: true,
        preview: trimmed.substring(0, 100)
      });
    }

    // 3. Fallback to CSV parsing
    const lines = trimmed.split(/\r?\n/).filter(l => l.trim().length > 0);
    let startIndex = 0;
    if (lines.length > 0) {
      const firstLine = lines[0].toLowerCase();
      if (firstLine.includes('name') || firstLine.includes('gender')) {
        startIndex = 1;
      }
    }

    const data = lines.slice(startIndex).map(line => {
      const parts = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(p => p.trim().replace(/^"|"$/g, ''));
      return {
        name: parts[0] || 'Unknown',
        gender: parts[1] || 'Other',
        supervisor: parts[2] || ''
      };
    });

    return res.json(data);
  } catch (error) {
    console.error('Proxy fetch error:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to reach Google script' });
  }
});

app.get('/api/auth/status', (req, res) => {
  res.json({ authenticated: false });
});

// --- Vite Middleware ---
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
