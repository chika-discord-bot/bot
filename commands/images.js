const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');

const { results } = require('../utils/results.js');
const { paginator } = require('../utils/paginator.js');
const { onErrorReply, onErrorLog } = require('../utils/error.js');
const { API_ENDPOINT_CHARACTER, API_ENDPOINT_IMAGES, TIMEOUT_TIME } = require('../utils/constants.js');

const fetch = require('node-fetch');
const { selector } = require('../utils/selector.js');

function imagesFormatter(interaction, collected, data) {
    const characterIndex = parseInt(collected.first().content);
    if (
        !isNaN(characterIndex) &&
        characterIndex > 0 &&
        characterIndex <= data.length
    ) {
        interaction
            .editReply(`Loading result ${collected.first().content}...`)
            .then(async () => {
                const character = data[characterIndex - 1];
                const characterid = character['mal_id'];

                const imageUrls = await fetch(
                    API_ENDPOINT_IMAGES({ characterid: characterid }),
                ).then((response) => response.json());

                const embeds = [];
                const embedLength = Math.min(imageUrls['data'].length, 10);
                for (let i = 0; i < embedLength; i++) {
                    const embed = new MessageEmbed()
                        .setColor('#F37A12')
                        .setTitle(character['name'])
                        .setURL(character['url'])
                        .setDescription(`**Favorites**: ${character['favorites']}`)
                        .setImage(imageUrls['data'][i]['jpg']['image_url'])
                        .setFooter({ text: `${i + 1} / ${embedLength}` });
                    embeds.push(embed);
                }

                interaction.deleteReply().catch((error) => {
                    onErrorReply(error, interaction);
                });
                let page = 1;
                interaction.channel.send({ embeds: [embeds[page - 1]] })
                    .then((msg) => {
                        msg.react('⏪').then(() => msg.react('⏩')).catch((error) => { onErrorLog(error); });
                        const reactionFilter = (reaction, user) => {
                            return (
                                ['⏪', '⏩'].includes(reaction.emoji.name) &&
                                user.id === interaction.user.id
                            );
                        };
                        const collector = msg.createReactionCollector({
                            filter: reactionFilter,
                            time: TIMEOUT_TIME,
                        });
                        collector.on('collect', async (reaction, user) => {
                            if (reaction.emoji.name === '⏩') {
                                if (embedLength > page) {
                                    page++;
                                }
                            } else if (page > 1) {
                                page--;
                            }
                            msg.edit({ embeds: [embeds[page - 1]] }).catch((error) => { onErrorLog(error); });
                            const userReactions = msg.reactions.cache.filter((currentReaction) =>
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
                        collector.on('end', () => {
                            msg.reactions.removeAll().catch((error) => { onErrorLog(error); });
                        });

                    })
                    .catch((error) => {
                        onErrorReply(error, interaction);
                    });
            })
            .catch((error) => {
                onErrorReply(error, interaction);
            });
    } else if (collected.first().content.toLowerCase() === 'c') {
        interaction
            .editReply('The action was canceled.')
            .then((msg) => {
                msg.reactions.removeAll().catch((error) => { onErrorLog(error); });
                setTimeout(() => msg.delete().catch((error) => { onErrorLog(error); }), 10000);
            })
            .catch((error) => {
                onErrorReply(error, interaction);
            });
    } else {
        interaction
            .editReply('An invalid input was provided. Please try again.')
            .then((msg) => {
                msg.reactions.removeAll().catch((error) => { onErrorLog(error); });
                setTimeout(() => msg.delete().catch((error) => { onErrorLog(error); }), 10000);
            })
            .catch((error) => {
                onErrorReply(error, interaction);
            });
    }
    collected.first().delete().catch((error) => { onErrorLog(error); });
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('images')
        .setDescription('Gives you images for any character on MyAnimeList!')
        .addStringOption((option) =>
            option
                .setName('name')
                .setDescription('The name of the character you want to find images of.')
                .setRequired(true),
        ),
    async execute(interaction) {
        await interaction.deferReply();

        const q = interaction.options.getString('name');
        const query = new URLSearchParams({ q });
        const jikanResponse = await fetch(
            API_ENDPOINT_CHARACTER({ query: query, page: 1 }),
        ).then((response) => response.json());
        const { pagination, data } = jikanResponse;

        const page = 1;
        if (data.length == 0) {
            interaction
                .editReply(`No results found for \`${q}\`.`)
                .then((msg) => {
                    setTimeout(() => msg.delete().catch((error) => { onErrorLog(error); }), 10000);
                })
                .catch((error) => {
                    onErrorReply(error, interaction);
                });
        } else {
            const output = results(data, 'name', q, 'character', pagination, page);
            interaction.editReply(output, { fetchReply: true }).then((message) => {
                paginator(interaction, data, pagination, message, page, {
                    url: API_ENDPOINT_CHARACTER,
                    name: 'name',
                    type: 'character',
                    q: q,
                    query: query,
                });

                selector(interaction, data, imagesFormatter);
            });
        }
    },
};