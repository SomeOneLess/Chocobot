import makeWASocket, {
  useMultiFileAuthState,
  downloadMediaMessage,
  DisconnectReason,
} from '@whiskeysockets/baileys';
import { WhisperSTT } from '@micdrop/whisper';
import pino from 'pino';
import qrcode from 'qrcode-terminal';
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

// 'tiny', 'base' o 'small' son más livianos en CPU/RAM que modelos grandes.
// Si especificas 'language: "es"', evitas detección automática en cada audio.
const stt = new WhisperSTT({
  model: 'base',
  language: 'es',
});

let sttListo = false;

function convertirAWav16k(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    const ff = spawn('ffmpeg', [
      '-y',
      '-i',
      inputPath,
      '-ac',
      '1',
      '-ar',
      '16000',
      '-c:a',
      'pcm_s16le',
      outputPath,
    ]);

    ff.on('error', reject);
    ff.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg terminó con código ${code}`));
    });
  });
}

async function transcribirBufferLocal(audioBuffer, mimetype = 'audio/ogg') {
  if (!sttListo) {
    await stt.init();
    sttListo = true;
  }

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'wa-stt-'));
  const ext = mimetype.includes('mp4')
    ? 'm4a'
    : mimetype.includes('mpeg')
      ? 'mp3'
      : 'ogg';
  const rawPath = path.join(tmpDir, `input.${ext}`);
  const wavPath = path.join(tmpDir, 'audio.wav');

  try {
    await fs.writeFile(rawPath, audioBuffer);
    await convertirAWav16k(rawPath, wavPath);

    const texto = await new Promise((resolve, reject) => {
      let resultado = '';
      const onTranscript = (txt) => {
        resultado += txt;
      };
      const onError = (err) => {
        cleanup();
        reject(err);
      };
      const onEnd = () => {
        cleanup();
        resolve(resultado.trim());
      };
      const cleanup = () => {
        stt.off('Transcript', onTranscript);
        stt.off('Error', onError);
        stt.off('End', onEnd);
      };

      stt.on('Transcript', onTranscript);
      stt.on('Error', onError);
      stt.on('End', onEnd);

      stt.transcribe(wavPath);
    });

    return texto;
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
}

async function iniciarBot() {
  const { state, saveCreds } = await useMultiFileAuthState('./auth_info');
  const logger = pino({ level: 'silent' });

  const sock = makeWASocket({
    auth: state,
    logger,
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', ({ connection, lastDisconnect, qr }) => {
    if (qr) {
      qrcode.generate(qr, { small: true });
    }

    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      if (statusCode !== DisconnectReason.loggedOut) {
        iniciarBot();
      }
    } else if (connection === 'open') {
      console.log('Bot conectado a WhatsApp (modo transcripción local).');
    }
  });

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;

    for (const msg of messages) {
      if (!msg.message || msg.key.fromMe) continue;

      const audioMsg = msg.message.audioMessage;
      if (!audioMsg) continue;

      const chatId = msg.key.remoteJid;

      try {
        await sock.sendPresenceUpdate('composing', chatId);

        const buffer = await downloadMediaMessage(
          msg,
          'buffer',
          {},
          {
            logger,
            reuploadRequest: sock.updateMediaMessage,
          }
        );

        const texto = await transcribirBufferLocal(buffer, audioMsg.mimetype);

        await sock.sendMessage(
          chatId,
          { text: texto || 'No se detectó voz en el audio.' },
          { quoted: msg }
        );
      } catch (error) {
        console.error('Error al transcribir audio:', error);
        await sock.sendMessage(
          chatId,
          { text: 'No pude transcribir el audio en local.' },
          { quoted: msg }
        );
      }
    }
  });
}

iniciarBot();
