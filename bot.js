const readline = require('readline');
const Discord = require('discord.js');
const bot = new Discord.Client();
const fs = require('fs');
const creds = require("./creds.json");
const net = require('net');
const commandLineArgs = require('command-line-args');

/*configuring command line arguments*/
const args = [
    {name: 'headless', alias: 's', type: Boolean},
    {name: 'port', alias: 'p', type: Number}
];

const options = commandLineArgs(args); // setting up command line arguments

var port = 8187; // default port for daemon is 8197
var currentGuild = 0; // currently selected guild (state is only maintained for readline)

/*setup readline*/
const rl = readline.createInterface({
    input:  process.stdin,
    output: process.stdout
});

// readline for getting commands from stdin
rl.on('line', function(input) {
    
    var guild = currentGuild;//bot.guilds.array()[0];
    if(input.startsWith("/e")) { // eval function
        discordEval(input);
    } else if(input.startsWith("/s")) { // search function (messages containing)
        search(guild, input.substring(2));
    } else if(input.startsWith("/n")) { // get number of messages from given user
        numMessagesFromUser(guild, input.substring(2),
                            function(res){console.log(res)});
    } else if(input.startsWith("/r")) {
        rateUsers(guild, function(res){
            console.log(res);
        });
    } else if(input.startsWith("/g")) { // rate members of given guild
        console.log("select guild");
        console.log(printGuilds(bot.guilds.array()));
        rl.question('> ', (res) => {
            currentGuild = bot.guilds.array()[res];
        });
    } else if(input.startsWith("/h")) { // get help for commands
        console.log("Usage\n/e - eval given command\n/s <containing>- search for a message containing given message in current guild\n/n <userID> - get # of messages from user in current guild\n/r - rate members of current guild by message count\n/g - select current guild\n");
    } else if (input.startsWith("/u")){
        messagesFromUser(currentGuild, 104768452085956608, function(res){
            fs.writeFile("./out.txt", res, function(err){
                if(err) return console.log(err);
            })
        });
    } else {
        console.log("| Unknown command: " + input + " Use /h to see usage");
    }
});

bot.on('ready', function(){
    if(!options.headless)
        console.log("Ready");
})



/*Daemon for command line client*/
if(options.headless) {
    net.createServer(function(sock) {
        sock.on('data', function(data) {
            // convert the request buffer to a string
            var req = parsePacket(data.toString());
            if(req.listGuild) {
                sock.write(printGuilds(bot.guilds.array()));
            }else if(req.guild) { /*selected guild*/
                currentGuild = req.guild;
                if(req.rateUsers) {
                    rateUsers(bot.guilds.array()[req.guild-1], function(res){
                        var rating = ""
                        for(var i=0; i<res.length; i++){
                            rating += (res[i].userid) + ":" + res[i].messages;
                            rating += "\n";
                        }
                        sock.write(rating);
                    });
                }
            }
        });
    }).listen(port, '127.0.0.1');
}
/*changing port (headless mode)*/
if(options.port){
    port = options.port
}

const token = creds.token;
bot.login(token);

//spooky debug function, literally just evals input, so be careful what you give it
function discordEval(input){
    eval(input.substring(2));
}

function printGuilds(guilds){ // nicely print guilds for selecton
    var guildList = "";
    for(var i=0; i<guilds.length; i++){
        guildList += ("["+(i+1)+"]" + guilds[i]) + "\n";
    }
    
    return guildList;
}

/*search for messages*/
function search(guild, content){
    if(guild == 0){
        console.log("Please select a guild");
        return;
    }
        
    // search the given guild for messages with the given content
    guild.search({
        content: content
    }).then(res => {
        for(var i=0; i<res.messages.length; i++){
            var msg = res.messages[i].find(m => m.hit);
            console.log(msg.author.username + ": " + msg.content);
        }
    }).catch(console.error);
}

/*return all messages from user*/
function messagesFromUser(guild, userID, callback){
    guild.search({
        author: userID
    }).then(res => {
        callback(res.messages);
    }).catch(console.error);
}

/*get the number of messages from a given user*/
function numMessagesFromUser(guild, userID, callback){
    if(guild == 0){
        console.log("Please select a guild");
        return;
    }

    // search the given guild for messages from the given user
    guild.search({
        author: userID
    }).then(res => {
        var numMessages = res.totalResults; // get the total results of search
        callback(numMessages);
    }).catch(console.error);
}


/*rate users based on most messages sent*/
function rateUsers(guild, callback){
    if(guild == 0){
        console.log("Please select a guild");
        return;
    }
    var members = guild.members.array(); // get members of given server
    var numObj = []; // map of userID to number of messages
    // variable to keep track of currently running callbacks
    var callbacks = 0;
    
    for(var i=0; i<members.length; i++){
        var userID = members[i].user.id;
        callbacks++; // callback is created
        numMessagesFromUser(guild, userID, function(numMessages) {
            var user = {
                "userid" : userID,
                "messages" : numMessages
            };
            numObj.push(user);
            callbacks--; // callback finishes
            if(callbacks == 0){ // check if this is the final callback
                callback(numObj); // send the map of users
            }
        });
    }

}

// process the packet sent from the client when headless
function parsePacket(packet) { // in its on function to make refactoring easier later
    var packet = JSON.parse("{" + packet + "}");
    return packet;
}
