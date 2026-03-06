import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ??
  (() => {
    const envUrl =
      process.env.NODE_ENV === "production"
        ? process.env.DATABASE_URL_PROD
        : process.env.DATABASE_URL_DEV;

    if (!process.env.DATABASE_URL && envUrl) {
      process.env.DATABASE_URL = envUrl;
    }

    return new PrismaClient({
      log: ["error", "warn"],
    });
  })();

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}
