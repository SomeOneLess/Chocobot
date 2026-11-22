import { createRoleplayCommand } from '../../utils/roleplayFactory.js';

export default createRoleplayCommand({
  name: 'besar',
  aliases: ['besar', 'beso'],
  actionKey: 'besar',
  description: 'Le da un tierno beso al usuario mencionado.',
  actionText: 'le ha dado un tierno beso',
  emoji: '💋',
  isNsfw: false
});
