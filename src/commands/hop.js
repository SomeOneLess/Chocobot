export default {
  name: 'hop',
  aliases: ['helpadmin', 'adminhelp'],
  description: 'Muestra solo los comandos de administración de grupos.',
  usage: '!hop',
  category: 'admin',
  async execute({ sock, remoteJid, commands, prefix }) {
    const list = [];

    const uniqueCommands = Array.from(new Set(commands.values()));

    for (const cmd of uniqueCommands) {
      if (cmd.category === 'admin') {
        const description = cmd.description ? `: ${cmd.description}` : '';
        list.push(`• \`${prefix}${cmd.name}\`${description}`);
      }
    }

    const menu = [
      '👑 *COMANDOS DE ADMINISTRACIÓN*',
      '━━━━━━━━━━━━━━━━━━━━━━━━━',
      list.length > 0 ? list.join('\n') : 'No hay comandos de admin cargados.',
      '━━━━━━━━━━━━━━━━━━━━━━━━━',
      `ℹ️ Usa *${prefix}help <comando>* para ver el detalle de alguno.`
    ].join('\n');

    await sock.sendMessage(remoteJid, { text: menu });
  }
};