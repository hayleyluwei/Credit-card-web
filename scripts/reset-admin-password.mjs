/**
 * 重設管理員密碼（由使用者本人在終端機執行）
 *
 * 設計原則：
 * - 密碼在「執行這支腳本的電腦上」用 crypto 亂數產生，只印在該終端機一次。
 *   AI 不產生、不接收、不記錄密碼。
 * - 只更新 AdminUser.passwordHash，不動 email、不動 .env、不碰其他資料表。
 * - 預設是 dry-run：不加 --confirm 只會顯示將影響哪個帳號，不會真的寫入。
 *
 * ⚠️ 本專案的 .env DATABASE_URL 直接指向正式站 Neon PostgreSQL，
 *    沒有獨立的本機開發資料庫。因此這支腳本改的就是「正式站」的後台密碼。
 *
 * 用法：
 *   node scripts/reset-admin-password.mjs               # 預覽，不寫入
 *   node scripts/reset-admin-password.mjs --confirm     # 實際重設
 *   node scripts/reset-admin-password.mjs --confirm --email you@example.com
 */

import { randomInt } from "node:crypto";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const args = process.argv.slice(2);
const confirmed = args.includes("--confirm");
const emailFlagIndex = args.indexOf("--email");
const targetEmail = emailFlagIndex >= 0 ? args[emailFlagIndex + 1] : null;

/** 排除易混淆字元（0/O、1/l/I），避免抄寫時看錯。 */
const ALPHABET = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#%^&*-_=+";

function generatePassword(length = 24) {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += ALPHABET[randomInt(ALPHABET.length)];
  }
  return out;
}

function describeDatabaseHost() {
  try {
    const url = new URL(process.env.DATABASE_URL ?? "");
    const host = url.hostname;
    const isLocal = host === "localhost" || host === "127.0.0.1";
    return { host, isLocal };
  } catch {
    return { host: "(無法解析 DATABASE_URL)", isLocal: false };
  }
}

async function main() {
  const { host, isLocal } = describeDatabaseHost();

  const admins = await prisma.adminUser.findMany({
    select: { id: true, email: true, lastLoginAt: true },
    orderBy: { id: "asc" }
  });

  if (admins.length === 0) {
    console.error("找不到任何管理員帳號，請確認 DATABASE_URL 指向正確的資料庫。");
    process.exitCode = 1;
    return;
  }

  const target = targetEmail
    ? admins.find((admin) => admin.email.toLowerCase() === targetEmail.toLowerCase())
    : admins.length === 1
      ? admins[0]
      : null;

  if (!target) {
    console.error(
      targetEmail
        ? `找不到 email 為 ${targetEmail} 的管理員帳號。`
        : `資料庫有 ${admins.length} 個管理員帳號，請用 --email 指定要重設哪一個：\n` +
          admins.map((admin) => `  - ${admin.email}`).join("\n")
    );
    process.exitCode = 1;
    return;
  }

  console.log("");
  console.log("  資料庫主機 :", host, isLocal ? "(本機)" : "⚠️  非本機——這是正式站資料庫");
  console.log("  目標帳號   :", target.email);
  console.log("  最後登入   :", target.lastLoginAt ? target.lastLoginAt.toISOString().slice(0, 19) : "(無紀錄)");
  console.log("");

  if (!confirmed) {
    console.log("  這是預覽模式，尚未變更任何資料。");
    console.log("  確認以上資訊無誤後，重新執行並加上 --confirm：");
    console.log("");
    console.log("    node scripts/reset-admin-password.mjs --confirm");
    console.log("");
    return;
  }

  const password = generatePassword();
  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.adminUser.update({
    where: { id: target.id },
    data: { passwordHash }
  });

  console.log("  ✅ 密碼已重設。新密碼如下，只會顯示這一次：");
  console.log("");
  console.log("  ┌──────────────────────────────────────────────┐");
  console.log("   ", password);
  console.log("  └──────────────────────────────────────────────┘");
  console.log("");
  console.log("  請立刻存進密碼管理員。不要貼到聊天視窗、不要寫進任何檔案、不要 commit。");
  console.log("  登入網址：https://credit-card-web-pi.vercel.app/admin/login");
  console.log("");
}

main()
  .catch((error) => {
    console.error("重設失敗：", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
