const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed, DiscordAPIError } = require("discord.js");
const { results } = require("../utils/results.js");
const fetch = require("node-fetch");

async function onError(error, interaction) {
    console.log("Error:" + error.message);
    await interaction.channel.send({
        content: `<@${interaction.user.id}>There was an error while executing this command! Please try again.`,
        ephermal: true,
    });
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("anime")
        .setDescription("Gives you information about any anime on MyAnimeList!")
        .addStringOption((option) =>
            option
                .setName("title")
                .setDescription("The title of the anime you want to look up.")
                .setRequired(true)
        ),
    async execute(interaction) {
        await interaction.deferReply();
        let q = interaction.options.getString("title");
        let query = new URLSearchParams({ q });

        let { pagination, data } = await fetch(
            `https://api.jikan.moe/v4/anime?${query}&order_by=members&sort=desc&page=1`
        ).then((response) => response.json());

        let page = 1;
        let animeIndex = -1;
        if (data.length == 0) {
            interaction
                .editReply(`No results found for **${q}**.`)
                .then((msg) => {
                    msg.reaction.removeAll();
                    setTimeout(() => msg.delete(), 10000);
                })
                .catch((error) => {
                    onError(error, interaction)
                });;
        } else {
            let output = results(data, "title", q, "animes", pagination, page);
            interaction.editReply(output, { fetchReply: true }).then((message) => {
                if (pagination.last_visible_page > 1) {
                    message.react("⏪").then(() => message.react("⏩"));
                    const reactionFilter = (reaction, user) => {
                        return (
                            ["⏪", "⏩"].includes(reaction.emoji.name) &&
                            user.id === interaction.user.id
                        );
                    };
                    const collector = message.createReactionCollector({
                        filter: reactionFilter,
                        time: 60000,
                    });
                    collector.on("collect", async (reaction, user) => {
                        if (reaction.emoji.name === "⏩") {
                            if (pagination.last_visible_page > page) {
                                page++;
                                data = (
                                    await fetch(
                                        `https://api.jikan.moe/v4/anime?${query}&order_by=members&sort=desc&page=${page}`
                                    ).then((response) => response.json())
                                )["data"];
                                output = results(data, "title", q, "animes", pagination, page);
                                interaction
                                    .editReply(output)
                                    .catch((error) => {
                                        onError(error, interaction)
                                    });;
                            }
                        } else {
                            if (page > 1) {
                                page--;
                                data = (
                                    await fetch(
                                        `https://api.jikan.moe/v4/anime?${query}&order_by=members&sort=desc&page=${page}`
                                    ).then((response) => response.json())
                                )["data"];
                                output = results(data, "title", q, "animes", pagination, page);
                                interaction
                                    .editReply(output)
                                    .catch((error) => {
                                        onError(error, interaction)
                                    });
                            }
                        }
                        const userReactions = message.reactions.cache.filter((reaction) =>
                            reaction.users.cache.has(user.id)
                        );
                        try {
                            for (const reaction of userReactions.values()) {
                                await reaction.users.remove(user.id);
                            }
                        } catch (error) {
                            console.error("Failed to remove reactions.");
                        }
                    });
                    collector.on("end", (collected) => {
                        if (collected === "time") {
                            interaction
                                .editReply(`Timeout error, please try again`)
                                .then((msg) => {
                                    setTimeout(() => msg.delete(), 10000);
                                })
                                .catch((error) => {
                                    onError(error, interaction)
                                });;
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
                        time: 60000,
                        errors: ["time"],
                    })
                    .then((collected) => {
                        animeIndex = parseInt(collected.first().content);
                        if (
                            !isNaN(animeIndex) &&
                            animeIndex > 0 &&
                            animeIndex <= data.length
                        ) {
                            interaction
                                .editReply(`Loading result ${collected.first().content}...`)
                                .then(() => {
                                    anime = data[animeIndex - 1];
                                    let embed = new MessageEmbed()
                                        .setColor("#F37A12")
                                        .setTitle(anime["title"])
                                        .setURL(anime["url"])
                                        .setThumbnail(anime["images"]["jpg"]["image_url"]);
                                    if (anime["synopsis"] === null) {
                                        embed.setDescription("No synopsis available.");
                                    } else {
                                        embed.setDescription(anime["synopsis"]);
                                    }
                                    if (anime["score"] === null) {
                                        embed.addField("Score", "N/A", true);
                                    } else {
                                        embed.addField("Score", anime["score"].toString(), true);
                                    }
                                    if (anime["members"] === null) {
                                        embed.addField("Members", "N/A", true);
                                    } else {
                                        embed.addField(
                                            "Members",
                                            anime["members"].toString(),
                                            true
                                        );
                                    }
                                    if (anime["aired"]["from"] === null) {
                                        embed.addField("Start Date", "Unknown", true);
                                    } else {
                                        embed.addField(
                                            "Start Date",
                                            anime["aired"]["from"].substring(0, 10),
                                            true
                                        );
                                    }
                                    if (anime["aired"]["to"] === null) {
                                        embed.addField("End Date", "Unknown", true);
                                    } else {
                                        embed.addField(
                                            "End Date",
                                            anime["aired"]["to"].substring(0, 10),
                                            true
                                        );
                                    }
                                    if (anime["episodes"] === null) {
                                        embed.addField("Episode Count", "Unknown", true);
                                    } else {
                                        embed.addField(
                                            "Episode Count",
                                            anime["episodes"].toString(),
                                            true
                                        );
                                    }
                                    if (anime["type"] === null) {
                                        embed.addField("Type", "Unknown", true);
                                    } else {
                                        embed.addField("Type", anime["type"], true);
                                    }
                                    try {
                                        let genre = anime["genres"];
                                        let tmp = [];
                                        for (let i = 0; i < genre.length; i++) {
                                            tmp.push(genre[i]["name"]);
                                        }
                                        let genres = tmp.join(", ");
                                        if (genres === "") genres = "None";
                                        embed.addField("Genres", genres, false);
                                    } catch {
                                        console.error(
                                            "An error occured when embedding the genres."
                                        );
                                    }
                                    if (anime["type"] !== null && anime["type"] !== "music" && anime['score'] !== null) {
                                        q = anime.title;
                                        query = new URLSearchParams({ q });
                                        embed.addField(
                                            `Stream`,
                                            `[Link](https://animixplay.to/?${query}&sengine=gogo)`,
                                            true
                                        );
                                    }
                                    interaction.deleteReply().catch((error) => {
                                        onError(error, interaction)
                                    });;
                                    interaction.channel.send({ embeds: [embed] }).catch((error) => {
                                        onError(error, interaction)
                                    });;
                                })
                                .catch((error) => {
                                    onError(error, interaction)
                                });;
                        } else {
                            if (collected.first().content.toLowerCase() === "c") {
                                interaction
                                    .editReply("The action was canceled.")
                                    .then((msg) => {
                                        msg.reactions.removeAll();
                                        setTimeout(() => msg.delete(), 10000);
                                    })
                                    .catch((error) => {
                                        onError(error, interaction)
                                    });;
                            } else {
                                interaction
                                    .editReply("An invalid input was provided. Please try again.")
                                    .then((msg) => {
                                        msg.reactions.removeAll();
                                        setTimeout(() => msg.delete(), 10000);
                                    })
                                    .catch((error) => {
                                        onError(error, interaction)
                                    });;
                            }
                        }
                        collected.first().delete();
                    })
                    .catch((collected) => {
                        interaction
                            .editReply(`Timeout error, please try again`)
                            .then((msg) => {
                                msg.reaction.removeAll();
                                setTimeout(() => msg.delete(), 10000);
                            })
                            .catch((error) => {
                                onError(error, interaction)
                            });;
                    });
            });
        }
    },
};
