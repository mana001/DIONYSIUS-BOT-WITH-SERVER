// -------------------------------------------------------------
// 1. KEEP-ALIVE SERVER FOR RENDER (WITH SELF-PINGING)
// -------------------------------------------------------------
const express = require('express');
const https = require('https');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => res.send('🍷 Dionysius is awake and watching!'));
app.listen(PORT, '0.0.0.0', () => console.log(`Server listening on port ${PORT}`));

// ⏰ SELF-PING LOGIC (Keeps Render instance awake - Every 5 mins)
const APP_URL = process.env.RENDER_EXTERNAL_URL || "";

setInterval(() => {
  if (APP_URL) {
    https.get(APP_URL, (res) => {
      console.log(`⏰ Keep-alive ping sent to ${APP_URL} (Status: ${res.statusCode})`);
    }).on('error', (err) => {
      console.log(`⚠️ Keep-alive ping failed: ${err.message}`);
    });
  }
}, 5 * 60 * 1000);

// -------------------------------------------------------------
// 2. DISCORD CLIENT SETUP & INTENTS
// -------------------------------------------------------------
const { 
  Client, 
  GatewayIntentBits, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle,
  AttachmentBuilder 
} = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const BOT_TOKEN = process.env.DISCORD_TOKEN || "PASTE_YOUR_BOT_TOKEN_HERE";

// -------------------------------------------------------------
// 👑 PERMISSIONS CONFIGURATION
// -------------------------------------------------------------
const OWNER_ID = "YOUR_NUMERIC_DISCORD_USER_ID"; 
const REQUIRED_ROLE_NAME = "HOST B";

function isAuthorized(member, user) {
  if (user && user.id === OWNER_ID) return true;
  if (member && member.roles) {
    return member.roles.cache.some(role => role.name === REQUIRED_ROLE_NAME);
  }
  return false;
}

// -------------------------------------------------------------
// 3. LOCAL ASSETS & GAME DATA MAPPING (5 Games & 7 Tricks = 12 Doors)
// -------------------------------------------------------------
const ASSETS = {
  HALLWAY_IMAGE: path.join(__dirname, 'assets', 'hallway.png'),
  
  // 💀 TRICKS MAPPED TO EXACT LOCAL FILES & NICKNAMES (7 Tricks)
  TRICKS: [
    { 
      nickname: "GRANPA CHASER 👴", 
      image: null, 
      gif: path.join(__dirname, 'assets', 'gif4.webp') 
    },
    { 
      nickname: "FOSTER FAIL 🥀", 
      image: path.join(__dirname, 'assets', 'img1.png'), 
      gif: path.join(__dirname, 'assets', 'gif5.gif') 
    },
    { 
      nickname: "ROBERT CARTER FELONI", 
      image: path.join(__dirname, 'assets', 'img2.png'), 
      gif: path.join(__dirname, 'assets', 'gif6.gif') 
    },
    { 
      nickname: "Goblin Snack 🥒", 
      image: path.join(__dirname, 'assets', 'img3.png'), 
      gif: path.join(__dirname, 'assets', 'gif7.gif') 
    },
    { 
      nickname: "MR.POOTY 😬", 
      image: null, 
      gif: path.join(__dirname, 'assets', 'gif1.gif') 
    },
    { 
      nickname: "THE REAL RAG DOLL 🪆", 
      image: null, 
      gif: path.join(__dirname, 'assets', 'gif2.gif') 
    },
    { 
      nickname: "Sir Shits-A-Lot", 
      image: null, 
      gif: path.join(__dirname, 'assets', 'gif3.webp') 
    }
  ]
};

// 💬 TRICK RANDOM QUOTES POOL
const TRICK_QUOTES = [
  "Ah, exactly what I always wanted: absolute disappointment.",
  "Let me guess, the real prize is the friends we lost along the way?",
  "Oh, brilliant. Should I frame this or just cry now?",
  "Womp womp. Better luck next time, Champion!"
];

