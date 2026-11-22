import { createRoleplayCommand } from '../../utils/roleplayFactory.js';

export default createRoleplayCommand({
  name: 'cachetear',
  aliases: ['abofetear', 'bofetada', 'sopapear'],
  actionKey: 'cachetear',
  description: 'Le da una bofetada al usuario mencionado.',
  actionText: 'le ha propinado una bofetada',
  emoji: '👋',
  isNsfw: false
});
