```js
const fs = require("fs");
const path = require("path");
const { EmbedBuilder } = require("discord.js");

const CONFIG_FILE = path.join(__dirname, "data", "roblox-updates.json");
const API_URL = "https://weao.xyz/api/versions/current";

const PLATFORMS = ["Windows", "Mac", "Android", "iOS"];

function ensureDataFile() {
    const dataDir = path.dirname(CONFIG_FILE);

    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }

    if (!fs.existsSync(CONFIG_FILE)) {
        fs.writeFileSync(
            CONFIG_FILE,
            JSON.stringify({
                channelId: null,
                lastVersions: null
            }, null, 2)
        );
    }
}

function loadConfig() {
    ensureDataFile();

    try {
        return JSON.parse(
            fs.readFileSync(CONFIG_FILE, "utf8")
        );
    } catch {
        return {
            channelId: null,
            lastVersions: null
        };
    }
}

function saveConfig(config) {
    ensureDataFile();

    fs.writeFileSync(
        CONFIG_FILE,
        JSON.stringify(config, null, 2)
    );
}

async function getRobloxVersions() {
    const response = await fetch(API_URL, {
        headers: {
            "User-Agent": "Discord-Roblox-Version-Checker/1.0"
        },
        signal: AbortSignal.timeout(15000)
    });

    if (!response.ok) {
        throw new Error(
            `WEAO API returned HTTP ${response.status}`
        );
    }

    const data = await response.json();

    return {
        Windows: {
            version: data.Windows || "Unknown",
            date: data.WindowsDate || null,
            detailedVersion: data.WindowsResponse?.version || null
        },

        Mac: {
            version: data.Mac || "Unknown",
            date: data.MacDate || null,
            detailedVersion: data.MacResponse?.version || null
        },

        Android: {
            version: data.Android || "Unknown",
            date: data.AndroidDate || null,
            detailedVersion: data.AndroidResponse?.version || null
        },

        iOS: {
            version: data.iOS || "Unknown",
            date: data.iOSDate || null,
            detailedVersion: data.iOSResponse?.version || null
        }
    };
}

function buildUpdateEmbed(platform, info) {
    const embed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle("LIVE")
        .setDescription(
            "**ROBLOX update detected**\n" +
            "A new ROBLOX LIVE version is out."
        )
        .addFields(
            {
                name: "Platform",
                value: platform,
                inline: false
            },
            {
                name: "Roblox Version",
                value: `\`${info.version}\``,
                inline: false
            },
            {
                name: "Version",
                value: `\`${info.detailedVersion || "Unknown"}\``,
                inline: false
            },
            {
                name: "Detected",
                value: `<t:${Math.floor(Date.now() / 1000)}:F>`,
                inline: false
            }
        )
        .setFooter({
            text: "Update Checker"
        })
        .setTimestamp();

    return embed;
}

async function checkRobloxUpdates(client, options = {}) {
    const {
        force = false,
        sendInitial = false
    } = options;

    const config = loadConfig();

    if (!config.channelId) {
        return {
            success: false,
            reason: "NO_CHANNEL"
        };
    }

    const versions = await getRobloxVersions();

    const previousVersions = config.lastVersions;
    const changedPlatforms = [];

    // First run: save the current versions without announcing
    // unless sendInitial is explicitly enabled.
    if (previousVersions) {
        for (const platform of PLATFORMS) {
            const oldVersion =
                previousVersions[platform]?.version;

            const newVersion =
                versions[platform]?.version;

            if (
                oldVersion &&
                newVersion &&
                oldVersion !== "Unknown" &&
                newVersion !== "Unknown" &&
                oldVersion !== newVersion
            ) {
                changedPlatforms.push(platform);
            }
        }
    } else if (sendInitial) {
        changedPlatforms.push(...PLATFORMS);
    }

    // Save the latest versions.
    config.lastVersions = versions;
    saveConfig(config);

    const platformsToSend = force
        ? PLATFORMS
        : changedPlatforms;

    if (platformsToSend.length === 0) {
        return {
            success: true,
            updated: false,
            versions
        };
    }

    const channel = await client.channels
        .fetch(config.channelId)
        .catch(() => null);

    if (!channel) {
        return {
            success: false,
            reason: "CHANNEL_NOT_FOUND",
            versions
        };
    }

    if (!channel.isTextBased() || !channel.send) {
        return {
            success: false,
            reason: "CHANNEL_NOT_TEXT_BASED",
            versions
        };
    }

    // Send one separate notification for each changed platform.
    for (const platform of platformsToSend) {
        const embed = buildUpdateEmbed(
            platform,
            versions[platform]
        );

        await channel.send({
            content: "@here",
            embeds: [embed],
            allowedMentions: {
                parse: ["everyone"]
            }
        });
    }

    return {
        success: true,
        updated: true,
        changedPlatforms: platformsToSend,
        versions
    };
}

function setRobloxChannel(channelId) {
    const config = loadConfig();

    config.channelId = channelId;

    saveConfig(config);
}

function getRobloxChannel() {
    return loadConfig().channelId;
}

module.exports = {
    API_URL,
    getRobloxVersions,
    checkRobloxUpdates,
    setRobloxChannel,
    getRobloxChannel,
    loadConfig
};
```
