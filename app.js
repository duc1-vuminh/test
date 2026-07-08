const express = require("express");
const fs = require("fs");
const path = require("path");
const app = express();
const PORT = 7001;

function loadConfig() {
    const configPath = path.join(__dirname, "deploy", "profile.ini");

    const content = fs.readFileSync(configPath, "utf8");

    const config = {};

    content.split(/\r?\n/).forEach((line) => {
        const l = line.trim();

        if (!l || l.startsWith("#")) {
            return;
        }

        const idx = l.indexOf("=");

        if (idx > 0) {
            const key = l.substring(0, idx).trim();
            const value = l.substring(idx + 1).trim();

            config[key] = value;
        }
    });

    return config;
}

const config = loadConfig();

app.get("/healthcheck", (req, res) => {
    res.status(200).json({
        status: "UP",
    });
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Listening on ${config.host}:${PORT}`);
});