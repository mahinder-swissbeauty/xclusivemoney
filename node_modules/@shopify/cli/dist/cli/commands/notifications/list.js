import { list } from '../../services/commands/notifications.js';
import { Flags } from '@oclif/core';
import Command from '@shopify/cli-kit/node/base-command';
import { sendErrorToBugsnag } from '@shopify/cli-kit/node/error-handler';
class List extends Command {
    async run() {
        const { flags } = await this.parse(List);
        try {
            await list();
        }
        catch (error) {
            let message = `Error fetching notifications`;
            if (error instanceof Error) {
                message = message.concat(`: ${error.message}`);
            }
            await sendErrorToBugsnag(message, 'expected_error');
            if (!flags['ignore-errors']) {
                throw error;
            }
        }
    }
}
List.description = 'List current notifications configured for the CLI.';
List.hidden = true;
List.flags = {
    'ignore-errors': Flags.boolean({
        hidden: false,
        description: "Don't fail if an error occurs.",
        env: 'SHOPIFY_FLAG_IGNORE_ERRORS',
    }),
};
export default List;
//# sourceMappingURL=list.js.map