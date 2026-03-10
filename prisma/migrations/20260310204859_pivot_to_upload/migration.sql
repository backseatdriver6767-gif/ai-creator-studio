-- CreateEnum
CREATE TYPE "PersonaStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ContentType" AS ENUM ('REEL', 'STORY', 'POST', 'PODCAST', 'AD', 'TUTORIAL');

-- CreateEnum
CREATE TYPE "ContentFormat" AS ENUM ('VIDEO', 'IMAGE', 'CAROUSEL', 'AUDIO');

-- CreateEnum
CREATE TYPE "Platform" AS ENUM ('INSTAGRAM', 'TIKTOK', 'YOUTUBE', 'FACEBOOK', 'TWITTER', 'LINKEDIN');

-- CreateEnum
CREATE TYPE "PipelineStatus" AS ENUM ('DRAFT', 'VIDEO_UPLOADED', 'SCHEDULED', 'PUBLISHED', 'FAILED');

-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');

-- CreateTable
CREATE TABLE "AIPersona" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "PersonaStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIPersona_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentPiece" (
    "id" TEXT NOT NULL,
    "personaId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "videoUrl" TEXT,
    "thumbnailUrl" TEXT,
    "type" "ContentType" NOT NULL,
    "format" "ContentFormat" NOT NULL,
    "platform" "Platform"[],
    "duration" INTEGER,
    "aspectRatio" TEXT,
    "status" "PipelineStatus" NOT NULL DEFAULT 'DRAFT',
    "scheduledAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "postIds" JSONB,
    "views" INTEGER,
    "likes" INTEGER,
    "comments" INTEGER,
    "shares" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "campaignId" TEXT,

    CONSTRAINT "ContentPiece_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL,
    "personaId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "niche" TEXT,
    "productUrl" TEXT,
    "checkoutUrl" TEXT,
    "manychatKeyword" TEXT,
    "contentIdeas" JSONB,
    "postingSchedule" JSONB,
    "platforms" "Platform"[],
    "status" "CampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "stripeProductId" TEXT,
    "stripePriceId" TEXT,
    "checkoutUrl" TEXT,
    "campaignId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "stripeSessionId" TEXT,
    "stripePaymentId" TEXT,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "customerEmail" TEXT,
    "customerName" TEXT,
    "source" TEXT,
    "manychatContactId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialAccount" (
    "id" TEXT NOT NULL,
    "personaId" TEXT NOT NULL,
    "platform" "Platform" NOT NULL,
    "username" TEXT NOT NULL,
    "accountId" TEXT,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "tokenExpiry" TIMESTAMP(3),
    "manychatPageId" TEXT,
    "lateAccountId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Setting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Setting_key_key" ON "Setting"("key");

-- AddForeignKey
ALTER TABLE "ContentPiece" ADD CONSTRAINT "ContentPiece_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "AIPersona"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentPiece" ADD CONSTRAINT "ContentPiece_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "AIPersona"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialAccount" ADD CONSTRAINT "SocialAccount_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "AIPersona"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
