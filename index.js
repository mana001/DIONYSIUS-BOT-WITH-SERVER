// -------------------------------------------------------------
// KEEP-ALIVE SERVER FOR RENDER (REQUIRED BY RENDER)
// -------------------------------------------------------------
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => res.send('🍷 Dionysius is awake and watching!'));
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

const { 
  Client, 
  GatewayIntentBits, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle 
} = require('discord.js');

// -------------------------------------------------------------
// 1. CLIENT SETUP & INTENTS
// -------------------------------------------------------------
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

// Put your Bot Token here (or set process.env.DISCORD_TOKEN in Replit Secrets)
const BOT_TOKEN = process.env.DISCORD_TOKEN || "PASTE_YOUR_BOT_TOKEN_HERE";

// -------------------------------------------------------------
// 2. IMAGES & GIFS (EDIT THESE URLS WHENEVER YOU WANT)
// -------------------------------------------------------------
const ASSETS = {
  // Main hallway embed image
  HALLWAY_IMAGE: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1000",
  
  // Celebratory image when a game door is opened
  GAME_IMAGE: "https://media.giphy.com/media/l2JIdnF6aJzAqzByo/giphy.gif",
  
  // Funny / mocking GIFs for trick doors
  TRICK_GIFS: [
    "https://media.giphy.com/media/xl5QdxfNonh3q/giphy.gif", // Evil laugh
    "https://media.giphy.com/media/ba5g4ID9g5cT6/giphy.gif", // Cat laugh
    "https://media.giphy.com/media/13l7rl15fX3s2I/giphy.gif", // Point & laugh
    "https://media.giphy.com/media/3o72F8t9TDi2xVnxOE/giphy.gif"
  ],

  // Silly nicknames for trick doors
  SILLY_NICKNAMES: [
    "Mr. POOTY 💩",
    "Lord Clown 🤡",
    "Goblin Snack 🥒",
    "Party Fool 🎭",
    "Dionysius's Chair 🪑",
    "Soggy Waffle 🧇"
  ]
};

// -------------------------------------------------------------
// 3. THE 5 GAME DOORS DEFINITION
// -------------------------------------------------------------
const GAMES_LIST = [
  {
    name: "EMOJI STORY 🎭",
    description: "Tell a short embarrassing story using **ONLY EMOJIS**. The rest of the group has 2 minutes to guess what happened!"
  },
  {
    name: "HOW WELL DO YOU KNOW YOUR CLIQUE? 👥",
    description: "Pick one person in the room. You have to answer 3 fast trivia questions about them voted on by the rest of the party!"
  },
  {
    name: "FACT OR FICTION? 📜",
    description: "Tell 2 bizarre facts and 1 convincing lie about yourself. Anyone who guesses wrong must take a silly penalty!"
  },
  {
    name: "HOT SEAT 🔥",
    description: "You are on the Hot Seat for 3 minutes! Everyone in the voice chat gets to ask you ONE unfiltered question."
  },
  {
    name: "WHO SAID IT? 🗣️",
    description: "The host will read out a random out-of-context quote from the server history. Guess who said it first!"
  },
  {
    name: "WOULD YOU RATHER? ⚖️",
    description: "The party host will present two unbearable choices. You must pick one and justify it with full passion!"
  }
];

// Memory storage to track active door states for active sessions
const activeSessions = new Map();

// -------------------------------------------------------------
// 4. BOT READY EVENT
// -------------------------------------------------------------
client.once('ready', () => {
  console.log(`🍷 Dionysius has awakened as ${client.user.tag}!`);
});

// -------------------------------------------------------------
// 5. COMMAND LISTENER (!domain or !doors)
// -------------------------------------------------------------
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const command = message.content.toLowerCase().trim();

  // Trigger command: !domain or !doors
  if (command === '!domain' || command === '!doors') {
    
    // Create 10 shuffled doors (5 Games, 5 Tricks)
    const shuffledGames = [...GAMES_LIST].sort(() => 0.5 - Math.random()).slice(0, 5);
    
    const doors = [];
    // Push 5 game doors
    shuffledGames.forEach(game => doors.push({ type: 'GAME', data: game, used: false }));
    // Push 5 trick doors
    for (let i = 0; i < 5; i++) {
      doors.push({ type: 'TRICK', used: false });
    }
    // Shuffle all 10 doors randomly so door positions change every game
    doors.sort(() => 0.5 - Math.random());

    // Build Discord Embed
    const hallwayEmbed = new EmbedBuilder()
      .setTitle("🍷 Domain of Dionysius 🎭")
      .setDescription(
        "Welcome to the Grand Hallway. Before you lie 10 mysterious doors.\n\n" +
        "✨ **5 Doors** lead to grand party games...\n" +
        "💀 **5 Doors** lead to chaotic tricks & madness.\n\n" +
        "*Choose your door wisely, mortal...*"
      )
      .setColor("#800020") // Deep wine red
      .setImage(ASSETS.HALLWAY_IMAGE)
      .setFooter({ text: "Dionysius is watching • Click a button below" });

    // Build the 10 Door Buttons (2 rows of 5 buttons)
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

    const sentMessage = await message.channel.send({
      embeds: [hallwayEmbed],
      components: [row1, row2]
    });

    // Save session state linked to this message ID
    activeSessions.set(sentMessage.id, doors);
  }
});

// -------------------------------------------------------------
// 6. BUTTON INTERACTION LISTENER (CLICKING DOORS)
// -------------------------------------------------------------
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;

  const messageId = interaction.message.id;
  const doors = activeSessions.get(messageId);

  // If no active session found for this message
  if (!doors) {
    return interaction.reply({ 
      content: "🎭 This hallway has faded into ancient history. Summon a new one with `!domain`!", 
      ephemeral: true 
    });
  }

  // Extract door index (e.g. "door_3" -> index 3)
  const doorIndex = parseInt(interaction.customId.split('_')[1]);
  const selectedDoor = doors[doorIndex];

  // Check if door was already opened
  if (selectedDoor.used) {
    return interaction.reply({ 
      content: "🚪 This door has already been unsealed! Choose another.", 
      ephemeral: true 
    });
  }

  // Mark door as used
  selectedDoor.used = true;

  // Re-generate button rows to show used state (grey out the clicked door)
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

  // Update original hallway message buttons
  await interaction.message.edit({ components: updatedRows });

  // -----------------------------------------------------------
  // OUTCOME A: THE FESTIVITY (GAME DOOR)
  // -----------------------------------------------------------
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
      .setColor("#FFD700") // Gold
      .setThumbnail(ASSETS.GAME_IMAGE)
      .setFooter({ text: "Let the festivities begin!" });

    await interaction.reply({ embeds: [gameEmbed] });
  } 

  // -----------------------------------------------------------
  // OUTCOME B: THE MADNESS (TRICK DOOR)
  // -----------------------------------------------------------
  else if (selectedDoor.type === 'TRICK') {
    const randomGif = ASSETS.TRICK_GIFS[Math.floor(Math.random() * ASSETS.TRICK_GIFS.length)];
    const randomNick = ASSETS.SILLY_NICKNAMES[Math.floor(Math.random() * ASSETS.SILLY_NICKNAMES.length)];
    
    let nickChanged = false;

    // Try changing player's nickname
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
      .setColor("#FF0000") // Red
      .setImage(randomGif);

    await interaction.reply({ embeds: [trickEmbed] });
  }
});

// -------------------------------------------------------------
// 7. LOGIN THE BOT
// -------------------------------------------------------------
client.login(BOT_TOKEN);