// -------------------------------------------------------------
// 📋 GAMES LIST (5 Games with Custom GIFs including WOULD YOU RATHER?)
// -------------------------------------------------------------
const GAMES_LIST = [
  { 
    name: "EMOJI STORY 🎭", 
    description: "Tell a short story using **ONLY EMOJIS**. Vagg has to guess what happened!",
    image: null,
    gif: path.join(__dirname, 'assets', 'gif8.gif')
  },
  { 
    name: "HOW WELL DO YOU KNOW YOUR CLICK? 👥", 
    description: "You have to answer questions about your click!",
    image: null,
    gif: path.join(__dirname, 'assets', 'gif9.gif')
  },
  { 
    name: "FACT OR FICTION? 📜", 
    description: "WE TELL YOU A FACT AND YOU HAVE TO GUESS IF IT'S REAL OR NOT!",
    image: null,
    gif: path.join(__dirname, 'assets', 'gif10.webp')
  },
  { 
    name: "HOT SEAT 🔥", 
    description: "You are on the Hot Seat! ANSWER THE QUESTION WITH THE FIRST PERSON WHO COMES TO MIND! IT'S HOT HOT🌡🛀🔥🌶",
    image: null,
    gif: path.join(__dirname, 'assets', 'gif11.webp')
  },
  { 
    name: "WOULD YOU RATHER? 🤔", 
    description: "Choose between two difficult or hilarious dilemmas and defend your choice!",
    image: null,
    gif: path.join(__dirname, 'assets', 'gif13.gif')
  }
];

const activeChannels = new Map();

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function createHallwayPayload() {
  const doors = [
    // 5 Games
    { type: 'GAME', data: GAMES_LIST[0], used: false },
    { type: 'GAME', data: GAMES_LIST[1], used: false },
    { type: 'GAME', data: GAMES_LIST[2], used: false },
    { type: 'GAME', data: GAMES_LIST[3], used: false },
    { type: 'GAME', data: GAMES_LIST[4], used: false },
    // 7 Tricks
    { type: 'TRICK', data: ASSETS.TRICKS[0], used: false },
    { type: 'TRICK', data: ASSETS.TRICKS[1], used: false },
    { type: 'TRICK', data: ASSETS.TRICKS[2], used: false },
    { type: 'TRICK', data: ASSETS.TRICKS[3], used: false },
    { type: 'TRICK', data: ASSETS.TRICKS[4], used: false },
    { type: 'TRICK', data: ASSETS.TRICKS[5], used: false },
    { type: 'TRICK', data: ASSETS.TRICKS[6], used: false }
  ];

  shuffle(doors);

  const hallwayAttachment = new AttachmentBuilder(ASSETS.HALLWAY_IMAGE);
  const hallwayEmbed = new EmbedBuilder()
    .setTitle("🍷 Domain of Dionysius 🎭")
    .setDescription(
      "Welcome to the Grand Hallway. Before you lie 12 mysterious doors.\n\n" +
      "✨ **5 Doors** lead to grand party games...\n" +
      "💀 **7 Doors** lead to chaotic tricks & madness.\n\n" +
      "*Choose your door wisely, mortal...*"
    )
    .setColor("#800020")
    .setImage(`attachment://${path.basename(ASSETS.HALLWAY_IMAGE)}`)
    .setFooter({ text: "Dionysius is watching" });

  const row1 = new ActionRowBuilder();
  const row2 = new ActionRowBuilder();
  const row3 = new ActionRowBuilder();

  for (let i = 0; i < 12; i++) {
    const button = new ButtonBuilder()
      .setCustomId(`door_${i}`)
      .setLabel(`Door ${i + 1}`)
      .setEmoji("🚪")
      .setStyle(ButtonStyle.Primary);

    if (i < 5) row1.addComponents(button);
    else if (i < 10) row2.addComponents(button);
    else row3.addComponents(button);
  }

  return { 
    embed: hallwayEmbed, 
    components: [row1, row2, row3], 
    doors: doors, 
    files: [hallwayAttachment] 
  };
}

