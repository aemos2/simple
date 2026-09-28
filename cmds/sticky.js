const { PermissionsBitField } = require("discord.js");
const fs = require("fs");
const path = require("path");

function load(file) {
    return JSON.parse(fs.readFileSync(file, "utf8"));
}

function save(file, data) {
    fs.writeFileSync(file, JSON.stringify(data, null, 4));
}

module.exports = {
    name: "sticky",

    async execute(message, args, { dataDir, prefix }) {
        if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages))
            return message.reply("❌ You need **Manage Messages** permission.");

        const content = args.join(" ");
        if (!content)
            return message.reply(`Usage: \`${prefix}sticky <message>\``);

        const file = path.join(dataDir, "stickies.json");
        const stickies = load(file);

        stickies[message.channel.id] = {
            guildId: message.guild.id,
            content,
            messageId: null
        };

        const stickyMessage = await message.channel.send({ content });

        stickies[message.channel.id].messageId = stickyMessage.id;
        save(file, stickies);

        await message.reply("📌 Sticky message set!");
    },

    async handleSticky(message) {
        const file = path.join(__dirname, "..", "data", "stickies.json");
        const stickies = load(file);
        const sticky = stickies[message.channel.id];

        if (!sticky) return;

        if (sticky.messageId) {
            try {
                const old = await message.channel.messages.fetch(sticky.messageId);
                await old.delete().catch(() => {});
            } catch {}
        }

        try {
            const newMessage = await message.channel.send({
                content: sticky.content
            });

            sticky.messageId = newMessage.id;
            save(file, stickies);
        } catch {}
    }
};