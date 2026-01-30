/**
 * Utility functions for UI and animations
 */

export const TOKEN_ICONS = [
  '🎩', // hat
  '🚗', // car
  '🐕', // dog
  '🔨', // iron/hammer
  '🚢', // ship
  '🧵', // thimble
];

export const TOKEN_COLORS = [
  '#4ade80', // green
  '#60a5fa', // blue
  '#f472b6', // pink
  '#fbbf24', // yellow
  '#a78bfa', // purple
  '#fb923c', // orange
];

/**
 * Get token icon and color for player
 */
export function getPlayerToken(index) {
  return {
    icon: TOKEN_ICONS[index % TOKEN_ICONS.length],
    color: TOKEN_COLORS[index % TOKEN_COLORS.length],
  };
}

const moneyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/**
 * Format money with $ sign (Intl.NumberFormat)
 */
export function formatMoney(amount) {
  return moneyFormatter.format(Number(amount));
}

/**
 * Get initials from name
 */
export function getInitials(name) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Create money particle animation
 */
export function createMoneyParticle(amount, x, y, isPositive = true) {
  const particle = document.createElement('div');
  particle.className = 'money-particle';
  particle.textContent = `${isPositive ? '+' : ''}${formatMoney(amount)}`;
  particle.style.left = `${x}px`;
  particle.style.top = `${y}px`;
  document.body.appendChild(particle);

  setTimeout(() => {
    particle.remove();
  }, 1000);
}

/**
 * Create confetti effect
 */
export function createConfetti(count = 50) {
  const container = document.getElementById('confettiContainer');
  if (!container) return;

  const colors = ['#ffd93d', '#ff8c42', '#2d8659', '#60a5fa', '#f472b6'];

  for (let i = 0; i < count; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'confetti';
    confetti.style.left = `${Math.random() * 100}%`;
    confetti.style.top = '-10px';
    confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
    confetti.style.animationDelay = `${Math.random() * 0.5}s`;
    confetti.style.animationDuration = `${2 + Math.random() * 2}s`;
    container.appendChild(confetti);

    setTimeout(() => {
      confetti.remove();
    }, 5000);
  }
}

/**
 * Shake element
 */
export function shakeElement(element) {
  if (!element) return;
  element.classList.add('shake');
  setTimeout(() => {
    element.classList.remove('shake');
  }, 500);
}

/**
 * Show loading spinner
 */
export function showLoading(show = true) {
  const spinner = document.getElementById('loadingSpinner');
  if (spinner) {
    spinner.classList.toggle('active', show);
  }
}

/**
 * Show reconnect overlay
 */
export function showReconnect(show = true) {
  const overlay = document.getElementById('reconnectOverlay');
  if (overlay) {
    overlay.classList.toggle('active', show);
  }
}

/**
 * Calculate position on circular board
 */
export function getCellPosition(index, totalCells, radius) {
  const angle = (index * 360) / totalCells - 90; // Start from top
  const rad = (angle * Math.PI) / 180;
  const x = Math.cos(rad) * radius;
  const y = Math.sin(rad) * radius;
  return { x, y, angle };
}

/**
 * Animate token movement (stretchX, offsetX, offsetY — для овальной доски и сдвига кольца)
 */
export function animateTokenMovement(tokenElement, fromIndex, toIndex, totalCells, radius, duration = 800, stretchX = 1, offsetX = 0, offsetY = 0) {
  if (!tokenElement) return;

  const steps = Math.abs(toIndex - fromIndex);
  if (steps === 0) return;

  const fromPos = getCellPosition(fromIndex, totalCells, radius);
  const toPos = getCellPosition(toIndex, totalCells, radius);

  const x = toPos.x * stretchX - offsetX;
  const y = toPos.y - offsetY;

  tokenElement.style.transition = `all ${duration}ms cubic-bezier(0.4, 0, 0.2, 1)`;
  tokenElement.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;

  // Add bounce effect at the end
  setTimeout(() => {
    tokenElement.classList.add('bounce');
    setTimeout(() => {
      tokenElement.classList.remove('bounce');
    }, 500);
  }, duration);
}

/**
 * Roll dice animation
 */
export function animateDiceRoll(diceElement, value) {
  if (!diceElement) return;
  
  diceElement.classList.add('rolling');
  diceElement.textContent = '🎲';
  
  setTimeout(() => {
    diceElement.textContent = getDiceEmoji(value);
    diceElement.classList.remove('rolling');
  }, 600);
}

/**
 * Get dice display for value (digits 1–6 for visibility)
 */
export function getDiceEmoji(value) {
  const n = Number(value);
  if (n >= 1 && n <= 6) return String(n);
  return '?';
}

/**
 * Add event to log
 */
export function addEventToLog(text, type = 'info') {
  const logContainer = document.getElementById('eventLogItems');
  if (!logContainer) return;

  const item = document.createElement('div');
  item.className = 'event-log-item';
  item.textContent = text;
  
  // Keep only last 10 events
  const items = logContainer.children;
  if (items.length >= 10) {
    items[0].remove();
  }
  
  logContainer.appendChild(item);
  
  // Auto-scroll to bottom
  setTimeout(() => {
    item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, 100);
}

/**
 * Show modal
 */
export function showModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('active');
  }
}

/**
 * Hide modal
 */
export function hideModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('active');
  }
}

/**
 * Show toast notification
 * @param {string} message - Text to show
 * @param {'info'|'success'|'warning'|'error'} type - Toast type
 * @param {number} duration - Ms before auto-remove (0 = no auto-remove)
 */
export function showToast(message, type = 'info', duration = 4000) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.setAttribute('role', 'alert');
  toast.textContent = message;
  container.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add('toast-visible');
  });

  if (duration > 0) {
    const t = setTimeout(() => {
      toast.classList.remove('toast-visible');
      setTimeout(() => toast.remove(), 300);
    }, duration);
    toast.dataset.timeoutId = t;
  }
}

/**
 * Close modal on overlay click
 */
export function setupModalClose(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      hideModal(modalId);
    }
  });

  const closeBtn = modal.querySelector(`#${modalId}Close`);
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      hideModal(modalId);
    });
  }
}
