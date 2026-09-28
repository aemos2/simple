// cmds/list.js

const { EmbedBuilder } = require("discord.js");

const API_URL = "https://whatexpsare.online/api/status/exploits";

module.exports = {
    name: "executorlist",
    aliases: ["executors"],

    async execute(message) {
        try {
            const response = await fetch(API_URL);

            if (!response.ok) {
                return message.reply("Failed to fetch the software list.");
            }

            const data = await response.json();

            const items = Array.isArray(data)
                ? data
                : data.items || data.services || [];

            if (!items.length) {
                return message.reply("No software found.");
            }

            const output = items
                .slice(0, 50)
                .map((item, i) => {
                    const name = item.name ?? item.title ?? "Unknown";
                    const status = item.status ?? "Unknown";

                    return `${i + 1}. ${name} - ${status}`;
                })
                .join("\n");

            await message.reply(
                `\`\`\`\n${output}\n\`\`\``
            );

        } catch (error) {
            console.error(error);
            await message.reply("Failed to fetch the list.");
        }
    }
};
