export default {
  name: 'hnsfw',
  aliases: ['helpnsfw', 'nsfwhelp'],
  description: 'Muestra solo los comandos de contenido NSFW +18.',
  usage: '!hnsfw',
  category: 'nsfw',
  async execute({ sock, remoteJid, commands, prefix }) {
    const list = [];
    const nsfwCategories = ['nsfw', 'roleplay', 'interaction'];

    const uniqueCommands = Array.from(new Set(commands.values()));

    for (const cmd of uniqueCommands) {
      if (nsfwCategories.includes(cmd.category)) {
        const description = cmd.description ? `: ${cmd.description}` : '';
        list.push(`• \`${prefix}${cmd.name}\`${description}`);
      }
    }

    const menu = [
      '🔞 *COMANDOS NSFW +18*',
      '━━━━━━━━━━━━━━━━━━━━━━━━━',
      list.length > 0 ? list.join('\n') : 'No hay comandos NSFW cargados.',
      '━━━━━━━━━━━━━━━━━━━━━━━━━',
      `ℹ️ Usa *${prefix}help <comando>* para ver el detalle de alguno.`
    ].join('\n');

    await sock.sendMessage(remoteJid, { text: menu });
  }
};
