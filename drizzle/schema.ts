import { pgTable, serial, integer, varchar, text, timestamp, boolean, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ============== Enums ==============
export const roleEnum = pgEnum("role", ["user", "admin"]);
export const postStatusEnum = pgEnum("post_status", ["draft", "published"]);
export const contactInquiryTypeEnum = pgEnum("contact_inquiry_type", [
  "enterprise",
  "public",
  "coaching",
  "enterprise_training",
  "one_on_one",
  "collaboration",
  "media",
  "other"
]);
export const contactStatusEnum = pgEnum("contact_status", ["pending", "contacted", "resolved"]);
export const eventStatusEnum = pgEnum("event_status", ["draft", "published", "cancelled", "completed"]);
export const registrationStatusEnum = pgEnum("registration_status", ["registered", "confirmed", "cancelled", "attended"]);
export const discountTypeEnum = pgEnum("discount_type", ["percentage", "fixed"]);
export const paymentStatusEnum = pgEnum("payment_status", ["pending", "paid", "failed", "refunded"]);
export const referralSourceEnum = pgEnum("referral_source", [
  "teacher_afeng",
  "friend",
  "facebook",
  "threads",
  "youtube",
  "instagram",
  "other"
]);
export const videoCourseStatusEnum = pgEnum("video_course_status", ["draft", "published", "archived"]);
export const userTypeEnum = pgEnum("user_type", ["new", "returning"]);
export const paymentMethodEnum = pgEnum("payment_method", ["transfer", "online"]);
export const coursePaymentStatusEnum = pgEnum("course_payment_status", ["pending", "paid", "failed"]);
export const courseStatusEnum = pgEnum("course_status", ["registered", "confirmed", "cancelled"]);
export const notificationTypeEnum = pgEnum("notification_type", ["info", "warning", "success", "error"]);
export const targetTypeEnum = pgEnum("target_type", ["all", "user", "role"]);
export const targetRoleEnum = pgEnum("target_role", ["user", "admin"]);

// ============== Tables ==============

/**
 * Core user table backing auth flow.
 */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: roleEnum("role").default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Blog categories table
 */
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;

/**
 * Blog tags table
 */
export const tags = pgTable("tags", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(),
  slug: varchar("slug", { length: 50 }).notNull().unique(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Tag = typeof tags.$inferSelect;
export type InsertTag = typeof tags.$inferInsert;

/**
 * Blog posts table
 */
export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  excerpt: text("excerpt"),
  content: text("content").notNull(),
  coverImage: varchar("coverImage", { length: 500 }),
  categoryId: integer("categoryId"),
  authorId: integer("authorId").notNull(),
  status: postStatusEnum("status").default("draft").notNull(),
  publishedAt: timestamp("publishedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  viewCount: integer("viewCount").default(0).notNull(),
});

export type Post = typeof posts.$inferSelect;
export type InsertPost = typeof posts.$inferInsert;

/**
 * Post-Tag many-to-many relationship table
 */
export const postTags = pgTable("postTags", {
  id: serial("id").primaryKey(),
  postId: integer("postId").notNull(),
  tagId: integer("tagId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PostTag = typeof postTags.$inferSelect;
export type InsertPostTag = typeof postTags.$inferInsert;

// Relations
export const postsRelations = relations(posts, ({ one, many }) => ({
  author: one(users, {
    fields: [posts.authorId],
    references: [users.id],
  }),
  category: one(categories, {
    fields: [posts.categoryId],
    references: [categories.id],
  }),
  tags: many(postTags),
}));

export const postTagsRelations = relations(postTags, ({ one }) => ({
  post: one(posts, {
    fields: [postTags.postId],
    references: [posts.id],
  }),
  tag: one(tags, {
    fields: [postTags.tagId],
    references: [tags.id],
  }),
}));

/**
 * Contact form submissions table
 */
export const contacts = pgTable("contacts", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  company: varchar("company", { length: 200 }),
  jobTitle: varchar("jobTitle", { length: 100 }),
  inquiryType: contactInquiryTypeEnum("inquiryType").notNull(),
  message: text("message").notNull(),
  status: contactStatusEnum("status").default("pending").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Contact = typeof contacts.$inferSelect;
export type InsertContact = typeof contacts.$inferInsert;

/**
 * Events table - 活動/課程資料表
 */
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  subtitle: varchar("subtitle", { length: 500 }),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description").notNull(),
  highlights: text("highlights"),
  targetAudience: text("targetAudience"),
  speakerInfo: text("speakerInfo"),
  coverImage: varchar("coverImage", { length: 500 }),
  videoUrl: varchar("videoUrl", { length: 500 }),
  images: text("images"),
  eventDate: timestamp("eventDate").notNull(),
  eventEndDate: timestamp("eventEndDate"),
  eventTime: varchar("eventTime", { length: 100 }),
  location: varchar("location", { length: 255 }).notNull(),
  locationDetails: text("locationDetails"),
  meetingUrl: varchar("meetingUrl", { length: 500 }),
  externalRegistrationUrl: varchar("externalRegistrationUrl", { length: 500 }),
  price: integer("price").default(0).notNull(),
  maxAttendees: integer("maxAttendees"),
  status: eventStatusEnum("status").default("draft").notNull(),
  registrationEnabled: boolean("registrationEnabled").default(true).notNull(),
  registrationDeadline: timestamp("registrationDeadline"),
  registrationInfo: text("registrationInfo"),
  tags: text("tags"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Event = typeof events.$inferSelect;
export type InsertEvent = typeof events.$inferInsert;

/**
 * Event registrations table - 活動報名資料表
 */
export const eventRegistrations = pgTable("eventRegistrations", {
  id: serial("id").primaryKey(),
  eventId: integer("eventId").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  attendeeCount: integer("attendeeCount").default(1),
  profession: varchar("profession", { length: 200 }),
  referralPerson: varchar("referralPerson", { length: 100 }),
  hasAiExperience: boolean("hasAiExperience"),
  aiToolsUsed: text("aiToolsUsed"),
  hasTakenAiCourse: boolean("hasTakenAiCourse"),
  courseExpectations: text("courseExpectations"),
  company: varchar("company", { length: 200 }),
  jobTitle: varchar("jobTitle", { length: 100 }),
  referralSource: text("referralSource"),
  bniChapter: text("bniChapter"),
  status: registrationStatusEnum("status").default("registered").notNull(),
  emailSent: boolean("emailSent").default(false).notNull(),
  subscribeNewsletter: boolean("subscribeNewsletter").default(false).notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type EventRegistration = typeof eventRegistrations.$inferSelect;
export type InsertEventRegistration = typeof eventRegistrations.$inferInsert;

// Event relations
export const eventsRelations = relations(events, ({ many }) => ({
  registrations: many(eventRegistrations),
  orders: many(orders),
}));

export const eventRegistrationsRelations = relations(eventRegistrations, ({ one }) => ({
  event: one(events, {
    fields: [eventRegistrations.eventId],
    references: [events.id],
  }),
}));

/**
 * Article access whitelist table
 */
export const articleAccessWhitelist = pgTable("articleAccessWhitelist", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 320 }).notNull(),
  articleSlug: varchar("articleSlug", { length: 200 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type ArticleAccessWhitelist = typeof articleAccessWhitelist.$inferSelect;
export type InsertArticleAccessWhitelist = typeof articleAccessWhitelist.$inferInsert;

/**
 * Download leads table - 下載資源註冊資料表
 */
export const downloadLeads = pgTable("downloadLeads", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  resourceSlug: varchar("resourceSlug", { length: 200 }).notNull(),
  resourceTitle: varchar("resourceTitle", { length: 500 }).notNull(),
  downloadUrl: text("downloadUrl").notNull(),
  downloadedAt: timestamp("downloadedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DownloadLead = typeof downloadLeads.$inferSelect;
export type InsertDownloadLead = typeof downloadLeads.$inferInsert;

/**
 * Promo codes table - 優惠代碼資料表
 */
export const promoCodes = pgTable("promoCodes", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  description: varchar("description", { length: 255 }),
  discountType: discountTypeEnum("discountType").notNull(),
  discountValue: integer("discountValue").notNull(),
  minAmount: integer("minAmount").default(0).notNull(),
  maxUses: integer("maxUses"),
  usedCount: integer("usedCount").default(0).notNull(),
  eventId: integer("eventId"),
  validFrom: timestamp("validFrom"),
  validUntil: timestamp("validUntil"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type PromoCode = typeof promoCodes.$inferSelect;
export type InsertPromoCode = typeof promoCodes.$inferInsert;

/**
 * Orders table - 訂單資料表
 */
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderNo: varchar("orderNo", { length: 50 }).notNull().unique(),
  eventId: integer("eventId").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  company: varchar("company", { length: 200 }),
  jobTitle: varchar("jobTitle", { length: 100 }),
  referralSource: referralSourceEnum("referralSource"),
  referralSourceOther: varchar("referralSourceOther", { length: 200 }),
  interestedTopics: text("interestedTopics"),
  originalAmount: integer("originalAmount").notNull(),
  discountAmount: integer("discountAmount").default(0).notNull(),
  finalAmount: integer("finalAmount").notNull(),
  promoCodeId: integer("promoCodeId"),
  promoCode: varchar("promoCode", { length: 50 }),
  paymentStatus: paymentStatusEnum("paymentStatus").default("pending").notNull(),
  paymentMethod: varchar("paymentMethod", { length: 50 }),
  newebpayTradeNo: varchar("newebpayTradeNo", { length: 50 }),
  paidAt: timestamp("paidAt"),
  notes: text("notes"),
  needInvoice: boolean("needInvoice").default(false).notNull(),
  taxId: varchar("taxId", { length: 20 }),
  invoiceTitle: varchar("invoiceTitle", { length: 200 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

// Order relations
export const ordersRelations = relations(orders, ({ one }) => ({
  event: one(events, {
    fields: [orders.eventId],
    references: [events.id],
  }),
  promoCodeRef: one(promoCodes, {
    fields: [orders.promoCodeId],
    references: [promoCodes.id],
  }),
}));

export const promoCodesRelations = relations(promoCodes, ({ one, many }) => ({
  event: one(events, {
    fields: [promoCodes.eventId],
    references: [events.id],
  }),
  orders: many(orders),
}));


/**
 * Video Courses table - 錄播課程資料表
 */
export const videoCourses = pgTable("videoCourses", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  subtitle: varchar("subtitle", { length: 500 }),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description").notNull(),
  highlights: text("highlights"),
  targetAudience: text("targetAudience"),
  coverImage: varchar("coverImage", { length: 500 }),
  previewVideoUrl: varchar("previewVideoUrl", { length: 500 }),
  videoUrl: varchar("videoUrl", { length: 500 }).notNull(),
  videoDuration: integer("videoDuration"),
  slidesUrl: varchar("slidesUrl", { length: 500 }),
  price: integer("price").notNull(),
  originalPrice: integer("originalPrice"),
  studentGroupUrl: varchar("studentGroupUrl", { length: 500 }),
  studentCount: integer("studentCount").default(0).notNull(),
  rating: integer("rating").default(0).notNull(),
  reviewCount: integer("reviewCount").default(0).notNull(),
  status: videoCourseStatusEnum("status").default("draft").notNull(),
  publishedAt: timestamp("publishedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type VideoCourse = typeof videoCourses.$inferSelect;
export type InsertVideoCourse = typeof videoCourses.$inferInsert;

/**
 * Video Course Purchases table - 錄播課程購買記錄資料表
 */
export const videoCoursePurchases = pgTable("videoCoursePurchases", {
  id: serial("id").primaryKey(),
  orderNo: varchar("orderNo", { length: 50 }).notNull().unique(),
  userId: integer("userId").notNull(),
  courseId: integer("courseId").notNull(),
  originalAmount: integer("originalAmount").notNull(),
  discountAmount: integer("discountAmount").default(0).notNull(),
  finalAmount: integer("finalAmount").notNull(),
  promoCodeId: integer("promoCodeId"),
  promoCode: varchar("promoCode", { length: 50 }),
  paymentStatus: paymentStatusEnum("paymentStatus").default("pending").notNull(),
  paymentMethod: varchar("paymentMethod", { length: 50 }),
  newebpayTradeNo: varchar("newebpayTradeNo", { length: 50 }),
  paidAt: timestamp("paidAt"),
  accessGrantedAt: timestamp("accessGrantedAt"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type VideoCoursePurchase = typeof videoCoursePurchases.$inferSelect;
export type InsertVideoCoursePurchase = typeof videoCoursePurchases.$inferInsert;

/**
 * Video Course Notes table - 錄播課程筆記資料表
 */
export const videoCourseNotes = pgTable("videoCourseNotes", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  courseId: integer("courseId").notNull(),
  content: text("content").notNull(),
  videoTimestamp: integer("videoTimestamp"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type VideoCourseNote = typeof videoCourseNotes.$inferSelect;
export type InsertVideoCourseNote = typeof videoCourseNotes.$inferInsert;

/**
 * Video Course Reviews table - 錄播課程評價資料表
 */
export const videoCourseReviews = pgTable("videoCourseReviews", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  courseId: integer("courseId").notNull(),
  rating: integer("rating").notNull(),
  content: text("content"),
  isVerifiedPurchase: boolean("isVerifiedPurchase").default(true).notNull(),
  isPublished: boolean("isPublished").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type VideoCourseReview = typeof videoCourseReviews.$inferSelect;
export type InsertVideoCourseReview = typeof videoCourseReviews.$inferInsert;

// Video Course Relations
export const videoCoursesRelations = relations(videoCourses, ({ many }) => ({
  purchases: many(videoCoursePurchases),
  notes: many(videoCourseNotes),
  reviews: many(videoCourseReviews),
}));

export const videoCoursePurchasesRelations = relations(videoCoursePurchases, ({ one }) => ({
  user: one(users, {
    fields: [videoCoursePurchases.userId],
    references: [users.id],
  }),
  course: one(videoCourses, {
    fields: [videoCoursePurchases.courseId],
    references: [videoCourses.id],
  }),
  promoCodeRef: one(promoCodes, {
    fields: [videoCoursePurchases.promoCodeId],
    references: [promoCodes.id],
  }),
}));

export const videoCourseNotesRelations = relations(videoCourseNotes, ({ one }) => ({
  user: one(users, {
    fields: [videoCourseNotes.userId],
    references: [users.id],
  }),
  course: one(videoCourses, {
    fields: [videoCourseNotes.courseId],
    references: [videoCourses.id],
  }),
}));

export const videoCourseReviewsRelations = relations(videoCourseReviews, ({ one }) => ({
  user: one(users, {
    fields: [videoCourseReviews.userId],
    references: [users.id],
  }),
  course: one(videoCourses, {
    fields: [videoCourseReviews.courseId],
    references: [videoCourses.id],
  }),
}));

/**
 * 2026 AI Course Registrations table - 2026 AI 實戰應用課報名資料表
 */
export const courseRegistrations2026 = pgTable("courseRegistrations2026", {
  id: serial("id").primaryKey(),
  userType: userTypeEnum("userType").notNull(),
  plan: varchar("plan", { length: 50 }).notNull(),
  planPrice: integer("planPrice").notNull(),
  selectedSessions: text("selectedSessions").notNull(),
  selectedMonth: varchar("selectedMonth", { length: 20 }),
  name1: varchar("name1", { length: 100 }).notNull(),
  phone1: varchar("phone1", { length: 20 }).notNull(),
  email1: varchar("email1", { length: 320 }).notNull(),
  industry1: varchar("industry1", { length: 200 }),
  name2: varchar("name2", { length: 100 }),
  phone2: varchar("phone2", { length: 20 }),
  email2: varchar("email2", { length: 320 }),
  industry2: varchar("industry2", { length: 200 }),
  paymentMethod: paymentMethodEnum("paymentMethod").notNull(),
  transferLast5: varchar("transferLast5", { length: 5 }),
  promoCode: varchar("promoCode", { length: 50 }),
  needInvoice: boolean("needInvoice").default(false).notNull(),
  taxId: varchar("taxId", { length: 20 }),
  invoiceTitle: varchar("invoiceTitle", { length: 200 }),
  paymentStatus: coursePaymentStatusEnum("paymentStatus").default("pending").notNull(),
  newebpayTradeNo: varchar("newebpayTradeNo", { length: 100 }),
  subscribeNewsletter: boolean("subscribeNewsletter").default(false).notNull(),
  status: courseStatusEnum("status").default("registered").notNull(),
  emailSent: boolean("emailSent").default(false).notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type CourseRegistration2026 = typeof courseRegistrations2026.$inferSelect;
export type InsertCourseRegistration2026 = typeof courseRegistrations2026.$inferInsert;

/**
 * Notifications table - 通知系統資料表
 */
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  content: text("content").notNull(),
  type: notificationTypeEnum("type").default("info").notNull(),
  targetType: targetTypeEnum("targetType").default("all").notNull(),
  targetUserId: integer("targetUserId"),
  targetRole: targetRoleEnum("targetRole"),
  link: varchar("link", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

/**
 * Notification Reads table - 通知已讀記錄表
 */
export const notificationReads = pgTable("notificationReads", {
  id: serial("id").primaryKey(),
  notificationId: integer("notificationId").notNull(),
  userId: integer("userId").notNull(),
  readAt: timestamp("readAt").defaultNow().notNull(),
});

export type NotificationRead = typeof notificationReads.$inferSelect;
export type InsertNotificationRead = typeof notificationReads.$inferInsert;

// Notification Relations
export const notificationsRelations = relations(notifications, ({ many }) => ({
  reads: many(notificationReads),
}));

export const notificationReadsRelations = relations(notificationReads, ({ one }) => ({
  notification: one(notifications, {
    fields: [notificationReads.notificationId],
    references: [notifications.id],
  }),
  user: one(users, {
    fields: [notificationReads.userId],
    references: [users.id],
  }),
}));


/**
 * 2026 Course Sessions table - 2026 課程場次資料表
 */
export const courseSessions2026 = pgTable("courseSessions2026", {
  id: serial("id").primaryKey(),
  sessionId: varchar("sessionId", { length: 20 }).notNull().unique(),
  name: varchar("name", { length: 200 }).notNull(),
  date: varchar("date", { length: 20 }).notNull(),
  time: varchar("time", { length: 20 }).notNull(),
  dayOfWeek: varchar("dayOfWeek", { length: 10 }).notNull(),
  location: varchar("location", { length: 200 }).default("台北").notNull(),
  maxCapacity: integer("maxCapacity").default(30).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  reminderSent: boolean("reminderSent").default(false).notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type CourseSession2026 = typeof courseSessions2026.$inferSelect;
export type InsertCourseSession2026 = typeof courseSessions2026.$inferInsert;

/**
 * 2026 Course Attendance table - 2026 課程出席記錄表
 */
export const courseAttendance2026 = pgTable("courseAttendance2026", {
  id: serial("id").primaryKey(),
  registrationId: integer("registrationId").notNull(),
  sessionId: varchar("sessionId", { length: 20 }).notNull(),
  attendeeName: varchar("attendeeName", { length: 100 }).notNull(),
  attendeeEmail: varchar("attendeeEmail", { length: 320 }).notNull(),
  isAttended: boolean("isAttended").default(false).notNull(),
  checkInTime: timestamp("checkInTime"),
  checkedBy: integer("checkedBy"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type CourseAttendance2026 = typeof courseAttendance2026.$inferSelect;
export type InsertCourseAttendance2026 = typeof courseAttendance2026.$inferInsert;

// Course Sessions Relations
export const courseSessions2026Relations = relations(courseSessions2026, ({ many }) => ({
  attendances: many(courseAttendance2026),
}));

export const courseAttendance2026Relations = relations(courseAttendance2026, ({ one }) => ({
  registration: one(courseRegistrations2026, {
    fields: [courseAttendance2026.registrationId],
    references: [courseRegistrations2026.id],
  }),
}));


/**
 * Course Transfers 2026 table - 2026 課程調課記錄資料表
 */
export const courseTransfers2026 = pgTable("courseTransfers2026", {
  id: serial("id").primaryKey(),
  registrationId: integer("registrationId").notNull(),
  attendeeEmail: varchar("attendeeEmail", { length: 320 }).notNull(),
  fromSessionId: varchar("fromSessionId", { length: 50 }).notNull(),
  toSessionId: varchar("toSessionId", { length: 50 }).notNull(),
  reason: text("reason"),
  transferredBy: varchar("transferredBy", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CourseTransfer2026 = typeof courseTransfers2026.$inferSelect;
export type InsertCourseTransfer2026 = typeof courseTransfers2026.$inferInsert;

export const courseTransfers2026Relations = relations(courseTransfers2026, ({ one }) => ({
  registration: one(courseRegistrations2026, {
    fields: [courseTransfers2026.registrationId],
    references: [courseRegistrations2026.id],
  }),
}));
