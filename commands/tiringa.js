const fs = require("fs");

module.exports = {
  name: "tiringa",
  description: "Make Tiringa spoke.",
  args: true,
  execute(message, file) {
    /* fs.readdirSync("./audio").forEach((f) => {
      let newFile = f
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
      fs.renameSync(`./audio/${f}`, `./audio/${newFile}`);
    }); */
    let avaible_sentences = fs.readdirSync("./audio").map((f) => {
      return f
        .slice(0, -4)
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
    });
    let sentence = avaible_sentences.filter((s) => s.includes(file));
    if (!sentence.length) {
      message.channel.send("Ainda não temos essa :(");
    } else {
      if (sentence.length > 1) {
        sentence = sentence[Math.floor(Math.random() * sentence.length)];
      }
      var voiceChannel = message.member.voice.channel;
      return voiceChannel
        .join()
        .then((connection) => {
          const dispatcher = connection.play(`./audio/${sentence}.mp3`);
          dispatcher.on("finish", () => {
            voiceChannel.leave();
          });
        })
        .catch((err) => {
          message.channel.send(err);
          console.log(err);
          voiceChannel.leave();
        });
    }
  },
};
