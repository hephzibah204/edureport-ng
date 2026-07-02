import { createDb } from "../../src/db";
import * as schema from "../../src/db/schema";
import { signToken, verifyToken, hashPassword, verifyPassword } from "../../src/lib/auth";
import { EmailService } from "../../src/lib/email";
import { eq, and, like, gte, lte, desc, asc, sql, inArray } from "drizzle-orm";

interface Env {
  DB: D1Database;
  BUCKET?: any; // R2Bucket
  JWT_SECRET?: string;
  ENVIRONMENT?: string;
  AI?: any;
  RESEND_API_KEY?: string;
  SMTP_FROM_EMAIL?: string;
  SMTP_FROM_NAME?: string;
  NEXT_PUBLIC_MAIN_DOMAIN?: string;
  PAYSTACK_SECRET_KEY?: string;
  PAYSTACK_PUBLIC_KEY?: string;
  PAYVESSEL_API_KEY?: string;
  PAYVESSEL_API_SECRET?: string;
  OPENROUTER_API_KEY?: string;
  GEMINI_API_KEY?: string;
  ALIBABA_API_KEY?: string;
}

function jsonResponse(data: any, status = 200, origin = "*"): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

function errorResponse(message: string, status = 400, origin = "*"): Response {
  return jsonResponse({ error: { message } }, status, origin);
}

export async function onRequest(context: {
  request: Request;
  env: Env;
  params: { route?: string[] };
}): Promise<Response> {
  const { request, env } = context;
  const url = new URL(request.url);
  const method = request.method;
  const origin = request.headers.get("Origin") || "*";

  if (method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  if (url.pathname === "/api/config/bucket" && method === "GET") {
    if (!env.BUCKET) return errorResponse("No BUCKET binding", 500);
    const listed = await env.BUCKET.list();
    return jsonResponse(listed.objects.map((o: any) => o.key));
  }

  try {
    if (!env.DB) {
      throw new Error("Database binding (DB) is missing. Check your wrangler.toml or Cloudflare dashboard.");
    }
    
    const db = createDb(env.DB);
    const path = url.pathname.replace(/^\/api\//, "").replace(/\/$/, "");
    const parts = path.split("/").filter(Boolean);

    // Public Config route
    if (parts[0] === "config" && method === "GET") {
      return await handleGetPublicConfig(db, origin);
    }

    // Secure File Upload route
    if (parts[0] === "upload" && method === "POST") {
      const session = await authenticateRequest(request, env.JWT_SECRET);
      if (!session) return errorResponse("Unauthorized", 401, origin);
      return await handleFileUpload(request, env.BUCKET, origin);
    }

    // File Download route (Public for logos and profile photos)
    if (parts[0] === "files" && parts[1] === "list" && method === "GET") {
      const listed = await env.BUCKET.list({ limit: 100 });
      return new Response(JSON.stringify(listed.objects.map((o: any) => o.key)), { headers: { "Content-Type": "application/json" } });
    }
    if (parts[0] === "files" && parts.length >= 2 && method === "GET") {
      const fileKey = decodeURIComponent(parts.slice(1).join("/"));
      return await handleFileDownload(env.BUCKET, fileKey, origin);
    }

    // Global Announcements for authenticated users
    if (parts[0] === "announcements" && method === "GET") {
      const session = await authenticateRequest(request, env.JWT_SECRET);
      if (session) {
        return await handleGetPortalAnnouncements(db, session.role, origin);
      }
      return errorResponse("Unauthorized", 401, origin);
    }

    // Auth routes
    if (parts[0] === "auth" || (parts.length === 1 && parts[0] === "me")) {
      if (parts[0] === "auth" && parts[1] === "login" && method === "POST") {
        return await handleLogin(db, request, origin, env.JWT_SECRET);
      }
      if (parts[0] === "auth" && parts[1] === "register" && method === "POST") {
        return await handleRegister(db, request, origin, env);
      }
      if (parts[0] === "auth" && parts[1] === "check-domain" && method === "GET") {
        return await handleCheckDomain(db, request, origin);
      }
      if (parts[0] === "auth" && parts[1] === "school-public" && parts.length === 3 && method === "GET") {
        return await handleGetSchoolPublic(db, parts[2], origin);
      }
      if (parts[0] === "auth" && parts[1] === "logout" && method === "POST") {
        return await handleLogout(origin);
      }
      if ((parts[0] === "auth" && parts[1] === "me") || (parts.length === 1 && parts[0] === "me")) {
        return await handleMe(db, request, origin, env.JWT_SECRET);
      }
      if (parts[0] === "auth" && parts[1] === "change-password" && method === "POST") {
        return await handleChangePassword(db, request, origin, env.JWT_SECRET);
      }
      if (parts[0] === "auth" && parts[1] === "profile" && method === "PUT") {
        return await handleUserProfileUpdate(db, request, origin, env.JWT_SECRET);
      }
      if (parts[0] === "auth" && parts[1] === "forgot-password" && method === "POST") {
        return await handleForgotPassword(db, request, origin, env);
      }
      if (parts[0] === "auth" && parts[1] === "reset-password" && method === "POST") {
        return await handleResetPassword(db, request, origin, env);
      }
    }

    // Admin routes
    if (parts[0] === "admin") {
      const session = await authenticateRequest(request, env.JWT_SECRET);
      if (!session || (session.role !== "ADMIN" && session.role !== "STAFF")) {
        return errorResponse("Unauthorized", 401, origin);
      }

      if (parts[1] === "stats" && method === "GET") {
        return await handleAdminStats(db, origin);
      }
      if (parts[1] === "schools" && parts.length === 2 && method === "GET") {
        return await handleAdminSchools(db, origin);
      }
      if (parts[1] === "schools" && parts.length === 3 && method === "GET") {
        return await handleAdminSchoolDetail(db, parts[2], origin);
      }
      if (parts[1] === "schools" && parts[2] === "create" && method === "POST") {
        return await handleCreateSchool(db, request, origin);
      }
      if (parts[1] === "schools" && parts.length === 4 && parts[3] === "toggle-status" && method === "PUT") {
        return await handleAdminToggleSchoolStatus(db, parts[2], origin);
      }
      if (parts[1] === "schools" && parts.length === 4 && parts[3] === "reset-auth" && method === "PUT") {
        return await handleAdminResetSchoolAuth(db, env, parts[2], origin);
      }
      if (parts[1] === "payments" && method === "GET") {
        return await handleAdminPayments(db, origin);
      }
      if (parts[1] === "audit" && method === "GET") {
        return await handleAdminAudit(db, origin);
      }
      if (parts[1] === "plans" && method === "GET") {
        return await handleAdminPlans(db, origin);
      }
      if (parts[1] === "plans" && method === "POST") {
        return await handleSaveAdminPlan(db, request, session, origin);
      }
      if (parts[1] === "licenses" && method === "PUT") {
        return await handleUpdateLicense(db, request, origin, env);
      }
      if (parts[1] === "coupons" && method === "GET") {
        return await handleAdminCoupons(db, origin);
      }
      if (parts[1] === "coupons" && method === "POST") {
        return await handleCreateCoupon(db, request, origin);
      }
      if (parts[1] === "announcements" && method === "GET") {
        return await handleAdminAnnouncements(db, origin);
      }
      if (parts[1] === "announcements" && method === "POST") {
        return await handleCreateAnnouncement(db, request, session, origin);
      }
      if (parts[1] === "announcements" && parts.length === 3 && method === "DELETE") {
        return await handleDeleteAnnouncement(db, parts[2], origin);
      }
      if (parts[1] === "settings" && method === "GET") {
        return await handleAdminSettings(db, origin);
      }
      if (parts[1] === "settings" && method === "PUT") {
        return await handleSaveAdminSettings(db, request, origin);
      }
      if (parts[1] === "maintenance" && method === "GET") {
        return await handleAdminMaintenance(db, origin);
      }
      if (parts[1] === "maintenance" && method === "PUT") {
        return await handleSaveAdminMaintenance(db, request, origin);
      }
      if (parts[1] === "users" && method === "GET") {
        return await handleAdminUsers(db, origin);
      }
    }

    // Teacher routes
    if (parts[0] === "teacher") {
      const session = await authenticateRequest(request, env.JWT_SECRET);
      if (!session || session.role !== "TEACHER") {
        return errorResponse("Unauthorized", 401, origin);
      }

      // Check if school trial is expired
      if (session.schoolId) {
        const school = await db.select().from(schema.schools).where(eq(schema.schools.id, session.schoolId)).get();
        if (school && school.plan === "TRIAL" && school.trialEndsAt && new Date(school.trialEndsAt) < new Date()) {
          return errorResponse("School trial has expired. Access restricted.", 403, origin);
        }
      }

      if (parts[1] === "api" && parts[2] === "classes" && method === "GET") {
        return await handleTeacherClasses(db, session, origin);
      }
      if (parts[1] === "api" && parts[2] === "stats" && method === "GET") {
        return await handleGetTeacherStats(db, session, origin);
      }
      if (parts[1] === "api" && parts[2] === "students" && method === "GET") {
        return await handleTeacherStudents(db, request, session, origin);
      }
      if (parts[1] === "api" && parts[2] === "attendance" && parts[3] === "session" && method === "GET") {
        return await handleGetAttendanceSession(db, request, session, origin);
      }
      if (parts[1] === "api" && parts[2] === "attendance" && parts[3] === "session" && method === "PUT") {
        return await handleSaveAttendanceSession(db, request, session, origin);
      }
      if (parts[1] === "api" && parts[2] === "attendance" && parts[3] === "submit" && method === "POST") {
        return await handleSubmitAttendance(db, parts[4], session, origin);
      }
      if (parts[1] === "api" && parts[2] === "attendance" && parts[3] === "history" && method === "GET") {
        return await handleAttendanceHistory(db, request, session, origin);
      }
      if (parts[1] === "api" && parts[2] === "profile" && method === "PUT") {
        return await handleUserProfileUpdate(db, request, origin, env.JWT_SECRET);
      }
      if (parts[1] === "api" && parts[2] === "scores" && method === "GET") {
        return await handleGetTeacherScores(db, request, session, origin);
      }
      if (parts[1] === "api" && parts[2] === "scores" && method === "PUT") {
        return await handleSaveTeacherScores(db, request, session, origin);
      }
      if (parts[1] === "api" && parts[2] === "comments" && method === "GET") {
        return await handleGetTeacherComments(db, request, session, origin);
      }
      if (parts[1] === "api" && parts[2] === "comments" && method === "PUT") {
        return await handleSaveTeacherComments(db, request, session, origin);
      }
    }


    // School Admin routes
    if (parts[0] === "school" || parts[0] === "students" || parts[0] === "teachers" || parts[0] === "parents" || parts[0] === "student-users" || parts[0] === "student-links" || parts[0] === "scores" || parts[0] === "report-extras" || parts[0] === "reports" || parts[0] === "ai-command" || parts[0] === "billing") {
      const session = await authenticateRequest(request, env.JWT_SECRET);
      if (!session || session.role !== "SCHOOL") {
        return errorResponse("Unauthorized", 401, origin);
      }
      
      // Check if school trial is expired (except for billing routes, so they can still upgrade)
      if (session.schoolId && parts[0] !== "billing") {
        const school = await db.select().from(schema.schools).where(eq(schema.schools.id, session.schoolId)).get();
        if (school && school.plan === "TRIAL" && school.trialEndsAt && new Date(school.trialEndsAt) < new Date()) {
          return errorResponse("School trial has expired. Access restricted. Please upgrade your plan.", 403, origin);
        }
      }

      if (parts[0] === "school" && parts[1] === "attendance" && method === "GET") return await handleAdminAttendance(db, request, session, origin);
      if (parts[0] === "school" && method === "GET") return await handleGetSchool(db, session, origin);
      if (parts[0] === "school" && method === "PUT") return await handleUpdateSchool(db, request, session, origin);
      if (parts[0] === "billing" && parts[1] === "checkout" && method === "POST") return await handleSchoolBillingCheckout(db, request, session, origin);
      if (parts[0] === "billing" && parts[1] === "verify" && method === "POST") return await handleSchoolBillingVerify(db, request, session, env, origin);
      
      if (parts[0] === "students" && method === "GET") return await handleGetStudents(db, session, origin);
      if (parts[0] === "students" && method === "POST") return await handleCreateStudent(db, request, session, origin);
      if (parts[0] === "students" && parts[1] === "bulk" && method === "POST") return await handleBulkImportStudents(db, request, session, origin);
      if (parts[0] === "students" && parts.length === 2 && method === "DELETE") return await handleDeleteStudent(db, parts[1], session, origin);
      if (parts[0] === "students" && parts.length === 2 && method === "PUT") return await handleUpdateStudent(db, request, parts[1], session, origin);

      if (parts[0] === "ai-command" && method === "POST") return await handleAdminAICommand(db, request, session, env, origin);
      
      if (parts[0] === "teachers" && method === "GET") return await handleGetTeachers(db, session, origin);
      if (parts[0] === "teachers" && method === "POST") return await handleCreateTeacher(db, request, session, origin, env);
      if (parts[0] === "teachers" && parts.length === 2 && method === "DELETE") return await handleDeleteTeacher(db, parts[1], session, origin);

      if (parts[0] === "parents" && method === "GET") return await handleGetParents(db, session, origin);
      if (parts[0] === "parents" && method === "POST") return await handleCreateParent(db, request, session, origin, env);
      if (parts[0] === "parents" && parts.length === 2 && method === "DELETE") return await handleDeleteParent(db, parts[1], session, origin);

      if (parts[0] === "student-users" && method === "POST") return await handleCreateStudentUser(db, request, session, origin, env);

      if (parts[0] === "student-links" && method === "POST") return await handleCreateStudentLink(db, request, session, origin);
      if (parts[0] === "student-links" && parts.length === 2 && method === "DELETE") return await handleDeleteStudentLink(db, parts[1], session, origin);
      
      if (parts[0] === "scores" && method === "GET") return await handleGetScoresAdmin(db, request, session, origin);
      if (parts[0] === "scores" && parts.length === 2 && method === "PUT") return await handleUpdateScoreAdmin(db, request, parts[1], session, origin);
      
      if (parts[0] === "report-extras" && parts.length === 2 && method === "GET") return await handleGetReportExtras(db, parts[1], session, origin);
      if (parts[0] === "report-extras" && parts.length === 2 && method === "PUT") return await handleUpdateReportExtras(db, request, parts[1], session, origin);
    }
      // Portal routes
      if (parts[0] === "portal") {
      const session = await authenticateRequest(request, env.JWT_SECRET);
      if (!session || (session.role !== "PARENT" && session.role !== "STUDENT" && session.role !== "SCHOOL")) {
        return errorResponse("Unauthorized", 401, origin);
      }

      if (parts[1] === "api" && parts[2] === "me" && method === "GET") {
        return await handlePortalMe(db, session, origin);
      }
      if (parts[1] === "api" && parts[2] === "student" && parts.length === 4 && method === "GET") {
        return await handlePortalStudent(db, parts[3], session, origin);
      }
      if (parts[1] === "api" && parts[2] === "attendance" && parts[3] === "summary" && method === "GET") {
        return await handlePortalAttendanceSummary(db, request, session, origin);
      }
      if (parts[1] === "api" && parts[2] === "attendance" && parts[3] === "days" && method === "GET") {
        return await handlePortalAttendanceDays(db, request, session, origin);
      }
      if (parts[1] === "api" && parts[2] === "scores" && parts.length === 4 && method === "GET") {
        return await handlePortalScores(db, parts[3], session, origin);
      }
      if (parts[1] === "api" && parts[2] === "report-extras" && parts.length === 4 && method === "GET") {
        return await handleGetReportExtras(db, parts[3], session, origin);
      }
      if (parts[1] === "api" && parts[2] === "settings" && method === "PUT") {
        return await handleUserProfileUpdate(db, request, origin, env.JWT_SECRET);
      }
    }

    // AI routes
    if (parts[0] === "ai") {
      const session = await authenticateRequest(request, env.JWT_SECRET);
      if (!session) return errorResponse("Unauthorized", 401, origin);
 
      if (parts[1] === "exam" && parts.length === 2 && method === "GET") return await handleGetExams(db, session, origin);
      if (parts[1] === "exam" && parts.length === 2 && method === "POST") return await handleCreateCustomExam(db, request, session, origin);
      if (parts[1] === "exam" && parts[2] === "bulk-import-document" && method === "POST") return await handleBulkImportDocumentExam(db, request, session, env, origin);
      if (parts[1] === "exam" && parts[2] === "shared" && method === "GET") return await handleGetSharedExams(db, origin);
      if (parts[1] === "exam" && parts[2] === "import" && method === "POST") return await handleImportExam(db, request, session, env, origin);
      if (parts[1] === "exam" && method === "POST" && parts[2] === "generate") return await handleGenerateExam(db, request, session, env, origin);
      if (parts[1] === "exam" && parts.length === 3 && method === "GET") return await handleGetExamDetail(db, parts[2], session, origin);
      if (parts[1] === "exam" && parts.length === 3 && method === "PUT") return await handleUpdateExam(db, request, parts[2], session, env, origin);
      if (parts[1] === "exam" && parts.length === 3 && method === "DELETE") return await handleDeleteExam(db, parts[2], session, origin);
      if (parts[1] === "remarks" && method === "POST") return await handleGenerateAiRemarks(db, request, session, env, origin);
    }

    return errorResponse(`Route not found: ${path}`, 404, origin);
  } catch (err: any) {
    console.error("API Error:", err);
    let message = err.message || "Internal server error";
    if (err.cause) {
      message += ` (Cause: ${err.cause.message || err.cause})`;
    }
    return errorResponse(message, 500, origin);
  }
}

async function authenticateRequest(request: Request, secret?: string): Promise<{ userId: string; email: string; role: string; schoolId?: string } | null> {
  const authHeader = request.headers.get("Authorization");
  let token: string | null = null;

  if (authHeader?.startsWith("Bearer ")) {
    token = authHeader.slice(7);
  } else {
    const cookie = request.headers.get("Cookie") || "";
    const match = cookie.match(/(?:^|;\s*)token=([^;]*)/);
    if (match) token = decodeURIComponent(match[1]);
  }

  if (!token) return null;
  return verifyToken(token, secret);
}

function generateId(): string {
  return crypto.randomUUID();
}

function nowISO(): string {
  return new Date().toISOString();
}

async function generateAIResponse(env: Env, prompt: string, maxTokens = 4096): Promise<any> {
  // 1. Cloudflare AI
  if (env.AI) {
    try {
      const response = await env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
        messages: [{ role: 'user', content: prompt }],
        max_tokens: maxTokens
      });
      console.log('Successfully generated using Cloudflare AI');
      return response;
    } catch (e) {
      console.error('Cloudflare AI failed, falling back...', e);
    }
  }


  // 3. OpenRouter
  if (env.OPENROUTER_API_KEY) {
    const freeModels = [
      "meta-llama/llama-3-8b-instruct:free",
      "google/gemma-2-9b-it:free",
      "microsoft/phi-3-mini-128k-instruct:free",
      "qwen/qwen-2-7b-instruct:free",
      "mistralai/mistral-7b-instruct:free",
      "huggingfaceh4/zephyr-7b-beta:free",
      "openchat/openchat-7b:free"
    ];
    for (const model of freeModels) {
      try {
        const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json", 
            "Authorization": `Bearer ${env.OPENROUTER_API_KEY}`,
            "HTTP-Referer": "https://reportsheet.com.ng",
            "X-Title": "ReportSheet NG"
          },
          body: JSON.stringify({
            model: model,
            messages: [{ role: 'user', content: prompt }],
            max_tokens: maxTokens
          })
        });
        if (res.ok) {
          const data = await res.json() as any;
          console.log(`Successfully generated using OpenRouter model: ${model}`);
          return { response: data.choices[0].message.content };
        }
        console.warn(`OpenRouter ${model} failed with status`, res.status, await res.text());
      } catch(e) {
        console.warn(`OpenRouter ${model} fetch failed, trying next...`, e);
      }
    }
  }

  // 4. Google Gemini API
  if (env.GEMINI_API_KEY) {
    const geminiModels = [
      "gemini-2.5-flash",
      "gemini-1.5-flash",
      "gemini-1.5-flash-8b",
      "gemini-1.5-pro",
      "gemini-pro"
    ];
    for (const model of geminiModels) {
      try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env.GEMINI_API_KEY}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { maxOutputTokens: maxTokens }
          })
        });
        if (res.ok) {
          const data = await res.json() as any;
          console.log(`Successfully generated using Gemini model: ${model}`);
          return { response: data.candidates[0].content.parts[0].text };
        }
        console.warn(`Gemini ${model} failed with status`, res.status, await res.text());
      } catch(e) {
        console.warn(`Gemini ${model} fetch failed, trying next...`, e);
      }
    }
  }

  // 5. Alibaba Cloud (DashScope) API
  if (env.ALIBABA_API_KEY) {
    const alibabaModels = [
      "qwen-turbo",
      "qwen-plus",
      "qwen-max"
    ];
    for (const model of alibabaModels) {
      try {
        const res = await fetch("https://ws-2sa9nwqlr3hajnpb.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1/chat/completions", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json", 
            "Authorization": `Bearer ${env.ALIBABA_API_KEY}` 
          },
          body: JSON.stringify({
            model: model,
            messages: [{ role: 'user', content: prompt }],
            max_tokens: maxTokens
          })
        });
        if (res.ok) {
          const data = await res.json() as any;
          console.log(`Successfully generated using Alibaba model: ${model}`);
          return { response: data.choices[0].message.content };
        }
        console.warn(`Alibaba ${model} failed with status`, res.status, await res.text());
      } catch(e) {
        console.warn(`Alibaba ${model} fetch failed, trying next...`, e);
      }
    }
  }

  throw new Error("All AI providers failed or no API keys are available.");
}

