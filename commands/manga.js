const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const { results } = require('../utils/results.js');
const { onErrorReply, onErrorLog } = require('../utils/error.js');

const fetch = require('node-fetch');

const timeoutTime = 60000;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('manga')
        .setDescription('Gives you information about any manga on MyAnimeList!')
        .addStringOption((option) =>
            option
                .setName('title')
                .setDescription('The title of the manga you want to look up.')
                .setRequired(true),
        ),
    async execute(interaction) {
        await interaction.deferReply();
        const q = interaction.options.getString('title');
        let query = new URLSearchParams({ q });

        const jikanResponse = await fetch(
            `https://api.jikan.moe/v4/manga?${query}&order_by=members&sort=desc&page=1`,
        ).then((response) => response.json());
        const { pagination } = jikanResponse;
        let { data } = jikanResponse;

        let page = 1;
        let mangaIndex = -1;
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
            let output = results(data, 'title', q, 'manga', pagination, page);
            interaction.editReply(output, { fetchReply: true }).then((message) => {
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
                        time: timeoutTime,
                    });
                    collector.on('collect', async (reaction, user) => {
                        if (reaction.emoji.name === '⏩') {
                            if (pagination.last_visible_page > page) {
                                page++;
                                data = (
                                    await fetch(
                                        `https://api.jikan.moe/v4/manga?${query}&order_by=members&sort=desc&page=${page}`,
                                    ).then((response) => response.json())
                                )['data'];
                                output = results(data, 'title', q, 'manga', pagination, page);
                                interaction
                                    .editReply(output)
                                    .catch((error) => {
                                        onErrorReply(error, interaction);
                                    });
                            }
                        } else if (page > 1) {
                            page--;
                            data = (
                                await fetch(
                                    `https://api.jikan.moe/v4/manga?${query}&order_by=members&sort=desc&page=${page}`,
                                ).then((response) => response.json())
                            )['data'];
                            output = results(data, 'title', q, 'manga', pagination, page);
                            interaction
                                .editReply(output)
                                .catch((error) => {
                                    onErrorReply(error, interaction);
                                });
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
                        return data;
                    });
                    collector.on('end', (collected) => {
                        if (collected === 'time') {
                            interaction
                                .editReply('Timeout error, please try again')
                                .then((msg) => {
                                    msg.reaction.removeAll().catch((error) => { onErrorLog(error); });
                                    setTimeout(() => msg.delete().catch((error) => { onErrorLog(error); }), 10000);
                                })
                                .catch((error) => {
                                    onErrorReply(error, interaction);
                                    console.log('error was here');
                                });
                        }
                    });
                }
                const messageFilter = (m) => {
                    return m.author.id === interaction.user.id;
                };
                interaction.channel
                    .awaitMessages({
                        filter: messageFilter,
                        max: 1,
                        time: timeoutTime,
                        errors: ['time'],
                    })
                    .then((collected) => {
                        mangaIndex = parseInt(collected.first().content);
                        if (
                            !isNaN(mangaIndex) &&
                            mangaIndex > 0 &&
                            mangaIndex <= data.length
                        ) {
                            interaction
                                .editReply(`Loading result ${collected.first().content}...`)
                                .then(() => {
                                    const manga = data[mangaIndex - 1];
                                    const embed = new MessageEmbed()
                                        .setColor('#F37A12')
                                        .setTitle(manga['title'])
                                        .setURL(manga['url'])
                                        .setThumbnail(manga['images']['jpg']['image_url']);
                                    if (manga['synopsis'] === null) {
                                        embed.setDescription('No synopsis available.');
                                    } else {
                                        embed.setDescription(manga['synopsis']);
                                    }
                                    if (manga['score'] === null) {
                                        embed.addField('Score', 'N/A', true);
                                    } else {
                                        embed.addField('Score', manga['score'].toString(), true);
                                    }
                                    if (manga['members'] === null) {
                                        embed.addField('Members', 'N/A', true);
                                    } else {
                                        embed.addField(
                                            'Members',
                                            manga['members'].toString(),
                                            true,
                                        );
                                    }
                                    if (manga['published']['from'] === null) {
                                        embed.addField('Start Date', 'Unknown', true);
                                    } else {
                                        embed.addField(
                                            'Start Date',
                                            manga['published']['from'].substring(0, 10),
                                            true,
                                        );
                                    }
                                    if (manga['published']['to'] === null) {
                                        embed.addField('End Date', 'Unknown', true);
                                    } else {
                                        embed.addField(
                                            'End Date',
                                            manga['published']['to'].substring(0, 10),
                                            true,
                                        );
                                    }
                                    if (manga['chapters'] === null) {
                                        embed.addField('Chapter Count', 'Unknown', true);
                                    } else {
                                        embed.addField(
                                            'Chapter Count',
                                            manga['chapters'].toString(),
                                            true,
                                        );
                                    }
                                    if (manga['type'] === null) {
                                        embed.addField('Type', 'Unknown', true);
                                    } else {
                                        embed.addField('Type', manga['type'], true);
                                    }
                                    try {
                                        const genre = manga['genres'];
                                        const tmp = [];
                                        for (let i = 0; i < genre.length; i++) {
                                            tmp.push(genre[i]['name']);
                                        }
                                        let genres = tmp.join(', ');
                                        if (genres === '') genres = 'None';
                                        embed.addField('Genres', genres, false);
                                    } catch {
                                        console.error(
                                            'An error occured when embedding the genres.',
                                        );
                                    }
                                    if (manga['type'] !== null && manga['type'] !== 'music' && manga['score'] !== null) {
                                        const name = manga.title;
                                        query = new URLSearchParams({ name });
                                        embed.addField(
                                            'Read',
                                            `[Link](https://manga4life.com/search/?sort=s&desc=false&${query})`,
                                            true,
                                        );
                                    }
                                    interaction.deleteReply().catch((error) => {
                                        onErrorReply(error, interaction);
                                    });
                                    interaction.channel.send({ embeds: [embed] }).catch((error) => {
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
                                    setTimeout(() => msg.delete().catch((error) => { onErrorLog(error); }, 10000));
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
            });
        }
    },
};
