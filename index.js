require("dotenv").config();

const {
    Client,
    GatewayIntentBits
} = require("discord.js");

const {
    checkUpdates
} = require("./updateChecker");

const {
    checkRobloxUpdates
} = require("./robloxUpdates");

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

    const interval = Number(
        process.env.UPDATE_CHECK_INTERVAL || 300000
    );

    if (process.env.UPDATE_API_URL) {
        setTimeout(() => {
            checkUpdates(client).catch(console.error);
        }, 5000);

        setInterval(() => {
            checkUpdates(client).catch(console.error);
        }, interval);
    }

    setTimeout(async () => {
        try {
            await checkRobloxUpdates(client);
        } catch (error) {
            console.error(
                "Initial Roblox version check failed:",
                error
            );
        }
    }, 5000);
    
    const robloxInterval =
        Number(process.env.ROBLOX_UPDATE_INTERVAL) || 300000;
    
    setInterval(async () => {
        try {
            await checkRobloxUpdates(client);
        } catch (error) {
            console.error(
                "Roblox version checker error:",
                error
            );
        }
    }, robloxInterval);
});

client.on("messageCreate", async message => {
    if (message.author.bot || !message.guild) return;

    const sticky = commands.get("sticky");

    const isCommand = message.content.startsWith(PREFIX);

    if (isCommand) {
        const args = message.content
            .slice(PREFIX.length)
            .trim()
            .split(/\s+/);

        const name = args.shift()?.toLowerCase();

        if (name) {
            const command = commands.get(name);

            if (command) {
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

                if (name === "sticky" || name === "unsticky") {
                    return;
                }
            }
        }
    }

    if (sticky?.handleSticky) {
        await sticky.handleSticky(message).catch(console.error);
    }
});

client.login(process.env.TOKEN);
