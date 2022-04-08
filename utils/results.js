function results(data, name, query, type) {
    resultList = [];
    for (let i = 0; i < data.length; i++) {
        resultList.push(`${i + 1}. ${data[i][name]}`)
    }
    let resultsSummary = `Found ${data.length} ${type} matching **${query}**.`
    let results = resultList.join('\n');
    let userInstructions = `Please type the number corresponding to your selection, or press 'c' to cancel.`;

    return `${resultsSummary}\n\n\`\`\`md\n${results}\n\`\`\`\n${userInstructions}`;
}

module.exports = {
    results
}