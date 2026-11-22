/**
 * Gestor de Buscaminas Compartido 1v1 (7x7, 8 minas)
 * Reglas:
 * - Tablero compartido: el que explota pierde y el rival cobra el pozo.
 * - Comandos de jugada sugeridos:
 *   - Romper: "c4"
 *   - Poner/quitar bandera: "b c4" o "bandera c4"
 */

const ROWS = 7;
const COLS = 7;
const MINES_COUNT = 8;
const ROW_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
const COL_EMOJIS = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣'];
const NUM_EMOJIS = ['0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣'];

export class SharedMinesManager {
  constructor() {
    this.games = new Map(); // chatId -> game object
  }

  getGame(chatId) {
    return this.games.get(chatId);
  }

  hasActiveGame(chatId) {
    return this.games.has(chatId);
  }

  /**
   * Crea una partida compartida 1v1.
   * Las minas se generan en el primer clic seguro para que nadie pierda en el turno 1.
   */
  createGame(chatId, challengerId, opponentId, betAmount) {
    const game = {
      rows: ROWS,
      cols: COLS,
      minesCount: MINES_COUNT,
      betAmount,
      pot: betAmount * 2,
      player1: challengerId,
      player2: opponentId,
      turn: challengerId,
      minesGenerated: false,
      mines: new Set(),      // "r,c"
      revealed: new Set(),   // "r,c"
      flags: new Set(),      // "r,c"
      explodedAt: null,    // "r,c" si alguien detonó
      winner: null,
      loser: null,
      startedAt: Date.now()
    };

    this.games.set(chatId, game);
    return game;
  }

  endGame(chatId) {
    this.games.delete(chatId);
  }

  key(r, c) {
    return `${r},${c}`;
  }

  inBounds(r, c) {
    return r >= 0 && r < ROWS && c >= 0 && c < COLS;
  }

