function epochToDateString(epoch){
    const dateObj = new Date(epoch * 1000);
    return formatDate(dateObj);
}

function formatDate(dateObj) {
    const day = dateObj.getDate();
    const month = dateObj.getMonth() + 1; // Gives month index from 0-11 therefore we add 1 to adjust for this
    const year = dateObj.getFullYear();
    return `${month}-${day}-${year}`;
}

module.exports.epochToDateString = epochToDateString;