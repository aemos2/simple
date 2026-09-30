const fs = require("fs");
const path = require("path");

const CONFIG_FILE = path.join(__dirname, "data", "updates.json");
const API_URL = process.env.UPDATE_API_URL || "";

function load() {
    if (!fs.existsSync(CONFIG_FILE)) {
        return { channelId: null, last: {} };
    }

    try {
        return JSON.parse(fs.readFileSync(CONFIG_FILE, "utf8"));
    } catch {
        return { channelId: null, last: {} };
    }
}

function save(data) {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(data, null, 2));
}

function normalizeItems(data) {
    if (Array.isArray(data)) return data;

    if (Array.isArray(data.items)) return data.items;
    if (Array.isArray(data.services)) return data.services;
    if (Array.isArray(data.software)) return data.software;
    if (Array.isArray(data.results)) return data.results;

    return [];
}

function getName(item) {
    return String(item.name ?? item.title ?? item.product ?? item.service ?? "Unknown");
}

function getVersion(item) {
    return String(item.version ?? item.latest_version ?? item.latestVersion ?? item.release ?? "Unknown");
}

function getStatus(item) {
    return String(item.status ?? item.state ?? "Unknown");
}

async function checkUpdates(client, manual = false) {
    const config = load();

    if (!config.channelId) return "no-channel";
    if (!API_URL) {
        console.error("UPDATE_API_URL is not configured.");
        return "error";
    }

    const channel = await client.channels.fetch(config.channelId).catch(() => null);

    if (!channel || !channel.isTextBased()) {
        console.error("Configured update channel could not be found.");
        return "error";
    }

    try {
        const response = await fetch(API_URL, {
            headers: {
                "User-Agent": "Discord-Update-Checker/1.0"
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        const items = normalizeItems(data);

        if (!items.length) {
            return "no-updates";
        }

        let changed = false;

        for (const item of items) {
            const name = getName(item);
            const version = getVersion(item);
            const status = getStatus(item);

            const key = name.toLowerCase();
            const current = `${version}|${status}`;

            if (config.last[key] === current) continue;

            if (config.last[key] !== undefined || manual) {
                await channel.send(
                    `Update detected\n\n` +
                    `Software: ${name}\n` +
                    `Version: ${version}\n` +
                    `Status: ${status}`
                );
                changed = true;
            }

            config.last[key] = current;
        }

        save(config);

        return changed ? "updated" : "no-updates";
    } catch (error) {
        console.error("Update checker error:", error);
        return "error";
    }
}

module.exports = { checkUpdates };