  getNeighbors(r, c) {
    const list = [];
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = r + dr;
        const nc = c + dc;
        if (this.inBounds(nr, nc)) list.push([nr, nc]);
      }
    }
    return list;
  }

  /**
   * Genera las minas evitando la primera casilla elegida y sus adyacentes.
   */
  generateMines(safeR, safeC) {
    const forbidden = new Set([this.key(safeR, safeC)]);
    for (const [nr, nc] of this.getNeighbors(safeR, safeC)) {
      forbidden.add(this.key(nr, nc));
    }

    const candidates = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const k = this.key(r, c);
        if (!forbidden.has(k)) candidates.push(k);
      }
    }

    // Fisher-Yates shuffle
    for (let i = candidates.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
    }

    const mines = new Set(candidates.slice(0, Math.min(MINES_COUNT, candidates.length)));
    return mines;
  }

  countAdjacentMines(game, r, c) {
    let count = 0;
    for (const [nr, nc] of this.getNeighbors(r, c)) {
      if (game.mines.has(this.key(nr, nc))) count++;
    }
    return count;
  }

  /**
   * Expande automáticamente casillas vacías (0 minas alrededor).
   */
  revealFlood(game, startR, startC) {
    const queue = [[startR, startC]];
    const visited = new Set();

    while (queue.length > 0) {
      const [r, c] = queue.shift();
      const k = this.key(r, c);
      if (visited.has(k)) continue;
      visited.add(k);

      if (game.flags.has(k)) game.flags.delete(k);
      game.revealed.add(k);

      if (this.countAdjacentMines(game, r, c) === 0) {
        for (const [nr, nc] of this.getNeighbors(r, c)) {
          const nk = this.key(nr, nc);
          if (!game.revealed.has(nk) && !game.mines.has(nk)) {
            queue.push([nr, nc]);
          }
        }
      }
    }
  }

  /**
   * Acepta entradas como:
   * - "c4" -> { action: 'reveal', r: 2, c: 3 }
   * - "b c4" o "bandera c4" -> { action: 'flag', r: 1, c: 2 }
   */
  parseInput(raw) {
    if (!raw) return null;
    const text = String(raw).trim().toLowerCase().replace(/\s+/g, ' ');

    let action = 'reveal';
    let coordPart = text;

    if (text.startsWith('bandera ') || text.startsWith('flag ') || text.startsWith('b ')) {
      action = 'flag';
      coordPart = text.replace(/^(bandera|flag|b)\s+/, '').trim();
    }

    const match = coordPart.match(/^([a-g])\s*([1-7])$/);
    if (!match) return null;

    const r = ROW_LABELS.indexOf(match[1].toUpperCase());
    const c = parseInt(match[2], 10) - 1;
    if (!this.inBounds(r, c)) return null;

    return { action, r, c };
  }

  /**
   * Verifica si todas las casillas NO-mina fueron reveladas.
   * Si pasa, gana quien hizo el último movimiento seguro.
   */
  checkAllSafeRevealed(game) {
    const totalCells = ROWS * COLS;
    return game.revealed.size === totalCells - game.mines.size;
  }

  renderBoard(game, showAllMines = false) {
    const lines = [`   ${COL_EMOJIS.join('')}`];

    for (let r = 0; r < ROWS; r++) {
      let rowStr = `${ROW_LABELS[r]} `;
      for (let c = 0; c < COLS; c++) {
        const k = this.key(r, c);

        if (game.explodedAt === k) {
          rowStr += '💥';
        } else if (showAllMines && game.mines.has(k)) {
          rowStr += '💣';
        } else if (game.revealed.has(k)) {
          const adj = this.countAdjacentMines(game, r, c);
          rowStr += adj === 0 ? '⬜' : NUM_EMOJIS[adj];
        } else if (game.flags.has(k)) {
          rowStr += '🚩';
        } else {
          rowStr += '🟩';
        }
      }
      lines.push(rowStr);
    }

    const remainingFlags = Math.max(0, game.minesCount - game.flags.size);
    lines.push(`💣 Minas: ${game.minesCount} | 🚩 Banderas: ${game.flags.size} (restan ~${remainingFlags})`);
    return lines.join('\n');
  }

  makeMove(chatId, playerId, inputStr) {
    const game = this.getGame(chatId);
    if (!game) {
      return { error: 'No hay ninguna partida de buscaminas activa en este chat.' };
    }

    if (game.turn !== playerId) {
      return { error: '⏳ No es tu turno.' };
    }

    const parsed = this.parseInput(inputStr);
    if (!parsed) {
      return {
        error: '⚠️ Coordenada inválida. Usá *A1–G7* para romper (ej: `c4`) o *b A1–G7* para bandera (ej: `b c4`).'
      };
    }

    const { action, r, c } = parsed;
    const k = this.key(r, c);
    const nextPlayer = playerId === game.player1 ? game.player2 : game.player1;

    // Acción de bandera: no gasta turno y no revela
    if (action === 'flag') {
      if (game.revealed.has(k)) {
        return { error: '⚠️ Esa casilla ya está descubierta.' };
      }

      if (game.flags.has(k)) {
        game.flags.delete(k);
      } else {
        if (game.flags.size >= game.minesCount) {
          return { error: `⚠️ Ya pusiste las ${game.minesCount} banderas disponibles. Quitá alguna primero.` };
        }
        game.flags.add(k);
      }

      return {
        success: true,
        flagToggled: true,
        nextTurn: game.turn, // mantiene turno al marcar/desmarcar bandera
        boardStr: this.renderBoard(game, false)
      };
    }

    // Acción de romper casilla
    if (game.revealed.has(k)) {
      return { error: '⚠️ Esa casilla ya está abierta. Elegí otra.' };
    }

    if (game.flags.has(k)) {
      return { error: '🚩 Tiene bandera. Sacala con `b ' + ROW_LABELS[r].toLowerCase() + (c + 1) + '` antes de romper.' };
    }

    if (!game.minesGenerated) {
      game.mines = this.generateMines(r, c);
      game.minesGenerated = true;
    }

    // ¡Explotó! Pierde el que rompió, gana el rival
    if (game.mines.has(k)) {
      game.explodedAt = k;
      game.loser = playerId;
      game.winner = nextPlayer;
      this.endGame(chatId);

      return {
        success: true,
        exploded: true,
        loser: playerId,
        winner: nextPlayer,
        pot: game.pot,
        boardStr: this.renderBoard(game, true)
      };
    }

    this.revealFlood(game, r, c);

    // Si se limpiaron todas las casillas seguras sin detonar
    if (this.checkAllSafeRevealed(game)) {
      game.winner = playerId;
      game.loser = nextPlayer;
      this.endGame(chatId);

      return {
        success: true,
        clearedAll: true,
        winner: playerId,
        loser: nextPlayer,
        pot: game.pot,
        boardStr: this.renderBoard(game, true)
      };
    }

    game.turn = nextPlayer;
    return {
      success: true,
      nextTurn: game.turn,
      boardStr: this.renderBoard(game, false)
    };
  }
}

export const sharedMinesManager = new SharedMinesManager();