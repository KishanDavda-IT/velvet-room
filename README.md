# Velvet Room

Velvet Room is a browser-based 3D cinema where friends can meet in a shared room, chat, and watch together. Create a room, share its invite link, and play a public-domain film, a local video, or a screen share on the cinema screen.

**Live demo:** [velvet-room312.vercel.app](https://velvet-room312.vercel.app)

## Features

- Multiplayer 3D cinema with up to eight people per room
- Move around with a third-person avatar, or switch to first-person view
- Invite friends with a shareable room link
- In-room text chat and emoji reactions
- Host screen sharing with audio, or play a local video file
- Browse and play public-domain films from the Internet Archive
- Room lighting, fullscreen viewing, UI hide/show, drinks, and a seated companion

## Tech stack

- **Client:** JavaScript, Three.js, Vite, and Socket.IO
- **Server:** Node.js, Express, and Socket.IO
- **Media:** WebRTC for host-to-viewer screen and video streaming
- **Room storage:** in-memory for local development; Redis for shared storage and Socket.IO broadcasting on Vercel
- **Movie catalog:** Internet Archive public-domain film metadata and MP4 streams

## Run locally

### Requirements

- Node.js 20 or later
- npm

### Start the app

```bash
git clone https://github.com/KishanDavda-IT/velvet-room.git
cd velvet-room
npm install
cp .env.example .env
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). The Vite client runs on port 5173 and the development server runs on port 3001.

The local server uses in-memory room storage when `REDIS_URL` is unset. Rooms are temporary and will be lost when the server restarts. You can edit `.env` to change local settings; see [`.env.example`](.env.example) for the available options.

## Playing together

1. Open the app and create a room.
2. Use **Invite** to copy the room link and send it to friends.
3. Move with **WASD** or the arrow keys. Drag to look around.
4. The host can start a screen share, choose a local video, or open the built-in movie library.

When sharing a browser tab with a movie, enable the browser's **Share tab audio** option so guests can hear it. Screen sharing is peer-to-peer WebRTC; network restrictions may require a TURN relay.

### Keyboard controls

| Key | Action |
| --- | --- |
| WASD / Arrow keys | Move |
| Drag | Look around |
| V | Toggle first-person view |
| H | Hide or show the interface |
| F | Toggle fullscreen |
| M | Mute or unmute |
| Enter | Open chat |
| 1–6 | Send an emoji reaction |
| Escape | Close chat or show the interface |

## Deploy to Vercel

See [`VERCEL.md`](VERCEL.md) for the deployment walkthrough. In short:

1. Import the repository into Vercel with the repository root as the project root.
2. Add an Upstash Redis database and configure `REDIS_URL` with its **TLS Redis connection URL** (`rediss://...`). The REST URL and token do not provide the Redis Pub/Sub connection used by Socket.IO.
3. For screen sharing on restrictive networks, configure Cloudflare TURN credentials as server-side environment variables.
4. Deploy the project.

Do not commit real credentials or secrets. Keep TURN secrets and Redis URLs in your local `.env` or your hosting provider's environment-variable settings.

## Contributing

Bug reports and pull requests are welcome. For a useful bug report, include the steps to reproduce the issue, your browser, and any relevant error message. Please avoid including private room links, credentials, or other secrets.

## License

This repository does not currently include a `LICENSE` file. It is publicly visible, but a license has not been specified for reuse or redistribution. Add a license file to make the project's reuse terms clear.
