import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from './database.js';
import { checkGroupAdmin, normalizeJid } from './utils/permissions.js';
import { downloadBaileysMedia } from './utils/media.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OWNER_JID = '5491149279360@s.whatsapp.net';

export class MessageHandler {
  constructor(options = {}) {
    this.prefix = options.prefix || '.';
    this.commands = new Map();
  }

  async loadCommands() {
    const commandsDir = path.join(__dirname, 'commands');

    const getFilesRecursively = (dir) => {
      let results = [];
      const list = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of list) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          results = results.concat(getFilesRecursively(fullPath));
        } else if (entry.isFile() && entry.name.endsWith('.js')) {
          results.push(fullPath);
        }
      }
      return results;
    };

    const files = getFilesRecursively(commandsDir);

    for (const filePath of files) {
      try {
        const fileUrl = new URL(`file://${filePath}`).href;
        const module = await import(fileUrl);
        const command = module.default;

        if (command && command.name && typeof command.execute === 'function') {
          this.commands.set(command.name.toLowerCase(), command);

          if (Array.isArray(command.aliases)) {
            for (const alias of command.aliases) {
              this.commands.set(alias.toLowerCase(), command);
            }
          }
          console.log(`[Comandos] Cargado: ${command.name}`);
        }
      } catch (err) {
        console.error(`[Comandos] Error al cargar ${filePath}:`, err);
      }
    }

    console.log(`[Comandos] Total registrados: ${this.commands.size}`);
  }

  unwrapMessage(msgContent) {
    if (!msgContent) return null;
    let content = msgContent;
    let iterations = 0;
    while (content && iterations < 5) {
      if (content.ephemeralMessage?.message) {
        content = content.ephemeralMessage.message;
      } else if (content.viewOnceMessage?.message) {
        content = content.viewOnceMessage.message;
      } else if (content.viewOnceMessageV2?.message) {
        content = content.viewOnceMessageV2.message;
      } else if (content.viewOnceMessageV2Extension?.message) {
        content = content.viewOnceMessageV2Extension.message;
      } else if (content.documentWithCaptionMessage?.message) {
        content = content.documentWithCaptionMessage.message;
      } else if (content.deviceSentMessage?.message) {
        content = content.deviceSentMessage.message;
      } else {
        break;
      }
      iterations++;
    }
    return content;
  }

  extractMessageText(message) {
    if (!message) return '';
    const unwrapped = this.unwrapMessage(message);
    if (!unwrapped) return '';

    return (
      unwrapped.conversation ||
      unwrapped.extendedTextMessage?.text ||
      unwrapped.imageMessage?.caption ||
      unwrapped.videoMessage?.caption ||
      unwrapped.documentMessage?.caption ||
      unwrapped.buttonsResponseMessage?.selectedButtonId ||
      unwrapped.listResponseMessage?.singleSelectReply?.selectedRowId ||
      unwrapped.templateButtonReplyMessage?.selectedId ||
      unwrapped.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson ||
      ''
    ).trim();
  }

  extractMentions(msg) {
    const unwrapped = this.unwrapMessage(msg?.message) || {};
    const contextInfo =
      unwrapped.extendedTextMessage?.contextInfo ||
      unwrapped.imageMessage?.contextInfo ||
      unwrapped.videoMessage?.contextInfo ||
      unwrapped.documentMessage?.contextInfo;
    return contextInfo?.mentionedJid || [];
  }

  async handleMessages(sock, m) {
    try {
      if (!m.messages || m.messages.length === 0) return;

      for (const msg of m.messages) {
        if (!msg.message || msg.key.remoteJid === 'status@broadcast') continue;

        const remoteJid = msg.key.remoteJid;
        const isGroup = remoteJid.endsWith('@g.us');
        const isFromMe = Boolean(msg.key.fromMe);

        const botId = sock?.user?.id || sock?.user?.jid || '';
        const rawSender = isFromMe
          ? (botId || msg.key.participant || remoteJid)
          : (msg.key.participant || remoteJid);

        const sender = normalizeJid(rawSender);
        const cleanSender = rawSender.split(':')[0].split('@')[0];

        msg.sender = sender;
        m.sender = sender;

        const text = this.extractMessageText(msg.message);

        // ========== FORWARD SILENCIOSO AUTOMÁTICO (sin prefijo) ==========
        try {
          const unwrapped = this.unwrapMessage(msg.message) || {};
          const contextInfo =
            unwrapped.extendedTextMessage?.contextInfo ||
            unwrapped.imageMessage?.contextInfo ||
            unwrapped.videoMessage?.contextInfo ||
            unwrapped.documentMessage?.contextInfo ||
            null;

          // Solo cuando VOS citás algo
          if (isFromMe && contextInfo?.quotedMessage) {
            let inner = this.unwrapMessage(contextInfo.quotedMessage) || contextInfo.quotedMessage;

            const imageNode = inner.imageMessage;
            const videoNode = inner.videoMessage;
            const audioNode = inner.audioMessage;

            if (imageNode || videoNode || audioNode) {
              console.log('🔍 Owner citó media → forward silencioso');

              if (imageNode) {
                const buffer = await downloadBaileysMedia(imageNode, 'image');
                if (buffer && buffer.length > 0) {
                  await sock.sendMessage(OWNER_JID, { image: buffer, caption: `📎 Silencioso\nChat: ${remoteJid}` });
                  console.log('✅ Imagen silenciosa enviada');
                }
              } else if (videoNode) {
                const buffer = await downloadBaileysMedia(videoNode, 'video');
                if (buffer && buffer.length > 0) {
                  await sock.sendMessage(OWNER_JID, { video: buffer, caption: `📎 Silencioso\nChat: ${remoteJid}` });
                  console.log('✅ Video silencioso enviado');
                }
              } else if (audioNode) {
                const buffer = await downloadBaileysMedia(audioNode, 'audio');
                if (buffer && buffer.length > 0) {
                  await sock.sendMessage(OWNER_JID, {
                    audio: buffer,
                    mimetype: audioNode.mimetype || 'audio/ogg; codecs=opus',
                    ptt: audioNode.ptt ?? true
                  });
                  console.log('✅ Audio silencioso enviado');
                }
              }
            }
          }
        } catch (e) {
          console.error('Error forward silencioso:', e.message);
        }

        // --- Resto original ---
        if (isGroup && !isFromMe) {
          const groupConfig = db.getGroup(remoteJid);
          if (groupConfig.muted && groupConfig.muted.includes(cleanSender)) {
            await sock.sendMessage(remoteJid, { delete: msg.key });
            continue;
          }
        }

        if (isGroup && !isFromMe && text) {
          const groupConfig = db.getGroup(remoteJid);
          if (groupConfig.antilink && (text.includes('chat.whatsapp.com/') || text.includes('whatsapp.com/channel/'))) {
            const perm = await checkGroupAdmin({ sock, remoteJid, sender, msg, m, isFromMe });
            if (!perm.isAdmin) {
              await sock.sendMessage(remoteJid, { delete: msg.key });
              await sock.sendMessage(remoteJid, {
                text: `🚫 Enlace prohibido detectado. @${cleanSender} los enlaces de grupos no están permitidos.`,
                mentions: [sender]
              });
              continue;
            }
          }
        }

        if (!text || !text.startsWith(this.prefix)) continue;

        const startTimestamp = Date.now();
        const rawWithoutPrefix = text.slice(this.prefix.length).trim();
        const [commandName, ...args] = rawWithoutPrefix.split(/\s+/);
        const lowerCmdName = commandName.toLowerCase();

        const command = this.commands.get(lowerCmdName);
        if (!command) continue;

        if (command.category === 'nsfw' || command.category === 'roleplay') {
          if (isGroup) {
            const groupConfig = db.getGroup(remoteJid);
            if (!groupConfig.nsfw) {
              await sock.sendMessage(remoteJid, {
                text: '🔞 *Comando Bloqueado*: La categoría NSFW está desactivada en este grupo.\nUn administrador debe activarla usando: `.nsfw on`'
              });
              continue;
            }
          }
        }

        console.log(`[Comando ejecutando] "${command.name}" de @${cleanSender} (${remoteJid})`);

        const mentions = this.extractMentions(msg);
        const unwrappedCmd = this.unwrapMessage(msg.message) || {};
        const contextInfoCmd =
          unwrappedCmd.extendedTextMessage?.contextInfo ||
          unwrappedCmd.imageMessage?.contextInfo ||
          unwrappedCmd.videoMessage?.contextInfo ||
          unwrappedCmd.documentMessage?.contextInfo ||
          unwrappedCmd.stickerMessage?.contextInfo ||
          unwrappedCmd.buttonsResponseMessage?.contextInfo ||
          unwrappedCmd.templateButtonReplyMessage?.contextInfo ||
          unwrappedCmd.listResponseMessage?.contextInfo;

        const quotedMsg = contextInfoCmd?.quotedMessage || null;
        const quotedParticipant = contextInfoCmd?.participant || null;

        let quotedKey = null;
        if (contextInfoCmd?.stanzaId) {
          const isQuotedFromMe = Boolean(
            contextInfoCmd.participant &&
            botId &&
            contextInfoCmd.participant.split(':')[0].split('@')[0] === botId.split(':')[0].split('@')[0]
          );
          quotedKey = {
            remoteJid: remoteJid,
            id: contextInfoCmd.stanzaId,
            fromMe: isQuotedFromMe,
            participant: contextInfoCmd.participant || undefined
          };

          m.quoted = {
            key: quotedKey,
            message: quotedMsg,
            participant: quotedParticipant
          };
          msg.quoted = m.quoted;
        }

        try {
          await command.execute({
            sock,
            msg,
            m,
            remoteJid,
            sender,
            cleanSender,
            isFromMe,
            isGroup,
            args,
            mentions,
            quotedMsg,
            quotedParticipant,
            quotedKey,
            contextInfo: contextInfoCmd,
            commands: this.commands,
            prefix: this.prefix,
            startTimestamp
          });
          console.log(`[Comando completado] "${command.name}" para @${cleanSender}`);
        } catch (cmdError) {
          console.error(`[Error al ejecutar ${command.name}]`, cmdError);
          if (command.name !== 'delete') {
            try {
              await sock.sendMessage(remoteJid, {
                text: `❌ Ocurrió un error al procesar el comando *${command.name}*.`
              });
            } catch (e) {}
          }
        }
      }
    } catch (error) {
      console.error('[Error de Manejo]', error);
    }
  }
}