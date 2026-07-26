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
