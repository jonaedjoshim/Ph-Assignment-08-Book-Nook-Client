import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const databaseName = process.env.DB_NAME;

if (!uri) {
  throw new Error("MONGODB_URI is missing from the client environment.");
}

if (!databaseName) {
  throw new Error("DB_NAME is missing from the client environment.");
}

const globalForMongo = globalThis as typeof globalThis & {
  bookNookMongoClient?: MongoClient;
};

const client = globalForMongo.bookNookMongoClient ?? new MongoClient(uri);

if (process.env.NODE_ENV !== "production") {
  globalForMongo.bookNookMongoClient = client;
}

export const db = client.db(databaseName);
