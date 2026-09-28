const { PermissionsBitField } = require("discord.js");

function parseDuration(input) {
    const match = /^(\d+)(s|m|h|d)$/i.exec(input || "");
    if (!match) return null;

    const amount = Number(match[1]);
    const unit = match[2].toLowerCase();

    const multipliers = {
        s: 1000,
        m: 60 * 1000,
        h: 60 * 60 * 1000,
        d: 24 * 60 * 60 * 1000
    };

    return amount * multipliers[unit];
}

module.exports = {
    name: "timeout",
    aliases: ["mute"],

    async execute(message, args) {
        if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers))
            return message.reply("❌ You need **Moderate Members** permission.");

        const member = message.mentions.members.first() ||
            message.guild.members.cache.get(args[0]);

        if (!member) return message.reply("❌ Mention a valid member.");

        const duration = parseDuration(args[1]);
        if (!duration) return message.reply("❌ Use a duration like `10m`, `1h`, or `1d`.");

        if (!member.moderatable)
            return message.reply("❌ I can't timeout this member.");

        const reason = args.slice(2).join(" ") || "No reason provided";

        await member.timeout(duration, reason);

        await message.reply(
            `⏱️ **${member.user.tag}** has been timed out for **${args[1]}**.\nReason: ${reason}`
        );
    }
};