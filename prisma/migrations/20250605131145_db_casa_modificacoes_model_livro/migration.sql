/*
  Warnings:

  - Added the required column `autor` to the `livros` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `livros` ADD COLUMN `autor` VARCHAR(30) NOT NULL;