// ===== FILE HANDLERS =====

async function handleFileUpload(request: Request, bucket: any, origin: string): Promise<Response> {
  if (!bucket) return errorResponse("Storage bucket not configured", 500, origin);
  
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const explicitFilename = formData.get("filename") as string;
    if (!file) return errorResponse("No file uploaded", 400, origin);
    
    // Generate unique key
    const filename = explicitFilename || file.name || "upload.bin";
    const extension = filename.split('.').pop() || 'bin';
    const key = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${extension}`;
    
    await bucket.put(key, file, {
      httpMetadata: { contentType: file.type || 'application/octet-stream' }
    });
    
    return jsonResponse({ key, url: `/api/files/${key}` }, 200, origin);
  } catch (err: any) {
    console.error("Upload error:", err);
    return errorResponse(`File upload failed: ${err.message} ${err.stack}`, 500, origin);
  }
}

async function handleFileDownload(bucket: any, key: string, origin: string): Promise<Response> {
  if (!bucket) return errorResponse("Storage bucket not configured", 500, origin);
  
  const object = await bucket.get(key);
  if (!object) return errorResponse("File not found", 404, origin);
  
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("Access-Control-Allow-Origin", origin);
  headers.set("Access-Control-Allow-Credentials", "true");
  
  let downloadFilename = key;
  const contentType = object.httpMetadata?.contentType || '';
  if (key.endsWith('.bin')) {
    if (contentType.includes('wordprocessingml.document')) {
      downloadFilename = key.replace('.bin', '.docx');
    } else if (contentType.includes('pdf')) {
      downloadFilename = key.replace('.bin', '.pdf');
    } else if (contentType.includes('msword')) {
      downloadFilename = key.replace('.bin', '.doc');
    }
  }
  
  // Force download with correct filename to prevent .bin extensions
  headers.set("Content-Disposition", `attachment; filename="${downloadFilename}"`);
  
  return new Response(object.body, { headers });
}

// ===== AUTH HANDLERS =====

async function handleLogin(db: any, request: Request, origin: string, secret?: string): Promise<Response> {
  const { email, password, rememberMe } = (await request.json()) as any;
  if (!email || !password) return errorResponse("Email and password required", 400, origin);

  const user = await db
    .select({
      id: schema.users.id,
      email: schema.users.email,
      role: schema.users.role,
      displayName: schema.users.displayName,
      status: schema.users.status,
      schoolId: schema.users.schoolId,
      passwordHash: schema.users.passwordHash,
    })
    .from(schema.users)
    .where(eq(schema.users.email, email.toLowerCase()))
    .get();

  if (!user) return errorResponse("Invalid credentials", 401, origin);

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return errorResponse("Invalid credentials", 401, origin);

  if (user.status !== "ACTIVE") return errorResponse("Account is suspended", 403, origin);

  await db
    .update(schema.users)
    .set({ lastLoginAt: nowISO() })
    .where(eq(schema.users.id, user.id))
    .run();

  let schoolId = user.schoolId;
  let school = null;

  if (schoolId) {
    school = await db
      .select()
      .from(schema.schools)
      .where(eq(schema.schools.id, schoolId))
      .get();
  } else {
    school = await db
      .select()
      .from(schema.schools)
      .where(eq(schema.schools.ownerId, user.id))
      .get();
    schoolId = school?.id;
  }

  const tokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    schoolId: schoolId,
  };

  const expiresIn = rememberMe ? "30d" : "1d";
  const maxAge = rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60;

  const token = await signToken(tokenPayload, secret, expiresIn);

  const resData = {
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      displayName: user.displayName,
    },
    school: school
      ? {
          id: school.id,
          name: school.name,
          plan: school.plan,
        }
      : null,
    token,
  };

  return new Response(JSON.stringify(resData), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": `token=${token}; HttpOnly; Path=/; Max-Age=${maxAge}; SameSite=Lax`,
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    }
  });
}

async function handleCheckDomain(db: any, request: Request, origin: string): Promise<Response> {
  const url = new URL(request.url);
  const domain = url.searchParams.get("domain");
  
  if (!domain) return errorResponse("Domain parameter is required", 400, origin);
  
  const existing = await db
    .select()
    .from(schema.schools)
    .where(eq(schema.schools.subdomain, domain.toLowerCase()))
    .get();
    
  return jsonResponse({ available: !existing }, 200, origin);
}

async function handleGetSchoolPublic(db: any, subdomain: string, origin: string): Promise<Response> {
  const school = await db.select({
    name: schema.schools.name,
    logoUrl: schema.schools.logoUrl,
    abbr: schema.schools.abbr,
    motto: schema.schools.motto
  }).from(schema.schools).where(eq(schema.schools.subdomain, subdomain.toLowerCase())).get();
  
  if (!school) return errorResponse("School not found", 404, origin);
  return jsonResponse({ school }, 200, origin);
}

async function handleRegister(db: any, request: Request, origin: string, env: Env): Promise<Response> {
  const { schoolName, email, password, plan, subdomain, phone } = await request.json() as any;
  if (!schoolName || !email || !password || !subdomain) {
    return errorResponse("School name, email, password, and URL are required", 400, origin);
  }

  // Check email
  const existingUser = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, email.toLowerCase()))
    .get();

  if (existingUser) return errorResponse("Email already registered", 409, origin);

  // Check subdomain
  const existingSchool = await db
    .select()
    .from(schema.schools)
    .where(eq(schema.schools.subdomain, subdomain.toLowerCase()))
    .get();

  if (existingSchool) return errorResponse("School username already taken", 409, origin);

  const userId = generateId();
  const schoolId = generateId();
  const passwordHash = await hashPassword(password);
  const now = nowISO();

  await db.insert(schema.users).values({
    id: userId,
    email: email.toLowerCase(),
    passwordHash,
    role: "SCHOOL",
    status: "ACTIVE",
    createdAt: now,
    updatedAt: now,
    phone: phone || null,
    schoolId: schoolId,
  }).run();

  const defaultGrades = JSON.stringify([
    { grade: "A", min: 75, max: 100, remark: "Excellent" },
    { grade: "B", min: 60, max: 74, remark: "Very Good" },
    { grade: "C", min: 50, max: 59, remark: "Good" },
    { grade: "D", min: 40, max: 49, remark: "Fair" },
    { grade: "F", min: 0, max: 39, remark: "Fail" },
  ]);

  const defaultSubjects = JSON.stringify([
    "Mathematics", "English Language", "Basic Science", "Basic Technology",
    "Civic Education", "Social Studies", "Agricultural Science", "Computer Studies"
  ]);

  const defaultClasses = JSON.stringify([
    "JSS 1A", "JSS 1B", "JSS 2A", "JSS 2B", "JSS 3A", "JSS 3B",
    "SSS 1 Science", "SSS 1 Arts", "SSS 2 Science", "SSS 2 Arts", "SSS 3 Science", "SSS 3 Arts"
  ]);

  const trialEnds = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  await db.insert(schema.schools).values({
    id: schoolId,
    ownerId: userId,
    name: schoolName,
    abbr: schoolName.substring(0, 3).toUpperCase(),
    subdomain: subdomain.toLowerCase(),
    plan: (plan || "TRIAL").toUpperCase(),
    session: "2024/2025",
    term: "First Term",
    ca1Max: 10,
    ca2Max: 10,
    examMax: 80,
    subjects: defaultSubjects,
    classTemplates: defaultClasses,
    grades: defaultGrades,
    createdAt: now,
    updatedAt: now,
    currency: "NGN",
    reportColor: "#4f46e5",
    reportTemplate: "ELITE",
    trialEndsAt: trialEnds,
  }).run();

  // Send Welcome Email
  try {
    const mailer = new EmailService(env);
    const loginUrl = `https://${subdomain.toLowerCase()}.${env.NEXT_PUBLIC_MAIN_DOMAIN || 'reportsheet.com.ng'}/login`;
    await mailer.send({
      to: email.toLowerCase(),
      subject: `Welcome to ReportSheet - ${schoolName}`,
      html: EmailService.getWelcomeAdminTemplate(schoolName, loginUrl)
    });
  } catch (err) {
    console.error("Welcome email failed:", err);
  }

  const token = await signToken({
    userId,
    email: email.toLowerCase(),
    role: "SCHOOL",
    schoolId,
  }, env.JWT_SECRET!);

  return new Response(JSON.stringify({
    user: { id: userId, email, role: "SCHOOL" },
    school: { id: schoolId, name: schoolName, plan: (plan || "TRIAL").toUpperCase() },
    token,
    message: "Registration successful",
  }), {
    status: 201,
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": `token=${token}; HttpOnly; Path=/; Max-Age=${7 * 24 * 60 * 60}; SameSite=Lax`,
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    }
  });
}

async function handleLogout(origin: string): Promise<Response> {
  return new Response(JSON.stringify({ message: "Logged out" }), { 
    status: 200, 
    headers: { 
      'Content-Type': 'application/json',
      "Set-Cookie": `token=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`,
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Credentials": "true",
    } 
  });
}

async function handleMe(db: any, request: Request, origin: string, secret?: string): Promise<Response> {
  const session = await authenticateRequest(request, secret);
  if (!session) return errorResponse("Unauthorized", 401, origin);

  const user = await db
    .select({
      id: schema.users.id,
      email: schema.users.email,
      role: schema.users.role,
      displayName: schema.users.displayName,
      phone: schema.users.phone,
      status: schema.users.status,
    })
    .from(schema.users)
    .where(eq(schema.users.id, session.userId))
    .get();

  if (!user) return errorResponse("User not found", 404, origin);

  let school = null;
  if (session.schoolId) {
    school = await db
      .select()
      .from(schema.schools)
      .where(eq(schema.schools.id, session.schoolId))
      .get();
  } else {
    school = await db
      .select()
      .from(schema.schools)
      .where(eq(schema.schools.ownerId, user.id))
      .get();
  }

  return jsonResponse({
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      displayName: user.displayName,
      phone: user.phone,
      status: user.status,
    },
    school: school
      ? { 
          id: school.id, 
          name: school.name, 
          plan: school.plan,
          session: school.session,
          term: school.term,
          ca1Max: school.ca1Max,
          ca2Max: school.ca2Max,
          examMax: school.examMax,
          motto: school.motto,
          address: school.address,
          logoUrl: school.logoUrl
        }
      : null,
  }, 200, origin);
}

async function handleChangePassword(db: any, request: Request, origin: string, secret?: string): Promise<Response> {
  const session = await authenticateRequest(request, secret);
  if (!session) return errorResponse("Unauthorized", 401, origin);

  const { oldPassword, newPassword } = await request.json() as any;
  if (!oldPassword || !newPassword) return errorResponse("Old and new passwords required", 400, origin);

  const user = await db
    .select({
      id: schema.users.id,
      passwordHash: schema.users.passwordHash,
    })
    .from(schema.users)
    .where(eq(schema.users.id, session.userId))
    .get();

  if (!user) return errorResponse("User not found", 404, origin);

  const valid = await verifyPassword(oldPassword, user.passwordHash);
  if (!valid) return errorResponse("Current password is incorrect", 403, origin);

  const newHash = await hashPassword(newPassword);
  await db
    .update(schema.users)
    .set({ passwordHash: newHash, updatedAt: nowISO() })
    .where(eq(schema.users.id, user.id))
    .run();

  return jsonResponse({ message: "Password changed successfully" }, 200, origin);
}

