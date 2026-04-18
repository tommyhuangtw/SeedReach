import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const hash = await bcrypt.hash("admin123", 12);
  await prisma.user.upsert({
    where: { email: "admin@phargoods.com" },
    update: {},
    create: {
      email: "admin@phargoods.com",
      passwordHash: hash,
      name: "Admin",
    },
  });
  console.log("Seed completed: admin@phargoods.com / admin123");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
