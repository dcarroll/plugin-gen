'use strict'

const SFDX_Util = require('./lib/sfdx_util.js');
const path = require('path');

let sfdx_util = new SFDX_Util.SFDX_Util(path.join(__dirname, 'commands'));

exports.topics = sfdx_util.getTopics(); 

exports.namespace = {
  name: 'djc',
  description: "Dave's plugins."
};

exports.commands = sfdx_util.getCommands();
exports.sfdx_util = sfdx_util;