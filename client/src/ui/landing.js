import { createRoom } from '../api.js';
import { parseRoomInput } from '../router.js';
import { showToast } from './toast.js';

export function getSavedOrDefaultName() {
  try {
    const saved = localStorage.getItem('velvet:name');
    if (saved && saved.trim()) {
      return saved.trim().slice(0, 20);
    }
  } catch {
    // Ignore storage errors
  }
  const randomDigits = Math.floor(100 + Math.random() * 900);
  return `Guest-${randomDigits}`;
}

export function renderLanding({ container, onEnterRoomAsHost, onNavigateToRoom }) {
  const overlay = document.createElement('div');
  overlay.className = 'screen-overlay';

  const defaultName = getSavedOrDefaultName();

  overlay.innerHTML = `
    <div class="landing-container">
      <div class="landing-glow"></div>
      <div class="landing-kicker"><span></span> PRIVATE SCREENING CLUB <span></span></div>
      <h1 class="landing-title">Velvet <em>Room</em></h1>
      <p class="landing-subtitle">A private cinema for the people you want beside you. Share a room, settle in, and press play together.</p>

      <div class="landing-cards">
        <div class="glass landing-card">
          <div class="landing-card-icon" aria-hidden="true">✦</div>
          <div class="landing-card-label">Host a screening</div>
          <p class="landing-card-copy">Your room, your programme, your front row.</p>
          <input
            type="text"
            class="text-input"
            id="landing-name-input"
            placeholder="Your name"
            maxlength="20"
             autocomplete="off"
          />
          <button type="button" class="btn-gold" id="landing-create-btn">Create a room</button>
          <div class="inline-error" id="landing-create-error" aria-live="polite"></div>
        </div>

        <div class="glass landing-card">
          <div class="landing-card-icon landing-card-icon-muted" aria-hidden="true">↗</div>
          <div class="landing-card-label">Have an invite?</div>
          <p class="landing-card-copy">Enter a room code or paste the link from your host.</p>
          <input
            type="text"
            class="text-input"
            id="landing-join-input"
            placeholder="Paste a room link or code"
            autocomplete="off"
          />
          <button type="button" class="btn-ghost" id="landing-join-btn">Join</button>
          <div class="inline-error" id="landing-join-error" aria-live="polite"></div>
        </div>
      </div>

      <footer class="landing-footer"><span>●</span> Up to 8 guests <i></i> Nothing is recorded <i></i> Best with headphones</footer>
    </div>
  `;

  container.appendChild(overlay);

  const nameInput = overlay.querySelector('#landing-name-input');
  const createBtn = overlay.querySelector('#landing-create-btn');
  const createError = overlay.querySelector('#landing-create-error');

  const joinInput = overlay.querySelector('#landing-join-input');
  const joinBtn = overlay.querySelector('#landing-join-btn');
  const joinError = overlay.querySelector('#landing-join-error');

  nameInput.value = defaultName;

  async function handleCreate() {
    createError.textContent = '';
    const name = nameInput.value.trim();
    if (!name) {
      createError.textContent = 'Please enter a name.';
      nameInput.focus();
      return;
    }

    createBtn.disabled = true;
    try {
      const { roomId, hostKey } = await createRoom();
      try {
        localStorage.setItem(`velvet:hostKey:${roomId}`, hostKey);
        localStorage.setItem('velvet:name', name);
      } catch {
        // Ignore storage errors
      }
      window.history.pushState({}, '', `/r/${roomId}`);
      onEnterRoomAsHost({ roomId, name, hostKey });
    } catch (err) {
      createBtn.disabled = false;
      const msg = err?.message || 'Could not create room.';
      createError.textContent = msg;
      showToast(msg);
    }
  }

  function handleJoin() {
    joinError.textContent = '';
    const roomId = parseRoomInput(joinInput.value);
    if (!roomId) {
      joinError.textContent = "That doesn't look like a room link.";
      joinInput.focus();
      return;
    }

    const name = nameInput.value.trim();
    if (name) {
      try {
        localStorage.setItem('velvet:name', name);
      } catch {
        // Ignore
      }
    }

    onNavigateToRoom(roomId);
  }

  createBtn.addEventListener('click', handleCreate);
  nameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCreate();
    }
  });

  joinBtn.addEventListener('click', handleJoin);
  joinInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleJoin();
    }
  });

  return {
    destroy() {
      overlay.remove();
    },
  };
}
