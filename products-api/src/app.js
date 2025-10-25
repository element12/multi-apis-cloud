import express from "express";
import cors from "cors";
import { connectDB, products } from "./db.js";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4002;
const USERS_API_URL = process.env.USERS_API_URL || "http://users-api:4001";

await connectDB();

app.get("/db/health", async (_req, res) => {
  try {
    const count = await products.countDocuments();
    res.json({ ok: true, count });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
});

app.post("/products", async (req, res) => {
  const { name, price } = req.body ?? {};
  if (!name || !price)
    return res.status(400).json({ error: "nombre & price required" });

  try {
    const result = await products.insertOne({ name, price });
    res.status(201).json({ id: result.insertedId, name, price });
  } catch (e) {
    res.status(500).json({ error: "insert failed", detail: String(e) });
  }
});

app.put("/products/:id", async (req, res) => {
  const { id } = req.params ?? {};
  const { name, price } = req.body ?? {};

  if (!id || !name || !price)
    return res.status(400).json({ error: "id, name & price required" });

  try {
    const { ObjectId } = await import("mongodb");
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "invalid id format" });
    }

    const r = await products.updateOne(
      { _id: new ObjectId(id) },
      { $set: { name, price } }
    );

    if (r.matchedCount === 0) {
      return res.status(404).json({ error: "product not found" });
    }

    const updated = await products.findOne({ _id: new ObjectId(id) });
    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: "update failed", detail: String(e) });
  }
});

app.delete("/products/:id", async (req, res) => {
  const { id } = req.params ?? {};
  if (!id) return res.status(400).json({ error: "id required" });

  try {
    const { ObjectId } = await import("mongodb");
    const r = await products.deleteOne({ _id: new ObjectId(id) });
    if (r.deletedCount === 0)
      return res.status(404).json({ error: "product not found" });
    res.json({ deletedId: id });
  } catch (e) {
    res.status(500).json({ error: "delete failed", detail: String(e) });
  }
});

app.get("/products/with-users", async (_req, res) => {
  try {
    const u = await fetch(`${USERS_API_URL}/users`);
    const users = await u.json();
    const productsList = await products.find().toArray();
    res.json({
      products: productsList,
      usersCount: Array.isArray(users) ? users.length : 0,
    });
  } catch (e) {
    res.status(502).json({ error: "No se pudo consultar users-api", detail: String(e) });
  }
});

app.get("/products", async (_req, res) => {
  try {
    const data = await products.find().toArray();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: "query failed", detail: String(e) });
  }
});

app.get("/products/:id", async (req, res) => {
  const { id } = req.params ?? {};
  if (!id) return res.status(400).json({ error: "id required" });

  try {
    const { ObjectId } = await import("mongodb");
    const doc = await products.findOne({ _id: new ObjectId(id) });
    if (!doc) return res.status(404).json({ error: "product not found" });
    res.json(doc);
  } catch (e) {
    res.status(500).json({ error: "query failed", detail: String(e) });
  }
});

app.get("/health", (_req, res) => res.json({ status: "ok", service: "products-api" }));

app.listen(PORT, () => console.log(`✅ products-api on http://localhost:${PORT}`));
