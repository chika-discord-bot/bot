const { onErrorReply, onErrorLog } = require('../utils/error.js');
const { results } = require('../utils/results.js');
const { TIMEOUT_TIME } = require('../utils/constants.js');
const fetch = require('node-fetch');

function paginator(interaction, data, pagination, message, page, params) {
    if (pagination.last_visible_page > 1) {
        message.react('⏪').then(() => message.react('⏩')).catch((error) => { onErrorLog(error); });
        const reactionFilter = (reaction, user) => {
            return (
                ['⏪', '⏩'].includes(reaction.emoji.name) &&
                user.id === interaction.user.id
            );
        };
        const collector = message.createReactionCollector({
            filter: reactionFilter,
            time: TIMEOUT_TIME,
        });
        collector.on('collect', async (reaction, user) => {
            if (reaction.emoji.name === '⏩') {
                if (pagination.last_visible_page > page) {
                    page++;
                    const tmp = (
                        await fetch(
                            params.url({ query: params.query, page: page }),
                        ).then((response) => response.json())
                    )['data'];
                    [].splice.apply(data, [0, data.length].concat(tmp));
                    const output = results(data, params.name, params.q, params.type, pagination, page);
                    if (!collector.ended) {
                        interaction
                            .editReply(output)
                            .catch((error) => {
                                onErrorReply(error, interaction);
                            });
                    }
                }
            } else if (page > 1) {
                page--;
                const tmp = (
                    await fetch(
                        params.url({ query: params.query, page: page }),
                    ).then((response) => response.json())
                )['data'];
                [].splice.apply(data, [0, data.length].concat(tmp));
                const output = results(data, params.name, params.q, params.type, pagination, page);
                if (!collector.ended) {
                    interaction
                        .editReply(output)
                        .catch((error) => {
                            onErrorReply(error, interaction);
                        });
                }
            }
            const userReactions = message.reactions.cache.filter((currentReaction) =>
                currentReaction.users.cache.has(user.id),
            );
            try {
                for (const currentReaction of userReactions.values()) {
                    await currentReaction.users.remove(user.id);
                }
            } catch (error) {
                console.error('Failed to remove reactions.');
            }
        });
        collector.on('end', (collected) => {
            if (collected === 'time') {
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
            }
        });
    }
}

module.exports = {
    paginator,
};