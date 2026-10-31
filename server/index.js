import http from 'node:http';
import crypto from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'inscriptions.json');
const PORT = process.env.PORT || 3002;

// Mot de passe admin : défini via la variable d'environnement ADMIN_PASSWORD
// sur ton hébergeur. En local, si elle n'est pas définie, "ucae2026" est
// utilisé par défaut — change-le avant la mise en production.
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'ucae2026';

// Jetons de connexion valides, gardés en mémoire (perdus au redémarrage du
// serveur, donc il faudra se reconnecter après un redéploiement — normal
// pour un site de cette taille, pas besoin d'une vraie base de sessions).
const validTokens = new Set();

function isAuthorized(req) {
    const header = req.headers['authorization'] || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';
    return token.length > 0 && validTokens.has(token);
}

async function ensureDataFile() {
    await fs.mkdir(DATA_DIR, { recursive: true });

    try {
        await fs.access(DATA_FILE);
    } catch {
        await fs.writeFile(DATA_FILE, JSON.stringify([], null, 2), 'utf-8');
    }
}

async function readInscriptions() {
    await ensureDataFile();
    const content = await fs.readFile(DATA_FILE, 'utf-8');

    try {
        const parsed = JSON.parse(content);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

async function writeInscriptions(entries) {
    await ensureDataFile();
    await fs.writeFile(DATA_FILE, JSON.stringify(entries, null, 2), 'utf-8');
}

function sendJson(res, statusCode, payload) {
    res.writeHead(statusCode, {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    });
    res.end(JSON.stringify(payload));
}

async function handlePost(req, res) {
    let rawBody = '';

    req.on('data', (chunk) => {
        rawBody += chunk;
    });

    req.on('end', async () => {
        try {
            const payload = rawBody ? JSON.parse(rawBody) : {};

            const { nom, tel, facebook, message, sessions } = payload;

            if (!nom || !tel || !message || !Array.isArray(sessions) || sessions.length === 0) {
                sendJson(res, 400, { error: 'Champs requis: nom, tel, message, sessions.' });
                return;
            }

            const entries = await readInscriptions();
            const createdAt = new Date().toISOString();
            const record = {
                id: Date.now(),
                createdAt,
                nom,
                tel,
                facebook: facebook || '',
                message,
                sessions,
            };

            entries.push(record);
            await writeInscriptions(entries);

            sendJson(res, 201, {
                ok: true,
                message: 'Inscription enregistrée.',
                data: record,
            });
        } catch {
            sendJson(res, 400, { error: 'JSON invalide.' });
        }
    });
}

async function handleGet(req, res) {
    if (!isAuthorized(req)) {
        sendJson(res, 401, { error: 'Non autorisé. Connecte-toi via /admin.' });
        return;
    }

    const entries = await readInscriptions();
    sendJson(res, 200, { ok: true, data: entries });
}

async function handleLogin(req, res) {
    let rawBody = '';

    req.on('data', (chunk) => {
        rawBody += chunk;
    });

    req.on('end', () => {
        try {
            const payload = rawBody ? JSON.parse(rawBody) : {};
            const { password } = payload;

            if (password !== ADMIN_PASSWORD) {
                sendJson(res, 401, { error: 'Mot de passe incorrect.' });
                return;
            }

            const token = crypto.randomBytes(24).toString('hex');
            validTokens.add(token);

            sendJson(res, 200, { ok: true, token });
        } catch {
            sendJson(res, 400, { error: 'JSON invalide.' });
        }
    });
}

const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);

    if (req.method === 'OPTIONS') {
        sendJson(res, 200, { ok: true });
        return;
    }

    if (req.method === 'GET' && url.pathname === '/api/inscriptions') {
        await handleGet(req, res);
        return;
    }

    if (req.method === 'POST' && url.pathname === '/api/inscriptions') {
        await handlePost(req, res);
        return;
    }

    if (req.method === 'POST' && url.pathname === '/api/login') {
        await handleLogin(req, res);
        return;
    }

    sendJson(res, 404, { error: 'Route introuvable.' });
});

server.listen(PORT, () => {
    console.log(`Serveur Node démarré sur http://localhost:${PORT}`);
});