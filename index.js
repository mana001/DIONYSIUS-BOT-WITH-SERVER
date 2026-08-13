// -------------------------------------------------------------
// 1. KEEP-ALIVE SERVER FOR RENDER (WITH SELF-PINGING)
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

// ⏰ SELF-PING LOGIC
const APP_URL = process.env.RENDER_EXTERNAL_URL || "";

setInterval(() => {
  if (APP_URL) {
    https.get(APP_URL, (res) => {
      console.log(
        `⏰ Keep-alive ping sent to ${APP_URL} (Status: ${res.statusCode})`
      );
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


// -------------------------------------------------------------
// 🔐 BOT TOKEN
// -------------------------------------------------------------
const BOT_TOKEN =
  process.env.DISCORD_TOKEN || "PASTE_YOUR_BOT_TOKEN_HERE";


// -------------------------------------------------------------
// 👑 PERMISSIONS CONFIGURATION
// -------------------------------------------------------------
const OWNER_ID = "726748866023784490";
const BIRTHDAY_BOY_ID = "726748866023784490";
const REQUIRED_ROLE_NAME = "HOST B";

// 🏛️ ROLE NAME TO TAG
const OLYMPIANS_ROLE_NAME = "OLYMPIAN";

function isAuthorized(member, user) {

  // Owner always has permission
  if (user && user.id === OWNER_ID) {
    return true;
  }

  // HOST B role has permission
  if (member && member.roles) {
    return member.roles.cache.some(
      role => role.name === REQUIRED_ROLE_NAME
    );
  }

  return false;
}


// -------------------------------------------------------------
// 3. LOCAL ASSETS & GAME DATA
// 6 GAMES + 6 TRICKS = 12 DOORS
// -------------------------------------------------------------
const ASSETS = {

  HALLWAY_IMAGE: path.join(
    __dirname,
    'assets',
    'hallway.png'
  ),

  // -----------------------------------------------------------
  // 💀 6 TRICKS
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
// 📋 6 GAMES
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

// Channels where /domain has been used
// and Dionysius is waiting for the door phrase
const waitingForDoors = new Set();


// -------------------------------------------------------------
// 🍷 FIND THE OLYMPIAN ROLE
// -------------------------------------------------------------
function getOlympianRole(guild) {

  if (!guild) {
    return null;
  }

  return guild.roles.cache.find(
    role => role.name === OLYMPIANS_ROLE_NAME
  ) || null;
}


// -------------------------------------------------------------
// 🍷 DIONYSIUS ARRIVAL MESSAGE
// -------------------------------------------------------------
function createDionysiusArrivalMessage(guild) {

  const olympianRole = getOlympianRole(guild);

  const content = olympianRole
    ? `<@&${olympianRole.id}>`
    : `🏛️ **OLYMPIAN**`;

  const embed = new EmbedBuilder()

    .setTitle("🍷 DIONYSIUS HAS ARRIVED")

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

    allowedMentions: olympianRole
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
// 🚪 CREATE THE 12-DOOR HALLWAY
// -------------------------------------------------------------
function createHallwayPayload() {

  const doors = [];


  // -----------------------------------------------------------
  // DOOR 1
  // -----------------------------------------------------------
  doors[0] = {
    type: 'GAME',
    data: GAMES_LIST[0],
    used: false
  };


  // -----------------------------------------------------------
  // DOOR 2
  // -----------------------------------------------------------
  doors[1] = {
    type: 'GAME',
    data: GAMES_LIST[1],
    used: false
  };


  // -----------------------------------------------------------
  // DOOR 3
  // -----------------------------------------------------------
  doors[2] = {
    type: 'TRICK',
    data: ASSETS.TRICKS[0],
    used: false
  };


  // -----------------------------------------------------------
  // DOOR 4
  // -----------------------------------------------------------
  doors[3] = {
    type: 'GAME',
    data: GAMES_LIST[2],
    used: false
  };


  // -----------------------------------------------------------
  // DOOR 5
  // -----------------------------------------------------------
  doors[4] = {
    type: 'TRICK',
    data: ASSETS.TRICKS[1],
    used: false
  };


  // -----------------------------------------------------------
  // DOOR 6
  // -----------------------------------------------------------
  doors[5] = {
    type: 'TRICK',
    data: ASSETS.TRICKS[2],
    used: false
  };


  // -----------------------------------------------------------
  // DOOR 7
  // -----------------------------------------------------------
  doors[6] = {
    type: 'GAME',
    data: GAMES_LIST[3],
    used: false
  };


  // -----------------------------------------------------------
  // DOOR 8
  // -----------------------------------------------------------
  doors[7] = {
    type: 'TRICK',
    data: ASSETS.TRICKS[3],
    used: false
  };


  // -----------------------------------------------------------
  // DOOR 9
  // -----------------------------------------------------------
  doors[8] = {
    type: 'TRICK',
    data: ASSETS.TRICKS[4],
    used: false
  };


  // -----------------------------------------------------------
  // DOOR 10
  // -----------------------------------------------------------
  doors[9] = {
    type: 'GAME',
    data: GAMES_LIST[4],
    used: false
  };


  // -----------------------------------------------------------
  // DOOR 11
  // -----------------------------------------------------------
  doors[10] = {
    type: 'GAME',
    data: GAMES_LIST[5],
    used: false
  };


  // -----------------------------------------------------------
  // DOOR 12
  // -----------------------------------------------------------
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
  const hallwayEmbed = new EmbedBuilder()

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
  const row1 = new ActionRowBuilder();
  const row2 = new ActionRowBuilder();
  const row3 = new ActionRowBuilder();


  for (let i = 0; i < 12; i++) {

    const button = new ButtonBuilder()

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

      row1.addComponents(button);

    } else if (i < 10) {

      row2.addComponents(button);

    } else {

      row3.addComponents(button);

    }

  }


  // -----------------------------------------------------------
  // 🍷 LEAVE BUTTON
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

    embed: hallwayEmbed,

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


  if (selectedDoor.used) {

    return {
      success: false,
      reason: "ALREADY_OPEN"
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
          text: "Let the festivities begin!"
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


    // ---------------------------------------------------------
    // NICKNAME FROM THE TRICK DATA
    // ---------------------------------------------------------
    const targetNickname =
      trickData.nickname;


    const guild =
      member.guild;


    let targetMember =
      null;


    let nickChanged =
      false;


    let oldNickname =
      null;


    // ---------------------------------------------------------
    // FIND BIRTHDAY BOY
    // ---------------------------------------------------------
    try {

      targetMember =
        await guild.members
          .fetch(
            BIRTHDAY_BOY_ID
          )
          .catch(
            () => null
          );

    } catch (e) {

      console.log(
        "Could not fetch user by ID:",
        e
      );

    }


    // ---------------------------------------------------------
    // CHANGE BIRTHDAY BOY NICKNAME
    // ---------------------------------------------------------
    if (targetMember) {

      try {

        if (targetMember.manageable) {

          oldNickname =
            targetMember.nickname;


          await targetMember.setNickname(
            targetNickname
          );


          nickChanged =
            true;


          // ---------------------------------------------------
          // REVERT AFTER 5 MINUTES
          // ---------------------------------------------------
          setTimeout(
            async () => {

              try {

                const freshMember =
                  await guild.members
                    .fetch(
                      BIRTHDAY_BOY_ID
                    )
                    .catch(
                      () => null
                    );


                if (
                  freshMember &&
                  freshMember.manageable
                ) {

                  await freshMember.setNickname(
                    oldNickname
                  );


                  console.log(
                    `⏱️ Reverted nickname for ${freshMember.user.tag}.`
                  );

                }

              } catch (revertErr) {

                console.log(
                  "Failed to revert nickname:",
                  revertErr
                );

              }

            },
            5 * 60 * 1000
          );

        } else {

          console.log(
            "❌ Target member is not manageable."
          );

        }

      } catch (err) {

        console.log(
          "Failed to change nickname:",
          err
        );

      }

    }


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
    // 🎂 BIRTHDAY BOY MENTION
    // ---------------------------------------------------------
    const birthdayBoyMention =
      `<@${BIRTHDAY_BOY_ID}>`;


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

          `🎂 **Victim:** ${
            targetMember
              ? birthdayBoyMention
              : "Birthday Boy ID not found!"
          }\n\n` +

          (

            nickChanged

              ? `🎭 **New Identity:** ${birthdayBoyMention} is now known as **${targetNickname}** for 5 minutes!`

              : `🎭 **Fate:** Dionysius laughs at your foolishness!`

          )

        )

        .setColor("#FF0000");


    // ---------------------------------------------------------
    // ALLOW DISCORD TO MENTION BIRTHDAY BOY
    // ---------------------------------------------------------
    // This is important because the embed contains <@ID>.
    // ---------------------------------------------------------


    // ---------------------------------------------------------
    // TRICK IMAGE
    // ---------------------------------------------------------
    if (trickData.image) {

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
    if (trickData.gif) {

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
  // DISABLE THAT BUTTON
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
// 4. BOT READY EVENT
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
        "Failed to register slash commands:",
        err
      );

    }

  }
);


// -------------------------------------------------------------
// 5. CHAT INPUT LISTENER
// -------------------------------------------------------------
//
// Handles:
//
// OPEN THE DOORS DIONYSIUS
// open the doors dionysius
// OPEN THE DOORS DIONYSIUS 🚪
// OPEN THE DOORS DIONYSIUS 🍷
// OPEN THE DOORS DIONYSIUS!!!
// Open the doors Dionysius 🚪🍷
//
// AND:
//
// 1
// 2
// 3
// ...
// 12
//
// Only authorized hosts can use these.
// -------------------------------------------------------------
client.on(
  'messageCreate',
  async (message) => {

    // ---------------------------------------------------------
    // IGNORE BOT MESSAGES
    // ---------------------------------------------------------
    if (message.author.bot) {
      return;
    }


    const trimmed =
      message.content.trim();


    // =========================================================
    // 🚪 FLEXIBLE DOOR COMMAND
    // =========================================================
    //
    // Converts:
    //
    // OPEN THE DOORS DIONYSIUS 🚪🍷!!!
    //
    // into:
    //
    // open the doors dionysius
    //
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


      // -------------------------------------------------------
      // REMOVE WAITING STATUS
      // -------------------------------------------------------
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


        // -----------------------------------------------------
        // ALLOW RETRY
        // -----------------------------------------------------
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
    // GET ACTIVE HALLWAY
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
    // PROCESS DOOR
    // ---------------------------------------------------------
    try {

      const result =
        await processDoorUnlock(
          session,
          doorIndex,
          message.member,
          message.author
        );


      if (!result.success) {

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

      } catch (e) {

        console.log(
          "Could not update hallway buttons:",
          e
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
          `⚠️ Render failed while opening Door #${doorNum}. Please try again!`

      }).catch(
        () => {}
      );

    }

  }
);


// -------------------------------------------------------------
// 6. INTERACTION LISTENER
// Slash Commands & Buttons
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
      // 🍷 /DOMAIN
      //
      // 1. Tags OLYMPIAN
      // 2. Announces Dionysius
      // 3. WAITS for the flexible door phrase
      // =======================================================
      if (
        interaction.commandName ===
        'domain'
      ) {


        // -----------------------------------------------------
        // AUTHORIZATION
        // -----------------------------------------------------
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


        // -----------------------------------------------------
        // CLEAR OLD HALLWAY
        // -----------------------------------------------------
        activeChannels.delete(
          interaction.channelId
        );


        // -----------------------------------------------------
        // SET WAITING MODE
        // -----------------------------------------------------
        waitingForDoors.add(
          interaction.channelId
        );


        // -----------------------------------------------------
        // CREATE ARRIVAL MESSAGE
        // -----------------------------------------------------
        const arrivalMessage =
          createDionysiusArrivalMessage(
            interaction.guild
          );


        // -----------------------------------------------------
        // SEND ARRIVAL
        // -----------------------------------------------------
        await interaction.reply(
          arrivalMessage
        );


        console.log(
          `🍷 Dionysius arrived in ${interaction.channelId}.`
        );


        return;

      }


      // =======================================================
      // 🚪 /DOORS
      //
      // IMMEDIATELY OPENS THE DOORS
      // =======================================================
      if (
        interaction.commandName ===
        'doors'
      ) {


        // -----------------------------------------------------
        // AUTHORIZATION
        // -----------------------------------------------------
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


        // -----------------------------------------------------
        // REMOVE WAITING STATUS
        // -----------------------------------------------------
        waitingForDoors.delete(
          interaction.channelId
        );


        // -----------------------------------------------------
        // CLEAR OLD HALLWAY
        // -----------------------------------------------------
        activeChannels.delete(
          interaction.channelId
        );


        // -----------------------------------------------------
        // ACKNOWLEDGE COMMAND
        // -----------------------------------------------------
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
      // 🍷 /LEAVE
      // =======================================================
      if (
        interaction.commandName ===
        'leave'
      ) {


        // -----------------------------------------------------
        // AUTHORIZATION
        // -----------------------------------------------------
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


        // -----------------------------------------------------
        // CLEAR EVERYTHING
        // -----------------------------------------------------
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
      // 🍷 LEAVE / STOP BUTTON
      // =======================================================
      if (
        interaction.customId ===
        'bot_leave'
      ) {


        // -----------------------------------------------------
        // CLEAR ACTIVE HALLWAY
        // -----------------------------------------------------
        activeChannels.delete(
          interaction.channelId
        );


        // -----------------------------------------------------
        // CLEAR WAITING STATUS
        // -----------------------------------------------------
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
      // DEFER BUTTON UPDATE
      // -------------------------------------------------------
      await interaction
        .deferUpdate()
        .catch(
          () => {}
        );


      // -------------------------------------------------------
      // FIND ACTIVE SESSION
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
      // GET DOOR NUMBER
      // -------------------------------------------------------
      const doorIndex =
        parseInt(
          interaction.customId
            .split('_')[1]
        );


      // -------------------------------------------------------
      // SAFETY CHECK
      // -------------------------------------------------------
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


        if (!result.success) {

          return interaction.followUp({

            content:
              `⚠️ Could not open this door.`,

            ephemeral: true

          });

        }


        // -----------------------------------------------------
        // UPDATE BUTTONS
        // -----------------------------------------------------
        await interaction.message.edit({

          components:
            session.components

        });


        // -----------------------------------------------------
        // SHOW RESULT
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
            `⚠️ Render lagged while opening Door #${doorIndex + 1}. ` +
            `The door remains available — try again!`,

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
