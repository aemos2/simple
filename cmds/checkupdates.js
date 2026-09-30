const { checkUpdates } = require("../updateChecker");

module.exports = {
    name: "checkupdates",
    aliases: ["updates"],

    async execute(message) {
        if (!message.member.permissions.has("ManageGuild")) {
            return message.reply("You need the Manage Server permission.");
        }

        const result = await checkUpdates(message.client, true);

        if (result === "no-channel") {
            return message.reply("No update channel has been configured. Use `!setupdatechannel #channel`.");
        }

        if (result === "no-updates") {
            return message.reply("No new updates were found.");
        }

        if (result === "error") {
            return message.reply("The update service could not be checked.");
        }

        await message.reply("Update check completed.");
    }
};
