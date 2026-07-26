// -------------------------------------------------------------
// 1. KEEP-ALIVE SERVER FOR RENDER
// -------------------------------------------------------------
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => res.send('🍷 Dionysius is awake and watching!'));
app.listen(PORT, '0.0.0.0', () => console.log(`Server listening on port ${PORT}`));

// -------------------------------------------------------------
// 2. DISCORD CLIENT SETUP & INTENTS
// -------------------------------------------------------------
const { 
  Client, 
  GatewayIntentBits, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle 
} = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const BOT_TOKEN = process.env.DISCORD_TOKEN || "PASTE_YOUR_BOT_TOKEN_HERE";

// -------------------------------------------------------------
// 3. ASSETS & GAME DATA
// -------------------------------------------------------------
const ASSETS = {
  HALLWAY_IMAGE: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1000",
  GAME_IMAGE: "https://media.giphy.com/media/l2JIdnF6aJzAqzByo/giphy.gif",
  TRICK_GIFS: [
    "https://media.giphy.com/media/xl5QdxfNonh3q/giphy.gif",
    "https://media.giphy.com/media/ba5g4ID9g5cT6/giphy.gif",
    "https://media.giphy.com/media/13l7rl15fX3s2I/giphy.gif",
    "https://media.giphy.com/media/3o72F8t9TDi2xVnxOE/giphy.gif"
  ],
  SILLY_NICKNAMES: [
    "Mr. POOTY 💩",
    "Lord Clown 🤡",
    "Goblin Snack 🥒",
    "Party Fool 🎭",
    "Dionysius's Chair 🪑",
    "Soggy Waffle 🧇"
  ]
};

const GAMES_LIST = [
  { name: "EMOJI STORY 🎭", description: "Tell a short embarrassing story using **ONLY EMOJIS**. The rest of the group has 2 minutes to guess what happened!" },
  { name: "HOW WELL DO YOU KNOW YOUR CLIQUE? 👥", description: "Pick one person in the room. You have to answer 3 fast trivia questions about them voted on by the rest of the party!" },
  { name: "FACT OR FICTION? 📜", description: "Tell 2 bizarre facts and 1 convincing lie about yourself. Anyone who guesses wrong must take a silly penalty!" },
  { name: "HOT SEAT 🔥", description: "You are on the Hot Seat for 3 minutes! Everyone in the voice chat gets to ask you ONE unfiltered question." },
  { name: "WHO SAID IT? 🗣️", description: "The host will read out a random out-of-context quote from the server history. Guess who said it first!" },
  { name: "WOULD YOU RATHER? ⚖️", description: "The party host will present two unbearable choices. You must pick one and justify it with full passion!" }
];

const activeSessions = new Map();

// Helper function to build hallway embed and buttons
function createHallwayPayload() {
  const shuffledGames = [...GAMES_LIST].sort(() => 0.5 - Math.random()).slice(0, 5);
  const doors = [];
  shuffledGames.forEach(game => doors.push({ type: 'GAME', data: game, used: false }));
  for (let i = 0; i < 5; i++) {
    doors.push({ type: 'TRICK', used: false });
  }
  doors.sort(() => 0.5 - Math.random());

  const hallwayEmbed = new EmbedBuilder()
    .setTitle("🍷 Domain of Dionysius 🎭")
    .setDescription(
      "Welcome to the Grand Hallway. Before you lie 10 mysterious doors.\n\n" +
      "✨ **5 Doors** lead to grand party games...\n" +
      "💀 **5 Doors** lead to chaotic tricks & madness.\n\n" +
      "*Choose your door wisely, mortal...*"
    )
    .setColor("#800020")
    .setImage(ASSETS.HALLWAY_IMAGE)
    .setFooter({ text: "Dionysius is watching • Click a button below" });

  const row1 = new ActionRowBuilder();
  const row2 = new ActionRowBuilder();

  for (let i = 0; i < 10; i++) {
    const button = new ButtonBuilder()
      .setCustomId(`door_${i}`)
      .setLabel(`Door ${i + 1}`)
      .setEmoji("🚪")
      .setStyle(ButtonStyle.Primary);

    if (i < 5) row1.addComponents(button);
    else row2.addComponents(button);
  }

  return { embed: hallwayEmbed, components: [row1, row2], doors: doors };
}

// -------------------------------------------------------------
// 4. BOT READY EVENT & SLASH COMMAND REGISTRATION
// -------------------------------------------------------------
client.once('ready', async () => {
  console.log(`🍷 Dionysius has awakened as ${client.user.tag}!`);

  // Automatically register /domain and /doors slash commands with Discord
  try {
    const commands = [
      { name: 'domain', description: 'Summon the Domain of Dionysius and the 10 Doors!' },
      { name: 'doors', description: 'Summon the Domain of Dionysius and the 10 Doors!' }
    ];
    await client.application.commands.set(commands);
    console.log("✅ Registered /domain and /doors Slash Commands!");
  } catch (err) {
    console.error("Failed to register slash commands:", err);
  }
});

