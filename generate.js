const fs = require("fs");
const { faker } = require("@faker-js/faker");

const users = [];

for (let i = 1; i <= 60; i++) {
  users.push({
    id: i,
    name: faker.person.fullName(),
    email: faker.internet.email(),
    address: faker.location.streetAddress(),
  });
}

const db = { users };

fs.writeFileSync("db.json", JSON.stringify(db, null, 2));
console.log("✅ db.json with 60 users generated!");