async function handleUserProfileUpdate(db: any, request: Request, origin: string, secret?: string): Promise<Response> {
  const session = await authenticateRequest(request, secret);
  if (!session) return errorResponse("Unauthorized", 401, origin);

  const { displayName, email, phone } = (await request.json()) as any;
  if (!displayName || !email) return errorResponse("Display name and email required", 400, origin);

  // Check if new email is taken by someone else
  if (email.toLowerCase() !== session.email.toLowerCase()) {
    const existing = await db.select().from(schema.users).where(eq(schema.users.email, email.toLowerCase())).get();
    if (existing) return errorResponse("Email already in use", 409, origin);
  }

  await db
    .update(schema.users)
    .set({
      displayName,
      email: email.toLowerCase(),
      phone: phone || null,
      updatedAt: nowISO(),
    })
    .where(eq(schema.users.id, session.userId))
    .run();

  // Also update teacher profile if exists
  if (session.role === "TEACHER") {
    const profile = await db.select().from(schema.teacherProfiles).where(eq(schema.teacherProfiles.userId, session.userId)).get();
    if (profile) {
      await db.update(schema.teacherProfiles).set({ displayName, updatedAt: nowISO() }).where(eq(schema.teacherProfiles.id, profile.id)).run();
    }
  }

  return jsonResponse({ success: true, message: "Profile updated" }, 200, origin);
}

    async function handleForgotPassword(db: any, request: Request, origin: string, env: Env): Promise<Response> {
    const { email } = await request.json() as any;
    if (!email) return errorResponse("Email required", 400, origin);

    const user = await db.select().from(schema.users).where(eq(schema.users.email, email.toLowerCase())).get();

    if (!user) return jsonResponse({ success: true, message: "If an account exists, a reset link has been sent." }, 200, origin);

    const resetToken = Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0')).join('');
    const tokenHash = await hashPassword(resetToken);
    const expiresAt = new Date(Date.now() + 3600000).toISOString(); // 1 hour

    await db.insert(schema.passwordResets).values({
    id: generateId(),
    userId: user.id,
    tokenHash,
    expiresAt,
    createdAt: nowISO()
    }).run();

    try {
    const mailer = new EmailService(env);
    const resetUrl = `https://${env.NEXT_PUBLIC_MAIN_DOMAIN || 'reportsheet.com.ng'}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;
    await mailer.send({
      to: email.toLowerCase(),
      subject: "Password Reset Request - ReportSheet",
      html: EmailService.getPasswordResetTemplate(user.displayName || "User", resetUrl)
    });
    } catch (err) {
    console.error("Reset email failed:", err);
    }

    return jsonResponse({ success: true, message: "If an account exists, a reset link has been sent." }, 200, origin);
    }

    async function handleResetPassword(db: any, request: Request, origin: string, env: Env): Promise<Response> {
    const { email, token, newPassword } = await request.json() as any;
    if (!email || !token || !newPassword) return errorResponse("All fields required", 400, origin);

    const user = await db.select().from(schema.users).where(eq(schema.users.email, email.toLowerCase())).get();
    if (!user) return errorResponse("Invalid request", 400, origin);

    const resets = await db.select().from(schema.passwordResets)
    .where(and(eq(schema.passwordResets.userId, user.id), sql`used_at IS NULL`))
    .all();

    let validReset = null;
    for (const r of resets) {
    if (new Date(r.expiresAt) < new Date()) continue;
    if (await verifyPassword(token, r.tokenHash)) {
      validReset = r;
      break;
    }
    }

    if (!validReset) return errorResponse("Invalid or expired token", 400, origin);

    const newHash = await hashPassword(newPassword);
    await db.update(schema.users).set({ passwordHash: newHash, updatedAt: nowISO() }).where(eq(schema.users.id, user.id)).run();
    await db.update(schema.passwordResets).set({ usedAt: nowISO() }).where(eq(schema.passwordResets.id, validReset.id)).run();

    return jsonResponse({ success: true, message: "Password updated successfully" }, 200, origin);
    }


// ===== ADMIN HANDLERS =====

async function handleAdminStats(db: any, origin: string): Promise<Response> {
  const schoolsTotal = await db.select({ count: sql<number>`COUNT(*)` }).from(schema.schools).get();
  const studentsTotal = await db.select({ count: sql<number>`COUNT(*)` }).from(schema.students).get();
  const schoolsActive = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(schema.schools)
    .where(sql`plan != 'TRIAL'`)
    .get();

  const revenueRow = await db
    .select({ sum: sql<number>`SUM(amount_kobo)` })
    .from(schema.payments)
    .where(eq(schema.payments.status, "SUCCESS"))
    .get();

  const recentPayments = await db
    .select({
      id: schema.payments.id,
      amountKobo: schema.payments.amountKobo,
      createdAt: schema.payments.createdAt,
      schoolName: schema.schools.name
    })
    .from(schema.payments)
    .leftJoin(schema.schools, eq(schema.payments.schoolId, schema.schools.id))
    .where(eq(schema.payments.status, "SUCCESS"))
    .orderBy(desc(schema.payments.createdAt))
    .limit(5)
    .all();

  const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const newRegistrationsRow = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(schema.schools)
    .where(gte(schema.schools.createdAt, lastWeek))
    .get();

  return jsonResponse({
    stats: {
      schoolsTotal: schoolsTotal?.count || 0,
      schoolsActive: schoolsActive?.count || 0,
      studentsTotal: studentsTotal?.count || 0,
      revenue: (revenueRow?.sum || 0) / 100,
      recentPayments,
      newRegistrationsCount: newRegistrationsRow?.count || 0
    },
  }, 200, origin);
}

async function handleAdminSchools(db: any, origin: string): Promise<Response> {
  // We need to fetch schools, their owner's status, and their student count.
  const schoolsList = await db
    .select({
      id: schema.schools.id,
      name: schema.schools.name,
      plan: schema.schools.plan,
      createdAt: schema.schools.createdAt,
      ownerEmail: schema.users.email,
      ownerStatus: schema.users.status,
      studentsCount: sql<number>`(SELECT COUNT(*) FROM ${schema.students} WHERE ${schema.students.schoolId} = ${schema.schools.id})`
    })
    .from(schema.schools)
    .leftJoin(schema.users, eq(schema.schools.ownerId, schema.users.id))
    .orderBy(desc(schema.schools.createdAt))
    .all();

  return jsonResponse({ schools: schoolsList }, 200, origin);
}

async function handleAdminSchoolDetail(db: any, schoolId: string, origin: string): Promise<Response> {
  const school = await db
    .select()
    .from(schema.schools)
    .where(eq(schema.schools.id, schoolId))
    .get();

  if (!school) return errorResponse("School not found", 404, origin);

  const owner = await db
    .select({
      id: schema.users.id,
      email: schema.users.email,
      displayName: schema.users.displayName,
      role: schema.users.role,
      status: schema.users.status,
    })
    .from(schema.users)
    .where(eq(schema.users.id, school.ownerId))
    .get();

  const studentCount = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(schema.students)
    .where(eq(schema.students.schoolId, schoolId))
    .get();

  return jsonResponse({
    school: {
      ...school,
      owner,
      studentCount: studentCount?.count || 0,
    },
  }, 200, origin);
}

async function handleAdminToggleSchoolStatus(db: any, schoolId: string, origin: string): Promise<Response> {
  const school = await db.select().from(schema.schools).where(eq(schema.schools.id, schoolId)).get();
  if (!school) return errorResponse("School not found", 404, origin);
  
  const owner = await db.select().from(schema.users).where(eq(schema.users.id, school.ownerId)).get();
  if (!owner) return errorResponse("School owner not found", 404, origin);
  
  const newStatus = owner.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
  await db.update(schema.users).set({ status: newStatus, updatedAt: nowISO() }).where(eq(schema.users.id, owner.id)).run();
  
  return jsonResponse({ success: true, newStatus }, 200, origin);
}

async function handleAdminResetSchoolAuth(db: any, env: Env, schoolId: string, origin: string): Promise<Response> {
  const school = await db.select().from(schema.schools).where(eq(schema.schools.id, schoolId)).get();
  if (!school) return errorResponse("School not found", 404, origin);
  
  const owner = await db.select().from(schema.users).where(eq(schema.users.id, school.ownerId)).get();
  if (!owner) return errorResponse("School owner not found", 404, origin);
  
  const newPassword = Math.random().toString(36).slice(-12);
  const passwordHash = await hashPassword(newPassword);
  
  await db.update(schema.users).set({ 
    passwordHash, 
    forcePasswordChange: 1, 
    updatedAt: nowISO() 
  }).where(eq(schema.users.id, owner.id)).run();
  
  // Try sending email
  try {
    const mailer = new EmailService(env);
    await mailer.send({
      to: owner.email,
      subject: `Admin Credential Reset - ${school.name}`,
      html: `
        <div style="font-family:sans-serif;color:#333;">
          <h2>Admin Credential Reset</h2>
          <p>The platform administrator has reset your master admin credentials for <b>${school.name}</b>.</p>
          <p>Your new temporary password is: <code style="background:#eee;padding:4px 8px;font-size:16px;">${newPassword}</code></p>
          <p>You will be required to change this password immediately upon your next login.</p>
        </div>
      `
    });
  } catch (err) {
    console.error("Failed to send reset auth email:", err);
  }
  
  return jsonResponse({ success: true }, 200, origin);
}

async function handleAdminPayments(db: any, origin: string): Promise<Response> {
  const transactions = await db
    .select({
      id: schema.payments.id,
      schoolName: schema.schools.name,
      amountKobo: schema.payments.amountKobo,
      provider: schema.payments.provider,
      status: schema.payments.status,
      createdAt: schema.payments.createdAt,
      reference: schema.payments.reference,
    })
    .from(schema.payments)
    .leftJoin(schema.schools, eq(schema.payments.schoolId, schema.schools.id))
    .orderBy(desc(schema.payments.createdAt))
    .all();

  return jsonResponse({ transactions }, 200, origin);
}

async function handleAdminAudit(db: any, origin: string): Promise<Response> {
  const logs = await db
    .select({
      id: schema.auditLogs.id,
      action: schema.auditLogs.action,
      data: schema.auditLogs.data,
      createdAt: schema.auditLogs.createdAt,
      userEmail: schema.users.email,
    })
    .from(schema.auditLogs)
    .leftJoin(schema.users, eq(schema.auditLogs.actorUserId, schema.users.id))
    .orderBy(desc(schema.auditLogs.createdAt))
    .limit(100)
    .all();

  return jsonResponse({ logs }, 200, origin);
}

async function handleAdminPlans(db: any, origin: string): Promise<Response> {
  const settings = await db
    .select()
    .from(schema.systemSettings)
    .where(like(schema.systemSettings.k, 'plan_%'))
    .all();
    
  return jsonResponse({ settings }, 200, origin);
}

async function handleSaveAdminPlan(db: any, request: Request, session: any, origin: string): Promise<Response> {
  const { k, v } = await request.json() as any;
  if (!k || !v) return errorResponse("Key and value required", 400, origin);
  
  await db.insert(schema.systemSettings).values({
    k, v, updatedAt: nowISO(), updatedByUserId: session.userId
  }).onConflictDoUpdate({
    target: schema.systemSettings.k,
    set: { v, updatedAt: nowISO(), updatedByUserId: session.userId }
  }).run();
  
  return jsonResponse({ success: true }, 200, origin);
}

async function handleUpdateLicense(db: any, request: Request, origin: string, env: Env): Promise<Response> {
  const { schoolId, plan, amount, reference } = await request.json() as any;
  if (!schoolId || !plan) return errorResponse("schoolId and plan required", 400, origin);
  
  await db.update(schema.schools).set({ 
    plan: plan.toUpperCase(),
    updatedAt: nowISO()
  }).where(eq(schema.schools.id, schoolId)).run();

  // Send Payment Confirmation Email
  try {
    const school = await db.select().from(schema.schools).where(eq(schema.schools.id, schoolId)).get();
    if (school) {
      const owner = await db.select().from(schema.users).where(eq(schema.users.id, school.ownerId)).get();
      if (owner) {
        const mailer = new EmailService(env);
        await mailer.send({
          to: owner.email,
          subject: `Payment Successful - ${school.name}`,
          html: EmailService.getPaymentSuccessTemplate(school.name, plan.toUpperCase(), amount || "N/A", reference || "Admin Update")
        });
      }
    }
  } catch (err) {
    console.error("Payment email failed:", err);
  }
  
  return jsonResponse({ success: true }, 200, origin);
}

async function handleAdminCoupons(db: any, origin: string): Promise<Response> {
  const row = await db.select().from(schema.systemSettings).where(eq(schema.systemSettings.k, 'admin_coupons')).get();
  const coupons = row ? JSON.parse(row.v) : [];
  return jsonResponse({ coupons }, 200, origin);
}

async function handleCreateCoupon(db: any, request: Request, origin: string): Promise<Response> {
  const coupon = await request.json() as any;
  const row = await db.select().from(schema.systemSettings).where(eq(schema.systemSettings.k, 'admin_coupons')).get();
  const coupons = row ? JSON.parse(row.v) : [];
  coupons.push({ ...coupon, id: generateId(), createdAt: nowISO() });
  
  await db.insert(schema.systemSettings).values({
    k: 'admin_coupons', v: JSON.stringify(coupons), updatedAt: nowISO()
  }).onConflictDoUpdate({
    target: schema.systemSettings.k,
    set: { v: JSON.stringify(coupons), updatedAt: nowISO() }
  }).run();
  
  return jsonResponse({ success: true }, 200, origin);
}

async function handleCreateSchool(db: any, request: Request, origin: string): Promise<Response> {
  const { schoolName, email, phone, plan, address, subdomain, logoUrl } = await request.json() as any;
  if (!schoolName || !email) return errorResponse("School name and email required", 400, origin);

  // Check if email already exists
  const existing = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, email.toLowerCase()))
    .get();
  if (existing) return errorResponse("Email already exists", 409, origin);

  const userId = generateId();
  const schoolId = generateId();
  const password = Math.random().toString(36).slice(-12);
  const passwordHash = await hashPassword(password);
  const now = nowISO();

  await db.insert(schema.users).values({
    id: userId,
    email: email.toLowerCase(),
    passwordHash,
    role: "SCHOOL",
    status: "ACTIVE",
    forcePasswordChange: true,
    createdAt: now,
    updatedAt: now,
  }).run();

  await db.insert(schema.schools).values({
    id: schoolId,
    ownerId: userId,
    name: schoolName,
    abbr: schoolName.slice(0, 3).toUpperCase(),
    address: address || null,
    contact: phone || null,
    plan: (plan || "LIFETIME").toUpperCase(),
    subjects: "[]",
    grades: "[]",
    subdomain: subdomain || null,
    logoUrl: logoUrl || null,
    createdAt: now,
    updatedAt: now,
  }).run();

  return jsonResponse({
    school: { id: schoolId, name: schoolName },
    temporaryPassword: password,
  }, 201, origin);
}

// ===== TEACHER HANDLERS =====

async function handleTeacherClasses(db: any, session: any, origin: string): Promise<Response> {
  const assignments = await db
    .select({
      className: schema.teacherClassAssignments.className,
    })
    .from(schema.teacherClassAssignments)
    .where(
      and(
        eq(schema.teacherClassAssignments.teacherUserId, session.userId),
        eq(schema.teacherClassAssignments.schoolId, session.schoolId!)
      )
    )
    .all();

  const classes = [...new Set(assignments.map((a: any) => a.className))];
  return jsonResponse({ classes: classes.map((name) => ({ name })) }, 200, origin);
}

async function handleGetTeacherStats(db: any, session: any, origin: string): Promise<Response> {
  const assignments = await db
    .select({ className: schema.teacherClassAssignments.className })
    .from(schema.teacherClassAssignments)
    .where(eq(schema.teacherClassAssignments.teacherUserId, session.userId))
    .all();

  const classNames = assignments.map((a: any) => a.className);
  
  if (classNames.length === 0) {
    return jsonResponse({ totalStudents: 0, attendanceRate: 0, scoresCompletion: 0, stats: [], topAchievers: [] }, 200, origin);
  }

  // Fetch all students in these classes
  const students = await db
    .select({ id: schema.students.id, name: schema.students.name })
    .from(schema.students)
    .where(and(eq(schema.students.schoolId, session.schoolId!), inArray(schema.students.className, classNames)))
    .all();

  const studentIds = students.map((s: any) => s.id);
  const studentNameMap = new Map<string, string>();
  students.forEach((s: any) => studentNameMap.set(s.id, s.name));
  
  if (studentIds.length === 0) {
    return jsonResponse({ totalStudents: 0, attendanceRate: 0, scoresCompletion: 0, stats: [], topAchievers: [] }, 200, origin);
  }

  // Calculate scores completion
  const scoreSheets = await db
    .select({ studentId: schema.scoreSheets.studentId, data: schema.scoreSheets.data })
    .from(schema.scoreSheets)
    .where(and(eq(schema.scoreSheets.schoolId, session.schoolId!), inArray(schema.scoreSheets.studentId, studentIds)))
    .all();

  const scoresCompletion = Math.round((scoreSheets.length / studentIds.length) * 100);

  // Calculate average grade
  let totalGradeSum = 0;
  let gradeCount = 0;
  const studentScoresList: { name: string; average: number }[] = [];

  for (const sheet of scoreSheets) {
    try {
      const data = JSON.parse(sheet.data);
      let subjectCount = 0;
      let subjectSum = 0;
      for (const subKey of Object.keys(data)) {
        const subData = data[subKey];
        const score = (Number(subData.ca1) || 0) + (Number(subData.ca2) || 0) + (Number(subData.exam) || 0);
        subjectSum += score;
        subjectCount++;
      }
      if (subjectCount > 0) {
        const avg = subjectSum / subjectCount;
        totalGradeSum += avg;
        gradeCount++;

        const name = studentNameMap.get(sheet.studentId) || "Student";
        studentScoresList.push({ name, average: Math.round(avg * 10) / 10 });
      }
    } catch (e) {}
  }
  const averageGradeVal = gradeCount > 0 ? Math.round(totalGradeSum / gradeCount) : 0;

  // Calculate attendance rate (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];
  
  const marks = await db
    .select({ mark: schema.attendanceMarks.mark })
    .from(schema.attendanceMarks)
    .innerJoin(schema.attendanceSessions, eq(schema.attendanceMarks.attendanceSessionId, schema.attendanceSessions.id))
    .where(and(
      inArray(schema.attendanceMarks.studentId, studentIds),
      gte(schema.attendanceSessions.sessionDate, thirtyDaysAgoStr)
    ))
    .all();

  const presentCount = marks.filter((m: any) => m.mark === "PRESENT" || m.mark === "LATE").length;
  const attendanceRate = marks.length > 0 ? Math.round((presentCount / marks.length) * 100) : 0;

  // Format stats panels array
  const avgGradeStr = averageGradeVal > 0 ? `${averageGradeVal}%` : "No scores";
  const stats = [
    { label: 'Average Grade', val: avgGradeStr, trend: 'Overall class average', neutral: true },
    { label: 'Avg Attendance', val: `${attendanceRate}%`, trend: 'Last 30 days', neutral: true },
    { label: 'Engagement', val: `${scoresCompletion}%`, trend: 'Scores entered', neutral: true },
    { label: 'Next Deadline', val: 'End of Term', trend: 'Check schedule', info: true }
  ];

  // Top Achievers ranking
  studentScoresList.sort((a, b) => b.average - a.average);
  const topAchievers = studentScoresList.slice(0, 5).map((item, idx) => ({
    name: item.name,
    score: item.average,
    trend: "+0.0",
    pos: idx + 1
  }));

  return jsonResponse({ 
    totalStudents: studentIds.length, 
    attendanceRate, 
    scoresCompletion,
    stats,
    topAchievers
  }, 200, origin);
}

async function handleTeacherStudents(db: any, request: Request, session: any, origin: string): Promise<Response> {
  const url = new URL(request.url);
  const className = url.searchParams.get("className");
  if (!className) return errorResponse("className required", 400, origin);

  const assignment = await db
    .select({ id: schema.teacherClassAssignments.id })
    .from(schema.teacherClassAssignments)
    .where(
      and(
        eq(schema.teacherClassAssignments.teacherUserId, session.userId),
        eq(schema.teacherClassAssignments.schoolId, session.schoolId!),
        eq(schema.teacherClassAssignments.className, className)
      )
    )
    .get();

  if (!assignment) return errorResponse("Not authorized for this class", 403, origin);

  const students = await db
    .select({
      id: schema.students.id,
      name: schema.students.name,
      admNo: schema.students.admissionNo,
      cls: schema.students.className,
    })
    .from(schema.students)
    .where(
      and(
        eq(schema.students.schoolId, session.schoolId!),
        eq(schema.students.className, className)
      )
    )
    .orderBy(asc(schema.students.name))
    .all();

  return jsonResponse({ students }, 200, origin);
}

async function handleGetAttendanceSession(db: any, request: Request, session: any, origin: string): Promise<Response> {
  const url = new URL(request.url);
  const className = url.searchParams.get("className");
  const date = url.searchParams.get("date");
  if (!className || !date) return errorResponse("className and date required", 400, origin);

  let sessionRecord = await db
    .select()
    .from(schema.attendanceSessions)
    .where(
      and(
        eq(schema.attendanceSessions.schoolId, session.schoolId!),
        eq(schema.attendanceSessions.className, className),
        eq(schema.attendanceSessions.sessionDate, new Date(date).toISOString().split('T')[0])
      )
    )
    .get();

  if (!sessionRecord) {
    return jsonResponse({ session: null, marks: [] }, 200, origin);
  }

  const marks = await db
    .select()
    .from(schema.attendanceMarks)
    .where(eq(schema.attendanceMarks.attendanceSessionId, sessionRecord.id))
    .all();

  return jsonResponse({
    session: sessionRecord,
    marks: marks.map((m: any) => ({
      studentId: m.studentId,
      mark: m.mark,
      note: m.note || "",
    })),
  }, 200, origin);
}

async function handleSaveAttendanceSession(db: any, request: Request, session: any, origin: string): Promise<Response> {
  const { className, date, marks } = await request.json() as any;
  if (!className || !date || !marks) return errorResponse("className, date, and marks required", 400, origin);

  const school = await db.select().from(schema.schools).where(eq(schema.schools.id, session.schoolId!)).get();
  if (!school) return errorResponse("School not found", 404, origin);

  const sessionDateStr = new Date(date).toISOString().split('T')[0];
  let sessionRecord = await db
    .select()
    .from(schema.attendanceSessions)
    .where(
      and(
        eq(schema.attendanceSessions.schoolId, session.schoolId!),
        eq(schema.attendanceSessions.className, className),
        eq(schema.attendanceSessions.sessionDate, sessionDateStr)
      )
    )
    .get();

  if (!sessionRecord) {
    const id = generateId();
    await db.insert(schema.attendanceSessions).values({
      id,
      schoolId: session.schoolId!,
      className,
      sessionDate: sessionDateStr,
      session: school.session || '',
      term: school.term || '',
      takenByUserId: session.userId,
      status: "DRAFT",
      createdAt: nowISO(),
      updatedAt: nowISO(),
    }).run();
    sessionRecord = await db
      .select()
      .from(schema.attendanceSessions)
      .where(eq(schema.attendanceSessions.id, id))
      .get();
  }


  if (sessionRecord.status === "SUBMITTED") {
    return errorResponse("Session already submitted", 403, origin);
  }

  // Delete existing marks and re-insert
  await db
    .delete(schema.attendanceMarks)
    .where(eq(schema.attendanceMarks.attendanceSessionId, sessionRecord.id))
    .run();

  for (const mark of marks) {
    if (mark.mark) {
      await db.insert(schema.attendanceMarks).values({
        id: generateId(),
        schoolId: session.schoolId!,
        attendanceSessionId: sessionRecord.id,
        studentId: mark.studentId,
        mark: mark.mark,
        note: mark.note || null,
        createdAt: nowISO(),
        updatedAt: nowISO(),
      }).run();
    }
  }

  await db
    .update(schema.attendanceSessions)
    .set({ updatedAt: nowISO() })
    .where(eq(schema.attendanceSessions.id, sessionRecord.id))
    .run();

  return jsonResponse({ session: sessionRecord, message: "Saved" }, 200, origin);
}

async function handleSubmitAttendance(db: any, sessionId: string, session: any, origin: string): Promise<Response> {
  if (!sessionId) return errorResponse("Session ID required", 400, origin);

  let sessionRecord = await db
    .select()
    .from(schema.attendanceSessions)
    .where(and(eq(schema.attendanceSessions.id, sessionId), eq(schema.attendanceSessions.schoolId, session.schoolId!)))
    .get();

  if (!sessionRecord) return errorResponse("Session not found", 404, origin);
  if (sessionRecord.status === "SUBMITTED") return errorResponse("Already submitted", 403, origin);

  await db
    .update(schema.attendanceSessions)
    .set({ status: "SUBMITTED", updatedAt: nowISO() })
    .where(eq(schema.attendanceSessions.id, sessionId))
    .run();

  return jsonResponse({ message: "Submitted" }, 200, origin);
}

async function handleAttendanceHistory(db: any, request: Request, session: any, origin: string): Promise<Response> {
  const url = new URL(request.url);
  const className = url.searchParams.get("className");
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");

  if (!className) return errorResponse("className required", 400, origin);

  const sessions = await db
    .select()
    .from(schema.attendanceSessions)
    .where(
      and(
        eq(schema.attendanceSessions.schoolId, session.schoolId!),
        eq(schema.attendanceSessions.className, className),
        from ? gte(schema.attendanceSessions.sessionDate, from) : undefined,
        to ? lte(schema.attendanceSessions.sessionDate, to) : undefined
      )
    )
    .orderBy(desc(schema.attendanceSessions.sessionDate))
    .all();

  return jsonResponse({ sessions }, 200, origin);
}


async function handleGetTeacherScores(db: any, request: Request, session: any, origin: string): Promise<Response> {
  const url = new URL(request.url);
  const className = url.searchParams.get("className");
  if (!className) return errorResponse("className required", 400, origin);

  const school = await db.select().from(schema.schools).where(eq(schema.schools.id, session.schoolId!)).get();
  const qSession = url.searchParams.get("session") || school?.session || '';
  const qTerm = url.searchParams.get("term") || school?.term || '';

  const students = await db
    .select()
    .from(schema.students)
    .where(and(eq(schema.students.schoolId, session.schoolId!), eq(schema.students.className, className)))
    .all();

  const scores = await db
    .select()
    .from(schema.scoreSheets)
    .where(and(
      eq(schema.scoreSheets.schoolId, session.schoolId!),
      eq(schema.scoreSheets.session, qSession),
      eq(schema.scoreSheets.term, qTerm)
    ))
    .all();

  const extrasRows = await db
    .select()
    .from(schema.reportExtras)
    .where(and(
      eq(schema.reportExtras.schoolId, session.schoolId!),
      eq(schema.reportExtras.session, qSession),
      eq(schema.reportExtras.term, qTerm)
    ))
    .all();
    
  const attendanceRows = await db.select({
      studentId: schema.attendanceMarks.studentId,
      mark: schema.attendanceMarks.mark
    })
    .from(schema.attendanceMarks)
    .innerJoin(schema.attendanceSessions, eq(schema.attendanceMarks.attendanceSessionId, schema.attendanceSessions.id))
    .where(and(
      eq(schema.attendanceSessions.schoolId, session.schoolId!),
      eq(schema.attendanceSessions.session, qSession),
      eq(schema.attendanceSessions.term, qTerm),
      eq(schema.attendanceSessions.status, "SUBMITTED")
    )).all();

  const attendanceStats: Record<string, { present: number, absent: number, late: number }> = {};
  attendanceRows.forEach((r: any) => {
    if (!attendanceStats[r.studentId]) attendanceStats[r.studentId] = { present: 0, absent: 0, late: 0 };
    if (r.mark === "PRESENT") attendanceStats[r.studentId].present++;
    if (r.mark === "ABSENT") attendanceStats[r.studentId].absent++;
    if (r.mark === "LATE") attendanceStats[r.studentId].late++;
  });

  const reportExtras: Record<string, any> = {};
  extrasRows.forEach((r: any) => {
    try { 
      reportExtras[r.studentId] = {
        ...r,
        traits: JSON.parse(r.traits),
        comments: JSON.parse(r.comments)
      };
    } catch(e) { reportExtras[r.studentId] = r; }
  });

  Object.keys(attendanceStats).forEach(studentId => {
    const stats = attendanceStats[studentId];
    const total = stats.present + stats.absent + stats.late;
    const attended = stats.present + stats.late;
    if (total > 0) {
      const percentage = Math.round((attended / total) * 100);
      const autoAttendance = `${percentage}% (${attended}/${total})`;
      if (reportExtras[studentId]) {
        reportExtras[studentId].attendance = autoAttendance;
      } else {
        reportExtras[studentId] = { attendance: autoAttendance, traits: {}, comments: {} };
      }
    }
  });

  return jsonResponse({ students, scores, reportExtras }, 200, origin);
}

async function handleSaveTeacherScores(db: any, request: Request, session: any, origin: string): Promise<Response> {
  const body = (await request.json()) as any;
  const { scores, session: reqSession, term: reqTerm } = body;
  if (!Array.isArray(scores)) return errorResponse("scores array required", 400, origin);

  // Build the set of student IDs this teacher is authorised to grade (only their assigned classes)
  const assignments = await db.select({ className: schema.teacherClassAssignments.className })
    .from(schema.teacherClassAssignments)
    .where(and(eq(schema.teacherClassAssignments.teacherUserId, session.userId), eq(schema.teacherClassAssignments.schoolId, session.schoolId!)))
    .all();
  const assignedClasses = new Set(assignments.map((a: any) => a.className));

  const authorisedStudents = await db.select({ id: schema.students.id })
    .from(schema.students)
    .where(and(eq(schema.students.schoolId, session.schoolId!), inArray(schema.students.className, [...assignedClasses])))
    .all();
  const authorisedIds = new Set(authorisedStudents.map((s: any) => s.id));

  const school = await db.select().from(schema.schools).where(eq(schema.schools.id, session.schoolId!)).get();
  const qSession = reqSession || school?.session || '';
  const qTerm = reqTerm || school?.term || '';

  for (const s of scores) {
    if (!authorisedIds.has(s.studentId)) continue;

    const existing = await db
      .select()
      .from(schema.scoreSheets)
      .where(and(
        eq(schema.scoreSheets.studentId, s.studentId),
        eq(schema.scoreSheets.schoolId, session.schoolId!),
        eq(schema.scoreSheets.session, qSession),
        eq(schema.scoreSheets.term, qTerm)
      ))
      .get();

    if (existing) {
      await db
        .update(schema.scoreSheets)
        .set({ data: JSON.stringify(s.data), updatedAt: nowISO() })
        .where(eq(schema.scoreSheets.id, existing.id))
        .run();
    } else {
      await db
        .insert(schema.scoreSheets)
        .values({
          id: generateId(),
          schoolId: session.schoolId!,
          studentId: s.studentId,
          session: qSession,
          term: qTerm,
          data: JSON.stringify(s.data),
          createdAt: nowISO(),
          updatedAt: nowISO(),
        })
        .run();
    }
  }

  return jsonResponse({ success: true }, 200, origin);
}

async function handleGetTeacherComments(db: any, request: Request, session: any, origin: string): Promise<Response> {
  const url = new URL(request.url);
  const className = url.searchParams.get("className");
  if (!className) return errorResponse("className required", 400, origin);

  const students = await db
    .select()
    .from(schema.students)
    .where(and(eq(schema.students.schoolId, session.schoolId!), eq(schema.students.className, className)))
    .all();

  const extras = await db
    .select()
    .from(schema.reportExtras)
    .where(eq(schema.reportExtras.schoolId, session.schoolId!))
    .all();

  return jsonResponse({ students, extras }, 200, origin);
}

async function handleSaveTeacherComments(db: any, request: Request, session: any, origin: string): Promise<Response> {
  const body = (await request.json()) as any;
  const { comments } = body;
  if (!Array.isArray(comments)) return errorResponse("comments array required", 400, origin);

  const school = await db.select().from(schema.schools).where(eq(schema.schools.id, session.schoolId!)).get();

  for (const c of comments) {
    const existing = await db
      .select()
      .from(schema.reportExtras)
      .where(and(eq(schema.reportExtras.studentId, c.studentId), eq(schema.reportExtras.schoolId, session.schoolId!)))
      .get();

    const data = {
      attendance: c.attendance || "0",
      traits: JSON.stringify(c.traits || {}),
      comments: JSON.stringify(c.comments || {}),
      promotion: c.promotion || "",
      updatedAt: nowISO(),
    };

    if (existing) {
      await db.update(schema.reportExtras).set(data).where(eq(schema.reportExtras.id, existing.id)).run();
    } else {
      await db
        .insert(schema.reportExtras)
        .values({
          id: generateId(),
          schoolId: session.schoolId!,
          studentId: c.studentId,
          session: school?.session || "",
          term: school?.term || "",
          ...data,
          createdAt: nowISO(),
        })
        .run();
    }
  }

  return jsonResponse({ success: true }, 200, origin);
}

// ===== SCHOOL ADMIN HANDLERS =====

async function handleGetSchool(db: any, session: any, origin: string): Promise<Response> {
  const school = await db.select().from(schema.schools).where(eq(schema.schools.id, session.schoolId!)).get();
  if (!school) return errorResponse("School not found", 404, origin);
  
  // Parse JSON fields
  const s = { ...school } as any;
  if (s.subjects) try { s.subjects = JSON.parse(s.subjects); } catch(e) { s.subjects = []; }
  if (s.grades) try { s.grades = JSON.parse(s.grades); } catch(e) { s.grades = []; }
  if (s.classTemplates) {
    try {
      const parsed = JSON.parse(s.classTemplates);
      s.classTemplates = Array.isArray(parsed) ? parsed : [];
    } catch(e) {
      s.classTemplates = [];
    }
  } else {
    s.classTemplates = [];
  }
  if (s.classArms) {
    try {
      const parsed = JSON.parse(s.classArms);
      s.classArms = Array.isArray(parsed) ? parsed : [];
    } catch(e) {
      s.classArms = [];
    }
  } else {
    s.classArms = [];
  }
  if (s.promotionLogic) {
    try {
      s.promotionLogic = JSON.parse(s.promotionLogic);
    } catch(e) {
      s.promotionLogic = { enabled: false, minAverage: 50, coreSubjects: [] };
    }
  } else {
    s.promotionLogic = { enabled: false, minAverage: 50, coreSubjects: [] };
  }
  
  return jsonResponse({ school: s }, 200, origin);
}

async function handleUpdateSchool(db: any, request: Request, session: any, origin: string): Promise<Response> {
  const body = await request.json() as any;
  const { name, abbr, address, contact, session: schoolSession, term, ca1Max, ca2Max, examMax, subjects, grades, motto, principal, logoUrl, reportColor, reportTemplate, nextTerm, classTemplates, classArms, promotionLogic } = body;
  
  await db.update(schema.schools).set({
    name, abbr, address, contact, session: schoolSession, term, motto, principal, logoUrl, reportColor, reportTemplate, nextTerm,
    ca1Max: Number(ca1Max), ca2Max: Number(ca2Max), examMax: Number(examMax),
    subjects: (subjects && typeof subjects === 'object') ? JSON.stringify(subjects) : subjects,
    grades: (grades && typeof grades === 'object') ? JSON.stringify(grades) : grades,
    classTemplates: (classTemplates && typeof classTemplates === 'object') ? JSON.stringify(classTemplates) : classTemplates,
    classArms: (classArms && typeof classArms === 'object') ? JSON.stringify(classArms) : classArms,
    promotionLogic: (promotionLogic && typeof promotionLogic === 'object') ? JSON.stringify(promotionLogic) : promotionLogic,
    updatedAt: nowISO()
  }).where(eq(schema.schools.id, session.schoolId!)).run();
  
  return jsonResponse({ success: true }, 200, origin);
}

async function handleGetStudents(db: any, session: any, origin: string): Promise<Response> {
  const students = await db.select().from(schema.students).where(eq(schema.students.schoolId, session.schoolId!)).all();
  return jsonResponse({ students }, 200, origin);
}

async function handleCreateStudent(db: any, request: Request, session: any, origin: string): Promise<Response> {
  const body = await request.json() as any;
  const { name, cls, className, gender, admNo, admissionNo, photoUrl, dob, club, parentName, parentEmail, parentPhone } = body;
  const id = generateId();
  
  await db.insert(schema.students).values({
    id,
    schoolId: session.schoolId!,
    name,
    className: className || cls,
    gender,
    admissionNo: admissionNo || admNo || `ADM-${Date.now()}`,
    photoUrl: photoUrl || null,
    dob: dob || null,
    guardianName: parentName || null,
    guardianEmail: parentEmail || null,
    guardianPhone: parentPhone || null,
    profileExtra: JSON.stringify({ club: club || null }),
    createdAt: nowISO(),
    updatedAt: nowISO()
  }).run();

  if (parentEmail) {
    let parentUser = await db.select().from(schema.users).where(eq(schema.users.email, parentEmail)).get();
    let parentUserId = parentUser?.id;
    if (!parentUser) {
      parentUserId = generateId();
      const pwdHash = await hashPassword('Parent@123');
      await db.insert(schema.users).values({
        id: parentUserId,
        email: parentEmail,
        displayName: parentName || 'Parent',
        phone: parentPhone || null,
        passwordHash: pwdHash,
        role: 'PARENT',
        schoolId: session.schoolId,
        forcePasswordChange: 1,
        createdAt: nowISO(),
        updatedAt: nowISO()
      }).run();
    }

    const existingLink = await db.select().from(schema.studentLinks).where(and(eq(schema.studentLinks.studentId, id), eq(schema.studentLinks.userId, parentUserId))).get();
    if (!existingLink) {
      await db.insert(schema.studentLinks).values({
        id: generateId(),
        schoolId: session.schoolId!,
        studentId: id,
        userId: parentUserId,
        linkType: 'PARENT',
        createdAt: nowISO()
      }).run();
    }
  }
  
  return jsonResponse({ success: true, id }, 201, origin);
}

async function handleUpdateStudent(db: any, request: Request, studentId: string, session: any, origin: string): Promise<Response> {
  const body = await request.json() as any;
  const { name, cls, className, gender, admNo, admissionNo, photoUrl, dob, club, parentName, parentEmail, parentPhone } = body;
  
  await db.update(schema.students).set({
    name: name,
    className: className || cls,
    gender: gender,
    admissionNo: admissionNo || admNo,
    photoUrl: photoUrl !== undefined ? photoUrl : null,
    dob: dob !== undefined ? dob : null,
    guardianName: parentName !== undefined ? parentName : null,
    guardianEmail: parentEmail !== undefined ? parentEmail : null,
    guardianPhone: parentPhone !== undefined ? parentPhone : null,
    profileExtra: club !== undefined ? JSON.stringify({ club: club || null }) : undefined,
    updatedAt: nowISO()
  }).where(and(eq(schema.students.id, studentId), eq(schema.students.schoolId, session.schoolId!))).run();

  if (parentEmail) {
    let parentUser = await db.select().from(schema.users).where(eq(schema.users.email, parentEmail)).get();
    let parentUserId = parentUser?.id;
    if (!parentUser) {
      parentUserId = generateId();
      const pwdHash = await hashPassword('Parent@123');
      await db.insert(schema.users).values({
        id: parentUserId,
        email: parentEmail,
        displayName: parentName || 'Parent',
        phone: parentPhone || null,
        passwordHash: pwdHash,
        role: 'PARENT',
        schoolId: session.schoolId,
        forcePasswordChange: 1,
        createdAt: nowISO(),
        updatedAt: nowISO()
      }).run();
    }

    const existingLink = await db.select().from(schema.studentLinks).where(and(eq(schema.studentLinks.studentId, studentId), eq(schema.studentLinks.userId, parentUserId))).get();
    if (!existingLink) {
      await db.insert(schema.studentLinks).values({
        id: generateId(),
        schoolId: session.schoolId!,
        studentId: studentId,
        userId: parentUserId,
        linkType: 'PARENT',
        createdAt: nowISO()
      }).run();
    }
  }
  
  return jsonResponse({ success: true }, 200, origin);
}

async function handleDeleteStudent(db: any, studentId: string, session: any, origin: string): Promise<Response> {
  await db.delete(schema.students).where(and(eq(schema.students.id, studentId), eq(schema.students.schoolId, session.schoolId!))).run();
  return jsonResponse({ success: true }, 200, origin);
}

async function handleGetTeachers(db: any, session: any, origin: string): Promise<Response> {
  const profiles = await db.select().from(schema.teacherProfiles).where(eq(schema.teacherProfiles.schoolId, session.schoolId!)).all();
  const assignments = await db.select().from(schema.teacherClassAssignments).where(eq(schema.teacherClassAssignments.schoolId, session.schoolId!)).all();
  
  const userIds = profiles.map((p: any) => p.userId);
  let usersList: any[] = [];
  if (userIds.length > 0) {
    usersList = await db.select({
      id: schema.users.id,
      email: schema.users.email,
      status: schema.users.status,
    }).from(schema.users).where(inArray(schema.users.id, userIds)).all();
  }
  
  const teachers = profiles.map((p: any) => {
    const user = usersList.find((u: any) => u.id === p.userId);
    const assignedClasses = assignments.filter((a: any) => a.teacherUserId === p.userId).map((a: any) => a.className);
    return {
      id: p.userId,
      displayName: p.displayName,
      email: user?.email,
      status: user?.status,
      classes: assignedClasses
    };
  });
  
  return jsonResponse({ teachers }, 200, origin);
}

async function handleCreateTeacher(db: any, request: Request, session: any, origin: string, env: Env): Promise<Response> {
  const body = await request.json() as any;
  const { email, name, password, classes } = body;
  
  const existing = await db.select().from(schema.users).where(eq(schema.users.email, email.toLowerCase())).get();
  if (existing) return errorResponse("Email already in use", 400, origin);
  
  const userId = generateId();
  const pwdHash = await hashPassword(password);
  
  await db.insert(schema.users).values({
    id: userId,
    email: email.toLowerCase(),
    passwordHash: pwdHash,
    role: "TEACHER",
    createdAt: nowISO(),
    updatedAt: nowISO(),
    status: "ACTIVE",
    schoolId: session.schoolId
  }).run();
  
  await db.insert(schema.teacherProfiles).values({
    id: generateId(),
    userId,
    schoolId: session.schoolId!,
    displayName: name,
    createdAt: nowISO(),
    updatedAt: nowISO()
  }).run();
  
  if (Array.isArray(classes)) {
    for (const c of classes) {
      await db.insert(schema.teacherClassAssignments).values({
        id: generateId(),
        schoolId: session.schoolId!,
        teacherUserId: userId,
        className: c,
        createdAt: nowISO()
      }).run();
    }
  }

  // Send Invite Email
  try {
    const school = await db.select().from(schema.schools).where(eq(schema.schools.id, session.schoolId!)).get();
    const mailer = new EmailService(env);
    const loginUrl = `https://${school.subdomain}.${env.NEXT_PUBLIC_MAIN_DOMAIN || 'reportsheet.com.ng'}/login`;
    await mailer.send({
      to: email.toLowerCase(),
      subject: `Staff Invitation - ${school.name}`,
      html: EmailService.getStaffInviteTemplate(school.name, name, email.toLowerCase(), password, loginUrl)
    });
  } catch (err) {
    console.error("Staff invite email failed:", err);
  }
  
  return jsonResponse({ success: true, id: userId }, 201, origin);
}

