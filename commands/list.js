const fs = require("fs");

module.exports = {
  name: "list",
  description: "List Tiringa spokes.",
  args: false,
  execute(message) {
    let avaible_sentences = fs.readdirSync("./audio").map((f) => {
      return f
        .slice(0, -4)
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
    });
    message.channel.send(avaible_sentences.join("\n"));
  },
};
