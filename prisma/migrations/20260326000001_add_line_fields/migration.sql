-- AlterTable: 予約者のLINEユーザーIDとリマインド送信済みフラグを追加
ALTER TABLE "Reservation" ADD COLUMN "lineUserId" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Reservation" ADD COLUMN "reminded" BOOLEAN NOT NULL DEFAULT false;
