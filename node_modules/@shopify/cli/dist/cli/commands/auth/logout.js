import Command from '@shopify/cli-kit/node/base-command';
import { outputSuccess } from '@shopify/cli-kit/node/output';
import { logout } from '@shopify/cli-kit/node/session';
class Logout extends Command {
    async run() {
        await logout();
        outputSuccess('Logged out from all the accounts');
    }
}
Logout.description = 'Logs you out of the Shopify account or Partner account and store.';
export default Logout;
//# sourceMappingURL=logout.js.map