function safeJsonParse(raw, fallback) {
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function getConfig() {
  const cfg = window.ReportSheet_CONFIG || {};
  return {
    apiBaseUrl: cfg.apiBaseUrl || "http://127.0.0.1:3010",
    demoMode: Boolean(cfg.demoMode)
  };
}

async function apiFetch(path, opts = {}) {
  const { apiBaseUrl } = getConfig();
  const res = await fetch(apiBaseUrl.replace(/\/$/, "") + path, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
    ...opts
  });
  if (res.status === 204) return null;
  const text = await res.text();
  const data = safeJsonParse(text, null);
  if (!res.ok) {
    const msg = data?.error?.message || "Request failed";
    throw new Error(msg);
  }
  return data;
}

const DB = {
  getSession() {
    return safeJsonParse(localStorage.getItem("edu_session") || "null", null);
  },
  setSession(session) {
    localStorage.setItem("edu_session", JSON.stringify(session));
  },
  clearSession() {
    localStorage.removeItem("edu_session");
  },

  getSchoolData(userId) {
    return safeJsonParse(localStorage.getItem(`edu_school_${userId}`) || "null", null);
  },
  saveSchoolData(userId, data) {
    localStorage.setItem(`edu_school_${userId}`, JSON.stringify(data));
  },

  getStudents(userId) {
    return safeJsonParse(localStorage.getItem(`edu_students_${userId}`) || "[]", []);
  },
  saveStudents(userId, arr) {
    localStorage.setItem(`edu_students_${userId}`, JSON.stringify(arr));
  },

  getScores(userId) {
    return safeJsonParse(localStorage.getItem(`edu_scores_${userId}`) || "{}", {});
  },
  saveScores(userId, obj) {
    localStorage.setItem(`edu_scores_${userId}`, JSON.stringify(obj));
  }
};

