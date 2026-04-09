import { Args, Flags, loadHelpClass } from '@oclif/core';
import Command from '@shopify/cli-kit/node/base-command';
class HelpCommand extends Command {
    async run() {
        const { argv, flags } = await this.parse(HelpCommand);
        const Help = await loadHelpClass(this.config);
        const help = new Help(this.config, { all: flags['nested-commands'] });
        await help.showHelp(argv);
    }
}
HelpCommand.args = {
    command: Args.string({ description: 'Command to show help for.', required: false }),
};
HelpCommand.description = 'Display help for Shopify CLI';
HelpCommand.usage = `help [command] [flags]`;
HelpCommand.flags = {
    'nested-commands': Flags.boolean({
        char: 'n',
        description: 'Include all nested commands in the output.',
        env: 'SHOPIFY_FLAG_CLI_NESTED_COMMANDS',
        default: false,
    }),
};
HelpCommand.strict = false;
export default HelpCommand;
//# sourceMappingURL=help.js.map