async function handleDeleteTeacher(db: any, teacherId: string, session: any, origin: string): Promise<Response> {
  const profile = await db.select().from(schema.teacherProfiles).where(and(eq(schema.teacherProfiles.userId, teacherId), eq(schema.teacherProfiles.schoolId, session.schoolId!))).get();
  if (profile) {
    await db.delete(schema.users).where(eq(schema.users.id, teacherId)).run();
  }
  return jsonResponse({ success: true }, 200, origin);
}

async function handleGetParents(db: any, session: any, origin: string): Promise<Response> {
  const users = await db.select({
    id: schema.users.id,
    email: schema.users.email,
    displayName: schema.users.displayName,
    phone: schema.users.phone,
    status: schema.users.status,
  }).from(schema.users).where(and(eq(schema.users.schoolId, session.schoolId!), eq(schema.users.role, "PARENT"))).all();
  const links = await db.select().from(schema.studentLinks).where(eq(schema.studentLinks.schoolId, session.schoolId!)).all();
  const allStudents = await db.select().from(schema.students).where(eq(schema.students.schoolId, session.schoolId!)).all();

  const parents = users.map((u: any) => {
    const parentLinks = links.filter((l: any) => l.userId === u.id);
    const linkedStudents = parentLinks.map((l: any) => {
      const s = allStudents.find((st: any) => st.id === l.studentId);
      return s ? { id: s.id, name: s.name, cls: s.className, linkId: l.id } : null;
    }).filter(Boolean);

    return {
      id: u.id,
      displayName: u.displayName,
      email: u.email,
      phone: u.phone,
      status: u.status,
      linkedStudents
    };
  });

  return jsonResponse({ parents }, 200, origin);
}

