import http from "node:http";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import newsHandler from "./api/news.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = Number(process.env.PORT || 3000);

const contentTypes = {
    ".css": "text/css; charset=utf-8",
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".png": "image/png",
};

await loadLocalEnv();

const server = http.createServer(async (req, res) => {
    const requestUrl = new URL(req.url, `http://${req.headers.host}`);

    if (requestUrl.pathname === "/api/news") {
        await runNewsHandler(req, res, requestUrl);
        return;
    }

    await serveStaticFile(requestUrl.pathname, res);
});

server.listen(PORT, () => {
    console.log(`News App running at http://localhost:${PORT}`);
});

async function serveStaticFile(urlPath, res) {
    const safePath = urlPath === "/" ? "index.html" : decodeURIComponent(urlPath).replace(/^\/+/, "");
    const filePath = path.normalize(path.join(__dirname, safePath));

    if (!filePath.startsWith(__dirname) || !existsSync(filePath)) {
        sendJson(res, 404, { message: "Not found" });
        return;
    }

    try {
        const ext = path.extname(filePath);
        const body = await readFile(filePath);
        res.writeHead(200, {
            "Content-Type": contentTypes[ext] || "application/octet-stream",
        });
        res.end(body);
    } catch (error) {
        sendJson(res, 500, { message: "Could not read file" });
    }
}

async function runNewsHandler(req, res, requestUrl) {
    req.query = Object.fromEntries(requestUrl.searchParams);

    res.status = (statusCode) => {
        res.statusCode = statusCode;
        return res;
    };
    res.json = (payload) => sendJson(res, res.statusCode || 200, payload);

    await newsHandler(req, res);
}

function sendJson(res, statusCode, payload) {
    if (!res.headersSent) {
        res.writeHead(statusCode, {
            "Content-Type": "application/json; charset=utf-8",
        });
    }
    res.end(JSON.stringify(payload));
}

async function loadLocalEnv() {
    const envPath = path.join(__dirname, ".env.local");

    if (!existsSync(envPath)) return;

    try {
        const content = await readFile(envPath, "utf8");

        content.split(/\r?\n/).forEach((line) => {
            const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)=(.*)\s*$/);

            if (!match) return;

            const [, key, rawValue] = match;
            const value = rawValue.replace(/^["']|["']$/g, "");

            if (!process.env[key]) {
                process.env[key] = value;
            }
        });
    } catch (error) {
        console.warn("Could not read .env.local");
    }
}
