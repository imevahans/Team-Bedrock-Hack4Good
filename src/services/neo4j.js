import neo4j from "neo4j-driver";

// Access environment variables using import.meta.env
const driver = neo4j.driver(
  import.meta.env.VITE_NEO4J_URI, // URI for Neo4j
  neo4j.auth.basic(
    import.meta.env.VITE_NEO4J_USER, // Username
    import.meta.env.VITE_NEO4J_PASSWORD // Password
  )
);

export default driver;
