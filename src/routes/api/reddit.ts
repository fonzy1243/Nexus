import { createFileRoute } from '@tanstack/react-router'

const REDDIT_URL = 'https://www.reddit.com/r/leagueoflegends/.json?limit=25'

export const Route = createFileRoute('/api/reddit')({
  server: {
    handlers: {
      GET: async () => {
        const response = await fetch(REDDIT_URL, {
          headers: {
            'User-Agent': 'Nexus-App/1.0 (by /u/you)',
            Accept: 'application/json',
          },
        })

        if (!response.ok) {
          return new Response('Reddit fetch failed', { status: response.status })
        }

        const json = await response.json()
        return new Response(JSON.stringify(json), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        })
      },
    },
  },
})
