import Command from '@shopify/cli-kit/node/base-command';
import { clearCache } from '@shopify/cli-kit/node/cli';
class ClearCache extends Command {
    async run() {
        clearCache();
    }
}
ClearCache.description = 'Clear the CLI cache, used to store some API responses and handle notifications status';
ClearCache.hidden = true;
export default ClearCache;
//# sourceMappingURL=clear.js.map