async function handleCreateParent(db: any, request: Request, session: any, origin: string, env: Env): Promise<Response> {
  const body = await request.json() as any;
  const { email, name, password, phone, studentId } = body;
  
  const existing = await db.select().from(schema.users).where(eq(schema.users.email, email.toLowerCase())).get();
  if (existing) return errorResponse("Email already in use", 400, origin);
  
  const userId = generateId();
  const pwdHash = await hashPassword(password);
  
  await db.insert(schema.users).values({
    id: userId,
    email: email.toLowerCase(),
    displayName: name,
    passwordHash: pwdHash,
    role: "PARENT",
    createdAt: nowISO(),
    updatedAt: nowISO(),
    status: "ACTIVE",
    phone,
    schoolId: session.schoolId
  }).run();
  
  let studentName = "your child";
  if (studentId) {
    const student = await db.select().from(schema.students).where(eq(schema.students.id, studentId)).get();
    if (student) studentName = student.name;

    await db.insert(schema.studentLinks).values({
      id: generateId(),
      schoolId: session.schoolId!,
      studentId,
      userId,
      linkType: "PARENT",
      createdAt: nowISO()
    }).run();
  }

  // Send Invite Email
  try {
    const school = await db.select().from(schema.schools).where(eq(schema.schools.id, session.schoolId!)).get();
    const mailer = new EmailService(env);
    const loginUrl = `https://${school.subdomain}.${env.NEXT_PUBLIC_MAIN_DOMAIN || 'reportsheet.com.ng'}/login`;
    await mailer.send({
      to: email.toLowerCase(),
      subject: `Parent Portal Access - ${school.name}`,
      html: EmailService.getParentInviteTemplate(school.name, name, studentName, email.toLowerCase(), password, loginUrl)
    });
  } catch (err) {
    console.error("Parent invite email failed:", err);
  }
  
  return jsonResponse({ success: true, id: userId }, 201, origin);
}

async function handleDeleteParent(db: any, userId: string, session: any, origin: string): Promise<Response> {
  const user = await db.select().from(schema.users).where(and(eq(schema.users.id, userId), eq(schema.users.schoolId, session.schoolId!), eq(schema.users.role, "PARENT"))).get();
  if (!user) return errorResponse("Parent not found", 404, origin);

  await db.delete(schema.users).where(eq(schema.users.id, userId)).run();
  await db.delete(schema.studentLinks).where(eq(schema.studentLinks.userId, userId)).run();
  
  return jsonResponse({ success: true }, 200, origin);
}

async function handleCreateStudentLink(db: any, request: Request, session: any, origin: string): Promise<Response> {
  const body = await request.json() as any;
  const { userId, studentId, linkType } = body;
  
  await db.insert(schema.studentLinks).values({
    id: generateId(),
    schoolId: session.schoolId!,
    studentId,
    userId,
    linkType: linkType || "PARENT",
    createdAt: nowISO()
  }).run();
  
  return jsonResponse({ success: true }, 201, origin);
}

async function handleCreateStudentUser(db: any, request: Request, session: any, origin: string, env: Env): Promise<Response> {
  const body = await request.json() as any;
  const { studentId, email, password } = body;
  
  if (!studentId || !email || !password) return errorResponse("studentId, email and password required", 400, origin);

  const student = await db.select().from(schema.students).where(and(eq(schema.students.id, studentId), eq(schema.students.schoolId, session.schoolId!))).get();
  if (!student) return errorResponse("Student not found", 404, origin);

  const existing = await db.select().from(schema.users).where(eq(schema.users.email, email.toLowerCase())).get();
  if (existing) return errorResponse("Email already in use", 400, origin);

  const userId = generateId();
  const pwdHash = await hashPassword(password);
  const now = nowISO();

  await db.insert(schema.users).values({
    id: userId,
    email: email.toLowerCase(),
    displayName: student.name,
    passwordHash: pwdHash,
    role: "STUDENT",
    status: "ACTIVE",
    schoolId: session.schoolId,
    createdAt: now,
    updatedAt: now
  }).run();

  await db.insert(schema.studentLinks).values({
    id: generateId(),
    schoolId: session.schoolId!,
    studentId: studentId,
    userId: userId,
    linkType: "STUDENT",
    createdAt: now
  }).run();

  // Send Student Invite Email
  try {
    const school = await db.select().from(schema.schools).where(eq(schema.schools.id, session.schoolId!)).get();
    const mailer = new EmailService(env);
    const loginUrl = `https://${school.subdomain}.${env.NEXT_PUBLIC_MAIN_DOMAIN || 'reportsheet.com.ng'}/login`;
    await mailer.send({
      to: email.toLowerCase(),
      subject: `Student Portal Activated - ${school.name}`,
      html: EmailService.getStudentInviteTemplate(school.name, student.name, email.toLowerCase(), password, loginUrl)
    });
  } catch (err) {
    console.error("Student invite email failed:", err);
  }

  return jsonResponse({ success: true, userId }, 201, origin);
}

async function handleDeleteStudentLink(db: any, linkId: string, session: any, origin: string): Promise<Response> {
  await db.delete(schema.studentLinks).where(and(eq(schema.studentLinks.id, linkId), eq(schema.studentLinks.schoolId, session.schoolId!))).run();
  return jsonResponse({ success: true }, 200, origin);
}

async function handleGetScoresAdmin(db: any, request: Request, session: any, origin: string): Promise<Response> {
  const url = new URL(request.url);
  const school = await db.select().from(schema.schools).where(eq(schema.schools.id, session.schoolId!)).get();
  const qSession = url.searchParams.get("session") || school?.session || '';
  const qTerm = url.searchParams.get("term") || school?.term || '';

  const rows = await db.select().from(schema.scoreSheets)
    .where(and(
      eq(schema.scoreSheets.schoolId, session.schoolId!),
      eq(schema.scoreSheets.session, qSession),
      eq(schema.scoreSheets.term, qTerm)
    )).all();
    
  const extrasRows = await db.select().from(schema.reportExtras)
    .where(and(
      eq(schema.reportExtras.schoolId, session.schoolId!),
      eq(schema.reportExtras.session, qSession),
      eq(schema.reportExtras.term, qTerm)
    )).all();
  
  const scores: Record<string, any> = {};
  const attendanceRows = await db.select({
      studentId: schema.attendanceMarks.studentId,
      mark: schema.attendanceMarks.mark
    })
    .from(schema.attendanceMarks)
    .innerJoin(schema.attendanceSessions, eq(schema.attendanceMarks.attendanceSessionId, schema.attendanceSessions.id))
    .where(and(
      eq(schema.attendanceSessions.schoolId, session.schoolId!),
      eq(schema.attendanceSessions.session, qSession),
      eq(schema.attendanceSessions.term, qTerm),
      eq(schema.attendanceSessions.status, "SUBMITTED")
    )).all();

  const attendanceStats: Record<string, { present: number, absent: number, late: number }> = {};
  attendanceRows.forEach((r: any) => {
    if (!attendanceStats[r.studentId]) attendanceStats[r.studentId] = { present: 0, absent: 0, late: 0 };
    if (r.mark === "PRESENT") attendanceStats[r.studentId].present++;
    if (r.mark === "ABSENT") attendanceStats[r.studentId].absent++;
    if (r.mark === "LATE") attendanceStats[r.studentId].late++;
  });

  const reportExtras: Record<string, any> = {};
  
  rows.forEach((r: any) => {
    try { scores[r.studentId] = JSON.parse(r.data); } catch(e) { scores[r.studentId] = {}; }
  });
  
  extrasRows.forEach((r: any) => {
    try { 
      reportExtras[r.studentId] = {
        ...r,
        traits: JSON.parse(r.traits),
        comments: JSON.parse(r.comments)
      };
    } catch(e) { reportExtras[r.studentId] = r; }
  });

  Object.keys(attendanceStats).forEach(studentId => {
    const stats = attendanceStats[studentId];
    const total = stats.present + stats.absent + stats.late;
    const attended = stats.present + stats.late;
    if (total > 0) {
      const percentage = Math.round((attended / total) * 100);
      const autoAttendance = `${percentage}% (${attended}/${total})`;
      if (reportExtras[studentId]) {
        reportExtras[studentId].attendance = autoAttendance;
      } else {
        reportExtras[studentId] = { attendance: autoAttendance, traits: {}, comments: {} };
      }
    }
  });
  
  return jsonResponse({ scores, reportExtras }, 200, origin);
}

async function handleUpdateScoreAdmin(db: any, request: Request, studentId: string, session: any, origin: string): Promise<Response> {
  const body = await request.json() as any;
  const { session: reqSession, term: reqTerm, ...scoreData } = body;
  
  const school = await db.select().from(schema.schools).where(eq(schema.schools.id, session.schoolId!)).get();
  const qSession = reqSession || school?.session || '';
  const qTerm = reqTerm || school?.term || '';

  const existing = await db.select().from(schema.scoreSheets)
    .where(and(
      eq(schema.scoreSheets.studentId, studentId), 
      eq(schema.scoreSheets.schoolId, session.schoolId!),
      eq(schema.scoreSheets.session, qSession),
      eq(schema.scoreSheets.term, qTerm)
    )).get();
  
  if (existing) {
    await db.update(schema.scoreSheets).set({ data: JSON.stringify(scoreData), updatedAt: nowISO() }).where(eq(schema.scoreSheets.id, existing.id)).run();
  } else {
    await db.insert(schema.scoreSheets).values({
      id: generateId(),
      schoolId: session.schoolId!,
      studentId,
      session: qSession,
      term: qTerm,
      data: JSON.stringify(scoreData),
      createdAt: nowISO(),
      updatedAt: nowISO()
    }).run();
  }
  return jsonResponse({ success: true }, 200, origin);
}

