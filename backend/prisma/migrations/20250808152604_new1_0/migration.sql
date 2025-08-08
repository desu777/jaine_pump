-- CreateTable
CREATE TABLE "simps" (
    "wallet_address" TEXT NOT NULL PRIMARY KEY,
    "simp_nick" TEXT NOT NULL,
    "common_deploys" INTEGER NOT NULL DEFAULT 0,
    "cope_harder_deploys" INTEGER NOT NULL DEFAULT 0,
    "maximum_cope_deploys" INTEGER NOT NULL DEFAULT 0,
    "ultimate_rejection_deploys" INTEGER NOT NULL DEFAULT 0,
    "ascended_simp_deploys" INTEGER NOT NULL DEFAULT 0,
    "legendary_ultra_deploys" INTEGER NOT NULL DEFAULT 0,
    "total_deploys" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "wallet_address" TEXT NOT NULL,
    "nonce" TEXT,
    "expires_at" DATETIME NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sessions_wallet_address_fkey" FOREIGN KEY ("wallet_address") REFERENCES "simps" ("wallet_address") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "contract_templates" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "rarity" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "description" TEXT,
    "total_deployments" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "deployments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "wallet_address" TEXT NOT NULL,
    "contract_address" TEXT NOT NULL,
    "template_id" INTEGER NOT NULL,
    "tx_hash" TEXT NOT NULL,
    "block_number" INTEGER,
    "gas_used" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "deployments_wallet_address_fkey" FOREIGN KEY ("wallet_address") REFERENCES "simps" ("wallet_address") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "deployments_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "contract_templates" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "compilation_cache" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "template_id" INTEGER NOT NULL,
    "source_hash" TEXT NOT NULL,
    "abi" TEXT NOT NULL,
    "bytecode" TEXT NOT NULL,
    "metadata" TEXT,
    "compiled_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "simps_simp_nick_key" ON "simps"("simp_nick");

-- CreateIndex
CREATE INDEX "simps_total_deploys_idx" ON "simps"("total_deploys");

-- CreateIndex
CREATE INDEX "simps_created_at_idx" ON "simps"("created_at");

-- CreateIndex
CREATE INDEX "sessions_wallet_address_idx" ON "sessions"("wallet_address");

-- CreateIndex
CREATE INDEX "sessions_expires_at_idx" ON "sessions"("expires_at");

-- CreateIndex
CREATE INDEX "sessions_nonce_idx" ON "sessions"("nonce");

-- CreateIndex
CREATE UNIQUE INDEX "contract_templates_name_key" ON "contract_templates"("name");

-- CreateIndex
CREATE INDEX "contract_templates_rarity_idx" ON "contract_templates"("rarity");

-- CreateIndex
CREATE INDEX "contract_templates_total_deployments_idx" ON "contract_templates"("total_deployments");

-- CreateIndex
CREATE UNIQUE INDEX "deployments_tx_hash_key" ON "deployments"("tx_hash");

-- CreateIndex
CREATE INDEX "deployments_wallet_address_idx" ON "deployments"("wallet_address");

-- CreateIndex
CREATE INDEX "deployments_template_id_idx" ON "deployments"("template_id");

-- CreateIndex
CREATE INDEX "deployments_created_at_idx" ON "deployments"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "compilation_cache_source_hash_key" ON "compilation_cache"("source_hash");

-- CreateIndex
CREATE INDEX "compilation_cache_template_id_idx" ON "compilation_cache"("template_id");

-- CreateIndex
CREATE INDEX "compilation_cache_source_hash_idx" ON "compilation_cache"("source_hash");

-- CreateIndex
CREATE INDEX "compilation_cache_compiled_at_idx" ON "compilation_cache"("compiled_at");
