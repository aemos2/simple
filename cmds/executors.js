// cmds/status.js
const https = require("https");

module.exports = {
    name: "status",
    aliases: ["stats"],
    async execute(message, args) {
        const service = args[0]?.toLowerCase();
        if (!service) {
            return message.reply("Usage: `.status <service>`");
        }

        const url = `https://whatexpsare.online/api/status/exploits/${encodeURIComponent(service)}`;

        try {
            const result = await new Promise((resolve, reject) => {
                const req = https.get(url, {
                    headers: { "User-Agent": "Discord-Status-Bot" },
                    timeout: 8000
                }, res => {
                    let data = "";

                    res.on("data", chunk => data += chunk);
                    res.on("end", () => {
                        if (res.statusCode !== 200) {
                            return reject(new Error(`Status code: ${res.statusCode}`));
                        }
                        try {
                            resolve(JSON.parse(data));
                        } catch {
                            reject(new Error("Invalid JSON"));
                        }
                    });
                });

                req.on("error", reject);
                req.on("timeout", () => {
                    req.destroy();
                    reject(new Error("Request timed out"));
                });
            });

            await message.reply(
                "```\n" +
                `${service}\n` +
                `Detected: ${result.detected ?? "Unknown"}\n` +
                `Version: ${result.version ?? "Unknown"}\n` +
                `Updated: ${result.updateStatus ?? "Unknown"}\n` +
                `Unc: ${result.uncPercentage ?? "Unknown"}\n` +
                `sUNC: ${result.suncPercentage ?? "Unknown"}\n` +
                "```"
            );

        } catch (err) {
            console.error(`[status] ${service}:`, err.message);
            await message.reply("Failed to fetch status for that service.");
        }
    }
};
