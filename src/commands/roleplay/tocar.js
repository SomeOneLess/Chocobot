import { createRoleplayCommand } from '../../utils/roleplayFactory.js';

export default createRoleplayCommand({
  name: 'tocar',
  aliases: ['manosear', 'tocar'],
  actionKey: 'tocar',
  description: 'Toca o manosea a un miembro.',
  actionText: 'ha tocado y acariciado con audacia',
  emoji: '✋'
});
