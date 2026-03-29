import type { Post, Comment, Community } from './api'

// mock communities
export const MOCK_COMMUNITIES: Community[] = [
  { id: 'c1', name: 'summoners-rift', logo: '⚔️', created_at: '2024-01-01', member_count: 124000, post_count: 8200 },
  { id: 'c2', name: 'aram-enjoyers', logo: '🌉', created_at: '2024-01-01', member_count: 45000, post_count: 3100 },
  { id: 'c3', name: 'lore-and-lore', logo: '📖', created_at: '2024-01-01', member_count: 31000, post_count: 2400 },
  { id: 'c4', name: 'clip-submissions', logo: '🎬', created_at: '2024-01-01', member_count: 89000, post_count: 12000 },
  { id: 'c5', name: 'champion-mains', logo: '🏆', created_at: '2024-01-01', member_count: 67000, post_count: 5600 },
]

// mock posts
export const MOCK_POSTS: Post[] = [
  {
    id: 'p1',
    title: 'Riot just buffed Jinx again — she now does 3000 damage with one auto at level 1',
    body: 'I cannot believe what I am reading in the patch notes. We have been complaining about this champion for months and they BUFF her. I have 500 games of Jinx and even I think this is insane. The passive damage stacking on the minigun form was already strong, but now with the base AD increase... GG Riot.',
    author: 'SummonerFelipe',
    community_id: 'c1',
    community_name: 'summoners-rift',
    created_at: new Date(Date.now() - 1000 * 60 * 34).toISOString(),
    is_pinned: false,
    vote_count: 2847,
    comment_count: 341,
  },
  {
    id: 'p2',
    title: 'My Vex montage after 1000 games — she goes from 0 to 100 real quick',
    body: 'After a thousand games on Vex I finally put together a highlights reel. The fear mechanic is still one of the most satisfying abilities in the game. Enjoy!',
    author: 'VexGloomMain',
    community_id: 'c4',
    community_name: 'clip-submissions',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    is_pinned: false,
    vote_count: 1204,
    comment_count: 88,
  },
  {
    id: 'p3',
    title: '[LORE] Arcane Season 2 completely broke my understanding of Jinx\'s timeline',
    body: "Been doing a deep dive into the lore post-Arcane and I'm realizing the timeline doesn't line up the way I thought. Powder's age during the show vs the game's lore events — let's discuss.",
    author: 'LoreArchivistMira',
    community_id: 'c3',
    community_name: 'lore-and-lore',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    is_pinned: true,
    vote_count: 5621,
    comment_count: 493,
  },
  {
    id: 'p4',
    title: 'ARAM tip: Stop building Luden\'s on Lux, please. I beg you.',
    body: "Seen this 12 times today. Comet + Luden's on Lux in ARAM is an absolute trap. The poke pattern doesn't synergize with the ARAM damage amp. Run Arcane Comet + Sorcerer's and watch your damage spike. You're welcome.",
    author: 'ARAMCoach',
    community_id: 'c2',
    community_name: 'aram-enjoyers',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    is_pinned: false,
    vote_count: 3012,
    comment_count: 217,
  },
  {
    id: 'p5',
    title: 'Hit Challenger on my Thresh account. AMA.',
    body: "After 2 years of one-tricking Thresh support I finally reached Challenger. 72% winrate over the last 300 games. AMA — rune setups, matchups, lantern pathing, whatever you want to know.",
    author: 'ThreshChall',
    community_id: 'c5',
    community_name: 'champion-mains',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 14).toISOString(),
    is_pinned: false,
    vote_count: 7890,
    comment_count: 624,
  },
  {
    id: 'p6',
    title: 'Why does Yasuo always have a 49% winrate yet somehow appears in every pro game?',
    body: "The eternal mystery. Ranked players hate him, pros love him. Is it the play pattern? The carry potential? The hair? Let's settle this.",
    author: 'Windwall_Enjoyer',
    community_id: 'c1',
    community_name: 'summoners-rift',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
    is_pinned: false,
    vote_count: 4321,
    comment_count: 512,
  },
]

// mock comments
export const MOCK_COMMENTS: Record<string, Comment[]> = {
  p1: [
    {
      id: 'cm1',
      body: "The real crime is that Caitlyn is still sitting at a 44% winrate while Jinx gets buffs. Wild times.",
      author: 'CaitlynMain2019',
      user_id: 'u2',
      post_id: 'p1',
      created_at: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
      is_pinned: false,
      vote_count: 842,
      replies: [
        {
          id: 'cm2',
          body: "Caitlyn mains have been crying since S11. At some point we have to accept she just isn't meta.",
          author: 'HardstuckPlat',
          user_id: 'u3',
          post_id: 'p1',
          parent_id: 'cm1',
          created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
          is_pinned: false,
          vote_count: 312,
        },
        {
          id: 'cm3',
          body: "This is such a cope take. Caitlyn has been S tier in pro play for the last two splits.",
          author: 'ProSceneWatcher',
          user_id: 'u4',
          post_id: 'p1',
          parent_id: 'cm1',
          created_at: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
          is_pinned: false,
          vote_count: 201,
        },
      ],
    },
    {
      id: 'cm4',
      body: "Meanwhile Nidalee is sitting at a 43% winrate in jungle and nobody bats an eye. Balance team works in mysterious ways.",
      author: 'JungleGapRealTalk',
      user_id: 'u5',
      post_id: 'p1',
      created_at: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
      is_pinned: false,
      vote_count: 554,
    },
    {
      id: 'cm5',
      body: "I've been playing Jinx for 8 years. She does NOT need buffs. I genuinely do not understand what they're looking at internally.",
      author: 'JinxOTP_8Years',
      user_id: 'u6',
      post_id: 'p1',
      created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      is_pinned: false,
      vote_count: 1200,
    },
  ],
  p3: [
    {
      id: 'cm6',
      body: "The timeline is intentionally ambiguous by Riot. They've said in interviews the game and Arcane exist in 'the same universe but different layers.' It's frustrating but also kind of fascinating world-building.",
      author: 'LoreArchivistMira',
      user_id: 'u7',
      post_id: 'p3',
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
      is_pinned: true,
      vote_count: 2100,
    },
  ],
}

// delay simulator lang
export function delay(ms = 400) {
  return new Promise<void>(r => setTimeout(r, ms))
}
