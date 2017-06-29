/*
 * Copyright (c) 2016, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root  or https://opensource.org/licenses/BSD-3-Clause
 */

'use strict';

const path = require('path');
const fs = require('fs');
const os = require('os');

const _ = require('lodash');
const __sfdxdirname = os.homedir() + '/.local/share/sfdx/plugins/node_modules/salesforce-alm/dist';
const logger = require(path.join(__sfdxdirname, 'lib', 'logApi'));
const messages = require(path.join(__dirname, '..', 'messages'))();

//const srcDevUtil = require(path.join(__dirname, 'srcDevUtil'));

// Private helper functions
/*
const _funtion_name = (arglist) => {
    console.log(arglist);
    return;
};
*/
const _toProperCase = (s) => {
  return s.toLowerCase().replace(/^(.)|\s(.)/g, 
          function($1) { return $1.toUpperCase(); });
};

const _mergeValues = (text, topic, command, namespace) => {
    return text.replace(/{{command}}/g, command)
    .replace(/{{topic}}/g, topic)
    .replace(/{{ucase_topic}}/g, _toProperCase(topic))
    .replace(/{{ucase_command}}/g, _toProperCase(command))
    .replace(/{{namespace}}/g, namespace);
}

const _makeOutput = (context) => {
    const path = require('path');
    const rootdir = path.basename(process.cwd());
    const topic = context.flags.topic;
    const command = context.flags.command;
    const pluginProjectName = context.flags.pluginname

return `
┌── ${ pluginProjectName }
├──── .vscode
│     └── launch.json
├──── commands
│     └── ${ topic }
│         ├── ${ topic }.js
│         └── ${ topic }_${ command }.js
├──── debug.js
├──── debug.sh
├──── index.js
├──── lib
│     ├── ${ topic }
│     │   └── ${ topic }_${ command }.js
│     ├── messages.js
│     └── cmdParser.js
└──── package.json
└──── test`;
}




/**
 * Manage aliases in the global .sfdx folder under alias.json. Aliases allow users
 * to specify alternate names for different properties used by the cli, such as orgs.
 *
 * All aliases are stored under a group. By default, all aliases are stored for
 * orgs but groups allow aliases to be applied for other commands, settings, and flags.
 *
 */
class Plugin {
    constructor() {
        this.logger = logger.child('config:set');
        this.context = {};
    }
    /**
     * Public members of the Plugin class
     * @param {array} aliasKeyAndValues An array of strings in the format <alias>=<value>
     * @param {string} group The group the alias belongs to. Defaults to ORGS.
     * @returns {Promise<object>} The top level of the project created.
     */
    execute(context) {
        return this.create(context);
    }

    getHumanSuccessMessage() {
        const successMsg = messages.getMessage('SuccessMessage', [], 'plugin_create')
        this.logger.log(successMsg + '\n\n' + _makeOutput(this.context));
    }

    create(context) {
        this.context = context;
        const newAliases = {};
        const pluginProjectName = context.flags.pluginname;
        const topic = context.flags.topic;
        const command = context.flags.command;
        const namespace = context.flags.namespace;
        const templateDir = context.templateDir;
        const requiresWorkspace = false;
        
        let promise;
        // This function will create a new directory at the
        // current location based on the pluginProjectName
        if (fs.existsSync(pluginProjectName)){
            var exec = require('child_process').exec;

            exec('rm -r ' + pluginProjectName, function (err, stdout, stderr) {
              // your callback goes here
            });
            //throw new Error(messages.getMessage('DirectoryExistsError', [], 'plugin_create'));
            fs.mkdirSync(pluginProjectName);
        } else {
            fs.mkdirSync(pluginProjectName);
        }

        // We now need to create the project structure based on the 
        // the plugin name.
        fs.mkdirSync(path.join(pluginProjectName, 'commands'));
        fs.mkdirSync(path.join(pluginProjectName, 'lib'));
        fs.mkdirSync(path.join(pluginProjectName, 'test'));
        fs.mkdirSync(path.join(pluginProjectName, '.vscode'));
        // The following are for a more structured plugin project that
        // has a topic and possible multiple commands
        fs.mkdirSync(path.join(pluginProjectName, 'commands', topic));
        fs.mkdirSync(path.join(pluginProjectName, 'lib', topic));


        // Now we need to scaffold some files into the project
        /* First is the topic file */
        let text = fs.readFileSync(path.join(templateDir, 'commands_topic.txt')).toString();
        text = _mergeValues(text, topic, command, namespace);
        fs.writeFileSync(path.join(pluginProjectName, 'commands', topic, topic + '.js'), text);

        /* Next, write out the command wrapper file under the topic */
        text = fs.readFileSync(path.join(templateDir, 'command_wrapper.txt')).toString();
        text = _mergeValues(text, topic, command, namespace);
        fs.writeFileSync(path.join(pluginProjectName, 'commands', topic, topic + '_' + command + '.js'), text);

        /* Next, write out the actual command implementation file in the lib/topic folder */
        text = fs.readFileSync(path.join(templateDir, 'command_implementation.txt')).toString();
        text = _mergeValues(text, topic, command, namespace);
        fs.writeFileSync(path.join(pluginProjectName, 'lib', topic, topic + 'Api' + '.js'), text);

        /* Next, create the messages utility class */
        text = fs.readFileSync(path.join(templateDir, 'command_messages.txt')).toString();
        text = _mergeValues(text, topic, command, namespace);
        fs.writeFileSync(path.join(pluginProjectName, 'lib', 'messages.js'), text);

        /* Next, scaffold out the index.js file */
        text = fs.readFileSync(path.join(templateDir, 'index.txt')).toString();
        text = _mergeValues(text, topic, command, namespace);
        fs.writeFileSync(path.join(pluginProjectName, 'index.js'), text);

        /* Next, output the package.json */
        text = fs.readFileSync(path.join(templateDir, 'package.txt')).toString();
        text = _mergeValues(text, topic, command, namespace);
        fs.writeFileSync(path.join(pluginProjectName, 'package.json'), text);

        /* Next, to ease dubugging, output the cmdParser.js file */
        text = fs.readFileSync(path.join(templateDir, 'cmdParser.txt')).toString();
        text = _mergeValues(text, topic, command, namespace);
        fs.writeFileSync(path.join(pluginProjectName, 'lib', 'cmdParser.js'), text);

        /* Next, output the debug.js file */
        text = fs.readFileSync(path.join(templateDir, 'debug.txt')).toString();
        text = _mergeValues(text, topic, command, namespace);
        fs.writeFileSync(path.join(pluginProjectName, 'debug.js'), text);

        text = fs.readFileSync(path.join(templateDir, 'debug_script.txt')).toString();
        fs.writeFileSync(path.join(pluginProjectName, 'debug.sh'), text);
        
        text = fs.readFileSync(path.join(templateDir, 'launch.txt')).toString();
        fs.writeFileSync(path.join(pluginProjectName, '.vscode', 'launch.json'), text);

        //this.getHumanSuccessMessage();
        promise = Promise.resolve(pluginProjectName);
        return promise;
    }

}

module.exports = Plugin;
