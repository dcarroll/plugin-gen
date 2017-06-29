/*
 * Copyright (c) 2016, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root  or https://opensource.org/licenses/BSD-3-Clause
 */

'use strict';

const path = require('path');

const messages = require(path.join(__dirname, '..', '..', 'lib', 'messages'))();

module.exports = function () {
    return {
        name: 'plugin',
        description: messages.getMessage('mainTopicDescriptionHelp', [], 'plugin'),
        longDescription:  messages.getMessage('mainTopicLongDescriptionHelp', [], 'plugin')
    };
};