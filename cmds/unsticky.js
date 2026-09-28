const { PermissionsBitField } = require("discord.js");
const fs = require("fs");
const path = require("path");

module.exports = {
    name: "unsticky",

    async execute(message) {
        if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages))
            return message.reply("❌ You need **Manage Messages** permission.");

        const file = path.join(__dirname, "..", "data", "stickies.json");
        const stickies = JSON.parse(fs.readFileSync(file, "utf8"));
        const sticky = stickies[message.channel.id];

        if (!sticky)
            return message.reply("❌ There is no sticky message in this channel.");

        if (sticky.messageId) {
            try {
                const old = await message.channel.messages.fetch(sticky.messageId);
                await old.delete().catch(() => {});
            } catch {}
        }

        delete stickies[message.channel.id];
        fs.writeFileSync(file, JSON.stringify(stickies, null, 4));

        await message.reply("📌 Sticky message removed!");
    }
};