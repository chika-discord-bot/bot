const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const { results } = require('../utils/results.js');
const { paginator } = require('../utils/paginator.js');
const { selector } = require('../utils/selector.js');
const { onErrorReply, onErrorLog } = require('../utils/error.js');
const { API_ENDPOINT_ANIME, ERROR_TIMEOUT_TIME } = require('../utils/constants.js');

const fetch = require('node-fetch');

function animeFormatter(interaction, collected, data, index) {
    interaction
        .editReply(`Loading result ${collected.first().content}...`)
        .then(() => {
            const anime = data[index - 1];
            const embed = new MessageEmbed()
                .setColor('#F37A12')
                .setTitle(anime['title'])
                .setURL(anime['url'])
                .setThumbnail(anime['images']['jpg']['image_url']);
            if (anime['synopsis'] === null) {
                embed.setDescription('No synopsis available.');
            } else {
                embed.setDescription(anime['synopsis']);
            }
            if (anime['score'] === null) {
                embed.addField('Score', 'N/A', true);
            } else {
                embed.addField('Score', anime['score'].toString(), true);
            }
            if (anime['members'] === null) {
                embed.addField('Members', 'N/A', true);
            } else {
                embed.addField(
                    'Members',
                    anime['members'].toString(),
                    true,
                );
            }
            if (anime['aired']['from'] === null) {
                embed.addField('Start Date', 'Unknown', true);
            } else {
                embed.addField(
                    'Start Date',
                    anime['aired']['from'].substring(0, 10),
                    true,
                );
            }
            if (anime['aired']['to'] === null) {
                embed.addField('End Date', 'Unknown', true);
            } else {
                embed.addField(
                    'End Date',
                    anime['aired']['to'].substring(0, 10),
                    true,
                );
            }
            if (anime['episodes'] === null) {
                embed.addField('Episode Count', 'Unknown', true);
            } else {
                embed.addField(
                    'Episode Count',
                    anime['episodes'].toString(),
                    true,
                );
            }
            if (anime['type'] === null) {
                embed.addField('Type', 'Unknown', true);
            } else {
                embed.addField('Type', anime['type'], true);
            }
            try {
                const genre = anime['genres'];
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
            if (anime['type'] !== null && anime['type'] !== 'Music' && anime['score'] !== null) {
                const q = anime.title;
                const query = new URLSearchParams({ q });
                embed.addField(
                    'Stream',
                    `[Link](https://animixplay.to/?${query}&sengine=gogo)`,
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
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('anime')
        .setDescription('Gives you information about any anime on MyAnimeList!')
        .addStringOption((option) =>
            option
                .setName('title')
                .setDescription('The title of the anime you want to look up.')
                .setRequired(true),
        ),
    async execute(interaction) {
        await interaction.deferReply();

        const q = interaction.options.getString('title');
        const query = new URLSearchParams({ q });
        const jikanResponse = await fetch(
            API_ENDPOINT_ANIME({ query: query, page: 1 }),
        ).then((response) => response.json());
        const { pagination, data } = jikanResponse;

        const page = 1;
        if (data.length == 0) {
            interaction
                .editReply(`No results found for \`${q}\`.`)
                .then((msg) => {
                    setTimeout(() => msg.delete().catch((error) => { onErrorLog(error); }), ERROR_TIMEOUT_TIME);
                })
                .catch((error) => {
                    onErrorReply(error, interaction);
                });
        } else {
            const output = results(data, 'title', q, 'anime', pagination, page);
            interaction.editReply(output, { fetchReply: true }).then((message) => {
                paginator(interaction, data, pagination, message, page, {
                    url: API_ENDPOINT_ANIME,
                    name: 'title',
                    type: 'anime',
                    q: q,
                    query: query,
                });

                selector(interaction, data, animeFormatter);
            });
        }
    },
};