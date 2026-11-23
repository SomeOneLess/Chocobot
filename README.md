# 🍫 Chocobot

Bot de WhatsApp modular y ligero construido sobre **Node.js** utilizando [`@whiskeysockets/baileys`](https://github.com/WhiskeySockets/Baileys).

Fork directo de [`KyotoBot`](https://github.com/kyr3-fxp/KyotoBot), modificado para usar directamente sobre linux.

---

## 🚀 Características

- ⚡ **Sin Navegadores Pesados**: Conexión nativa por WebSocket multi-dispositivo (consume menos de 60 MB de RAM).
- 🔄 **Reconexión Automática**: Manejo inteligente de desconexiones temporales y caídas de red.
- 📱 **QR en Terminal**: Muestra el código QR directamente en PowerShell o CMD usando `qrcode-terminal`.
- 🧩 **Arquitectura Modular**: Más de 45 comandos organizados en subcarpetas temáticas (`economy`, `media`, `admin`, `nsfw`, `roleplay`).
- 💾 **Base de Datos Persistente**: Sistema de almacenamiento en JSON (`data/users.json` y `data/groups.json`) con guardado atómico.
- 🛡️ **Protección de Grupos**: Antilink, bienvenida automática a nuevos miembros, sistema de 3 advertencias (*warn*) y silenciamiento (*mute*).
- 🔞 **Protección NSFW**: Comandos para adultos y rol interactivo bloqueados por defecto hasta que un admin use `!nsfw on`.

---

## 📋 Requisitos Previos

- [Node.js](https://nodejs.org/) v18 o superior (probado en Node.js 24).
- Un teléfono con WhatsApp activo.

---

## 📦 Instalación

1. Abre una terminal en la carpeta del proyecto y ejecuta:
   ```bash
   npm install
   sudo apt update && sudo apt install -y ffmpeg
   npm install google-tts-api
   ```

---

## 🏃 Modo de Uso

### Iniciar el bot:
```bash
node index.js
```

### Vincular WhatsApp:
1. Al ejecutar por primera vez, verás un código QR en la consola.
2. Abre WhatsApp en tu celular: **Ajustes / Menú > Dispositivos vinculados > Vincular un dispositivo**.
3. Escanea el código QR y tu bot quedará listo. Las credenciales se guardan en `auth_info/`.

---

## (DESACTUALIZADO) 📜 Lista Completa de Comandos (Prefijo `.`)

### 🎮 Entretenimiento e Interacción (Juegos y Economía)
| Comando | Alias | Descripción |
| :--- | :--- | :--- |
| `.work` | `.trabajar`, `.chambear` | Trabaja para ganar monedas del bot y subir de nivel (cooldown 15 min). |
| `.bal` | `.cartera`, `.saldo` | Muestra tu saldo en mano, banco, nivel y experiencia. |
| `.rob @usuario` | `.robar` | Intenta robar una parte del saldo de otro usuario (45% éxito / multa). |
| `.pay @usuario <monto>` | `.pagar` | Transfiere monedas de tu cartera a otro miembro. |
| `.top` | `.lb`, `.ricos` | Tabla de clasificación de los usuarios más ricos del grupo. |
| `.slot <monto>` | `.tragamonedas` | Tragamonedas clásico animado con multiplicadores x2, x5 y x10. |
| `.roulette <color> <monto>` | `.ruleta` | Ruleta de casino (rojo/negro pagan x2, verde x14). |
| `.ppt <opción> [monto]` | `.rps` | Piedra, papel o tijera contra el bot (con apuesta opcional). |
| `.ttt @usuario` | `.gato` | Partida interactiva de Tres en Raya con tablero (1️⃣-9️⃣). Usa `.ttt <1-9>`. |
| `.connect4 @usuario` | `.c4` | Desafío interactivo de Conecta 4 (🔴🟡). Usa `.connect4 <1-7>`. |

---

### 🛠️ Utilidades y Herramientas Multimedia
| Comando | Alias | Descripción |
| :--- | :--- | :--- |
| `.s` | `.sticker` | Convierte una imagen, GIF o video corto en un sticker de WhatsApp. |
| `.toimg` | `.toimage` | Convierte un sticker estático de vuelta a formato de imagen PNG. |
| `.tovideo` | `.tomp4` | Convierte un sticker animado en un video MP4 reproducible. |
| `.getpp [@usuario]` | `.perfil`, `.pfp` | Obtiene la foto de perfil en alta resolución del usuario citado, mencionado o propio. |
| `.undel` | `.undelete`, `.recuperar` | Muestra un mensaje eliminado (citándolo o el último borrado) con mención al autor. |
| `.r` | `.vv`, `.viewonce` | Revela y reenvía fotos, videos o audios de "Ver una sola vez" al citarlos. |
| `.status` | `.estado` | Descarga y reenvía el contenido de un estado/historia citado (texto o multimedia). |
| `.playaudio <canción>` | `.playmp3`, `.ytaudio` | Busca una canción y envía su carátula y descripción corta, seguida del audio MP3. |
| `.play <nombre/link>` | `.musica` | Busca una canción en YouTube y muestra su información y opciones de audio. |
| `.video <nombre/link>` | `.ytvideo` | Busca un video en YouTube y genera ficha y descarga en alta resolución. |
| `.ytmp3 <link>` | `.ytmp4` | Genera enlaces de descarga directa para audio o video de YouTube. |
| `.tiktok <link>` | `.tt` | Descarga videos de TikTok sin marca de agua en resolución completa. |
| `.ig <link>` | `.instagram` | Descarga publicaciones o Reels públicos de Instagram. |
| `.ia <pregunta>` | `.gpt` | Consulta directa al modelo de inteligencia artificial (Pollinations AI). |
| `.imagine <prompt>` | `.dall-e` | Genera imágenes artísticas y realistas a partir de descripciones de texto. |
| `.pnt <descripción>` | — | Busca en Pinterest (`PINTEREST_ACCESS_TOKEN`), luego en otras fuentes; si no hay resultados, intenta generarla con IA. |
| `.shazam` | `.song` | Identifica canciones respondiendo a notas de voz, audios o videos. |
| `.rembg` | `.quitarfondo` | Remueve automáticamente el fondo de una imagen y genera un sticker transparente. |

---

### 👑 Comandos de Administración del Grupo
*(Requieren que el usuario y el bot sean administradores)*
| Comando | Alias | Descripción |
| :--- | :--- | :--- |
| `.kick @usuario` | `.ban` | Expulsa a un usuario del grupo. |
| `.add <número>` | `.agregar` | Agrega un miembro al grupo mediante su número internacional. |
| `.promote @usuario` | `.promover` | Otorga permisos de administrador a un miembro. |
| `.demote @usuario` | `.degradar` | Revoca los permisos de administrador a un miembro. |
| `.grupo <cerrar\|abrir>` | `.group` | `cerrar`: solo admins pueden escribir. `abrir`: todos pueden escribir. |
| `.link` | `.enlace` | Muestra el enlace de invitación del grupo. |
| `.revoke` | `.restablecer` | Restablece el enlace de invitación invalidando el anterior. |
| `.tagall [mensaje]` | `.todos` | Mención visible e invocación a todos los integrantes del grupo. |
| `.hidetag <mensaje>` | `.notificar` | Notifica a todos los integrantes sin mostrar las menciones en el texto. |
| `.spam <1-50> <mensaje>` | `.repetirhidetag` | Repite un hidetag el número indicado de veces sin pausa entre mensajes. |
| `.warn @usuario` | `.advertir` | Aplica una advertencia (al acumular 3 advertencias el bot lo expulsa). |
| `.unwarn @usuario` | `.quitaraviso` | Remueve una advertencia registrada. |
| `.mute @usuario` | `.unmute` | Silencia a un miembro (sus mensajes en el grupo son eliminados por el bot). |
| `.antilink <on\|off>` | `.antienlace` | Elimina mensajes con enlaces de grupos enviados por no-administradores. |
| `.welcome <on\|off>` | `.bienvenida` | Envía mensaje de bienvenida automático cuando ingresa un nuevo miembro. |

---

### 🔞 Comandos NSFW de Catálogo +18
*(Requieren activación previa con `.nsfw on` por parte de un administrador)*
| Comando | Alias | Descripción |
| :--- | :--- | :--- |
| `.nsfw <on\|off>` | `.+18` | Activa o desactiva la categoría para adultos en el grupo actual. |
| `.hentai` | `.anime18` | Envía imágenes de arte anime NSFW aleatorias de alta resolución. |
| `.waifu [nsfw]` | `.waifunsfw` | Variantes de waifus en categorías adultas. |
| `.real` | `.cosplay18` | Fotografía y cosplay de catálogo general para adultos. |
| `.pack` | `.galeria18` | Envía un recurso multimedia aleatorio de la categoría para adultos. |
| `.rule34 <etiqueta>` | `.r34` | Búsqueda por etiquetas o personajes en repositorios booru. |
| `.ecchi` | `.erotico` | Imágenes de tono sugerente o erótico suave. |
| `.nsfwsticker` | `.stickernsfw` | Convierte contenido NSFW directamente a sticker de WhatsApp. |

---

### 🔥 Comandos de Interacción y Rol +18 (Entre Usuarios)
*(Requieren `.nsfw on` y mencionar obligatoriamente a otro usuario)*
| Comando | Alias | Acción Contextual Generada |
| :--- | :--- | :--- |
| `.strip @usuario` | `.desvestir` | 🔥 *@A le ha quitado una prenda seductoramente a @B* 👗 |
| `.touch @usuario` | `.manosear` | 🔥 *@A ha tocado y acariciado con audacia a @B* ✋ |
| `.slapnsfw @usuario` | `.azotensfw` | 🔥 *@A le ha propinado una palmada explícita en las caderas a @B* 🍑 |
| `.spank @usuario` | `.azotar` | 🔥 *@A ha castigado con un azote a @B* 💥 |
| `.suck @usuario` | `.oral` | 🔥 *@A le está realizando sexo oral apasionadamente a @B* 🫦 |
| `.fuck @usuario` | `.penetrate` | 🔥 *@A ha tomado en una sesión íntima y desenfrenada a @B* 🔞 |
| `.cum @usuario` | `.venirse` | 🔥 *@A ha culminado intensamente sobre @B* 💦 |
| `.lick @usuario` | `.lamer` | 🔥 *@A ha recorrido eróticamente con su lengua a @B* 👅 |
| `.bite @usuario` | `.morder` | 🔥 *@A le ha dado una mordida sugerente y excitante a @B* 👄 |
| `.grope @usuario` | `.agarrar` | 🔥 *@A ha agarrado impulsivamente las zonas prohibidas de @B* 😈 |
| `.bondage @usuario` | `.atar` | 🔥 *@A ha atado e inmovilizado en la cama a @B* ⛓️ |
| `.grind @usuario` | `.rozar` | 🔥 *@A se ha frotado íntima y apasionadamente contra @B* 🥵 |
| `.bed @usuario` | `.cama` | 🔥 *@A ha llevado directo a la cama a @B* 🛏️ |
