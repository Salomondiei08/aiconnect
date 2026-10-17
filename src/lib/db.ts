import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

/** Un seul client par processus, même après les rechargements à chaud du développement. */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function client(): PrismaClient {
  if (globalForPrisma.prisma) return globalForPrisma.prisma;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL est requis");
  globalForPrisma.prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  return globalForPrisma.prisma;
}

/**
 * Client créé au premier usage, pas à l'import : le build (image Docker) n'a pas de base
 * et n'en a pas besoin, seules les requêtes réelles en ont besoin.
 */
export const db = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const instance = client();
    const value = Reflect.get(instance, prop);
    return typeof value === "function" ? value.bind(instance) : value;
  },
});
