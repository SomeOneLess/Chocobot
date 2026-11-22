import { createRoleplayCommand } from '../../utils/roleplayFactory.js';

export default createRoleplayCommand({
  name: 'azotar',
  aliases: ['azotar', 'castigar'],
  actionKey: 'azotar',
  description: 'Aplica un castigo o azote a un miembro.',
  actionText: 'ha castigado con un azote',
  emoji: '💥'
});
