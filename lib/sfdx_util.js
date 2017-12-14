'use strict';
const os = require('os');
const path = require('path');
const util = require('util');
const _ = require("lodash");

Documents/Projects/CLISource/dcarroll
//const __sfdxdirname = os.homedir() + '/.local/share/sfdx/plugins/node_modules/salesforce-alm/dist';
const __sfdxdirname = os.homedir() + '/Documents/Projects/CLISource/dcarroll/force-com-toolbelt/dist';
const logger = require(path.join(__sfdxdirname, 'lib', 'logApi'));
const messages = require(path.join(__sfdxdirname, 'lib', 'messages'))();
const CommandRegistry = require(path.join(__sfdxdirname, 'lib', 'commandRegistry'));
const srcDevUtil = require(path.join(__sfdxdirname, 'lib', 'srcDevUtil'));

const cliNamespaceSupported = true;

const nameSpace = 'davecarroll';
let start;

class SFDX_Util {

    constructor(cmdsDir) {
        this.cliNamespaceSupported = true;
        this.COMMANDS_DIR = cmdsDir;
        this.commandRegistry = new CommandRegistry(
            nameSpace, 
            this._commandPreFilter,
            this.execCommand, 
            cliNamespaceSupported,
            this.COMMANDS_DIR );
        this.logger = logger.child('config:set');
        this.context = {};
        if (cliNamespaceSupported) {
            exports.namespace = {
                name: nameSpace,
                description : 'this is dave\'s namespace'
            };
            exports.topics = this.commandRegistry.topics;
        } else {
            exports.topic = {
                name: nameSpace,
                description: 'this is dave\'s namespace'
            };
        }
        this.start;

    };

    static _isApiMode (context) {

        const envVar = process.env.FORCE_CONTENT_TYPE;
        // If the environment variable or the command line parameter is indicating api mode.
        return (!util.isNullOrUndefined(envVar) && envVar === 'JSON') || context.flags.json === true;

    };

    static _exit (cmdContext = {}) {
        let softExit;

        try {
            const Config = require(path.join(__sfdxdirname, 'lib', 'configApi')).Config; // eslint-disable-line global-require
            //softExit = cmdContext.softExit || process.env.SOFT_EXIT; // || new Config().getAppConfig().softExit;
        }
        catch (e) {
            // We are handling SyntaxError's in other places but 'new Config().getAppConfig' can throw a secondary syntax error
            if (e.name !== 'InvalidProjectWorkspace' && e.name !== 'SyntaxError' && e.name !== 'InvalidJsonCasing') {
                throw e;
            }
        }

        const _ = require('lodash'); // eslint-disable-line global-require

        // For unit testing we want soft exits; i.e., no process.exit()
        if (_.isNil(softExit)) {
            // give logs a little extra time flush logs to file.
            // exit normally when loglevel===error (default) so that
            // most invocations don't incur this tax.
            // https://github.com/trentm/node-bunyan/issues/95
            if (logger.isError()) {
                process.exit(process.exitCode); // eslint-disable-line no-process-exit
            } else {
                const wait = process.env.SFDX_LOG_WRITE_WAIT || 1000;
                setTimeout(() => process.exit(process.exitCode), wait); // eslint-disable-line no-process-exit
            }
        }
    };

    static _logSuccess(command, context, obj) {
        const _ = require('lodash'); // eslint-disable-line global-require

        if (SFDX_Util._isApiMode(context)) {
            logger.logJson({ status: process.exitCode || 0, result: obj });
        }
        else {

            // For tables with no results we will display a simple message "No results found"
            if (Array.isArray(obj) && obj.length < 1) {
                logger.log(messages.getMessage('noResultsFound'));
                return;
            }

            if (_.isFunction(command.getColumnData)) {

                const columnData = command.getColumnData();

                // If the columnData is an array of arrays assume we are displaying multiple tables
                if (_.isArray(columnData) && _.isArray(columnData[0])) {

                    // each column data object represents a set of table column headers; therefore it geometrically matches
                    // one table to display. Obj contains the row data.
                    columnData.forEach((tableColumnHeaders, index) => {

                        // display a separator to give a sense of organization.
                        if (index > 0) {
                            logger.log(os.EOL);
                        }

                        logger.table(obj[index], { columns: tableColumnHeaders });
                    });
                }
                else {
                    // Single output
                    logger.table(obj, { columns: columnData });
                }
            }
            else {
                const message = command.getHumanSuccessMessage && command.getHumanSuccessMessage(obj);
                if (!util.isNullOrUndefined(message) && message !== '') {
                    logger.log(message);
                }
            }
        }
    };

