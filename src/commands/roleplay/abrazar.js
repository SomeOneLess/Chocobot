import { createRoleplayCommand } from '../../utils/roleplayFactory.js';

export default createRoleplayCommand({
  name: 'abrazar',
  aliases: ['abrazar', 'abrazo'],
  actionKey: 'abrazar',
  description: 'Le da un cálido y cariñoso abrazo al usuario mencionado.',
  actionText: 'le ha dado un cálido abrazo',
  emoji: '🫂',
  isNsfw: false
});
