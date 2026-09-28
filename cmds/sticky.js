require("dotenv").config();

const {
    Client,
    GatewayIntentBits
} = require("discord.js");

const fs = require("fs");
const path = require("path");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const PREFIX = process.env.PREFIX || "!";

const dataDir = path.join(__dirname, "data");

if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

const dataFiles = [
    "warnings.json",
    "stickies.json"
];

for (const file of dataFiles) {
    const filePath = path.join(dataDir, file);

    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, "{}");
    }
}

const commands = new Map();
const cmdsPath = path.join(__dirname, "cmds");

if (!fs.existsSync(cmdsPath)) {
    fs.mkdirSync(cmdsPath, { recursive: true });
}

for (const file of fs.readdirSync(cmdsPath).filter(f => f.endsWith(".js"))) {
    const command = require(path.join(cmdsPath, file));

    if (command.name && typeof command.execute === "function") {
        commands.set(command.name, command);

        if (command.aliases) {
            for (const alias of command.aliases) {
                commands.set(alias, command);
            }
        }
    }
}

client.once("ready", () => {
    console.log(`Logged in as ${client.user.tag}`);
    console.log(`Prefix: ${PREFIX}`);
    console.log(`Loaded ${commands.size} command entries.`);

    client.user.setActivity(`${PREFIX}help`);
});

client.on("messageCreate", async message => {
    if (message.author.bot || !message.guild) return;

    if (!message.content.startsWith(PREFIX)) {
        const sticky = commands.get("sticky");

        if (sticky?.handleSticky) {
            await sticky.handleSticky(message).catch(console.error);
        }

        return;
    }

    const args = message.content
        .slice(PREFIX.length)
        .trim()
        .split(/\s+/);

    const name = args.shift()?.toLowerCase();

    if (!name) return;

    const command = commands.get(name);

    if (!command) return;

    try {
        await command.execute(message, args, {
            prefix: PREFIX,
            client,
            dataDir
        });
    } catch (error) {
        console.error(error);

        if (!message.replied && !message.deferred) {
            await message.reply("Something went wrong.");
        }
    }
});

client.login(process.env.TOKEN);
