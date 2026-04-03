generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlserver"
  url      = env("DATABASE_URL")
}

model User {
  id            String    @id @default(uuid()) @db.VarChar(36)
  full_name     String?   @db.NVarChar(255)
  email         String?   @unique(map: "UQ__users__AB6E6164EE1340E1") @db.VarChar(255)
  avatar_url    String?   @db.NVarChar(Max)
  auth_provider String?   @db.VarChar(50)
  created_at    DateTime? @default(now(), map: "DF__users__created_a__5AEE82B9")
  password      String?   @db.VarChar(255)

  @@map("users")
}

model Wallet {
  id              String   @id(map: "PK__wallets__3213E83F84A70377") @default(uuid()) @db.VarChar(36)
  user_id         String?  @db.VarChar(36)
  name            String   @db.NVarChar(255)
  initial_balance BigInt?  @default(0, map: "DF__wallets__initial__5DCAEF64")
  currency        String?  @default("VND", map: "DF__wallets__currenc__5EBF139D") @db.VarChar(10)
  icon_id         String?  @db.VarChar(255)
  created_at      DateTime
  updated_at      DateTime
  is_active       Boolean? @default(true, map: "DF__wallets__is_acti__5FB337D6")

  @@map("wallets")
}

model Category {
  id        String  @id @default(uuid()) @db.VarChar(36)
  user_id   String? @db.VarChar(36)
  name      String  @db.NVarChar(255)
  type      String  @db.VarChar(20)
  icon_name String? @db.VarChar(255)

  @@map("categories")
}

model Transaction {
  id               String    @id @default(uuid()) @db.VarChar(36)
  wallet_id        String    @db.VarChar(36)
  category_id      String?   @db.VarChar(36)
  amount           BigInt
  type             String    @db.VarChar(20)
  transaction_date DateTime?
  icon_id          String?   @db.VarChar(255)
  note             String?   @db.NVarChar(Max)
  created_at       DateTime  @default(now(), map: "DF__transacti__creat__68487DD7")
  updated_at       DateTime  @default(now(), map: "DF__transacti__updat__693CA210")

  @@index([category_id], map: "idx_transactions_category")
  @@index([transaction_date], map: "idx_transactions_date")
  @@index([wallet_id], map: "idx_transactions_wallet")
  @@map("transactions")
}

model Budget {
  id            String    @id @default(uuid()) @db.VarChar(36)
  wallet_id     String    @db.VarChar(36)
  category_id   String    @db.VarChar(36)
  target_amount BigInt
  start_date    DateTime? @db.Date
  end_date      DateTime? @db.Date

  @@map("budgets")
}
