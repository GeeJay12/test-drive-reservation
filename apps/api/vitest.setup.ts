// Ensure Prisma client initialization doesn't fail during unit tests.
process.env.NODE_ENV ??= "test";

process.env.POSTGRES_HOST ??= "localhost";
process.env.POSTGRES_PORT ??= "5432";
process.env.POSTGRES_DB ??= "nevo";
process.env.POSTGRES_SCHEMA ??= "public";

process.env.POSTGRES_API_PASSWORD ??= "test_password";
process.env.POSTGRES_DBO_PASSWORD ??= "test_password_dbo";

