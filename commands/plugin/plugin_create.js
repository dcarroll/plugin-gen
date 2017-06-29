/*
 * Copyright (c) 2016, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root  or https://opensource.org/licenses/BSD-3-Clause
 */

 'use strict';

// Node
const path = require('path');
const _ = require('lodash');

// Local
const messages = require(path.join(__dirname, '..', '..', 'lib', 'messages'))();

module.exports =  function(_execCommand) {
    return {
        command: 'create',
        //topic: 'plugin',
        description: messages.getMessage('description', [], 'plugin_create'),
        longDescription: messages.getMessage('longDescription', [], 'plugin_create'),
        help: messages.getMessage('help', [], 'plugin_create'),
        requiresWorkspace: false,
        flags: [
            {
                name: 'pluginname',
                char: 'n',
                description: 'name of the plugin', // messages.getMessage('username', [], 'auth_jwt'),
                longDescription: 'The name of the plugin and project', // messages.getMessage('usernameLong', [], 'auth_jwt'),
                hasValue: true,
                required: true,
                type: 'string'
            },
            {
                name: 'namespace',
                char: 's',
                description: 'your unique namespace', // messages.getMessage('username', [], 'auth_jwt'),
                longDescription: 'The namespace for the plugin', // messages.getMessage('usernameLong', [], 'auth_jwt'),
                hasValue: true,
                required: true,
                type: 'string'
            },
            {
                name: 'topic',
                char: 't',
                description: 'topic for the plugin', // messages.getMessage('username', [], 'auth_jwt'),
                longDescription: 'The topic for the plugin and project', // messages.getMessage('usernameLong', [], 'auth_jwt'),
                hasValue: true,
                required: true,
                type: 'string'
            },
            {
                name: 'command',
                char: 'c',
                description: 'initial command name for the plugin', // messages.getMessage('username', [], 'auth_jwt'),
                longDescription: 'The initial command name for the plugin and project', // messages.getMessage('usernameLong', [], 'auth_jwt'),
                hasValue: true,
                required: true,
                type: 'string'
            }
        ],

        /**
         * the heroku cli hook
         * @param context - the cli context
         * @returns {*  }
         */
        run (context) {
            context.templateDir = path.join(__dirname, '..', '..', 'templates');
            const Plugin = require(path.join(__dirname, '..', '..', 'lib', 'plugin', 'plugin_create')); // eslint-disable-line global-require
            let plugin = new Plugin();

            return _execCommand(new Plugin(), context);
        }
    };
};
