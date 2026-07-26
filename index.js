// -------------------------------------------------------------
// 1. KEEP-ALIVE SERVER FOR RENDER (WITH SELF-PINGING)
// -------------------------------------------------------------
const express = require('express');
const https = require('https');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => res.send('🍷 Dionysius is awake and watching!'));
app.listen(PORT, '0.0.0.0', () => console.log(`Server listening on port ${PORT}`));

// ⏰ SELF-PING LOGIC (Keeps Render instance awake)
const APP_URL = process.env.RENDER_EXTERNAL_URL || "";

setInterval(() => {
  if (APP_URL) {
    https.get(APP_URL, (res) => {
      console.log(`⏰ Keep-alive ping sent to ${APP_URL} (Status: ${res.statusCode})`);
    }).on('error', (err) => {
      console.log(`⚠️ Keep-alive ping failed: ${err.message}`);
    });
  }
}, 14 * 60 * 1000); // Ping every 14 minutes

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
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

const BOT_TOKEN = process.env.DISCORD_TOKEN || "PASTE_YOUR_BOT_TOKEN_HERE";

// -------------------------------------------------------------
// 👑 PERMISSIONS CONFIGURATION
// -------------------------------------------------------------
// ⚠️ Replace this string with your numeric Discord User ID (e.g., "123456789012345678")
const OWNER_ID = "YOUR_NUMERIC_DISCORD_USER_ID"; 

const REQUIRED_ROLE_NAME = "HOST B";

// Helper function to check permissions
function isAuthorized(member, user) {
  // 1. You (the owner) ALWAYS have access!
  if (user && user.id === OWNER_ID) return true;

  // 2. Anyone with the "HOST B" role also gets access
  if (member && member.roles) {
    return member.roles.cache.some(role => role.name === REQUIRED_ROLE_NAME);
  }

  return false;
}

// -------------------------------------------------------------
// 3. ASSETS & GAME DATA
// -------------------------------------------------------------
const ASSETS = {
  HALLWAY_IMAGE: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1000",
  DEFAULT_GAME_IMAGE: "https://media.giphy.com/media/l2JIdnF6aJzAqzByo/giphy.gif",
  
// 📸 TRICK IMAGES (Must end in .png, .jpg, or .gif)
  TRICK_IMAGES: [
    "https://i.ibb.co/RTBVdydK/ae5947fd-c8a1-4ad2-bb8a-5fbefab03011.png",
    "https://i.ibb.co/yHXnyT3/03157239-c73c-4a06-a7ed-9600bfdedada.png",
    "https://i.ibb.co/mFFQ3T9V/2cdb2222-7e40-49d9-ada7-6f5cdae57299.png",
    "https://media.giphy.com/media/l0HlCqV35hdEG2GUo/giphy.gif",
    "https://media.giphy.com/media/3o72F8t9TDi2xVnxOE/giphy.gif",
    "https://media.giphy.com/media/26tP3M3i03hoIyl6o/giphy.gif",
    "https://media.giphy.com/media/N35rW3vRNeaA/giphy.gif"
  ],

  // 🎬 TRICK SPECIFIC GIFS
  TRICK_GIFS: [
    "https://media.giphy.com/media/0SVAVxeJsnJ1WRMIPX/giphy.gif",
    "https://media.giphy.com/media/hTwNnrHNl4rlK/giphy.gif",
    "https://media.giphy.com/media/2g6sCTsSoVuSfSxK4W/giphy.gif",
    "https://media.giphy.com/media/3o72F8t9TDi2xVnxOE/giphy.gif",
    "https://media.giphy.com/media/l0HlCqV35hdEG2GUo/giphy.gif",
    "https://media.giphy.com/media/26tP3M3i03hoIyl6o/giphy.gif",
    "https://media.giphy.com/media/N35rW3vRNeaA/giphy.gif"
  ],

  // 🎭 SPECIFIC TRICK NICKNAMES
  TRICK_NICKNAMES: [
    "FOSTER FAIL 🥀",
    "ROBERT CARTER FELONI",
    "Goblin Snack 🥒",
    "MR.POOTY 😬",
    "THE REAL RAG DOLL 🪆",
    "Sir Shits-A-Lot 🕵",
    "GRANPA CHASER 👹"
  ]
};

