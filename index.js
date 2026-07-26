// -------------------------------------------------------------
// 5. INTERACTION LISTENER (Slash Commands & Buttons ONLY)
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
      // 1. Process the door unlock data first
      const result = await processDoorUnlock(session, doorIndex, interaction.member, interaction.user);

      if (!result.success) {
        return interaction.followUp({ content: "⚠️ Could not open this door.", ephemeral: true });
      }

      // 2. Update the button board state only after processing succeeds
      await interaction.message.edit({ components: session.components });

      // 3. Send the response using followUp (safer and faster for interactions)
      await interaction.followUp({ embeds: result.embeds, files: result.files });

    } catch (err) {
      console.error(`❌ Error opening Door #${doorIndex + 1}:`, err);
      
      // SAFETY ROLLBACK: If it crashed, un-mark the door so it doesn't get stuck red
      selectedDoor.used = false;

      // Revert the button component state locally so it stays clickable
      session.components = session.components.map(row => {
        const newRow = ActionRowBuilder.from(row);
        newRow.components.forEach(button => {
          if (button.data.custom_id === `door_${doorIndex}`) {
            button.setDisabled(false);
            button.setLabel(`Door ${doorIndex + 1}`);
            button.setStyle(ButtonStyle.Primary);
          }
        });
        return newRow;
      });

      await interaction.message.edit({ components: session.components }).catch(() => {});

      return interaction.followUp({ 
        content: `⚠️ Render lagged while opening Door #${doorIndex + 1}. The door has been unlocked—please try clicking it again!`, 
        ephemeral: true 
      });
    }
  }
});
