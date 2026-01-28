import { mysqlTable, int, varchar, text, timestamp, boolean, mysqlEnum } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Blog categories table
 */
export const categories = mysqlTable("categories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;

/**
 * Blog tags table
 */
export const tags = mysqlTable("tags", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(),
  slug: varchar("slug", { length: 50 }).notNull().unique(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Tag = typeof tags.$inferSelect;
export type InsertTag = typeof tags.$inferInsert;

/**
 * Blog posts table
 */
export const posts = mysqlTable("posts", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  excerpt: text("excerpt"),
  content: text("content").notNull(),
  coverImage: varchar("coverImage", { length: 500 }),
  categoryId: int("categoryId"),
  authorId: int("authorId").notNull(),
  status: mysqlEnum("status", ["draft", "published"]).default("draft").notNull(),
  publishedAt: timestamp("publishedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  viewCount: int("viewCount").default(0).notNull(),
});

export type Post = typeof posts.$inferSelect;
export type InsertPost = typeof posts.$inferInsert;

/**
 * Post-Tag many-to-many relationship table
 */
export const postTags = mysqlTable("postTags", {
  id: int("id").autoincrement().primaryKey(),
  postId: int("postId").notNull(),
  tagId: int("tagId").notNull(),
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
export const contacts = mysqlTable("contacts", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  company: varchar("company", { length: 200 }),
  jobTitle: varchar("jobTitle", { length: 100 }),
  inquiryType: mysqlEnum("inquiryType", [
    "enterprise",
    "public",
    "coaching",
    "enterprise_training",
    "one_on_one",
    "collaboration",
    "media",
    "other"
  ]).notNull(),
  message: text("message").notNull(),
  status: mysqlEnum("status", ["pending", "contacted", "resolved"]).default("pending").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Contact = typeof contacts.$inferSelect;
export type InsertContact = typeof contacts.$inferInsert;

/**
 * Events table - 活動/課程資料表
 */
export const events = mysqlTable("events", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  subtitle: varchar("subtitle", { length: 500 }),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description").notNull(),
  highlights: text("highlights"), // JSON string for highlights array
  targetAudience: text("targetAudience"), // JSON string for target audience array
  speakerInfo: text("speakerInfo"), // Speaker introduction
  coverImage: varchar("coverImage", { length: 500 }),
  videoUrl: varchar("videoUrl", { length: 500 }), // YouTube embed URL
  images: text("images"), // JSON string for image URLs array
  eventDate: timestamp("eventDate").notNull(),
  eventEndDate: timestamp("eventEndDate"),
  eventTime: varchar("eventTime", { length: 100 }), // e.g., "20:00 - 21:00"
  location: varchar("location", { length: 255 }).notNull(), // e.g., "線上直播"
  locationDetails: text("locationDetails"), // Additional location info
  meetingUrl: varchar("meetingUrl", { length: 500 }), // Google Meet / Zoom URL
  externalRegistrationUrl: varchar("externalRegistrationUrl", { length: 500 }), // External registration URL (e.g., Accupass)
  price: int("price").default(0).notNull(), // 0 for free events
  maxAttendees: int("maxAttendees"), // null for unlimited
  status: mysqlEnum("status", ["draft", "published", "cancelled", "completed"]).default("draft").notNull(),
  registrationEnabled: boolean("registrationEnabled").default(true).notNull(), // Manual control for registration availability
  registrationDeadline: timestamp("registrationDeadline"), // Independent registration deadline
  registrationInfo: text("registrationInfo"), // Custom registration information/instructions
  tags: text("tags"), // JSON string for tags array, e.g., ["AI現場分享會", "工作坊"]
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Event = typeof events.$inferSelect;
export type InsertEvent = typeof events.$inferInsert;

/**
 * Event registrations table - 活動報名資料表
 */
export const eventRegistrations = mysqlTable("eventRegistrations", {
  id: int("id").autoincrement().primaryKey(),
  eventId: int("eventId").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  attendeeCount: int("attendeeCount").default(1),
  profession: varchar("profession", { length: 200 }),
  referralPerson: varchar("referralPerson", { length: 100 }),
  hasAiExperience: boolean("hasAiExperience"),
  aiToolsUsed: text("aiToolsUsed"),
  hasTakenAiCourse: boolean("hasTakenAiCourse"),
  courseExpectations: text("courseExpectations"),
  company: varchar("company", { length: 200 }),
  jobTitle: varchar("jobTitle", { length: 100 }),
  referralSource: text("referralSource"), // 如何得知此活動（自由填寫）
  bniChapter: text("bniChapter"), // BNI 分會名稱（自由填寫）
  status: mysqlEnum("status", ["registered", "confirmed", "cancelled", "attended"]).default("registered").notNull(),
  emailSent: boolean("emailSent").default(false).notNull(),
  subscribeNewsletter: boolean("subscribeNewsletter").default(false).notNull(), // 是否同意訂閱電子報
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
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
 * Stores email addresses that have paid access to specific articles
 */
export const articleAccessWhitelist = mysqlTable("articleAccessWhitelist", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull(),
  articleSlug: varchar("articleSlug", { length: 200 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ArticleAccessWhitelist = typeof articleAccessWhitelist.$inferSelect;
export type InsertArticleAccessWhitelist = typeof articleAccessWhitelist.$inferInsert;

/**
 * Download leads table - 下載資源註冊資料表
 */
export const downloadLeads = mysqlTable("downloadLeads", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  resourceSlug: varchar("resourceSlug", { length: 200 }).notNull(), // 對應文章或資源的 slug
  resourceTitle: varchar("resourceTitle", { length: 500 }).notNull(), // 資源標題
  downloadUrl: text("downloadUrl").notNull(), // 下載連結
  downloadedAt: timestamp("downloadedAt"), // 實際下載時間
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DownloadLead = typeof downloadLeads.$inferSelect;
export type InsertDownloadLead = typeof downloadLeads.$inferInsert;

/**
 * Promo codes table - 優惠代碼資料表
 */
export const promoCodes = mysqlTable("promoCodes", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  description: varchar("description", { length: 255 }),
  discountType: mysqlEnum("discountType", ["percentage", "fixed"]).notNull(), // percentage: 百分比折扣, fixed: 固定金額折扣
  discountValue: int("discountValue").notNull(), // 折扣值（百分比為 0-100，固定金額為實際金額）
  minAmount: int("minAmount").default(0).notNull(), // 最低消費金額
  maxUses: int("maxUses"), // 最大使用次數，null 為無限
  usedCount: int("usedCount").default(0).notNull(), // 已使用次數
  eventId: int("eventId"), // 限定活動，null 為通用
  validFrom: timestamp("validFrom"),
  validUntil: timestamp("validUntil"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PromoCode = typeof promoCodes.$inferSelect;
export type InsertPromoCode = typeof promoCodes.$inferInsert;

/**
 * Orders table - 訂單資料表
 */
export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  orderNo: varchar("orderNo", { length: 50 }).notNull().unique(), // 訂單編號
  eventId: int("eventId").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  company: varchar("company", { length: 200 }),
  jobTitle: varchar("jobTitle", { length: 100 }),
  referralSource: mysqlEnum("referralSource", [
    "teacher_afeng",
    "friend",
    "facebook",
    "threads",
    "youtube",
    "instagram",
    "other"
  ]),
  referralSourceOther: varchar("referralSourceOther", { length: 200 }),
  interestedTopics: text("interestedTopics"), // JSON string for multiple selections
  originalAmount: int("originalAmount").notNull(), // 原價
  discountAmount: int("discountAmount").default(0).notNull(), // 折扣金額
  finalAmount: int("finalAmount").notNull(), // 最終金額
  promoCodeId: int("promoCodeId"), // 使用的優惠代碼
  promoCode: varchar("promoCode", { length: 50 }), // 優惠代碼字串（冗餘儲存）
  paymentStatus: mysqlEnum("paymentStatus", ["pending", "paid", "failed", "refunded"]).default("pending").notNull(),
  paymentMethod: varchar("paymentMethod", { length: 50 }), // 付款方式
  newebpayTradeNo: varchar("newebpayTradeNo", { length: 50 }), // 藍新金流交易編號
  paidAt: timestamp("paidAt"), // 付款時間
  notes: text("notes"),
  // 發票資訊
  needInvoice: boolean("needInvoice").default(false).notNull(), // 是否需要三聯發票
  taxId: varchar("taxId", { length: 20 }), // 統一編號
  invoiceTitle: varchar("invoiceTitle", { length: 200 }), // 發票抬頭
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
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
export const videoCourses = mysqlTable("videoCourses", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  subtitle: varchar("subtitle", { length: 500 }),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description").notNull(),
  highlights: text("highlights"), // JSON string for course highlights
  targetAudience: text("targetAudience"), // JSON string for target audience
  coverImage: varchar("coverImage", { length: 500 }),
  previewVideoUrl: varchar("previewVideoUrl", { length: 500 }), // 預覽影片 URL
  videoUrl: varchar("videoUrl", { length: 500 }).notNull(), // 完整課程影片 URL
  videoDuration: int("videoDuration"), // 影片時長（秒）
  slidesUrl: varchar("slidesUrl", { length: 500 }), // 簡報 URL（內嵌檢視）
  price: int("price").notNull(), // 課程價格
  originalPrice: int("originalPrice"), // 原價（用於顯示折扣）
  studentGroupUrl: varchar("studentGroupUrl", { length: 500 }), // 學員群組連結
  studentCount: int("studentCount").default(0).notNull(), // 學員數量
  rating: int("rating").default(0).notNull(), // 平均評分（0-50，代表 0.0-5.0）
  reviewCount: int("reviewCount").default(0).notNull(), // 評價數量
  status: mysqlEnum("status", ["draft", "published", "archived"]).default("draft").notNull(),
  publishedAt: timestamp("publishedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type VideoCourse = typeof videoCourses.$inferSelect;
export type InsertVideoCourse = typeof videoCourses.$inferInsert;

/**
 * Video Course Purchases table - 錄播課程購買記錄資料表
 */
export const videoCoursePurchases = mysqlTable("videoCoursePurchases", {
  id: int("id").autoincrement().primaryKey(),
  orderNo: varchar("orderNo", { length: 50 }).notNull().unique(), // 訂單編號
  userId: int("userId").notNull(), // 購買用戶
  courseId: int("courseId").notNull(), // 購買課程
  originalAmount: int("originalAmount").notNull(), // 原價
  discountAmount: int("discountAmount").default(0).notNull(), // 折扣金額
  finalAmount: int("finalAmount").notNull(), // 最終金額
  promoCodeId: int("promoCodeId"), // 使用的優惠代碼
  promoCode: varchar("promoCode", { length: 50 }), // 優惠代碼字串
  paymentStatus: mysqlEnum("paymentStatus", ["pending", "paid", "failed", "refunded"]).default("pending").notNull(),
  paymentMethod: varchar("paymentMethod", { length: 50 }), // 付款方式
  newebpayTradeNo: varchar("newebpayTradeNo", { length: 50 }), // 藍新金流交易編號
  paidAt: timestamp("paidAt"), // 付款時間
  accessGrantedAt: timestamp("accessGrantedAt"), // 開通時間
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type VideoCoursePurchase = typeof videoCoursePurchases.$inferSelect;
export type InsertVideoCoursePurchase = typeof videoCoursePurchases.$inferInsert;

/**
 * Video Course Notes table - 錄播課程筆記資料表
 */
export const videoCourseNotes = mysqlTable("videoCourseNotes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  courseId: int("courseId").notNull(),
  content: text("content").notNull(), // 筆記內容（Markdown 格式）
  videoTimestamp: int("videoTimestamp"), // 影片時間戳（秒），可選
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type VideoCourseNote = typeof videoCourseNotes.$inferSelect;
export type InsertVideoCourseNote = typeof videoCourseNotes.$inferInsert;

/**
 * Video Course Reviews table - 錄播課程評價資料表
 */
export const videoCourseReviews = mysqlTable("videoCourseReviews", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  courseId: int("courseId").notNull(),
  rating: int("rating").notNull(), // 評分 1-5
  content: text("content"), // 評價內容
  isVerifiedPurchase: boolean("isVerifiedPurchase").default(true).notNull(), // 是否為已購買用戶
  isPublished: boolean("isPublished").default(true).notNull(), // 是否公開顯示
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
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
export const courseRegistrations2026 = mysqlTable("courseRegistrations2026", {
  id: int("id").autoincrement().primaryKey(),
  // User type
  userType: mysqlEnum("userType", ["new", "returning"]).notNull(),
  // Plan selection
  plan: varchar("plan", { length: 50 }).notNull(), // single, full, double
  planPrice: int("planPrice").notNull(), // 方案價格
  // Selected sessions (JSON array of session IDs)
  selectedSessions: text("selectedSessions").notNull(), // JSON string: ["0120", "0122", ...]
  selectedMonth: varchar("selectedMonth", { length: 20 }), // january, february, march
  // First person info
  name1: varchar("name1", { length: 100 }).notNull(),
  phone1: varchar("phone1", { length: 20 }).notNull(),
  email1: varchar("email1", { length: 320 }).notNull(),
  industry1: varchar("industry1", { length: 200 }),
  // Second person info (for double plan)
  name2: varchar("name2", { length: 100 }),
  phone2: varchar("phone2", { length: 20 }),
  email2: varchar("email2", { length: 320 }),
  industry2: varchar("industry2", { length: 200 }),
  // Payment info
  paymentMethod: mysqlEnum("paymentMethod", ["transfer", "online"]).notNull(),
  transferLast5: varchar("transferLast5", { length: 5 }), // 匯款帳號後五碼
  promoCode: varchar("promoCode", { length: 50 }), // 優惠代碼
  // Invoice info (三聯式發票)
  needInvoice: boolean("needInvoice").default(false).notNull(), // 是否需要三聯式發票
  taxId: varchar("taxId", { length: 20 }), // 統一編號
  invoiceTitle: varchar("invoiceTitle", { length: 200 }), // 發票抬頭
  paymentStatus: mysqlEnum("paymentStatus", ["pending", "paid", "failed"]).default("pending").notNull(),
  newebpayTradeNo: varchar("newebpayTradeNo", { length: 100 }), // 藍新金流交易編號
  // Newsletter subscription
  subscribeNewsletter: boolean("subscribeNewsletter").default(false).notNull(), // 是否同意訂閱電子報
  // Status
  status: mysqlEnum("status", ["registered", "confirmed", "cancelled"]).default("registered").notNull(),
  emailSent: boolean("emailSent").default(false).notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CourseRegistration2026 = typeof courseRegistrations2026.$inferSelect;
export type InsertCourseRegistration2026 = typeof courseRegistrations2026.$inferInsert;

/**
 * Notifications table - 通知系統資料表
 */
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 200 }).notNull(), // 通知標題
  content: text("content").notNull(), // 通知內容
  type: mysqlEnum("type", ["info", "warning", "success", "error"]).default("info").notNull(), // 通知類型
  targetType: mysqlEnum("targetType", ["all", "user", "role"]).default("all").notNull(), // 發送對象類型
  targetUserId: int("targetUserId"), // 特定用戶 ID（targetType = user 時使用）
  targetRole: mysqlEnum("targetRole", ["user", "admin"]), // 特定角色（targetType = role 時使用）
  link: varchar("link", { length: 500 }), // 可選的連結
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

/**
 * Notification Reads table - 通知已讀記錄表
 * 記錄每個用戶對每則通知的已讀狀態
 */
export const notificationReads = mysqlTable("notificationReads", {
  id: int("id").autoincrement().primaryKey(),
  notificationId: int("notificationId").notNull(),
  userId: int("userId").notNull(),
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
 * 用於管理所有課程場次，支援後台動態新增/編輯
 */
export const courseSessions2026 = mysqlTable("courseSessions2026", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: varchar("sessionId", { length: 20 }).notNull().unique(), // 場次 ID，如 "0120_1"
  name: varchar("name", { length: 200 }).notNull(), // 課程名稱
  date: varchar("date", { length: 20 }).notNull(), // 日期，如 "2026-01-20"
  time: varchar("time", { length: 20 }).notNull(), // 時間，如 "9:00-12:00"
  dayOfWeek: varchar("dayOfWeek", { length: 10 }).notNull(), // 星期幾，如 "二"
  location: varchar("location", { length: 200 }).default("台北").notNull(), // 上課地點
  maxCapacity: int("maxCapacity").default(30).notNull(), // 最大人數
  isActive: boolean("isActive").default(true).notNull(), // 是否啟用
  reminderSent: boolean("reminderSent").default(false).notNull(), // 是否已發送提醒
  notes: text("notes"), // 備註
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CourseSession2026 = typeof courseSessions2026.$inferSelect;
export type InsertCourseSession2026 = typeof courseSessions2026.$inferInsert;

/**
 * 2026 Course Attendance table - 2026 課程出席記錄表
 * 記錄每位學員在每堂課的出席狀態
 */
export const courseAttendance2026 = mysqlTable("courseAttendance2026", {
  id: int("id").autoincrement().primaryKey(),
  registrationId: int("registrationId").notNull(), // 報名記錄 ID
  sessionId: varchar("sessionId", { length: 20 }).notNull(), // 場次 ID
  attendeeName: varchar("attendeeName", { length: 100 }).notNull(), // 出席者姓名
  attendeeEmail: varchar("attendeeEmail", { length: 320 }).notNull(), // 出席者 Email
  isAttended: boolean("isAttended").default(false).notNull(), // 是否出席
  checkInTime: timestamp("checkInTime"), // 簽到時間
  checkedBy: int("checkedBy"), // 簽到操作者（管理員 ID）
  notes: text("notes"), // 備註
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
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
export const courseTransfers2026 = mysqlTable("courseTransfers2026", {
  id: int("id").autoincrement().primaryKey(),
  registrationId: int("registrationId").notNull(), // 報名記錄 ID
  attendeeEmail: varchar("attendeeEmail", { length: 320 }).notNull(), // 學員 Email（區分本人或同行者）
  fromSessionId: varchar("fromSessionId", { length: 50 }).notNull(), // 原課程場次 ID
  toSessionId: varchar("toSessionId", { length: 50 }).notNull(), // 調課後的場次 ID
  reason: text("reason"), // 調課原因（選填）
  transferredBy: varchar("transferredBy", { length: 100 }), // 操作者（管理員名稱）
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
