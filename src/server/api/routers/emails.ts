import { desc } from "drizzle-orm";
import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { emails, posts } from "~/server/db/schema";

export const emailsRouter = createTRPCRouter({
  fetchEmails: protectedProcedure
  .query(async({ctx}) => {
    try {
        const emailsList = await ctx.db.select().from(emails).limit(15).orderBy(desc(emails.date));
        return emailsList; 
    }
    catch (e) {
        console.log(e)
    }
  })

});
