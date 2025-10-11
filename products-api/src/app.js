import express from "express";
import cors from "cors";
import { pool } from "./db.js";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4002;
const USERS_API_URL = process.env.USERS_API_URL || "http://users-api:4001";

// Health DB
app.get("/db/health", async (_req, res) => {
  try {
    const r = await pool.query("SELECT 1 AS ok");
    res.json({ ok: r.rows[0].ok === 1 });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
});

// Crear usuario (INSERT real)
app.post("/products", async (req, res) => {
  const { name, price } = req.body ?? {};
  if (!name || !price) return res.status(400).json({ error: "name & price required" });

  try {
    const r = await pool.query(
      "INSERT INTO products_schema.products(name, price) VALUES($1, $2) RETURNING id, name, price",
      [name, price]
    );
    res.status(201).json(r.rows[0]);
  } catch (e) {
    res.status(500).json({ error: "insert failed", detail: String(e) });
  }
});

app.put("/products/:id", async (req, res) => {
  const { id } = req.params ?? {};
  const { name, price } = req.body ?? {};
  if (!id || !name || !price) return res.status(400).json({ error: "id, name & price required" });

  try {
    const r = await pool.query(
      "UPDATE products_schema.products SET name = $1, price = $2 WHERE id = $3 RETURNING id, name, price",
      [name, price, id]
    );
    if (r.rowCount === 0) return res.status(404).json({ error: "product not found" });
    res.json(r.rows[0]);
  } catch (e) {
    res.status(500).json({ error: "update failed", detail: String(e) });
  }
});

app.delete("/products/:id", async (req, res) => {
  const { id } = req.params ?? {};
  if (!id) return res.status(400).json({ error: "id required" });

  try {
    const r = await pool.query("DELETE FROM products_schema.products WHERE id = $1 RETURNING id", [id]);
    if (r.rowCount === 0) return res.status(404).json({ error: "product not found" });
    res.json({ deletedId: r.rows[0].id });
  } catch (e) {
    res.status(500).json({ error: "delete failed", detail: String(e) });
  }
});


// Listar (SELECT real)

app.get("/products/with-users", async (_req, res) => {
  try {
    // const u = await pool.query("SELECT id, name, email FROM users_schema.users ORDER BY id ASC");
    const u = await fetch(`${USERS_API_URL}/users`);
    const p = await pool.query("SELECT id, name, price FROM products_schema.products ORDER BY id ASC");
    const users = await u.json();
    const products = p.rows;
    res.json({
      products,
      usersCount: Array.isArray(users) ? users.length : 0
    });
  } catch (e) {
    res.status(502).json({ error: "No se pudo consultar products-api", detail: String(e) });
  }
});

app.get("/products", async (_req, res) => {
  try {
    const r = await pool.query("SELECT id, name, price FROM products_schema.products ORDER BY id ASC");
    res.json(r.rows);
  } catch (e) {
    res.status(500).json({ error: "query failed", detail: String(e) });
  }
});

app.get("/products/:id", async (req, res) => {
  const { id } = req.params ?? {};
  if (!id) return res.status(400).json({ error: "id required" });

  try {
    const r = await pool.query("SELECT id, name, price FROM products_schema.products WHERE id = $1", [id]);
    if (r.rowCount === 0) return res.status(404).json({ error: "product not found" });
    res.json(r.rows[0]);
  } catch (e) {
    res.status(500).json({ error: "query failed", detail: String(e) });
  }
});


// Mantén /health si ya lo tenías
app.get("/health", (_req, res) => res.json({ status: "ok", service: "products-api" }));

app.listen(PORT, () => console.log(`✅ products-api on http://localhost:${PORT}`));