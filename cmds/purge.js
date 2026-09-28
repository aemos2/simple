const { PermissionsBitField } = require("discord.js");

module.exports = {
    name: "purge",
    aliases: ["clear", "prune"],

    async execute(message, args) {
        if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages))
            return message.reply("❌ You need **Manage Messages** permission.");

        const amount = Number(args[0]);

        if (!Number.isInteger(amount) || amount < 1 || amount > 100)
            return message.reply("❌ Amount must be between **1 and 100**.");

        const deleted = await message.channel.bulkDelete(amount + 1, true);

        const reply = await message.channel.send(
            `🧹 Deleted **${Math.max(deleted.size - 1, 0)}** messages.`
        );

        setTimeout(() => reply.delete().catch(() => {}), 3000);
    }
};