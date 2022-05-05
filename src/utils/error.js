const { ERROR_TIMEOUT_TIME } = require('../utils/constants.js');

function onErrorReply(error, interaction) {
    interaction.channel.send({
        content: `Oops! Sorry about that <@${interaction.user.id}>, it looks like I ran into an error while processing that command. Please try again! `,
        ephermal: true,
    }).then((msg) => {
        setTimeout(() => msg.delete().catch((e) => { onErrorLog(e); }), ERROR_TIMEOUT_TIME);
    }).catch((e) => {
        onErrorLog(e);
    });
    onErrorLog(error);
}

function onErrorLog(error) {
    console.log(error);
}

module.exports = {
    onErrorReply,
    onErrorLog,
};