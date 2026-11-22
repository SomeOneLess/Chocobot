import { spawn } from 'child_process';
import * as googleTTS from 'google-tts-api';

function mp3ToOggOpus(mp3Buffer) {
  return new Promise((resolve, reject) => {
    const ff = spawn('ffmpeg', [
      '-loglevel', 'error',
      '-i', 'pipe:0',
      '-c:a', 'libopus',
      '-b:a', '32k',
      '-vbr', 'on',
      '-f', 'ogg',
      'pipe:1'
    ]);

    const chunks = [];
    const errChunks = [];

    ff.stdout.on('data', (d) => chunks.push(d));
    ff.stderr.on('data', (d) => errChunks.push(d));
    ff.on('error', reject);
    ff.on('close', (code) => {
      if (code === 0) {
        resolve(Buffer.concat(chunks));
      } else {
        reject(new Error(Buffer.concat(errChunks).toString() || `ffmpeg exited ${code}`));
      }
    });

    ff.stdin.write(mp3Buffer);
    ff.stdin.end();
  });
}

export default {
  name: 'voz',
  aliases: ['tts', 'decir'],
  description: 'Convierte un texto en un mensaje de voz.',
  usage: '.voz <texto> (o respondiendo a un mensaje)',
  category: 'media',
  async execute({ sock, remoteJid, msg, args, prefix }) {
    const quotedText =
      msg?.message?.extendedTextMessage?.contextInfo?.quotedMessage?.conversation ||
      msg?.message?.extendedTextMessage?.contextInfo?.quotedMessage?.extendedTextMessage?.text ||
      '';

    const text = args.length > 0 ? args.join(' ').trim() : quotedText.trim();

    if (!text) {
      await sock.sendMessage(remoteJid, {
        text: `❌ Escribí un texto o respondé a uno. Ejemplo: *${prefix}voz hola mundo*`
      });
      return;
    }

    try {
      const chunks =
        text.match(/.{1,200}(\s|$)/g)?.map((s) => s.trim()).filter(Boolean) || [text];

      for (const chunk of chunks) {
        const base64Audio = await googleTTS.getAudioBase64(chunk, {
          lang: 'es',
          slow: false,
          host: 'https://translate.google.com',
          timeout: 10000
        });

        const mp3Buffer = Buffer.from(base64Audio, 'base64');
        const oggBuffer = await mp3ToOggOpus(mp3Buffer);

        await sock.sendMessage(
          remoteJid,
          {
            audio: oggBuffer,
            mimetype: 'audio/ogg; codecs=opus',
            ptt: true
          },
          { quoted: msg }
        );
      }
    } catch (err) {
      await sock.sendMessage(
        remoteJid,
        {
          text: `❌ No se pudo generar/convertir el audio: ${err?.message || 'error desconocido'}`
        },
        { quoted: msg }
      );
    }
  }
};
