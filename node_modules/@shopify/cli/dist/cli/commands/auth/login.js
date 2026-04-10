import Command from '@shopify/cli-kit/node/base-command';
import { promptSessionSelect } from '@shopify/cli-kit/node/session-prompt';
import { Flags } from '@oclif/core';
import { outputCompleted } from '@shopify/cli-kit/node/output';
class Login extends Command {
    async run() {
        const { flags } = await this.parse(Login);
        const result = await promptSessionSelect(flags.alias);
        outputCompleted(`Current account: ${result}.`);
    }
}
Login.description = 'Logs you in to your Shopify account.';
Login.flags = {
    alias: Flags.string({
        description: 'Alias of the session you want to login to.',
        env: 'SHOPIFY_FLAG_AUTH_ALIAS',
    }),
};
export default Login;
//# sourceMappingURL=login.js.map