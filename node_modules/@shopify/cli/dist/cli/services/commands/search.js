import { openURL } from '@shopify/cli-kit/node/system';
export async function searchService(query) {
    const searchParams = new URLSearchParams();
    searchParams.append('search', query ?? '');
    await openURL(`https://shopify.dev?${searchParams.toString()}`);
}
//# sourceMappingURL=search.js.map