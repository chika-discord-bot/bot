const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const { results } = require('../utils/results.js');
const { paginator } = require('../utils/paginator.js');
const { selector } = require('../utils/selector.js');
const { onErrorReply, onErrorLog } = require('../utils/error.js');
const { API_ENDPOINT_MANGA, ERROR_TIMEOUT_TIME } = require('../utils/constants.js');

const fetch = require('node-fetch');

function mangaFormatter(interaction, collected, data, index) {
    interaction
        .editReply(`Loading result ${collected.first().content}...`)
        .then(() => {
            const manga = data[index - 1];
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
                const query = new URLSearchParams({ name });
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
}

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
        const query = new URLSearchParams({ q });
        const jikanResponse = await fetch(
            API_ENDPOINT_MANGA({ query: query, page: 1 }),
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
            const output = results(data, 'title', q, 'manga', pagination, page);
            interaction.editReply(output, { fetchReply: true }).then((message) => {
                paginator(interaction, data, pagination, message, page, {
                    url: API_ENDPOINT_MANGA,
                    name: 'title',
                    type: 'manga',
                    q: q,
                    query: query,
                });

                selector(interaction, data, mangaFormatter);
            });
        }
    },
};
