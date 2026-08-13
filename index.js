// -------------------------------------------------------------
// 1. KEEP-ALIVE SERVER FOR RENDER
// -------------------------------------------------------------
const express = require('express');
const https = require('https');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('🍷 Dionysius is awake and watching!');
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on port ${PORT}`);
});

// -------------------------------------------------------------
// ⏰ SELF-PING LOGIC
// -------------------------------------------------------------
const APP_URL = process.env.RENDER_EXTERNAL_URL || "";

setInterval(() => {
  if (!APP_URL) return;

  https.get(APP_URL, (res) => {
    console.log(
      `⏰ Keep-alive ping sent to ${APP_URL} (Status: ${res.statusCode})`
    );
  }).on('error', (err) => {
    console.log(
      `⚠️ Keep-alive ping failed: ${err.message}`
    );
  });
}, 5 * 60 * 1000);


// -------------------------------------------------------------
// 2. DISCORD CLIENT SETUP
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


// -------------------------------------------------------------
// 🔐 BOT TOKEN
// -------------------------------------------------------------
const BOT_TOKEN =
  process.env.DISCORD_TOKEN || "PASTE_YOUR_BOT_TOKEN_HERE";


// -------------------------------------------------------------
// 👑 PERMISSIONS CONFIGURATION
// -------------------------------------------------------------
const OWNER_ID = "726748866023784490";

const BIRTHDAY_BOY_ID =
  "1363453807949779064";

const REQUIRED_ROLE_NAME =
  "HOST B";

const OLYMPIANS_ROLE_NAME =
  "OLYMPIAN";


// -------------------------------------------------------------
// 🔐 AUTHORIZATION
// -------------------------------------------------------------
function isAuthorized(member, user) {

  // Owner always has permission
  if (
    user &&
    user.id === OWNER_ID
  ) {
    return true;
  }

  // HOST B role
  if (
    member &&
    member.roles
  ) {

    return member.roles.cache.some(
      role =>
        role.name === REQUIRED_ROLE_NAME
    );

  }

  return false;
}


// -------------------------------------------------------------
// 3. ASSETS
// -------------------------------------------------------------
const ASSETS = {

  HALLWAY_IMAGE: path.join(
    __dirname,
    'assets',
    'hallway.png'
  ),

  // -----------------------------------------------------------
  // 💀 TRICKS
  // -----------------------------------------------------------
  TRICKS: [

    {
      nickname: "GRANPA CHASER 👴",

      image: null,

      gif: path.join(
        __dirname,
        'assets',
        'gif4.gif'
      )
    },

    {
      nickname: "FOSTER FAIL 🥀",

      image: path.join(
        __dirname,
        'assets',
        'img1.png'
      ),

      gif: path.join(
        __dirname,
        'assets',
        'gif5.gif'
      )
    },

    {
      nickname: "ROBERT CARTER FELONI",

      image: path.join(
        __dirname,
        'assets',
        'img2.png'
      ),

      gif: path.join(
        __dirname,
        'assets',
        'gif1.gif'
      )
    },

    {
      nickname: "Goblin Snack 🥒",

      image: path.join(
        __dirname,
        'assets',
        'img3.png'
      ),

      gif: path.join(
        __dirname,
        'assets',
        'gif7.gif'
      )
    },

    {
      nickname: "THE REAL RAG DOLL 🪆",

      image: null,

      gif: path.join(
        __dirname,
        'assets',
        'gif2.gif'
      )
    },

    {
      nickname: "Sir Shits-A-Lot",

      image: null,

      gif: path.join(
        __dirname,
        'assets',
        'gif3.webp'
      )
    }

  ]
};


// -------------------------------------------------------------
// 💬 RANDOM TRICK QUOTES
// -------------------------------------------------------------
const TRICK_QUOTES = [

  "Ah, exactly what I always wanted: absolute disappointment.",

  "Let me guess, the real prize is the friends we lost along the way?",

  "Oh, brilliant. Should I frame this or just cry now?",

  "Womp womp. Better luck next time, Champion!"

];


// -------------------------------------------------------------
// 🎉 GAMES
// -------------------------------------------------------------
const GAMES_LIST = [

  {
    name: "EMOJI STORY 🎭",

    description:
      "Tell a short story using **ONLY EMOJIS**. Vagg has to guess what happened!",

    image: null,

    gif: path.join(
      __dirname,
      'assets',
      'gif8.gif'
    )
  },

  {
    name: "HOW WELL DO YOU KNOW YOUR CLICK? 👥",

    description:
      "You have to answer questions about your click!",

    image: null,

    gif: path.join(
      __dirname,
      'assets',
      'gif9.gif'
    )
  },

  {
    name: "FACT OR FICTION? 📜",

    description:
      "WE TELL YOU A FACT AND YOU HAVE TO GUESS IF IT'S REAL OR NOT!",

    image: null,

    gif: path.join(
      __dirname,
      'assets',
      'gif10.webp'
    )
  },

  {
    name: "HOT SEAT 🔥",

    description:
      "You are on the Hot Seat! ANSWER THE QUESTION WITH THE FIRST PERSON WHO COMES TO MIND! IT'S HOT HOT🌡🛀🔥🌶",

    image: null,

    gif: path.join(
      __dirname,
      'assets',
      'gif11.webp'
    )
  },

  {
    name: "WHO SAID IT? 🗣️",

    description:
      "The host will show you a random out-of-context quote from the server history. Guess who said it!",

    image: null,

    gif: path.join(
      __dirname,
      'assets',
      'gif12.gif'
    )
  },

  {
    name: "WOULD YOU RATHER? 🤔",

    description:
      "Choose between two difficult or hilarious dilemmas and defend your choice!",

    image: null,

    gif: path.join(
      __dirname,
      'assets',
      'gif13.gif'
    )
  }

];


// -------------------------------------------------------------
// 🗂️ ACTIVE CHANNEL DATA
// -------------------------------------------------------------
const activeChannels = new Map();

const waitingForDoors = new Set();


// -------------------------------------------------------------
// 🍷 FIND OLYMPIAN ROLE
// -------------------------------------------------------------
function getOlympianRole(guild) {

  if (!guild) {
    return null;
  }

  return guild.roles.cache.find(
    role =>
      role.name === OLYMPIANS_ROLE_NAME
  ) || null;
}


// -------------------------------------------------------------
// 🍷 DIONYSIUS ARRIVAL
// -------------------------------------------------------------
function createDionysiusArrivalMessage(guild) {

  const olympianRole =
    getOlympianRole(guild);

  const content =
    olympianRole
      ? `<@&${olympianRole.id}>`
      : `🏛️ **OLYMPIAN**`;

  const embed =
    new EmbedBuilder()

      .setTitle(
        "🍷 DIONYSIUS HAS ARRIVED"
      )

      .setDescription(

        `The birthday chaos has officially begun. 😈\n\n` +

        `🎂 Born on the **12th**, so obviously I brought **12 doors**.\n\n` +

        `🎉 **6 games**\n` +
        `💀 **6 things I refuse to explain**\n\n` +

        `Now light it up. It’s my birthday, behave accordingly. 🕺🍇\n\n` +

        `🚪 **LET.THE.GAME.STARTS** 🚪`

      )

      .setColor("#800020")

      .setFooter({
        text: "Dionysius is watching..."
      });

  return {

    content,

    embeds: [
      embed
    ],

    allowedMentions:
      olympianRole
        ? {
            roles: [
              olympianRole.id
            ]
          }
        : {
            parse: []
          }

  };
}


// -------------------------------------------------------------
// 🚪 CREATE 12 DOORS
// -------------------------------------------------------------
function createHallwayPayload() {

  const doors = [];

  // Door 1
  doors[0] = {
    type: 'GAME',
    data: GAMES_LIST[0],
    used: false
  };

  // Door 2
  doors[1] = {
    type: 'GAME',
    data: GAMES_LIST[1],
    used: false
  };

  // Door 3
  doors[2] = {
    type: 'TRICK',
    data: ASSETS.TRICKS[0],
    used: false
  };

  // Door 4
  doors[3] = {
    type: 'GAME',
    data: GAMES_LIST[2],
    used: false
  };

  // Door 5
  doors[4] = {
    type: 'TRICK',
    data: ASSETS.TRICKS[1],
    used: false
  };

  // Door 6
  doors[5] = {
    type: 'TRICK',
    data: ASSETS.TRICKS[2],
    used: false
  };

  // Door 7
  doors[6] = {
    type: 'GAME',
    data: GAMES_LIST[3],
    used: false
  };

  // Door 8
  doors[7] = {
    type: 'TRICK',
    data: ASSETS.TRICKS[3],
    used: false
  };

  // Door 9
  doors[8] = {
    type: 'TRICK',
    data: ASSETS.TRICKS[4],
    used: false
  };

  // Door 10
  doors[9] = {
    type: 'GAME',
    data: GAMES_LIST[4],
    used: false
  };

  // Door 11
  doors[10] = {
    type: 'GAME',
    data: GAMES_LIST[5],
    used: false
  };

  // Door 12
  doors[11] = {
    type: 'TRICK',
    data: ASSETS.TRICKS[5],
    used: false
  };


  // -----------------------------------------------------------
  // HALLWAY IMAGE
  // -----------------------------------------------------------
  const hallwayAttachment =
    new AttachmentBuilder(
      ASSETS.HALLWAY_IMAGE
    );


  // -----------------------------------------------------------
  // HALLWAY EMBED
  // -----------------------------------------------------------
  const hallwayEmbed =
    new EmbedBuilder()

      .setTitle(
        "🍷 DOMAIN OF DIONYSIUS 🎭"
      )

      .setDescription(

        `Welcome to the Grand Hallway.\n\n` +

        `🎂 **12 August = 12 mysterious doors.**\n\n` +

        `*Choose your door wisely, mortal...*`

      )

      .setColor("#800020")

      .setImage(
        `attachment://${path.basename(
          ASSETS.HALLWAY_IMAGE
        )}`
      )

      .setFooter({
        text: "Dionysius is watching"
      });


  // -----------------------------------------------------------
  // BUTTON ROWS
  // -----------------------------------------------------------
  const row1 =
    new ActionRowBuilder();

  const row2 =
    new ActionRowBuilder();

  const row3 =
    new ActionRowBuilder();


  for (
    let i = 0;
    i < 12;
    i++
  ) {

    const button =
      new ButtonBuilder()

        .setCustomId(
          `door_${i}`
        )

        .setLabel(
          `Door ${i + 1}`
        )

        .setEmoji("🚪")

        .setStyle(
          ButtonStyle.Primary
        );


    if (i < 5) {

      row1.addComponents(
        button
      );

    } else if (i < 10) {

      row2.addComponents(
        button
      );

    } else {

      row3.addComponents(
        button
      );

    }

  }


  // -----------------------------------------------------------
  // LEAVE BUTTON
  // -----------------------------------------------------------
  const leaveButton =
    new ButtonBuilder()

      .setCustomId(
        'bot_leave'
      )

      .setLabel(
        'Leave / Stop'
      )

      .setEmoji('🍷')

      .setStyle(
        ButtonStyle.Danger
      );


  row3.addComponents(
    leaveButton
  );


  return {

    embed:
      hallwayEmbed,

    components: [
      row1,
      row2,
      row3
    ],

    doors,

    files: [
      hallwayAttachment
    ]

  };

}


// -------------------------------------------------------------
// 🚪 OPEN HALLWAY
// -------------------------------------------------------------
async function openHallway(channel) {

  const payload =
    createHallwayPayload();


  const hallwayMessage =
    await channel.send({

      content:
        `**THE DOORS ARE OPEN. LET THE CHAOS BEGIN.** 🚪`,

      embeds: [
        payload.embed
      ],

      components:
        payload.components,

      files:
        payload.files

    });


  activeChannels.set(
    channel.id,
    {

      messageId:
        hallwayMessage.id,

      doors:
        payload.doors,

      components:
        payload.components,

      embed:
        payload.embed,

      files:
        payload.files

    }
  );


  console.log(
    `🚪 The 12 doors have opened in channel ${channel.id}.`
  );


  return hallwayMessage;
}


// -------------------------------------------------------------
// 💀 CHANGE BIRTHDAY BOY NICKNAME
// -------------------------------------------------------------
//
// THIS IS THE IMPORTANT FIX.
//
// Returns:
//
// {
//   success: true,
//   oldNickname: "...",
//   nickname: "..."
// }
//
// OR:
//
// {
//   success: false,
//   reason: "..."
// }
//
// -------------------------------------------------------------
async function applyTrickNickname(
  guild,
  targetNickname
) {

  console.log(
    `🎭 Attempting to give Birthday Boy nickname: "${targetNickname}"`
  );


  // -----------------------------------------------------------
  // FIND MEMBER
  // -----------------------------------------------------------
  let targetMember = null;

  try {

    targetMember =
      await guild.members.fetch(
        BIRTHDAY_BOY_ID
      );

  } catch (err) {

    console.error(
      "❌ Could not fetch Birthday Boy:",
      err
    );

    return {
      success: false,
      reason:
        "Birthday Boy could not be found in this server."
    };

  }


  if (!targetMember) {

    return {
      success: false,
      reason:
        "Birthday Boy could not be found in this server."
    };

  }


  // -----------------------------------------------------------
  // FIND BOT MEMBER
  // -----------------------------------------------------------
  let botMember = null;

  try {

    botMember =
      await guild.members.fetchMe();

  } catch (err) {

    console.error(
      "❌ Could not fetch bot member:",
      err
    );

    return {
      success: false,
      reason:
        "Dionysius could not verify his own server permissions."
    };

  }


  // -----------------------------------------------------------
  // CHECK MANAGE NICKNAMES PERMISSION
  // -----------------------------------------------------------
  if (
    !botMember.permissions.has(
      "ManageNicknames"
    )
  ) {

    console.error(
      "❌ BOT IS MISSING MANAGE NICKNAMES PERMISSION."
    );

    return {
      success: false,
      reason:
        "Dionysius is missing the **Manage Nicknames** permission."
    };

  }


  // -----------------------------------------------------------
  // CHECK ROLE HIERARCHY
  // -----------------------------------------------------------
  if (
    !targetMember.manageable
  ) {

    console.error(
      "❌ TARGET IS NOT MANAGEABLE."
    );

    console.error(
      `Bot highest role: ${botMember.roles.highest.name} (${botMember.roles.highest.position})`
    );

    console.error(
      `Birthday Boy highest role: ${targetMember.roles.highest.name} (${targetMember.roles.highest.position})`
    );

    return {
      success: false,
      reason:
        `Dionysius cannot manage the Birthday Boy because the bot's highest role must be **above** the Birthday Boy's highest role. ` +
        `Bot role: **${botMember.roles.highest.name}** | ` +
        `Birthday Boy role: **${targetMember.roles.highest.name}**`
    };

  }


  // -----------------------------------------------------------
  // SAVE OLD NICKNAME
  // -----------------------------------------------------------
  const oldNickname =
    targetMember.nickname;


  // -----------------------------------------------------------
  // APPLY NEW NICKNAME
  // -----------------------------------------------------------
  try {

    await targetMember.setNickname(
      targetNickname,
      "Dionysius birthday trick"
    );


    console.log(
      `🎭 SUCCESS: ${targetMember.user.tag} is now "${targetNickname}"`
    );


    // ---------------------------------------------------------
    // RESTORE AFTER 5 MINUTES
    // ---------------------------------------------------------
    setTimeout(
      async () => {

        try {

          const freshMember =
            await guild.members.fetch(
              BIRTHDAY_BOY_ID
            );


          if (
            !freshMember.manageable
          ) {

            console.log(
              "⚠️ Could not restore nickname because target is no longer manageable."
            );

            return;

          }


          await freshMember.setNickname(
            oldNickname,
            "Dionysius trick expired"
          );


          console.log(
            `⏱️ Restored nickname for ${freshMember.user.tag}.`
          );

        } catch (err) {

          console.error(
            "❌ Failed to restore nickname:",
            err
          );

        }

      },
      5 * 60 * 1000
    );


    return {

      success: true,

      oldNickname,

      nickname:
        targetNickname,

      member:
        targetMember

    };

  } catch (err) {

    console.error(
      "❌ DISCORD REJECTED NICKNAME CHANGE:"
    );

    console.error(err);


    let reason =
      "Discord rejected the nickname change.";


    if (
      err &&
      err.code === 50013
    ) {

      reason =
        "Discord denied the nickname change. Check **Manage Nicknames** permission and bot role hierarchy.";

    }


    return {

      success: false,

      reason

    };

  }

}


// -------------------------------------------------------------
// CORE DOOR UNLOCK LOGIC
// -------------------------------------------------------------
async function processDoorUnlock(
  session,
  doorIndex,
  member,
  user
) {

  const selectedDoor =
    session.doors[doorIndex];


  if (
    !selectedDoor ||
    selectedDoor.used
  ) {

    return {

      success: false,

      reason:
        "ALREADY_OPEN"

    };

  }


  const embeds = [];

  const files = [];


  // ===========================================================
  // 🎉 GAME DOOR
  // ===========================================================
  if (
    selectedDoor.type === 'GAME'
  ) {

    const game =
      selectedDoor.data;


    const gameEmbed =
      new EmbedBuilder()

        .setTitle(
          `🎉 FESTIVITY REVEALED: Door #${doorIndex + 1}`
        )

        .setDescription(

          `The heavy marble door opens with a warm flash of light!\n\n` +

          `**Game:** __${game.name}__\n\n` +

          `📋 **Rules & Prompt:**\n${game.description}`

        )

        .setColor("#FFD700")

        .setFooter({
          text:
            "Let the festivities begin!"
        });


    // ---------------------------------------------------------
    // GAME IMAGE
    // ---------------------------------------------------------
    if (game.image) {

      const imgName =
        path.basename(
          game.image
        );


      gameEmbed.setImage(
        `attachment://${imgName}`
      );


      files.push(
        new AttachmentBuilder(
          game.image
        )
      );

    }


    embeds.push(
      gameEmbed
    );


    // ---------------------------------------------------------
    // GAME GIF
    // ---------------------------------------------------------
    if (game.gif) {

      const gifName =
        path.basename(
          game.gif
        );


      const gifEmbed =
        new EmbedBuilder()

          .setColor("#FFD700")

          .setImage(
            `attachment://${gifName}`
          );


      files.push(
        new AttachmentBuilder(
          game.gif
        )
      );


      embeds.push(
        gifEmbed
      );

    }

  }


  // ===========================================================
  // 💀 TRICK DOOR
  // ===========================================================
  else if (
    selectedDoor.type === 'TRICK'
  ) {

    const trickData =
      selectedDoor.data;


    const targetNickname =
      trickData.nickname;


    // ---------------------------------------------------------
    // FIND GUILD
    // ---------------------------------------------------------
    const guild =
      member.guild;


    // ---------------------------------------------------------
    // APPLY NICKNAME
    // ---------------------------------------------------------
    const nicknameResult =
      await applyTrickNickname(
        guild,
        targetNickname
      );


    const nickChanged =
      nicknameResult.success;


    // ---------------------------------------------------------
    // RANDOM QUOTE
    // ---------------------------------------------------------
    const randomQuote =
      TRICK_QUOTES[
        Math.floor(
          Math.random() *
          TRICK_QUOTES.length
        )
      ];


    // ---------------------------------------------------------
    // BIRTHDAY BOY MENTION
    // ---------------------------------------------------------
    const birthdayBoyMention =
      `<@${BIRTHDAY_BOY_ID}>`;


    // ---------------------------------------------------------
    // IDENTITY LINE
    // ---------------------------------------------------------
    //
    // SUCCESS:
    //
    // 🎭 New Identity: @BirthdayBoy is now known as NICKNAME
    //
    // FAILURE:
    //
    // 🎭 Nickname Failed: ...
    //
    // ---------------------------------------------------------
    let identityLine;


    if (nickChanged) {

      identityLine =
        `🎭 **New Identity:** ${birthdayBoyMention} is now known as **${targetNickname}** for 5 minutes!`;

    } else {

      identityLine =
        `🎭 **Nickname Failed:** Dionysius tried to rename ${birthdayBoyMention} to **${targetNickname}**, but Discord rejected it.\n\n` +
        `⚠️ ${nicknameResult.reason}`;

    }


    // ---------------------------------------------------------
    // TRICK EMBED
    // ---------------------------------------------------------
    const trickEmbed =
      new EmbedBuilder()

        .setTitle(
          `💀 YOU'VE BEEN TRICKED! HAHAHA! (Door #${doorIndex + 1})`
        )

        .setDescription(

          `A dark door was opened and Dionysius targeted the Birthday Boy!\n\n` +

          `💬 *"${randomQuote}"*\n\n` +

          `🎂 **Victim:** ${birthdayBoyMention}\n\n` +

          identityLine

        )

        .setColor("#FF0000");


    // ---------------------------------------------------------
    // TRICK IMAGE
    // ---------------------------------------------------------
    if (
      trickData.image
    ) {

      const imgName =
        path.basename(
          trickData.image
        );


      trickEmbed.setImage(
        `attachment://${imgName}`
      );


      files.push(
        new AttachmentBuilder(
          trickData.image
        )
      );

    }


    // ---------------------------------------------------------
    // TRICK GIF
    // ---------------------------------------------------------
    if (
      trickData.gif
    ) {

      const gifName =
        path.basename(
          trickData.gif
        );


      const gifEmbed =
        new EmbedBuilder()

          .setColor("#FF0000")

          .setImage(
            `attachment://${gifName}`
          );


      files.push(
        new AttachmentBuilder(
          trickData.gif
        )
      );


      embeds.push(
        gifEmbed
      );

    }


    embeds.unshift(
      trickEmbed
    );

  }


  // -----------------------------------------------------------
  // MARK DOOR AS USED
  // -----------------------------------------------------------
  selectedDoor.used =
    true;


  // -----------------------------------------------------------
  // DISABLE THE DOOR BUTTON
  // -----------------------------------------------------------
  session.components =
    session.components.map(
      row => {

        const newRow =
          ActionRowBuilder.from(
            row
          );


        newRow.components.forEach(
          button => {

            if (
              button.data.custom_id ===
              `door_${doorIndex}`
            ) {

              button.setDisabled(
                true
              );


              button.setLabel(
                `Opened (${doorIndex + 1})`
              );


              button.setStyle(

                selectedDoor.type === 'TRICK'
                  ? ButtonStyle.Danger
                  : ButtonStyle.Success

              );

            }

          }
        );


        return newRow;

      }
    );


  return {

    success: true,

    embeds,

    files

  };

}


