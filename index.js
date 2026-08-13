// -------------------------------------------------------------
// 🍷 DIONYSIUS BIRTHDAY CHAOS BOT
// -------------------------------------------------------------
// 12 DOORS
// 6 GAMES
// 6 TRICKS
//
// Trick doors:
// - Find the Birthday Boy
// - Assign the nickname belonging to that exact trick
// - Display the New Identity in the result
// - Revert nickname after 5 minutes
//
// Commands:
// /domain  -> Dionysius arrives and waits for the door phrase
// /doors   -> Immediately opens the 12 doors
// /leave   -> Closes the active hallway
//
// Chat commands:
// OPEN THE DOORS DIONYSIUS
// 1 through 12
// -------------------------------------------------------------


// -------------------------------------------------------------
// 1. KEEP-ALIVE SERVER FOR RENDER
// -------------------------------------------------------------
const express = require('express');
const https = require('https');
const path = require('path');

const app = express();

const PORT =
  process.env.PORT || 3000;

app.get(
  '/',
  (req, res) => {

    res.send(
      '🍷 Dionysius is awake and watching!'
    );

  }
);

app.listen(
  PORT,
  '0.0.0.0',
  () => {

    console.log(
      `Server listening on port ${PORT}`
    );

  }
);


// -------------------------------------------------------------
// ⏰ RENDER SELF-PING
// -------------------------------------------------------------
const APP_URL =
  process.env.RENDER_EXTERNAL_URL || "";

setInterval(
  () => {

    if (!APP_URL) {
      return;
    }

    https
      .get(
        APP_URL,
        (res) => {

          console.log(
            `⏰ Keep-alive ping sent to ${APP_URL} ` +
            `(Status: ${res.statusCode})`
          );

        }
      )
      .on(
        'error',
        (err) => {

          console.log(
            `⚠️ Keep-alive ping failed: ${err.message}`
          );

        }
      );

  },
  5 * 60 * 1000
);


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


