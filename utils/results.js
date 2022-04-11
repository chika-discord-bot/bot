const maxResultsPerPage = 25;

function results(data, name, query, type, pagination, page) {
    const resultList = [];
    for (let i = 0; i < data.length; i++) {
        resultList.push(`${i + 1}. ${data[i][name]}`);
    }
    let resultsSummary = '';
    if (pagination.last_visible_page === 1) {
        resultsSummary = `Found ${data.length} \`${type}\` matching \`${query}\`.`;
    } else {
        resultsSummary = `Found ${maxResultsPerPage * (pagination.last_visible_page - 1)}+ \`${type}\` matching \`${query}\`. (Page ${page}/${pagination.last_visible_page})`;
    }
    const searchResults = resultList.join('\n');
    let userInstructions = 'Please type the number corresponding to your selection, or press `c` to cancel.';
    if (pagination.last_visible_page > 1) {
        userInstructions = 'Click the arrows below to view more results. '.concat(userInstructions);
    }
    return `${resultsSummary}\n\n\`\`\`md\n${searchResults}\n\`\`\`\n${userInstructions}`;
}

module.exports = {
    results,
};