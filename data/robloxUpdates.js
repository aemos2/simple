const fs = require("fs");
const path = require("path");
const { EmbedBuilder } = require("discord.js");

const CONFIG_FILE = path.join(__dirname, "data", "roblox-updates.json");
const API_URL = "https://weao.xyz/api/versions/current";

const PLATFORMS = ["Windows", "Mac", "Android", "iOS"];

function ensureDataFile() {
    const dir = path.dirname(CONFIG_FILE);

    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
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
    } catch (error) {
        console.error("Roblox config read error:", error);

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
        throw new Error(`WEAO API returned HTTP ${response.status}`);
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
    return new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle("LIVE")
        .setDescription(
            "**Live update detected!**\n" +
            "A new ROBLOX LIVE version is out. Roblox will be updated shortly."
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
                name: "Version Number",
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
            text: "Roblox Live Version Checker"
        })
        .setTimestamp();
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
        for (const platform of PLATFORMS) {
            const oldVersion = previousVersions[platform]?.version;
            const newVersion = versions[platform]?.version;

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

    const platformsToSend = force
        ? PLATFORMS
        : changedPlatforms;

    const channel = await client.channels
        .fetch(config.channelId)
        .catch(() => null);

    if (
        platformsToSend.length > 0 &&
        (!channel || !channel.isTextBased() || !channel.send)
    ) {
        return {
            success: false,
            reason: "CHANNEL_NOT_FOUND",
            versions
        };
    }

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

    // Save only after successful notification sending.
    config.lastVersions = versions;
    saveConfig(config);

    return {
        success: true,
        updated: platformsToSend.length > 0,
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

