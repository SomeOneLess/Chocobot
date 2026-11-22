export default {
  name: 'id',
  aliases: ['chatid', 'jid'],
  description: 'Muestra el ID del chat actual y del usuario.',
  usage: '!id',
  category: 'general',
  async execute({ sock, remoteJid, sender, msg }) {
    const text = [
      '🆔 *IDs del chat*',
      '━━━━━━━━━━━━━━━━━━━━',
      `📌 *Chat ID:*\n\`\`\`${remoteJid}\`\`\``,
      `👤 *Tu ID:*\n\`\`\`${sender}\`\`\``,
      '━━━━━━━━━━━━━━━━━━━━',
      '_Copiá el ID que necesites._'
    ].join('\n');

    await sock.sendMessage(remoteJid, { text }, { quoted: msg });
  }
};