const Discord = require("discord.js");
const client = new Discord.Client();
const fs = require("fs");
const emojiUnicode = require("emoji-unicode");
const configPath = require("./Data/config/config.json");
const { Console } = require("console");

class Game {
    constructor() {

    }
}

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
    "unicodeChar": "none",
    "name": "none",
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
    "unicodeChar": "none",
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
        this.jsonMobEntity =  emojiMobEntity;
    }

    damage (int) {
        this.jsonMobEntity.damage = int;
        return this;
    }

    missChance (int) {
        this.jsonMobEntity.missChance = int;
        return this;
    }

    evasionChance (int) {
        this.jsonMobEntity.evasionChance = int;
        return this;
    }

    rarity (int) {
        this.jsonMobEntity.rarity = int;
        return this;
    }
    
    unicodeChar(str) {
        this.jsonMobEntity.unicodeChar = str;
        return this;
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

    name(str) {
        this.jsonSetEntity.name = str;
        return this;
    }

    unicodeChar(str) {
        this.jsonSetEntity.unicodeChar = str;
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

    serialiseJSON() {
        console.log(JSON.stringify(this.jsonSetEntity, null, 2));

        fs.readFile(`./Game/data/reference.json`, (err, fileData) => {
            let json = JSON.parse(fileData);
            json.data[emojiUnicode(this.jsonSetEntity.unicodeChar)] = this.jsonSetEntity;
            fs.writeFile(`./Game/data/reference.json`, JSON.stringify(json, null, 2), (err) => {
                if (err) {
                    return Error.GENERIC(err);
                }
            })
        })
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

    static createGameReferenceJSON() {
        fs.writeFile(`./Game/data/reference.json`, JSON.stringify(commandTemplate, null, 2), (err) => {
            if (err) {
                Error.GENERIC(err);
            }
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
            fs.writeFile(dir, JSON.stringify(json, null, 2), (err) => {
                if (err) {
                    console.log(Error.GENERIC(data));
                } else {
                    console.log(Success.CREATE(data));
                }
            })
        })
    }

    static async readJSONData (guildID, command, data) {
        var dir = await Directories.SPECIFICCOMMAND(guildID, command);
        fs.readFile(dir, (err, fileData) => {
            if (err) {
                console.log(Error.GENERIC(err));
            }
            var json = JSON.parse(fileData);
            
            resolve(json.data[this.data]);
            
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

try {
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
}

//Generators.createGuildJSON("0");
//Generators.createCommandJSON("0", "peanuts");

//console.log(ChangeJSONData.addJSONData(0, "hello", "welike.fortnite"));

//console.log(Directories.SPECIFICCOMMAND(0, "peanuts"));
//console.log(Directories.DATA(0));
//Directories.SPECIFICOMMANDASYNC(0, "peanuts")
//Directories.SPECIFICCOMMAND(0, "peanuts")

async function main() {

    //Generators.createGameReferenceJSON()
    //console.log(await Directories.SPECIFICCOMMAND(2, "peanuets"));
    //ChangeJSONData.addJSONData(0, "jeff", "test");
    //ChangeJSONData.removeJSONData(0, "jeff", 1);
    //Generators.createCommandJSON(0, "jeff");
    /*console.log(new EntitySetGenerators()
        .unicodeChar("🟩")
        .walkable(true)
        .encounterChance(1)
        .droppedItem("itemtest")
        .spawnableEnemies("test", new EntityMobGenerators()
            .unicodeChar("ඞ")
            .damage(542)
            .evasionChance(20))
        .spawnableEnemies("test2", new EntityMobGenerators()
            .unicodeChar("amogus")
            .damage(420)
            .evasionChance(0)
            .rarity(10))
        .spawnableEnemies("test3", new EntityMobGenerators()
            .unicodeChar("sus!")
            .damage(42320)
            .evasionChance(0111)
            .rarity(102))
        .serialiseJSON())*/
    //ChangeJSONData.addJSONData(0, "jeff", "test");
    //console.log(ChangeJSONData.readJSONData(0, "jeff", 1));
}

main()
