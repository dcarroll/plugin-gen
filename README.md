# plugin-gen

## Use the following steps to install

**NOTE:** Make sure you have downloaded the [Salesforce CLI](https://developer.salesforce.com/tools/sfdxcli)

### 1. Download or clone the repo
```
git clone https://github.com/dcarroll/plugin_gen.git
```

### 2. Install using npm

```
cd plugin_gen
npm install
```

### Link the plugin to the Salesforce CLI

```
sfdx plugins:link
```

### Test the install

```
sfdx djc:plugin:create -h
```

## Using the Plugin

```Usage: sfdx davecarroll:plugin:create -n <string> -s <string> -t <string> -c <string> [--json] [--loglevel <string>]

Plugin create description

 -c, --command COMMAND       # initial command name for the plugin
 -s, --namespace NAMESPACE   # your unique namespace
 -n, --pluginname PLUGINNAME # name of the plugin
 -t, --topic TOPIC           # topic for the plugin
 --json                      # command emits json output
 --loglevel LOGLEVEL         # logging level for this command invocation (error*,trace,debug,info,warn,fatal)

Help information specific to this command



