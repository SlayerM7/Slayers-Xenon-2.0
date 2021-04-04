var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const { Client, MessageEmbed } = require("discord.js");
const { slayersDB } = require("slayer.db");
const db = new slayersDB();
const client = new Client();
client.on("ready", () => {
    console.clear();
    console.log(`Logged in as ${client.user.tag}`);
});
client.on("message", (message) => __awaiter(this, void 0, void 0, function* () {
    let prefix = require("../config.json").defualt_prefix;
    const { guild, channel, author, content } = message;
    if (channel.type === "dm")
        return;
    if (db.has(`prefixes_${guild.id}`))
        prefix = db.get(`prefixes_${guild.id}`);
    if (author.bot)
        return;
    if (!content.startsWith(prefix))
        return;
    const args = content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();
    if (command === "prefix") {
        if (!args[0])
            return message.reply(`Prefix for the server is: \`${prefix}\``);
        if (args[0] === "set") {
            let newP = args[1];
            if (!newP)
                return message.channel.send("You did not mention a prefix");
            db.set(`prefixes_${guild.id}`, newP);
            message.channel.send(`Set prefix to: ${newP}`);
            db.save();
        }
    }
    if (command === "backup") {
        if (!args[0]) {
            message.channel.send(new MessageEmbed()
                .setColor("BLUE")
                .setAuthor(message.author.username, message.author.displayAvatarURL({ dynamic: true }))
                .setDescription(`${prefix}backup create - Create a backup of the server\n${prefix}backup load - Load one of your backups\n${prefix}backup list - get the list of all your backups\n${prefix}backup delete - Delete one of your backups\n${prefix}backup clear - Delete all of your backup\n${prefix}backup info - Get info on a backup`));
            return;
        }
        if (args[0] === "clear") {
            let x = db.values();
            let toDelete = [];
            x.map((c) => {
                if (!c.ID)
                    return;
                if (c.owner === author.id) {
                    toDelete.push(c.ID);
                }
            });
            message.reply(`Deleted \`${toDelete.length}\` backups`);
            toDelete.forEach((ID) => {
                db.delete(ID);
            });
            db.save();
        }
        if (args[0] === "info") {
            const ID = args[1];
            if (!ID)
                return message.reply("You did not given an ID");
            if (!db.has(ID))
                return message.channel.send("Unknown backup");
            let data = db.get(ID);
            if (!data)
                return message.channel.send(`Failed to fetch the backup`);
            let owner = yield client.users.fetch(data.owner);
            const embed = new MessageEmbed()
                .setColor("BLUE")
                .addField("ID", data.ID)
                .addField("Backup Owner", owner.username)
                .addField("Created At", data.date || "Failed to find date")
                .addField("Server", data.guildName)
                .addField("Roles", data.roles.length)
                .addField("Channels", data.channels.length)
                .addField("Categories", data.categories.length)
                .setThumbnail(owner.displayAvatarURL({ dynamic: true }));
            message.channel.send(embed);
        }
        if (args[0] === "delete") {
            let ID = args[1];
            if (!ID)
                return message.reply("You did not give an ID");
            if (!db.has(ID))
                return message.channel.send("That ID doesn't exist");
            let data = db.get(ID);
            if (!data)
                return message.reply("I failed to fetch the backup");
            if (data.owner !== author.id)
                return message.reply("The backup does not belong to you");
            db.delete(ID);
            message.reply(`Deleted the backup with ID: ${ID}`);
            db.save();
        }
        if (args[0] === "create") {
            if (!message.member.hasPermission("ADMINISTRATOR"))
                return message.channel.send("You need ADMINISTRATOR permissions to create a backup");
            let abcs = "abcdefghijklmnopqrstadpoasmdAIPSOdjdjackmxvkobsdojpajpdcoANFDAIPOCNSAqjhauposfbwuoipfnsaipoNDFuqpofnapofklSANFwpoquifndaklfsdfljkasdbnusovbsipfwjapofsbndfjksbnfwi";
            let chars = abcs.split("");
            let ID = Math.floor(Math.random() * 100) +
                chars[Math.floor(Math.random() * chars.length)] +
                chars[Math.floor(Math.random() * chars.length)] +
                chars[Math.floor(Math.random() * chars.length)] +
                Math.floor(Math.random() * 100);
            let roles = [];
            let channels = [];
            let categories = [];
            message.guild.roles.cache.map((role) => {
                if (role.managed)
                    return;
                if (role.id === guild.id)
                    return;
                roles.push(role);
            });
            guild.channels.cache.map((ch) => {
                if (ch.type === "category") {
                    categories.push(ch);
                }
                else {
                    channels.push(ch);
                }
            });
            db.set(ID, {
                owner: message.author.id,
                ID: ID,
                roles: [...roles],
                guildName: message.guild.name,
                channels: [...channels],
                categories: [...categories],
                icon: message.guild.iconURL({ dynamic: true }),
                date: new Date().toDateString(),
            });
            db.save();
            return message.channel.send(`Created backup with ID: ${ID}`);
        }
        if (args[0] === "list") {
            const values = db.values();
            let x = [];
            values.forEach((value) => {
                if (value.ID) {
                    if (value.owner === message.author.id)
                        x.push(`${value.ID} - ${value.guildName} - ${value.date || "Failed to find date"}`);
                }
            });
            message.reply(new MessageEmbed()
                .setColor("BLUE")
                .setDescription(x.join("\n"))
                .setAuthor(message.author.username, message.author.displayAvatarURL({ dynamic: true })));
        }
        if (args[0] === "load") {
            if (!message.member.hasPermission("ADMINISTRATOR"))
                return message.channel.send("You need ADMINISTRATOR permissions to load a backup");
            const ID = args.slice(1).join(" ");
            if (!ID)
                return message.channel.send("You did not give an ID");
            if (!db.has(ID))
                return message.reply("That id doesn't exist");
            let data = db.get(ID);
            message.guild.channels.cache.forEach((ch) => {
                ch.delete().catch(() => { });
            });
            message.guild.roles.cache.forEach((role) => {
                role.delete().catch(() => { });
            });
            setTimeout(() => {
                try {
                    let roles = data.roles;
                    let channels = data.channels;
                    let categories = data.categories;
                    let newCats = [];
                    categories.forEach((cat) => {
                        message.guild.channels
                            .create(cat.name, {
                            type: "category",
                            position: cat.rawPosition,
                        })
                            .then((cc) => {
                            data.channels.map((xx) => {
                                if (xx["parentID"] === cat.id) {
                                    xx.parentID = cc.id;
                                }
                            });
                        });
                    });
                    let newRoles = [];
                    roles.forEach((role) => {
                        message.guild.roles
                            .create({
                            data: {
                                name: role.name,
                                hoist: role.hoist,
                                mentionable: role.mentionable,
                                color: role.color,
                                permissions: role.permissions,
                            },
                        })
                            .then((r) => {
                            console.log("Thening");
                            data.channels.map((x) => {
                                console.log(`Before: ` + x.permissionOverwrites);
                                if (x.permissionOverwrites.includes(role.id)) {
                                    x.permissionOverwrites = x.permissionOverwrites.filter((val) => val !== role.id);
                                    x.permissionOverwrites.push(r.id);
                                    console.log(`After: ` + x.permissionOverwrites);
                                }
                            });
                        })
                            .catch((e) => {
                            console.log(e);
                        });
                    });
                    if (data.iconURL !== null) {
                        message.guild.setIcon(data.iconURL);
                    }
                    message.guild.setName(data.guildName);
                    setTimeout(() => {
                        channels.map((ch) => {
                            message.guild.channels
                                .create(ch.name, {
                                position: ch.rawPosition,
                                topic: ch.topic,
                                permissionOverwrites: ch.permissionOverwrites,
                                rateLimitPerUser: ch.rateLimitPerUser,
                                parent: ch.parentID,
                            })
                                .catch((e) => {
                                console.log(e);
                            });
                        });
                    }, 7 * 1000);
                }
                catch (e) {
                    console.log(e);
                }
            }, 10 * 1000);
        }
    }
}));
client.login(require("../config.json").token);
