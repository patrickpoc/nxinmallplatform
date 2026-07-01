-- Fair booth pilot: FAIR_VENDOR role, FairBooth model, sales channel, guest checkout fields

-- CreateEnum
CREATE TYPE "SalesChannel" AS ENUM ('MARKETPLACE', 'FAIR');
CREATE TYPE "ProductImageKind" AS ENUM ('GALLERY', 'DESCRIPTION');
CREATE TYPE "PixKeyType" AS ENUM ('CPF', 'CNPJ', 'EMAIL', 'PHONE', 'RANDOM');

-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'FAIR_VENDOR';

-- AlterTable Product
ALTER TABLE "Product" ADD COLUMN "salesChannel" "SalesChannel" NOT NULL DEFAULT 'MARKETPLACE';

-- AlterTable ProductImage
ALTER TABLE "ProductImage" ADD COLUMN "kind" "ProductImageKind" NOT NULL DEFAULT 'GALLERY';

-- AlterTable Order
ALTER TABLE "Order" ALTER COLUMN "buyerId" DROP NOT NULL;
ALTER TABLE "Order" ADD COLUMN "salesChannel" "SalesChannel" NOT NULL DEFAULT 'MARKETPLACE';
ALTER TABLE "Order" ADD COLUMN "fairBoothId" TEXT;
ALTER TABLE "Order" ADD COLUMN "guestName" TEXT;
ALTER TABLE "Order" ADD COLUMN "guestEmail" TEXT;
ALTER TABLE "Order" ADD COLUMN "guestPhone" TEXT;
ALTER TABLE "Order" ADD COLUMN "guestCpf" TEXT;

-- CreateTable FairBooth
CREATE TABLE "FairBooth" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "legalName" TEXT,
    "cnpj" TEXT,
    "country" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "street" TEXT,
    "city" TEXT,
    "state" TEXT,
    "postalCode" TEXT,
    "addressCountry" TEXT,
    "phone" TEXT,
    "whatsappNumber" TEXT,
    "quotationUrl" TEXT,
    "pixKey" TEXT,
    "pixKeyType" "PixKeyType",
    "pixBeneficiaryName" TEXT,
    "logoUrl" TEXT,
    "bannerUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FairBooth_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "FairBooth_userId_key" ON "FairBooth"("userId");
CREATE UNIQUE INDEX "FairBooth_slug_key" ON "FairBooth"("slug");

ALTER TABLE "FairBooth" ADD CONSTRAINT "FairBooth_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Order" ADD CONSTRAINT "Order_fairBoothId_fkey" FOREIGN KEY ("fairBoothId") REFERENCES "FairBooth"("id") ON DELETE SET NULL ON UPDATE CASCADE;
