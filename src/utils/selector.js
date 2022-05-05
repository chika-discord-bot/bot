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
                    .editReply('The action was cancelled. Feel free to make another request!')
                    .then((msg) => {
                        msg.reactions.removeAll().catch((error) => { onErrorLog(error); });
                        setTimeout(() => msg.delete().catch((error) => { onErrorLog(error); }), ERROR_TIMEOUT_TIME);
                    })
                    .catch((error) => {
                        onErrorReply(error, interaction);
                    });
            } else {
                interaction
                    .editReply('Whoops! That doesn\'t look like a valid input, please try again!')
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
                .editReply('Hmm, it looks like I didn\'t get a response in time. Please try again!')
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