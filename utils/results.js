function results(data, name, query, type, pagination, page) {
    resultList = [];
    for (let i = 0; i < data.length; i++) {
        resultList.push(`${i + 1}. ${data[i][name]}`)
    }
    let resultsSummary = "";
    if (pagination.last_visible_page === 1) {
        resultsSummary = `Found ${data.length} ${type} matching **${query}**.`
    } else {
        resultsSummary = `Found ${data.length * (pagination.last_visible_page - 1)}+ ${type} matching **${query}**. (Page ${page}/${pagination.last_visible_page})`
    }
    let results = resultList.join('\n');
    let userInstructions = `Please type the number corresponding to your selection, or press 'c' to cancel.`;
    if (pagination.last_visible_page > 1) {
        userInstructions = 'Click the arrows below to view more results. '.concat(userInstructions);
    }

    return `${resultsSummary}\n\n\`\`\`md\n${results}\n\`\`\`\n${userInstructions}`;
}

module.exports = {
    results
}