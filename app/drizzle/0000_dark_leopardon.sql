CREATE TYPE "public"."user_role" AS ENUM('personal', 'student');--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"full_name" text,
	"role" "user_role" DEFAULT 'student',
	"avatar_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