// -------------------------------------------------------------
// 📋 GAMES LIST (5 Games with Custom Images & GIFs)
// -------------------------------------------------------------
const GAMES_LIST = [
  { 
    name: "EMOJI STORY 🎭", 
    description: "Tell a short story using **ONLY EMOJIS**. Vagg has to guess what happened!",
    image: null,
    gif: "https://media.giphy.com/media/519ChzMeyx4pa/giphy.gif"
  },
  { 
    name: "HOW WELL DO YOU KNOW YOUR CLIQUE? 👥", 
    description: "You have to answer questions about your click!",
    image: null,
    gif: "https://media.giphy.com/media/hW4iRJRU1rsfXve2Is/giphy.gif"
  },
  { 
    name: "FACT OR FICTION? 📜", 
    description: "WE TELL YOU A FACT AND YOU HAVE TO GUESS IF IT'S REAL OR NOT!",
    image: null,
    gif: "https://media.giphy.com/media/BQUITFiYVtNte/giphy.gif"
  },
  { 
    name: "HOT SEAT 🔥", 
    description: "You are on the Hot Seat! ANSWER THE QUESTION WITH THE FIRST PERSON WHO COMES TO MIND! IT'S HOT HOT🌡🛀🔥🌶",
    image: null,
    gif: "https://media.giphy.com/media/SmWymjSauhddFrFIOi/giphy.gif"
  },
  { 
    name: "WHO SAID IT? 🗣️", 
    description: "The host will show you a random out-of-context quote from the server history. Guess who said it!",
    image: null,
    gif: "https://media.giphy.com/media/13l7rl15fX3s2I/giphy.gif"
  }
];

// Map to track active hallway per channel
const activeChannels = new Map();

// 🔀 True Fisher-Yates Unbiased Random Shuffle
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Helper function to build hallway embed with 12 RANDOMLY MIXED DOORS
function createHallwayPayload() {
  const doors = [
    // 🎲 5 Games
    { type: 'GAME', data: GAMES_LIST[0], used: false },
    { type: 'GAME', data: GAMES_LIST[1], used: false },
    { type: 'GAME', data: GAMES_LIST[2], used: false },
    { type: 'GAME', data: GAMES_LIST[3], used: false },
    { type: 'GAME', data: GAMES_LIST[4], used: false },

    // 💀 7 Tricks
    { type: 'TRICK', image: ASSETS.TRICK_IMAGES[0], gif: ASSETS.TRICK_GIFS[0], nickname: ASSETS.TRICK_NICKNAMES[0], used: false },
    { type: 'TRICK', image: ASSETS.TRICK_IMAGES[1], gif: ASSETS.TRICK_GIFS[1], nickname: ASSETS.TRICK_NICKNAMES[1], used: false },
    { type: 'TRICK', image: ASSETS.TRICK_IMAGES[2], gif: ASSETS.TRICK_GIFS[2], nickname: ASSETS.TRICK_NICKNAMES[2], used: false },
    { type: 'TRICK', image: ASSETS.TRICK_IMAGES[3], gif: ASSETS.TRICK_GIFS[3], nickname: ASSETS.TRICK_NICKNAMES[3], used: false },
    { type: 'TRICK', image: ASSETS.TRICK_IMAGES[4], gif: ASSETS.TRICK_GIFS[4], nickname: ASSETS.TRICK_NICKNAMES[4], used: false },
    { type: 'TRICK', image: ASSETS.TRICK_IMAGES[5], gif: ASSETS.TRICK_GIFS[5], nickname: ASSETS.TRICK_NICKNAMES[5], used: false },
    { type: 'TRICK', image: ASSETS.TRICK_IMAGES[6], gif: ASSETS.TRICK_GIFS[6], nickname: ASSETS.TRICK_NICKNAMES[6], used: false }
  ];

  shuffle(doors);

  const hallwayEmbed = new EmbedBuilder()
    .setTitle("🍷 Domain of Dionysius 🎭")
    .setDescription(
      "Welcome to the Grand Hallway. Before you lie 12 mysterious doors.\n\n" +
      "✨ **5 Doors** lead to grand party games...\n" +
      "💀 **7 Doors** lead to chaotic tricks & madness.\n\n" +
      "*Choose your door wisely, mortal...*"
    )
    .setColor("#800020")
    .setImage(ASSETS.HALLWAY_IMAGE)
    .setFooter({ text: "Dionysius is watching • Auto-following chat" });

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

  return { embed: hallwayEmbed, components: [row1, row2, row3], doors: doors };
}

