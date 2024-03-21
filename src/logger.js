const pino = require('pino');
const fs = require('fs');

// Check if the environment is set to "test"
const isTestEnvironment = process.env.NODE_ENV === 'test';

// Specify the path to the log file for non-test environments
const logFilePath = '/var/log/csye6225/myapp.log';

// Conditionally create a writable stream for logging based on the environment
const logDestination = isTestEnvironment ? pino.destination(1) : fs.createWriteStream(logFilePath, { flags: 'a' });

// Custom timestamp function
const customTimestamp = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const milliseconds = String(now.getMilliseconds()).padStart(3, '0');
  const timezoneOffset = -now.getTimezoneOffset() / 60; // Convert minutes to hours
  const formattedString = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}${timezoneOffset >= 0 ? '+' : '-'}${Math.abs(timezoneOffset).toString().padStart(2, '0')}:00`;
  return `,"time":"${formattedString}"`;
};

// Configure logger options
const loggerOptions = {
  timestamp: customTimestamp,
  level: 'debug',
  formatters: {
    level(label, number) {
      if (number === 10 || number === 20) {
        return { severity: 'DEBUG' };
      } else if (number === 30) {
        return { severity: 'INFO' };
      } else if (number === 40) {
        return { severity: 'WARNING' };
      } else if (number === 50) {
        return { severity: 'ERROR' };
      } else if (number === 60) {
        return { severity: 'CRITICAL' };
      }
      return { severity: 'DEFAULT' };
    },
    log(log) {
      if (log.level) {
        log.severity = log.level;
        delete log.level;
      }
      return log;
    }
  }
};

// Create a Pino logger instance with conditional configuration
const logger = pino(loggerOptions, logDestination);

module.exports = logger;
