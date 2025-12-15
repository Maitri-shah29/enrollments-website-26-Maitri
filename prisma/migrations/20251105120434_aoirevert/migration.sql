/*
  Warnings:

  - The values [uiux,videoediting,motiongraphics,illustrations,pixar,aiml,blockchain,cybersecurity,bioinformatics,quantum,iot] on the enum `Domain` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
ALTER TYPE "Domain"DROP VALUE 'uiux';
ALTER TYPE "Domain"DROP VALUE 'videoediting';
ALTER TYPE "Domain"DROP VALUE 'motiongraphics';
ALTER TYPE "Domain"DROP VALUE 'illustrations';
ALTER TYPE "Domain"DROP VALUE 'pixar';
ALTER TYPE "Domain"DROP VALUE 'aiml';
ALTER TYPE "Domain"DROP VALUE 'blockchain';
ALTER TYPE "Domain"DROP VALUE 'cybersecurity';
ALTER TYPE "Domain"DROP VALUE 'bioinformatics';
ALTER TYPE "Domain"DROP VALUE 'quantum';
ALTER TYPE "Domain"DROP VALUE 'iot';