// -------------------------------------------------------------
// CORE DOOR UNLOCK LOGIC (Shared between Button & Chat Command)
// -------------------------------------------------------------
async function processDoorUnlock(session, doorIndex, member, user) {
  const selectedDoor = session.doors[doorIndex];

  if (selectedDoor.used) {
    return { success: false, reason: "ALREADY_OPEN" };
  }

  selectedDoor.used = true;

  // Update button visual state across all 3 rows
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

  const embeds = [];

  // Outcome A: Game Door
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

    const primaryImage = game.image || ASSETS.DEFAULT_GAME_IMAGE;
    gameEmbed.setImage(primaryImage);
    embeds.push(gameEmbed);

    if (game.gif) {
      const gifEmbed = new EmbedBuilder()
        .setColor("#FFD700")
        .setImage(game.gif);
      embeds.push(gifEmbed);
    }
  } 
  // Outcome B: Trick Door
  else if (selectedDoor.type === 'TRICK') {
    const targetNickname = selectedDoor.nickname;
    const guild = member.guild;
    
    // Fetch all members to ensure role caching works
    await guild.members.fetch();

    // Find the "BIRTHDAY BOY" role
    const birthdayRole = guild.roles.cache.find(
      r => r.name.toLowerCase() === "birthday boy"
    );

    let targetMember = null;
    let nickChanged = false;

    // Pick a member with the Birthday Boy role
    if (birthdayRole && birthdayRole.members.size > 0) {
      targetMember = birthdayRole.members.random();
    }

    // Change the Birthday Boy's nickname
    if (targetMember) {
      try {
        if (targetMember.manageable) {
          await targetMember.setNickname(targetNickname);
          nickChanged = true;
        } else {
          console.log("Could not change Birthday Boy's nickname due to role hierarchy.");
        }
      } catch (err) {
        console.log("Failed to change nickname:", err);
      }
    }

    const trickEmbed = new EmbedBuilder()
      .setTitle(`💀 YOU'VE BEEN TRICKED! HAHAHA! (Door #${doorIndex + 1})`)
      .setDescription(
        `Host ${user} opened a dark door and Dionysius targeted the Birthday Boy!\n\n` +
        `🎂 **Victim:** ${targetMember ? targetMember : "No Birthday Boy found!"}\n` +
        (nickChanged 
          ? `🎭 **New Identity:** ${targetMember} is now known as **${targetNickname}**!` 
          : `🎭 **Fate:** Dionysius laughs at your foolishness!`)
      )
      .setColor("#FF0000");

    if (selectedDoor.image) {
      trickEmbed.setImage(selectedDoor.image);
      embeds.push(trickEmbed);

      const gifEmbed = new EmbedBuilder()
        .setColor("#FF0000")
        .setImage(selectedDoor.gif);
      embeds.push(gifEmbed);
    } else {
      trickEmbed.setImage(selectedDoor.gif);
      embeds.push(trickEmbed);
    }
  }
  return { success: true, embeds: embeds };
}

