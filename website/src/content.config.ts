import { glob } from "astro/loaders";
import { defineCollection, z } from "astro:content";

const socialCopy = {
  linkedin: z.string(),
  // X counts links as 23 chars; cap the copy so text + link fits in 280
  twitter: z.string().max(250, "twitter copy must be at most 250 chars to leave room for the link"),
};

const blog = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/blog" }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    categories: z.array(z.string()).default([]),
    social: z.object(socialCopy).partial().optional(),
  }),
});

const social = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/social" }),
  schema: z
    .object({
      date: z.coerce.date(),
      ...socialCopy,
    })
    .partial({ linkedin: true, twitter: true })
    .refine((entry) => entry.linkedin || entry.twitter, "provide linkedin and/or twitter copy"),
});

export const collections = { blog, social };
