import { processNewOrder } from '../modules/design-patterns/publisher-subscriber';
import type { Router } from '../infra/http/router';

export function registerPubSubRoutes(router: Router) {
	router.on('POST', '/pub-sub', (req) => processNewOrder(req));
}
