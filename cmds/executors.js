// cmds/status.js

const https = require("https");

module.exports = {
    name: "status",
    aliases: ["stats"],

    async execute(message, args) {
        const service = args[0];

        if (!service) {
            return message.reply(" Usage: `.status <service>`");
        }

        const url = `https://whatexpsare.online/api/status/exploits/${encodeURIComponent(service)}`;

        https.get(url, {
            headers: {
                "User-Agent": "Discord-Status-Bot"
            }
        }, res => {
            let data = "";

            res.on("data", chunk => {
                data += chunk;
            });

            res.on("end", async () => {
                if (res.statusCode !== 200) {
                    return message.reply("Service status could not be retrieved.");
                }

                try {
                    const result = JSON.parse(data);

                await message.reply(
                    `\`\`\`\n` +
                    `${service}\n` +
                    `Detected: ${result.detected ?? "Unknown"}\n` +
                    `Version: ${result.version ?? "Unknown"}\n` +
                    `Updated: ${result.updateStatus ?? "Unknown"}\n` +
                    `Unc: ${result.uncPercentage ?? "Unknown"}\n` +
                    `sUNC: ${result.suncPercentage ?? "Unknown"}\n` +
                    `\`\`\``
                );
                } catch {
                    await message.reply("Invalid API response.");
                }
            });
        }).on("error", () => {
            message.reply("Failed to contact the status API.");
        });
    }
};
