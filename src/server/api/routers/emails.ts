import { desc, eq } from "drizzle-orm";
import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { emails, posts } from "~/server/db/schema";

export const emailsRouter = createTRPCRouter({
  fetchEmails: protectedProcedure
  .input(
    z.object({
      userId: z.string()
    })
  )
  .query(async({ctx, input}) => {
    try {
        const emailsList = await ctx.db.select().from(emails).where(eq(emails.userId, input.userId)).limit(15).orderBy(desc(emails.date));
        return emailsList; 
    }
    catch (e) {
        console.log(e)
    }
  }), 

  fetchEmailbyId: protectedProcedure
  .input(
    z.object({
      id: z.string()
    })
  )
  .query(async({ctx, input}) => {
    try {
        const emailItem = await ctx.db.select().from(emails).where(eq(emails.id, input.id)).limit(1)
        return emailItem[0]; 
    }
    catch (e) {
        console.log(e)
    }
  })

});
