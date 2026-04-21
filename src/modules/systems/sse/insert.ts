import { sql } from '../../../infra/database/db';
import type { MessageRow } from './events';

export async function insert(request: Request) {
	const url = new URL(request.url);
	const body =
		url.searchParams.get('body') ?? `row at ${new Date().toISOString()}`;

	const inserted = await sql<MessageRow[]>`
    insert into messages (body)
    values (${body})
    returning id, body, created_at::text
  `;

	return Response.json(inserted[0], { status: 201 });
}
