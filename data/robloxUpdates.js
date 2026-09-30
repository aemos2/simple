const fs = require("fs");
const path = require("path");
const { EmbedBuilder } = require("discord.js");

const CONFIG_FILE = path.join(__dirname, "data", "roblox-updates.json");
const API_URL = "https://weao.xyz/api/versions/current";

function ensureDataFile() {
    const dataDir = path.dirname(CONFIG_FILE);

    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }

    if (!fs.existsSync(CONFIG_FILE)) {
        fs.writeFileSync(
            CONFIG_FILE,
            JSON.stringify(
                {
                    channelId: null,
                    lastVersions: null
                },
                null,
                2
            )
        );
    }
}

function loadConfig() {
    ensureDataFile();

    try {
        return JSON.parse(fs.readFileSync(CONFIG_FILE, "utf8"));
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
        }
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
            detailedVersion:
                data.WindowsResponse?.version || null
        },

        Mac: {
            version: data.Mac || "Unknown",
            date: data.MacDate || null,
            detailedVersion:
                data.MacResponse?.version || null
        },

        Android: {
            version: data.Android || "Unknown",
            date: data.AndroidDate || null,
            detailedVersion:
                data.AndroidResponse?.version || null
        },

        iOS: {
            version: data.iOS || "Unknown",
            date: data.iOSDate || null,
            detailedVersion:
                data.iOSResponse?.version || null
        }
    };
}

function versionsChanged(oldVersions, newVersions) {
    if (!oldVersions) return true;

    return JSON.stringify(oldVersions) !== JSON.stringify(newVersions);
}

function buildUpdateEmbed(versions, changedPlatforms = null) {
    const embed = new EmbedBuilder()
        .setTitle("Roblox Version Update!")
        .setDescription(
            changedPlatforms
                ? `A Roblox client version update was detected for: ${changedPlatforms.join(", ")}.`
                : "Current Roblox client versions."
        )
        .addFields(
            {
                name: "Windows",
                value:
                    `Client: \`${versions.Windows.version}\`\n` +
                    `Version: \`${versions.Windows.detailedVersion || "Unknown"}\`\n` +
                    `Updated: ${versions.Windows.date || "Unknown"}`,
                inline: false
            },
            {
                name: "Mac",
                value:
                    `Client: \`${versions.Mac.version}\`\n` +
                    `Version: \`${versions.Mac.detailedVersion || "Unknown"}\`\n` +
                    `Updated: ${versions.Mac.date || "Unknown"}`,
                inline: false
            },
            {
                name: "Android",
                value:
                    `Version: \`${versions.Android.version}\`\n` +
                    `Updated: ${versions.Android.date || "Unknown"}`,
                inline: false
            },
            {
                name: "iOS",
                value:
                    `Version: \`${versions.iOS.version}\`\n` +
                    `Updated: ${versions.iOS.date || "Unknown"}`,
                inline: false
            }
        )
        .setFooter({
            text: "Source: WEAO"
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

    if (previousVersions) {
        for (const platform of [
            "Windows",
            "Mac",
            "Android",
            "iOS"
        ]) {
            const oldVersion =
                previousVersions[platform]?.version;

            const newVersion =
                versions[platform]?.version;

            if (oldVersion !== newVersion) {
                changedPlatforms.push(platform);
            }
        }
    }

    const shouldSend =
        force ||
        sendInitial ||
        changedPlatforms.length > 0;

    config.lastVersions = versions;
    saveConfig(config);

    if (!shouldSend) {
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

    if (!channel.isTextBased()) {
        return {
            success: false,
            reason: "CHANNEL_NOT_TEXT_BASED",
            versions
        };
    }

    const embed = buildUpdateEmbed(
        versions,
        changedPlatforms.length
            ? changedPlatforms
            : null
    );

    await channel.send({
        embeds: [embed]
    });

    return {
        success: true,
        updated: true,
        changedPlatforms,
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
