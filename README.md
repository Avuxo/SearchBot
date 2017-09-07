# Search Bot
## A user bot to search discord
The primary purpose of this bot is to rate users by messages sent, that was the original purpose, and due to a specific requirement of that original bot, it now supports a headless mode where the bot operates as a daemon and can be used from a client (client.c).

Why include a client/server architecture in a discord bot like this? It was my original idea and it sounded cooler than just designing a normal bot, not to mention I haven't written C in a while and I enjoy it.

### REPL mode
Search Bot's default mode starts it into a REPL. Commands in this REPL begin with a `/` and may have arguments. To get a list of commands use `/h` after the bot Displays `Ready`. Commands (with the exception of `/h`) are not processed until the bot is ready (you can tell its prepared when it says `Ready`).

### Headless mode (running as a daemon)
Search Bot can be run as a daemon on UNIX-derivative systems (untested on windows, written using UNIX sockets). In order to do this, start with the `-s` flag (ex: `$ node bot.js -s &` would start it as a background process)

In order to communicate with the bot, you must use the `client`. In order to compile the client, use `$ gcc client.c -o client` (has no non-standard dependencies on UNIX-like systems) to compile.

`client` has a number of command line arguments, in order to see them all use the `-h` flag.