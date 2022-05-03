const { onErrorReply, onErrorLog } = require('../utils/error.js');
const { TIMEOUT_TIME } = require('../utils/constants.js');

function selector(interaction, data, formatter) {
    const messageFilter = (m) => {
        return m.author.id === interaction.user.id;
    };
    interaction.channel
        .awaitMessages({
            filter: messageFilter,
            max: 1,
            time: TIMEOUT_TIME,
            errors: ['time'],
        })
        .then((collected) => {
            formatter(interaction, collected, data);
        })
        .catch(() => {
            interaction
                .editReply('Timeout error, please try again')
                .then((msg) => {
                    msg.reactions.removeAll().catch((error) => { onErrorLog(error); });
                    setTimeout(() => msg.delete().catch((error) => { onErrorLog(error); }), 10000);
                })
                .catch((error) => {
                    onErrorReply(error, interaction);
                    console.log('error was here');
                });
        });
}

module.exports = {
    selector,
};