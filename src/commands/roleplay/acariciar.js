import { createRoleplayCommand } from '../../utils/roleplayFactory.js';

export default createRoleplayCommand({
  name: 'acariciar',
  aliases: ['acariciar', 'palmaditas'],
  actionKey: 'acariciar',
  description: 'Acaricia suavemente la cabeza del usuario mencionado.',
  actionText: 'ha acariciado con ternura a',
  emoji: '💆‍♂️',
  isNsfw: false
});
