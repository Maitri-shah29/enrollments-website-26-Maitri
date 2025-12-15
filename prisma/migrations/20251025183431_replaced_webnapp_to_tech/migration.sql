/*
  Warnings:

  - The values [web,app] on the enum `Domain` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
ALTER TYPE "Domain" ADD VALUE 'tech';
ALTER TYPE "Domain"DROP VALUE 'web';
ALTER TYPE "Domain"DROP VALUE 'app';
