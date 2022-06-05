const { MAX_RESULTS_PER_PAGE, MAX_PAGE_COUNT } = require('../utils/constants.js');

function results(data, name, query, type, pagination, page) {
    const resultList = [];
    const last_visible_page = Math.min(MAX_PAGE_COUNT, pagination.last_visible_page);
    for (let i = 0; i < data.length; i++) {
        resultList.push(`${i + 1}. ${data[i][name]}`);
    }
    let resultsSummary = '';
    if (last_visible_page === 1) {
        resultsSummary = `Found ${data.length} \`${type}\` matching \`${query}\`.`;
    } else if (pagination.last_visible_page > MAX_PAGE_COUNT) {
        resultsSummary = `Found ${MAX_RESULTS_PER_PAGE * MAX_PAGE_COUNT} \`${type}\` matching \`${query}\`. (Page ${page}/${last_visible_page})`;
    } else {
        resultsSummary = `Found ${MAX_RESULTS_PER_PAGE * (last_visible_page - 1)}+ \`${type}\` matching \`${query}\`. (Page ${page}/${last_visible_page})`;
    }
    const searchResults = resultList.join('\n');
    let userInstructions = 'Please type the number corresponding to your selection, or press `c` to cancel.';
    if (last_visible_page > 1) {
        userInstructions = 'Click the arrows below to view more results. '.concat(userInstructions);
    }
    return `${resultsSummary}\n\n\`\`\`md\n${searchResults}\n\`\`\`\n${userInstructions}`;
}

module.exports = {
    results,
};