const Auth = {
  async register({ schoolName, email, password, plan }) {
    const { demoMode } = getConfig();
    if (demoMode) throw new Error("Demo mode is disabled in production builds.");
    const schoolSlug = Auth.getSchoolSlugFromUrl();
    const out = await apiFetch("/auth/register", { method: "POST", body: JSON.stringify({ schoolName, email, password, plan, schoolSlug }) });
    if (!out || !out.user) throw new Error("Registration failed: Invalid server response.");
    DB.setSession({ 
      ...out.user, 
      schoolName: out.school?.name, 
      plan: out.school?.plan, 
      impersonationActive: false, 
      impersonationSchoolId: null, 
      effectiveUserId: out.user?.id, 
      effectiveRole: out.user?.role 
    });
    if (out.school) {
      const current = DB.getSchoolData(out.user.id);
      if (!current) {
        DB.saveSchoolData(out.user.id, {
          name: out.school.name,
          abbr: out.school.abbr,
          address: "",
          contact: "",
          motto: "Excellence Through Knowledge",
          principal: "",
          session: "2024/2025",
          term: "First Term",
          nextTerm: "",
          ca1Max: 10,
          ca2Max: 10,
          examMax: 80,
          subjects: ["Mathematics", "English Language", "Basic Science", "Social Studies", "Business Studies", "Civic Education", "Agricultural Science", "Physical Education"],
          grades: [
            { min: 75, max: 100, grade: "A", remark: "Distinction", color: "#155724" },
            { min: 65, max: 74, grade: "B", remark: "Credit", color: "#0c5460" },
            { min: 50, max: 64, grade: "C", remark: "Merit", color: "#856404" },
            { min: 40, max: 49, grade: "D", remark: "Pass", color: "#884510" },
            { min: 0, max: 39, grade: "F", remark: "Fail", color: "#721c24" }
          ]
        });
      }
    }
    return out;
  },

  async login({ email, password, totp }) {
    const { demoMode } = getConfig();
    if (demoMode) throw new Error("Demo mode is disabled in production builds.");
    const schoolSlug = Auth.getSchoolSlugFromUrl();
    const out = await apiFetch("/auth/login", { method: "POST", body: JSON.stringify({ email, password, totp, schoolSlug }) });
    if (!out || !out.user) throw new Error("Login failed: Invalid server response.");
    DB.setSession({ 
      ...out.user, 
      schoolName: out.school?.name, 
      plan: out.school?.plan, 
      impersonationActive: false, 
      impersonationSchoolId: null, 
      effectiveUserId: out.user?.id, 
      effectiveRole: out.user?.role 
    });
    return out;
  },

  getSchoolSlugFromUrl() {
    const hostname = window.location.hostname;
    // Support subdomain.edureport.ng
    if (hostname.includes(".edureport.ng")) {
      return hostname.split(".")[0];
    }
    // Support localhost:8080/school-slug/login.html
    const path = window.location.pathname;
    const parts = path.split("/").filter(Boolean);
    if (parts.length > 0 && !["index", "login", "register", "admin", "portal", "teacher"].includes(parts[0])) {
      return parts[0];
    }
    return "";
  },

  async logout(redirectPath) {
    try {
      await apiFetch("/auth/logout", { method: "POST" });
    } catch {
    }
    DB.clearSession();
    window.location.href = redirectPath || "login";
  },

  getSession() {
    return DB.getSession();
  },

  requireAuth(role, opts) {
    const session = DB.getSession();
    if (!session) {
      window.location.href = (opts && opts.loginPath) ? opts.loginPath : "login";
      return null;
    }
    apiFetch("/me", { method: "GET" })
      .then((out) => {
        const serverRole = out?.user?.role;
        if (!serverRole) throw new Error("Invalid session");
        if (session.role !== serverRole) {
          DB.clearSession();
          window.location.href = "login";
          return;
        }
        const impersonationActive = Boolean(out?.impersonation?.active);
        const impersonationSchoolId = out?.impersonation?.schoolId || null;
        const effectiveUserId = out?.effectiveUser?.id || out?.user?.id || null;
        const effectiveRole = out?.effectiveUser?.role || out?.user?.role || null;
        DB.setSession({ ...session, role: out.user.role, email: out.user.email, plan: out.school?.plan, schoolName: out.school?.name, impersonationActive, impersonationSchoolId, effectiveUserId, effectiveRole });
      })
      .catch(() => {
        DB.clearSession();
        window.location.href = (opts && opts.loginPath) ? opts.loginPath : "login.html";
      });
    const effectiveRole = session.effectiveRole || session.role;
    if (role === "admin" && session.role !== "ADMIN" && session.role !== "STAFF") {
      if (effectiveRole === 'TEACHER') window.location.href = 'teacher';
      else if (effectiveRole === 'PARENT' || effectiveRole === 'STUDENT') window.location.href = 'portal';
      else window.location.href = "app";
      return null;
    }
    if (role === "school" && (session.role === "ADMIN" || session.role === "STAFF") && !session.impersonationActive) {
      window.location.href = "admin";
      return null;
    }
    if (role === "school" && effectiveRole !== "SCHOOL" && !((session.role === "ADMIN" || session.role === "STAFF") && session.impersonationActive)) {
      if (effectiveRole === 'TEACHER') window.location.href = 'teacher';
      else if (effectiveRole === 'PARENT' || effectiveRole === 'STUDENT') window.location.href = 'portal';
      else window.location.href = "login";
      return null;
    }
    if (role === 'teacher' && effectiveRole !== 'TEACHER') {
      if (effectiveRole === 'SCHOOL') window.location.href = 'app';
      else if (effectiveRole === 'PARENT' || effectiveRole === 'STUDENT') window.location.href = 'portal';
      else window.location.href = 'login';
      return null;
    }
    if (role === 'portal' && effectiveRole !== 'PARENT' && effectiveRole !== 'STUDENT') {
      if (effectiveRole === 'SCHOOL') window.location.href = 'app';
      else if (effectiveRole === 'TEACHER') window.location.href = 'teacher';
      else window.location.href = 'login';
      return null;
    }
    return session;
  }
};

// Toast helper
function showToast(msg, type = 'ok') {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.className = `show ${type}`;
  clearTimeout(t._to);
  t._to = setTimeout(() => t.classList.remove('show'), 3500);
}

// Grade helper
function getGrade(score, grades) {
  for (const g of grades) if (score >= g.min && score <= g.max) return g;
  return { grade: 'F', remark: 'Fail', color: '#721c24' };
}
