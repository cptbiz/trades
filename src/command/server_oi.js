const services = require('../modules/services');

module.exports = class ServerOICommand {
  constructor() {}

  execute() {
    console.log('🚀 Starting Crypto Trading Bot with OI Dashboard...');
    services.createWebserverInstance().start();
  }
}; 