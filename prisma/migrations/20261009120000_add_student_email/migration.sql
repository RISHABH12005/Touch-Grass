-- Preserve existing users while adding the optional email field.
ALTER TABLE "User" ADD COLUMN "studentEmail" TEXT;
CREATE UNIQUE INDEX "User_studentEmail_key" ON "User"("studentEmail");
