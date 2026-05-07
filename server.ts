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

const GAS_API_URL = 'https://script.google.com/macros/s/AKfycbztNN6DjyDAsmG5PNHvnT_JXQbq_letebjTMCHGIqLbwxIg_dl9-d4fWkIBA3LdUqzM/exec';

// Proxy for fetching data from GAS
app.get('/api/fetchData', async (req, res) => {
  try {
    const url = `${GAS_API_URL}?function=fetchData&action=fetchData&t=${Date.now()}`;
    console.log('Fetching from GAS (GET):', url);
    let response = await fetch(url);
    let text = await response.text();
    
    // Check if doGet is missing or if the response is HTML
    if (text.includes('doGet') || text.includes('script function was not found') || text.includes('找不到以下指令碼函式') || response.status === 405) {
      console.log('GET failed (doGet likely missing), trying POST...');
      const postResponse = await fetch(GAS_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ function: 'fetchData', action: 'fetchData' })
      });
      if (postResponse.ok) {
        const postText = await postResponse.text();
        if (!postText.includes('doPost') && !postText.includes('找不到以下指令碼函式')) {
          response = postResponse;
          text = postText;
        }
      }
    }

    if (!response.ok) {
       console.error(`GAS Fetch Error ${response.status}:`, text.substring(0, 1000));
       return res.status(response.status).json({ error: `GAS returned ${response.status}` });
    }

    if (text.trim().toLowerCase().includes('<!doctype') || text.trim().toLowerCase().includes('<html')) {
       console.error('GAS returned HTML:', text.substring(0, 1000));
       
       let errorMsg = 'Your Google Apps Script is not configured correctly.';
       if (text.includes('doGet') || text.includes('doPost') || text.includes('找不到以下指令碼函式')) {
         errorMsg = 'CRITICAL: Your Google Script is missing the required entry points (doGet or doPost).';
       } else if (text.includes('Google Account')) {
         errorMsg = 'PERMISSIONS ERROR: Set deployment to "Access: Anyone".';
       }

       return res.status(500).json({ 
         error: errorMsg,
         details: 'Ensure your script has: function doGet(e) { return ContentService.createTextOutput(JSON.stringify(fetchData())).setMimeType(ContentService.MimeType.JSON); } and a similar doPost for saving.'
       });
    }

    try {
      res.json(JSON.parse(text));
    } catch (e) {
      console.error('Failed to parse GAS response as JSON:', text.substring(0, 500));
      res.status(500).json({ error: 'GAS response was not valid JSON' });
    }
  } catch (error) {
    console.error('Proxy fetch exception:', error);
    res.status(500).json({ error: 'Failed to fetch data from Island Records' });
  }
});

// Proxy for saving data to GAS
app.post('/api/saveData', async (req, res) => {
  try {
    console.log('Saving to GAS (POST):', GAS_API_URL);
    const body = {
      function: 'saveData',
      action: 'saveData',
      data: req.body.data || req.body
    };

    let response = await fetch(GAS_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    
    let result = await response.text();
    
    // Check if doPost is missing
    if (result.includes('doPost') || result.includes('找不到以下指令碼函式') || response.status === 405) {
      console.log('POST failed (doPost missing), trying GET fallback for save...');
      const getData = encodeURIComponent(JSON.stringify(body.data));
      const getUrl = `${GAS_API_URL}?function=saveData&action=saveData&data=${getData}`;
      const getResponse = await fetch(getUrl);
      if (getResponse.ok) {
        const getText = await getResponse.text();
        if (!getText.includes('doGet') && !getText.includes('找不到以下指令碼函式')) {
          response = getResponse;
          result = getText;
        }
      }
    }

    if (!response.ok) {
      console.error(`GAS Save Error ${response.status}:`, result.substring(0, 1000));
    }

    if (result.trim().toLowerCase().includes('<!doctype') || result.trim().toLowerCase().includes('<html')) {
       console.error('GAS Save returned HTML:', result.substring(0, 1000));
       
       let errorMsg = 'Your Google Apps Script is not configured correctly for saving.';
       if (result.includes('doPost') || result.includes('doGet')) {
         errorMsg = 'MISSING FUNCTION: Your Apps Script misses doGet/doPost to handle the save request.';
       }

       return res.status(500).json({ 
         error: errorMsg,
         details: 'Ensure your script has a doPost(e) function.'
       });
    }

    try {
      res.json(JSON.parse(result));
    } catch {
      if (response.ok) {
        res.json({ status: 'success', message: 'Data saved successfully' });
      } else {
        res.status(response.status).send(result);
      }
    }
  } catch (error) {
    console.error('Proxy save exception:', error);
    res.status(500).json({ error: 'Failed to save data to Island Records' });
  }
});

app.get('/api/roster', async (req, res) => {
  try {
    const fetchUrl = `${GAS_API_URL}?action=fetchData&t=${Date.now()}`;
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