    // todo: why this only works when loglevel is set?
    static _logCommandComplete (cmdName) {
        const fileName = 'sfdx-usage.json';
        const totalTime = new Date().getTime() - start;

        logger.info(`DONE! Completed '${cmdName}' in ${totalTime / 1000.0}s`);

        const dayInMilliseconds = 1000 * 60 * 60 * 24;
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        // Get timestamp in seconds, at the start of the fay.
        const timestamp = startOfDay.getTime();

        return srcDevUtil.getGlobalConfig(fileName, {})
        .then(contents => {
            let retPromise = Promise.resolve();
            if (!contents.startTime) {
                contents.startTime = timestamp;
                retPromise = srcDevUtil.saveGlobalConfig(fileName, contents);
            }

            function calcUsage(hubOrg, hubOrgId) {
                const moment = require('moment'); // eslint-disable-line global-require

                const analyticsCmd = childProcess.spawnSync('sfdx', ['analytics'], { encoding: 'utf8' });

                if (analyticsCmd.status === 1) {
                    return Promise.resolve();
                }

                let commands;

                try {
                    commands = JSON.parse(analyticsCmd.stdout).commands;
                } catch (error) {
                    return Promise.resolve();
                }

                const usages = {};

                commands.forEach(command => {
                    let version = `${command.version}`;

                    if (command.plugin_version) {
                        version = `${version} ${command.plugin_version}`;
                    }

                    const commandKey = `${command.command}-${version}`;
                    const runtime = command.runtime;

                    if (!usages[commandKey]) {
                        usages[commandKey] = {
                            commandName: command.command,
                            toolbeltVersion: version,
                            hubOrgId,
                            usageDate: moment(startOfDay).format('YYYYMMDD'),
                            totalExecutions: 0,
                            totalErrors: 0,
                            avgRuntime: 0,
                            minRuntime: runtime,
                            maxRuntime: runtime
                        };
                    }

                    if (command.status !== 0) {
                        usages[commandKey].totalErrors++;
                    }

                    // Run an accumalative average, which is ((avg * totalExecution) + newTime) / (totalExecutions + 1)
                    usages[commandKey].avgRuntime = Math.round((runtime + (usages[commandKey].avgRuntime * (usages[commandKey].totalExecutions))) / (usages[commandKey].totalExecutions + 1));

                    usages[commandKey].totalExecutions++;

                    // update minRuntime and maxRuntime
                    if (runtime > usages[commandKey].maxRuntime) {
                        usages[commandKey].maxRuntime = runtime;
                    } else if (runtime < usages[commandKey].minRuntime) {
                        usages[commandKey].minRuntime = runtime;
                    }
                });

                const _ = require('lodash'); // eslint-disable-line global-require

                return logger.logServerUsages(hubOrg, _.values(usages));
            }

            // If it has been past 24 hours, then log the usage for previous day.
            if (now.getTime() - contents.startTime >= dayInMilliseconds) {
                // get hub org
                const Org = require(path.join(__sfdxdirname, 'lib', 'scratchOrgApi')); // eslint-disable-line global-require
                const hubOrg = new Org(undefined, Org.Defaults.DEVHUB);
                let hubOrgId;

                return hubOrg.getConfig()
                .then(config => {
                    hubOrgId = config.orgId;
                })
                // Flush usage to server.
                .then(() => calcUsage(hubOrg, hubOrgId))
                .then(() => {
                    // Reset time
                    contents.startTime = timestamp;
                    childProcess.spawnSync('sfdx', ['analytics:clear'], { encoding: 'utf8' });
                    return srcDevUtil.saveGlobalConfig(fileName, contents);
                });
            }

            return retPromise;
        })
        .catch(() => { /* We don't want the comand to fail if sending usage fails */ });
    };

