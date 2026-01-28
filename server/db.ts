import { eq, desc, and, or, like, sql, ne, inArray, notInArray, lte, gte, count } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-serverless";
import { neon } from "@neondatabase/serverless";
import { InsertUser, users, posts, categories, tags, postTags, InsertPost, InsertCategory, InsertTag, contacts, InsertContact, events, eventRegistrations, InsertEvent, InsertEventRegistration, downloadLeads, InsertDownloadLead, orders, InsertOrder, promoCodes, InsertPromoCode, videoCourses, InsertVideoCourse, videoCoursePurchases, InsertVideoCoursePurchase, videoCourseNotes, InsertVideoCourseNote, videoCourseReviews, InsertVideoCourseReview, articleAccessWhitelist, courseRegistrations2026, InsertCourseRegistration2026, notifications, notificationReads, InsertNotification, InsertNotificationRead, courseSessions2026, InsertCourseSession2026, courseAttendance2026, InsertCourseAttendance2026, courseTransfers2026, InsertCourseTransfer2026 } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      const sql = neon(process.env.DATABASE_URL);
      _db = drizzle(sql);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (ENV.adminUserIds.includes(user.openId)) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onConflictDoUpdate({
      target: users.openId,
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Blog Posts
export async function getPublishedPosts(limit?: number, offset?: number) {
  const db = await getDb();
  if (!db) return [];

  let query = db
    .select({
      post: posts,
      author: users,
      category: categories,
    })
    .from(posts)
    .leftJoin(users, eq(posts.authorId, users.id))
    .leftJoin(categories, eq(posts.categoryId, categories.id))
    .where(eq(posts.status, "published"))
    .orderBy(desc(posts.publishedAt));

  if (limit !== undefined) {
    query = query.limit(limit) as typeof query;
  }
  if (offset !== undefined) {
    query = query.offset(offset) as typeof query;
  }

  return await query;
}

export async function getPostBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select({
      post: posts,
      author: users,
      category: categories,
    })
    .from(posts)
    .leftJoin(users, eq(posts.authorId, users.id))
    .leftJoin(categories, eq(posts.categoryId, categories.id))
    .where(eq(posts.slug, slug))
    .limit(1);

  if (result.length === 0) return undefined;

  // Get tags for this post
  const postTagsResult = await db
    .select({
      tag: tags,
    })
    .from(postTags)
    .leftJoin(tags, eq(postTags.tagId, tags.id))
    .where(eq(postTags.postId, result[0].post.id));

  return {
    ...result[0],
    tags: postTagsResult.map(pt => pt.tag).filter(Boolean),
  };
}

export async function getPostsByCategory(categorySlug: string, limit?: number) {
  const db = await getDb();
  if (!db) return [];

  const category = await db
    .select()
    .from(categories)
    .where(eq(categories.slug, categorySlug))
    .limit(1);

  if (category.length === 0) return [];

  let query = db
    .select({
      post: posts,
      author: users,
      category: categories,
    })
    .from(posts)
    .leftJoin(users, eq(posts.authorId, users.id))
    .leftJoin(categories, eq(posts.categoryId, categories.id))
    .where(and(eq(posts.categoryId, category[0].id), eq(posts.status, "published")))
    .orderBy(desc(posts.publishedAt));

  if (limit !== undefined) {
    query = query.limit(limit) as typeof query;
  }

  return await query;
}

export async function searchPosts(searchTerm: string) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select({
      post: posts,
      author: users,
      category: categories,
    })
    .from(posts)
    .leftJoin(users, eq(posts.authorId, users.id))
    .leftJoin(categories, eq(posts.categoryId, categories.id))
    .where(
      and(
        eq(posts.status, "published"),
        or(
          like(posts.title, `%${searchTerm}%`),
          like(posts.excerpt, `%${searchTerm}%`),
          like(posts.content, `%${searchTerm}%`)
        )
      )
    )
    .orderBy(desc(posts.publishedAt));
}

export async function incrementPostViewCount(postId: number) {
  const db = await getDb();
  if (!db) return;

  await db
    .update(posts)
    .set({ viewCount: sql`${posts.viewCount} + 1` })
    .where(eq(posts.id, postId));
}

// Categories
export async function getAllCategories() {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(categories).orderBy(categories.name);
}

export async function getCategoryBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(categories)
    .where(eq(categories.slug, slug))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Tags
export async function getAllTags() {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(tags).orderBy(tags.name);
}

export async function getTagBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(tags)
    .where(eq(tags.slug, slug))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getPostsByTag(tagSlug: string, limit?: number) {
  const db = await getDb();
  if (!db) return [];

  const tag = await db
    .select()
    .from(tags)
    .where(eq(tags.slug, tagSlug))
    .limit(1);

  if (tag.length === 0) return [];

  let query = db
    .select({
      post: posts,
      author: users,
      category: categories,
    })
    .from(postTags)
    .leftJoin(posts, eq(postTags.postId, posts.id))
    .leftJoin(users, eq(posts.authorId, users.id))
    .leftJoin(categories, eq(posts.categoryId, categories.id))
    .where(and(eq(postTags.tagId, tag[0].id), eq(posts.status, "published")))
    .orderBy(desc(posts.publishedAt));

  if (limit !== undefined) {
    query = query.limit(limit) as typeof query;
  }

  return await query;
}

export async function getTagsByPostId(postId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select({
      tag: tags,
    })
    .from(postTags)
    .leftJoin(tags, eq(postTags.tagId, tags.id))
    .where(eq(postTags.postId, postId));

  return result.map(pt => pt.tag).filter(Boolean);
}

// Admin functions
export async function getAllPosts(authorId?: number) {
  const db = await getDb();
  if (!db) return [];

  let query = db
    .select({
      post: posts,
      author: users,
      category: categories,
    })
    .from(posts)
    .leftJoin(users, eq(posts.authorId, users.id))
    .leftJoin(categories, eq(posts.categoryId, categories.id))
    .orderBy(desc(posts.updatedAt));

  if (authorId !== undefined) {
    query = query.where(eq(posts.authorId, authorId)) as typeof query;
  }

  return await query;
}

export async function createPost(post: InsertPost) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(posts).values(post);
  return result;
}

export async function updatePost(postId: number, post: Partial<InsertPost>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(posts).set(post).where(eq(posts.id, postId));
}

export async function deletePost(postId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Delete post tags first
  await db.delete(postTags).where(eq(postTags.postId, postId));
  // Delete post
  await db.delete(posts).where(eq(posts.id, postId));
}

export async function createCategory(category: InsertCategory) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(categories).values(category);
  return result;
}

export async function updateCategory(categoryId: number, category: Partial<InsertCategory>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(categories).set(category).where(eq(categories.id, categoryId));
}

export async function deleteCategory(categoryId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(categories).where(eq(categories.id, categoryId));
}

export async function createTag(tag: InsertTag) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(tags).values(tag);
  return result;
}

export async function deleteTag(tagId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Delete post tags first
  await db.delete(postTags).where(eq(postTags.tagId, tagId));
  // Delete tag
  await db.delete(tags).where(eq(tags.id, tagId));
}

export async function addTagToPost(postId: number, tagId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(postTags).values({ postId, tagId });
}

export async function removeTagFromPost(postId: number, tagId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(postTags).where(
    and(eq(postTags.postId, postId), eq(postTags.tagId, tagId))
  );
}

export async function getPostById(postId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select({
      post: posts,
      author: users,
      category: categories,
    })
    .from(posts)
    .leftJoin(users, eq(posts.authorId, users.id))
    .leftJoin(categories, eq(posts.categoryId, categories.id))
    .where(eq(posts.id, postId))
    .limit(1);

  if (result.length === 0) return undefined;

  // Get tags for this post
  const postTagsResult = await db
    .select({
      tag: tags,
    })
    .from(postTags)
    .leftJoin(tags, eq(postTags.tagId, tags.id))
    .where(eq(postTags.postId, result[0].post.id));

  return {
    ...result[0],
    tags: postTagsResult.map(pt => pt.tag).filter(Boolean),
  };
}


// ==================== Contact Functions ====================

export async function createContact(contact: InsertContact) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(contacts).values(contact);
}

export async function getContacts(limit?: number, offset?: number, status?: string) {
  const db = await getDb();
  if (!db) return [];

  if (status) {
    const query = db.select().from(contacts).where(eq(contacts.status, status as any)).orderBy(desc(contacts.createdAt));
    if (limit !== undefined && offset !== undefined) {
      return await query.limit(limit).offset(offset);
    } else if (limit !== undefined) {
      return await query.limit(limit);
    }
    return await query;
  }
  
  const query = db.select().from(contacts).orderBy(desc(contacts.createdAt));
  if (limit !== undefined && offset !== undefined) {
    return await query.limit(limit).offset(offset);
  } else if (limit !== undefined) {
    return await query.limit(limit);
  }
  return await query;
}

export async function getContactById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(contacts).where(eq(contacts.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateContactStatus(id: number, status: "pending" | "contacted" | "resolved") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(contacts).set({ status }).where(eq(contacts.id, id));
}

export async function deleteContact(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(contacts).where(eq(contacts.id, id));
}


// ==================== Event Functions ====================

export async function createEvent(event: InsertEvent) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(events).values(event);
  return result;
}

export async function updateEvent(eventId: number, event: Partial<InsertEvent>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(events).set(event).where(eq(events.id, eventId));
}

export async function deleteEvent(eventId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Delete registrations first
  await db.delete(eventRegistrations).where(eq(eventRegistrations.eventId, eventId));
  // Delete event
  await db.delete(events).where(eq(events.id, eventId));
}

