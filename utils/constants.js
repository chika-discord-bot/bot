const API_ENDPOINT_ANIME = $ => `https://api.jikan.moe/v4/anime?${$.query}&order_by=members&sort=desc&page=${$.page}`;
const API_ENDPOINT_MANGA = $ => `https://api.jikan.moe/v4/manga?${$.query}&order_by=members&sort=desc&page=${$.page}`;
const API_ENDPOINT_CHARACTER = $ => `https://api.jikan.moe/v4/characters?${$.query}&order_by=favorites&sort=desc&page=${$.page}`;
const API_ENDPOINT_IMAGES = $ => `https://api.jikan.moe/v4/characters/${$.characterid}/pictures`;

module.exports = {
    API_ENDPOINT_ANIME,
    API_ENDPOINT_MANGA,
    API_ENDPOINT_CHARACTER,
    API_ENDPOINT_IMAGES,
};