// -------------------------------------------------------------
// CORE DOOR UNLOCK LOGIC (Crash-Proof: Only locks when successful)
// -------------------------------------------------------------
async function processDoorUnlock(session, doorIndex, member, user) {
  const selectedDoor = session.doors[doorIndex];

  if (selectedDoor.used) {
    return { success: false, reason: "ALREADY_OPEN" };
  }

  const embeds = [];
  const files = [];

  if (selectedDoor.type === 'GAME') {
    const game = selectedDoor.data;

    const gameEmbed = new EmbedBuilder()
      .setTitle(`🎉 FESTIVITY REVEALED: Door #${doorIndex + 1}`)
      .setDescription(
        `The heavy marble door opens with a warm flash of light!\n\n` +
        `**Player:** ${user}\n` +
        `**Game:** __${game.name}__\n\n` +
        `📋 **Rules & Prompt:**\n${game.description}`
      )
      .setColor("#FFD700")
      .setFooter({ text: "Let the festivities begin!" });

    if (game.image) {
      const imgName = path.basename(game.image);
      gameEmbed.setImage(`attachment://${imgName}`);
      files.push(new AttachmentBuilder(game.image));
    }
    embeds.push(gameEmbed);

    if (game.gif) {
      const gifName = path.basename(game.gif);
      const gifEmbed = new EmbedBuilder()
        .setColor("#FFD700")
        .setImage(`attachment://${gifName}`);
      files.push(new AttachmentBuilder(game.gif));
      embeds.push(gifEmbed);
    }
  } 
  else if (selectedDoor.type === 'TRICK') {
    const trickData = selectedDoor.data;
    const targetNickname = trickData.nickname;
    const guild = member.guild;
    
    let targetMember = null;
    let nickChanged = false;

    try {
      await guild.roles.fetch();
      const birthdayRole = guild.roles.cache.find(
        r => r.name.toLowerCase() === "birthday boy"
      );

      if (birthdayRole) {
        await birthdayRole.members.fetch();
        if (birthdayRole.members.size > 0) {
          targetMember = birthdayRole.members.random();
        }
      }
    } catch (e) {
      console.log("Could not fetch role or members:", e);
    }

    if (targetMember) {
      try {
        if (targetMember.manageable) {
          await targetMember.setNickname(targetNickname);
          nickChanged = true;
        }
      } catch (err) {
        console.log("Failed to change nickname:", err);
      }
    }

    const randomQuote = TRICK_QUOTES[Math.floor(Math.random() * TRICK_QUOTES.length)];

    const trickEmbed = new EmbedBuilder()
      .setTitle(`💀 YOU'VE BEEN TRICKED! HAHAHA! (Door #${doorIndex + 1})`)
      .setDescription(
        `A dark door was opened and Dionysius targeted the Birthday Boy!\n\n` +
        `💬 *"${randomQuote}"*\n\n` +
        `🎂 **Victim:** ${targetMember ? targetMember : "No Birthday Boy found!"}\n` +
        (nickChanged 
          ? `🎭 **New Identity:** ${targetMember} is now known as **${targetNickname}**!` 
          : `🎭 **Fate:** Dionysius laughs at your foolishness!`)
      )
      .setColor("#FF0000");

    if (trickData.image) {
      const imgName = path.basename(trickData.image);
      trickEmbed.setImage(`attachment://${imgName}`);
      files.push(new AttachmentBuilder(trickData.image));
      embeds.push(trickEmbed);

      if (trickData.gif) {
        const gifName = path.basename(trickData.gif);
        const gifEmbed = new EmbedBuilder()
          .setColor("#FF0000")
          .setImage(`attachment://${gifName}`);
        files.push(new AttachmentBuilder(trickData.gif));
        embeds.push(gifEmbed);
      }
    } else if (trickData.gif) {
      const gifName = path.basename(trickData.gif);
      trickEmbed.setImage(`attachment://${gifName}`);
      files.push(new AttachmentBuilder(trickData.gif));
      embeds.push(gifEmbed);
    } else {
      embeds.push(trickEmbed);
    }
  }

  // Only mark as used after everything has successfully generated
  selectedDoor.used = true;

  session.components = session.components.map(row => {
    const newRow = ActionRowBuilder.from(row);
    newRow.components.forEach(button => {
      if (button.data.custom_id === `door_${doorIndex}`) {
        button.setDisabled(true);
        button.setLabel(`Opened (${doorIndex + 1})`);
        button.setStyle(selectedDoor.type === 'TRICK' ? ButtonStyle.Danger : ButtonStyle.Success);
      }
    });
    return newRow;
  });

  return { success: true, embeds, files };
}

// -------------------------------------------------------------
// 4. BOT READY EVENT
// -------------------------------------------------------------
client.once('ready', async () => {
  console.log(`🍷 Dionysius has awakened as ${client.user.tag}!`);

  try {
    const commands = [
      { name: 'domain', description: 'Summon the Domain of Dionysius and the 12 Doors!' },
      { name: 'doors', description: 'Summon the Domain of Dionysius and the 12 Doors!' }
    ];
    await client.application.commands.set(commands);
    console.log("✅ Registered /domain and /doors Slash Commands!");
  } catch (err) {
    console.error("Failed to register slash commands:", err);
  }
});

