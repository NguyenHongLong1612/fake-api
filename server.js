const express = require("express");
const jsonServer = require("json-server");
const path = require("path");
const bodyParser = require("body-parser");

const app = express();
const router = jsonServer.router(path.join(__dirname, "db.json"));
const middlewares = jsonServer.defaults();

app.use(middlewares);
app.use(bodyParser.json());

// GET tất cả users với search, sort, pagination
app.get("/api/users", (req, res) => {
  const page = req.query.page;
  const per_page = req.query.per_page;

  if (!page || !per_page) {
    return res
      .status(400)
      .json({ error: "Missing required query parameters: page and per_page" });
  }

  // chuyển page, per_page sang số
  const pageNum = parseInt(page, 10);
  const perPageNum = parseInt(per_page, 10);

  if (isNaN(pageNum) || isNaN(perPageNum) || pageNum < 1 || perPageNum < 1) {
    return res.status(400).json({ error: "Invalid page or per_page value" });
  }

  const db = router.db;
  let users = structuredClone(db.get("users").value());

  // search và sort như bình thường (tuỳ chọn)

  if (req.query.search) {
    const search = req.query.search.toLowerCase();
    users = users.filter(
      (u) =>
        u.name.toLowerCase().includes(search) ||
        u.email.toLowerCase().includes(search) ||
        u.address.toLowerCase().includes(search)
    );
  }

  const sortBy = req.query.sortBy;
  const order = (req.query.order || "asc").toLowerCase();
  if (sortBy) {
    users = users.sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];

      if (aVal == null || bVal == null) return 0;

      if (typeof aVal === "number" && typeof bVal === "number") {
        return order === "asc" ? aVal - bVal : bVal - aVal;
      }

      return order === "asc"
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
  }

  const total = users.length;
  const start = (pageNum - 1) * perPageNum;
  const end = start + perPageNum;
  const paginated = users.slice(start, end);

  return res.json({
    total,
    from: total === 0 ? 0 : start + 1,
    to: Math.min(end, total),
    data: paginated,
  });
});

// GET user theo id
app.get("/api/users/:id", (req, res) => {
  const user = router.db
    .get("users")
    .find({ id: Number(req.params.id) })
    .value();

  console.log("Found user:", user);

  if (!user) return res.status(404).json({ error: "User not found" });
  res.json(user);
});

// POST tạo mới user
app.post("/api/users", (req, res) => {
  const { name, email, address } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const users = router.db.get("users");
  const id = users.value().reduce((max, u) => Math.max(max, u.id), 0) + 1;

  const newUser = { id, name, email, address };
  users.push(newUser).write();
  res.status(201).json(newUser);
});

// PUT cập nhật toàn bộ user
app.put("/api/users/:id", (req, res) => {
  const { name, email, address } = req.body;
  const user = router.db.get("users").find({ id: Number(req.params.id) });
  if (!user.value()) return res.status(404).json({ error: "User not found" });

  const updated = { id: Number(req.params.id), name, email, address };
  user.assign(updated).write();
  res.json(updated);
});

// PATCH cập nhật một phần user
app.patch("/api/users/:id", (req, res) => {
  const user = router.db.get("users").find({ id: Number(req.params.id) });
  if (!user.value()) return res.status(404).json({ error: "User not found" });

  const updated = user.assign(req.body).write();
  res.json(updated);
});

// DELETE xoá user
app.delete("/api/users/:id", (req, res) => {
  const user = router.db
    .get("users")
    .find({ id: Number(req.params.id) })
    .value();
  if (!user) return res.status(404).json({ error: "User not found" });

  router.db
    .get("users")
    .remove({ id: Number(req.params.id) })
    .write();
  res.status(204).end();
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`✅ Server chạy tại http://localhost:${PORT}`);
});
