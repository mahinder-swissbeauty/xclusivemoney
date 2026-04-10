import { versionService } from '../services/commands/version.js';
import Command from '@shopify/cli-kit/node/base-command';
class Version extends Command {
    async run() {
        await versionService();
    }
}
Version.description = 'Shopify CLI version currently installed.';
export default Version;
//# sourceMappingURL=version.js.map