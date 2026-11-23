import makeWASocket, {
  useMultiFileAuthState,
  downloadMediaMessage,
  DisconnectReason,
} from '@whiskeysockets/baileys';
import OpenAI, { toFile } from 'openai';
import pino from 'pino';
import qrcode from 'qrcode-terminal';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function transcribirBuffer(audioBuffer, mimetype = 'audio/ogg') {
  const extension = mimetype.includes('mp4')
    ? 'm4a'
    : mimetype.includes('mpeg')
      ? 'mp3'
      : 'ogg';

  const file = await toFile(audioBuffer, `audio.${extension}`, {
    type: mimetype,
  });

  const transcripcion = await openai.audio.transcriptions.create({
    file,
    model: 'gpt-4o-mini-transcribe', // o 'whisper-1'
    language: 'es', // opcional: quítalo si necesitas autodetección de idioma
  });

  return transcripcion.text;
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
      const reconectar = statusCode !== DisconnectReason.loggedOut;
      if (reconectar) {
        iniciarBot();
      }
    } else if (connection === 'open') {
      console.log('Bot conectado a WhatsApp.');
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

        const texto = await transcribirBuffer(buffer, audioMsg.mimetype);

        await sock.sendMessage(
          chatId,
          { text: texto || 'No se detectó voz en el audio.' },
          { quoted: msg }
        );
      } catch (error) {
        console.error('Error al transcribir audio:', error);
        await sock.sendMessage(
          chatId,
          { text: 'No pude transcribir el audio en este momento.' },
          { quoted: msg }
        );
      }
    }
  });
}

iniciarBot();