// -------------------------------------------------------------
// 4. BOT READY
// -------------------------------------------------------------
client.once(
  'ready',
  async () => {

    console.log(
      `🍷 Dionysius has awakened as ${client.user.tag}!`
    );


    try {

      const commands = [

        {
          name: 'domain',

          description:
            'Summon Dionysius and prepare the 12 Doors!'
        },

        {
          name: 'doors',

          description:
            'Immediately open the 12 Doors!'
        },

        {
          name: 'leave',

          description:
            'Make Dionysius retreat and seal the doors.'
        }

      ];


      await client.application.commands.set(
        commands
      );


      console.log(
        "✅ Registered /domain, /doors, and /leave!"
      );

    } catch (err) {

      console.error(
        "❌ Failed to register slash commands:",
        err
      );

    }

  }
);


// -------------------------------------------------------------
// 5. MESSAGE LISTENER
// -------------------------------------------------------------
client.on(
  'messageCreate',
  async (message) => {

    // ---------------------------------------------------------
    // IGNORE BOTS
    // ---------------------------------------------------------
    if (
      message.author.bot
    ) {
      return;
    }


    const trimmed =
      message.content.trim();


    // =========================================================
    // 🚪 FLEXIBLE OPEN DOORS COMMAND
    // =========================================================
    const doorCommand =
      trimmed
        .toLowerCase()
        .replace(
          /[^\p{L}\p{N}\s]/gu,
          ""
        )
        .replace(
          /\s+/g,
          " "
        )
        .trim();


    const isDoorCommand =
      doorCommand ===
      "open the doors dionysius";


    // =========================================================
    // OPEN THE DOORS
    // =========================================================
    if (
      isDoorCommand &&
      waitingForDoors.has(
        message.channelId
      )
    ) {

      // -------------------------------------------------------
      // AUTHORIZATION
      // -------------------------------------------------------
      if (
        !isAuthorized(
          message.member,
          message.author
        )
      ) {

        return message.reply({

          content:
            `⛔ Only authorized hosts can command Dionysius!`

        }).catch(
          () => {}
        );

      }


      waitingForDoors.delete(
        message.channelId
      );


      try {

        await openHallway(
          message.channel
        );

      } catch (err) {

        console.error(
          "❌ Failed to open the doors:",
          err
        );


        waitingForDoors.add(
          message.channelId
        );


        await message.channel.send({

          content:
            `⚠️ Dionysius tripped over the doors. 😭\n` +
            `Try **OPEN THE DOORS DIONYSIUS** again.`

        }).catch(
          () => {}
        );

      }


      return;

    }


    // =========================================================
    // 🔢 OPEN DOOR BY NUMBER
    // =========================================================
    const doorNum =
      parseInt(
        trimmed
      );


    if (
      isNaN(doorNum) ||
      doorNum < 1 ||
      doorNum > 12
    ) {

      return;

    }


    // ---------------------------------------------------------
    // AUTHORIZATION
    // ---------------------------------------------------------
    if (
      !isAuthorized(
        message.member,
        message.author
      )
    ) {

      return message.reply({

        content:
          `⛔ Only authorized hosts can unseal doors!`

      }).catch(
        () => {}
      );

    }


    // ---------------------------------------------------------
    // GET SESSION
    // ---------------------------------------------------------
    const session =
      activeChannels.get(
        message.channelId
      );


    if (!session) {

      return message.reply({

        content:
          `⚠️ No active hallway in this channel!\n` +
          `Use **/domain** or **/doors** first.`

      }).catch(
        () => {}
      );

    }


    const doorIndex =
      doorNum - 1;


    const selectedDoor =
      session.doors[doorIndex];


    if (
      !selectedDoor
    ) {

      return message.reply({

        content:
          `⚠️ That door doesn't exist.`

      }).catch(
        () => {}
      );

    }


    // ---------------------------------------------------------
    // ALREADY OPEN
    // ---------------------------------------------------------
    if (
      selectedDoor.used
    ) {

      return message.reply({

        content:
          `🚪 Door #${doorNum} has already been unsealed! Choose another.`

      }).catch(
        () => {}
      );

    }


    // ---------------------------------------------------------
    // PROCESS
    // ---------------------------------------------------------
    try {

      const result =
        await processDoorUnlock(
          session,
          doorIndex,
          message.member,
          message.author
        );


      if (
        !result.success
      ) {

        return message.reply({

          content:
            `⚠️ Could not open this door.`

        }).catch(
          () => {}
        );

      }


      // -------------------------------------------------------
      // UPDATE HALLWAY BUTTONS
      // -------------------------------------------------------
      try {

        const hallwayMsg =
          await message.channel.messages.fetch(
            session.messageId
          );


        await hallwayMsg.edit({

          components:
            session.components

        });

      } catch (err) {

        console.log(
          "⚠️ Could not update hallway buttons:",
          err
        );

      }


      // -------------------------------------------------------
      // SEND RESULT
      // -------------------------------------------------------
      await message.channel.send({

        embeds:
          result.embeds,

        files:
          result.files,

        allowedMentions: {

          users: [
            BIRTHDAY_BOY_ID
          ]

        }

      });

    } catch (err) {

      console.error(
        `❌ Error opening Door #${doorNum}:`,
        err
      );


      return message.reply({

        content:
          `⚠️ Dionysius encountered an error while opening Door #${doorNum}. Check the Render logs.`

      }).catch(
        () => {}
      );

    }

  }
);


