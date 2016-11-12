# discord-loader
An enhanced Discord client.

`discord-loader --appdir /path/to/Discord/ [--profile profilename] [--debug]` [^1]

[^1]: /path/to/Discord/ ... The path to the Discord application that contains `app-*.*.*` and `packages` directories.

## Supported Features
- Multiple instances
- Custom scripts
- Custom stylesheets

## Installation
There is nothing special to do to install discord-loader.
Just download the files and execute the above command.

## Options
- --appdir
- - Specifies the path to Discord.

- --profile
- - Specifies profile name.
- - To launch multiple instances of Discord, specify this differently for each.

- --debug
- - Enables debug mode.

## Using Example
1. If you have never launched discord-loader, launch it once to create `loader` directory.
2. Copy all the files in the `/example` directory to `/path/to/Discord/loader/user` directory.

## Warning
DO INSTALL / RUN SCRIPTS ONLY IF YOU ARE SURE IT IS SAFE.
RUNNING MALICIOUS SCRIPTS MAY CAUSE SERIOUS DAMAGE TO YOU.
