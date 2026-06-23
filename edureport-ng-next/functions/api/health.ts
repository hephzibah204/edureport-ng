import { drizzle } from 'drizzle-orm/d1';
import { users, schools } from '../../src/db/schema';
import { eq } from 'drizzle-orm';

export interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const db = drizzle(context.env.DB);
    
    // Simple query to verify D1 connection is working
    const result = await db.select({ count: users.id }).from(users).limit(1);
    
    return new Response(JSON.stringify({ 
      status: "healthy",
      database: "connected",
      message: "Conductor AI / ReportSheet API is online" 
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ 
      status: "unhealthy", 
      error: error.message 
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500
    });
  }
};
