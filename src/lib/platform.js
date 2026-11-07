// Works out where the game saves data.
//   cloud: the claude.ai page database. Each player's save is private to them, auctions are shared.
//   local: this browser's localStorage (running with `npm run dev`, signed out, or view-only access).

function withTimeout(promise, ms) {
  return Promise.race([promise, new Promise(resolve => setTimeout(() => resolve(null), ms))])
}

async function waitForClaude(ms) {
  const start = Date.now()
  while (!window.claude?.use) {
    if (Date.now() - start > ms) return null
    await new Promise(r => setTimeout(r, 100))
  }
  return window.claude
}

export async function connect() {
  const claude = await waitForClaude(1500)
  if (!claude) return { mode: 'local', reason: 'standalone', isOwner: true }

  const [db, user] = await Promise.all([
    withTimeout(claude.use('db'), 10000),
    withTimeout(claude.use('user'), 10000),
  ])
  if (!db || !user) return { mode: 'local', reason: 'signed-out', isOwner: false }

  const uid = await user.id().catch(() => null)
  if (!uid) return { mode: 'local', reason: 'signed-out', isOwner: false }

  let isOwner = false
  let canWrite = null
  try { isOwner = !!(await user.isOwner()) } catch {}
  try { canWrite = await user.can('data.write') } catch {}
  if (canWrite === false) return { mode: 'local', reason: 'view-only', isOwner }

  return { mode: 'cloud', db, uid, isOwner }
}
