async function onErrorReply(error, interaction) {
    console.log(error);
    await interaction.channel.send({
        content: `<@${interaction.user.id}>There was an error while executing this command! Please try again.`,
        ephermal: true,
    });
}

async function onErrorLog(error) {
    console.log(error);
}

module.exports = {
    onErrorReply,
    onErrorLog,
};