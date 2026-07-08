const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 7001;

function loadConfig() {
    const dockerConfig = "/app/profile.ini";
    const localConfig = path.join(__dirname, "deploy", "profile.ini");

    const configPath = fs.existsSync(dockerConfig)
        ? dockerConfig
        : localConfig;

    const content = fs.readFileSync(configPath, "utf8");

    const config = {};

    content.split(/\r?\n/).forEach((line) => {
        const l = line.trim();

        if (!l || l.startsWith("#")) {
            return;
        }

        const idx = l.indexOf("=");

        if (idx > 0) {
            config[l.substring(0, idx).trim()] =
                l.substring(idx + 1).trim();
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