    static _startSpinner(context) {
        const Spinner = require('cli-spinner').Spinner; // eslint-disable-line global-require

        // show spinner if desired and we are not generating json results
        if (context.showProgress && process.env.FORCE_SHOW_SPINNER && !context.json) {
            context.spinner = new Spinner(process.env.FORCE_SPINNER_TITLE || 'Processing... %s');
            if (process.env.FORCE_SPINNER_STRING) {
                const spinnerIdx = parseInt(process.env.FORCE_SPINNER_STRING);
                if (isNaN(spinnerIdx)) {
                    context.spinner.setSpinnerString(process.env.FORCE_SPINNER_STRING);
                } else {
                    context.spinner.setSpinnerString(spinnerIdx);
                }
            } else {
                context.spinner.setSpinnerString('|/-\\');
            }
            if (process.env.FORCE_SPINNER_DELAY) {
                context.spinner.setSpinnerDelay(parseInt(process.env.FORCE_SPINNER_DELAY));
            }
            context.spinner.start();
        }
    };

    static _stopSpinner (context) {
        try {
            if (context.spinner && context.spinner.isSpinning()) {
                context.spinner.stop(!process.env.FORCE_SPINNER_SKIP_CLEAN);
                delete context.spinner;
            }
        } catch (err) {
            logger.warn(err);
        }
    };

    static _isApiMode (context) {

        const envVar = process.env.FORCE_CONTENT_TYPE;
        // If the environment variable or the command line parameter is indicating api mode.
        return (!util.isNullOrUndefined(envVar) && envVar === 'JSON') || context.flags.json === true;

    };

    static _logError (command, context, err) {

        const _ = require('lodash'); // eslint-disable-line global-require

        // provide action if instanceurl is incorrect
        if (context.org && context.org.usingAccessToken && _.isNil(err.action)
                && (err.message.match(/Session expired or invalid/) || err.message.match(/Destination URL not reset/))) {
            err.action = messages.getMessage('invalidInstanceUrlForAccessTokenAction');
        }

        // compose final error object
        const error = {
            message: err.message || err.rows,
            status: process.exitCode || 1,
            stack: err.stack,
            name: err.name
        };

        // set action on error
        if (!_.isNil(err.action)) {
            error.action = err.action;
        }

        // log as json, if applicable
        if (SFDX_Util._isApiMode(context)) {
            logger.logJsonError(error);
        } else {
            let message = err.message;

            if (_.isFunction(command.getHumanErrorMessage)) {
                const humanMessage = command.getHumanErrorMessage(err);

                if (humanMessage) {
                    message = humanMessage;
                }
            }

            // Ensure the message ends in a period.
            message = message.endsWith('.') ? message : message.concat('.');

            // format action, if applicable
            if (!_.isNil(error.action)) {
                // log action, if provided
                const action = {
                    message,
                    action: error.action
                };
                logger.action(action);
            } else if (err.rows && err.columns) {
                logger.table(err.rows, { columns: err.columns });
            } else {
                logger.error(message);
            }

            // Debug the stack for additional debug information
            logger.error(false, error);
        }
    };

    // several ways to get at command name given invocation context, eg cmd-line, test, API
    static _determineCommandName (command, context, defaultName = 'n/a') {
        let name = context.cmd;
        if (!name) {
            if (context.command) {
                name = `${nameSpace}:${context.command.topic}:${context.command.command}`;
            } else if (command && command.constructor) {
                name = command.constructor.name;
            } else {
                name = defaultName;
            }
        }

        return name;
    };

