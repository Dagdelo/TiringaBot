const fs = require("fs");
const Discord = require("discord.js");
const { prefix } = require("./config.json");
const logger = require("./logger"); // Import the logger

const client = new Discord.Client();

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

// Function to list all available audio files
function list(message) {
  let available_sentences = fs.readdirSync("./audio").map(f => {
    return f
      .slice(0, -4)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  });
  message.channel.send(available_sentences.join("\n")); // Send the list of audio files to the channel
  logger.info("Listed available sentences");
}

client.on("message", message => {
  if (!message.content.startsWith(prefix) || message.author.bot) return;

  // Handle LIST command
  if (message.content.slice(1).startsWith("list")) {
    list(message);
    return;
  }

  // Check if the user is in a voice channel
  if (!message.member.voice.channel) {
    message.channel.send("E como é que eu vô fala!?"); // Send error message if the user is not in a voice channel
    logger.warn("User not in a voice channel");
    return;
  }

  let id = message.guild.id;
  let file = message.content
    .toLowerCase()
    .slice(prefix.length)
    .split(/ +/)
    .join(" "); // Process the file name from the message content

  if (!servers[id]) servers[id] = { queue: [], playing: false }; // Initialize server queue and playing status if not already initialized
  let server = servers[id];
  server.queue.push({ message, file }); // Add the message and file to the server queue
  logger.info(`Added to queue: ${file}`);

  if (!server.playing) play(id); // Play the audio if not already playing
});

client.login(process.env.BOT_TOKEN); // Log in to Discord with the bot token
