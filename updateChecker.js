const fs = require("fs");
const path = require("path");
const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder
} = require("discord.js");

const CONFIG_FILE = path.join(__dirname, "data", "updates.json");

const API_URL = process.env.UPDATE_API_URL || "";

function load() {
    if (!fs.existsSync(CONFIG_FILE)) {
        return {
            channelId: null,
            last: {}
        };
    }

    try {
        return JSON.parse(
            fs.readFileSync(CONFIG_FILE, "utf8")
        );
    } catch {
        return {
            channelId: null,
            last: {}
        };
    }
}

function save(data) {
    fs.writeFileSync(
        CONFIG_FILE,
        JSON.stringify(data, null, 2)
    );
}

function getItems(data) {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.items)) return data.items;
    if (Array.isArray(data.services)) return data.services;
    if (Array.isArray(data.software)) return data.software;
    if (Array.isArray(data.results)) return data.results;

    return [];
}

function getName(item) {
    return String(
        item.name ??
        item.title ??
        item.product ??
        item.service ??
        "Unknown"
    );
}

function getVersion(item) {
    return String(
        item.version ??
        item.latest_version ??
        item.latestVersion ??
        "Unknown"
    );
}

function getRbxVersion(item) {
    return String(
        item.rbxversion ??
        "Unknown"
    );
}

function getStatus(item) {
    return String(
        `detected: ${item.detected ?? item.state ?? "Unknown"}`
    );
}

function getDownloadUrl(item) {
    return (
        item.websitelink ??
        item.downloadUrl ??
        item.download_url ??
        item.url ??
        null
    );
}

async function checkUpdates(client) {
    const config = load();

    if (!config.channelId) {
        return "no-channel";
    }

    if (!API_URL) {
        console.error("UPDATE_API_URL is not configured.");
        return "error";
    }

    const channel = await client.channels
        .fetch(config.channelId)
        .catch(() => null);

    if (!channel || !channel.isTextBased()) {
        return "error";
    }

    try {
        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        const items = getItems(data);

        if (!items.length) {
            return "no-updates";
        }

        let changed = false;

        for (const item of items) {
            const name = getName(item);
            const version = getVersion(item);
            const status = getStatus(item);

            const downloadUrl = getDownloadUrl(item);
            const websiteUrl = getWebsiteUrl(item);

            const key = name.toLowerCase();
            const current = `${version}|${status}`;

            if (config.last[key] === current) {
                continue;
            }

            if (config.last[key] !== undefined) {
                const embed = new EmbedBuilder()
                    .setTitle("Update !")
                    .setDescription(`**${name}** updated.`)
                    .addFields(
                        {
                            name: "Version",
                            value: version,
                            inline: true
                        },
                        {
                            name: "Roblox Version",
                            value: rbxVersion,
                            inline: true
                        },
                        {
                            name: "Status",
                            value: status,
                            inline: true
                        }
                    )
                    .setTimestamp();

                const buttons = [];

                if (downloadUrl) {
                    buttons.push(
                        new ButtonBuilder()
                            .setLabel("Download")
                            .setStyle(ButtonStyle.Link)
                            .setURL(downloadUrl)
                    );
                }
                const message = {
                    embeds: [embed]
                };

                if (buttons.length) {
                    message.components = [
                        new ActionRowBuilder().addComponents(buttons)
                    ];
                }

                await channel.send(message);

                changed = true;
            }

            config.last[key] = current;
        }

        save(config);

        return changed
            ? "updated"
            : "no-updates";

    } catch (error) {
        console.error("Update checker error:", error);
        return "error";
    }
}

module.exports = {
    checkUpdates
};
