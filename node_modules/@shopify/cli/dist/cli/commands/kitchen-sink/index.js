import { asyncTasks } from '../../services/kitchen-sink/async.js';
import { staticService } from '../../services/kitchen-sink/static.js';
import { prompts } from '../../services/kitchen-sink/prompts.js';
import Command from '@shopify/cli-kit/node/base-command';
/**
 * This command is used to output all the UI components of the CLI.
 * It's useful to test how they behave under different terminal sizes
 * and to help update the documentation when they change.
 */
class KitchenSinkAll extends Command {
    async run() {
        await staticService();
        await prompts();
        await asyncTasks();
    }
}
KitchenSinkAll.description = 'View all the available UI kit components';
KitchenSinkAll.hiddenAliases = ['kitchen-sink all'];
KitchenSinkAll.hidden = true;
export default KitchenSinkAll;
//# sourceMappingURL=index.js.map