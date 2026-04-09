import { searchService } from '../services/commands/search.js';
import Command from '@shopify/cli-kit/node/base-command';
import { Args } from '@oclif/core';
class Search extends Command {
    async run() {
        const { args } = await this.parse(Search);
        await searchService(args.query);
    }
}
Search.description = 'Starts a search on shopify.dev.';
Search.usage = `search [query]`;
Search.examples = [
    `# open the search modal on Shopify.dev
    shopify search

    # search for a term on Shopify.dev
    shopify search <query>

    # search for a phrase on Shopify.dev
    shopify search "<a search query separated by spaces>"
    `,
];
Search.args = {
    query: Args.string(),
};
export default Search;
//# sourceMappingURL=search.js.map