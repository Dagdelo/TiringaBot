const fs = require("fs");
const Discord = require("discord.js");
const { prefix } = require("./config.json");
const logger = require("./logger"); // Import the logger

const client = new Discord.Client();
client.commands = new Discord.Collection();

// Load commands from the commands folder
const commandFiles = fs.readdirSync("./commands").filter(file => file.endsWith(".js"));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.name, command);
}

client.once("ready", () => {
  logger.info("Bot is ready!"); // Log when the bot is ready
});

var servers = {};

// Function to play the audio file
function play(id) {
  let server = servers[id];
  let { message, file } = server.queue[0];

  // Read available audio files and process their names
  let available_sentences = fs.readdirSync("./audio").map(f => {
    return f
      .slice(0, -4) // Remove file extension
      .toLowerCase() // Convert to lowercase
      .normalize("NFD") // Normalize Unicode characters
      .replace(/[\u0300-\u036f]/g, ""); // Remove diacritical marks
  });

  // Filter sentences that include the requested file
  let sentence = available_sentences.filter(s => s.includes(file));
  if (!sentence.length) {
    server.queue.shift(); // Remove the current item from the queue
    logger.warn(`No matching sentence found for: ${file}`);
    return;
  } else if (sentence.length > 1) {
    sentence = sentence[Math.floor(Math.random() * sentence.length)]; // Pick a random sentence if multiple match
  }

  let voiceChannel = message.member.voice.channel;
  return voiceChannel
    .join()
    .then(connection => {
      if (!server.playing) {
        let dispatcher = connection.play(`./audio/${sentence}.mp3`);
        dispatcher.on("start", () => {
          server.playing = true; // Set playing status to true when audio starts
          logger.info(`Playing: ${sentence}.mp3`);
        });
        dispatcher.on("finish", () => {
          server.queue.shift(); // Remove the current item from the queue when audio finishes
          server.playing = false; // Set playing status to false
          if (server.queue[0]) {
            play(id); // Play the next item in the queue
          } else {
            voiceChannel.leave(); // Leave the voice channel if the queue is empty
            logger.info("Left voice channel");
          }
        });
      }
    })
    .catch(err => {
      message.channel.send(err); // Send error message to the channel
      logger.error(err.message);
      voiceChannel.leave(); // Leave the voice channel on error
    });
}

client.on("message", message => {
  if (!message.content.startsWith(prefix) || message.author.bot) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();

  const command = client.commands.get(commandName);

  if (!command) return;

  if (command.args && !args.length) {
    return message.channel.send(`You didn't provide any arguments, ${message.author}!`);
  }

  try {
    command.execute(message, ...args);
  } catch (error) {
    logger.error(error);
    message.reply("there was an error trying to execute that command!");
  }
});

client.login(process.env.BOT_TOKEN); // Log in to Discord with the bot token
