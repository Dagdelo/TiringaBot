const { createLogger, format, transports } = require("winston");
const { Loggly } = require("winston-loggly-bulk");
const { combine, timestamp, printf } = format;
require("dotenv").config();

const customFormat = printf(({ level, message, timestamp }) => {
  return `${timestamp} [${level.toUpperCase()}]: ${message}`;
});

const logger = createLogger({
  level: "info",
  format: combine(timestamp(), customFormat),
  transports: [
    new transports.Console(),
    new transports.File({ filename: "combined.log" }),
    new Loggly({
      token: process.env.LOGGLY_TOKEN,
      subdomain: process.env.LOGGLY_SUBDOMAIN,
      tags: ["Winston-NodeJS"],
      json: true
    })
  ],
});

module.exports = logger;