async function handleGetReportExtras(db: any, studentId: string, session: any, origin: string): Promise<Response> {
  const extras = await db.select().from(schema.reportExtras).where(and(eq(schema.reportExtras.studentId, studentId), eq(schema.reportExtras.schoolId, session.schoolId!))).get();
  if (!extras) return jsonResponse({ extras: null }, 200, origin);
  
  const e = { ...extras };
  try { e.traits = JSON.parse(e.traits); } catch(err) { e.traits = {}; }
  try { e.comments = JSON.parse(e.comments); } catch(err) { e.comments = {}; }
  
  return jsonResponse({ extras: e }, 200, origin);
}

async function handleUpdateReportExtras(db: any, request: Request, studentId: string, session: any, origin: string): Promise<Response> {
  const body = await request.json() as any;
  const school = await db.select().from(schema.schools).where(eq(schema.schools.id, session.schoolId!)).get();
  const existing = await db.select().from(schema.reportExtras).where(and(eq(schema.reportExtras.studentId, studentId), eq(schema.reportExtras.schoolId, session.schoolId!))).get();
  
  const data = {
    attendance: body.attendance || "0",
    traits: JSON.stringify(body.traits || {}),
    comments: JSON.stringify(body.comments || {}),
    promotion: body.promotion || "",
    updatedAt: nowISO()
  };

  if (existing) {
    await db.update(schema.reportExtras).set(data).where(eq(schema.reportExtras.id, existing.id)).run();
  } else {
    await db.insert(schema.reportExtras).values({
      id: generateId(),
      schoolId: session.schoolId!,
      studentId,
      session: school?.session || "",
      term: school?.term || "",
      ...data,
      createdAt: nowISO()
    }).run();
  }
  return jsonResponse({ success: true }, 200, origin);
}

// ===== PORTAL HANDLERS =====

async function handlePortalMe(db: any, session: any, origin: string): Promise<Response> {
  const user = await db
    .select({
      id: schema.users.id,
      email: schema.users.email,
      role: schema.users.role,
      displayName: schema.users.displayName,
    })
    .from(schema.users)
    .where(eq(schema.users.id, session.userId))
    .get();

  if (!user) return errorResponse("User not found", 404, origin);

  const school = await db.select().from(schema.schools).where(eq(schema.schools.id, session.schoolId!)).get();

  const links = await db
    .select({
      studentId: schema.studentLinks.studentId,
    })
    .from(schema.studentLinks)
    .where(eq(schema.studentLinks.userId, session.userId))
    .all();

  const studentIds = links.map((l: any) => l.studentId);
  let students: any[] = [];
  if (studentIds.length > 0) {
    students = await db
      .select({
        id: schema.students.id,
        name: schema.students.name,
        admNo: schema.students.admissionNo,
        cls: schema.students.className,
      })
      .from(schema.students)
      .where(inArray(schema.students.id, studentIds))
      .all();
  }

  return jsonResponse({ user: { id: user.id, email: user.email, role: user.role, displayName: user.displayName, schoolId: school?.id }, school, students }, 200, origin);
}

async function handlePortalStudent(db: any, studentId: string, session: any, origin: string): Promise<Response> {
  if (!studentId) return errorResponse("studentId required", 400, origin);

  // SCHOOL role can view any student in their school; PARENT/STUDENT must have an explicit link
  if (session.role !== "SCHOOL") {
    const link = await db.select().from(schema.studentLinks)
      .where(and(eq(schema.studentLinks.studentId, studentId), eq(schema.studentLinks.userId, session.userId)))
      .get();
    if (!link) return errorResponse("Not authorized", 403, origin);
  }

  const student = await db
    .select()
    .from(schema.students)
    .where(and(eq(schema.students.id, studentId), eq(schema.students.schoolId, session.schoolId!)))
    .get();

  if (!student) return errorResponse("Student not found", 404, origin);

  return jsonResponse({ student }, 200, origin);
}
async function handleAdminAttendance(db: any, request: Request, session: any, origin: string): Promise<Response> {
  const url = new URL(request.url);
  const dateStr = url.searchParams.get("date") || new Date().toISOString().split('T')[0];

  try {
    const marksForDate = await db.select({
      className: schema.attendanceSessions.className,
      mark: schema.attendanceMarks.mark
    })
    .from(schema.attendanceMarks)
    .innerJoin(schema.attendanceSessions, eq(schema.attendanceMarks.attendanceSessionId, schema.attendanceSessions.id))
    .where(and(
      eq(schema.attendanceSessions.schoolId, session.schoolId!),
      eq(schema.attendanceSessions.sessionDate, dateStr)
    ))
    .all();

    const totalStudentsRes = await db.select({ id: schema.students.id, className: schema.students.className })
      .from(schema.students)
      .where(eq(schema.students.schoolId, session.schoolId!))
      .all();
    
    const totalStudents = totalStudentsRes.length;

    let present = 0;
    let absent = 0;
    let late = 0;
    const totalMarked = marksForDate.length;

    if (totalMarked > 0) {
      marksForDate.forEach((m: any) => {
        if (m.mark === "PRESENT") present++;
        else if (m.mark === "ABSENT") absent++;
        else if (m.mark === "LATE") late++;
      });
    }

    const stats = {
      present: totalMarked > 0 ? Math.round((present / totalMarked) * 100) : 100,
      absent: totalMarked > 0 ? Math.round((absent / totalMarked) * 100) : 0,
      late: totalMarked > 0 ? Math.round((late / totalMarked) * 100) : 0,
      total: totalStudents
    };

    const classBreakdownMap: Record<string, { name: string; present: number; absent: number; late: number; total: number }> = {};
    
    totalStudentsRes.forEach((student: any) => {
      const clsName = student.className || "Unassigned";
      if (!classBreakdownMap[clsName]) {
        classBreakdownMap[clsName] = { name: clsName, present: 0, absent: 0, late: 0, total: 0 };
      }
      classBreakdownMap[clsName].total++;
    });

    marksForDate.forEach((m: any) => {
      const clsName = m.className || "Unassigned";
      if (!classBreakdownMap[clsName]) {
        classBreakdownMap[clsName] = { name: clsName, present: 0, absent: 0, late: 0, total: 0 };
      }
      if (m.mark === "PRESENT") classBreakdownMap[clsName].present++;
      else if (m.mark === "ABSENT") classBreakdownMap[clsName].absent++;
      else if (m.mark === "LATE") classBreakdownMap[clsName].late++;
    });

    const classBreakdown = Object.values(classBreakdownMap).map((cls) => {
      const totalMarkedInClass = cls.present + cls.absent + cls.late;
      return {
        name: cls.name,
        p: totalMarkedInClass > 0 ? Math.round((cls.present / totalMarkedInClass) * 100) : 100,
        a: totalMarkedInClass > 0 ? Math.round((cls.absent / totalMarkedInClass) * 100) : 0,
        l: totalMarkedInClass > 0 ? Math.round((cls.late / totalMarkedInClass) * 100) : 0,
      };
    });

    return jsonResponse({ stats, classBreakdown }, 200, origin);
  } catch (err: any) {
    console.error("Admin Attendance Fetch Error:", err);
    return errorResponse(`Failed to calculate attendance: ${err.message}`, 500, origin);
  }
}

async function handlePortalAttendanceSummary(db: any, request: Request, session: any, origin: string): Promise<Response> {
  const url = new URL(request.url);
  const studentId = url.searchParams.get("studentId");
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");

  if (!studentId || !from || !to) return errorResponse("studentId, from, and to required", 400, origin);

  const marks = await db
    .select({
      mark: schema.attendanceMarks.mark,
    })
    .from(schema.attendanceMarks)
    .innerJoin(
      schema.attendanceSessions,
      eq(schema.attendanceMarks.attendanceSessionId, schema.attendanceSessions.id)
    )
    .where(
      and(
        eq(schema.attendanceMarks.studentId, studentId),
        gte(schema.attendanceSessions.sessionDate, from),
        lte(schema.attendanceSessions.sessionDate, to)
      )
    )
    .all();

  const present = marks.filter((m: any) => m.mark === "PRESENT").length;
  const absent = marks.filter((m: any) => m.mark === "ABSENT").length;
  const late = marks.filter((m: any) => m.mark === "LATE").length;
  const total = marks.length;
  const presentRate = total > 0 ? (present + late) / total : 0;

  return jsonResponse({
    summary: { present, absent, late, total, presentRate },
  }, 200, origin);
}

async function handlePortalAttendanceDays(db: any, request: Request, session: any, origin: string): Promise<Response> {
  const url = new URL(request.url);
  const studentId = url.searchParams.get("studentId");
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");

  if (!studentId || !from || !to) return errorResponse("studentId, from, and to required", 400, origin);

  const days = await db
    .select({
      date: schema.attendanceSessions.sessionDate,
      mark: schema.attendanceMarks.mark,
      note: schema.attendanceMarks.note,
    })
    .from(schema.attendanceMarks)
    .innerJoin(
      schema.attendanceSessions,
      eq(schema.attendanceMarks.attendanceSessionId, schema.attendanceSessions.id)
    )
    .where(
      and(
        eq(schema.attendanceMarks.studentId, studentId),
        gte(schema.attendanceSessions.sessionDate, from),
        lte(schema.attendanceSessions.sessionDate, to)
      )
    )
    .orderBy(desc(schema.attendanceSessions.sessionDate))
    .all();

  return jsonResponse({ days }, 200, origin);
}

async function handlePortalScores(db: any, studentId: string, session: any, origin: string): Promise<Response> {
  if (session.role !== "SCHOOL") {
    const link = await db.select().from(schema.studentLinks)
      .where(and(eq(schema.studentLinks.studentId, studentId), eq(schema.studentLinks.userId, session.userId)))
      .get();
    if (!link) return errorResponse("Not authorized", 403, origin);
  }
  const row = await db.select().from(schema.scoreSheets).where(and(eq(schema.scoreSheets.studentId, studentId), eq(schema.scoreSheets.schoolId, session.schoolId!))).get();
  const scores: Record<string, any> = {};
  if (row) {
    try { scores[studentId] = JSON.parse(row.data); } catch(e) { scores[studentId] = {}; }
  }
  return jsonResponse({ scores }, 200, origin);
}

// ===== AI HANDLERS =====

async function handleGetExams(db: any, session: any, origin: string): Promise<Response> {
  const allExams = await db.select().from(schema.exams).where(eq(schema.exams.schoolId, session.schoolId!)).orderBy(desc(schema.exams.createdAt)).all();
  return jsonResponse({ exams: allExams.map((e: any) => ({
    id: e.id,
    subject: e.subject,
    class_level: e.classLevel,
    term: e.term,
    session: e.session,
    exam_type: e.examType,
    question_type: e.questionType,
    source_mode: e.sourceMode,
    duration: e.duration,
    file_url: e.fileUrl,
    is_shared: e.isShared,
    created_at: e.createdAt
  })) }, 200, origin);
}

async function handleGenerateExam(db: any, request: Request, session: any, env: Env, origin: string): Promise<Response> {
  const body = await request.json() as any;
  const { subject, classLevel, curriculum, topic, questionCount, term, session: schoolSession, examType, questionType, sourceMode, documentText, sourceUrl, duration, isShared, fileUrl, mcqCount: reqMcqCount, theoryCount: reqTheoryCount, difficulty } = body;
  
  if (!subject || !classLevel) return errorResponse("Missing required fields: subject and classLevel", 400, origin);

  if (!env.AI && !env.OPENROUTER_API_KEY && !env.GEMINI_API_KEY && !env.ALIBABA_API_KEY) return errorResponse("No AI providers configured", 500, origin);

  // Determine the source context for AI
  let contextText = topic || '';
  
  if (sourceMode === 'curriculum') {
    const termLabel = term || '2nd Term';
    contextText = `Generate questions strictly based on the ${curriculum || 'NERDC Scheme'} of work for ${subject} in ${classLevel} for ${termLabel}. Check your knowledge base for the exact curriculum standards of the selected scheme in Nigeria.`;
  } else if (sourceMode === 'url' && sourceUrl) {
    try {
      const urlRes = await fetch(sourceUrl, {
        headers: { 'User-Agent': 'ReportSheet-ExamMaker/1.0' },
        signal: AbortSignal.timeout(10000)
      });
      let html = await urlRes.text();
      // Strip HTML tags
      html = html.replace(/<script[\s\S]*?<\/script>/gi, '')
                 .replace(/<style[\s\S]*?<\/style>/gi, '')
                 .replace(/<[^>]+>/g, ' ')
                 .replace(/\s+/g, ' ')
                 .trim();
      contextText = html.substring(0, 8000);
    } catch (urlErr: any) {
      return errorResponse('Failed to fetch URL: ' + urlErr.message, 400, origin);
    }
  } else if (sourceMode === 'document' && documentText) {
    contextText = documentText.substring(0, 8000);
  }

  if (!contextText) return errorResponse("No content provided. Select a curriculum, enter a topic, paste text, upload a document, or provide a URL.", 400, origin);

  const count = questionCount || 20;
  const qType = questionType || 'mcq';
  const termLabel = term || '2nd Term';
  const sessionLabel = schoolSession || new Date().getFullYear() + '/' + (new Date().getFullYear() + 1);
  const examTypeLabel = examType || 'Terminal Exam';
  const difficultyLabel = difficulty || 'Medium';

  let formatInstructions = '';
  if (qType === 'mcq') {
    formatInstructions = `Generate ${count} multiple choice questions. Each question must have exactly 4 options (A, B, C, D). Use this JSON structure:
[
  {
    "question": "Question text here?",
    "type": "mcq",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 0,
    "explanation": "Explanation of the correct answer."
  }
]`;
  } else if (qType === 'theory') {
    formatInstructions = `Generate ${count} theory/essay questions suitable for written examination. Use this JSON structure:
[
  {
    "question": "Question text here?",
    "type": "theory",
    "options": [],
    "correctAnswer": -1,
    "explanation": "Key points expected in the answer."
  }
]`;
  } else {
    const mcqCount = reqMcqCount ?? Math.round(count * 0.6);
    const theoryCount = reqTheoryCount ?? (count - mcqCount);
    formatInstructions = `Generate ${mcqCount} multiple choice questions followed by ${theoryCount} theory/essay questions. Use this JSON structure:
[
  {
    "question": "MCQ question here?",
    "type": "mcq",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 0,
    "explanation": "Explanation."
  },
  {
    "question": "Theory question here?",
    "type": "theory",
    "options": [],
    "correctAnswer": -1,
    "explanation": "Key points expected."
  }
]`;
  }

  const prompt = `You are an expert Nigerian secondary school examiner creating a ${examTypeLabel} for ${termLabel} (${sessionLabel} academic session).

Subject: ${subject}
Class Level: ${classLevel}
Target Difficulty: ${difficultyLabel}
Exam Content/Context:
---
${contextText}
---

${formatInstructions}

IMPORTANT RULES:
1. Questions must be relevant to Nigerian secondary school curriculum
2. Use clear, unambiguous language appropriate for ${classLevel} students
3. Output ONLY valid JSON array with no markdown, no extra text, no comments.
4. Questions should test understanding, not just memorisation
5. Ensure the overall difficulty strictly matches the selected level: ${difficultyLabel}
6. CRITICAL: Escape any internal double quotes inside string values using a backslash (e.g., \\") to avoid JSON parsing errors. Do not use unescaped double quotes inside your strings.
`;

  try {
    const aiResponse = await generateAIResponse(env, prompt, 16384);

    let questions: any;
    if (typeof aiResponse.response === 'object' && aiResponse.response !== null) {
      questions = aiResponse.response;
    } else {
      let jsonStr = typeof aiResponse.response === 'string' ? aiResponse.response : (aiResponse.response || '');
      const jsonMatch = jsonStr.match(/\[\s*\{[\s\S]*\}\s*\]/);
      if (jsonMatch) {
        jsonStr = jsonMatch[0];
      } else if (jsonStr.includes('```json')) {
        jsonStr = jsonStr.split('```json')[1].split('```')[0].trim();
      } else if (jsonStr.includes('```')) {
        jsonStr = jsonStr.split('```')[1].split('```')[0].trim();
      }
      
      try {
        questions = JSON.parse(jsonStr);
      } catch (e: any) {
        // Attempt basic truncation fix if AI stopped mid-generation
        try {
          const lastClosingBrace = jsonStr.lastIndexOf('}');
          if (lastClosingBrace !== -1) {
             const truncated = jsonStr.substring(0, lastClosingBrace + 1) + ']';
             questions = JSON.parse(truncated);
          } else {
             throw e;
          }
        } catch (innerE) {
          throw e; // Throw the original parse error if recovery fails
        }
      }
    }
    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error('AI returned invalid question format');
    }

    const id = `exam-${generateId()}`;
    
    await db.insert(schema.exams).values({
      id,
      schoolId: session.schoolId!,
      subject,
      classLevel,
      topic: sourceMode === 'curriculum' ? curriculum : (topic || contextText.substring(0, 500)),
      questions: JSON.stringify(questions),
      term: termLabel,
      session: sessionLabel,
      examType: examTypeLabel,
      questionType: qType,
      sourceMode: sourceMode || 'topic',
      duration: duration || '1 Hour',
      fileUrl: fileUrl || null,
      isShared: isShared ? 1 : 0,
      createdAt: nowISO(),
      updatedAt: nowISO()
    }).run();
 
    if (isShared) {
      await saveExamToR2(env, { id, subject, classLevel, questions, term: termLabel, session: sessionLabel, examType: examTypeLabel, questionType: qType, duration: duration || '1 Hour', file_url: fileUrl || null });
    }
    
    return jsonResponse({ id, questions, term: termLabel, session: sessionLabel, examType: examTypeLabel, questionType: qType, duration: duration || '1 Hour', is_shared: isShared ? 1 : 0, file_url: fileUrl || null }, 201, origin);
  } catch (error: any) {
    console.error('AI Generation Error:', error);
    return errorResponse('Failed to generate exam from AI: ' + error.message, 500, origin);
  }
}

