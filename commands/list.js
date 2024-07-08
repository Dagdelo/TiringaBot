const fs = require("fs");
const logger = require("../logger"); // Import the logger

module.exports = {
  name: "list",
  description: "List Tiringa spokes.",
  args: false,
  execute(message) {
    // Read available audio files and process their names
    let available_sentences = fs.readdirSync("./audio").map((f) => {
      return f
        .slice(0, -4) // Remove file extension
        .toLowerCase() // Convert to lowercase
        .normalize("NFD") // Normalize Unicode characters
        .replace(/[\u0300-\u036f]/g, ""); // Remove diacritical marks
    });
    message.channel.send(available_sentences.join("\n")); // Send the list of audio files to the channel
    logger.info("Listed available sentences");
  },
};
