/*
 * Copyright (c) 2016, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root  or https://opensource.org/licenses/BSD-3-Clause
 */

const util = require('util');

const TARGET_USERNAME_PARAM = 'targetusername';

const messages = {
    default: {
        en_US: {
            // errors
            // help
            displayCommandPluginCreateHelp: 'Creates a new plugin project on your local file system.'
        }
    },

    plugin: {
        en_US: {
            mainTopicDescriptionHelp: 'set up a plugin project',
            mainTopicLongDescriptionHelp: 'Use commands in the plugins topic to set up a plugin project force the SDX CLI.'
        }
    },

    plugin_create: {
      en_US: {
            help: "Help information specific to this command",
            description: "Plugin create description",
            longDescription: "Longer description of Plugin create.",
            GeneralError: "A general error for the plugin create command.",
            DirectoryExistsError: "That directory already exists.",
            SuccessMessage: "Successfully created plug-in project."
      }

    }

 };

const _getLocale = function() {
    return 'en_US';
};

module.exports = function(locale = _getLocale()) {
    return {
        getMessage(label, args, bundle = 'default') {

            const bundleLocale = messages[bundle][locale];

            if (util.isNullOrUndefined(bundleLocale)) {
                return null;
            }

            if (util.isNullOrUndefined(bundleLocale[label])) {
                throw new Error(util.format(bundleLocale.UndefinedLocalizationLabel, bundle, label, locale));
            }

            if (util.isNullOrUndefined(args)) {
                return bundleLocale[label];
            } else {
                const everyone = [].concat(bundleLocale[label], args);
                return util.format(...everyone);
            }
        },

        getLocale() {
            return _getLocale();
        },

        get targetusername() {
            return TARGET_USERNAME_PARAM;
        }
    };
};
