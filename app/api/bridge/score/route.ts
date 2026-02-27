import { bridgeFetch } from '../../bridge_client'

export async function POST(request: Request): Promise<Response> {
  const body = await request.json()
  const res = await bridgeFetch('/score', {
    method: 'POST',
    body: JSON.stringify(body),
  })
  const data = await res.json()
  return new Response(JSON.stringify(data), {
    status: res.status,
    headers: { 'Content-Type': 'application/json' },
  })
}