async function handleGetExamDetail(db: any, examId: string, session: any, origin: string): Promise<Response> {
  const exam = await db.select().from(schema.exams).where(eq(schema.exams.id, examId)).get();
  if (!exam) return errorResponse("Exam not found", 404, origin);
  
  if (exam.isShared !== 1 && exam.schoolId !== session.schoolId) {
    return errorResponse("Unauthorized access to exam", 403, origin);
  }
  
  return jsonResponse({ exam: {
    id: exam.id,
    school_id: exam.schoolId,
    subject: exam.subject,
    class_level: exam.classLevel,
    questions: JSON.parse(exam.questions),
    created_at: exam.createdAt,
    topic: exam.topic,
    term: exam.term,
    session: exam.session,
    exam_type: exam.examType,
    question_type: exam.questionType,
    source_mode: exam.sourceMode,
    duration: exam.duration,
    is_shared: exam.isShared
  }}, 200, origin);
}

async function handleUpdateExam(db: any, request: Request, examId: string, session: any, env: any, origin: string): Promise<Response> {
  const { subject, classLevel, curriculum, topic, questions, term, session: schoolSession, examType, questionType, duration, isShared } = await request.json() as any;
  
  const existing = await db.select().from(schema.exams).where(and(eq(schema.exams.id, examId), eq(schema.exams.schoolId, session.schoolId!))).get();
  if (!existing) return errorResponse("Exam not found", 404, origin);
  
  const updatedTopic = curriculum || topic;

  await db.update(schema.exams).set({
    subject: subject || existing.subject,
    classLevel: classLevel || existing.classLevel,
    topic: updatedTopic !== undefined ? updatedTopic : existing.topic,
    questions: questions ? JSON.stringify(questions) : existing.questions,
    term: term !== undefined ? term : existing.term,
    session: schoolSession !== undefined ? schoolSession : existing.session,
    examType: examType !== undefined ? examType : existing.examType,
    questionType: questionType !== undefined ? questionType : existing.questionType,
    duration: duration !== undefined ? duration : existing.duration,
    isShared: isShared !== undefined ? (isShared ? 1 : 0) : existing.isShared,
    updatedAt: nowISO()
  }).where(eq(schema.exams.id, examId)).run();
 
  const finalIsShared = isShared !== undefined ? (isShared ? 1 : 0) : existing.isShared;
  if (finalIsShared === 1) {
    await saveExamToR2(env, {
      id: examId,
      subject: subject || existing.subject,
      classLevel: classLevel || existing.classLevel,
      questions: questions || JSON.parse(existing.questions),
      term: term !== undefined ? term : existing.term,
      session: schoolSession !== undefined ? schoolSession : existing.session,
      examType: examType !== undefined ? examType : existing.examType,
      duration: duration !== undefined ? duration : existing.duration
    });
  }
  
  return jsonResponse({ success: true }, 200, origin);
}

async function handleDeleteExam(db: any, examId: string, session: any, origin: string): Promise<Response> {
  const existing = await db.select().from(schema.exams).where(and(eq(schema.exams.id, examId), eq(schema.exams.schoolId, session.schoolId!))).get();
  if (!existing) return errorResponse("Exam not found", 404, origin);
  
  await db.delete(schema.exams).where(eq(schema.exams.id, examId)).run();
  
  return jsonResponse({ success: true }, 200, origin);
}

async function handleGenerateAiRemarks(db: any, request: Request, session: any, env: Env, origin: string): Promise<Response> {
  const { studentId, type } = await request.json() as any;
  if (!studentId) return errorResponse("studentId required", 400, origin);
  if (!env.AI && !env.OPENROUTER_API_KEY && !env.GEMINI_API_KEY && !env.ALIBABA_API_KEY) return errorResponse("No AI providers configured", 500, origin);

  const student = await db.select().from(schema.students).where(and(eq(schema.students.id, studentId), eq(schema.students.schoolId, session.schoolId!))).get();
  if (!student) return errorResponse("Student not found", 404, origin);

  const scoresRow = await db.select().from(schema.scoreSheets).where(and(eq(schema.scoreSheets.studentId, studentId), eq(schema.scoreSheets.schoolId, session.schoolId!))).get();
  const scores = scoresRow ? JSON.parse(scoresRow.data) : {};

  const subjects = Object.keys(scores);
  const scoreDetails = subjects.map(sub => {
    const s = scores[sub] || { ca1: 0, ca2: 0, exam: 0 };
    const total = (s.ca1 || 0) + (s.ca2 || 0) + (s.exam || 0);
    return `${sub}: ${total}%`;
  }).join(", ");

  const prompt = `Write a short, professional end-of-term report card remark for a student named ${student.name}.
The context is from the perspective of a ${type === "teacher" ? "Form Teacher" : "Principal"}.
Here are their scores for the term: ${scoreDetails || "No scores recorded yet"}.
Keep it to 2-3 sentences max. Be encouraging but honest based on the scores.`;

  try {
    const aiResponse = await generateAIResponse(env, prompt, 1000);
    
    return jsonResponse({ remark: aiResponse.response?.trim() || "Remark generated successfully." }, 200, origin);
  } catch (error: any) {
    console.error("AI Generation Error:", error);
    return errorResponse("Failed to generate remark: " + error.message, 500, origin);
  }
}
 
async function handleCreateCustomExam(db: any, request: Request, session: any, origin: string): Promise<Response> {
  try {
    const { subject, classLevel, curriculum, topic, questions, term, session: schoolSession, examType, questionType, duration, isShared } = await request.json() as any;
    
    if (!subject || !classLevel) return errorResponse("Subject and classLevel required", 400, origin);
 
    const id = `exam-${generateId()}`;
    await db.insert(schema.exams).values({
      id,
      schoolId: session.schoolId!,
      subject,
      classLevel,
      topic: curriculum || topic || "",
      questions: JSON.stringify(questions || []),
      term: term || "2nd Term",
      session: schoolSession || new Date().getFullYear() + "/" + (new Date().getFullYear() + 1),
      examType: examType || "Terminal Exam",
      questionType: questionType || "mcq",
      sourceMode: curriculum ? "curriculum" : "topic",
      duration: duration || "1 Hour",
      isShared: isShared ? 1 : 0,
      createdAt: nowISO(),
      updatedAt: nowISO()
    }).run();
 
    return jsonResponse({ id, success: true }, 201, origin);
  } catch (error: any) {
    return errorResponse("Failed to create custom exam: " + error.message, 500, origin);
  }
}
 
async function saveExamToR2(env: Env, exam: any) {
  if (!env.BUCKET) return;
  try {
    const level = exam.classLevel.startsWith('JSS') || exam.classLevel.startsWith('SS') ? 'Secondary' : 'Primary';
    const subLevel = exam.classLevel.startsWith('JSS') ? 'JSS' : exam.classLevel.startsWith('SS') ? 'SS' : '';
    const classFolder = `${exam.classLevel.replace(/\s+/g, '')}EXAM`;
    const path = `Exam Questions/${level}/${subLevel}/${exam.term}/${classFolder}/${exam.subject}.json`;
    
    await env.BUCKET.put(path, JSON.stringify(exam, null, 2), {
      httpMetadata: { contentType: 'application/json' }
    });
    console.log(`Saved exam to R2: ${path}`);
  } catch (err) {
    console.error(`Failed to save exam to R2:`, err);
  }
}
 
async function handleGetSharedExams(db: any, origin: string): Promise<Response> {
  try {
    const list = await db.select().from(schema.exams).where(eq(schema.exams.isShared, 1)).orderBy(desc(schema.exams.createdAt)).all();
    return jsonResponse({ exams: list.map((e: any) => ({
      id: e.id,
      subject: e.subject,
      class_level: e.classLevel,
      term: e.term,
      session: e.session,
      exam_type: e.examType,
      question_type: e.questionType,
      source_mode: e.sourceMode,
      duration: e.duration,
      file_url: e.fileUrl,
      is_shared: e.isShared,
      created_at: e.createdAt
    })) }, 200, origin);
  } catch (error: any) {
    return errorResponse("Failed to fetch shared exams: " + error.message, 500, origin);
  }
}

async function handleBulkImportDocumentExam(db: any, request: Request, session: any, env: Env, origin: string): Promise<Response> {
  try {
    const body = await request.json() as any;
    const { subject, classLevel, term, session: schoolSession, examType, isShared, fileUrl } = body;
    
    if (!subject || !classLevel || !fileUrl) {
      return errorResponse("Missing required fields: subject, classLevel, or fileUrl", 400, origin);
    }
    
    const id = generateId();
    const sessionLabel = schoolSession || new Date().getFullYear() + '/' + (new Date().getFullYear() + 1);
    
    await db.insert(schema.exams).values({
      id,
      schoolId: session.schoolId!,
      subject,
      classLevel,
      topic: 'Bulk Imported Exam Document',
      questions: '[]',
      term: term || '1st Term',
      session: sessionLabel,
      examType: examType || 'Terminal Exam',
      questionType: 'document',
      sourceMode: 'document',
      duration: '1 Hour',
      fileUrl: fileUrl,
      isShared: isShared ? 1 : 0,
      createdAt: nowISO(),
      updatedAt: nowISO()
    }).run();
    
    return jsonResponse({ id, success: true }, 201, origin);
  } catch (err: any) {
    console.error('Bulk Import Error:', err);
    return errorResponse('Failed to import document exam: ' + err.message, 500, origin);
  }
}

async function handleImportExam(db: any, request: Request, session: any, env: Env, origin: string): Promise<Response> {
  const body = await request.json() as any;
  const { subject, classLevel, term, session: schoolSession, examType, duration, textContent, fileUrl } = body;
 
  if (!subject || !classLevel || !textContent) {
    return errorResponse("Missing required fields: subject, classLevel, and textContent", 400, origin);
  }
  if (!env.AI && !env.OPENROUTER_API_KEY && !env.GEMINI_API_KEY && !env.ALIBABA_API_KEY) return errorResponse("No AI providers configured", 500, origin);
 
  const prompt = `You are an expert exam parser. Convert the following raw exam paper text into a structured JSON array of questions.
Each question should be classified as either 'mcq' (multiple choice) or 'theory' (essay/written).
For 'mcq' questions, provide exactly 4 options and the 0-indexed correctAnswer.
For 'theory' questions, set options to an empty array and correctAnswer to -1.
 
Use this JSON structure:
[
  {
    "question": "Question text?",
    "type": "mcq",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 0,
    "explanation": "Brief explanation of the answer."
  }
]
 
Exam Paper Text:
---
${textContent}
---
 
Output ONLY the raw JSON array with no markdown, no extra text, and no explanations outside of the JSON.`;
 
  try {
    const aiResponse = await generateAIResponse(env, prompt, 4096);
 
    let questions: any;
    if (typeof aiResponse.response === 'object' && aiResponse.response !== null) {
      questions = aiResponse.response;
    } else {
      let jsonStr = typeof aiResponse.response === 'string' ? aiResponse.response : (aiResponse.response || '');
      const jsonMatch = jsonStr.match(/\[\s*\{[\s\S]*\}\s*\]/);
      if (jsonMatch) {
        jsonStr = jsonMatch[0];
      } else if (jsonStr.includes('```json')) {
        jsonStr = jsonStr.split('```json')[1].split('```')[0].trim();
      } else if (jsonStr.includes('```')) {
        jsonStr = jsonStr.split('```')[1].split('```')[0].trim();
      }
      questions = JSON.parse(jsonStr);
    }
    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error("AI returned invalid question format");
    }
 
    const id = `exam-${generateId()}`;
    await db.insert(schema.exams).values({
      id,
      schoolId: session.schoolId!,
      subject,
      classLevel,
      topic: "Imported Exam",
      questions: JSON.stringify(questions),
      term: term || "2nd Term",
      session: schoolSession || new Date().getFullYear() + "/" + (new Date().getFullYear() + 1),
      examType: examType || "Terminal Exam",
      questionType: questions.every((q: any) => q.type === 'mcq') ? 'mcq' : questions.every((q: any) => q.type === 'theory') ? 'theory' : 'mixed',
      sourceMode: "document",
      duration: duration || "1 Hour",
      fileUrl: fileUrl || null,
      isShared: 1,
      createdAt: nowISO(),
      updatedAt: nowISO()
    }).run();
 
    await saveExamToR2(env, {
      id,
      subject,
      classLevel,
      questions,
      term: term || "2nd Term",
      session: schoolSession || new Date().getFullYear() + "/" + (new Date().getFullYear() + 1),
      examType: examType || "Terminal Exam",
      duration: duration || "1 Hour"
    });
 
    return jsonResponse({ id, questions }, 201, origin);
  } catch (error: any) {
    console.error("AI Import Error:", error);
    return errorResponse("Failed to parse and import exam: " + error.message, 500, origin);
  }
}
 
// ===== SYSTEM SETTINGS HANDLERS =====

async function handleAdminSettings(db: any, origin: string): Promise<Response> {
  const settings = await db.select().from(schema.systemSettings).all();
  const map: Record<string, string> = {};
  settings.forEach((s: any) => { map[s.k] = s.v; });
  return jsonResponse({ settings: map }, 200, origin);
}

async function handleSaveAdminSettings(db: any, request: Request, origin: string): Promise<Response> {
  const body = await request.json() as any;
  for (const k of Object.keys(body)) {
    await db.insert(schema.systemSettings).values({
      k, v: String(body[k]), updatedAt: nowISO()
    }).onConflictDoUpdate({
      target: schema.systemSettings.k,
      set: { v: String(body[k]), updatedAt: nowISO() }
    }).run();
  }
  return jsonResponse({ success: true }, 200, origin);
}

async function handleAdminMaintenance(db: any, origin: string): Promise<Response> {
  const row = await db.select().from(schema.systemSettings).where(eq(schema.systemSettings.k, 'maintenance_mode')).get();
  const data = row ? JSON.parse(row.v) : { enabled: false, message: '', allowedIps: [] };
  return jsonResponse(data, 200, origin);
}

async function handleSaveAdminMaintenance(db: any, request: Request, origin: string): Promise<Response> {
  const body = await request.json();
  await db.insert(schema.systemSettings).values({
    k: 'maintenance_mode', v: JSON.stringify(body), updatedAt: nowISO()
  }).onConflictDoUpdate({
    target: schema.systemSettings.k,
    set: { v: JSON.stringify(body), updatedAt: nowISO() }
  }).run();
  return jsonResponse({ success: true }, 200, origin);
}

async function handleAdminUsers(db: any, origin: string): Promise<Response> {
  const users = await db.select({
    id: schema.users.id,
    email: schema.users.email,
    role: schema.users.role,
    status: schema.users.status,
    lastLoginAt: schema.users.lastLoginAt,
    totpEnabled: schema.users.totpEnabled
  }).from(schema.users).limit(200).all();
  return jsonResponse({ users }, 200, origin);
}

async function handleGetPublicConfig(db: any, origin: string): Promise<Response> {
  const settings = await db.select().from(schema.systemSettings).where(sql`k LIKE 'price_%' OR k LIKE 'support_%'`).all();
  const map: Record<string, string> = {};
  settings.forEach((s: any) => { map[s.k] = s.v; });
  
  return jsonResponse({
    pricing: {
      starter: map['price_starter'] || '15000',
      lifetime: map['price_lifetime'] || '30000',
      pro: map['price_pro'] || '35000',
    },
    support: {
      whatsapp: map['support_whatsapp'] || '08037000456',
      email: map['support_email'] || 'abbeydmarketer@gmail.com',
    }
  }, 200, origin);
}

// ===== ANNOUNCEMENT HANDLERS (DEDICATED TABLE) =====

async function handleGetPortalAnnouncements(db: any, role: string, origin: string): Promise<Response> {
  const list = await db
    .select()
    .from(schema.announcements)
    .where(
      and(
        eq(schema.announcements.status, "ACTIVE"),
        sql`${schema.announcements.targetRole} IN (${role}, 'ALL')`
      )
    )
    .orderBy(desc(schema.announcements.createdAt))
    .limit(10)
    .all();

  return jsonResponse({ announcements: list }, 200, origin);
}

async function handleAdminAnnouncements(db: any, origin: string): Promise<Response> {
  const list = await db.select().from(schema.announcements).orderBy(desc(schema.announcements.createdAt)).all();
  return jsonResponse({ announcements: list }, 200, origin);
}

async function handleCreateAnnouncement(db: any, request: Request, session: any, origin: string): Promise<Response> {
  const { title, content, targetRole, priority } = (await request.json()) as any;
  if (!title || !content) return errorResponse("Title and content required", 400, origin);

  const id = generateId();
  const now = nowISO();
  await db
    .insert(schema.announcements)
    .values({
      id,
      authorUserId: session.userId,
      title,
      content,
      targetRole: targetRole || "SCHOOL",
      priority: priority || "NORMAL",
      createdAt: now,
      updatedAt: now,
    })
    .run();

  return jsonResponse({ success: true, id }, 201, origin);
}

async function handleDeleteAnnouncement(db: any, id: string, origin: string): Promise<Response> {
  await db.delete(schema.announcements).where(eq(schema.announcements.id, id)).run();
  return jsonResponse({ success: true }, 200, origin);
}

// ===== BULK IMPORT & AI COMMAND =====

