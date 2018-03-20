function randStatus(){
    const statuses = [
        'Active',
        'Paused',
        'Awaiting Responses',
        'Failed'
    ]

    return statuses[ Math.floor( Math.random() * statuses.length ) ];
}

module.exports.randStatus = randStatus;