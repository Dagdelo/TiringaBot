const fs = require("fs");
const logger = require("../logger"); // Import the logger

module.exports = {
  name: "tiringa",
  description: "Make Tiringa spoke.",
  args: true,
  execute(message, file) {
    // Read available audio files and process their names
    let available_sentences = fs.readdirSync("./audio").map((f) => {
      return f
        .slice(0, -4) // Remove file extension
        .toLowerCase() // Convert to lowercase
        .normalize("NFD") // Normalize Unicode characters
        .replace(/[\u0300-\u036f]/g, ""); // Remove diacritical marks
    });

    // Filter sentences that include the requested file
    let sentence = available_sentences.filter((s) => s.includes(file));
    if (!sentence.length) {
      message.channel.send("Ainda não temos essa :("); // Send error message if no matching file is found
      logger.warn(`No matching sentence found for: ${file}`);
    } else {
      if (sentence.length > 1) {
        sentence = sentence[Math.floor(Math.random() * sentence.length)]; // Pick a random sentence if multiple match
      }
      var voiceChannel = message.member.voice.channel;
      return voiceChannel
        .join()
        .then((connection) => {
          const dispatcher = connection.play(`./audio/${sentence}.mp3`);
          logger.info(`Playing: ${sentence}.mp3`);
          dispatcher.on("finish", () => {
            voiceChannel.leave(); // Leave the voice channel when audio finishes
            logger.info("Left voice channel");
          });
        })
        .catch((err) => {
          message.channel.send(err); // Send error message to the channel
          logger.error(err.message);
          voiceChannel.leave(); // Leave the voice channel on error
        });
    }
  },
};
