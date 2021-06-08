const Discord = require("discord.js");
const client = new Discord.Client();
const fs = require("fs");
const { urlToHttpOptions } = require("http");
const { runInThisContext } = require("vm");
const configPath = require("./Data/config/config.json");

class Error {
    static DELETE(error) {
        return `Failed to delete "${error}" from commands list, it either does not exist or you mistyped. If you think this is an error please contact an administrator.`;
    }

    static FIND(error) {
        return `Failed to find command "${error}", it either does not exist or you mistyped. If you think this is an error please contact an administrator.`;
    }

    static SYNTAX(error) {
        return `Invalid syntax.`;
    }

    static FILEWRITE(error) {
        return `An error has occured writing "${error}."`;
    }
    
    static GENERIC(error) {
        return `A generic error has occured - ${error} - this should only be flagged in DEBUG mode`;
    }
}

class Success {
    static CREATE(command) {
        return `Created ${command}`;
    }

    static DELETE(command) {
        return `Deleted ${command}`
    }

    static ADDED(command, argument) {
        return `Added ${argument} to ${command}`
    }
}

const guildTemplate = { 
    "config": {
        "dadChance": 0,
        "dadMode": true,
        "updateChannel": true,
        "prefix": "!"
    },
    "commands": {

    }, 
    "metadata": {
        "allowedCommandLimit": 0 //TODO implement this lol
    }
}

const commandTemplate = {
    "data": {

    }
}

const emojiSetEntity = {
    "walkable": false,
    "encounterChance": 0,
    "interactable": {
        "itemToInteract": "none",
        "droppedItem": "none", 
        "referencedEntity": "none"
    },
    "spawnableEnemies": {

    }
}

const emojiMobEntity = {
    "damage" : 0,
    "missChance": 0,
    "evasionChance": 0,
    "rarity": 0
}

class Directories {

    static COMMANDSTREE (guildID) {
        return `./Guilds/data/${guildID}/commands/`;
    }

    static DATA (guildID) {
        return `./Guilds/data/${guildID}/data.json`;
    }

    static SPECIFICCOMMAND (guildID, command) {
        return new Promise((resolve, reject) => {
            fs.readFile(this.DATA(guildID), (err, data) => {

                if (err) {
                    reject(Error.FIND(command));
                } 

                let json = JSON.parse(data);
                var uuid = json.commands[command]; 

                resolve(`./Guilds/data/${guildID}/commands/${uuid}.json`);
            });
        })
    }
}

class EntityMobGenerators {
    constructor() {
        this.jsonMobEntity = emojiMobEntity;
    }

    damage(int) {
        this.jsonMobEntity.damage = int;
        return this;
    }

    missChance(int) {
        this.jsonMobEntity.missChance = int;
        return this;
    }

    evasionChance(int) {
        this.jsonMobEntity.evasionChance = int;
        return this;
    }

    rarity(int) {
        this.jsonMobEntity.rarity = int;
        return this;
    }

    returnJSON() {
        return this.jsonMobEntity;
    }


}

class EntitySetGenerators {
    constructor() {
        this.jsonSetEntity = emojiSetEntity;
    }

    walkable(bool) {
        this.jsonSetEntity.walkable = bool;
        return this;
    }

    encounterChance(int) {
        this.jsonSetEntity.encounterChance = int;
        return this;
    }

    itemToInteract(str) {
        this.jsonSetEntity.interactable.itemToInteract = str;
        return this;
    }

    droppedItem(str) {
        this.jsonSetEntity.interactable.droppedItem = str;
        return this;
    }

    referencedEntity(str) {
        this.jsonSetEntity.interactable.referencedEntity = str;
        return this;
    }

    spawnableEnemies(str, EntityMobGenerators) {
        this.jsonSetEntity.spawnableEnemies[str] = EntityMobGenerators;
        return this;
    }

    returnJSON() {
        return JSON.stringify(this.jsonSetEntity);
    }
}

class Generators {

    static createGuildJSON(guildID) {
        fs.mkdirSync(Directories.COMMANDSTREE(guildID), { recursive: true}, (err) => { //TODO: Sync is not good for servers -- remove later
            if (err) {
                console.log(Error.GENERIC(err));
            }
        });
        fs.writeFile(Directories.DATA(guildID), JSON.stringify(guildTemplate, null, 2), (err) => {
            if (err) {
                console.log(Error.GENERIC(err));
            }
        })
    };

    static createCommandJSON(guildID, command) {
        fs.readFile(Directories.DATA, (err, data) => {
            if (err) {
                console.log(Error.GENERIC(err));
            }

            var json = JSON.parse(data);

            var identity = UUID.uuidv4(); //TODO: Do not generate UUID if command already exists

            json.commands[command] = identity;
            fs.writeFile(`./Guilds/data/${guildID}/data.json`, JSON.stringify(json, null, 2), (err) => {
                if (err) {
                    console.log(Error.GENERIC(err));
                }
            }) //Writes command template to file
            fs.appendFile(`./Guilds/data/${guildID}/commands/${identity}.json`, JSON.stringify(commandTemplate, null, 2), (err) => {
                if (err) {
                    console.log(Error.GENERIC(err))
                }
                else {
                    console.log(Success.CREATE(command))
                }
            })
        });
    }
}

class ChangeJSONData {

    static async addJSONData (guildID, command, data) { //TODO: implement subcommand limit
        var dir = await Directories.SPECIFICCOMMAND(guildID, command);
        fs.readFile(dir, (err, fileData) => {
            if (err) {
                console.log(Error.GENERIC(command));
            }
            let json = JSON.parse(fileData);
            json.data[Object.keys(json.data).length + 1] = data
            fs.writeFile(dir, JSON.stringify(json), (err) => {
                if (err) {
                    console.log(Error.GENERIC(data));
                } else {
                    console.log(Success.CREATE(data));
                }
            })
        })
    }

    static async removeJSONData (guildID, command, identifier) {   
        var dir = await Directories.SPECIFICCOMMAND(guildID, command);
        fs.readFile(dir, (err, fileData) => {
            if (err) {
                console.log(Error.GENERIC(command));
            }
            let json = JSON.parse(fileData)
            delete json.data[identifier]
            fs.writeFile(dir, JSON.stringify(json), (err) => {
                console.log(Success.DELETE(command));
            })
            //this.reshuffle();
        })
    }

    reshuffle() {
        //TODO: Re-shuffle data in command
    }
}

class UUID {
    static uuidv4() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
}

/*try {
    client.on("ready", () => {
        console.log(`Logged in as ${client.user.tag}`);
    })

    client.on("guildCreate", guildCreate => {
        console.log(Generators.createGuildJSON(guildCreate.id));
    })

    client.on("message", async message => {
        var content = message.content;
        var author = message.author;
        var guildID = message.guild.id;

    })
    client.login(configPath.discordToken);
}

catch (err) {
    console.log(Error.GENERIC(err));
}*/

//Generators.createGuildJSON("0");
//Generators.createCommandJSON("0", "testGuild");

async function main() {
    console.log(new EntitySetGenerators()
        .walkable(true)
        .encounterChance(1)
        .droppedItem("itemtest")
        .spawnableEnemies("test", new EntityMobGenerators()
            .damage(542)
            .evasionChance(2)
            .returnJSON())
        .returnJSON());
}

main()
