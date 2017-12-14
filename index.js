const path = require('path');
const pluginCreate = require(path.join(__dirname, 'commands', 'plugin', 'plugin_create.js'));
const pluginTopic = require(path.join(__dirname, 'commands', 'plugin', 'plugin.js'));

(function () {
  'use strict';
exports.topics = [{
  name: 'plugin',
  description: 'Plugin generation commands'
}]

exports.namespace = {
  name: 'djc',
  description: "Dave's plugins."
};

exports.commands = [pluginCreate];

}());