async function handleBulkImportStudents(db: any, request: Request, session: any, origin: string): Promise<Response> {
  const { students } = await request.json() as any;
  if (!Array.isArray(students) || students.length === 0) return errorResponse("Invalid students array", 400, origin);

  const now = nowISO();
  const results = { success: 0, failed: 0, errors: [] as string[] };

  for (const s of students) {
    try {
      const cls = s.cls || s.className;
      const admNo = s.admNo || s.admissionNo;
      if (!s.name || !cls) {
        results.failed++;
        results.errors.push(`Missing name or class for student: ${JSON.stringify(s)}`);
        continue;
      }

      await db.insert(schema.students).values({
        id: generateId(),
        schoolId: session.schoolId!,
        name: s.name,
        className: cls,
        admissionNo: admNo || `ADM-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        gender: s.gender || null,
        createdAt: now,
        updatedAt: now
      }).run();
      results.success++;
    } catch (err: any) {
      results.failed++;
      results.errors.push(`Error inserting ${s.name}: ${err.message}`);
    }
  }

  return jsonResponse({ results }, 200, origin);
}

async function handleAdminAICommand(db: any, request: Request, session: any, env: Env, origin: string): Promise<Response> {
  const { command } = await request.json() as any;
  if (!command) return errorResponse("Command required", 400, origin);
  if (!env.AI && !env.OPENROUTER_API_KEY && !env.GEMINI_API_KEY && !env.ALIBABA_API_KEY) return errorResponse("No AI providers configured", 500, origin);

  const prompt = `You are a school management assistant for ReportSheet.
The user is a school admin and wants to perform an action or ask a question.
Current School ID: ${session.schoolId}

ReportSheet App Context:
- A school report-card and management system.
- Key features: Student Profiles & Management, Teacher Directory, Parent Portal, Scores & Broadsheet Entry (CA1, CA2, Exam scores), Report Card Generation (PDF exports), AI-assisted Report Card Remarks (Form Teacher & Principal remarks), and Billing/Subscription Plans (Basic, Premium, Elite).
- Side menu/navigation items: Dashboard, Students, Teachers, Parents, Scores, Reports, Billing, Settings.
- The AI Command Center (this chat) allows admins/teachers to run quick commands:
  * "Record X% in [Subject] for [Student]" (e.g. "Record 80% in English for Adamu")
  * "Search student [Name]" (e.g. "Search student Sarah")
  * "Generate comments for [Class]" (e.g. "Generate comments for JSS 1")
  * "Generate report for [Class]" (e.g. "Generate report for JSS 1")
  * Ask general questions about the app's features, setup, billing, and configurations.

Available Intents/Tools:
1. record_score(student_name, subject, score): Update a student's score.
2. search_student(query): Find students by name or admission number.
3. generate_report(class_name): Generate report cards for a class.
4. generate_comments(class_name): Automatically generate report card comments for both Teacher and Principal based on student grades.
5. general_qa(query): User is asking a question about the app, how to use it, its features, setup, pricing/billing, or general help. Provide a helpful, direct, and detailed answer in the "reply" field.

Analyze the user command: "${command}"

Output ONLY a JSON object with:
- "intent": the tool to use (record_score, search_student, generate_report, generate_comments, general_qa, or unknown)
- "params": an object with extracted parameters
- "reply": a friendly response acknowledging the intent (for tools) OR the direct, helpful answer to the user's question (for general_qa).

Examples:
1. "Generate comments for JSS 1" -> {"intent": "generate_comments", "params": {"class_name": "JSS 1"}, "reply": "I'll generate AI comments for JSS 1."}
2. "How do I add a new student?" -> {"intent": "general_qa", "params": {"query": "How do I add a new student?"}, "reply": "To add a new student, navigate to the **Students** page from the sidebar menu, click on the **Add Student** button, and fill in the details. You can also perform a bulk student import if you have many students."}
`;
  try {
    let result: any = null;
    try {
      const aiResponse = await generateAIResponse(env, prompt, 500);

      if (typeof aiResponse.response === 'object' && aiResponse.response !== null) {
        result = aiResponse.response;
      } else {
        let jsonStr = typeof aiResponse.response === 'string' ? aiResponse.response : (aiResponse.response || '');
        if (jsonStr.includes('```json')) {
          jsonStr = jsonStr.split('```json')[1].split('```')[0].trim();
        } else if (jsonStr.includes('```')) {
          jsonStr = jsonStr.split('```')[1].split('```')[0].trim();
        } else {
          const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
          if (jsonMatch) jsonStr = jsonMatch[0];
        }
        result = JSON.parse(jsonStr);
      }

      if (!result || !result.intent || result.intent === "unknown") {
        throw new Error("Invalid AI intent parsing");
      }
    } catch (aiErr: any) {
      console.error("AI execution failed, using fallback parser:", aiErr);
      const lower = command.toLowerCase();
      if (lower.includes("score") || lower.includes("record") || lower.includes("%")) {
        const scoreMatch = lower.match(/(\d+)%/);
        const score = scoreMatch ? parseInt(scoreMatch[1]) : 50;
        let student_name = "Adamu";
        let subject = "English";
        
        const subjects = ["math", "english", "science", "biology", "chemistry", "physics", "history", "geography"];
        for (const sub of subjects) {
          if (lower.includes(sub)) {
            subject = sub.charAt(0).toUpperCase() + sub.slice(1);
            break;
          }
        }
        
        const parts = command.split(/\s+/);
        const forIndices = parts.map((p: string, i: number) => p.toLowerCase() === "for" ? i : -1).filter((i: number) => i !== -1);
        if (forIndices.length > 0) {
          const lastForIndex = forIndices[forIndices.length - 1];
          if (lastForIndex < parts.length - 1) {
            student_name = parts.slice(lastForIndex + 1).join(" ").replace(/[.%?]/g, "").trim();
          }
        }
        
        result = {
          intent: "record_score",
          params: { student_name, subject, score },
          reply: `I'll record a score of ${score}% for ${subject} for student ${student_name}.`
        };
      } else if (lower.includes("search") || lower.includes("find") || lower.includes("student")) {
        let query = command.replace(/(search|find|student|students|for)/gi, "").trim();
        result = {
          intent: "search_student",
          params: { query },
          reply: `Searching for student matching "${query}"...`
        };
      } else if (lower.includes("comment") || lower.includes("comments") || lower.includes("opinion") || lower.includes("remark")) {
        let class_name = "JSS 1A";
        const classMatch = command.match(/(jss\s*\d+\w*|sss\s*\d+\w*)/i);
        if (classMatch) {
          class_name = classMatch[0].toUpperCase();
        }
        result = {
          intent: "generate_comments",
          params: { class_name },
          reply: `Generating AI comments for ${class_name}...`
        };
      } else if (lower.includes("report") || lower.includes("generate") || lower.includes("card")) {
        let class_name = "JSS 1A";
        const classMatch = command.match(/(jss\s*\d+\w*|sss\s*\d+\w*)/i);
        if (classMatch) {
          class_name = classMatch[0].toUpperCase();
        }
        result = {
          intent: "generate_report",
          params: { class_name },
          reply: `Generating reports for ${class_name}...`
        };
      } else {
        result = {
          intent: "unknown",
          params: {},
          reply: "I couldn't understand that command. Try saying 'Record 55% in Mathematics for John', 'Generate comments for JSS 1', or 'Search student Adamu'."
        };
      }
    }

    // Handle intent logic
    if (result.intent === "record_score") {
      const { student_name, subject, score } = result.params;
      const student = await db.select().from(schema.students)
        .where(and(eq(schema.students.schoolId, session.schoolId!), like(schema.students.name, `%${student_name}%`)))
        .get();

      if (!student) {
        result.reply = `I couldn't find a student named "${student_name}".`;
      } else {
        const existing = await db.select().from(schema.scoreSheets)
          .where(and(eq(schema.scoreSheets.studentId, student.id), eq(schema.scoreSheets.schoolId, session.schoolId!)))
          .get();

        const scoreData = existing ? JSON.parse(existing.data) : {};
        scoreData[subject] = { ca1: 0, ca2: 0, exam: score };

        if (existing) {
          await db.update(schema.scoreSheets).set({ data: JSON.stringify(scoreData), updatedAt: nowISO() }).where(eq(schema.scoreSheets.id, existing.id)).run();
        } else {
          const aiSchool = await db.select().from(schema.schools).where(eq(schema.schools.id, session.schoolId!)).get();
          await db.insert(schema.scoreSheets).values({
            id: generateId(),
            schoolId: session.schoolId!,
            studentId: student.id,
            session: aiSchool?.session || "",
            term: aiSchool?.term || "",
            data: JSON.stringify(scoreData),
            createdAt: nowISO(),
            updatedAt: nowISO()
          }).run();
        }
        result.reply = `Successfully recorded ${score}% for ${subject} for ${student.name}.`;
      }
    } else if (result.intent === "search_student") {
      const { query } = result.params;
      const students = await db.select().from(schema.students)
        .where(and(eq(schema.students.schoolId, session.schoolId!), sql`name LIKE ${`%${query}%`} OR admission_no LIKE ${`%${query}%`}`))
        .limit(5)
        .all();
      
      if (students.length === 0) {
        result.reply = `No students found matching "${query}".`;
      } else {
        result.reply = `Found ${students.length} students: ${students.map((s: any) => `${s.name} (${s.className})`).join(", ")}.`;
      }
    } else if (result.intent === "generate_report") {
      result.reply = `I've queued the report generation for ${result.params.class_name}. You'll get a notification when they are ready.`;
    } else if (result.intent === "generate_comments") {
      const { class_name } = result.params;
      const classStudents = await db.select().from(schema.students)
        .where(and(eq(schema.students.schoolId, session.schoolId!), eq(schema.students.className, class_name)))
        .all();

      const scoresRows = await db.select().from(schema.scoreSheets)
        .where(eq(schema.scoreSheets.schoolId, session.schoolId!))
        .all();

      const aiSchoolForComments = await db.select().from(schema.schools).where(eq(schema.schools.id, session.schoolId!)).get();

      const commentResults = await Promise.all(classStudents.map(async (student: any) => {
        const studentScoreSheet = scoresRows.find((s: any) => s.studentId === student.id);
        const subjectsData = studentScoreSheet ? JSON.parse(studentScoreSheet.data) : {};

        let total = 0;
        let count = 0;
        Object.keys(subjectsData).forEach(sub => {
          const s = subjectsData[sub];
          total += (s.ca1 || 0) + (s.ca2 || 0) + (s.exam || 0);
          count++;
        });
        const average = count > 0 ? total / count : 0;

        const aiPrompt = `Generate a termly report card evaluation for a student.
Student Name: ${student.name}
Class: ${class_name}
Average Academic Performance: ${average.toFixed(1)}%
Number of Subjects Offered: ${count}

Based on this, generate exactly two concise sentences:
1. Teacher's comment: An evaluation of their academic attitude, behavioral traits, and subject performance.
2. Principal's comment: A strategic summary comment advising on focus areas, promotions, or termly encouragement.

Output ONLY a raw JSON object with keys:
{
  "teacher": "Generated teacher comment",
  "principal": "Generated principal comment"
}`;

        let comments = {
          teacher: `${student.name} is showing average performance, but can do better with more focus.`,
          principal: "A fair result. Go through more practice assignments next term."
        };

        try {
          const aiResponse = await generateAIResponse(env, aiPrompt, 300);
          const jsonStr: string = aiResponse.response || '';
          const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
          if (jsonMatch) comments = JSON.parse(jsonMatch[0]);
        } catch (e) {
          console.error("Failed to generate AI comments for student", student.name, e);
        }

        const existing = await db.select().from(schema.reportExtras)
          .where(and(eq(schema.reportExtras.studentId, student.id), eq(schema.reportExtras.schoolId, session.schoolId!)))
          .get();

        const data = {
          attendance: existing ? existing.attendance : "0",
          traits: existing ? existing.traits : JSON.stringify({}),
          comments: JSON.stringify(comments),
          promotion: existing ? existing.promotion : "",
          updatedAt: nowISO()
        };

        if (existing) {
          await db.update(schema.reportExtras).set(data).where(eq(schema.reportExtras.id, existing.id)).run();
        } else {
          await db.insert(schema.reportExtras).values({
            id: generateId(),
            schoolId: session.schoolId!,
            studentId: student.id,
            session: aiSchoolForComments?.session || "",
            term: aiSchoolForComments?.term || "",
            ...data,
            createdAt: nowISO()
          }).run();
        }
        return true;
      }));

      const successCount = commentResults.filter(Boolean).length;

      result.reply = `Successfully generated AI report card comments for ${successCount} students in ${class_name}. You can review and manually override them under the Reports Broadsheet.`;
    }

    return jsonResponse(result, 200, origin);
  } catch (err: any) {
    console.error("AI Command Error:", err);
    return errorResponse(`Failed to process AI command: ${err.message}`, 500, origin);
  }
}

async function handleSchoolBillingCheckout(db: any, request: Request, session: any, origin: string): Promise<Response> {
  const { plan, provider } = await request.json() as any;
  if (!plan) return errorResponse("Plan is required", 400, origin);
  
  const paymentProvider = provider === "PAYVESSEL" ? "PAYVESSEL" : "PAYSTACK";

  let amountKobo = 0;
  if (plan.toUpperCase() === "PER_TERM") amountKobo = 500000;
  else if (plan.toUpperCase() === "PER_YEAR") amountKobo = 1500000;
  else if (plan.toUpperCase() === "LIFETIME") amountKobo = 3000000;
  else if (plan.toUpperCase() === "PREMIUM") amountKobo = 5000000;
  else if (plan.toUpperCase() === "ELITE") amountKobo = 10000000;
  
  const school = await db.select().from(schema.schools).where(eq(schema.schools.id, session.schoolId)).get();
  if (!school) return errorResponse("School not found", 404, origin);
  
  const user = await db.select().from(schema.users).where(eq(schema.users.id, school.ownerId)).get();
  if (!user) return errorResponse("School owner not found", 404, origin);
  
  const reference = `ref_${generateId()}`;
  
  await db.insert(schema.payments).values({
    id: generateId(),
    schoolId: school.id,
    provider: paymentProvider,
    status: "PENDING",
    amountKobo,
    currency: "NGN",
    reference,
    metadata: JSON.stringify({ plan: plan.toUpperCase(), schoolId: school.id }),
    createdAt: nowISO(),
    updatedAt: nowISO()
  }).run();
  
  return jsonResponse({
    reference,
    amountKobo,
    email: user.email,
    phone: user.phone || school.contact || "",
    schoolName: school.name
  }, 200, origin);
}

async function handleSchoolBillingVerify(db: any, request: Request, session: any, env: Env, origin: string): Promise<Response> {
  const { reference } = await request.json() as any;
  if (!reference) return errorResponse("Reference is required", 400, origin);
  
  const payment = await db.select().from(schema.payments).where(eq(schema.payments.reference, reference)).get();
  if (!payment) return errorResponse("Payment record not found", 404, origin);
  
  if (payment.status === "SUCCESS") {
    return jsonResponse({ success: true, message: "Payment already verified", plan: JSON.parse(payment.metadata).plan }, 200, origin);
  }
  
  let isVerified = false;
  let verifiedAmount = 0;
  
  if (payment.provider === "PAYVESSEL") {
    const payvesselKey = env.PAYVESSEL_API_KEY || "sk_test_mockkey123456789";
    const payvesselSecret = env.PAYVESSEL_API_SECRET || "sk_test_mocksecret123456789";

    if (payvesselKey && !payvesselKey.startsWith("sk_test_mock")) {
      try {
        const res = await fetch(`https://api.payvessel.com/transaction/verify/${reference}`, {
          headers: {
            "api-key": payvesselKey,
            "api-secret": payvesselSecret,
            "Content-Type": "application/json"
          }
        });
        const data = await res.json() as any;
        if (data?.status === true && data?.transaction?.status === "success") {
          isVerified = true;
          // Payvessel amount is likely in Naira, so times 100 for kobo comparison
          verifiedAmount = Number(data?.transaction?.amount) * 100;
        } else {
          console.log("Payvessel verify response:", data);
        }
      } catch (err) {
        console.error("Payvessel verification error:", err);
      }
    } else {
      isVerified = true;
      verifiedAmount = payment.amountKobo;
    }
  } else {
    // Default to Paystack
    const paystackSecret = env.PAYSTACK_SECRET_KEY || "sk_test_mockkey123456789";
    
    if (paystackSecret && !paystackSecret.startsWith("sk_test_mock")) {
      try {
        const res = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
          headers: {
            Authorization: `Bearer ${paystackSecret}`
          }
        });
        const data = await res.json() as any;
        if (data?.status && data?.data?.status === "success") {
          isVerified = true;
          verifiedAmount = data.data.amount;
        }
      } catch (err) {
        console.error("Paystack verification error:", err);
      }
    } else {
      isVerified = true;
      verifiedAmount = payment.amountKobo;
    }
  }
  
  if (!isVerified) {
    return errorResponse("Payment could not be verified.", 400, origin);
  }
  
  if (verifiedAmount !== payment.amountKobo) {
    return errorResponse("Payment amount mismatch", 400, origin);
  }
  
  const metadata = JSON.parse(payment.metadata);
  const plan = metadata.plan;
  
  await db.update(schema.payments).set({
    status: "SUCCESS",
    updatedAt: nowISO()
  }).where(eq(schema.payments.id, payment.id)).run();
  
  await db.update(schema.schools).set({
    plan: plan,
    trialEndsAt: null, // Clear trial limits
    updatedAt: nowISO()
  }).where(eq(schema.schools.id, payment.schoolId)).run();
  
  try {
    const school = await db.select().from(schema.schools).where(eq(schema.schools.id, payment.schoolId)).get();
    if (school) {
      const owner = await db.select().from(schema.users).where(eq(schema.users.id, school.ownerId)).get();
      if (owner) {
        const mailer = new EmailService(env);
        await mailer.send({
          to: owner.email,
          subject: `Subscription Activated - ${school.name}`,
          html: EmailService.getPaymentSuccessTemplate(school.name, plan, (payment.amountKobo / 100).toLocaleString('en-NG', { style: 'currency', currency: 'NGN' }), reference)
        });
      }
    }
  } catch (err) {
    console.error("Success email sending failed:", err);
  }
  
  return jsonResponse({ success: true, plan }, 200, origin);
}
