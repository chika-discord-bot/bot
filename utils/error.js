async function onErrorReply(error, interaction) {
    console.log("Error: " + error.message);
    await interaction.channel.send({
        content: `<@${interaction.user.id}>There was an error while executing this command! Please try again.`,
        ephermal: true,
    });
}

module.exports = {
    onErrorReply
}