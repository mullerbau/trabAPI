/*
  Warnings:

  - You are about to drop the `estoque` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `estoque` DROP FOREIGN KEY `estoque_livroId_fkey`;

-- DropTable
DROP TABLE `estoque`;
