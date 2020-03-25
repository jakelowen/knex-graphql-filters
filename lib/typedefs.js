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

input IdWhere {
    is: ID
    not: ID
    in: [ID]
    not_in: [ID]
    lt: ID
    lte: ID
    gt: ID
    gte: ID
}

input IntWhere {
    is: Int
    not: Int
    in: [Int]
    not_in: [Int]
    lt: Int
    lte: Int
    gt: Int
    gte: Int
}

input FloatWhere {
    is: Float
    not: Float
    in: [Float]
    not_in: [Float]
    lt: Float
    lte: Float
    gt: Float
    gte: Float
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

input DateTimeRange {
    start: String!
    end: String!
}

scalar GraphQLDate

input DateRange {
    startDate: GraphQLDate!
    endDate: GraphQLDate!
}

input StringRange {
    start: String!
    end: String!
}

input DateRangeWhere {
    containsDate: String
    containsDateRange: DateRange
    overlapsDateRange: DateRange
}

input BooleanWhere {
    is: Boolean!
}

`;
