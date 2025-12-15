import { MongoClient } from "mongodb";

if (!process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
}

const uri = process.env.MONGODB_URI;
const options = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === "development") {
  const globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options);
    globalWithMongo._mongoClientPromise = client.connect().then(async (c) => {
      try {
        await c
          .db("acm_enrollments")
          .collection("user_searches")
          .createIndex({ email: 1, timestamp: -1 });
      } catch (e) {
        console.error("Failed to create index:", e);
      }
      return c;
    });
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  client = new MongoClient(uri, options);
  clientPromise = client.connect().then(async (c) => {
    try {
      await c
        .db("acm_enrollments")
        .collection("user_searches")
        .createIndex({ email: 1, timestamp: -1 });
    } catch (e) {
      console.error("Failed to create index:", e);
    }
    return c;
  });
}

export default clientPromise;
