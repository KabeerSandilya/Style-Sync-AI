import { Client } from '@upstash/qstash'

let _client: Client | null = null

export function getQStash(): Client | null {
  if (!process.env.QSTASH_TOKEN) return null
  if (!_client) _client = new Client({ token: process.env.QSTASH_TOKEN })
  return _client
}

export function getAppUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? '').replace(/\/$/, '')
}
