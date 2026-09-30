const {
    EmbedBuilder
} = require("discord.js");

const {
    getRobloxVersions
} = require("../robloxUpdates");

module.exports = {
    name: "checkroblox",
    description: "Check the current Roblox client versions.",

    async execute(message) {
        try {
            const versions = await getRobloxVersions();

            const embed = new EmbedBuilder()
                .setTitle("Current Roblox Versions")
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

            await message.reply({
                embeds: [embed]
            });

        } catch (error) {
            console.error("Roblox version check failed:", error);

            await message.reply(
                "Failed to retrieve the current Roblox version."
            );
        }
    }
};
