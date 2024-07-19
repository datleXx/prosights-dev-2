ALTER TABLE "aichat_email" ADD COLUMN "user_id" varchar(255) NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "aichat_email" ADD CONSTRAINT "aichat_email_user_id_aichat_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."aichat_user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
