const { applyFilters } = require("./index");
const faker = require("faker");

var knex = require("knex")({
  client: "pg",
  connection: process.env.DATABASE_URL
});

const createTestUser = async (name, email, active = true) => {
  const [record] = await knex("users")
    .insert({
      name: name || `${faker.name.firstName()} ${faker.name.lastName()}`,
      email: email || faker.internet.email().toLowerCase(),
      active
    })
    .returning("*");

  return record;
};

beforeAll(async () => {
  await knex.raw('create extension if not exists "uuid-ossp"');
  await knex.schema.dropTableIfExists("users");
  await knex.schema.createTable("users", t => {
    t.uuid("id")
      .primary()
      .notNull()
      .defaultTo(knex.raw("uuid_generate_v4()"));
    t.string("name").notNull();
    t.string("email").notNull();
    t.boolean("active").defaultTo(true);
  });
});

beforeEach(async () => {
  await knex.raw("TRUNCATE TABLE users;");
});

const makeUserFilterQueryCall = async where => {
  let query = knex("users");
  query = applyFilters(query, where);
  const results = await query.select();
  return results;
};

describe("Filter Query", () => {
  test("Root args / is", async () => {
    const user = await createTestUser();
    const results = await makeUserFilterQueryCall({
      email: { is: user.email }
    });

    expect(results[0].id).toEqual(user.id);
  });

  test("not", async () => {
    const user1 = await createTestUser();
    const user2 = await createTestUser();

    const results = await makeUserFilterQueryCall({
      email: { not: user2.email }
    });
    expect(results.length).toEqual(1);
    expect(results[0].id).toEqual(user1.id);
  });

  test("in", async () => {
    const user1 = await createTestUser();
    await createTestUser();

    const results = await makeUserFilterQueryCall({
      email: { in: [user1.email] }
    });

    expect(results.length).toEqual(1);
    expect(results[0].id).toEqual(user1.id);
  });

  test("not in", async () => {
    const user1 = await createTestUser();
    const user2 = await createTestUser();

    const results = await makeUserFilterQueryCall({
      email: { not_in: [user1.email] }
    });

    expect(results.length).toEqual(1);
    expect(results[0].id).toEqual(user2.id);
  });

  test("lt / lte", async () => {
    const user1 = await createTestUser(null, "aaaa");
    await createTestUser(null, "bbbb");

    const results = await makeUserFilterQueryCall({
      email: { lt: "aaac" }
    });

    expect(results.length).toEqual(1);
    expect(results[0].id).toEqual(user1.id);

    const results2 = await makeUserFilterQueryCall({
      email: { lt: user1.email }
    });

    expect(results2.length).toEqual(0);

    const results3 = await makeUserFilterQueryCall({
      email: { lte: user1.email }
    });

    expect(results3.length).toEqual(1);
    expect(results3[0].id).toEqual(user1.id);
  });

  test("gt / gte", async () => {
    await createTestUser(null, "aaaa");
    const user2 = await createTestUser(null, "bbbb");

    const results = await makeUserFilterQueryCall({
      email: { gt: "aaac" }
    });

    expect(results.length).toEqual(1);
    expect(results[0].id).toEqual(user2.id);

    const results2 = await makeUserFilterQueryCall({
      email: { gt: user2.email }
    });

    expect(results2.length).toEqual(0);

    const results3 = await makeUserFilterQueryCall({
      email: { gte: user2.email }
    });

    expect(results3.length).toEqual(1);
    expect(results3[0].id).toEqual(user2.id);
  });

  test("contains / not contains", async () => {
    const user1 = await createTestUser(null, "user1@test.com");
    const user2 = await createTestUser(null, "user2@test.com");

    const results = await makeUserFilterQueryCall({
      email: { contains: "user1" }
    });

    expect(results.length).toEqual(1);
    expect(results[0].id).toEqual(user1.id);

    const results2 = await makeUserFilterQueryCall({
      email: { not_contains: "user1" }
    });

    expect(results2.length).toEqual(1);
    expect(results2[0].id).toEqual(user2.id);
  });

  test("starts_with / not_starts_with", async () => {
    const user1 = await createTestUser(null, "user1@test.com");
    const user2 = await createTestUser(null, "user2@test.com");

    const results = await makeUserFilterQueryCall({
      email: { starts_with: "user" }
    });

    expect(results.length).toEqual(2);

    const results2 = await makeUserFilterQueryCall({
      email: { starts_with: "user1" }
    });

    expect(results2.length).toEqual(1);
    expect(results2[0].id).toEqual(user1.id);

    const results3 = await makeUserFilterQueryCall({
      email: { not_starts_with: "user1" }
    });

    expect(results3.length).toEqual(1);
    expect(results3[0].id).toEqual(user2.id);

    const results4 = await makeUserFilterQueryCall({
      email: { not_starts_with: "user" }
    });

    expect(results4.length).toEqual(0);
  });

  test("ends_with / not_ends_with", async () => {
    const user1 = await createTestUser(null, "user1@user1.com");
    const user2 = await createTestUser(null, "user2@user2.com");

    const results = await makeUserFilterQueryCall({
      email: { ends_with: ".com" }
    });

    expect(results.length).toEqual(2);

    const results2 = await makeUserFilterQueryCall({
      email: { ends_with: "user1.com" }
    });

    expect(results2.length).toEqual(1);
    expect(results2[0].id).toEqual(user1.id);

    const results3 = await makeUserFilterQueryCall({
      email: { not_ends_with: "user1.com" }
    });

    expect(results3.length).toEqual(1);
    expect(results3[0].id).toEqual(user2.id);

    const results4 = await makeUserFilterQueryCall({
      email: { not_ends_with: ".com" }
    });

    expect(results4.length).toEqual(0);
  });

  test("AND / OR", async () => {
    const user1 = await createTestUser(null, "user1@user1.com");
    await createTestUser(null, "user2@user2.com");

    const results1 = await makeUserFilterQueryCall({
      AND: [
        { email: { ends_with: ".com" } },
        { email: { starts_with: "user1" } }
      ]
    });

    expect(results1.length).toEqual(1);
    expect(results1[0].id).toEqual(user1.id);

    // nested is same as multiple ands
    const results2 = await makeUserFilterQueryCall({
      AND: [{ email: { ends_with: ".com", starts_with: "user1" } }]
    });

    expect(results1).toEqual(results2);

    const results3 = await makeUserFilterQueryCall({
      OR: [
        { email: { ends_with: ".com" } },
        { email: { starts_with: "user1" } }
      ]
    });

    expect(results3.length).toEqual(2);

    const results4 = await makeUserFilterQueryCall({
      OR: [{ email: { ends_with: ".com", starts_with: "user1" } }]
    });

    expect(results4).toEqual(results3);
  });

  test("OR overwrite bug", async () => {
    const user1 = await createTestUser(null, "user1@user1.com");
    await createTestUser(null, "user2@user2.com");

    const results1 = await makeUserFilterQueryCall({
      OR: [
        { email: { starts_with: "user1" } },
        { email: { starts_with: "user2" } }
      ]
    });

    expect(results1.length).toBe(2);
  });
});
