#!/bin/bash

while [ $# -gt 0 ]
do
	echo $1
	command=$command" "$1
	shift
done
echo $command
node --inspect-brk /Users/dcarroll/Documents/Projects/DXBeta/plugin-gen/debug.js "{ \"cmd\":\"$command\" }"
#node --inspect-brk debug2.js "{ \"cmd\":\"$command\" }"
