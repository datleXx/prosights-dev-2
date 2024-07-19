CREATE TABLE IF NOT EXISTS "aichat_email" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"snippet" text,
	"subject" varchar(255),
	"from" varchar(255),
	"date" timestamp with time zone
);
