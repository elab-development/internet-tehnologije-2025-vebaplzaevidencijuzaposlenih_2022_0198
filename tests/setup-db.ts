import { beforeEach, afterAll } from "vitest";
import { resetDb, disconnectDb } from "./helpers/db";

beforeEach(async () => {
  await resetDb();
});

afterAll(async () => {
  await disconnectDb();
});
