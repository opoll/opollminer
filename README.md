# opollminer
Official Mining Application for [OpenPoll](http://openpoll.io/) Platform

# How To Run

1.) Download the project and `cd` to the directory of the project. (The user must be in the same directory as the application before we create a [symlink](https://docs.npmjs.com/cli/link))

2.) Run `npm install` to get all appropriate node modules necessary to run the application.

3.) Run `npm link` to create a [symlink](https://kb.iu.edu/d/abbe) (and `npm unlink` to undo the symlink) so that commands can just be prefaced by "om" (stands for openpoll miner).

4.) Finally, a user can call `om [command name] [args]` globally. Now the user can use the CLI more conveniently to interface with the application.

## Commands Supported
