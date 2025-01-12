require('dotenv').config(); // Load environment variables from .env

const neo4j = require('neo4j-driver');

// Use environment variables for Neo4j configuration
const driver = neo4j.driver(
  process.env.NEO4J_URI, // Use the URI from .env
  neo4j.auth.basic(process.env.NEO4J_USER, process.env.NEO4J_PASSWORD) // Use credentials from .env
);

module.exports = driver;
