import { generate } from '../../services/commands/notifications.js';
import Command from '@shopify/cli-kit/node/base-command';
class Generate extends Command {
    async run() {
        await generate();
    }
}
Generate.description = 'Generate a notifications.json file for the the CLI, appending a new notification to the current file.';
Generate.hidden = true;
export default Generate;
//# sourceMappingURL=generate.js.map