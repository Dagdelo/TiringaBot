const fs = require("fs");
const Discord = require("discord.js");
const { prefix } = require("./config.json");

const client = new Discord.Client();

client.once("ready", () => {
  console.log("Ready!");
});

var servers = {};

function play(id) {
  let server = servers[id];
  let { message, file } = server.queue[0];
  /* fs.readdirSync("./audio").forEach((f) => {
      let newFile = f
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
      fs.renameSync(`./audio/${f}`, `./audio/${newFile}`);
    }); */
  let avaible_sentences = fs.readdirSync("./audio").map(f => {
    return f
      .slice(0, -4)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  });
  let sentence = avaible_sentences.filter(s => s.includes(file));
  if (!sentence.length) {
    server.queue.shift();
    return;
  } else if (sentence.length > 1) {
    sentence = sentence[Math.floor(Math.random() * sentence.length)];
  }
  let voiceChannel = message.member.voice.channel;
  return voiceChannel
    .join()
    .then(connection => {
      if (!server.playing) {
        let dispatcher = connection.play(`./audio/${sentence}.mp3`);
        dispatcher.on("start", () => {
          server.playing = true;
        });
        dispatcher.on("finish", () => {
          server.queue.shift();
          server.playing = false;
          if (server.queue[0]) {
            play(id);
          } else {
            voiceChannel.leave();
          }
        });
      }
    })
    .catch(err => {
      message.channel.send(err);
      console.log(err);
      voiceChannel.leave();
    });
}

function list(message) {
  let avaible_sentences = fs.readdirSync("./audio").map(f => {
    return f
      .slice(0, -4)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  });
  message.channel.send(avaible_sentences.join("\n"));
}

client.on("message", message => {
  if (!message.content.startsWith(prefix) || message.author.bot) return;
  // LIST COMMAND
  if (message.content.slice(1).startsWith("list")) {
    list(message);
    return;
  }
  if (!message.member.voice.channel) {
    message.channel.send("E como é que eu vô fala!?");
    return;
  }
  let id = message.guild.id;
  let file = message.content
    .toLowerCase()
    .slice(prefix.length)
    .split(/ +/)
    .join(" ");
  if (!servers[id]) servers[id] = { queue: [], playing: false };
  let server = servers[id];
  server.queue.push({ message, file });
  if (!server.playing) play(id);
});

client.login(process.env.BOT_TOKEN);
