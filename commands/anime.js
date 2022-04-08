const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const { results } = require('../utils/results.js');
const fetch = require('node-fetch');
// TODO: add functionality to scroll between pages of these results
// TODO: delete messages after 10 seconds of not being used
module.exports = {
    data: new SlashCommandBuilder()
        .setName('anime')
        .setDescription('Gives you information about any anime on MyAnimeList!')
        .addStringOption(option => option.setName("title").setDescription("The title of the anime you want to look up.").setRequired(true)),
    async execute(interaction) {
        await interaction.deferReply();
        const q = interaction.options.getString('title');
        const query = new URLSearchParams({ q });

        const { pagination, data } = await fetch(`https://api.jikan.moe/v4/anime?${query}&order_by=members&sort=desc&page=1`).then(response => response.json());
        console.log(pagination);
        let animeIndex = -1;
        if (data.length == 0) {
            interaction.editReply(`No results found for **${q}**.`)
                .then(msg => {
                    setTimeout(() => msg.delete(), 10000);
                })
                .catch();
        } else {
            let output = results(data, 'title', q, 'animes')
            const filter = m => { return m.author.id === interaction.user.id };
            interaction.editReply(output, { fetchReply: true })
                .then(() => {
                    interaction.channel.awaitMessages({ filter, max: 1, time: 60000, errors: ['time'] })
                        .then(collected => {
                            if (collected.first().content.toLowerCase() === 'c') {
                                interaction.editReply('The action was canceled.');
                            }
                            animeIndex = parseInt(collected.first().content);
                            if (!isNaN(animeIndex) && animeIndex > 0 && animeIndex <= data.length) {
                                interaction.editReply(`Loading result ${collected.first().content}...`)
                                    .then(() => {
                                        anime = data[animeIndex - 1];
                                        // console.log(anime);
                                        let embed = new MessageEmbed()
                                            .setColor('#F37A12')
                                            .setTitle(anime['title'])
                                            .setURL(anime['url'])
                                            .setThumbnail(anime['images']['jpg']['image_url'])
                                        if (anime['synopsis'] === null) {
                                            embed.setDescription("No synopsis available.");
                                        } else {
                                            embed.setDescription(anime['synopsis'])
                                        }
                                        if (anime['score'] === null) {
                                            embed.addField("Score", "N/A", true);
                                        } else {
                                            embed.addField("Score", anime['score'].toString(), true);
                                        }
                                        if (anime['members'] === null) {
                                            embed.addField("Members", "N/A", true);
                                        } else {
                                            embed.addField("Members", anime['members'].toString(), true);
                                        }
                                        if (anime['aired']['from'] === null) {
                                            embed.addField("Start Date", "Unknown", true);
                                        } else {
                                            embed.addField("Start Date", anime['aired']['from'].substring(0, 10), true);
                                        }
                                        if (anime['aired']['to'] === null) {
                                            embed.addField("End Date", "Unknown", true);
                                        } else {
                                            embed.addField("End Date", anime['aired']['to'].substring(0, 10), true);
                                        }
                                        if (anime['episodes'] === null) {
                                            embed.addField("Episode Count", "Unknown", true);
                                        } else {
                                            embed.addField("Episode Count", anime['episodes'].toString(), true);
                                        }
                                        if (anime['type'] === null) {
                                            embed.addField("Type", "Unknown", true);
                                        } else {
                                            embed.addField("Type", anime['type'], true);
                                        }

                                        let genre = anime['genres'];
                                        let tmp = []
                                        for (let i = 0; i < genre.length; i++) {
                                            tmp.push(genre[i]['name']);
                                        }
                                        let genres = tmp.join(', ');
                                        embed.addField("Genres", genres, false)

                                        interaction.deleteReply();
                                        interaction.channel.send({ embeds: [embed] })
                                    })
                            } else {
                                interaction.editReply('An invalid input was provided. Please try again.')
                                    .then(msg => {
                                        setTimeout(() => msg.delete(), 10000);
                                    })
                                    .catch();
                            }
                            collected.first().delete();
                        })
                        .catch(collected => {
                            interaction.editReply(`Timeout error, please try again`)
                                .then(msg => {
                                    setTimeout(() => msg.delete(), 10000);
                                })
                                .catch();
                        })
                })
        }
    },
};