    execCommand (command, context, stdin) {
        const cmdName = SFDX_Util._determineCommandName(command, context);

        // Still need to set the log level for toolbelt promise chain.
        logger.setLevel(context.flags.loglevel || process.env.SFDX_LOG_LEVEL);
        logger.debug(`Invoking '${cmdName}' on username '${context.org ? context.org.getName() : 'n/a'}' with parameters: ${context.flags ? JSON.stringify(context.flags) : 'n/a'}`);

        // Reset process.exitCode since during testing we only soft exit.
        process.exitCode = undefined;

        let fixedContext;
        // First lets check if the command can do something with a scratch org.
        // Wrap in a promise since command.validate can throw, and we want it to
        // be part of the promise chain.
        return Promise.resolve()
            /*.then(() => {
                if (util.isFunction(command.validate)) {
                    return command.validate(context);
                }
                return context;
            })
            .then((_fixedContext) => {
                fixedContext = _fixedContext;

                // ScratchOrgs require a workspace.
                if (!context.requiresWorkspace) {
                    return Promise.resolve();
                }

                if (util.isFunction(context.org) && !fixedContext.json) {
                    return context.org.getConfig();
                }

                return Promise.resolve();
            })

            // If it can do something with a scratch org display a pre execute message.
            .then((orgData) => {
                if (!util.isNullOrUndefined(orgData) && command.getPreExecuteMessage){
                    // Only display the pre exec command when --json is not specified.
                    logger.log(`${command.getPreExecuteMessage(orgData)}${os.EOL}`);
                }
                return Promise.resolve();
            })*/

            /*.then(() => {
    					_startSpinner(context)
    				})*/

            // Actually execute the command
            .then(() => {
                return command.execute(context, stdin);
            })

            // The command completed successfully so display some results.
            .then((obj) => {
                SFDX_Util._stopSpinner(context);
                SFDX_Util._logSuccess(command, context, obj);

                // log before exit
                return SFDX_Util._logCommandComplete(cmdName, context).then(() => obj);
            })
            .then((obj) => {
                SFDX_Util._exit(context);
                return obj;
            })

            // The command had issues so display some error information.
            .catch((err) => {
                SFDX_Util._stopSpinner(context);

                SFDX_Util._logError(command, context, err);

                const Force = require(path.join(__sfdxdirname, 'lib', 'force')); // eslint-disable-line global-require

                // Log before exit. Log the error on the server
                // some commands do not create a Force instance - so providing one if not present
                return SFDX_Util._logCommandComplete(cmdName, context, err)
                    .then(() => logger.logServerError(err, command.force || new Force(), context))
                    .finally(() => {
                        process.exitCode = 1;
                        return SFDX_Util._exit(context);
                    });
            });

    };


    _commandPreFilter (cliContext) {
        logger.setCommandName(SFDX_Util._determineCommandName(undefined, cliContext, null));

        // beginning of plugin execution
        start = new Date().getTime();

        try {
            //const indexPreFilters = require(path.join(__sfdxdirname, 'lib', 'indexPreFilters')); // eslint-disable-line global-require
            //indexPreFilters.validateProjectDir(this.commandContext, _logError, messages);

            logger.setHumanConsumable(!cliContext.flags.json && !cliContext.flags.quiet);
        }
        catch (e) {
            logger.error(e.message);
            // Debug the stack for additional debug information
            logger.info(e);

            // REVIEWME: why exit?
            process.exit(1);// eslint-disable-line no-process-exit
        }

        // need to get the showProgress flag from the static "command" definition object into the context
        cliContext.showProgress = this.commandContext.showProgress;

        let promise = Promise.resolve();

        return promise
            .then(() => {
    					this.command(cliContext)
    				})
            .catch((err) => {
                SFDX_Util._logError({}, cliContext, err);
                process.exitCode = 1;
                SFDX_Util._exit(cliContext);
            });
    };

    getCommands () {
        return this.commandRegistry.commands;
    };

    getTopics () {
        let topics = [];
        this.commandRegistry.commands.forEach(function(element) {
            if (element.topic.length > 0) {
                topics.push({ "name": element.topic, "description": element.topic.description });
            }
        }, this);
        return topics;
    }
    getCommandRegistry () {
        return this.commandRegistry;
    };

    getDecorator () {
        return this.commandRegistry.decorator;
    };

