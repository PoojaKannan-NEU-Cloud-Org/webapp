const pino = require('pino');
const fs = require('fs');

// Specify the path to the log file
const logFilePath = '/var/log/csye6225/myapp.log';

// Create a writable stream for logging
const logStream = fs.createWriteStream(logFilePath, { flags: 'a' }); // 'a' flag for appending


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

  // return formattedString;
  return `,"time":"${formattedString}"`; 
};


// Create a Pino logger instance with the stream and custom timestamp
const logger = pino({
    timestamp: customTimestamp,
    level : 'debug',
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
        // Rename the "level" property to "severity"
        if (log.level) {
          log.severity = log.level;
          delete log.level;
        }
        return log;
      }
  }
}, logStream);

module.exports = logger;

