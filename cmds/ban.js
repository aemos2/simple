const { PermissionsBitField } = require("discord.js");

module.exports = {
    name: "ban",

    async execute(message, args) {
        if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers))
            return message.reply("❌ You need **Ban Members** permission.");

        const member = message.mentions.members.first() ||
            message.guild.members.cache.get(args[0]);

        if (!member) return message.reply("❌ Mention a valid member.");
        if (!member.bannable) return message.reply("❌ I can't ban this member.");

        const reason = args.slice(1).join(" ") || "No reason provided";
        await member.ban({ reason });

        await message.reply(`🔨 **${member.user.tag}** has been banned.\nReason: ${reason}`);
    }
};