const client =
  new Client({

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
// Put your actual token in Render:
//
// DISCORD_TOKEN = your_token
//
// DO NOT put the real token directly in this file.
// -------------------------------------------------------------
const BOT_TOKEN =
  process.env.DISCORD_TOKEN ||
  "PASTE_YOUR_BOT_TOKEN_HERE";


// -------------------------------------------------------------
// 3. PERMISSIONS CONFIGURATION
// -------------------------------------------------------------

const OWNER_ID =
  "726748866023784490";


const BIRTHDAY_BOY_ID =
  "1082430344936042606";


const REQUIRED_ROLE_NAME =
  "HOST B";


const OLYMPIANS_ROLE_NAME =
  "OLYMPIAN";


// -------------------------------------------------------------
// 🔐 AUTHORIZATION CHECK
// -------------------------------------------------------------
function isAuthorized(
  member,
  user
) {

  // Owner always has permission
  if (
    user &&
    user.id === OWNER_ID
  ) {

    return true;

  }


  // HOST B role has permission
  if (
    member &&
    member.roles
  ) {

    return member.roles.cache.some(
      role =>
        role.name ===
        REQUIRED_ROLE_NAME
    );

  }


  return false;

}


// -------------------------------------------------------------
// 4. ASSETS & GAME DATA
// -------------------------------------------------------------
//
// 6 GAMES + 6 TRICKS = 12 DOORS
// -------------------------------------------------------------

const ASSETS = {

  HALLWAY_IMAGE:
    path.join(
      __dirname,
      'assets',
      'hallway.png'
    ),


  // -----------------------------------------------------------
  // 💀 6 TRICKS
  // -----------------------------------------------------------
  TRICKS: [

    {
      nickname:
        "GRANPA CHASER 👴",

      image:
        null,

      gif:
        path.join(
          __dirname,
          'assets',
          'gif4.gif'
        )
    },


    {
      nickname:
        "FOSTER FAIL 🥀",

      image:
        path.join(
          __dirname,
          'assets',
          'img1.png'
        ),

      gif:
        path.join(
          __dirname,
          'assets',
          'gif5.gif'
        )
    },


    {
      nickname:
        "ROBERT CARTER FELONI",

      image:
        path.join(
          __dirname,
          'assets',
          'img2.png'
        ),

      gif:
        path.join(
          __dirname,
          'assets',
          'gif1.gif'
        )
    },


    {
      nickname:
        "Goblin Snack 🥒",

      image:
        path.join(
          __dirname,
          'assets',
          'img3.png'
        ),

      gif:
        path.join(
          __dirname,
          'assets',
          'gif7.gif'
        )
    },


    {
      nickname:
        "THE REAL RAG DOLL 🪆",

      image:
        null,

      gif:
        path.join(
          __dirname,
          'assets',
          'gif2.gif'
        )
    },


    {
      nickname:
        "Sir Shits-A-Lot",

      image:
        null,

      gif:
        path.join(
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
    name:
      "EMOJI STORY 🎭",

    description:
      "Tell a short story using **ONLY EMOJIS**. Vagg has to guess what happened!",

    image:
      null,

    gif:
      path.join(
        __dirname,
        'assets',
        'gif8.gif'
      )
  },


  {
    name:
      "HOW WELL DO YOU KNOW YOUR CLICK? 👥",

    description:
      "You have to answer questions about your click!",

    image:
      null,

    gif:
      path.join(
        __dirname,
        'assets',
        'gif9.gif'
      )
  },


  {
    name:
      "FACT OR FICTION? 📜",

    description:
      "WE TELL YOU A FACT AND YOU HAVE TO GUESS IF IT'S REAL OR NOT!",

    image:
      null,

    gif:
      path.join(
        __dirname,
        'assets',
        'gif10.webp'
      )
  },


  {
    name:
      "HOT SEAT 🔥",

    description:
      "You are on the Hot Seat! ANSWER THE QUESTION WITH THE FIRST PERSON WHO COMES TO MIND! IT'S HOT HOT🌡🛀🔥🌶",

    image:
      null,

    gif:
      path.join(
        __dirname,
        'assets',
        'gif11.webp'
      )
  },


  {
    name:
      "WHO SAID IT? 🗣️",

    description:
      "The host will show you a random out-of-context quote from the server history. Guess who said it!",

    image:
      null,

    gif:
      path.join(
        __dirname,
        'assets',
        'gif12.gif'
      )
  },


  {
    name:
      "WOULD YOU RATHER? 🤔",

    description:
      "Choose between two difficult or hilarious dilemmas and defend your choice!",

    image:
      null,

    gif:
      path.join(
        __dirname,
        'assets',
        'gif13.gif'
      )
  }

];


// -------------------------------------------------------------
// 5. ACTIVE CHANNEL DATA
// -------------------------------------------------------------

const activeChannels =
  new Map();


const waitingForDoors =
  new Set();


// -------------------------------------------------------------
// 🍷 FIND OLYMPIAN ROLE
// -------------------------------------------------------------
function getOlympianRole(
  guild
) {

  if (!guild) {
    return null;
  }

  return (
    guild.roles.cache.find(
      role =>
        role.name ===
        OLYMPIANS_ROLE_NAME
    ) || null
  );

}


// -------------------------------------------------------------
// 🍷 DIONYSIUS ARRIVAL MESSAGE
// -------------------------------------------------------------
function createDionysiusArrivalMessage(
  guild
) {

  const olympianRole =
    getOlympianRole(
      guild
    );


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

      .setColor(
        "#800020"
      )

      .setFooter({

        text:
          "Dionysius is watching..."

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
// 6. CREATE THE 12-DOOR HALLWAY
// -------------------------------------------------------------
function createHallwayPayload() {

  const doors = [];


  // Door 1
  doors[0] = {

    type:
      'GAME',

    data:
      GAMES_LIST[0],

    used:
      false

  };


  // Door 2
  doors[1] = {

    type:
      'GAME',

    data:
      GAMES_LIST[1],

    used:
      false

  };


  // Door 3
  doors[2] = {

    type:
      'TRICK',

    data:
      ASSETS.TRICKS[0],

    used:
      false

  };


  // Door 4
  doors[3] = {

    type:
      'GAME',

    data:
      GAMES_LIST[2],

    used:
      false

  };


  // Door 5
  doors[4] = {

    type:
      'TRICK',

    data:
      ASSETS.TRICKS[1],

    used:
      false

  };


  // Door 6
  doors[5] = {

    type:
      'TRICK',

    data:
      ASSETS.TRICKS[2],

    used:
      false

  };


  // Door 7
  doors[6] = {

    type:
      'GAME',

    data:
      GAMES_LIST[3],

    used:
      false

  };


  // Door 8
  doors[7] = {

    type:
      'TRICK',

    data:
      ASSETS.TRICKS[3],

    used:
      false

  };


  // Door 9
  doors[8] = {

    type:
      'TRICK',

    data:
      ASSETS.TRICKS[4],

    used:
      false

  };


  // Door 10
  doors[9] = {

    type:
      'GAME',

    data:
      GAMES_LIST[4],

    used:
      false

  };


  // Door 11
  doors[10] = {

    type:
      'GAME',

    data:
      GAMES_LIST[5],

    used:
      false

  };


  // Door 12
  doors[11] = {

    type:
      'TRICK',

    data:
      ASSETS.TRICKS[5],

    used:
      false

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

      .setColor(
        "#800020"
      )

      .setImage(
        `attachment://${path.basename(
          ASSETS.HALLWAY_IMAGE
        )}`
      )

      .setFooter({

        text:
          "Dionysius is watching"

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

        .setEmoji(
          "🚪"
        )

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

      .setEmoji(
        '🍷'
      )

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
// 7. OPEN HALLWAY
// -------------------------------------------------------------
async function openHallway(
  channel
) {

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
// 8. CORE DOOR UNLOCK LOGIC
// -------------------------------------------------------------
async function processDoorUnlock(
  session,
  doorIndex,
  member,
  user
) {

  const selectedDoor =
    session.doors[
      doorIndex
    ];


  if (
    selectedDoor.used
  ) {

    return {

      success:
        false,

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
    selectedDoor.type ===
    'GAME'
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

        .setColor(
          "#FFD700"
        )

        .setFooter({

          text:
            "Let the festivities begin!"

        });


    // ---------------------------------------------------------
    // GAME IMAGE
    // ---------------------------------------------------------
    if (
      game.image
    ) {

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
    if (
      game.gif
    ) {

      const gifName =
        path.basename(
          game.gif
        );


      const gifEmbed =
        new EmbedBuilder()

          .setColor(
            "#FFD700"
          )

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
    selectedDoor.type ===
    'TRICK'
  ) {

    const trickData =
      selectedDoor.data;


    // ---------------------------------------------------------
    // 🎭 EXACT NICKNAME FOR THIS TRICK
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
    // 🎂 FETCH BIRTHDAY BOY
    // ---------------------------------------------------------
    try {

      targetMember =
        await guild.members.fetch(
          BIRTHDAY_BOY_ID
        );

    } catch (err) {

      console.error(
        `❌ Could not fetch Birthday Boy ${BIRTHDAY_BOY_ID}:`,
        err
      );

    }


    // ---------------------------------------------------------
    // 🎭 CHANGE NICKNAME
    // ---------------------------------------------------------
    if (
      targetMember
    ) {

      oldNickname =
        targetMember.nickname;


      console.log(
        `🎂 Birthday Boy found: ${targetMember.user.tag}`
      );


      console.log(
        `🎭 Assigned trick nickname: ${targetNickname}`
      );


      console.log(
        `🤖 Birthday Boy manageable by bot: ${targetMember.manageable}`
      );


      // -------------------------------------------------------
      // BOT MUST BE HIGHER IN ROLE HIERARCHY
      // -------------------------------------------------------
      if (
        !targetMember.manageable
      ) {

        console.error(
          `❌ Cannot change nickname for ${targetMember.user.tag}.`
        );


        console.error(
          `❌ Move the bot's highest role ABOVE the Birthday Boy's highest role.`
        );

      } else {

        try {

          await targetMember.setNickname(
            targetNickname,
            `Dionysius trick door #${doorIndex + 1}`
          );


          nickChanged =
            true;


          console.log(
            `🎭 SUCCESS: ${targetMember.user.tag} ` +
            `is now "${targetNickname}"`
          );


          // ---------------------------------------------------
          // ⏱️ REVERT AFTER 5 MINUTES
          // ---------------------------------------------------
          setTimeout(
            async () => {

              try {

                const freshMember =
                  await guild.members.fetch(
                    BIRTHDAY_BOY_ID
                  );


                if (
                  freshMember &&
                  freshMember.manageable
                ) {

                  await freshMember.setNickname(
                    oldNickname,
                    `Dionysius trick door #${doorIndex + 1} expired`
                  );


                  console.log(
                    `⏱️ Reverted nickname for ${freshMember.user.tag}.`
                  );

                }

              } catch (
                revertErr
              ) {

                console.error(
                  `❌ Failed to revert nickname:`,
                  revertErr
                );

              }

            },
            5 * 60 * 1000
          );

        } catch (
          nicknameErr
        ) {

          console.error(
            `❌ Discord rejected nickname change:`,
            nicknameErr
          );

        }

      }

    } else {

      console.error(
        `❌ Birthday Boy ${BIRTHDAY_BOY_ID} was not found.`
      );

    }


    // ---------------------------------------------------------
    // 💬 RANDOM QUOTE
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
    // 💀 TRICK RESULT EMBED
    // ---------------------------------------------------------
    //
    // IMPORTANT:
    //
    // The New Identity is based on trickData.nickname,
    // NOT on nickChanged.
    //
    // This means the result will still tell everyone which
    // identity the trick assigned even if Discord prevents
    // the actual nickname change because of role hierarchy.
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
            targetMember

              ? `🎭 **New Identity:** ${birthdayBoyMention} is now known as **${targetNickname}**!`

              : `🎭 **New Identity:** Birthday Boy could not be found, but the assigned identity is **${targetNickname}**!`

          )

        )

        .setColor(
          "#FF0000"
        );


    // ---------------------------------------------------------
    // 🖼️ TRICK IMAGE
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
    // 🎞️ TRICK GIF
    // ---------------------------------------------------------
    if (
      trickData.gif
    ) {

      const gifName =
        path.basename(
          trickData.gif
        )
        ;


      const gifEmbed =
        new EmbedBuilder()

          .setColor(
            "#FF0000"
          )

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


    // Trick result first
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
  // DISABLE THAT DOOR BUTTON
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

                selectedDoor.type ===
                'TRICK'

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

    success:
      true,

    embeds,

    files,

    // Useful if you ever need to inspect whether the actual
    // Discord nickname change succeeded.
    nickChanged

  };

}


// -------------------------------------------------------------
// 9. BOT READY
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
          name:
            'domain',

          description:
            'Summon Dionysius and prepare the 12 Doors!'
        },


        {
          name:
            'doors',

          description:
            'Immediately open the 12 Doors!'
        },


        {
          name:
            'leave',

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

    } catch (
      err
    ) {

      console.error(
        "❌ Failed to register slash commands:",
        err
      );

    }

  }
);


// -------------------------------------------------------------
// 10. MESSAGE CREATE
// -------------------------------------------------------------
client.on(
  'messageCreate',
  async (
    message
  ) => {

    // ---------------------------------------------------------
    // IGNORE BOT MESSAGES
    // ---------------------------------------------------------
    if (
      message.author.bot
    ) {

      return;

    }


    const trimmed =
      message.content.trim();


    // =========================================================
    // 🚪 FLEXIBLE DOOR COMMAND
    // =========================================================
    //
    // Accepts:
    //
    // OPEN THE DOORS DIONYSIUS
    // open the doors dionysius
    // OPEN THE DOORS DIONYSIUS 🚪
    // OPEN THE DOORS DIONYSIUS 🍷
    // OPEN THE DOORS DIONYSIUS!!!
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
    // 🚪 OPEN THE DOORS
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
      // REMOVE WAITING STATE
      // -------------------------------------------------------
      waitingForDoors.delete(
        message.channelId
      );


      try {

        await openHallway(
          message.channel
        );

      } catch (
        err
      ) {

        console.error(
          "❌ Failed to open the doors:",
          err
        );


        // Allow retry
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
      session.doors[
        doorIndex
      ];


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

      } catch (
        e
      ) {

        console.log(
          "⚠️ Could not update hallway buttons:",
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


    } catch (
      err
    ) {

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
// 11. INTERACTION CREATE
// -------------------------------------------------------------
client.on(
  'interactionCreate',
  async (
    interaction
  ) => {


    // =========================================================
    // SLASH COMMANDS
    // =========================================================
    if (
      interaction.isChatInputCommand()
    ) {


      // =======================================================
      // 🍷 /DOMAIN
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

            ephemeral:
              true

          });

        }


        // -----------------------------------------------------
        // CLEAR OLD HALLWAY
        // -----------------------------------------------------
        activeChannels.delete(
          interaction.channelId
        );


        // -----------------------------------------------------
        // WAIT FOR DOOR COMMAND
        // -----------------------------------------------------
        waitingForDoors.add(
          interaction.channelId
        );


        // -----------------------------------------------------
        // CREATE ARRIVAL
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

            ephemeral:
              true

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


          await interaction
            .deleteReply()
            .catch(
              () => {}
            );

        } catch (
          err
        ) {

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

            ephemeral:
              true

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

          ephemeral:
            true

        });

      }


      // =======================================================
      // 🍷 LEAVE BUTTON
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

          embeds:
            [],

          components:
            []

        });

      }


      // -------------------------------------------------------
      // DEFER BUTTON
      // -------------------------------------------------------
      await interaction
        .deferUpdate()
        .catch(
          () => {}
        );


      // -------------------------------------------------------
      // FIND SESSION
      // -------------------------------------------------------
      const session =
        activeChannels.get(
          interaction.channelId
        );


      if (!session) {

        return interaction.followUp({

          content:
            `⚠️ There is no active hallway right now.`,

          ephemeral:
            true

        });

      }


      // -------------------------------------------------------
      // GET DOOR NUMBER
      // -------------------------------------------------------
      const doorIndex =
        parseInt(
          interaction.customId
            .split(
              '_'
            )[1]
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

          ephemeral:
            true

        });

      }


      const selectedDoor =
        session.doors[
          doorIndex
        ];


      // -------------------------------------------------------
      // ALREADY OPEN
      // -------------------------------------------------------
      if (
        selectedDoor.used
      ) {

        return interaction.followUp({

          content:
            `🚪 This door has already been unsealed! Choose another.`,

          ephemeral:
            true

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

            ephemeral:
              true

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


      } catch (
        err
      ) {

        console.error(
          `❌ Error opening Door #${doorIndex + 1}:`,
          err
        );


        return interaction.followUp({

          content:
            `⚠️ Render lagged while opening Door #${doorIndex + 1}. ` +
            `The door remains available — try again!`,

          ephemeral:
            true

        });

      }

    }

  }
);


// -------------------------------------------------------------
// 12. LOGIN
// -------------------------------------------------------------
client.login(
  BOT_TOKEN
);