// -------------------------------------------------------------
// 6. INTERACTION LISTENER
// -------------------------------------------------------------
client.on(
  'interactionCreate',
  async (interaction) => {

    // =========================================================
    // SLASH COMMANDS
    // =========================================================
    if (
      interaction.isChatInputCommand()
    ) {

      // =======================================================
      // /DOMAIN
      // =======================================================
      if (
        interaction.commandName ===
        'domain'
      ) {

        if (
          !isAuthorized(
            interaction.member,
            interaction.user
          )
        ) {

          return interaction.reply({

            content:
              `⛔ You do not have permission to control Dionysius!`,

            ephemeral: true

          });

        }


        activeChannels.delete(
          interaction.channelId
        );


        waitingForDoors.add(
          interaction.channelId
        );


        const arrivalMessage =
          createDionysiusArrivalMessage(
            interaction.guild
          );


        await interaction.reply(
          arrivalMessage
        );


        console.log(
          `🍷 Dionysius arrived in ${interaction.channelId}.`
        );


        return;

      }


      // =======================================================
      // /DOORS
      // =======================================================
      if (
        interaction.commandName ===
        'doors'
      ) {

        if (
          !isAuthorized(
            interaction.member,
            interaction.user
          )
        ) {

          return interaction.reply({

            content:
              `⛔ You do not have permission to control Dionysius!`,

            ephemeral: true

          });

        }


        waitingForDoors.delete(
          interaction.channelId
        );


        activeChannels.delete(
          interaction.channelId
        );


        await interaction.deferReply();


        try {

          await openHallway(
            interaction.channel
          );


          await interaction.deleteReply()
            .catch(
              () => {}
            );

        } catch (err) {

          console.error(
            "❌ Failed to open hallway:",
            err
          );


          return interaction.editReply({

            content:
              `⚠️ Dionysius couldn't open the doors. 😭`

          });

        }


        return;

      }


      // =======================================================
      // /LEAVE
      // =======================================================
      if (
        interaction.commandName ===
        'leave'
      ) {

        if (
          !isAuthorized(
            interaction.member,
            interaction.user
          )
        ) {

          return interaction.reply({

            content:
              `⛔ You do not have permission to control Dionysius!`,

            ephemeral: true

          });

        }


        activeChannels.clear();

        waitingForDoors.clear();


        return interaction.reply({

          content:
            `🍷 **Dionysius has retreated!**\n\n` +
            `The doors are sealed, the wine has been confiscated, ` +
            `and the party has been placed on divine lockdown. 😭🍷`

        });

      }


      return;

    }


    // =========================================================
    // 🚪 BUTTON INTERACTIONS
    // =========================================================
    if (
      interaction.isButton()
    ) {

      // -------------------------------------------------------
      // AUTHORIZATION
      // -------------------------------------------------------
      if (
        !isAuthorized(
          interaction.member,
          interaction.user
        )
      ) {

        return interaction.reply({

          content:
            `⛔ Only authorized hosts can unseal doors!`,

          ephemeral: true

        });

      }


      // =======================================================
      // LEAVE BUTTON
      // =======================================================
      if (
        interaction.customId ===
        'bot_leave'
      ) {

        activeChannels.delete(
          interaction.channelId
        );


        waitingForDoors.delete(
          interaction.channelId
        );


        return interaction.update({

          content:
            `🍷 **Dionysius has retreated!**\n\n` +
            `The doors are sealed. The chaos is temporarily contained. 😈`,

          embeds: [],

          components: []

        });

      }


      // -------------------------------------------------------
      // DEFER
      // -------------------------------------------------------
      await interaction
        .deferUpdate()
        .catch(
          () => {}
        );


      // -------------------------------------------------------
      // SESSION
      // -------------------------------------------------------
      const session =
        activeChannels.get(
          interaction.channelId
        );


      if (!session) {

        return interaction.followUp({

          content:
            `⚠️ There is no active hallway right now.`,

          ephemeral: true

        });

      }


      // -------------------------------------------------------
      // DOOR INDEX
      // -------------------------------------------------------
      const doorIndex =
        parseInt(
          interaction.customId
            .split('_')[1]
        );


      if (
        isNaN(doorIndex) ||
        doorIndex < 0 ||
        doorIndex > 11
      ) {

        return interaction.followUp({

          content:
            `⚠️ Invalid door.`,

          ephemeral: true

        });

      }


      const selectedDoor =
        session.doors[doorIndex];


      // -------------------------------------------------------
      // ALREADY OPEN
      // -------------------------------------------------------
      if (
        selectedDoor.used
      ) {

        return interaction.followUp({

          content:
            `🚪 This door has already been unsealed! Choose another.`,

          ephemeral: true

        });

      }


      // -------------------------------------------------------
      // PROCESS DOOR
      // -------------------------------------------------------
      try {

        const result =
          await processDoorUnlock(
            session,
            doorIndex,
            interaction.member,
            interaction.user
          );


        if (
          !result.success
        ) {

          return interaction.followUp({

            content:
              `⚠️ Could not open this door.`,

            ephemeral: true

          });

        }


        // -----------------------------------------------------
        // UPDATE HALLWAY BUTTONS
        // -----------------------------------------------------
        await interaction.message.edit({

          components:
            session.components

        });


        // -----------------------------------------------------
        // SEND RESULT
        // -----------------------------------------------------
        await interaction.followUp({

          embeds:
            result.embeds,

          files:
            result.files,

          allowedMentions: {

            users: [
              BIRTHDAY_BOY_ID
            ]

          }

        });

      } catch (err) {

        console.error(
          `❌ Error opening Door #${doorIndex + 1}:`,
          err
        );


        return interaction.followUp({

          content:
            `⚠️ Dionysius encountered an error while opening Door #${doorIndex + 1}. Check the Render logs.`,

          ephemeral: true

        });

      }

    }

  }
);


// -------------------------------------------------------------
// 7. LOGIN
// -------------------------------------------------------------
client.login(
  BOT_TOKEN
);
