const fs = require("fs");
const path = require("path");

const file = path.join(__dirname, "..", "data", "updates.json");

function load() {
    if (!fs.existsSync(file)) return { channelId: null, last: {} };
    try {
        return JSON.parse(fs.readFileSync(file, "utf8"));
    } catch {
        return { channelId: null, last: {} };
    }
}

function save(data) {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

module.exports = {
    name: "setupdatechannel",
    aliases: ["updatechannel"],

    async execute(message) {
        if (!message.member.permissions.has("ManageGuild")) {
            return message.reply("You need the Manage Server permission.");
        }

        const channel =
            message.mentions.channels.first() ||
            message.channel;

        const data = load();
        data.channelId = channel.id;
        save(data);

        await message.reply(`Update notifications are now set to ${channel}.`);
    }
};
