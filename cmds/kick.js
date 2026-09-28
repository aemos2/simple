const { PermissionsBitField } = require("discord.js");

module.exports = {
    name: "kick",

    async execute(message, args) {
        if (!message.member.permissions.has(PermissionsBitField.Flags.KickMembers))
            return message.reply("❌ You need **Kick Members** permission.");

        const member = message.mentions.members.first() ||
            message.guild.members.cache.get(args[0]);

        if (!member) return message.reply("❌ Mention a valid member.");
        if (!member.kickable) return message.reply("❌ I can't kick this member.");

        const reason = args.slice(1).join(" ") || "No reason provided";
        await member.kick(reason);

        await message.reply(`👢 **${member.user.tag}** has been kicked.\nReason: ${reason}`);
    }
};