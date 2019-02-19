module.exports = `
input StringWhere {
    is: String
    not: String
    in: [String]
    not_in: [String]
    lt: String
    lte: String
    gt: String
    gte: String
    contains: String
    not_contains: String
    starts_with: String
    not_starts_with: String
    ends_with: String
    not_ends_with: String
}

input DateTimeWhere {
    is: String
    not: String
    in: [String]
    not_in: [String]
    lt: String
    lte: String
    gt: String
    gte: String
}

input DateRangeWhere {
    containsDate: String
}

input BooleanWhere {
    is: Boolean!
}

`;
