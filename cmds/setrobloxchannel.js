const {
    PermissionFlagsBits
} = require("discord.js");

const {
    setRobloxChannel
} = require("../robloxUpdates");

module.exports = {
    name: "setrobloxchannel",
    description: "Set the channel for Roblox version updates.",

    async execute(message) {
        if (!message.member.permissions.has(
            PermissionFlagsBits.ManageGuild
        )) {
            return message.reply(
                "You need the Manage Server permission to use this command."
            );
        }

        setRobloxChannel(message.channel.id);

        return message.reply(
            `Roblox update notifications are now enabled in ${message.channel}.`
        );
    }
};
