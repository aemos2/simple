const { PermissionsBitField } = require("discord.js");
const fs = require("fs");
const path = require("path");

module.exports = {
    name: "warnings",
    aliases: ["warns"],

    async execute(message, args, { dataDir }) {
        if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers))
            return message.reply("❌ You need **Moderate Members** permission.");

        const member = message.mentions.members.first() ||
            message.guild.members.cache.get(args[0]);

        if (!member) return message.reply("❌ Mention a valid member.");

        const file = path.join(dataDir, "warnings.json");
        const warnings = JSON.parse(fs.readFileSync(file, "utf8"));

        const list = warnings[message.guild.id]?.[member.id] || [];

        if (!list.length)
            return message.reply(`✅ **${member.user.tag}** has no warnings.`);

        const text = list
            .map((w, i) => `${i + 1}. ${w.reason}`)
            .join("\n");

        await message.reply(
            `⚠️ **${member.user.tag}** — ${list.length} warning(s)\n${text}`
        );
    }
};