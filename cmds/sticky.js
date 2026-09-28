const fs = require("fs");
const path = require("path");

const file = path.join(__dirname, "..", "data", "stickies.json");

function load() {
    if (!fs.existsSync(file)) {
        fs.writeFileSync(file, "{}");
    }

    try {
        return JSON.parse(fs.readFileSync(file, "utf8"));
    } catch {
        return {};
    }
}

function save(data) {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

module.exports = {
    name: "sticky",
    aliases: [],

    async execute(message, args) {
        if (!message.member.permissions.has("ManageMessages")) {
            return message.reply("You need the Manage Messages permission.");
        }

        const text = args.join(" ").trim();

        if (!text) {
            return message.reply("Usage: `!sticky <message>`");
        }

        const data = load();
        const channelId = message.channel.id;

        if (data[channelId]?.messageId) {
            try {
                const oldSticky = await message.channel.messages.fetch(
                    data[channelId].messageId
                );

                await oldSticky.delete().catch(() => {});
            } catch {}
        }

        const stickyMessage = await message.channel.send(text);

        data[channelId] = {
            message: text,
            messageId: stickyMessage.id
        };

        save(data);

        await message.delete().catch(() => {});
    },

    async handleSticky(message) {
        const data = load();
        const channelId = message.channel.id;

        if (!data[channelId]) return;

        try {
            if (data[channelId].messageId) {
                const oldSticky = await message.channel.messages.fetch(
                    data[channelId].messageId
                );

                await oldSticky.delete().catch(() => {});
            }
        } catch {}

        const newSticky = await message.channel.send(
            data[channelId].message
        );

        data[channelId].messageId = newSticky.id;

        save(data);
    }
};