    parseCommand(cmd, args) {
        let result = []; //make([]string, 0, len(args))
        let flags = {}; //map[string]interface{}{}
        let parseFlags = true;
        let possibleFlags = [];

        if (cmd.flags && cmd.flags.length > 0) {
            cmd.flags.forEach(function(f)
            { // := range command.Flags {
                //f := flag
                possibleFlags.push(f); // = append(possibleFlags, &f)
            });
        }

        for (let i = 0; i < args.length; i++) {
            switch (true) {
            case parseFlags && (args[i] == "--"):
                parseFlags = false
            case parseFlags && (args[i] == "--help" || args[i] == "-h"):
                return; //nil, nil, errHelp
            case parseFlags && (args[i] == "--no-color"):
                break;
            case parseFlags && args[i][0] === "-": //strings.HasPrefix(args[i], "-"):
                let val;
                let flag = this._parseFlag(args[i], possibleFlags);  //need to return an object with val and err
                if (flag.error && flag.error.message.endsWith("needs a value")) {
                    i++
                    if (args.length === i) {
                        throw new Error(err);
                        //process.exit(); //ExitWithMessage(err.Error())
                    }
                    flag = this._parseFlag(args[i-1]+"="+args[i], possibleFlags);
                }
                if (flag.flag) {
                    if (flag.flag.hasValue) {
                        flags[flag.flag.name] = flag.value
                    } else {
                        flags[flag.flag.name] = true
                    }
                }
                switch (true) {
                case flag.error != null:
                    throw new Error(flag.error);
                    //process.exit(); //ExitWithMessage(err.Error())
                case !flag.flag && cmd.variableArgs:
                    result.push(args[i]); // = append(result, args[i])
                case !flag.flag == null: // == nil:
                    throw new Error(args[i]);
                    //process.exit(); //command.unexpectedFlagErr(args[i])
                }
            default:
                result.push(args[i]); // = append(result, args[i])
            }
        }
        cmd.flags.forEach(function(flag) 
        { //for _, flag := range command.Flags {
            if (flag.Required && flags[flag.Name]) { //flags[flag.Name] == nil {
                throw new Error("Required flag: " + flag.name);
                //process.exit(); //ExitWithMessage("Required flag: %s", flag.String())
            }
        });
        return { "result":result, "flags":flags }; //, nil
    };

    _parseArgs(cmd, args) { //command *Command, args []string) (result map[string]string, flags map[string]interface{}, err error) {
        let result = {}; //map[string]string{}
        let vargs = parseVarArgs(cmd, args); //args, flags, err = parseVarArgs(command, args)
        if (vargs.err) {
            return { "result":null, "flags":null, "err":vargs.err}; //nil, nil, err
        }
        if (args.length > cmd.args.length) { //len(args) > len(command.Args) {
            //command.unexpectedArgumentsErr(args.slice(cmd.args.length)); //[len(command.Args):])
            throw new Error("unexpected argument - " + args.slice(cmd.args.length));
            //process.exit();
        }
        args.forEach(function(arg, i) { //for i, arg := range args {
            result[cmd.args[i].name] = arg; //result[command.Args[i].Name] = arg
        });
        cmd.args.forEach(function(arg) { //for _, arg := range command.Args {
            if (!arg.optional && result[arg.name] === "") {
                throw new Error("Missing argument: " + arg.name);
                //process.exit(); //ExitWithMessage("Missing argument: %s", strings.ToUpper(arg.Name))
            }
        });
        return { "result":result, "flags":flags, "err":null };
    }

    // ParseFlag parses a flag from argument inputs
    _parseFlag(input, flags) {
        let keyvalue = input.split("=", 2); //:= strings.SplitN(input, "=", 2)
        let key = keyvalue[0];
        let value = "";
        if (keyvalue.length === 2) { //len(keyvalue) == 2 {
            value = keyvalue[1];
        }
        if (key.length > 2 && key[1] != '-') { //len(key) > 2 && key[1] != '-' {
            return this._parseFlag(key.slice(2) + "=" + key.slice(0, 3), flags); //(key[:2]+"="+key[2:], flags)
        }

        for (let i=0;i<flags.length;i++) {
            const flag = flags[i];
            if (flag.char != "" && key == "-"+flag.char || key == "--"+flag.name) {
                flag.json = "";
                if (flag.hasValue) {
                    if (value == "") {
                        const err = new Error(flag.name + " needs a value");
                        return { "flag":null, "string":"", "error":err }
                    }
                    return { "flag":flag, "value":value, "error":null };
                }
                if (value != "") {
                    const err = new Error(flag.name + " does not take a value");
                    return { "flag":null, "value":"", "error":err  };
                }
                return { "flag":flag, "value":"", "error":null };
            }
        };
        return { "flag":null, "value":"", "error":null };
    }

};

exports.cliNamespaceSupported = cliNamespaceSupported;
exports.commands = SFDX_Util.getCommands;
exports.commandDecorator = SFDX_Util.getDecorator;
exports.logger = logger;
exports.commandRegistry = SFDX_Util.getCommandRegistry;
exports.SFDX_Util = SFDX_Util;
