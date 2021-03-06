const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const { results } = require('../utils/results.js');
const { paginator } = require('../utils/paginator.js');
const { selector } = require('../utils/selector.js');
const { onErrorReply, onErrorLog } = require('../utils/error.js');
const { API_ENDPOINT_CHARACTER, ERROR_TIMEOUT_TIME } = require('../utils/constants.js');

const fetch = require('node-fetch');

function characterFormatter(interaction, collected, data, index) {
    interaction
        .editReply(`Loading result ${collected.first().content}...`)
        .then(() => {
            const character = data[index - 1];
            const embed = new MessageEmbed()
                .setColor('#F37A12')
                .setTitle(character['name'])
                .setURL(character['url']);
            if (character['about'] == null) {
                embed.setDescription('N/A');
            } else if (character['about'].length < 35) {
                embed.setDescription(`Note: This description may contain spoilers. If you would still like to learn more about \`${character['name']}\`, please click the link above.`);
            } else if (character['about'].length > 4000) {
                embed.setDescription(character['about'].substring(0, 3950) + '...');
            } else {
                embed.setDescription(character['about']);
            }
            if (character['favorites'] == null) {
                embed.addField('Member Favorites', 'N/A', false);
            } else {
                embed.addField('Member Favorites', character['favorites'].toString(), false);
            }
            embed.setImage(character['images']['jpg']['image_url']);

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
        .setName('character')
        .setDescription('Gives you information about any character on MyAnimeList!')
        .addStringOption((option) =>
            option
                .setName('name')
                .setDescription('The name of the character you want to look up.')
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
                    setTimeout(() => msg.delete().catch((error) => { onErrorLog(error); }), ERROR_TIMEOUT_TIME);
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

                selector(interaction, data, characterFormatter);
            });
        }
    },
};