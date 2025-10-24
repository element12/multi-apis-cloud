import { MongoClient } from "mongodb";
import "dotenv/config";

const uri = process.env.DATABASE_URL_MONGO; // tu cadena de conexión Cosmos DB Mongo API

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  ssl: true,
});

let db;
let products;

export async function connectDB() {
  try {
    if (!db) {
      await client.connect();
      db = client.db("productsdb");
      products = db.collection("products");
      console.log("Conectado a Cosmos DB (Mongo API)");
    }
    return { db, products };
  } catch (err) {
    console.error("Error conectando a Cosmos DB:", err);
    process.exit(1);
  }
}

export { db, products };