export async function getPublishedEvents(limit?: number, offset?: number) {
  const db = await getDb();
  if (!db) return [];

  let query = db
    .select()
    .from(events)
    .where(eq(events.status, "published"))
    .orderBy(desc(events.eventDate));

  if (limit !== undefined) {
    query = query.limit(limit) as typeof query;
  }
  if (offset !== undefined) {
    query = query.offset(offset) as typeof query;
  }

  return await query;
}

export async function getAllEvents() {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(events).orderBy(desc(events.eventDate));
}

export async function getEventById(eventId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(events).where(eq(events.id, eventId)).limit(1);
  if (result.length === 0) return undefined;

  const event = result[0];
  const registrations = await db.select().from(eventRegistrations).where(eq(eventRegistrations.eventId, eventId));
  
  return {
    ...event,
    registrationCount: registrations.length
  };
}

export async function getEventBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(events).where(eq(events.slug, slug)).limit(1);
  if (result.length === 0) return undefined;

  const event = result[0];
  const registrations = await db.select().from(eventRegistrations).where(eq(eventRegistrations.eventId, event.id));
  
  return {
    ...event,
    registrationCount: registrations.length
  };
}

export async function getEventRegistrationCount(eventId: number) {
  const db = await getDb();
  if (!db) return 0;

  const result = await db
    .select({ count: count() })
    .from(eventRegistrations)
    .where(eq(eventRegistrations.eventId, eventId));

  return result[0]?.count || 0;
}

// ==================== Event Registration Functions ====================

export async function createEventRegistration(registration: InsertEventRegistration) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(eventRegistrations).values(registration);
  return result;
}

export async function getEventRegistrations(eventId: number, limit?: number, offset?: number) {
  const db = await getDb();
  if (!db) return [];

  let query = db
    .select()
    .from(eventRegistrations)
    .where(eq(eventRegistrations.eventId, eventId))
    .orderBy(desc(eventRegistrations.createdAt));

  if (limit !== undefined) {
    query = query.limit(limit) as typeof query;
  }
  if (offset !== undefined) {
    query = query.offset(offset) as typeof query;
  }

  return await query;
}

export async function getAllEventRegistrations(limit?: number, offset?: number) {
  const db = await getDb();
  if (!db) return [];

  let query = db
    .select({
      registration: eventRegistrations,
      event: events,
    })
    .from(eventRegistrations)
    .leftJoin(events, eq(eventRegistrations.eventId, events.id))
    .orderBy(desc(eventRegistrations.createdAt));

  if (limit !== undefined) {
    query = query.limit(limit) as typeof query;
  }
  if (offset !== undefined) {
    query = query.offset(offset) as typeof query;
  }

  return await query;
}

export async function getRegistrationById(registrationId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select({
      registration: eventRegistrations,
      event: events,
    })
    .from(eventRegistrations)
    .leftJoin(events, eq(eventRegistrations.eventId, events.id))
    .where(eq(eventRegistrations.id, registrationId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function updateRegistrationStatus(registrationId: number, status: "registered" | "confirmed" | "cancelled" | "attended") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(eventRegistrations).set({ status }).where(eq(eventRegistrations.id, registrationId));
}

export async function updateRegistrationEmailSent(registrationId: number, emailSent: boolean) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(eventRegistrations).set({ emailSent }).where(eq(eventRegistrations.id, registrationId));
}

export async function deleteRegistration(registrationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(eventRegistrations).where(eq(eventRegistrations.id, registrationId));
}

export async function checkDuplicateRegistration(eventId: number, email: string) {
  const db = await getDb();
  if (!db) return false;

  const result = await db
    .select()
    .from(eventRegistrations)
    .where(and(eq(eventRegistrations.eventId, eventId), eq(eventRegistrations.email, email)))
    .limit(1);

  return result.length > 0;
}

export async function getRegistrationStats(eventId: number) {
  const db = await getDb();
  if (!db) return { total: 0, bySource: {}, byStatus: {} };

  const registrations = await db
    .select()
    .from(eventRegistrations)
    .where(eq(eventRegistrations.eventId, eventId));

  const bySource: Record<string, number> = {};
  const byStatus: Record<string, number> = {};

  registrations.forEach(reg => {
    // Count by source
    const source = reg.referralSource || 'unknown';
    bySource[source] = (bySource[source] || 0) + 1;
    // Count by status
    byStatus[reg.status] = (byStatus[reg.status] || 0) + 1;
  });

  return {
    total: registrations.length,
    bySource,
    byStatus,
  };
}


// ==================== Event Reminder Functions ====================

export async function getEventsTomorrow() {
  const db = await getDb();
  if (!db) return [];

  // Get tomorrow's date range (in UTC, adjust for Taiwan timezone +8)
  const now = new Date();
  const tomorrowStart = new Date(now);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);
  tomorrowStart.setHours(0, 0, 0, 0);
  
  const tomorrowEnd = new Date(tomorrowStart);
  tomorrowEnd.setHours(23, 59, 59, 999);

  return await db
    .select()
    .from(events)
    .where(
      and(
        eq(events.status, "published"),
        gte(events.eventDate, tomorrowStart),
        lte(events.eventDate, tomorrowEnd)
      )
    );
}

export async function getRegistrationsByEventId(eventId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(eventRegistrations)
    .where(
      and(
        eq(eventRegistrations.eventId, eventId),
        eq(eventRegistrations.status, "registered")
      )
    );
}

// ==================== Event Registration Management ====================

