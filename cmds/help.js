const { EmbedBuilder } = require("discord.js");

module.exports = {
    name: "help",
    aliases: ["h", "commands"],

    async execute(message, args, { prefix }) {
        const embed = new EmbedBuilder()
            .setTitle("🛡️ Moderation Bot")
            .setColor("Blue")
            .setDescription(
                `**Moderation**\n` +
                `\`${prefix}ban @user [reason]\`\n` +
                `\`${prefix}kick @user [reason]\`\n` +
                `\`${prefix}timeout @user <duration> [reason]\`\n` +
                `\`${prefix}warn @user [reason]\`\n` +
                `\`${prefix}warnings @user\`\n` +
                `\`${prefix}purge <amount>\`\n\n` +
                `**Sticky**\n` +
                `\`${prefix}sticky <message>\`\n` +
                `\`${prefix}unsticky\``
            );

        await message.reply({ embeds: [embed] });
    }
};