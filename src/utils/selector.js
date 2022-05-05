const { onErrorReply, onErrorLog } = require('../utils/error.js');
const { TIMEOUT_TIME, ERROR_TIMEOUT_TIME } = require('../utils/constants.js');

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
            const index = parseInt(collected.first().content);
            if (
                !isNaN(index) &&
                index > 0 &&
                index <= data.length
            ) {
                formatter(interaction, collected, data, index);
            } else if (collected.first().content.toLowerCase() === 'c') {
                interaction
                    .editReply('The action was canceled.')
                    .then((msg) => {
                        msg.reactions.removeAll().catch((error) => { onErrorLog(error); });
                        setTimeout(() => msg.delete().catch((error) => { onErrorLog(error); }), ERROR_TIMEOUT_TIME);
                    })
                    .catch((error) => {
                        onErrorReply(error, interaction);
                    });
            } else {
                interaction
                    .editReply('An invalid input was provided. Please try again.')
                    .then((msg) => {
                        msg.reactions.removeAll().catch((error) => { onErrorLog(error); });
                        setTimeout(() => msg.delete().catch((error) => { onErrorLog(error); }), ERROR_TIMEOUT_TIME);
                    })
                    .catch((error) => {
                        onErrorReply(error, interaction);
                    });
            }
            collected.first().delete().catch((error) => { onErrorLog(error); });
        })
        .catch(() => {
            interaction
                .editReply('Timeout error, please try again')
                .then((msg) => {
                    msg.reactions.removeAll().catch((error) => { onErrorLog(error); });
                    setTimeout(() => msg.delete().catch((error) => { onErrorLog(error); }), ERROR_TIMEOUT_TIME);
                })
                .catch((error) => {
                    onErrorReply(error, interaction);
                });
        });
}

module.exports = {
    selector,
};