// -------------------------------------------------------------
// 5. TEXT COMMAND LISTENER (!domain or !doors)
// -------------------------------------------------------------
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const command = message.content.toLowerCase().trim();
  if (command === '!domain' || command === '!doors') {
    const payload = createHallwayPayload();
    const sentMessage = await message.channel.send({
      embeds: [payload.embed],
      components: payload.components
    });
    activeSessions.set(sentMessage.id, payload.doors);
  }
});

// -------------------------------------------------------------
// 6. INTERACTION LISTENER (SLASH COMMANDS & BUTTONS)
// -------------------------------------------------------------
client.on('interactionCreate', async (interaction) => {

  // A) SLASH COMMAND HANDLING (/domain or /doors)
  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === 'domain' || interaction.commandName === 'doors') {
      const payload = createHallwayPayload();
      const replyMessage = await interaction.reply({
        embeds: [payload.embed],
        components: payload.components,
        fetchReply: true
      });
      activeSessions.set(replyMessage.id, payload.doors);
    }
    return;
  }

  // B) BUTTON CLICK HANDLING (DOORS)
  if (interaction.isButton()) {
    const messageId = interaction.message.id;
    const doors = activeSessions.get(messageId);

    if (!doors) {
      return interaction.reply({ 
        content: "🎭 This hallway has faded into ancient history. Summon a new one with `/domain`!", 
        ephemeral: true 
      });
    }

    const doorIndex = parseInt(interaction.customId.split('_')[1]);
    const selectedDoor = doors[doorIndex];

    if (selectedDoor.used) {
      return interaction.reply({ 
        content: "🚪 This door has already been unsealed! Choose another.", 
        ephemeral: true 
      });
    }

    selectedDoor.used = true;

    // Grey out / color the button
    const updatedRows = interaction.message.components.map(row => {
      const newRow = ActionRowBuilder.from(row);
      newRow.components.forEach(button => {
        if (button.data.custom_id === interaction.customId) {
          button.setDisabled(true);
          button.setLabel(`Opened (${doorIndex + 1})`);
          button.setStyle(selectedDoor.type === 'TRICK' ? ButtonStyle.Danger : ButtonStyle.Success);
        }
      });
      return newRow;
    });

    await interaction.message.edit({ components: updatedRows });

    // Outcome A: Game Door
    if (selectedDoor.type === 'GAME') {
      const game = selectedDoor.data;
      const gameEmbed = new EmbedBuilder()
        .setTitle(`🎉 FESTIVITY REVEALED: Door #${doorIndex + 1}`)
        .setDescription(
          `The heavy marble door opens with a warm flash of light!\n\n` +
          `**Player:** ${interaction.user}\n` +
          `**Game:** __${game.name}__\n\n` +
          `📋 **Rules & Prompt:**\n${game.description}`
        )
        .setColor("#FFD700")
        .setThumbnail(ASSETS.GAME_IMAGE)
        .setFooter({ text: "Let the festivities begin!" });

      await interaction.reply({ embeds: [gameEmbed] });
    } 
    // Outcome B: Trick Door
    else if (selectedDoor.type === 'TRICK') {
      const randomGif = ASSETS.TRICK_GIFS[Math.floor(Math.random() * ASSETS.TRICK_GIFS.length)];
      const randomNick = ASSETS.SILLY_NICKNAMES[Math.floor(Math.random() * ASSETS.SILLY_NICKNAMES.length)];
      let nickChanged = false;

      try {
        if (interaction.member && interaction.member.manageable) {
          await interaction.member.setNickname(randomNick);
          nickChanged = true;
        }
      } catch (err) {
        console.log("Could not change nickname due to server role hierarchy.");
      }

      const trickEmbed = new EmbedBuilder()
        .setTitle(`💀 YOU'VE BEEN TRICKED! HAHAHA! (Door #${doorIndex + 1})`)
        .setDescription(
          `You reached into the dark hallway and Dionysius trapped you!\n\n` +
          `😈 **Mortal Punished:** ${interaction.user}\n` +
          (nickChanged ? `🎭 **New Identity:** You are now known as **${randomNick}**!` : `🎭 **Fate:** Dionysius laughs at your foolishness!`)
        )
        .setColor("#FF0000")
        .setImage(randomGif);

      await interaction.reply({ embeds: [trickEmbed] });
    }
  }
});

client.login(BOT_TOKEN);