export async function getAllEventRegistrationsWithDetails(options?: {
  eventId?: number;
  searchTerm?: string;
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) return { registrations: [], total: 0 };

  const conditions = [];

  // Filter by event ID
  if (options?.eventId) {
    conditions.push(eq(eventRegistrations.eventId, options.eventId));
  }

  // Search by name, email, or phone
  if (options?.searchTerm && options.searchTerm.trim() !== '') {
    const searchPattern = `%${options.searchTerm.trim()}%`;
    conditions.push(
      or(
        like(eventRegistrations.name, searchPattern),
        like(eventRegistrations.email, searchPattern),
        like(eventRegistrations.phone, searchPattern)
      )
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Get total count
  const countResult = await db
    .select({ count: count() })
    .from(eventRegistrations)
    .where(whereClause);

  const total = countResult[0]?.count || 0;

  // Get registrations with event details
  let query = db
    .select({
      registration: eventRegistrations,
      event: events,
    })
    .from(eventRegistrations)
    .leftJoin(events, eq(eventRegistrations.eventId, events.id))
    .orderBy(desc(eventRegistrations.createdAt));

  if (whereClause) {
    query = query.where(whereClause) as typeof query;
  }

  if (options?.limit !== undefined) {
    query = query.limit(options.limit) as typeof query;
  }
  if (options?.offset !== undefined) {
    query = query.offset(options.offset) as typeof query;
  }

  const registrations = await query;

  return { registrations, total };
}

export async function updateEventRegistration(
  registrationId: number,
  data: Partial<InsertEventRegistration>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(eventRegistrations)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(eventRegistrations.id, registrationId));
}

export async function getEventRegistrationStats() {
  const db = await getDb();
  if (!db) return [];

  // Get all events with registration count
  const allEvents = await db.select().from(events).orderBy(desc(events.eventDate));

  const stats = await Promise.all(
    allEvents.map(async (event) => {
      const registrationCount = await getEventRegistrationCount(event.id);
      return {
        eventId: event.id,
        eventTitle: event.title,
        eventDate: event.eventDate,
        registrationCount,
      };
    })
  );

  return stats;
}


// ==================== Download Lead Functions ====================

export async function createDownloadLead(data: {
  name: string;
  email: string;
  resourceSlug: string;
  resourceTitle: string;
  downloadUrl: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [result] = await db.insert(downloadLeads).values(data).$returningId();
  return result;
}

export async function getDownloadLeads(limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(downloadLeads)
    .orderBy(desc(downloadLeads.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function updateDownloadedAt(id: number) {
  const db = await getDb();
  if (!db) return;

  await db
    .update(downloadLeads)
    .set({ downloadedAt: new Date() })
    .where(eq(downloadLeads.id, id));
}


// ==================== Promo Code Functions ====================

export async function createPromoCode(data: InsertPromoCode) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [result] = await db.insert(promoCodes).values(data).$returningId();
  return result;
}

export async function getPromoCodeByCode(code: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(promoCodes)
    .where(eq(promoCodes.code, code.toUpperCase()))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function validatePromoCode(code: string, eventId?: number, amount?: number) {
  const promoCode = await getPromoCodeByCode(code);
  
  if (!promoCode) {
    return { valid: false, message: "優惠代碼不存在" };
  }
  
  if (!promoCode.isActive) {
    return { valid: false, message: "優惠代碼已停用" };
  }
  
  const now = new Date();
  if (promoCode.validFrom && promoCode.validFrom > now) {
    return { valid: false, message: "優惠代碼尚未生效" };
  }
  
  if (promoCode.validUntil && promoCode.validUntil < now) {
    return { valid: false, message: "優惠代碼已過期" };
  }
  
  if (promoCode.maxUses !== null && promoCode.usedCount >= promoCode.maxUses) {
    return { valid: false, message: "優惠代碼已達使用上限" };
  }
  
  if (promoCode.eventId !== null && eventId !== undefined && promoCode.eventId !== eventId) {
    return { valid: false, message: "此優惠代碼不適用於此活動" };
  }
  
  if (amount !== undefined && amount < promoCode.minAmount) {
    return { valid: false, message: `消費金額需滿 NT$ ${promoCode.minAmount} 才能使用此優惠代碼` };
  }
  
  return { valid: true, promoCode };
}

export async function incrementPromoCodeUsage(promoCodeId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(promoCodes)
    .set({ usedCount: sql`${promoCodes.usedCount} + 1` })
    .where(eq(promoCodes.id, promoCodeId));
}

export async function getAllPromoCodes() {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(promoCodes)
    .orderBy(desc(promoCodes.createdAt));
}

export async function updatePromoCode(id: number, data: Partial<InsertPromoCode>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(promoCodes).set(data).where(eq(promoCodes.id, id));
}

export async function deletePromoCode(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(promoCodes).where(eq(promoCodes.id, id));
}


// ==================== Order Functions ====================

export async function createOrder(data: InsertOrder) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [result] = await db.insert(orders).values(data).$returningId();
  return result;
}

export async function getOrderByOrderNo(orderNo: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select({
      order: orders,
      event: events,
    })
    .from(orders)
    .leftJoin(events, eq(orders.eventId, events.id))
    .where(eq(orders.orderNo, orderNo))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getOrderById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select({
      order: orders,
      event: events,
    })
    .from(orders)
    .leftJoin(events, eq(orders.eventId, events.id))
    .where(eq(orders.id, id))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function updateOrderPaymentStatus(
  orderNo: string, 
  paymentStatus: "pending" | "paid" | "failed" | "refunded",
  additionalData?: {
    paymentMethod?: string;
    newebpayTradeNo?: string;
    paidAt?: Date;
  }
): Promise<{ alreadyPaid: boolean }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // ⭐ 冪等檢查：如果訂單已經是 paid 狀態，直接返回（避免重複發信）
  const existingOrder = await db
    .select()
    .from(orders)
    .where(eq(orders.orderNo, orderNo))
    .limit(1);
  
  if (existingOrder.length > 0 && existingOrder[0].paymentStatus === "paid") {
    console.log(`[DB] Order ${orderNo} already paid, skipping update`);
    return { alreadyPaid: true };
  }

  await db
    .update(orders)
    .set({ 
      paymentStatus,
      ...additionalData,
    })
    .where(eq(orders.orderNo, orderNo));
  
  return { alreadyPaid: false };
}

export async function getAllOrders(limit?: number, offset?: number) {
  const db = await getDb();
  if (!db) return [];

  let query = db
    .select({
      order: orders,
      event: events,
    })
    .from(orders)
    .leftJoin(events, eq(orders.eventId, events.id))
    .orderBy(desc(orders.createdAt));

  if (limit !== undefined) {
    query = query.limit(limit) as typeof query;
  }
  if (offset !== undefined) {
    query = query.offset(offset) as typeof query;
  }

  return await query;
}

export async function getOrdersByEventId(eventId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(orders)
    .where(eq(orders.eventId, eventId))
    .orderBy(desc(orders.createdAt));
}

export async function checkDuplicateOrder(eventId: number, email: string) {
  const db = await getDb();
  if (!db) return false;

  const result = await db
    .select()
    .from(orders)
    .where(
      and(
        eq(orders.eventId, eventId), 
        eq(orders.email, email),
        eq(orders.paymentStatus, "paid")
      )
    )
    .limit(1);

  return result.length > 0;
}

export function calculateDiscount(originalAmount: number, promoCode: {
  discountType: "percentage" | "fixed";
  discountValue: number;
}) {
  if (promoCode.discountType === "percentage") {
    return Math.floor(originalAmount * promoCode.discountValue / 100);
  } else {
    return Math.min(promoCode.discountValue, originalAmount);
  }
}


// ==================== Video Courses ====================

export async function createVideoCourse(course: InsertVideoCourse) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(videoCourses).values(course);
  return result[0].insertId;
}

export async function updateVideoCourse(id: number, course: Partial<InsertVideoCourse>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(videoCourses).set(course).where(eq(videoCourses.id, id));
}

export async function deleteVideoCourse(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(videoCourses).where(eq(videoCourses.id, id));
}

export async function getVideoCourseById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(videoCourses).where(eq(videoCourses.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getVideoCourseBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(videoCourses).where(eq(videoCourses.slug, slug)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllVideoCourses(status?: "draft" | "published" | "archived") {
  const db = await getDb();
  if (!db) return [];

  if (status) {
    return await db.select().from(videoCourses).where(eq(videoCourses.status, status)).orderBy(desc(videoCourses.createdAt));
  }
  return await db.select().from(videoCourses).orderBy(desc(videoCourses.createdAt));
}

export async function getPublishedVideoCourses() {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(videoCourses).where(eq(videoCourses.status, "published")).orderBy(desc(videoCourses.publishedAt));
}

export async function incrementVideoCourseStudentCount(courseId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(videoCourses)
    .set({ studentCount: sql`${videoCourses.studentCount} + 1` })
    .where(eq(videoCourses.id, courseId));
}

export async function updateVideoCourseRating(courseId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Calculate average rating from reviews
  const result = await db
    .select({
      avgRating: sql<number>`AVG(${videoCourseReviews.rating})`,
      count: count(),
    })
    .from(videoCourseReviews)
    .where(and(
      eq(videoCourseReviews.courseId, courseId),
      eq(videoCourseReviews.isPublished, true)
    ));

  if (result.length > 0 && result[0].avgRating !== null) {
    await db.update(videoCourses)
      .set({ 
        rating: Math.round(result[0].avgRating * 10), // Store as 0-50 (representing 0.0-5.0)
        reviewCount: result[0].count,
      })
      .where(eq(videoCourses.id, courseId));
  }
}

// ==================== Video Course Purchases ====================

export async function createVideoCoursePurchase(purchase: InsertVideoCoursePurchase) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(videoCoursePurchases).values(purchase);
  return result[0].insertId;
}

export async function getVideoCoursePurchaseByOrderNo(orderNo: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select({
      purchase: videoCoursePurchases,
      course: videoCourses,
      user: users,
    })
    .from(videoCoursePurchases)
    .leftJoin(videoCourses, eq(videoCoursePurchases.courseId, videoCourses.id))
    .leftJoin(users, eq(videoCoursePurchases.userId, users.id))
    .where(eq(videoCoursePurchases.orderNo, orderNo))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function updateVideoCoursePurchasePaymentStatus(
  orderNo: string,
  paymentStatus: "pending" | "paid" | "failed" | "refunded",
  additionalData?: {
    paymentMethod?: string;
    newebpayTradeNo?: string;
    paidAt?: Date;
    accessGrantedAt?: Date;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(videoCoursePurchases)
    .set({
      paymentStatus,
      ...additionalData,
    })
    .where(eq(videoCoursePurchases.orderNo, orderNo));
}

export async function getUserVideoCoursePurchases(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select({
      purchase: videoCoursePurchases,
      course: videoCourses,
    })
    .from(videoCoursePurchases)
    .leftJoin(videoCourses, eq(videoCoursePurchases.courseId, videoCourses.id))
    .where(and(
      eq(videoCoursePurchases.userId, userId),
      eq(videoCoursePurchases.paymentStatus, "paid")
    ))
    .orderBy(desc(videoCoursePurchases.paidAt));
}

export async function checkUserHasPurchasedCourse(userId: number, courseId: number) {
  const db = await getDb();
  if (!db) return false;

  const result = await db
    .select()
    .from(videoCoursePurchases)
    .where(and(
      eq(videoCoursePurchases.userId, userId),
      eq(videoCoursePurchases.courseId, courseId),
      eq(videoCoursePurchases.paymentStatus, "paid")
    ))
    .limit(1);

  return result.length > 0;
}

export async function getAllVideoCoursePurchases(limit?: number, offset?: number) {
  const db = await getDb();
  if (!db) return [];

  let query = db
    .select({
      purchase: videoCoursePurchases,
      course: videoCourses,
      user: users,
    })
    .from(videoCoursePurchases)
    .leftJoin(videoCourses, eq(videoCoursePurchases.courseId, videoCourses.id))
    .leftJoin(users, eq(videoCoursePurchases.userId, users.id))
    .orderBy(desc(videoCoursePurchases.createdAt));

  if (limit !== undefined) {
    query = query.limit(limit) as typeof query;
  }
  if (offset !== undefined) {
    query = query.offset(offset) as typeof query;
  }

  return await query;
}

// ==================== Video Course Notes ====================

export async function createOrUpdateVideoCourseNote(note: InsertVideoCourseNote) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check if note exists for this user and course
  const existing = await db
    .select()
    .from(videoCourseNotes)
    .where(and(
      eq(videoCourseNotes.userId, note.userId),
      eq(videoCourseNotes.courseId, note.courseId)
    ))
    .limit(1);

  if (existing.length > 0) {
    // Update existing note
    await db.update(videoCourseNotes)
      .set({ content: note.content, videoTimestamp: note.videoTimestamp })
      .where(eq(videoCourseNotes.id, existing[0].id));
    return existing[0].id;
  } else {
    // Create new note
    const result = await db.insert(videoCourseNotes).values(note);
    return result[0].insertId;
  }
}

export async function getUserVideoCourseNote(userId: number, courseId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(videoCourseNotes)
    .where(and(
      eq(videoCourseNotes.userId, userId),
      eq(videoCourseNotes.courseId, courseId)
    ))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function deleteVideoCourseNote(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(videoCourseNotes).where(eq(videoCourseNotes.id, id));
}

// ==================== Video Course Reviews ====================

export async function createVideoCourseReview(review: InsertVideoCourseReview) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(videoCourseReviews).values(review);
  
  // Update course rating
  await updateVideoCourseRating(review.courseId);
  
  return result[0].insertId;
}

export async function getVideoCourseReviews(courseId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select({
      review: videoCourseReviews,
      user: users,
    })
    .from(videoCourseReviews)
    .leftJoin(users, eq(videoCourseReviews.userId, users.id))
    .where(and(
      eq(videoCourseReviews.courseId, courseId),
      eq(videoCourseReviews.isPublished, true)
    ))
    .orderBy(desc(videoCourseReviews.createdAt));
}

export async function getUserVideoCourseReview(userId: number, courseId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(videoCourseReviews)
    .where(and(
      eq(videoCourseReviews.userId, userId),
      eq(videoCourseReviews.courseId, courseId)
    ))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function updateVideoCourseReview(id: number, review: Partial<InsertVideoCourseReview>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(videoCourseReviews).set(review).where(eq(videoCourseReviews.id, id));
  
  // Get the review to update course rating
  const existing = await db.select().from(videoCourseReviews).where(eq(videoCourseReviews.id, id)).limit(1);
  if (existing.length > 0) {
    await updateVideoCourseRating(existing[0].courseId);
  }
}

export async function deleteVideoCourseReview(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get the review to update course rating after deletion
  const existing = await db.select().from(videoCourseReviews).where(eq(videoCourseReviews.id, id)).limit(1);
  
  await db.delete(videoCourseReviews).where(eq(videoCourseReviews.id, id));
  
  if (existing.length > 0) {
    await updateVideoCourseRating(existing[0].courseId);
  }
}

// ==================== Video Course Dashboard Stats ====================

export async function getVideoCourseDashboardStats() {
  const db = await getDb();
  if (!db) return { totalCourses: 0, totalPurchases: 0, totalRevenue: 0, totalStudents: 0 };

  const coursesCount = await db.select({ count: count() }).from(videoCourses).where(eq(videoCourses.status, "published"));
  
  const purchasesStats = await db
    .select({
      count: count(),
      revenue: sql<number>`SUM(${videoCoursePurchases.finalAmount})`,
    })
    .from(videoCoursePurchases)
    .where(eq(videoCoursePurchases.paymentStatus, "paid"));

  const studentsCount = await db
    .select({ count: sql<number>`COUNT(DISTINCT ${videoCoursePurchases.userId})` })
    .from(videoCoursePurchases)
    .where(eq(videoCoursePurchases.paymentStatus, "paid"));

  return {
    totalCourses: coursesCount[0]?.count || 0,
    totalPurchases: purchasesStats[0]?.count || 0,
    totalRevenue: purchasesStats[0]?.revenue || 0,
    totalStudents: studentsCount[0]?.count || 0,
  };
}

export async function generateVideoCourseOrderNo() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `VC${timestamp}${random}`;
}

// Get related posts based on shared tags or same category
export async function getRelatedPosts(postId: number, limit = 3) {
  const db = await getDb();
  if (!db) return [];

  // Get the current post's tags and category
  const currentPost = await db
    .select({
      categoryId: posts.categoryId,
    })
    .from(posts)
    .where(eq(posts.id, postId))
    .limit(1);

  if (currentPost.length === 0) return [];

  const currentTagIds = await db
    .select({ tagId: postTags.tagId })
    .from(postTags)
    .where(eq(postTags.postId, postId));

  const tagIds = currentTagIds.map(t => t.tagId);

  // Find posts that share tags or category, excluding current post
  let relatedPostIds: number[] = [];

  // First priority: posts with shared tags
  if (tagIds.length > 0) {
    const postsWithSharedTags = await db
      .select({ postId: postTags.postId })
      .from(postTags)
      .innerJoin(posts, eq(postTags.postId, posts.id))
      .where(
        and(
          inArray(postTags.tagId, tagIds),
          ne(postTags.postId, postId),
          eq(posts.status, "published")
        )
      )
      .groupBy(postTags.postId)
      .orderBy(desc(sql`COUNT(*)`))
      .limit(limit);

    relatedPostIds = postsWithSharedTags.map(p => p.postId);
  }

  // If not enough, add posts from same category
  if (relatedPostIds.length < limit && currentPost[0].categoryId) {
    const postsFromCategory = await db
      .select({ id: posts.id })
      .from(posts)
      .where(
        and(
          eq(posts.categoryId, currentPost[0].categoryId),
          ne(posts.id, postId),
          eq(posts.status, "published"),
          relatedPostIds.length > 0 ? notInArray(posts.id, relatedPostIds) : undefined
        )
      )
      .orderBy(desc(posts.publishedAt))
      .limit(limit - relatedPostIds.length);

    relatedPostIds = [...relatedPostIds, ...postsFromCategory.map(p => p.id)];
  }

  // If still not enough, add recent posts
  if (relatedPostIds.length < limit) {
    const recentPosts = await db
      .select({ id: posts.id })
      .from(posts)
      .where(
        and(
          ne(posts.id, postId),
          eq(posts.status, "published"),
          relatedPostIds.length > 0 ? notInArray(posts.id, relatedPostIds) : undefined
        )
      )
      .orderBy(desc(posts.publishedAt))
      .limit(limit - relatedPostIds.length);

    relatedPostIds = [...relatedPostIds, ...recentPosts.map(p => p.id)];
  }

  if (relatedPostIds.length === 0) return [];

  // Get full post data
  const relatedPosts = await db
    .select({
      post: posts,
      author: users,
      category: categories,
    })
    .from(posts)
    .leftJoin(users, eq(posts.authorId, users.id))
    .leftJoin(categories, eq(posts.categoryId, categories.id))
    .where(inArray(posts.id, relatedPostIds))
    .limit(limit);

  return relatedPosts;
}


/**
 * Check if an email has access to a restricted article
 */
export async function checkArticleAccess(email: string, articleSlug: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    const result = await db
      .select()
      .from(articleAccessWhitelist)
      .where(
        and(
          eq(articleAccessWhitelist.email, email.toLowerCase()),
          eq(articleAccessWhitelist.articleSlug, articleSlug)
        )
      )
      .limit(1);

    return result.length > 0;
  } catch (error) {
    console.error('[Database] Error checking article access:', error);
    return false;
  }
}


/**
 * ============================================
 * 2026 AI Course Registration Functions
 * ============================================
 */

/**
 * Create a new course registration for 2026 AI course
 */
export async function createCourseRegistration2026(data: InsertCourseRegistration2026) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(courseRegistrations2026).values(data);
  const insertId = Number(result[0].insertId);
  
  const registration = await db
    .select()
    .from(courseRegistrations2026)
    .where(eq(courseRegistrations2026.id, insertId))
    .limit(1);

  return registration[0];
}

/**
 * Get all course registrations for 2026 AI course with filters
 */
export async function getAllCourseRegistrations2026(
  limit = 50,
  offset = 0,
  filters?: {
    paymentStatus?: "pending" | "paid" | "failed";
    search?: string;
  }
) {
  const db = await getDb();
  if (!db) return { registrations: [], total: 0 };

  const conditions = [];
  
  // Filter by payment status
  if (filters?.paymentStatus) {
    conditions.push(eq(courseRegistrations2026.paymentStatus, filters.paymentStatus));
  }
  
  // Search by name or email
  if (filters?.search) {
    const searchTerm = `%${filters.search}%`;
    conditions.push(
      or(
        like(courseRegistrations2026.name1, searchTerm),
        like(courseRegistrations2026.email1, searchTerm),
        like(courseRegistrations2026.phone1, searchTerm)
      )
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const registrations = await db
    .select()
    .from(courseRegistrations2026)
    .where(whereClause)
    .orderBy(desc(courseRegistrations2026.createdAt))
    .limit(limit)
    .offset(offset);

  const totalResult = await db
    .select({ count: count() })
    .from(courseRegistrations2026)
    .where(whereClause);

  return {
    registrations,
    total: totalResult[0]?.count || 0,
  };
}

/**
 * Generate Newebpay payment form data for 2026 course
 * 統一使用 newebpay.ts 的 createPaymentData 函式，確保加密邏輯一致
 */
export async function generateNewebpayForm2026(registrationId: number, amount: number, email: string) {
  // 動態導入 newebpay 模組
  const { createPaymentData } = await import('./_core/newebpay');
  
  // Generate trade number - 簡化訂單編號，確保不超過 30 字元
  // 格式: C26_{registrationId}_{timestamp後8位} = 最多 4+1+6+1+8 = 20 字元
  const shortTimestamp = Date.now().toString().slice(-8);
  const tradeNo = `C26_${registrationId}_${shortTimestamp}`;
  
  // 使用正式域名作為藍新金流回調 URL，確保藍新金流伺服器能穩定訪問
  const baseUrl = 'https://ai-tw.manus.space';
  
  // 使用統一的 createPaymentData 函式，確保加密和簽章邏輯一致
  const paymentData = createPaymentData({
    orderId: tradeNo,
    amount,
    itemDesc: '2026 AI 實戰應用課',
    email,
    returnUrl: `${baseUrl}/api/payment/return`,
    notifyUrl: `${baseUrl}/api/payment/notify`,
    clientBackUrl: `${baseUrl}/course-2026-payment-result`,
  });
  
  return {
    MerchantID: paymentData.MerchantID,
    TradeInfo: paymentData.TradeInfo,
    TradeSha: paymentData.TradeSha,
    Version: paymentData.Version,
    tradeNo,
    paymentUrl: paymentData.PayGateWay,
  };
}

/**
 * Update course registration 2026 payment status
 */
export async function updateCourseRegistration2026PaymentStatus(
  registrationId: number,
  paymentStatus: "pending" | "paid" | "failed",
  newebpayTradeNo?: string
): Promise<{ success: boolean; alreadyPaid: boolean }> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  
  // ⭐ 冪等檢查：如果訂單已經是 paid 狀態，直接返回（避免重複發信）
  const existingRegistration = await db
    .select()
    .from(courseRegistrations2026)
    .where(eq(courseRegistrations2026.id, registrationId))
    .limit(1);
  
  if (existingRegistration.length > 0 && existingRegistration[0].paymentStatus === "paid") {
    console.log(`[DB] Course2026 registration ${registrationId} already paid, skipping update`);
    return { success: true, alreadyPaid: true };
  }
  
  const updateData: any = {
    paymentStatus,
    updatedAt: new Date(),
  };
  
  if (newebpayTradeNo) {
    updateData.newebpayTradeNo = newebpayTradeNo;
  }
  
  await db
    .update(courseRegistrations2026)
    .set(updateData)
    .where(eq(courseRegistrations2026.id, registrationId));
  
  return { success: true, alreadyPaid: false };
}

/**
 * Get course registration 2026 by ID
 */
export async function getCourseRegistration2026ById(registrationId: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  
  const [registration] = await db
    .select()
    .from(courseRegistrations2026)
    .where(eq(courseRegistrations2026.id, registrationId));
  
  return registration;
}

// ==================== Payment Records Management ====================

/**
 * Get all payment records (course registrations only for now)
 * Returns combined data from courseRegistrations2026
 */
export async function getAllPaymentRecords(
  limit = 50,
  offset = 0,
  filters?: {
    paymentStatus?: "pending" | "paid" | "failed";
    search?: string;
  }
) {
  const db = await getDb();
  if (!db) return { records: [], total: 0 };

  const conditions = [];
  
  // Filter by payment status
  if (filters?.paymentStatus) {
    conditions.push(eq(courseRegistrations2026.paymentStatus, filters.paymentStatus));
  }
  
  // Search by name or email
  if (filters?.search) {
    const searchTerm = `%${filters.search}%`;
    conditions.push(
      or(
        like(courseRegistrations2026.name1, searchTerm),
        like(courseRegistrations2026.email1, searchTerm),
        like(courseRegistrations2026.phone1, searchTerm)
      )
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const records = await db
    .select()
    .from(courseRegistrations2026)
    .where(whereClause)
    .orderBy(desc(courseRegistrations2026.createdAt))
    .limit(limit)
    .offset(offset);

  const totalResult = await db
    .select({ count: count() })
    .from(courseRegistrations2026)
    .where(whereClause);

  return {
    records,
    total: totalResult[0]?.count || 0,
  };
}

/**
 * Get statistics for each course session
 * Returns registration count and revenue for each session
 */
export async function getCourseSessionStats() {
  const db = await getDb();
  if (!db) return [];

  // Get all registrations
  const allRegistrations = await db
    .select()
    .from(courseRegistrations2026);

  // Course sessions mapping
  const sessions = [
    { id: "0120", name: "初階 1：AI 基礎與 Perplexity 實戰", date: "2026-01-20 (一) 19:30-22:30" },
    { id: "0122", name: "初階 2：Gemini Deep Research 與 Grok", date: "2026-01-22 (三) 19:30-22:30" },
    { id: "0127", name: "初階 3：Gamma 與 Nano Banana 視覺設計", date: "2026-01-27 (一) 19:30-22:30" },
    { id: "0128", name: "初階 4：NotebookLM 與 Gemini Canvas", date: "2026-01-28 (二) 19:30-22:30" },
    { id: "0203", name: "初階 1：AI 基礎與 Perplexity 實戰", date: "2026-02-03 (一) 19:30-22:30" },
    { id: "0205", name: "初階 2：Gemini Deep Research 與 Grok", date: "2026-02-05 (三) 19:30-22:30" },
    { id: "0305", name: "初階 1：AI 基礎與 Perplexity 實戰", date: "2026-03-05 (三) 19:30-22:30" },
    { id: "0311", name: "初階 2：Gemini Deep Research 與 Grok", date: "2026-03-11 (二) 19:30-22:30" },
    { id: "0312", name: "初階 3：Gamma 與 Nano Banana 視覺設計", date: "2026-03-12 (三) 19:30-22:30" },
    { id: "0324", name: "初階 4：NotebookLM 與 Gemini Canvas", date: "2026-03-24 (一) 19:30-22:30" },
  ];

  // Calculate stats for each session
  const stats = sessions.map(session => {
    let totalRegistrations = 0;
    let paidRegistrations = 0;
    let pendingRegistrations = 0;
    let totalRevenue = 0;
    let paidRevenue = 0;

    allRegistrations.forEach(reg => {
      try {
        const selectedSessions = JSON.parse(reg.selectedSessions);
        if (selectedSessions.includes(session.id)) {
          totalRegistrations++;
          
          // Count people (1 or 2 depending on plan)
          const peopleCount = reg.plan === "double" ? 2 : 1;
          
          if (reg.paymentStatus === "paid") {
            paidRegistrations += peopleCount;
            paidRevenue += reg.planPrice;
          } else if (reg.paymentStatus === "pending") {
            pendingRegistrations += peopleCount;
          }
          
          totalRevenue += reg.planPrice;
        }
      } catch (e) {
        console.error("Failed to parse selectedSessions:", e);
      }
    });

    return {
      sessionId: session.id,
      sessionName: session.name,
      sessionDate: session.date,
      totalRegistrations,
      paidRegistrations,
      pendingRegistrations,
      totalRevenue,
      paidRevenue,
    };
  });

  return stats;
}

/**
 * Get payment statistics summary
 */
export async function getPaymentStatsSummary() {
  const db = await getDb();
  if (!db) return {
    totalRegistrations: 0,
    paidRegistrations: 0,
    pendingRegistrations: 0,
    failedRegistrations: 0,
    totalRevenue: 0,
    paidRevenue: 0,
  };

  const allRegistrations = await db
    .select()
    .from(courseRegistrations2026);

  let totalRegistrations = 0;
  let paidRegistrations = 0;
  let pendingRegistrations = 0;
  let failedRegistrations = 0;
  let totalRevenue = 0;
  let paidRevenue = 0;

  allRegistrations.forEach(reg => {
    totalRegistrations++;
    totalRevenue += reg.planPrice;

    if (reg.paymentStatus === "paid") {
      paidRegistrations++;
      paidRevenue += reg.planPrice;
    } else if (reg.paymentStatus === "pending") {
      pendingRegistrations++;
    } else if (reg.paymentStatus === "failed") {
      failedRegistrations++;
    }
  });

  return {
    totalRegistrations,
    paidRegistrations,
    pendingRegistrations,
    failedRegistrations,
    totalRevenue,
    paidRevenue,
  };
}

/**
 * Get registrations by session ID
 * Returns all registrations that include the specified session
 */
export async function getRegistrationsBySession(sessionId: string) {
  const db = await getDb();
  if (!db) return [];

  // Get all registrations
  const allRegistrations = await db
    .select()
    .from(courseRegistrations2026);

  // Filter registrations that include this session
  const filteredRegistrations = allRegistrations.filter(reg => {
    try {
      const selectedSessions = JSON.parse(reg.selectedSessions);
      return selectedSessions.includes(sessionId);
    } catch (e) {
      console.error("Failed to parse selectedSessions:", e);
      return false;
    }
  });

  return filteredRegistrations;
}

/**
 * Get all course sessions with their registration details
 * Returns sessions grouped by date with registrant information
 */
export async function getCourseSessionsWithRegistrations() {
  const db = await getDb();
  if (!db) return [];

  // Get all registrations
  const allRegistrations = await db
    .select()
    .from(courseRegistrations2026);

  // Course sessions mapping - 與報名表單的 ID 格式一致 (MMDD_N)
  const sessions = [
    // 1 月課程
    { id: "0120_1", name: "初階 1：AI 職場應用啟航班 - 策略視野與基礎建構", date: "2026-01-20", time: "9:00-12:00", dayOfWeek: "二" },
    { id: "0127_1", name: "初階 1：AI 職場應用啟航班 - 策略視野與基礎建構", date: "2026-01-27", time: "9:00-12:00", dayOfWeek: "二" },
    { id: "0120_2", name: "初階 2：AI 職場應用進階班 - 市場洞察與簡報自動化", date: "2026-01-20", time: "13:00-16:00", dayOfWeek: "二" },
    { id: "0127_2", name: "初階 2：AI 職場應用進階班 - 市場洞察與簡報自動化", date: "2026-01-27", time: "13:00-16:00", dayOfWeek: "二" },
    { id: "0122_3", name: "初階 3：AI 職場應用實戰班 - 知識內化與創意設計", date: "2026-01-22", time: "9:00-12:00", dayOfWeek: "四" },
    { id: "0128_3", name: "初階 3：AI 職場應用實戰班 - 知識內化與創意設計", date: "2026-01-28", time: "9:00-12:00", dayOfWeek: "三" },
    { id: "0122_4", name: "初階 4：AI 職場應用專精班 - 影像創作與內容策略", date: "2026-01-22", time: "13:00-16:00", dayOfWeek: "四" },
    { id: "0128_4", name: "初階 4：AI 職場應用專精班 - 影像創作與內容策略", date: "2026-01-28", time: "13:00-16:00", dayOfWeek: "三" },
    // 2 月課程
    { id: "0203_1", name: "初階 1：AI 職場應用啟航班 - 策略視野與基礎建構", date: "2026-02-03", time: "9:00-12:00", dayOfWeek: "二" },
    { id: "0203_2", name: "初階 2：AI 職場應用進階班 - 市場洞察與簡報自動化", date: "2026-02-03", time: "13:00-16:00", dayOfWeek: "二" },
    { id: "0205_3", name: "初階 3：AI 職場應用實戰班 - 知識內化與創意設計", date: "2026-02-05", time: "9:00-12:00", dayOfWeek: "四" },
    { id: "0205_4", name: "初階 4：AI 職場應用專精班 - 影像創作與內容策略", date: "2026-02-05", time: "13:00-16:00", dayOfWeek: "四" },
    // 3 月課程
    { id: "0305_1", name: "初階 1：AI 職場應用啟航班 - 策略視野與基礎建構", date: "2026-03-05", time: "9:00-12:00", dayOfWeek: "四" },
    { id: "0312_1", name: "初階 1：AI 職場應用啟航班 - 策略視野與基礎建構", date: "2026-03-12", time: "9:00-12:00", dayOfWeek: "四" },
    { id: "0305_2", name: "初階 2：AI 職場應用進階班 - 市場洞察與簡報自動化", date: "2026-03-05", time: "13:00-16:00", dayOfWeek: "四" },
    { id: "0312_2", name: "初階 2：AI 職場應用進階班 - 市場洞察與簡報自動化", date: "2026-03-12", time: "13:00-16:00", dayOfWeek: "四" },
    { id: "0311_3", name: "初階 3：AI 職場應用實戰班 - 知識內化與創意設計", date: "2026-03-11", time: "9:00-12:00", dayOfWeek: "三" },
    { id: "0324_3", name: "初階 3：AI 職場應用實戰班 - 知識內化與創意設計", date: "2026-03-24", time: "9:00-12:00", dayOfWeek: "二" },
    { id: "0311_4", name: "初階 4：AI 職場應用專精班 - 影像創作與內容策略", date: "2026-03-11", time: "13:00-16:00", dayOfWeek: "三" },
    { id: "0324_4", name: "初階 4：AI 職場應用專精班 - 影像創作與內容策略", date: "2026-03-24", time: "13:00-16:00", dayOfWeek: "二" },
  ];

  // Get attendance records
  const attendanceRecords = await db
    .select()
    .from(courseAttendance2026);

  // Build sessions with registrations
  const sessionsWithRegistrations = sessions.map(session => {
    const registrations: Array<{
      id: number;
      name: string;
      email: string;
      phone: string;
      industry: string | null;
      plan: string;
      paymentStatus: string;
      isSecondPerson: boolean;
      attended: boolean;
    }> = [];

    allRegistrations.forEach(reg => {
      try {
        const selectedSessions = JSON.parse(reg.selectedSessions);
        if (selectedSessions.includes(session.id)) {
          // Check attendance for first person
          const firstPersonAttendance = attendanceRecords.find(
            a => a.sessionId === session.id && a.registrationId === reg.id && a.attendeeEmail === reg.email1
          );
          
          // Add first person
          registrations.push({
            id: reg.id,
            name: reg.name1,
            email: reg.email1,
            phone: reg.phone1,
            industry: reg.industry1,
            plan: reg.plan,
            paymentStatus: reg.paymentStatus,
            isSecondPerson: false,
            attended: firstPersonAttendance?.isAttended || false,
          });
          
          // Add second person for double plan
          if (reg.plan === "double" && reg.name2) {
            const secondPersonAttendance = attendanceRecords.find(
              a => a.sessionId === session.id && a.registrationId === reg.id && a.attendeeEmail === reg.email2
            );
            
            registrations.push({
              id: reg.id,
              name: reg.name2,
              email: reg.email2 || "",
              phone: reg.phone2 || "",
              industry: reg.industry2,
              plan: reg.plan,
              paymentStatus: reg.paymentStatus,
              isSecondPerson: true,
              attended: secondPersonAttendance?.isAttended || false,
            });
          }
        }
      } catch (e) {
        console.error("Failed to parse selectedSessions:", e);
      }
    });

    // Count paid registrations
    let paidCount = 0;
    let pendingCount = 0;
    registrations.forEach(reg => {
      if (reg.paymentStatus === "paid") {
        paidCount += 1;
      } else if (reg.paymentStatus === "pending") {
        pendingCount += 1;
      }
    });

    return {
      sessionId: session.id,
      sessionName: session.name,
      sessionDate: session.date,
      sessionTime: session.time,
      dayOfWeek: session.dayOfWeek,
      registrations,
      paidCount,
      pendingCount,
      totalCount: paidCount + pendingCount,
    };
  });

  return sessionsWithRegistrations;
}

// ============================================================
// Notifications
// ============================================================

/**
 * Create a new notification
 */
export async function createNotification(data: {
  title: string;
  content: string;
  type: "info" | "warning" | "success" | "error";
  targetType: "all" | "user" | "role";
  targetUserId?: number;
  targetRole?: "user" | "admin";
  link?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(notifications).values(data);
  return { id: Number(result[0].insertId), ...data };
}

/**
 * Get all notifications (admin)
 */
export async function getAllNotifications(limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [notificationsList, totalCountResult] = await Promise.all([
    db
      .select()
      .from(notifications)
      .orderBy(desc(notifications.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(notifications),
  ]);

  return {
    notifications: notificationsList,
    total: Number(totalCountResult[0]?.count || 0),
  };
}

/**
 * Delete a notification
 */
export async function deleteNotification(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Delete all read records first
  await db.delete(notificationReads).where(eq(notificationReads.notificationId, id));
  
  // Then delete the notification
  await db.delete(notifications).where(eq(notifications.id, id));
  return { success: true };
}

/**
 * Get user notifications (filtered by targetType and user role)
 */
export async function getUserNotifications(
  userId: number,
  userRole: "user" | "admin",
  limit = 20,
  offset = 0
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get notifications that match:
  // 1. targetType = "all"
  // 2. targetType = "user" AND targetUserId = userId
  // 3. targetType = "role" AND targetRole = userRole
  const notificationsList = await db
    .select({
      id: notifications.id,
      title: notifications.title,
      content: notifications.content,
      type: notifications.type,
      link: notifications.link,
      createdAt: notifications.createdAt,
      isRead: sql<boolean>`EXISTS(
        SELECT 1 FROM ${notificationReads}
        WHERE ${notificationReads.notificationId} = ${notifications.id}
        AND ${notificationReads.userId} = ${userId}
      )`,
    })
    .from(notifications)
    .where(
      or(
        eq(notifications.targetType, "all"),
        and(
          eq(notifications.targetType, "user"),
          eq(notifications.targetUserId, userId)
        ),
        and(
          eq(notifications.targetType, "role"),
          eq(notifications.targetRole, userRole)
        )
      )
    )
    .orderBy(desc(notifications.createdAt))
    .limit(limit)
    .offset(offset);

  return notificationsList;
}

/**
 * Get unread notification count for a user
 */
export async function getUnreadNotificationCount(
  userId: number,
  userRole: "user" | "admin"
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(notifications)
    .where(
      and(
        or(
          eq(notifications.targetType, "all"),
          and(
            eq(notifications.targetType, "user"),
            eq(notifications.targetUserId, userId)
          ),
          and(
            eq(notifications.targetType, "role"),
            eq(notifications.targetRole, userRole)
          )
        ),
        sql`NOT EXISTS(
          SELECT 1 FROM ${notificationReads}
          WHERE ${notificationReads.notificationId} = ${notifications.id}
          AND ${notificationReads.userId} = ${userId}
        )`
      )
    );

  return { count: Number(result[0]?.count || 0) };
}

/**
 * Mark a notification as read
 */
export async function markNotificationAsRead(notificationId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check if already read
  const existing = await db
    .select()
    .from(notificationReads)
    .where(
      and(
        eq(notificationReads.notificationId, notificationId),
        eq(notificationReads.userId, userId)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    return { success: true, alreadyRead: true };
  }

  // Insert read record
  await db.insert(notificationReads).values({
    notificationId,
    userId,
  });

  return { success: true, alreadyRead: false };
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(
  userId: number,
  userRole: "user" | "admin"
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get all unread notifications for this user
  const unreadNotifications = await db
    .select({ id: notifications.id })
    .from(notifications)
    .where(
      and(
        or(
          eq(notifications.targetType, "all"),
          and(
            eq(notifications.targetType, "user"),
            eq(notifications.targetUserId, userId)
          ),
          and(
            eq(notifications.targetType, "role"),
            eq(notifications.targetRole, userRole)
          )
        ),
        sql`NOT EXISTS(
          SELECT 1 FROM ${notificationReads}
          WHERE ${notificationReads.notificationId} = ${notifications.id}
          AND ${notificationReads.userId} = ${userId}
        )`
      )
    );

  // Insert read records for all unread notifications
  if (unreadNotifications.length > 0) {
    await db.insert(notificationReads).values(
      unreadNotifications.map(n => ({
        notificationId: n.id,
        userId,
      }))
    );
  }

  return { success: true, markedCount: unreadNotifications.length };
}


// ============================================================
// Course Sessions 2026 Management
// ============================================================

/**
 * Get all course sessions from database
 */
export async function getAllCourseSessions2026() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const sessions = await db
    .select()
    .from(courseSessions2026)
    .orderBy(courseSessions2026.date, courseSessions2026.time);

  return sessions;
}

/**
 * Get active course sessions (for registration form)
 */
export async function getActiveCourseSessions2026() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const sessions = await db
    .select()
    .from(courseSessions2026)
    .where(eq(courseSessions2026.isActive, true))
    .orderBy(courseSessions2026.date, courseSessions2026.time);

  return sessions;
}

/**
 * Get a single course session by ID
 */
export async function getCourseSession2026ById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const session = await db
    .select()
    .from(courseSessions2026)
    .where(eq(courseSessions2026.id, id))
    .limit(1);

  return session[0] || null;
}

/**
 * Get a single course session by sessionId
 */
export async function getCourseSession2026BySessionId(sessionId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const session = await db
    .select()
    .from(courseSessions2026)
    .where(eq(courseSessions2026.sessionId, sessionId))
    .limit(1);

  return session[0] || null;
}

/**
 * Create a new course session
 */
export async function createCourseSession2026(data: {
  sessionId: string;
  name: string;
  date: string;
  time: string;
  dayOfWeek: string;
  location?: string;
  maxCapacity?: number;
  isActive?: boolean;
  notes?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(courseSessions2026).values({
    sessionId: data.sessionId,
    name: data.name,
    date: data.date,
    time: data.time,
    dayOfWeek: data.dayOfWeek,
    location: data.location || "台北",
    maxCapacity: data.maxCapacity || 30,
    isActive: data.isActive ?? true,
    notes: data.notes,
  });

  return { id: Number(result[0].insertId), ...data };
}

/**
 * Update a course session
 */
export async function updateCourseSession2026(
  id: number,
  data: Partial<{
    sessionId: string;
    name: string;
    date: string;
    time: string;
    dayOfWeek: string;
    location: string;
    maxCapacity: number;
    isActive: boolean;
    reminderSent: boolean;
    notes: string;
  }>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(courseSessions2026)
    .set(data)
    .where(eq(courseSessions2026.id, id));

  return { success: true };
}

/**
 * Delete a course session
 */
export async function deleteCourseSession2026(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(courseSessions2026).where(eq(courseSessions2026.id, id));
  return { success: true };
}

/**
 * Seed initial course sessions from hardcoded data
 */
export async function seedCourseSessions2026() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check if sessions already exist
  const existing = await db.select().from(courseSessions2026).limit(1);
  if (existing.length > 0) {
    return { success: true, message: "Sessions already seeded", count: 0 };
  }

  const initialSessions = [
    // 1 月課程
    { sessionId: "0120_1", name: "初階 1：AI 職場應用啟航班 - 策略視野與基礎建構", date: "2026-01-20", time: "9:00-12:00", dayOfWeek: "二" },
    { sessionId: "0127_1", name: "初階 1：AI 職場應用啟航班 - 策略視野與基礎建構", date: "2026-01-27", time: "9:00-12:00", dayOfWeek: "二" },
    { sessionId: "0120_2", name: "初階 2：AI 職場應用進階班 - 市場洞察與簡報自動化", date: "2026-01-20", time: "13:00-16:00", dayOfWeek: "二" },
    { sessionId: "0127_2", name: "初階 2：AI 職場應用進階班 - 市場洞察與簡報自動化", date: "2026-01-27", time: "13:00-16:00", dayOfWeek: "二" },
    { sessionId: "0122_3", name: "初階 3：AI 職場應用實戰班 - 知識內化與創意設計", date: "2026-01-22", time: "9:00-12:00", dayOfWeek: "四" },
    { sessionId: "0128_3", name: "初階 3：AI 職場應用實戰班 - 知識內化與創意設計", date: "2026-01-28", time: "9:00-12:00", dayOfWeek: "三" },
    { sessionId: "0122_4", name: "初階 4：AI 職場應用專精班 - 影像創作與內容策略", date: "2026-01-22", time: "13:00-16:00", dayOfWeek: "四" },
    { sessionId: "0128_4", name: "初階 4：AI 職場應用專精班 - 影像創作與內容策略", date: "2026-01-28", time: "13:00-16:00", dayOfWeek: "三" },
    // 2 月課程
    { sessionId: "0203_1", name: "初階 1：AI 職場應用啟航班 - 策略視野與基礎建構", date: "2026-02-03", time: "9:00-12:00", dayOfWeek: "二" },
    { sessionId: "0203_2", name: "初階 2：AI 職場應用進階班 - 市場洞察與簡報自動化", date: "2026-02-03", time: "13:00-16:00", dayOfWeek: "二" },
    { sessionId: "0205_3", name: "初階 3：AI 職場應用實戰班 - 知識內化與創意設計", date: "2026-02-05", time: "9:00-12:00", dayOfWeek: "四" },
    { sessionId: "0205_4", name: "初階 4：AI 職場應用專精班 - 影像創作與內容策略", date: "2026-02-05", time: "13:00-16:00", dayOfWeek: "四" },
    // 3 月課程
    { sessionId: "0305_1", name: "初階 1：AI 職場應用啟航班 - 策略視野與基礎建構", date: "2026-03-05", time: "9:00-12:00", dayOfWeek: "四" },
    { sessionId: "0312_1", name: "初階 1：AI 職場應用啟航班 - 策略視野與基礎建構", date: "2026-03-12", time: "9:00-12:00", dayOfWeek: "四" },
    { sessionId: "0305_2", name: "初階 2：AI 職場應用進階班 - 市場洞察與簡報自動化", date: "2026-03-05", time: "13:00-16:00", dayOfWeek: "四" },
    { sessionId: "0312_2", name: "初階 2：AI 職場應用進階班 - 市場洞察與簡報自動化", date: "2026-03-12", time: "13:00-16:00", dayOfWeek: "四" },
    { sessionId: "0311_3", name: "初階 3：AI 職場應用實戰班 - 知識內化與創意設計", date: "2026-03-11", time: "9:00-12:00", dayOfWeek: "三" },
    { sessionId: "0324_3", name: "初階 3：AI 職場應用實戰班 - 知識內化與創意設計", date: "2026-03-24", time: "9:00-12:00", dayOfWeek: "二" },
    { sessionId: "0311_4", name: "初階 4：AI 職場應用專精班 - 影像創作與內容策略", date: "2026-03-11", time: "13:00-16:00", dayOfWeek: "三" },
    { sessionId: "0324_4", name: "初階 4：AI 職場應用專精班 - 影像創作與內容策略", date: "2026-03-24", time: "13:00-16:00", dayOfWeek: "二" },
  ];

  for (const session of initialSessions) {
    await db.insert(courseSessions2026).values({
      ...session,
      location: "台北",
      maxCapacity: 30,
      isActive: true,
    });
  }

  return { success: true, message: "Sessions seeded successfully", count: initialSessions.length };
}

// ============================================================
// Course Attendance 2026 Management
// ============================================================

/**
 * Get or create attendance records for a session
 */
export async function getOrCreateSessionAttendance(sessionId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get all paid registrations for this session
  const allRegistrations = await db
    .select()
    .from(courseRegistrations2026)
    .where(eq(courseRegistrations2026.paymentStatus, "paid"));

  // Filter registrations that include this session
  const relevantRegistrations = allRegistrations.filter(reg => {
    try {
      const sessions = JSON.parse(reg.selectedSessions || "[]");
      return sessions.includes(sessionId);
    } catch {
      return false;
    }
  });

  // Get existing attendance records for this session
  const existingAttendance = await db
    .select()
    .from(courseAttendance2026)
    .where(eq(courseAttendance2026.sessionId, sessionId));

  const existingMap = new Map(
    existingAttendance.map(a => [`${a.registrationId}-${a.attendeeEmail}`, a])
  );

  // Create attendance records for new registrations
  const attendanceRecords: Array<{
    id: number;
    registrationId: number;
    sessionId: string;
    attendeeName: string;
    attendeeEmail: string;
    isAttended: boolean;
    checkInTime: Date | null;
    plan: string;
  }> = [];

  for (const reg of relevantRegistrations) {
    // First person
    const key1 = `${reg.id}-${reg.email1}`;
    if (!existingMap.has(key1)) {
      // Create new attendance record
      const result = await db.insert(courseAttendance2026).values({
        registrationId: reg.id,
        sessionId,
        attendeeName: reg.name1,
        attendeeEmail: reg.email1,
        isAttended: false,
      });
      attendanceRecords.push({
        id: Number(result[0].insertId),
        registrationId: reg.id,
        sessionId,
        attendeeName: reg.name1,
        attendeeEmail: reg.email1,
        isAttended: false,
        checkInTime: null,
        plan: reg.plan,
      });
    } else {
      const existing = existingMap.get(key1)!;
      attendanceRecords.push({
        id: existing.id,
        registrationId: existing.registrationId,
        sessionId: existing.sessionId,
        attendeeName: existing.attendeeName,
        attendeeEmail: existing.attendeeEmail,
        isAttended: existing.isAttended,
        checkInTime: existing.checkInTime,
        plan: reg.plan,
      });
    }

    // Second person (for double plan)
    if (reg.plan === "double" && reg.name2 && reg.email2) {
      const key2 = `${reg.id}-${reg.email2}`;
      if (!existingMap.has(key2)) {
        const result = await db.insert(courseAttendance2026).values({
          registrationId: reg.id,
          sessionId,
          attendeeName: reg.name2,
          attendeeEmail: reg.email2,
          isAttended: false,
        });
        attendanceRecords.push({
          id: Number(result[0].insertId),
          registrationId: reg.id,
          sessionId,
          attendeeName: reg.name2,
          attendeeEmail: reg.email2,
          isAttended: false,
          checkInTime: null,
          plan: reg.plan,
        });
      } else {
        const existing = existingMap.get(key2)!;
        attendanceRecords.push({
          id: existing.id,
          registrationId: existing.registrationId,
          sessionId: existing.sessionId,
          attendeeName: existing.attendeeName,
          attendeeEmail: existing.attendeeEmail,
          isAttended: existing.isAttended,
          checkInTime: existing.checkInTime,
          plan: reg.plan,
        });
      }
    }
  }

  return attendanceRecords;
}

/**
 * Update attendance status
 */
export async function updateAttendanceStatus(
  attendanceId: number,
  isAttended: boolean,
  checkedBy?: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(courseAttendance2026)
    .set({
      isAttended,
      checkInTime: isAttended ? new Date() : null,
      checkedBy: checkedBy || null,
    })
    .where(eq(courseAttendance2026.id, attendanceId));

  return { success: true };
}

/**
 * Get attendance statistics for a session
 */
export async function getSessionAttendanceStats(sessionId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const attendance = await db
    .select()
    .from(courseAttendance2026)
    .where(eq(courseAttendance2026.sessionId, sessionId));

  const total = attendance.length;
  const attended = attendance.filter(a => a.isAttended).length;
  const notAttended = total - attended;

  return {
    total,
    attended,
    notAttended,
    attendanceRate: total > 0 ? Math.round((attended / total) * 100) : 0,
  };
}

/**
 * Get sessions with registrations from database
 */
export async function getCourseSessionsWithRegistrationsFromDB(monthFilter?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get all sessions from database
  let sessionsQuery = db
    .select()
    .from(courseSessions2026)
    .orderBy(courseSessions2026.date, courseSessions2026.time);

  const sessions = await sessionsQuery;

  // Filter by month if specified
  const filteredSessions = monthFilter
    ? sessions.filter(s => s.date.startsWith(`2026-${monthFilter}`))
    : sessions;

  // Get all paid registrations
  const allRegistrations = await db
    .select()
    .from(courseRegistrations2026);

  // Get attendance records
  const attendanceRecords = await db
    .select()
    .from(courseAttendance2026);

  // Build sessions with registrations
  const sessionsWithRegistrations = filteredSessions.map(session => {
    const registrations: Array<{
      id: number;
      name: string;
      email: string;
      phone: string;
      industry: string | null;
      plan: string;
      paymentStatus: string;
      isSecondPerson: boolean;
      attended: boolean;
    }> = [];

    allRegistrations.forEach(reg => {
      try {
        const selectedSessions = JSON.parse(reg.selectedSessions || "[]");
        if (selectedSessions.includes(session.sessionId)) {
          // Check attendance for first person
          const firstPersonAttendance = attendanceRecords.find(
            a => a.sessionId === session.sessionId && a.registrationId === reg.id && a.attendeeEmail === reg.email1
          );
          
          // Add first person
          registrations.push({
            id: reg.id,
            name: reg.name1,
            email: reg.email1,
            phone: reg.phone1,
            industry: reg.industry1,
            plan: reg.plan,
            paymentStatus: reg.paymentStatus,
            isSecondPerson: false,
            attended: firstPersonAttendance?.isAttended || false,
          });

          // Add second person for double plan
          if (reg.plan === "double" && reg.name2 && reg.email2) {
            const secondPersonAttendance = attendanceRecords.find(
              a => a.sessionId === session.sessionId && a.registrationId === reg.id && a.attendeeEmail === reg.email2
            );
            
            registrations.push({
              id: reg.id,
              name: reg.name2,
              email: reg.email2,
              phone: reg.phone2 || "",
              industry: reg.industry2,
              plan: reg.plan,
              paymentStatus: reg.paymentStatus,
              isSecondPerson: true,
              attended: secondPersonAttendance?.isAttended || false,
            });
          }
        }
      } catch (e) {
        console.error("Failed to parse selectedSessions:", e);
      }
    });

    // Count paid registrations
    let paidCount = 0;
    let pendingCount = 0;
    registrations.forEach(reg => {
      if (reg.paymentStatus === "paid") {
        paidCount += 1;
      } else if (reg.paymentStatus === "pending") {
        pendingCount += 1;
      }
    });

    return {
      id: session.id,
      sessionId: session.sessionId,
      sessionName: session.name,
      sessionDate: session.date,
      sessionTime: session.time,
      dayOfWeek: session.dayOfWeek,
      location: session.location,
      maxCapacity: session.maxCapacity,
      isActive: session.isActive,
      registrations,
      paidCount,
      pendingCount,
      totalCount: paidCount + pendingCount,
    };
  });

  return sessionsWithRegistrations;
}

/**
 * Get sessions that need reminder (tomorrow's sessions that haven't been reminded)
 */
export async function getSessionsNeedingReminder() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get tomorrow's date in YYYY-MM-DD format
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];

  const sessions = await db
    .select()
    .from(courseSessions2026)
    .where(
      and(
        eq(courseSessions2026.date, tomorrowStr),
        eq(courseSessions2026.isActive, true),
        eq(courseSessions2026.reminderSent, false)
      )
    );

  return sessions;
}

/**
 * Get registrations for a specific session (for sending reminders)
 */
export async function getRegistrationsForSession(sessionId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const allRegistrations = await db
    .select()
    .from(courseRegistrations2026)
    .where(eq(courseRegistrations2026.paymentStatus, "paid"));

  const registrations: Array<{
    id: number;
    name: string;
    email: string;
    phone: string;
  }> = [];

  allRegistrations.forEach(reg => {
    try {
      const selectedSessions = JSON.parse(reg.selectedSessions || "[]");
      if (selectedSessions.includes(sessionId)) {
        registrations.push({
          id: reg.id,
          name: reg.name1,
          email: reg.email1,
          phone: reg.phone1,
        });

        if (reg.plan === "double" && reg.name2 && reg.email2) {
          registrations.push({
            id: reg.id,
            name: reg.name2,
            email: reg.email2,
            phone: reg.phone2 || "",
          });
        }
      }
    } catch (e) {
      console.error("Failed to parse selectedSessions:", e);
    }
  });

  return registrations;
}

/**
 * Mark session reminder as sent
 */
export async function markSessionReminderSent(sessionId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(courseSessions2026)
    .set({ reminderSent: true })
    .where(eq(courseSessions2026.sessionId, sessionId));

  return { success: true };
}


/**
 * Update attendance status by registration info
 */
export async function updateAttendanceByRegistration(
  sessionId: string,
  registrationId: number,
  isSecondPerson: boolean,
  attended: boolean,
  checkedBy: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get the registration to find the attendee info
  const registration = await db
    .select()
    .from(courseRegistrations2026)
    .where(eq(courseRegistrations2026.id, registrationId))
    .limit(1);

  if (registration.length === 0) {
    throw new Error("Registration not found");
  }

  const reg = registration[0];
  const attendeeName = isSecondPerson ? reg.name2 : reg.name1;
  const attendeeEmail = isSecondPerson ? reg.email2 : reg.email1;

  if (!attendeeName || !attendeeEmail) {
    throw new Error("Attendee info not found");
  }

  // Check if attendance record exists
  const existingAttendance = await db
    .select()
    .from(courseAttendance2026)
    .where(
      and(
        eq(courseAttendance2026.sessionId, sessionId),
        eq(courseAttendance2026.registrationId, registrationId),
        eq(courseAttendance2026.attendeeEmail, attendeeEmail)
      )
    )
    .limit(1);

  if (existingAttendance.length > 0) {
    // Update existing record
    await db
      .update(courseAttendance2026)
      .set({
        isAttended: attended,
        checkInTime: attended ? new Date() : null,
        checkedBy,
      })
      .where(eq(courseAttendance2026.id, existingAttendance[0].id));

    return { success: true, id: existingAttendance[0].id };
  } else {
    // Create new record
    const result = await db.insert(courseAttendance2026).values({
      sessionId,
      registrationId,
      attendeeName,
      attendeeEmail,
      isAttended: attended,
      checkInTime: attended ? new Date() : null,
      checkedBy,
    });

    return { success: true, id: Number(result[0].insertId) };
  }
}


// ============================================================
// Course Transfers 2026 Management
// ============================================================

/**
 * Get available sessions for transfer (same course type, different date)
 */
export async function getAvailableTransferSessions(
  currentSessionId: string,
  registrationId: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get current session info
  const currentSession = await db
    .select()
    .from(courseSessions2026)
    .where(eq(courseSessions2026.sessionId, currentSessionId))
    .limit(1);

  if (currentSession.length === 0) {
    throw new Error("Current session not found");
  }

  const current = currentSession[0];

  // Get registration to check already selected sessions
  const registration = await db
    .select()
    .from(courseRegistrations2026)
    .where(eq(courseRegistrations2026.id, registrationId))
    .limit(1);

  if (registration.length === 0) {
    throw new Error("Registration not found");
  }

  const selectedSessions = JSON.parse(registration[0].selectedSessions || "[]");

  // Get all active sessions with the same course name
  const availableSessions = await db
    .select()
    .from(courseSessions2026)
    .where(
      and(
        eq(courseSessions2026.name, current.name),
        eq(courseSessions2026.isActive, true),
        ne(courseSessions2026.sessionId, currentSessionId)
      )
    )
    .orderBy(courseSessions2026.date, courseSessions2026.time);

  // Filter out sessions already selected by this registration
  const filteredSessions = availableSessions.filter(
    s => !selectedSessions.includes(s.sessionId)
  );

  return filteredSessions;
}

/**
 * Execute course transfer
 */
export async function executeCourseTransfer(data: {
  registrationId: number;
  attendeeEmail: string;
  fromSessionId: string;
  toSessionId: string;
  reason?: string;
  transferredBy?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get registration
  const registration = await db
    .select()
    .from(courseRegistrations2026)
    .where(eq(courseRegistrations2026.id, data.registrationId))
    .limit(1);

  if (registration.length === 0) {
    throw new Error("Registration not found");
  }

  const reg = registration[0];
  const selectedSessions: string[] = JSON.parse(reg.selectedSessions || "[]");

  // Check if fromSessionId is in the selected sessions
  if (!selectedSessions.includes(data.fromSessionId)) {
    throw new Error("Original session not found in registration");
  }

  // Check if toSessionId is already in the selected sessions
  if (selectedSessions.includes(data.toSessionId)) {
    throw new Error("Target session already selected");
  }

  // Update selected sessions
  const newSelectedSessions = selectedSessions.map(s =>
    s === data.fromSessionId ? data.toSessionId : s
  );

  // Update registration
  await db
    .update(courseRegistrations2026)
    .set({
      selectedSessions: JSON.stringify(newSelectedSessions),
    })
    .where(eq(courseRegistrations2026.id, data.registrationId));

  // Create transfer record
  const result = await db.insert(courseTransfers2026).values({
    registrationId: data.registrationId,
    attendeeEmail: data.attendeeEmail,
    fromSessionId: data.fromSessionId,
    toSessionId: data.toSessionId,
    reason: data.reason,
    transferredBy: data.transferredBy,
  });

  // Update attendance records if any
  await db
    .update(courseAttendance2026)
    .set({ sessionId: data.toSessionId })
    .where(
      and(
        eq(courseAttendance2026.sessionId, data.fromSessionId),
        eq(courseAttendance2026.registrationId, data.registrationId),
        eq(courseAttendance2026.attendeeEmail, data.attendeeEmail)
      )
    );

  return { success: true, transferId: Number(result[0].insertId) };
}

/**
 * Get transfer history for a registration
 */
export async function getTransferHistory(registrationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const transfers = await db
    .select()
    .from(courseTransfers2026)
    .where(eq(courseTransfers2026.registrationId, registrationId))
    .orderBy(desc(courseTransfers2026.createdAt));

  return transfers;
}
