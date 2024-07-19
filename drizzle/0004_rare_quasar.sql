CREATE TABLE IF NOT EXISTS "aichat_attachments" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"email_id" varchar(255) NOT NULL,
	"filename" varchar(255),
	"mime_type" varchar(255),
	"size" integer,
	"data" text
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "aichat_attachments" ADD CONSTRAINT "aichat_attachments_email_id_aichat_email_id_fk" FOREIGN KEY ("email_id") REFERENCES "public"."aichat_email"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
