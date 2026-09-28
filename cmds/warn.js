const { PermissionsBitField } = require("discord.js");
const fs = require("fs");
const path = require("path");

module.exports = {
    name: "warn",

    async execute(message, args, { dataDir }) {
        if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers))
            return message.reply("❌ You need **Moderate Members** permission.");

        const member = message.mentions.members.first() ||
            message.guild.members.cache.get(args[0]);

        if (!member) return message.reply("❌ Mention a valid member.");

        const reason = args.slice(1).join(" ") || "No reason provided";
        const file = path.join(dataDir, "warnings.json");
        const warnings = JSON.parse(fs.readFileSync(file, "utf8"));

        if (!warnings[message.guild.id]) warnings[message.guild.id] = {};
        if (!warnings[message.guild.id][member.id])
            warnings[message.guild.id][member.id] = [];

        warnings[message.guild.id][member.id].push({
            reason,
            moderator: message.author.id,
            timestamp: Date.now()
        });

        fs.writeFileSync(file, JSON.stringify(warnings, null, 4));

        const count = warnings[message.guild.id][member.id].length;

        await message.reply(
            `⚠️ **${member.user.tag}** has been warned.\n` +
            `Reason: ${reason}\n` +
            `Warnings: **${count}**`
        );
    }
};