// -------------------------------------------------------------
// 4. BOT READY EVENT & SLASH COMMAND REGISTRATION
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
// 5. MESSAGE LISTENER (Commands, Chat Door Unlocking & Auto-Bump)
// -------------------------------------------------------------
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const content = message.content.toLowerCase().trim();

  // A) SUMMON COMMANDS (!domain or !doors)
  if (content === '!domain' || content === '!doors') {
    if (!isAuthorized(message.member, message.author)) {
      return message.reply(`⛔ You do not have permission to control Dionysius!`);
    }

    const payload = createHallwayPayload();
    const sentMessage = await message.channel.send({
      embeds: [payload.embed],
      components: payload.components
    });

    activeChannels.set(message.channel.id, {
      messageId: sentMessage.id,
      doors: payload.doors,
      components: payload.components,
      embed: payload.embed,
      count: 0
    });
    return;
  }

  // B) CHAT DOOR UNLOCKING (e.g., typing "1", "7", "12" or "door 5")
  if (activeChannels.has(message.channel.id)) {
    const session = activeChannels.get(message.channel.id);

    // Check if the message is a number between 1 and 12 (or "door X")
    const doorMatch = content.match(/^(?:door\s*)?([1-9]|1[0-2])$/i);

    if (doorMatch) {
      if (!isAuthorized(message.member, message.author)) {
        return message.reply(`⛔ Only authorized hosts can open doors!`);
      }

      const doorNum = parseInt(doorMatch[1]);
      const doorIndex = doorNum - 1;

      const result = await processDoorUnlock(session, doorIndex, message.member, message.author);

      if (!result.success && result.reason === "ALREADY_OPEN") {
        return message.reply(`🚪 Door #${doorNum} has already been opened! Pick another.`);
      }

      // Update original hallway board message with newly disabled button
      try {
        const boardMsg = await message.channel.messages.fetch(session.messageId);
        if (boardMsg) await boardMsg.edit({ components: session.components });
      } catch (err) {
        console.log("Could not update board message visually:", err);
      }

      // Send the unlocked door result in channel
      await message.channel.send({ embeds: result.embeds });
      return;
    }

    // C) 15-MESSAGE AUTO-BUMP LOGIC
    session.count++;
    if (session.count >= 15) {
      session.count = 0;

      try {
        const oldMsg = await message.channel.messages.fetch(session.messageId);
        if (oldMsg) await oldMsg.delete();
      } catch (err) {
        console.log("Old hallway message already deleted or not found.");
      }

      const newMsg = await message.channel.send({
        embeds: [session.embed],
        components: session.components
      });

      session.messageId = newMsg.id;
    }
  }
});

// -------------------------------------------------------------
// 6. INTERACTION LISTENER (SLASH COMMANDS & BUTTONS)
// -------------------------------------------------------------
client.on('interactionCreate', async (interaction) => {

  // A) SLASH COMMAND HANDLING (/domain or /doors)
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
        fetchReply: true
      });

      activeChannels.set(interaction.channelId, {
        messageId: replyMessage.id,
        doors: payload.doors,
        components: payload.components,
        embed: payload.embed,
        count: 0
      });
    }
    return;
  }

// B) BUTTON CLICK HANDLING (DOORS)
  if (interaction.isButton()) {
    if (!isAuthorized(interaction.member, interaction.user)) {
      return interaction.reply({ 
        content: `⛔ Only authorized hosts can unseal doors!`, 
        ephemeral: true 
      });
    }

    // ⚡ DEFER REPLY: Tells Discord the bot is working (prevents 3-second timeout)
    await interaction.deferReply();

    const session = activeChannels.get(interaction.channelId);

    if (!session) {
      return interaction.followUp({ 
        content: "🎭 This hallway has faded into ancient history. Summon a new one with `/domain`!", 
        ephemeral: true 
      });
    }

    const doorIndex = parseInt(interaction.customId.split('_')[1]);
    const result = await processDoorUnlock(session, doorIndex, interaction.member, interaction.user);

    if (!result.success && result.reason === "ALREADY_OPEN") {
      return interaction.followUp({ 
        content: "🚪 This door has already been unsealed! Choose another.", 
        ephemeral: true 
      });
    }

    // Update current board message components
    try {
      await interaction.message.edit({ components: session.components });
    } catch (e) {
      console.log("Could not update board visually:", e);
    }

    // Send the reveal result
    await interaction.followUp({ embeds: result.embeds });
  }
});

client.login(BOT_TOKEN);