// -------------------------------------------------------------
// 5. CHAT INPUT LISTENER (Type Door Number 1-12 to Open)
// -------------------------------------------------------------
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const trimmed = message.content.trim();
  const doorNum = parseInt(trimmed);
  
  if (isNaN(doorNum) || doorNum < 1 || doorNum > 12) return;

  if (!isAuthorized(message.member, message.author)) {
    return message.reply({ content: `⛔ Only authorized hosts can unseal doors!` }).catch(() => {});
  }

  let session = activeChannels.get(message.channelId);
  if (!session) {
    return message.reply({ content: `⚠️ No active hallway in this channel! Summon it first using /domain or /doors.` }).catch(() => {});
  }

  const doorIndex = doorNum - 1;
  const selectedDoor = session.doors[doorIndex];

  if (selectedDoor.used) {
    return message.reply({ content: `🚪 Door #${doorNum} has already been unsealed! Choose another.` }).catch(() => {});
  }

  try {
    const result = await processDoorUnlock(session, doorIndex, message.member, message.author);

    if (!result.success) {
      return message.reply({ content: `⚠️ Could not open this door.` }).catch(() => {});
    }

    try {
      const hallwayMsg = await message.channel.messages.fetch(session.messageId);
      await hallwayMsg.edit({ components: session.components });
    } catch (e) {
      console.log("Could not update hallway message buttons via chat:", e);
    }

    await message.channel.send({ embeds: result.embeds, files: result.files });

  } catch (err) {
    console.error(`❌ Error opening Door #${doorNum} via chat:`, err);
    return message.reply({ content: `⚠️ Render failed while opening Door #${doorNum}. Please try again!` }).catch(() => {});
  }
});

// -------------------------------------------------------------
// 6. INTERACTION LISTENER (Slash Commands & Buttons)
// -------------------------------------------------------------
client.on('interactionCreate', async (interaction) => {

  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === 'domain' || interaction.commandName === 'doors') {
      if (!isAuthorized(interaction.member, interaction.user)) {
        return interaction.reply({ 
          content: `⛔ You do not have permission to control Dionysius!`, 
          ephemeral: true 
        });
      }

      const payload = createHallwayPayload();
      const replyMessage = await interaction.reply({
        embeds: [payload.embed],
        components: payload.components,
        files: payload.files,
        fetchReply: true
      });

      activeChannels.set(interaction.channelId, {
        messageId: replyMessage.id,
        doors: payload.doors,
        components: payload.components,
        embed: payload.embed,
        files: payload.files
      });
    }
    return;
  }

  if (interaction.isButton()) {
    if (!isAuthorized(interaction.member, interaction.user)) {
      return interaction.reply({ 
        content: `⛔ Only authorized hosts can unseal doors!`, 
        ephemeral: true 
      });
    }

    await interaction.deferUpdate().catch(() => {});

    let session = activeChannels.get(interaction.channelId);

    if (!session) {
      const payload = createHallwayPayload();
      session = {
        messageId: interaction.message.id,
        doors: payload.doors,
        components: payload.components,
        embed: payload.embed,
        files: payload.files
      };
      activeChannels.set(interaction.channelId, session);
    }

    const doorIndex = parseInt(interaction.customId.split('_')[1]);
    const selectedDoor = session.doors[doorIndex];

    if (selectedDoor.used) {
      return interaction.followUp({ 
        content: "🚪 This door has already been unsealed! Choose another.", 
        ephemeral: true 
      });
    }

    try {
      const result = await processDoorUnlock(session, doorIndex, interaction.member, interaction.user);

      if (!result.success) {
        return interaction.followUp({ content: "⚠️ Could not open this door.", ephemeral: true });
      }

      await interaction.message.edit({ components: session.components });
      await interaction.followUp({ embeds: result.embeds, files: result.files });

    } catch (err) {
      console.error(`❌ Error opening Door #${doorIndex + 1}:`, err);

      return interaction.followUp({ 
        content: `⚠️ Render lagged while opening Door #${doorIndex + 1}. The door remains unlocked—please try clicking it again!`, 
        ephemeral: true 
      });
    }
  }
});

client.login(BOT_TOKEN);
