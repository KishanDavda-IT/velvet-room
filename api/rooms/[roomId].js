import { createServer } from '../../server/src/index.js';

// Vercel does not consistently route nested requests through the catch-all
// function. Keep room lookups on an explicit dynamic function because the
// invite page checks /api/rooms/:roomId before showing the join gate.
const { httpServer } = createServer();

export default httpServer;
