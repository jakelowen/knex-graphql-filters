const { applyFilters } = require("./index");
const faker = require("faker");

var knex = require("knex")({
  client: "pg",
  connection: process.env.DATABASE_URL
});

const createTestRecord = async (
  string_example,
  boolean_example,
  date_range_example
) => {
  const [record] = await knex("test_table")
    .insert({
      string_example: string_example || faker.lorem.word(),
      boolean_example: boolean_example || true,
      date_range_example: date_range_example || `['2018-01-01', '2018-12-31')`
    })
    .returning("*");

  return record;
};

beforeAll(async () => {
  await knex.raw('create extension if not exists "uuid-ossp"');
  await knex.schema.dropTableIfExists("test_table");
  await knex.schema.createTable("test_table", t => {
    t.uuid("id")
      .primary()
      .notNull()
      .defaultTo(knex.raw("uuid_generate_v4()"));
    t.string("string_example");
    t.boolean("boolean_example").defaultTo(true);
    t.specificType("date_range_example", "daterange");
  });
});

beforeEach(async () => {
  await knex.raw("TRUNCATE TABLE test_table;");
});

const makeApplyFilterQueryCall = async where => {
  let query = knex("test_table");
  query = applyFilters(query, where);
  const results = await query.select();
  return results;
};

describe("Filter Query", () => {
  test("Root args / is", async () => {
    const record = await createTestRecord();
    const results = await makeApplyFilterQueryCall({
      string_example: { is: record.string_example }
    });

    expect(results[0].id).toEqual(record.id);
  });

  test("not", async () => {
    const record1 = await createTestRecord();
    const record2 = await createTestRecord();

    const results = await makeApplyFilterQueryCall({
      string_example: { not: record2.string_example }
    });
    expect(results.length).toEqual(1);
    expect(results[0].id).toEqual(record1.id);
  });

  test("in", async () => {
    const record1 = await createTestRecord();
    await createTestRecord();

    const results = await makeApplyFilterQueryCall({
      string_example: { in: [record1.string_example] }
    });

    expect(results.length).toEqual(1);
    expect(results[0].id).toEqual(record1.id);
  });

  test("not in", async () => {
    const record1 = await createTestRecord();
    const record2 = await createTestRecord();

    const results = await makeApplyFilterQueryCall({
      string_example: { not_in: [record1.string_example] }
    });

    expect(results.length).toEqual(1);
    expect(results[0].id).toEqual(record2.id);
  });

  test("lt / lte", async () => {
    const record1 = await createTestRecord("aaaa");
    await createTestRecord("bbbb");

    const results = await makeApplyFilterQueryCall({
      string_example: { lt: "aaac" }
    });

    expect(results.length).toEqual(1);
    expect(results[0].id).toEqual(record1.id);

    const results2 = await makeApplyFilterQueryCall({
      string_example: { lt: record1.string_example }
    });

    expect(results2.length).toEqual(0);

    const results3 = await makeApplyFilterQueryCall({
      string_example: { lte: record1.string_example }
    });

    expect(results3.length).toEqual(1);
    expect(results3[0].id).toEqual(record1.id);
  });

  test("gt / gte", async () => {
    await createTestRecord("aaaa");
    const record2 = await createTestRecord("bbbb");

    const results = await makeApplyFilterQueryCall({
      string_example: { gt: "aaac" }
    });

    expect(results.length).toEqual(1);
    expect(results[0].id).toEqual(record2.id);

    const results2 = await makeApplyFilterQueryCall({
      string_example: { gt: record2.string_example }
    });

    expect(results2.length).toEqual(0);

    const results3 = await makeApplyFilterQueryCall({
      string_example: { gte: record2.string_example }
    });

    expect(results3.length).toEqual(1);
    expect(results3[0].id).toEqual(record2.id);
  });

  test("contains / not contains", async () => {
    const record1 = await createTestRecord("record1@test.com");
    const record2 = await createTestRecord("record2@test.com");

    const results = await makeApplyFilterQueryCall({
      string_example: { contains: "record1" }
    });

    expect(results.length).toEqual(1);
    expect(results[0].id).toEqual(record1.id);

    const results2 = await makeApplyFilterQueryCall({
      string_example: { not_contains: "record1" }
    });

    expect(results2.length).toEqual(1);
    expect(results2[0].id).toEqual(record2.id);
  });

  test("starts_with / not_starts_with", async () => {
    const record1 = await createTestRecord("record1@test.com");
    const record2 = await createTestRecord("record2@test.com");

    const results = await makeApplyFilterQueryCall({
      string_example: { starts_with: "record" }
    });

    expect(results.length).toEqual(2);

    const results2 = await makeApplyFilterQueryCall({
      string_example: { starts_with: "record1" }
    });

    expect(results2.length).toEqual(1);
    expect(results2[0].id).toEqual(record1.id);

    const results3 = await makeApplyFilterQueryCall({
      string_example: { not_starts_with: "record1" }
    });

    expect(results3.length).toEqual(1);
    expect(results3[0].id).toEqual(record2.id);

    const results4 = await makeApplyFilterQueryCall({
      string_example: { not_starts_with: "record" }
    });

    expect(results4.length).toEqual(0);
  });

  test("ends_with / not_ends_with", async () => {
    const record1 = await createTestRecord("record1@record1.com");
    const record2 = await createTestRecord("record2@record2.com");

    const results = await makeApplyFilterQueryCall({
      string_example: { ends_with: ".com" }
    });

    expect(results.length).toEqual(2);

    const results2 = await makeApplyFilterQueryCall({
      string_example: { ends_with: "record1.com" }
    });

    expect(results2.length).toEqual(1);
    expect(results2[0].id).toEqual(record1.id);

    const results3 = await makeApplyFilterQueryCall({
      string_example: { not_ends_with: "record1.com" }
    });

    expect(results3.length).toEqual(1);
    expect(results3[0].id).toEqual(record2.id);

    const results4 = await makeApplyFilterQueryCall({
      string_example: { not_ends_with: ".com" }
    });

    expect(results4.length).toEqual(0);
  });

  test("AND / OR", async () => {
    const record1 = await createTestRecord("record1@record1.com");
    await createTestRecord("record2@record2.com");

    const results1 = await makeApplyFilterQueryCall({
      AND: [
        { string_example: { ends_with: ".com" } },
        { string_example: { starts_with: "record1" } }
      ]
    });

    expect(results1.length).toEqual(1);
    expect(results1[0].id).toEqual(record1.id);

    // nested is same as multiple ands
    const results2 = await makeApplyFilterQueryCall({
      AND: [{ string_example: { ends_with: ".com", starts_with: "record1" } }]
    });

    expect(results1).toEqual(results2);

    const results3 = await makeApplyFilterQueryCall({
      OR: [
        { string_example: { ends_with: ".com" } },
        { string_example: { starts_with: "record1" } }
      ]
    });

    expect(results3.length).toEqual(2);

    const results4 = await makeApplyFilterQueryCall({
      OR: [{ string_example: { ends_with: ".com", starts_with: "record1" } }]
    });

    expect(results4).toEqual(results3);
  });

  test("OR overwrite bug", async () => {
    const record1 = await createTestRecord("record1@record1.com");
    await createTestRecord("record2@record2.com");

    const results1 = await makeApplyFilterQueryCall({
      OR: [
        { string_example: { starts_with: "record1" } },
        { string_example: { starts_with: "record2" } }
      ]
    });

    expect(results1.length).toBe(2);
  });

  test("containsDate", async () => {
    const record1 = await createTestRecord(
      undefined,
      undefined,
      `['2018-01-01', '2018-02-01')`
    );
    await createTestRecord(
      undefined,
      undefined,
      `['2018-10-01', '2018-11-01')`
    );

    const results = await makeApplyFilterQueryCall({
      date_range_example: { containsDate: "2018-01-15" }
    });
    expect(results.length).toBe(1);
    expect(results[0].id).toEqual(record1.id);
  });

  test("overlapsDateRange", async () => {
    const record1 = await createTestRecord(
      undefined,
      undefined,
      `['2018-01-01', '2018-02-01')`
    );
    await createTestRecord(
      undefined,
      undefined,
      `['2018-10-01', '2018-11-01')`
    );

    const results = await makeApplyFilterQueryCall({
      date_range_example: {
        overlapsDateRange: { startDate: "2018-01-01", endDate: "2018-12-31" }
      }
    });
    expect(results.length).toBe(2);

    const results2 = await makeApplyFilterQueryCall({
      date_range_example: {
        overlapsDateRange: { startDate: "2018-01-01", endDate: "2018-01-15" }
      }
    });
    expect(results2.length).toBe(1);

    const results3 = await makeApplyFilterQueryCall({
      date_range_example: {
        overlapsDateRange: { startDate: "2018-02-05", endDate: "2018-02-18" }
      }
    });
    expect(results3.length).toBe(0);
  });

  test("containsDateRange", async () => {
    const record1 = await createTestRecord(
      undefined,
      undefined,
      `['2018-01-01', '2018-02-01')`
    );
    await createTestRecord(
      undefined,
      undefined,
      `['2018-10-01', '2018-11-01')`
    );

    const results = await makeApplyFilterQueryCall({
      date_range_example: {
        containsDateRange: { startDate: "2018-01-01", endDate: "2018-12-31" }
      }
    });
    expect(results.length).toBe(0);

    const results2 = await makeApplyFilterQueryCall({
      date_range_example: {
        containsDateRange: { startDate: "2018-01-01", endDate: "2018-01-15" }
      }
    });
    expect(results2.length).toBe(1);

    const results3 = await makeApplyFilterQueryCall({
      date_range_example: {
        containsDateRange: { startDate: "2018-02-05", endDate: "2018-02-18" }
      }
    });
    expect(results3.length).toBe(0);
  });
});
