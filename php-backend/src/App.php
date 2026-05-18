<?php

final class App
{
    private array $allowedOrigins;
    private static bool $adminEnsured = false;
    private static bool $plansEnsured = false;
    private AttendanceService $attendance;
    private StudentService $students;
    private JobService $jobs;

    public function __construct()
    {
        $origins = Config::env('CORS_ORIGIN', 'http://127.0.0.1:3011,http://localhost:3011');
        $this->allowedOrigins = array_values(array_filter(array_map('trim', explode(',', $origins))));
        $pdo = Db::pdo();
        $this->attendance = new AttendanceService($pdo);
        $this->students = new StudentService($pdo);
        $this->jobs = new JobService($pdo);
    }

    public function run(): void
    {
        Auth::startSession();
        $this->applyCors();
        $this->handlePreflight();

        $method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
        $path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
        if (!is_string($path)) {
            $path = '/';
        }

        $forwarded = $_SERVER['HTTP_CF_CONNECTING_IP'] ?? $_SERVER['HTTP_X_FORWARDED_FOR'] ?? null;
        if (is_string($forwarded)) {
            $forwarded = trim(explode(',', $forwarded)[0]);
        }
        $ip = $forwarded ?? $_SERVER['REMOTE_ADDR'] ?? 'unknown';
        RateLimit::enforce($ip . ':' . $path, 600, 60);
        $this->enforceMaintenance($ip, $path);

        try {
            if ($method === 'GET' && $path === '/healthz') {
                Response::json(200, ['ok' => true]);
                return;
            }
            if ($method === 'GET' && $path === '/readyz') {
                try {
                    Db::pdo()->query('SELECT 1');
                    Response::json(200, ['ok' => true]);
                } catch (Throwable $e) {
                    Response::error(503, 'NOT_READY', 'Database unavailable');
                }
                return;
            }

            if ($method === 'GET' && preg_match('#^/public/reports/([^/]+)$#', $path, $m)) {
                $token = $m[1];
                $row = $this->getReportExportByToken($token);
                if (!$row) {
                    Response::html(404, '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Not Found</title></head><body style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;padding:20px;">Link expired or invalid.</body></html>');
                    return;
                }
                $file = strval($row['file_path']);
                if (!is_file($file)) {
                    Response::html(404, '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Not Found</title></head><body style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;padding:20px;">File missing.</body></html>');
                    return;
                }
                $bytes = file_get_contents($file);
                if ($bytes === false) {
                    Response::error(500, 'INTERNAL_ERROR', 'Unable to read file');
                    return;
                }
                Response::download(200, 'application/pdf', strval($row['filename']), $bytes);
                return;
            }

            if ($method === 'GET' && preg_match('#^/public/schools/([^/]+)$#', $path, $m)) {
                $slug = trim(strval($m[1] ?? ''));
                if ($slug === '') {
                    Response::error(400, 'VALIDATION_ERROR', 'Invalid slug');
                    return;
                }
                $school = $this->getSchoolBySlug($slug);
                if (!$school) {
                    Response::error(404, 'NOT_FOUND', 'Not found');
                    return;
                }
                Response::json(200, ['school' => $this->schoolPublicToApi($school)]);
                return;
            }

            if (($method === 'GET' || $method === 'HEAD') && preg_match('#^/s/([^/]+)$#', $path, $m)) {
                $slugRaw = trim(strval($m[1] ?? ''));
                if ($slugRaw === '') {
                    Response::error(404, 'NOT_FOUND', 'Not found');
                    return;
                }
                http_response_code(301);
                header('Location: /' . rawurlencode($slugRaw));
                return;
            }

            if (($method === 'GET' || $method === 'HEAD') && preg_match('#^/([^/]+)$#', $path, $m)) {
                $slugRaw = trim(strval($m[1] ?? ''));
                $reserved = ['healthz','readyz','admin','adminpanel','teacher','auth','school','students','scores','ai','public','me','logout','s','payments','jobs','reports','webhooks','report-extras','portal','teachers','report','register','login','index'];                
                if ($slugRaw !== '' && !str_contains($slugRaw, '.') && preg_match('/^[A-Za-z0-9][A-Za-z0-9-]{1,62}$/', $slugRaw) === 1 && !in_array(strtolower($slugRaw), $reserved, true)) {
                    $slug = htmlspecialchars($slugRaw, ENT_QUOTES);
                    $html = '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
                        . '<title>School</title>'
                        . '<meta name="description" content="School landing page">'
                        . '<style>body{margin:0;font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;background:#0B1220;color:#0F172A} .wrap{max-width:1100px;margin:0 auto;padding:28px} .card{background:#fff;border-radius:16px;padding:22px;border:1px solid rgba(0,0,0,.06)} .hdr{display:flex;align-items:center;justify-content:space-between;gap:14px;margin-bottom:18px} .brand{display:flex;align-items:center;gap:12px} .logo{width:44px;height:44px;border-radius:12px;background:#F7F8FA;object-fit:cover;border:1px solid rgba(0,0,0,.08)} .h1{font-size:22px;font-weight:800;margin:0} .muted{color:#475569;font-size:14px} .btn{display:inline-flex;align-items:center;justify-content:center;padding:10px 14px;border-radius:12px;border:1px solid rgba(0,0,0,.12);text-decoration:none;font-weight:700;font-size:14px} .btnP{background:#2563EB;color:#fff;border-color:#2563EB} .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:16px} .tile{background:#F7F8FA;border:1px solid rgba(0,0,0,.06);border-radius:14px;padding:14px} .t{font-weight:800;font-size:13px;margin:0 0 6px} .v{margin:0;font-size:14px;color:#0F172A} @media(max-width:900px){.grid{grid-template-columns:1fr}}</style>'
                        . '</head><body><div class="wrap"><div class="card"><div class="hdr"><div class="brand"><img id="logo" class="logo" alt=""><div><p id="name" class="h1">Loading…</p><p id="desc" class="muted"></p></div></div><a id="cta" class="btn btnP" href="/teacher/login?school=' . $slug . '">Teacher Sign In</a></div><div id="grid" class="grid"></div></div></div>'
                        . '<script>(async()=>{try{const r=await fetch("/public/schools/' . $slug . '",{credentials:"include"});const j=await r.json();if(!r.ok) throw new Error(j?.error?.message||"Not found");const s=j.school||{};document.title=(s.name||"School")+" | Home";document.getElementById("name").textContent=s.name||"School";document.getElementById("desc").textContent=s.publicDescription||"";const logo=document.getElementById("logo");if(s.logoUrl){logo.src=s.logoUrl;logo.style.background="#fff";}else{logo.style.display="none";}const tiles=[];if(s.address) tiles.push(["Address",s.address]);if(s.contact) tiles.push(["Contact",s.contact]);if(s.motto) tiles.push(["Motto",s.motto]);if(s.principal) tiles.push(["Principal",s.principal]);const g=document.getElementById("grid");g.innerHTML=tiles.map(x=>`<div class=\"tile\"><p class=\"t\">${x[0]}</p><p class=\"v\">${(x[1]||\"\").replaceAll(\"<\",\"&lt;\").replaceAll(\">\",\"&gt;\")}</p></div>`).join(\"\") || `<div class=\"tile\"><p class=\"t\">Info</p><p class=\"v\">No public information yet.</p></div>`;}catch(e){document.getElementById("name").textContent="School not found";document.getElementById("desc").textContent=e?.message||"";document.getElementById("cta").style.display="none";document.getElementById("grid").innerHTML="";}})();</script></body></html>';
                    Response::html(200, $html);
                    return;
                }
            }

            $this->ensureAdminOnce();
            $this->maybeAuthBearer($ip);

            if ($method === 'GET' && $path === '/admin/openapi.json') {
                Auth::requirePermission('docs.read');
                Response::json(200, $this->openApiSpec());
                return;
            }

            if ($method === 'GET' && $path === '/admin/docs') {
                Auth::requirePermission('docs.read');
                Response::html(200, $this->swaggerHtml());
                return;
            }

            if ($method === 'GET' && $path === '/teacher/login') {
                $schoolSlug = isset($_GET['school']) ? trim(strval($_GET['school'])) : '';
                $schoolSlugSafe = htmlspecialchars($schoolSlug, ENT_QUOTES);
                $back = $schoolSlug !== '' ? '/' . rawurlencode($schoolSlug) : '/';
                $desc = $schoolSlug !== '' ? 'Signing in for <b>' . $schoolSlugSafe . '</b>.' : 'Sign in to access your assigned classes.';
                $tpl = <<<'HTML'
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Teacher Sign In</title>
  <meta name="robots" content="noindex,nofollow">
  <style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0B1220;font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif} .card{width:min(460px,92vw);background:#fff;border-radius:18px;padding:22px;border:1px solid rgba(0,0,0,.06)} .h{margin:0 0 6px;font-size:18px;font-weight:900} .p{margin:0 0 18px;color:#475569;font-size:14px} .row{display:flex;flex-direction:column;gap:6px;margin-bottom:12px} label{font-size:12px;font-weight:800;color:#0F172A} input{padding:11px 12px;border-radius:12px;border:1px solid rgba(0,0,0,.14);font-size:14px;outline:none} input:focus{border-color:#2563EB;box-shadow:0 0 0 3px rgba(37,99,235,.14)} .btn{width:100%;padding:11px 12px;border-radius:12px;border:1px solid #2563EB;background:#2563EB;color:#fff;font-weight:900;font-size:14px;cursor:pointer} .btn:disabled{opacity:.7;cursor:not-allowed} .err{display:none;margin-top:10px;background:#FEF2F2;border:1px solid #FECACA;color:#991B1B;padding:10px;border-radius:12px;font-size:13px} .foot{margin-top:12px;display:flex;justify-content:space-between;gap:10px;font-size:13px} .a{color:#2563EB;text-decoration:none;font-weight:800}</style>
</head>
<body>
  <div class="card">
    <p class="h">Teacher Sign In</p>
    <p class="p">__DESC__</p>
    <div class="row"><label>Email</label><input id="email" type="email" autocomplete="username" placeholder="teacher@school.com"></div>
    <div class="row"><label>Password</label><input id="pw" type="password" autocomplete="current-password" placeholder="••••••••••••"></div>
    <button id="btn" class="btn">Sign In</button>
    <div id="err" class="err"></div>
    <div class="foot"><a class="a" href="__BACK__">Back</a><a class="a" href="/">Home</a></div>
  </div>
  <script>
  const btn = document.getElementById("btn")
  const err = document.getElementById("err")
  const show = (m) => {
    err.style.display = "block"
    err.textContent = m || "Request failed"
  }
  btn.addEventListener("click", async () => {
    err.style.display = "none"
    btn.disabled = true
    try {
      const email = document.getElementById("email").value.trim()
      const password = document.getElementById("pw").value
      const r = await fetch("/auth/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      })
      const j = await r.json()
      if (!r.ok) throw new Error(j?.error?.message || "Sign in failed")
      if (j?.user?.role !== "TEACHER") throw new Error("This account is not a teacher account.")
      window.location.href = "/teacher/classes"
    } catch (e) {
      show(e?.message || "Sign in failed")
    } finally {
      btn.disabled = false
    }
  })
  </script>
</body>
</html>
HTML;
                $html = str_replace(['__DESC__', '__BACK__'], [$desc, htmlspecialchars($back, ENT_QUOTES)], $tpl);
                Response::html(200, $html);
                return;
            }

            if ($method === 'GET' && $path === '/teacher/classes') {
                $html = <<<'HTML'
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Teacher Portal</title>
  <meta name="robots" content="noindex,nofollow">
  <style>body{margin:0;font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;background:#0B1220;color:#0F172A} .top{background:#0B1220;padding:18px 20px} .topin{max-width:1100px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:12px} .brand{color:#fff;font-weight:900;letter-spacing:-.02em} .sub{color:rgba(255,255,255,.68);font-size:13px;margin-top:3px} .btn{padding:9px 12px;border-radius:12px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.08);color:#fff;font-weight:900;cursor:pointer} .wrap{max-width:1100px;margin:0 auto;padding:18px 20px 28px} .card{background:#fff;border-radius:16px;padding:16px;border:1px solid rgba(0,0,0,.06)} .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px} .c{background:#F7F8FA;border:1px solid rgba(0,0,0,.06);border-radius:14px;padding:14px;cursor:pointer;transition:transform .15s} .c:hover{transform:translateY(-2px)} .ct{font-weight:900;margin:0 0 6px} .cm{margin:0;color:#475569;font-size:13px} .row{display:grid;grid-template-columns:1fr 1.2fr;gap:12px;margin-top:12px} .tbl{width:100%;border-collapse:separate;border-spacing:0 8px} .tr{background:#F7F8FA;border:1px solid rgba(0,0,0,.06)} .td{padding:10px 12px} .pill{display:inline-block;background:#E0F2FE;color:#075985;border:1px solid #BAE6FD;padding:3px 8px;border-radius:999px;font-size:12px;font-weight:900} .muted{color:#475569;font-size:13px} .inp{width:100%;padding:10px 12px;border-radius:12px;border:1px solid rgba(0,0,0,.14);font-size:14px;outline:none} .inp:focus{border-color:#2563EB;box-shadow:0 0 0 3px rgba(37,99,235,.14)} .save{padding:10px 12px;border-radius:12px;border:1px solid #2563EB;background:#2563EB;color:#fff;font-weight:900;cursor:pointer} .err{display:none;margin-top:10px;background:#FEF2F2;border:1px solid #FECACA;color:#991B1B;padding:10px;border-radius:12px;font-size:13px} @media(max-width:980px){.row{grid-template-columns:1fr}.grid{grid-template-columns:1fr}}</style>
</head>
<body>
  <div class="top">
    <div class="topin">
      <div>
        <div id="hdr" class="brand">Teacher Portal</div>
        <div id="sub" class="sub"></div>
      </div>
      <button id="logout" class="btn">Sign out</button>
    </div>
  </div>
  <div class="wrap">
    <div class="card">
      <div id="err" class="err"></div>
      <div class="row">
        <div>
          <p style="margin:0 0 10px;font-weight:900;">Assigned classes</p>
          <div id="classes" class="grid"></div>
          <p id="empty" class="muted" style="display:none;margin-top:10px;">No assigned classes.</p>
        </div>
        <div>
          <p style="margin:0 0 10px;font-weight:900;">Class workspace</p>
          <div id="workspace" class="muted">Select a class.</div>
        </div>
      </div>
    </div>
  </div>
  <script>
  const err = document.getElementById("err")
  const showErr = (m) => { err.style.display = "block"; err.textContent = m || "Error" }
  const clearErr = () => { err.style.display = "none"; err.textContent = "" }

  document.getElementById("logout").addEventListener("click", async () => {
    try { await fetch("/auth/logout", { method: "POST", credentials: "include" }) } catch {}
    window.location.href = "/teacher/login"
  })

  async function api(path, opts) {
    const r = await fetch(path, {
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      ...(opts || {})
    })
    const t = await r.text()
    let j = null
    try { j = JSON.parse(t) } catch {}
    if (!r.ok) throw new Error(j?.error?.message || "Request failed")
    return j
  }

  async function boot() {
    clearErr()
    const me = await api("/me")
    if (me?.effectiveUser?.role !== "TEACHER") { window.location.href = "/teacher/login"; return }
    document.getElementById("hdr").textContent = (me?.school?.name || "School") + " | Teacher Portal"
    document.getElementById("sub").textContent = me?.effectiveUser?.email || ""
    const out = await api("/teacher/api/classes")
    const list = Array.isArray(out?.classes) ? out.classes : []
    const cont = document.getElementById("classes")
    if (!list.length) {
      document.getElementById("empty").style.display = "block"
      cont.innerHTML = ""
      return
    }
    cont.innerHTML = list.map(c => {
      const name = (c?.name || "")
      const safe = name.replaceAll("\"", "&quot;")
      return `<div class="c" data-name="${safe}"><p class="ct">${name}</p><p class="cm">Assigned</p></div>`
    }).join("")
    cont.querySelectorAll(".c").forEach(el => el.addEventListener("click", () => openClass(el.getAttribute("data-name"))))
  }

  async function openClass(name) {
    clearErr()
    const ws = document.getElementById("workspace")
    ws.innerHTML = `<span class="pill">${name}</span><div style="height:10px"></div><div class="muted">Loading students…</div>`
    const out = await api("/teacher/api/students?className=" + encodeURIComponent(name))
    const students = Array.isArray(out?.students) ? out.students : []
    if (!students.length) {
      ws.innerHTML = `<span class="pill">${name}</span><div style="height:10px"></div><div class="muted">No students in this class.</div>`
      return
    }
    ws.innerHTML = `<span class="pill">${name}</span><div style="height:10px"></div><table class="tbl">${students.map(s => {
      return `<tr class="tr"><td class="td"><div style="font-weight:900">${s.name || ""}</div><div class="muted">${s.admNo || ""}</div></td><td class="td"><button class="save" data-id="${s.id}">Edit scores</button></td></tr>`
    }).join("")}</table>`
    ws.querySelectorAll("button[data-id]").forEach(b => b.addEventListener("click", () => editScores(b.getAttribute("data-id"))))
  }

  async function editScores(studentId) {
    clearErr()
    const ws = document.getElementById("workspace")
    const out = await api("/teacher/api/scores/" + encodeURIComponent(studentId))
    const sheet = out?.scores || {}
    const subj = Array.isArray(out?.subjects) ? out.subjects : []
    ws.innerHTML = `<div style="display:flex;align-items:center;justify-content:space-between;gap:10px"><div><div style="font-weight:900">Edit scores</div><div class="muted">Student ID: ${studentId}</div></div><button class="btn" id="back">Back</button></div><div style="height:10px"></div><div id="form"></div><div style="height:10px"></div><button class="save" id="save">Save scores</button>`
    document.getElementById("back").addEventListener("click", async () => {
      const cls = out?.className || ""
      if (cls) return openClass(cls)
    })

    const form = document.getElementById("form")
    form.innerHTML = subj.map(s => {
      const v = sheet[s] || {}
      return `<div style="display:grid;grid-template-columns:1.2fr 1fr 1fr 1fr;gap:8px;align-items:center;margin-bottom:8px"><div style="font-weight:900">${s}</div><input class="inp" data-sub="${s}" data-k="ca1" type="number" min="0" value="${v.ca1 ?? 0}"><input class="inp" data-sub="${s}" data-k="ca2" type="number" min="0" value="${v.ca2 ?? 0}"><input class="inp" data-sub="${s}" data-k="exam" type="number" min="0" value="${v.exam ?? 0}"></div>`
    }).join("")

    document.getElementById("save").addEventListener("click", async () => {
      clearErr()
      const next = {}
      form.querySelectorAll("input.inp").forEach(inp => {
        const sub = inp.getAttribute("data-sub")
        const k = inp.getAttribute("data-k")
        if (!next[sub]) next[sub] = { ca1: 0, ca2: 0, exam: 0 }
        next[sub][k] = +inp.value || 0
      })
      await api("/teacher/api/scores/" + encodeURIComponent(studentId), {
        method: "PUT",
        body: JSON.stringify({ scores: next })
      })
      await editScores(studentId)
    })
  }

  boot().catch(e => showErr(e?.message || "Failed"))
  </script>
</body>
</html>
HTML;
                Response::html(200, $html);
                return;
            }

            if ($method === 'GET' && $path === '/public/settings') {
                Response::json(200, [
                    'support' => [
                        'whatsapp' => Config::env('SUPPORT_WHATSAPP', '2348037000456'),
                        'email' => Config::env('SUPPORT_EMAIL', 'support@edureport.ng'),
                        'phone' => Config::env('SUPPORT_PHONE', '+234 803 700 0456')
                    ],
                    'branding' => [
                        'name' => 'EduReport NG',
                        'tagline' => 'Professional Nigerian School Management System'
                    ]
                ]);
                return;
            }

            if ($method === 'GET' && $path === '/me') {
                $s = Auth::requireSessionUser();
                $u = Auth::requireUser();
                $sessionRow = $this->getUserById($s['id']);
                if (!$sessionRow) {
                    Auth::logout();
                    Response::error(401, 'UNAUTHENTICATED', 'Unauthenticated');
                    return;
                }
                $effectiveRow = $u['id'] === $s['id'] ? $sessionRow : $this->getUserById($u['id']);
                if (!$effectiveRow) {
                    unset($_SESSION['impersonate_user_id'], $_SESSION['impersonate_school_id']);
                    $effectiveRow = $sessionRow;
                }
                $school = null;
                if (($effectiveRow['role'] ?? null) === 'SCHOOL') {
                    $school = $this->getSchoolByOwnerId($effectiveRow['id']);
                }
                if (($effectiveRow['role'] ?? null) === 'TEACHER') {
                    $schoolId = is_string($effectiveRow['school_id'] ?? null) ? strval($effectiveRow['school_id']) : '';
                    if ($schoolId !== '') {
                        $school = $this->getSchoolById($schoolId);
                    }
                }
                if (($effectiveRow['role'] ?? null) === 'PARENT' || ($effectiveRow['role'] ?? null) === 'STUDENT') {
                    $schoolId = is_string($effectiveRow['school_id'] ?? null) ? strval($effectiveRow['school_id']) : '';
                    if ($schoolId !== '') {
                        $school = $this->getSchoolById($schoolId);
                    }
                }
                if (($effectiveRow['role'] ?? null) === 'SCHOOL_ADMIN') {
                    $schoolId = is_string($effectiveRow['school_id'] ?? null) ? strval($effectiveRow['school_id']) : '';
                    if ($schoolId !== '') {
                        $school = $this->getSchoolById($schoolId);
                    }
                }
                Response::json(200, [
                    'user' => [
                        'id' => $sessionRow['id'],
                        'email' => $sessionRow['email'],
                        'role' => $sessionRow['role'],
                        'status' => $sessionRow['status'],
                        'forcePasswordChange' => intval($sessionRow['force_password_change'] ?? 0) === 1,
                        'displayName' => $sessionRow['display_name'] ?? null
                    ],
                    'effectiveUser' => [
                        'id' => $effectiveRow['id'],
                        'email' => $effectiveRow['email'],
                        'role' => $effectiveRow['role'],
                        'status' => $effectiveRow['status'],
                        'forcePasswordChange' => intval($effectiveRow['force_password_change'] ?? 0) === 1,
                        'displayName' => $effectiveRow['display_name'] ?? null
                    ],
                    'school' => $school ? ['id' => $school['id'], 'name' => $school['name'], 'abbr' => $school['abbr'], 'plan' => $school['plan']] : null,
                    'impersonation' => [
                        'active' => ($u['impersonating'] ?? false) === true,
                        'adminId' => $u['adminId'] ?? null,
                        'schoolId' => $u['schoolId'] ?? null
                    ]
                ]);
                return;
            }

            if ($method === 'POST' && $path === '/auth/register') {
                RateLimit::enforce('register:' . $ip, 30, 3600);
                $body = $this->jsonBody();
                $schoolName = Validation::requireString($body, 'schoolName', 2, 160);
                $email = Validation::requireEmail($body, 'email');
                $password = Validation::requireString($body, 'password', 12, 200);
                $plan = $body['plan'] ?? null;
                if (!is_string($plan)) {
                    $plan = 'lifetime';
                }
                $plan = strtolower(trim($plan));
                if (!in_array($plan, ['starter', 'lifetime', 'pro', 'trial'], true)) {
                    $plan = 'lifetime';
                }
                if ($this->findUserByEmail($email)) {
                    Response::error(400, 'EMAIL_IN_USE', 'An account with this email already exists.');
                    return;
                }
                $uid = $this->id('usr');
                $sid = $this->id('sch');
                $hash = Auth::hashPassword($password);
                $abbr = strtoupper(substr(preg_replace('/[^A-Za-z0-9]/', '', implode('', array_map(fn($w) => mb_substr($w, 0, 1), preg_split('/\s+/', $schoolName) ?: []))), 0, 3));
                if ($abbr === '') {
                    $abbr = 'SCH';
                }
                $slug = $this->ensureUniqueSchoolSlug($schoolName);
                $pdo = Db::pdo();
                $pdo->beginTransaction();
                $stmt = $pdo->prepare('INSERT INTO users (id,email,password_hash,role,status,created_at) VALUES (?,?,?,?,?,NOW())');
                $stmt->execute([$uid, $email, $hash, 'SCHOOL', 'ACTIVE']);
                $stmt = $pdo->prepare('INSERT INTO schools (id,owner_id,name,abbr,school_level,class_templates,plan,subjects,grades,ca1_max,ca2_max,exam_max,subdomain,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,NOW())');
                $subjects = json_encode(["Mathematics","English Language","Basic Science","Social Studies","Business Studies","Civic Education","Agricultural Science","Physical Education"]);
                $grades = json_encode([
                    ['min'=>75,'max'=>100,'grade'=>'A','remark'=>'Distinction','color'=>'#155724'],
                    ['min'=>65,'max'=>74,'grade'=>'B','remark'=>'Credit','color'=>'#0c5460'],
                    ['min'=>50,'max'=>64,'grade'=>'C','remark'=>'Merit','color'=>'#856404'],
                    ['min'=>40,'max'=>49,'grade'=>'D','remark'=>'Pass','color'=>'#884510'],
                    ['min'=>0,'max'=>39,'grade'=>'F','remark'=>'Fail','color'=>'#721c24']
                ]);
                $classTemplates = json_encode(['nursery' => 'Nursery, KG', 'primary' => 'Primary, Grade', 'secondary' => 'JSS, SSS'], JSON_UNESCAPED_SLASHES);
                $stmt->execute([$sid, $uid, $schoolName, $abbr, 'Secondary', $classTemplates, strtoupper($plan), $subjects, $grades, 10, 10, 80, $slug]);
                $pdo->commit();
                $this->logAudit(null, $sid, 'SCHOOL_REGISTER', ['schoolName' => $schoolName, 'email' => $email]);
                Auth::rotateSessionId();
                $_SESSION['user_id'] = $uid;
                $_SESSION['role'] = 'SCHOOL';
                Response::json(201, [
                    'user' => ['id' => $uid, 'email' => $email, 'role' => 'SCHOOL', 'status' => 'ACTIVE'],
                    'school' => ['id' => $sid, 'name' => $schoolName, 'abbr' => $abbr, 'plan' => strtoupper($plan)]
                ]);
                return;
            }

            if ($method === 'POST' && $path === '/auth/login') {
                RateLimit::enforce('login:' . $ip, 120, 3600);
                $body = $this->jsonBody();
                $email = Validation::requireEmail($body, 'email');
                $password = Validation::requireString($body, 'password', 1, 200);
                $totp = isset($body['totp']) ? trim(strval($body['totp'])) : '';
                $schoolSlug = isset($body['schoolSlug']) ? trim(strval($body['schoolSlug'])) : '';
                
                $row = $this->findUserByEmail($email);
                if (!$row || !Auth::verifyPassword($row['password_hash'], $password)) {
                    Response::error(401, 'UNAUTHENTICATED', 'Invalid email or password.');
                    return;
                }
                
                if ($row['status'] !== 'ACTIVE') {
                    Response::error(401, 'UNAUTHENTICATED', 'This account is not active.');
                    return;
                }

                $school = null;
                if ($row['role'] === 'SCHOOL') {
                    $school = $this->getSchoolByOwnerId($row['id']);
                }
                if ($row['role'] === 'TEACHER' || $row['role'] === 'STAFF' || $row['role'] === 'PARENT' || $row['role'] === 'STUDENT' || $row['role'] === 'SCHOOL_ADMIN') {
                    $schoolId = is_string($row['school_id'] ?? null) ? strval($row['school_id']) : '';
                    if ($schoolId !== '') {
                        $school = $this->getSchoolById($schoolId);
                    }
                }

                // If logging in through a school-specific URL, verify school match
                if ($schoolSlug !== '' && $row['role'] !== 'ADMIN') {
                    $targetSchool = $this->getSchoolBySlug($schoolSlug);
                    if (!$targetSchool || !$school || $targetSchool['id'] !== $school['id']) {
                        Response::error(403, 'WRONG_SCHOOL', 'This account does not belong to ' . ($targetSchool['name'] ?? 'this school') . '.');
                        return;
                    }
                }
                $needsTotp = $this->isTotpRequiredForLogin($row, $school);
                if ($needsTotp) {
                    $secret = $this->getUserTotpSecret($row['id']);
                    if ($secret === null) {
                        Response::error(403, 'TOTP_SETUP_REQUIRED', '2FA setup is required for this account.');
                        return;
                    }
                    if ($totp === '' || !Totp::verify($secret, $totp)) {
                        Response::error(401, 'TOTP_REQUIRED', '2FA code required.');
                        return;
                    }
                }
                Auth::rotateSessionId();
                $_SESSION['user_id'] = $row['id'];
                $_SESSION['role'] = $row['role'];
                unset($_SESSION['impersonate_user_id'], $_SESSION['impersonate_school_id']);
                try {
                    $stmt = Db::pdo()->prepare('UPDATE users SET last_login_at=NOW() WHERE id=?');
                    $stmt->execute([$row['id']]);
                } catch (Throwable $e) {
                }
                $action = $row['role'] === 'ADMIN' ? 'ADMIN_LOGIN' : ($row['role'] === 'TEACHER' ? 'TEACHER_LOGIN' : ($row['role'] === 'STAFF' ? 'STAFF_LOGIN' : 'SCHOOL_LOGIN'));
                $this->logAudit($row['id'], $school['id'] ?? null, $action, ['email' => $email, 'totp' => $needsTotp]);
                Response::json(200, [
                    'user' => [
                        'id' => $row['id'],
                        'email' => $row['email'],
                        'role' => $row['role'],
                        'status' => $row['status'],
                        'forcePasswordChange' => intval($row['force_password_change'] ?? 0) === 1
                    ],
                    'school' => $school ? ['id' => $school['id'], 'name' => $school['name'], 'abbr' => $school['abbr'], 'plan' => $school['plan']] : null
                ]);
                return;
            }

            if ($method === 'POST' && $path === '/auth/change-password') {
                $u = Auth::requireUser();
                $body = $this->jsonBody();
                $oldPassword = Validation::requireString($body, 'oldPassword', 1, 200);
                $newPassword = Validation::requireString($body, 'newPassword', 12, 200);
                $stmt = Db::pdo()->prepare('SELECT id,password_hash FROM users WHERE id=? LIMIT 1');
                $stmt->execute([$u['id']]);
                $row = $stmt->fetch();
                if (!$row || !Auth::verifyPassword($row['password_hash'], $oldPassword)) {
                    Response::error(401, 'UNAUTHENTICATED', 'Invalid password.');
                    return;
                }
                $hash = Auth::hashPassword($newPassword);
                $stmt = Db::pdo()->prepare('UPDATE users SET password_hash=?, force_password_change=0, updated_at=NOW() WHERE id=?');
                $stmt->execute([$hash, $u['id']]);
                $this->logAudit($u['adminId'] ?? $u['id'], $u['schoolId'] ?? null, ($u['impersonating'] ?? false) ? 'SCHOOL_PASSWORD_CHANGE_IMPERSONATED' : 'PASSWORD_CHANGE', []);
                Response::json(200, ['ok' => true]);
                return;
            }

            if ($method === 'POST' && $path === '/auth/logout') {
                $uid = $_SESSION['user_id'] ?? null;
                $role = $_SESSION['role'] ?? null;
                unset($_SESSION['impersonate_user_id'], $_SESSION['impersonate_school_id']);
                Auth::logout();
                if (is_string($uid) && is_string($role)) {
                    $this->logAudit($uid, null, $role === 'ADMIN' ? 'ADMIN_LOGOUT' : 'SCHOOL_LOGOUT', []);
                }
                Response::noContent();
                return;
            }

            if ($method === 'GET' && $path === '/admin/stats') {
                Auth::requirePermission('reports.read');
                $pdo = Db::pdo();
                $schoolsTotal = intval(($pdo->query('SELECT COUNT(*) AS c FROM schools WHERE deleted_at IS NULL')->fetch()['c'] ?? 0));
                $schoolsActive = intval(($pdo->query("SELECT COUNT(*) AS c FROM schools s JOIN users u ON u.id=s.owner_id WHERE s.deleted_at IS NULL AND u.status='ACTIVE'")->fetch()['c'] ?? 0));
                $schoolsSuspended = intval(($pdo->query("SELECT COUNT(*) AS c FROM schools s JOIN users u ON u.id=s.owner_id WHERE s.deleted_at IS NULL AND u.status='SUSPENDED'")->fetch()['c'] ?? 0));
                $studentsTotal = intval(($pdo->query('SELECT COUNT(*) AS c FROM students')->fetch()['c'] ?? 0));
                $scoresTotal = intval(($pdo->query('SELECT COUNT(*) AS c FROM score_sheets')->fetch()['c'] ?? 0));
                $plans = $pdo->query('SELECT plan, COUNT(*) AS c FROM schools WHERE deleted_at IS NULL GROUP BY plan')->fetchAll();
                $planDist = [];
                foreach ($plans as $p) {
                    $planDist[$p['plan']] = intval($p['c']);
                }
                $recent = $pdo->query('SELECT s.id,s.name,u.email,s.plan,u.status,s.created_at FROM schools s JOIN users u ON u.id=s.owner_id WHERE s.deleted_at IS NULL ORDER BY s.created_at DESC LIMIT 7')->fetchAll();
                Response::json(200, [
                    'stats' => [
                        'schoolsTotal' => $schoolsTotal,
                        'schoolsActive' => $schoolsActive,
                        'schoolsSuspended' => $schoolsSuspended,
                        'studentsTotal' => $studentsTotal,
                        'scoresTotal' => $scoresTotal
                    ],
                    'planDist' => $planDist,
                    'recent' => array_map(fn($r) => [
                        'id' => $r['id'],
                        'name' => $r['name'],
                        'email' => $r['email'],
                        'plan' => $r['plan'],
                        'status' => $r['status'],
                        'createdAt' => $r['created_at']
                    ], $recent)
                ]);
                return;
            }

            if ($method === 'GET' && $path === '/admin/reports/revenue') {
                Auth::requirePermission('reports.read');
                $pdo = Db::pdo();
                $rows = $pdo->query("SELECT status,billing_cycle,current_amount_kobo,currency FROM school_subscriptions")->fetchAll();
                $mrr = 0;
                $active = 0;
                $trialing = 0;
                foreach ($rows as $r) {
                    $st = strval($r['status'] ?? '');
                    if ($st === 'ACTIVE') {
                        $active += 1;
                        $amt = intval($r['current_amount_kobo'] ?? 0);
                        $cycle = strval($r['billing_cycle'] ?? 'MONTHLY');
                        $mrr += ($cycle === 'ANNUAL') ? intval(round($amt / 12)) : $amt;
                    } elseif ($st === 'TRIALING') {
                        $trialing += 1;
                    }
                }
                $failedSql = Db::isSqlite()
                    ? "SELECT COUNT(*) AS c FROM payments WHERE status='FAILED' AND created_at >= datetime(NOW(), '-30 days')"
                    : "SELECT COUNT(*) AS c FROM payments WHERE status='FAILED' AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)";
                $failed = intval(($pdo->query($failedSql)->fetch()['c'] ?? 0));
                Response::json(200, [
                    'revenue' => [
                        'mrrKobo' => $mrr,
                        'activeSubscriptions' => $active,
                        'trialingSubscriptions' => $trialing,
                        'failedPayments30d' => $failed,
                        'currency' => 'NGN'
                    ]
                ]);
                return;
            }

            if ($method === 'POST' && $path === '/admin/reports/export') {
                Auth::requirePermission('reports.read');
                RateLimit::enforce('admin-export:' . $ip, 30, 3600);
                $body = $this->jsonBody();
                $type = strtolower(trim(strval($body['type'] ?? 'revenue')));
                $format = strtolower(trim(strval($body['format'] ?? 'csv')));
                if (!in_array($type, ['revenue'], true) || $format !== 'csv') {
                    Response::error(400, 'VALIDATION_ERROR', 'Unsupported export');
                    return;
                }
                $id = $this->id('rpt');
                $params = ['type' => $type, 'format' => $format];
                Db::pdo()->prepare('INSERT INTO report_runs (id,type,status,params,created_at) VALUES (?,?,\'PENDING\',?,NOW())')
                    ->execute([$id, $type, json_encode($params, JSON_UNESCAPED_SLASHES)]);
                $csv = $this->generateRevenueCsv();
                $dir = dirname(__DIR__) . '/storage/reports';
                if (!is_dir($dir)) {
                    @mkdir($dir, 0775, true);
                }
                $file = $dir . '/' . $id . '.csv';
                file_put_contents($file, $csv);
                Db::pdo()->prepare("UPDATE report_runs SET status='DONE', file_path=?, completed_at=NOW() WHERE id=?")
                    ->execute([$file, $id]);
                $this->logAudit($_SESSION['user_id'] ?? null, null, 'ADMIN_EXPORT_REPORT', ['reportId' => $id, 'type' => $type]);
                Response::json(201, ['id' => $id, 'downloadUrl' => '/admin/reports/' . $id . '/download']);
                return;
            }

            if ($method === 'GET' && preg_match('#^/admin/reports/([^/]+)/download$#', $path, $m)) {
                Auth::requirePermission('reports.read');
                $id = $m[1];
                $stmt = Db::pdo()->prepare("SELECT id,file_path,status FROM report_runs WHERE id=? LIMIT 1");
                $stmt->execute([$id]);
                $r = $stmt->fetch();
                if (!$r || ($r['status'] ?? null) !== 'DONE' || !is_string($r['file_path'] ?? null)) {
                    Response::error(404, 'NOT_FOUND', 'Not found');
                    return;
                }
                $pathFile = $r['file_path'];
                if (!is_file($pathFile)) {
                    Response::error(404, 'NOT_FOUND', 'File not found');
                    return;
                }
                $bytes = file_get_contents($pathFile);
                if (!is_string($bytes)) {
                    Response::error(500, 'ERROR', 'Read failed');
                    return;
                }
                Response::download(200, 'text/csv; charset=utf-8', $id . '.csv', $bytes);
                return;
            }

            if ($method === 'GET' && $path === '/admin/system/alerts/slack') {
                Auth::requirePermission('system.read');
                $cfg = $this->getSystemSetting('slackAlerts') ?? ['enabled' => false];
                Response::json(200, ['slack' => ['enabled' => ($cfg['enabled'] ?? false) === true]]);
                return;
            }

            if ($method === 'PUT' && $path === '/admin/system/alerts/slack') {
                Auth::requirePermission('system.write');
                $body = $this->jsonBody();
                $enabled = ($body['enabled'] ?? false) === true;
                $webhookUrl = isset($body['webhookUrl']) ? trim(strval($body['webhookUrl'])) : '';
                $cipher = null;
                if ($enabled) {
                    if ($webhookUrl === '' || !filter_var($webhookUrl, FILTER_VALIDATE_URL)) {
                        Response::error(400, 'VALIDATION_ERROR', 'Invalid webhookUrl');
                        return;
                    }
                    $cipher = Crypto::encrypt($webhookUrl);
                }
                $cfg = ['enabled' => $enabled, 'webhookCiphertext' => $cipher];
                $this->setSystemSetting('slackAlerts', $cfg, $_SESSION['user_id'] ?? null);
                $this->logAudit($_SESSION['user_id'] ?? null, null, 'ADMIN_SET_SLACK_ALERTS', ['enabled' => $enabled]);
                Response::json(200, ['ok' => true]);
                return;
            }

            if ($method === 'POST' && $path === '/admin/alerts/test') {
                Auth::requirePermission('system.write');
                RateLimit::enforce('admin-alert-test:' . $ip, 10, 3600);
                $body = $this->jsonBody();
                $msg = isset($body['message']) ? trim(strval($body['message'])) : 'Test alert';
                $ok = $this->sendSlackAlert($msg);
                Db::pdo()->prepare('INSERT INTO alert_events (id,type,status,data,created_at) VALUES (?,?,?,?,NOW())')
                    ->execute([$this->id('alt'), 'SLACK_TEST', $ok ? 'SENT' : 'FAILED', json_encode(['message' => $msg], JSON_UNESCAPED_SLASHES)]);
                Response::json(200, ['ok' => $ok]);
                return;
            }

            if ($method === 'GET' && $path === '/admin/system/ai-keys') {
                Auth::requirePermission('system.read');
                $cfg = $this->getSystemSetting('aiKeys') ?? [];
                $providers = ['openrouter', 'gemini'];
                $out = [];
                foreach ($providers as $p) {
                    $pc = is_array($cfg[$p] ?? null) ? $cfg[$p] : [];
                    $enabled = ($pc['enabled'] ?? false) === true;
                    $cipher = isset($pc['apiKeyCiphertext']) ? strval($pc['apiKeyCiphertext']) : '';
                    $out[$p] = [
                        'enabled' => $enabled,
                        'configured' => $cipher !== ''
                    ];
                }
                Response::json(200, ['providers' => $out]);
                return;
            }

            if ($method === 'PUT' && $path === '/admin/system/ai-keys') {
                Auth::requirePermission('system.write');
                RateLimit::enforce('admin-ai-keys:' . $ip, 30, 3600);
                $body = $this->jsonBody();
                $providersIn = $body['providers'] ?? null;
                if (!is_array($providersIn)) {
                    Response::error(400, 'VALIDATION_ERROR', 'providers must be an object');
                    return;
                }
                $cfg = $this->getSystemSetting('aiKeys') ?? [];
                $providers = ['openrouter', 'gemini'];
                foreach ($providers as $p) {
                    if (!array_key_exists($p, $providersIn)) {
                        continue;
                    }
                    $pcIn = $providersIn[$p];
                    if (!is_array($pcIn)) {
                        continue;
                    }
                    $pcPrev = is_array($cfg[$p] ?? null) ? $cfg[$p] : [];
                    $prevCipher = isset($pcPrev['apiKeyCiphertext']) ? strval($pcPrev['apiKeyCiphertext']) : '';
                    $enabled = array_key_exists('enabled', $pcIn) ? (($pcIn['enabled'] ?? false) === true) : (($pcPrev['enabled'] ?? false) === true);
                    $apiKey = array_key_exists('apiKey', $pcIn) ? trim(strval($pcIn['apiKey'])) : '';
                    $cipher = $prevCipher;

                    if ($enabled) {
                        if ($apiKey !== '') {
                            if (strlen($apiKey) > 5000) {
                                Response::error(400, 'VALIDATION_ERROR', 'apiKey too long');
                                return;
                            }
                            $cipher = Crypto::encrypt($apiKey);
                        } elseif ($prevCipher === '') {
                            Response::error(400, 'VALIDATION_ERROR', 'apiKey is required when enabling ' . $p);
                            return;
                        }
                    } else {
                        $cipher = '';
                    }

                    $cfg[$p] = [
                        'enabled' => $enabled,
                        'apiKeyCiphertext' => $cipher !== '' ? $cipher : null
                    ];
                }

                $this->setSystemSetting('aiKeys', $cfg, $_SESSION['user_id'] ?? null);
                $this->logAudit($_SESSION['user_id'] ?? null, null, 'ADMIN_SET_AI_KEYS', ['providers' => array_keys($providersIn)]);
                Response::json(200, ['ok' => true]);
                return;
            }

            if ($method === 'POST' && $path === '/admin/jobs/run') {
                Auth::requirePermission('jobs.run');
                RateLimit::enforce('admin-jobs:' . $ip, 10, 3600);
                $body = $this->jsonBody();
                $tasks = $body['tasks'] ?? ['renewals', 'alerts'];
                if (!is_array($tasks)) {
                    $tasks = ['renewals', 'alerts'];
                }
                $done = [];
                if (in_array('renewals', $tasks, true)) {
                    $done['renewals'] = $this->runRenewals();
                }
                if (in_array('alerts', $tasks, true)) {
                    $done['alerts'] = $this->runAlerts();
                }
                $this->logAudit($_SESSION['user_id'] ?? null, null, 'ADMIN_RUN_JOBS', ['tasks' => $tasks]);
                Response::json(200, ['ok' => true, 'result' => $done]);
                return;
            }

            if ($method === 'GET' && $path === '/admin/system/maintenance') {
                Auth::requirePermission('system.read');
                $cfg = $this->getSystemSetting('maintenance') ?? ['enabled' => false, 'message' => 'Maintenance in progress', 'allowIps' => []];
                Response::json(200, ['maintenance' => $cfg]);
                return;
            }

            if ($method === 'PUT' && $path === '/admin/system/maintenance') {
                Auth::requirePermission('system.write');
                $body = $this->jsonBody();
                $enabled = ($body['enabled'] ?? false) === true;
                $message = isset($body['message']) ? strval($body['message']) : 'Maintenance in progress';
                $allowIps = $body['allowIps'] ?? [];
                if (!is_array($allowIps)) {
                    $allowIps = [];
                }
                $allowIps = array_values(array_filter(array_map(fn($x) => trim(strval($x)), $allowIps), fn($x) => $x !== ''));
                $cfg = ['enabled' => $enabled, 'message' => $message, 'allowIps' => $allowIps];
                $this->setSystemSetting('maintenance', $cfg, $_SESSION['user_id'] ?? null);
                $this->logAudit($_SESSION['user_id'] ?? null, null, 'ADMIN_SET_MAINTENANCE', ['enabled' => $enabled, 'allowIps' => $allowIps]);
                Response::json(200, ['ok' => true]);
                return;
            }

            if ($method === 'GET' && $path === '/admin/system/feature-flags') {
                Auth::requirePermission('system.read');
                $flags = $this->getSystemSetting('featureFlags') ?? ['flags' => new stdClass()];
                Response::json(200, ['featureFlags' => $flags]);
                return;
            }

            if ($method === 'PUT' && $path === '/admin/system/feature-flags') {
                Auth::requirePermission('system.write');
                $body = $this->jsonBody();
                $flags = $body['featureFlags'] ?? null;
                if (!is_array($flags)) {
                    Response::error(400, 'VALIDATION_ERROR', 'featureFlags must be an object');
                    return;
                }
                $this->setSystemSetting('featureFlags', $flags, $_SESSION['user_id'] ?? null);
                $this->logAudit($_SESSION['user_id'] ?? null, null, 'ADMIN_SET_FEATURE_FLAGS', ['keys' => array_keys($flags)]);
                Response::json(200, ['ok' => true]);
                return;
            }

            if ($method === 'GET' && $path === '/admin/system/email-templates') {
                Auth::requirePermission('system.read');
                $tpl = $this->getSystemSetting('emailTemplates') ?? ['templates' => new stdClass()];
                Response::json(200, ['emailTemplates' => $tpl]);
                return;
            }

            if ($method === 'PUT' && $path === '/admin/system/email-templates') {
                Auth::requirePermission('system.write');
                $body = $this->jsonBody();
                $tpl = $body['emailTemplates'] ?? null;
                if (!is_array($tpl)) {
                    Response::error(400, 'VALIDATION_ERROR', 'emailTemplates must be an object');
                    return;
                }
                $this->setSystemSetting('emailTemplates', $tpl, $_SESSION['user_id'] ?? null);
                $this->logAudit($_SESSION['user_id'] ?? null, null, 'ADMIN_SET_EMAIL_TEMPLATES', ['keys' => array_keys($tpl)]);
                Response::json(200, ['ok' => true]);
                return;
            }

            if ($method === 'GET' && $path === '/admin/tokens') {
                Auth::requirePermission('tokens.read');
                $stmt = Db::pdo()->query('SELECT id,user_id,name,scopes,created_at,expires_at,last_used_at,revoked_at FROM admin_api_tokens ORDER BY created_at DESC LIMIT 200');
                $rows = $stmt->fetchAll();
                Response::json(200, ['tokens' => array_map(fn($t) => [
                    'id' => $t['id'],
                    'userId' => $t['user_id'],
                    'name' => $t['name'],
                    'scopes' => json_decode($t['scopes'] ?? '[]', true) ?: [],
                    'createdAt' => $t['created_at'],
                    'expiresAt' => $t['expires_at'],
                    'lastUsedAt' => $t['last_used_at'],
                    'revokedAt' => $t['revoked_at']
                ], $rows)]);
                return;
            }

            if ($method === 'POST' && $path === '/admin/tokens') {
                Auth::requirePermission('tokens.write');
                RateLimit::enforce('admin-create-token:' . $ip, 30, 3600);
                $body = $this->jsonBody();
                $name = isset($body['name']) ? trim(strval($body['name'])) : null;
                $scopes = $body['scopes'] ?? [];
                if (!is_array($scopes)) {
                    $scopes = [];
                }
                $expiresDays = isset($body['expiresDays']) ? intval($body['expiresDays']) : 90;
                if ($expiresDays < 1) $expiresDays = 1;
                if ($expiresDays > 365) $expiresDays = 365;
                $raw = 'adm_' . $this->base64UrlEncode(random_bytes(32));
                $hash = hash('sha256', $raw);
                $id = $this->id('tok');
                $expiresAt = gmdate('Y-m-d H:i:s', time() + ($expiresDays * 86400));
                $stmt = Db::pdo()->prepare('INSERT INTO admin_api_tokens (id,user_id,token_hash,name,scopes,created_at,expires_at) VALUES (?,?,?,?,?,NOW(),?)');
                $stmt->execute([$id, $_SESSION['user_id'] ?? null, $hash, $name, json_encode($scopes, JSON_UNESCAPED_SLASHES), $expiresAt]);
                $this->logAudit($_SESSION['user_id'] ?? null, null, 'ADMIN_CREATE_TOKEN', ['tokenId' => $id, 'expiresDays' => $expiresDays]);
                Response::json(201, ['id' => $id, 'token' => $raw, 'expiresAt' => $expiresAt]);
                return;
            }

            if ($method === 'POST' && preg_match('#^/admin/tokens/([^/]+)/revoke$#', $path, $m)) {
                Auth::requirePermission('tokens.write');
                RateLimit::enforce('admin-revoke-token:' . $ip, 60, 3600);
                $id = $m[1];
                $stmt = Db::pdo()->prepare('UPDATE admin_api_tokens SET revoked_at=NOW() WHERE id=?');
                $stmt->execute([$id]);
                $this->logAudit($_SESSION['user_id'] ?? null, null, 'ADMIN_REVOKE_TOKEN', ['tokenId' => $id]);
                Response::json(200, ['ok' => true]);
                return;
            }

            if ($method === 'GET' && $path === '/admin/roles') {
                Auth::requirePermission('roles.read');
                $stmt = Db::pdo()->query('SELECT id,slug,name,description,permissions,created_at,updated_at FROM roles ORDER BY created_at DESC LIMIT 200');
                $rows = $stmt->fetchAll();
                Response::json(200, ['roles' => array_map(fn($r) => [
                    'id' => $r['id'],
                    'slug' => $r['slug'],
                    'name' => $r['name'],
                    'description' => $r['description'],
                    'permissions' => json_decode($r['permissions'] ?? '[]', true) ?: [],
                    'createdAt' => $r['created_at'],
                    'updatedAt' => $r['updated_at']
                ], $rows)]);
                return;
            }

            if ($method === 'POST' && $path === '/admin/roles') {
                Auth::requirePermission('roles.write');
                RateLimit::enforce('admin-create-role:' . $ip, 60, 3600);
                $body = $this->jsonBody();
                $slug = strtolower(trim(Validation::requireString($body, 'slug', 2, 80)));
                $name = Validation::requireString($body, 'name', 2, 160);
                $description = isset($body['description']) ? strval($body['description']) : null;
                $permissions = $body['permissions'] ?? [];
                if (!preg_match('/^[a-z0-9][a-z0-9\\-]*[a-z0-9]$/', $slug)) {
                    Response::error(400, 'VALIDATION_ERROR', 'Invalid slug');
                    return;
                }
                if (!is_array($permissions)) {
                    Response::error(400, 'VALIDATION_ERROR', 'permissions must be an array');
                    return;
                }
                $permissions = array_values(array_filter(array_map(fn($p) => trim(strval($p)), $permissions), fn($p) => $p !== ''));
                $pdo = Db::pdo();
                $stmt = $pdo->prepare('SELECT id FROM roles WHERE slug=? LIMIT 1');
                $stmt->execute([$slug]);
                if ($stmt->fetch()) {
                    Response::error(400, 'DUPLICATE', 'Role slug already exists');
                    return;
                }
                $id = $this->id('rol');
                $stmt = $pdo->prepare('INSERT INTO roles (id,slug,name,description,permissions,created_at,created_by_user_id) VALUES (?,?,?,?,?,NOW(),?)');
                $stmt->execute([$id, $slug, $name, $description, json_encode($permissions, JSON_UNESCAPED_SLASHES), $_SESSION['user_id'] ?? null]);
                $this->logAudit($_SESSION['user_id'] ?? null, null, 'ADMIN_CREATE_ROLE', ['roleId' => $id, 'slug' => $slug]);
                Response::json(201, ['id' => $id]);
                return;
            }

            if ($method === 'GET' && preg_match('#^/admin/roles/([^/]+)$#', $path, $m)) {
                Auth::requirePermission('roles.read');
                $id = $m[1];
                $stmt = Db::pdo()->prepare('SELECT id,slug,name,description,permissions,created_at,updated_at FROM roles WHERE id=? LIMIT 1');
                $stmt->execute([$id]);
                $r = $stmt->fetch();
                if (!$r) {
                    Response::error(404, 'NOT_FOUND', 'Not found');
                    return;
                }
                Response::json(200, ['role' => [
                    'id' => $r['id'],
                    'slug' => $r['slug'],
                    'name' => $r['name'],
                    'description' => $r['description'],
                    'permissions' => json_decode($r['permissions'] ?? '[]', true) ?: [],
                    'createdAt' => $r['created_at'],
                    'updatedAt' => $r['updated_at']
                ]]);
                return;
            }

            if ($method === 'PATCH' && preg_match('#^/admin/roles/([^/]+)$#', $path, $m)) {
                Auth::requirePermission('roles.write');
                $id = $m[1];
                $body = $this->jsonBody();
                $name = isset($body['name']) ? trim(strval($body['name'])) : null;
                $description = array_key_exists('description', $body) ? strval($body['description']) : null;
                $permissions = array_key_exists('permissions', $body) ? $body['permissions'] : null;
                $set = [];
                $vals = [];
                if (is_string($name) && $name !== '') {
                    $set[] = 'name=?';
                    $vals[] = $name;
                }
                if ($description !== null) {
                    $set[] = 'description=?';
                    $vals[] = $description;
                }
                if ($permissions !== null) {
                    if (!is_array($permissions)) {
                        Response::error(400, 'VALIDATION_ERROR', 'permissions must be an array');
                        return;
                    }
                    $permissions = array_values(array_filter(array_map(fn($p) => trim(strval($p)), $permissions), fn($p) => $p !== ''));
                    $set[] = 'permissions=?';
                    $vals[] = json_encode($permissions, JSON_UNESCAPED_SLASHES);
                }
                if (!$set) {
                    Response::error(400, 'NO_CHANGES', 'No changes specified.');
                    return;
                }
                $vals[] = $id;
                $stmt = Db::pdo()->prepare('UPDATE roles SET ' . implode(',', $set) . ', updated_at=NOW() WHERE id=?');
                $stmt->execute($vals);
                $this->logAudit($_SESSION['user_id'] ?? null, null, 'ADMIN_UPDATE_ROLE', ['roleId' => $id]);
                Response::json(200, ['ok' => true]);
                return;
            }

            if ($method === 'DELETE' && preg_match('#^/admin/roles/([^/]+)$#', $path, $m)) {
                Auth::requirePermission('roles.write');
                $id = $m[1];
                $stmt = Db::pdo()->prepare('DELETE FROM roles WHERE id=?');
                $stmt->execute([$id]);
                $this->logAudit($_SESSION['user_id'] ?? null, null, 'ADMIN_DELETE_ROLE', ['roleId' => $id]);
                Response::noContent();
                return;
            }

            if ($method === 'GET' && $path === '/admin/users') {
                Auth::requirePermission('users.read');
                $q = isset($_GET['q']) ? trim(strval($_GET['q'])) : '';
                $role = isset($_GET['role']) ? strtoupper(trim(strval($_GET['role']))) : '';
                $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 200;
                if ($limit < 1) $limit = 200;
                if ($limit > 500) $limit = 500;
                $where = [];
                $params = [];
                if ($q !== '') {
                    $where[] = '(email LIKE ?)';
                    $params[] = '%' . $q . '%';
                }
                if (in_array($role, ['ADMIN','SCHOOL','STAFF'], true)) {
                    $where[] = 'role=?';
                    $params[] = $role;
                }
                $sql = 'SELECT id,email,role,status,force_password_change,totp_enabled,last_login_at,created_at FROM users';
                if ($where) {
                    $sql .= ' WHERE ' . implode(' AND ', $where);
                }
                $sql .= ' ORDER BY created_at DESC LIMIT ?';
                $stmt = Db::pdo()->prepare($sql);
                $i = 1;
                foreach ($params as $p) {
                    $stmt->bindValue($i++, $p, PDO::PARAM_STR);
                }
                $stmt->bindValue($i, $limit, PDO::PARAM_INT);
                $stmt->execute();
                $rows = $stmt->fetchAll();
                Response::json(200, ['users' => array_map(fn($u) => [
                    'id' => $u['id'],
                    'email' => $u['email'],
                    'role' => $u['role'],
                    'status' => $u['status'],
                    'forcePasswordChange' => intval($u['force_password_change'] ?? 0) === 1,
                    'totpEnabled' => intval($u['totp_enabled'] ?? 0) === 1,
                    'lastLoginAt' => $u['last_login_at'],
                    'createdAt' => $u['created_at']
                ], $rows)]);
                return;
            }

            if ($method === 'POST' && $path === '/admin/users/create') {
                Auth::requirePermission('users.write');
                RateLimit::enforce('admin-create-user:' . $ip, 60, 3600);
                $body = $this->jsonBody();
                $email = Validation::requireEmail($body, 'email');
                $role = strtoupper(Validation::requireString($body, 'role', 4, 10));
                $password = Validation::requireString($body, 'password', 12, 200);
                $phone = isset($body['phone']) ? trim(strval($body['phone'])) : null;
                $schoolId = isset($body['schoolId']) ? trim(strval($body['schoolId'])) : null;
                if (!in_array($role, ['STAFF','ADMIN'], true)) {
                    Response::error(400, 'VALIDATION_ERROR', 'Invalid role');
                    return;
                }
                if ($this->findUserByEmail($email)) {
                    Response::error(400, 'EMAIL_IN_USE', 'An account with this email already exists.');
                    return;
                }
                $id = $this->id('usr');
                $hash = Auth::hashPassword($password);
                $stmt = Db::pdo()->prepare('INSERT INTO users (id,email,password_hash,role,status,phone,school_id,force_password_change,created_at) VALUES (?,?,?,?,?,?,?,1,NOW())');
                $stmt->execute([$id, $email, $hash, $role, 'ACTIVE', $phone, $schoolId]);
                $this->logAudit($_SESSION['user_id'] ?? null, null, 'ADMIN_CREATE_USER', ['userId' => $id, 'role' => $role, 'email' => $email]);
                Response::json(201, ['id' => $id]);
                return;
            }

            if ($method === 'POST' && preg_match('#^/admin/users/([^/]+)/roles$#', $path, $m)) {
                Auth::requirePermission('users.write');
                $userId = $m[1];
                $body = $this->jsonBody();
                $roleIds = $body['roleIds'] ?? [];
                if (!is_array($roleIds)) {
                    Response::error(400, 'VALIDATION_ERROR', 'roleIds must be an array');
                    return;
                }
                $roleIds = array_values(array_filter(array_map(fn($x) => trim(strval($x)), $roleIds), fn($x) => $x !== ''));
                $pdo = Db::pdo();
                $pdo->beginTransaction();
                $pdo->prepare('DELETE FROM user_roles WHERE user_id=?')->execute([$userId]);
                foreach ($roleIds as $rid) {
                    $sql = Db::isSqlite()
                        ? 'INSERT OR IGNORE INTO user_roles (user_id,role_id,created_at,created_by_user_id) VALUES (?,?,NOW(),?)'
                        : 'INSERT IGNORE INTO user_roles (user_id,role_id,created_at,created_by_user_id) VALUES (?,?,NOW(),?)';
                    $pdo->prepare($sql)->execute([$userId, $rid, $_SESSION['user_id'] ?? null]);
                }
                $pdo->commit();
                $this->logAudit($_SESSION['user_id'] ?? null, null, 'ADMIN_ASSIGN_USER_ROLES', ['userId' => $userId, 'roleIds' => $roleIds]);
                Response::json(200, ['ok' => true]);
                return;
            }

            if ($method === 'GET' && preg_match('#^/admin/users/([^/]+)/roles$#', $path, $m)) {
                Auth::requirePermission('users.read');
                $userId = $m[1];
                $stmt = Db::pdo()->prepare('SELECT r.id,r.slug,r.name FROM user_roles ur JOIN roles r ON r.id=ur.role_id WHERE ur.user_id=? ORDER BY r.created_at ASC');
                $stmt->execute([$userId]);
                $rows = $stmt->fetchAll();
                Response::json(200, ['roles' => array_map(fn($r) => [
                    'id' => $r['id'],
                    'slug' => $r['slug'],
                    'name' => $r['name']
                ], $rows)]);
                return;
            }

            if ($method === 'GET' && $path === '/admin/system/2fa') {
                Auth::requirePermission('system.read');
                $cfg = $this->getSystemSetting('twofa') ?? ['globalEnforced' => false];
                Response::json(200, ['twofa' => $cfg]);
                return;
            }

            if ($method === 'PUT' && $path === '/admin/system/2fa') {
                Auth::requirePermission('system.write');
                $body = $this->jsonBody();
                $globalEnforced = ($body['globalEnforced'] ?? false) === true;
                $cfg = ['globalEnforced' => $globalEnforced];
                $this->setSystemSetting('twofa', $cfg, $_SESSION['user_id'] ?? null);
                $this->logAudit($_SESSION['user_id'] ?? null, null, 'ADMIN_SET_2FA_GLOBAL', ['globalEnforced' => $globalEnforced]);
                Response::json(200, ['ok' => true]);
                return;
            }

            if ($method === 'PUT' && preg_match('#^/admin/schools/([^/]+)/2fa$#', $path, $m)) {
                Auth::requirePermission('schools.write');
                $id = $m[1];
                $body = $this->jsonBody();
                $require2fa = ($body['require2fa'] ?? false) === true;
                $stmt = Db::pdo()->prepare('UPDATE schools SET require_2fa=?, updated_at=NOW() WHERE id=?');
                $stmt->execute([$require2fa ? 1 : 0, $id]);
                $this->logAudit($_SESSION['user_id'] ?? null, $id, 'ADMIN_SET_SCHOOL_2FA', ['require2fa' => $require2fa]);
                Response::json(200, ['ok' => true]);
                return;
            }

            if ($method === 'POST' && preg_match('#^/admin/users/([^/]+)/2fa/setup$#', $path, $m)) {
                Auth::requirePermission('users.write');
                RateLimit::enforce('admin-2fa-setup:' . $ip, 30, 3600);
                $userId = $m[1];
                $stmt = Db::pdo()->prepare('SELECT email FROM users WHERE id=? LIMIT 1');
                $stmt->execute([$userId]);
                $row = $stmt->fetch();
                if (!$row) {
                    Response::error(404, 'NOT_FOUND', 'Not found');
                    return;
                }
                $secret = Totp::generateSecretBase32();
                $cipher = Crypto::encrypt($secret);
                $pdo = Db::pdo();
                $pdo->beginTransaction();
                $sql = Db::isSqlite()
                    ? 'INSERT INTO user_totp_secrets (user_id,secret_ciphertext,created_at,updated_at) VALUES (?,?,NOW(),NOW()) ON CONFLICT(user_id) DO UPDATE SET secret_ciphertext=excluded.secret_ciphertext, updated_at=excluded.updated_at'
                    : 'INSERT INTO user_totp_secrets (user_id,secret_ciphertext,created_at,updated_at) VALUES (?,?,NOW(),NOW()) ON DUPLICATE KEY UPDATE secret_ciphertext=VALUES(secret_ciphertext),updated_at=VALUES(updated_at)';
                $pdo->prepare($sql)->execute([$userId, $cipher]);
                $pdo->prepare('UPDATE users SET totp_enabled=0 WHERE id=?')->execute([$userId]);
                $pdo->commit();
                $issuer = 'ReportSheet';
                $uri = Totp::otpauthUri($issuer, $row['email'], $secret);
                $this->logAudit($_SESSION['user_id'] ?? null, null, 'ADMIN_2FA_SETUP', ['userId' => $userId]);
                Response::json(200, ['secret' => $secret, 'otpauthUri' => $uri]);
                return;
            }

            if ($method === 'POST' && preg_match('#^/admin/users/([^/]+)/2fa/enable$#', $path, $m)) {
                Auth::requirePermission('users.write');
                RateLimit::enforce('admin-2fa-enable:' . $ip, 60, 3600);
                $userId = $m[1];
                $body = $this->jsonBody();
                $code = Validation::requireString($body, 'code', 4, 12);
                $stmt = Db::pdo()->prepare('SELECT secret_ciphertext FROM user_totp_secrets WHERE user_id=? LIMIT 1');
                $stmt->execute([$userId]);
                $row = $stmt->fetch();
                if (!$row || !is_string($row['secret_ciphertext'] ?? null)) {
                    Response::error(404, 'NOT_FOUND', '2FA not setup');
                    return;
                }
                $secret = Crypto::decrypt($row['secret_ciphertext']);
                if (!Totp::verify($secret, $code)) {
                    Response::error(400, 'TOTP_INVALID', 'Invalid code');
                    return;
                }
                Db::pdo()->prepare('UPDATE users SET totp_enabled=1 WHERE id=?')->execute([$userId]);
                $this->logAudit($_SESSION['user_id'] ?? null, null, 'ADMIN_2FA_ENABLE', ['userId' => $userId]);
                Response::json(200, ['ok' => true]);
                return;
            }

            if ($method === 'POST' && preg_match('#^/admin/users/([^/]+)/2fa/disable$#', $path, $m)) {
                Auth::requirePermission('users.write');
                RateLimit::enforce('admin-2fa-disable:' . $ip, 30, 3600);
                $userId = $m[1];
                $pdo = Db::pdo();
                $pdo->beginTransaction();
                $pdo->prepare('DELETE FROM user_totp_secrets WHERE user_id=?')->execute([$userId]);
                $pdo->prepare('UPDATE users SET totp_enabled=0 WHERE id=?')->execute([$userId]);
                $pdo->commit();
                $this->logAudit($_SESSION['user_id'] ?? null, null, 'ADMIN_2FA_DISABLE', ['userId' => $userId]);
                Response::json(200, ['ok' => true]);
                return;
            }

            if ($method === 'GET' && $path === '/admin/payment-gateways') {
                Auth::requirePermission('payments.read');
                $gateway = isset($_GET['gateway']) ? strtoupper(trim(strval($_GET['gateway']))) : '';
                $env = isset($_GET['environment']) ? strtoupper(trim(strval($_GET['environment']))) : '';
                if ($gateway !== '' && !in_array($gateway, $this->paymentGateways(), true)) {
                    Response::error(400, 'VALIDATION_ERROR', 'Invalid gateway');
                    return;
                }
                if ($env !== '' && !in_array($env, ['SANDBOX','LIVE'], true)) {
                    Response::error(400, 'VALIDATION_ERROR', 'Invalid environment');
                    return;
                }
                $where = [];
                $params = [];
                if ($gateway !== '') {
                    $where[] = 'gateway=?';
                    $params[] = $gateway;
                }
                if ($env !== '') {
                    $where[] = 'environment=?';
                    $params[] = $env;
                }
                $sql = 'SELECT id,gateway,environment,key_name,active,created_at,revoked_at FROM payment_gateway_keys';
                if ($where) {
                    $sql .= ' WHERE ' . implode(' AND ', $where);
                }
                $sql .= ' ORDER BY created_at DESC LIMIT 200';
                $stmt = Db::pdo()->prepare($sql);
                $stmt->execute($params);
                $keys = $stmt->fetchAll();
                $sql = 'SELECT gateway,environment,url,enabled,updated_at FROM payment_gateway_webhooks';
                if ($where) {
                    $sql .= ' WHERE ' . implode(' AND ', $where);
                }
                $sql .= ' ORDER BY updated_at DESC LIMIT 50';
                $stmt = Db::pdo()->prepare($sql);
                $stmt->execute($params);
                $hooks = $stmt->fetchAll();
                Response::json(200, [
                    'keys' => array_map(fn($r) => [
                        'id' => $r['id'],
                        'gateway' => $r['gateway'],
                        'environment' => $r['environment'],
                        'keyName' => $r['key_name'],
                        'active' => intval($r['active'] ?? 0) === 1,
                        'createdAt' => $r['created_at'],
                        'revokedAt' => $r['revoked_at']
                    ], $keys),
                    'webhooks' => array_map(fn($r) => [
                        'gateway' => $r['gateway'],
                        'environment' => $r['environment'],
                        'url' => $r['url'],
                        'enabled' => intval($r['enabled'] ?? 0) === 1,
                        'updatedAt' => $r['updated_at']
                    ], $hooks)
                ]);
                return;
            }

            if ($method === 'PUT' && $path === '/admin/payment-gateways/key') {
                Auth::requirePermission('payments.write');
                RateLimit::enforce('admin-set-gateway-key:' . $ip, 60, 3600);
                $body = $this->jsonBody();
                $gateway = strtoupper(Validation::requireString($body, 'gateway', 2, 20));
                $env = strtoupper(Validation::requireString($body, 'environment', 2, 20));
                $keyName = Validation::requireString($body, 'keyName', 1, 60);
                $value = Validation::requireString($body, 'value', 1, 5000);
                if (!in_array($gateway, $this->paymentGateways(), true)) {
                    Response::error(400, 'VALIDATION_ERROR', 'Invalid gateway');
                    return;
                }
                if (!in_array($env, ['SANDBOX','LIVE'], true)) {
                    Response::error(400, 'VALIDATION_ERROR', 'Invalid environment');
                    return;
                }
                $cipher = Crypto::encrypt($value);
                $pdo = Db::pdo();
                $pdo->beginTransaction();
                $stmt = $pdo->prepare('UPDATE payment_gateway_keys SET active=0, revoked_at=NOW(), revoked_by_user_id=? WHERE gateway=? AND environment=? AND key_name=? AND active=1');
                $stmt->execute([$_SESSION['user_id'] ?? null, $gateway, $env, $keyName]);
                $id = $this->id('pgk');
                $stmt = $pdo->prepare('INSERT INTO payment_gateway_keys (id,gateway,environment,key_name,ciphertext,active,created_at,created_by_user_id) VALUES (?,?,?,?,?,1,NOW(),?)');
                $stmt->execute([$id, $gateway, $env, $keyName, $cipher, $_SESSION['user_id'] ?? null]);
                $pdo->commit();
                $this->logAudit($_SESSION['user_id'] ?? null, null, 'ADMIN_SET_GATEWAY_KEY', ['gateway' => $gateway, 'environment' => $env, 'keyName' => $keyName]);
                Response::json(201, ['ok' => true, 'id' => $id]);
                return;
            }

            if ($method === 'PUT' && $path === '/admin/payment-gateways/webhook') {
                return;
            }

            if ($method === 'POST' && $path === '/admin/payment-gateways/webhook/test') {
                Auth::requirePermission('payments.write');
                RateLimit::enforce('admin-test-webhook:' . $ip, 20, 3600);
                $body = $this->jsonBody();
                $gateway = strtoupper(Validation::requireString($body, 'gateway', 2, 20));
                $env = strtoupper(Validation::requireString($body, 'environment', 2, 20));
                if (!in_array($gateway, $this->paymentGateways(), true) || !in_array($env, ['SANDBOX','LIVE'], true)) {
                    Response::error(400, 'VALIDATION_ERROR', 'Invalid gateway/environment');
                    return;
                }
                $stmt = Db::pdo()->prepare('SELECT url,secret_ciphertext,enabled FROM payment_gateway_webhooks WHERE gateway=? AND environment=? LIMIT 1');
                $stmt->execute([$gateway, $env]);
                $row = $stmt->fetch();
                if (!$row || intval($row['enabled'] ?? 0) !== 1) {
                    Response::error(404, 'NOT_FOUND', 'Webhook not configured');
                    return;
                }
                $url = $row['url'];
                $secret = '';
                if (is_string($row['secret_ciphertext'] ?? null) && $row['secret_ciphertext'] !== '') {
                    try {
                        $secret = Crypto::decrypt($row['secret_ciphertext']);
                    } catch (Throwable $e) {
                        $secret = '';
                    }
                }
                $payloadArr = [
                    'event' => 'ReportSheet.test',
                    'gateway' => $gateway,
                    'environment' => $env,
                    'sentAt' => gmdate('c'),
                    'id' => $this->id('evt')
                ];
                $payload = json_encode($payloadArr, JSON_UNESCAPED_SLASHES);
                $sig = $secret !== '' ? hash_hmac('sha256', $payload, $secret) : '';
                $headers = "Content-Type: application/json\r\nUser-Agent: ReportSheet-TestWebhook/1.0\r\n";
                if ($sig !== '') {
                    $headers .= "X-ReportSheet-Signature: " . $sig . "\r\n";
                }
                $ctx = stream_context_create([
                    'http' => [
                        'method' => 'POST',
                        'header' => $headers,
                        'content' => $payload,
                        'timeout' => 6
                    ]
                ]);
                $ok = false;
                $status = null;
                try {
                    $res = @file_get_contents($url, false, $ctx);
                    $ok = $res !== false;
                    $meta = $http_response_header ?? [];
                    if (is_array($meta) && isset($meta[0]) && is_string($meta[0])) {
                        if (preg_match('/\s(\d{3})\s/', $meta[0], $m)) {
                            $status = intval($m[1]);
                        }
                    }
                } catch (Throwable $e) {
                    $ok = false;
                }
                $this->logAudit($_SESSION['user_id'] ?? null, null, 'ADMIN_TEST_WEBHOOK', ['gateway' => $gateway, 'environment' => $env, 'ok' => $ok, 'status' => $status]);
                Response::json(200, ['ok' => $ok, 'status' => $status]);
                return;
            }

            if ($method === 'GET' && $path === '/admin/transactions') {
                Auth::requirePermission('payments.read');
                $provider = isset($_GET['provider']) ? strtoupper(trim(strval($_GET['provider']))) : '';
                $status = isset($_GET['status']) ? strtoupper(trim(strval($_GET['status']))) : '';
                $schoolId = isset($_GET['schoolId']) ? trim(strval($_GET['schoolId'])) : '';
                $from = isset($_GET['from']) ? trim(strval($_GET['from'])) : '';
                $to = isset($_GET['to']) ? trim(strval($_GET['to'])) : '';
                $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 100;
                if ($limit < 1) $limit = 100;
                if ($limit > 500) $limit = 500;
                $where = [];
                $params = [];
                if ($provider !== '' && in_array($provider, array_merge($this->paymentGateways(), ['STRIPE']), true)) {
                    $where[] = 'p.provider = ?';
                    $params[] = $provider;
                }
                if ($status !== '' && in_array($status, ['PENDING','PAID','FAILED','REFUNDED'], true)) {
                    $where[] = 'p.status = ?';
                    $params[] = $status;
                }
                if ($schoolId !== '') {
                    $where[] = 'p.school_id = ?';
                    $params[] = $schoolId;
                }
                if ($from !== '') {
                    $where[] = 'p.created_at >= ?';
                    $params[] = $from;
                }
                if ($to !== '') {
                    $where[] = 'p.created_at <= ?';
                    $params[] = $to;
                }
                $sql = 'SELECT p.id,p.school_id,s.name AS school_name,p.provider,p.status,p.amount_kobo,p.currency,p.reference,p.metadata,p.created_at FROM payments p JOIN schools s ON s.id=p.school_id';
                if ($where) {
                    $sql .= ' WHERE ' . implode(' AND ', $where);
                }
                $sql .= ' ORDER BY p.created_at DESC LIMIT ?';
                $stmt = Db::pdo()->prepare($sql);
                $i = 1;
                foreach ($params as $p) {
                    $stmt->bindValue($i++, $p, PDO::PARAM_STR);
                }
                $stmt->bindValue($i, $limit, PDO::PARAM_INT);
                $stmt->execute();
                $rows = $stmt->fetchAll();
                Response::json(200, [
                    'transactions' => array_map(fn($r) => [
                        'id' => $r['id'],
                        'schoolId' => $r['school_id'],
                        'schoolName' => $r['school_name'],
                        'provider' => $r['provider'],
                        'status' => $r['status'],
                        'amountKobo' => intval($r['amount_kobo']),
                        'currency' => $r['currency'],
                        'reference' => $r['reference'],
                        'metadata' => json_decode($r['metadata'] ?? '[]', true) ?: [],
                        'createdAt' => $r['created_at']
                    ], $rows)
                ]);
                return;
            }

            if ($method === 'GET' && $path === '/admin/plans') {
                Auth::requirePermission('plans.read');
                $stmt = Db::pdo()->query('SELECT id,slug,name,description,status,created_at,updated_at FROM subscription_plans ORDER BY created_at DESC LIMIT 200');
                $plans = $stmt->fetchAll();
                $stmt = Db::pdo()->query('SELECT plan_id,version,config,created_at FROM subscription_plan_versions WHERE is_current=1');
                $curr = [];
                foreach ($stmt->fetchAll() as $v) {
                    $curr[$v['plan_id']] = $v;
                }
                Response::json(200, [
                    'plans' => array_map(function ($p) use ($curr) {
                        $v = $curr[$p['id']] ?? null;
                        return [
                            'id' => $p['id'],
                            'slug' => $p['slug'],
                            'name' => $p['name'],
                            'description' => $p['description'],
                            'status' => $p['status'],
                            'currentVersion' => $v ? intval($v['version']) : null,
                            'currentConfig' => $v ? (json_decode($v['config'] ?? '[]', true) ?: []) : null,
                            'createdAt' => $p['created_at'],
                            'updatedAt' => $p['updated_at']
                        ];
                    }, $plans)
                ]);
                return;
            }

            if ($method === 'POST' && $path === '/admin/plans') {
                Auth::requirePermission('plans.write');
                RateLimit::enforce('admin-create-plan:' . $ip, 40, 3600);
                $body = $this->jsonBody();
                $slug = strtolower(trim(Validation::requireString($body, 'slug', 2, 80)));
                $name = Validation::requireString($body, 'name', 2, 160);
                $description = isset($body['description']) ? strval($body['description']) : null;
                $config = $body['config'] ?? null;
                if (!preg_match('/^[a-z0-9][a-z0-9\\-]*[a-z0-9]$/', $slug)) {
                    Response::error(400, 'VALIDATION_ERROR', 'Invalid slug');
                    return;
                }
                if ($config !== null && !is_array($config)) {
                    Response::error(400, 'VALIDATION_ERROR', 'config must be an object');
                    return;
                }
                if ($config === null) {
                    $config = [
                        'billing' => ['currency' => 'NGN', 'monthlyKobo' => 0, 'annualKobo' => 0, 'setupFeeKobo' => 0],
                        'trialDays' => 0,
                        'features' => [],
                        'limits' => ['students' => null, 'staff' => null, 'storageMb' => null, 'smsCredits' => null],
                        'proration' => ['mode' => 'NONE']
                    ];
                }
                $pdo = Db::pdo();
                $stmt = $pdo->prepare('SELECT id FROM subscription_plans WHERE slug=? LIMIT 1');
                $stmt->execute([$slug]);
                if ($stmt->fetch()) {
                    Response::error(400, 'DUPLICATE', 'Plan slug already exists');
                    return;
                }
                $planId = $this->id('pln');
                $versionId = $this->id('plv');
                $pdo->beginTransaction();
                $stmt = $pdo->prepare('INSERT INTO subscription_plans (id,slug,name,description,status,created_at,created_by_user_id) VALUES (?,?,?,?,?,NOW(),?)');
                $stmt->execute([$planId, $slug, $name, $description, 'ACTIVE', $_SESSION['user_id'] ?? null]);
                $stmt = $pdo->prepare('INSERT INTO subscription_plan_versions (id,plan_id,version,config,is_current,created_at,created_by_user_id) VALUES (?,?,?,?,1,NOW(),?)');
                $stmt->execute([$versionId, $planId, 1, json_encode($config, JSON_UNESCAPED_SLASHES), $_SESSION['user_id'] ?? null]);
                $pdo->commit();
                $this->logAudit($_SESSION['user_id'] ?? null, null, 'ADMIN_CREATE_PLAN', ['planId' => $planId, 'slug' => $slug]);
                Response::json(201, ['id' => $planId]);
                return;
            }

            if ($method === 'GET' && preg_match('#^/admin/plans/([^/]+)$#', $path, $m)) {
                Auth::requirePermission('plans.read');
                $id = $m[1];
                $stmt = Db::pdo()->prepare('SELECT id,slug,name,description,status,created_at,updated_at FROM subscription_plans WHERE id=? LIMIT 1');
                $stmt->execute([$id]);
                $p = $stmt->fetch();
                if (!$p) {
                    Response::error(404, 'NOT_FOUND', 'Not found');
                    return;
                }
                $stmt = Db::pdo()->prepare('SELECT id,version,config,is_current,created_at,rolled_back_from_version_id FROM subscription_plan_versions WHERE plan_id=? ORDER BY version DESC LIMIT 50');
                $stmt->execute([$id]);
                $versions = $stmt->fetchAll();
                $current = null;
                foreach ($versions as $v) {
                    if (intval($v['is_current'] ?? 0) === 1) {
                        $current = $v;
                        break;
                    }
                }
                Response::json(200, [
                    'plan' => [
                        'id' => $p['id'],
                        'slug' => $p['slug'],
                        'name' => $p['name'],
                        'description' => $p['description'],
                        'status' => $p['status'],
                        'createdAt' => $p['created_at'],
                        'updatedAt' => $p['updated_at']
                    ],
                    'current' => $current ? ['version' => intval($current['version']), 'config' => json_decode($current['config'] ?? '[]', true) ?: [], 'createdAt' => $current['created_at']] : null,
                    'versions' => array_map(fn($v) => [
                        'id' => $v['id'],
                        'version' => intval($v['version']),
                        'isCurrent' => intval($v['is_current'] ?? 0) === 1,
                        'rolledBackFromVersionId' => $v['rolled_back_from_version_id'],
                        'config' => json_decode($v['config'] ?? '[]', true) ?: [],
                        'createdAt' => $v['created_at']
                    ], $versions)
                ]);
                return;
            }

            if ($method === 'POST' && preg_match('#^/admin/plans/([^/]+)/versions$#', $path, $m)) {
                Auth::requirePermission('plans.write');
                RateLimit::enforce('admin-plan-version:' . $ip, 60, 3600);
                $planId = $m[1];
                $body = $this->jsonBody();
                $config = $body['config'] ?? null;
                if (!is_array($config)) {
                    Response::error(400, 'VALIDATION_ERROR', 'config must be an object');
                    return;
                }
                $pdo = Db::pdo();
                $stmt = $pdo->prepare('SELECT id FROM subscription_plans WHERE id=? LIMIT 1');
                $stmt->execute([$planId]);
                if (!$stmt->fetch()) {
                    Response::error(404, 'NOT_FOUND', 'Not found');
                    return;
                }
                $stmt = $pdo->prepare('SELECT MAX(version) AS v FROM subscription_plan_versions WHERE plan_id=?');
                $stmt->execute([$planId]);
                $max = intval(($stmt->fetch()['v'] ?? 0));
                $next = $max + 1;
                $pdo->beginTransaction();
                $pdo->prepare('UPDATE subscription_plan_versions SET is_current=0 WHERE plan_id=?')->execute([$planId]);
                $id = $this->id('plv');
                $stmt = $pdo->prepare('INSERT INTO subscription_plan_versions (id,plan_id,version,config,is_current,created_at,created_by_user_id) VALUES (?,?,?,?,1,NOW(),?)');
                $stmt->execute([$id, $planId, $next, json_encode($config, JSON_UNESCAPED_SLASHES), $_SESSION['user_id'] ?? null]);
                $pdo->prepare('UPDATE subscription_plans SET updated_at=NOW() WHERE id=?')->execute([$planId]);
                $pdo->commit();
                $this->logAudit($_SESSION['user_id'] ?? null, null, 'ADMIN_CREATE_PLAN_VERSION', ['planId' => $planId, 'version' => $next]);
                Response::json(201, ['id' => $id, 'version' => $next]);
                return;
            }

            if ($method === 'POST' && preg_match('#^/admin/plans/([^/]+)/rollback$#', $path, $m)) {
                Auth::requirePermission('plans.write');
                RateLimit::enforce('admin-plan-rollback:' . $ip, 30, 3600);
                $planId = $m[1];
                $body = $this->jsonBody();
                $version = intval($body['version'] ?? 0);
                if ($version < 1) {
                    Response::error(400, 'VALIDATION_ERROR', 'Invalid version');
                    return;
                }
                $pdo = Db::pdo();
                $stmt = $pdo->prepare('SELECT id,config FROM subscription_plan_versions WHERE plan_id=? AND version=? LIMIT 1');
                $stmt->execute([$planId, $version]);
                $target = $stmt->fetch();
                if (!$target) {
                    Response::error(404, 'NOT_FOUND', 'Version not found');
                    return;
                }
                $cfg = json_decode($target['config'] ?? '[]', true);
                if (!is_array($cfg)) {
                    $cfg = [];
                }
                $stmt = $pdo->prepare('SELECT MAX(version) AS v FROM subscription_plan_versions WHERE plan_id=?');
                $stmt->execute([$planId]);
                $max = intval(($stmt->fetch()['v'] ?? 0));
                $next = $max + 1;
                $pdo->beginTransaction();
                $pdo->prepare('UPDATE subscription_plan_versions SET is_current=0 WHERE plan_id=?')->execute([$planId]);
                $id = $this->id('plv');
                $stmt = $pdo->prepare('INSERT INTO subscription_plan_versions (id,plan_id,version,config,is_current,created_at,created_by_user_id,rolled_back_from_version_id) VALUES (?,?,?,?,1,NOW(),?,?)');
                $stmt->execute([$id, $planId, $next, json_encode($cfg, JSON_UNESCAPED_SLASHES), $_SESSION['user_id'] ?? null, $target['id']]);
                $pdo->prepare('UPDATE subscription_plans SET updated_at=NOW() WHERE id=?')->execute([$planId]);
                $pdo->commit();
                $this->logAudit($_SESSION['user_id'] ?? null, null, 'ADMIN_ROLLBACK_PLAN', ['planId' => $planId, 'toVersion' => $version, 'newVersion' => $next]);
                Response::json(200, ['ok' => true, 'version' => $next]);
                return;
            }

            if ($method === 'GET' && $path === '/admin/coupons') {
                Auth::requirePermission('coupons.read');
                $status = isset($_GET['status']) ? strtoupper(trim(strval($_GET['status']))) : '';
                $q = isset($_GET['q']) ? strtoupper(trim(strval($_GET['q']))) : '';
                $where = [];
                $params = [];
                if ($q !== '') {
                    $where[] = 'code LIKE ?';
                    $params[] = '%' . $q . '%';
                }
                if (in_array($status, ['ACTIVE','DISABLED'], true)) {
                    $where[] = 'status=?';
                    $params[] = $status;
                }
                $sql = 'SELECT id,code,discount_type,percent,amount_kobo,currency,applies_plan_id,max_redemptions,redeemed_count,starts_at,ends_at,status,created_at FROM coupons';
                if ($where) {
                    $sql .= ' WHERE ' . implode(' AND ', $where);
                }
                $sql .= ' ORDER BY created_at DESC LIMIT 200';
                $stmt = Db::pdo()->prepare($sql);
                $stmt->execute($params);
                $rows = $stmt->fetchAll();
                Response::json(200, ['coupons' => array_map(fn($c) => [
                    'id' => $c['id'],
                    'code' => $c['code'],
                    'discountType' => $c['discount_type'],
                    'percent' => $c['percent'] !== null ? intval($c['percent']) : null,
                    'amountKobo' => $c['amount_kobo'] !== null ? intval($c['amount_kobo']) : null,
                    'currency' => $c['currency'],
                    'appliesPlanId' => $c['applies_plan_id'],
                    'maxRedemptions' => $c['max_redemptions'] !== null ? intval($c['max_redemptions']) : null,
                    'redeemedCount' => intval($c['redeemed_count'] ?? 0),
                    'startsAt' => $c['starts_at'],
                    'endsAt' => $c['ends_at'],
                    'status' => $c['status'],
                    'createdAt' => $c['created_at']
                ], $rows)]);
                return;
            }

            if ($method === 'POST' && $path === '/admin/coupons') {
                Auth::requirePermission('coupons.write');
                RateLimit::enforce('admin-create-coupon:' . $ip, 60, 3600);
                $body = $this->jsonBody();
                $code = strtoupper(trim(Validation::requireString($body, 'code', 3, 60)));
                $discountType = strtoupper(trim(Validation::requireString($body, 'discountType', 4, 10)));
                $percent = isset($body['percent']) ? intval($body['percent']) : null;
                $amountKobo = isset($body['amountKobo']) ? intval($body['amountKobo']) : null;
                $currency = isset($body['currency']) ? trim(strval($body['currency'])) : 'NGN';
                $appliesPlanId = isset($body['appliesPlanId']) ? trim(strval($body['appliesPlanId'])) : null;
                $maxRedemptions = isset($body['maxRedemptions']) ? intval($body['maxRedemptions']) : null;
                $startsAt = isset($body['startsAt']) ? trim(strval($body['startsAt'])) : null;
                $endsAt = isset($body['endsAt']) ? trim(strval($body['endsAt'])) : null;
                if (!preg_match('/^[A-Z0-9\\-]+$/', $code)) {
                    Response::error(400, 'VALIDATION_ERROR', 'Invalid code');
                    return;
                }
                if (!in_array($discountType, ['PERCENT','AMOUNT'], true)) {
                    Response::error(400, 'VALIDATION_ERROR', 'Invalid discountType');
                    return;
                }
                if ($discountType === 'PERCENT') {
                    if ($percent === null || $percent < 1 || $percent > 90) {
                        Response::error(400, 'VALIDATION_ERROR', 'Invalid percent');
                        return;
                    }
                    $amountKobo = null;
                } else {
                    if ($amountKobo === null || $amountKobo < 100) {
                        Response::error(400, 'VALIDATION_ERROR', 'Invalid amountKobo');
                        return;
                    }
                    $percent = null;
                }
                $pdo = Db::pdo();
                $stmt = $pdo->prepare('SELECT id FROM coupons WHERE code=? LIMIT 1');
                $stmt->execute([$code]);
                if ($stmt->fetch()) {
                    Response::error(400, 'DUPLICATE', 'Coupon already exists');
                    return;
                }
                $id = $this->id('cpn');
                $stmt = $pdo->prepare('INSERT INTO coupons (id,code,discount_type,percent,amount_kobo,currency,applies_plan_id,max_redemptions,redeemed_count,starts_at,ends_at,status,created_at,created_by_user_id) VALUES (?,?,?,?,?,?,?,?,0,?,?,?,NOW(),?)');
                $stmt->execute([$id, $code, $discountType, $percent, $amountKobo, $currency, $appliesPlanId, $maxRedemptions, $startsAt, $endsAt, 'ACTIVE', $_SESSION['user_id'] ?? null]);
                $this->logAudit($_SESSION['user_id'] ?? null, null, 'ADMIN_CREATE_COUPON', ['couponId' => $id, 'code' => $code]);
                Response::json(201, ['id' => $id]);
                return;
            }

            if ($method === 'PATCH' && preg_match('#^/admin/coupons/([^/]+)$#', $path, $m)) {
                Auth::requirePermission('coupons.write');
                $id = $m[1];
                $body = $this->jsonBody();
                $status = isset($body['status']) ? strtoupper(trim(strval($body['status']))) : null;
                $maxRedemptions = array_key_exists('maxRedemptions', $body) ? $body['maxRedemptions'] : null;
                $startsAt = array_key_exists('startsAt', $body) ? strval($body['startsAt']) : null;
                $endsAt = array_key_exists('endsAt', $body) ? strval($body['endsAt']) : null;
                $set = [];
                $vals = [];
                if ($status !== null) {
                    if (!in_array($status, ['ACTIVE','DISABLED'], true)) {
                        Response::error(400, 'VALIDATION_ERROR', 'Invalid status');
                        return;
                    }
                    $set[] = 'status=?';
                    $vals[] = $status;
                }
                if ($maxRedemptions !== null) {
                    $set[] = 'max_redemptions=?';
                    $vals[] = $maxRedemptions === '' ? null : intval($maxRedemptions);
                }
                if ($startsAt !== null) {
                    $set[] = 'starts_at=?';
                    $vals[] = $startsAt === '' ? null : $startsAt;
                }
                if ($endsAt !== null) {
                    $set[] = 'ends_at=?';
                    $vals[] = $endsAt === '' ? null : $endsAt;
                }
                if (!$set) {
                    Response::error(400, 'NO_CHANGES', 'No changes specified.');
                    return;
                }
                $vals[] = $id;
                $stmt = Db::pdo()->prepare('UPDATE coupons SET ' . implode(',', $set) . ' WHERE id=?');
                $stmt->execute($vals);
                $this->logAudit($_SESSION['user_id'] ?? null, null, 'ADMIN_UPDATE_COUPON', ['couponId' => $id]);
                Response::json(200, ['ok' => true]);
                return;
            }

            if ($method === 'DELETE' && preg_match('#^/admin/coupons/([^/]+)$#', $path, $m)) {
                Auth::requirePermission('coupons.write');
                $id = $m[1];
                Db::pdo()->prepare('DELETE FROM coupons WHERE id=?')->execute([$id]);
                $this->logAudit($_SESSION['user_id'] ?? null, null, 'ADMIN_DELETE_COUPON', ['couponId' => $id]);
                Response::noContent();
                return;
            }

            if ($method === 'GET' && $path === '/admin/schools') {
                Auth::requirePermission('schools.read');
                $pdo = Db::pdo();
                $q = isset($_GET['q']) ? trim(strval($_GET['q'])) : '';
                $plan = isset($_GET['plan']) ? strtoupper(trim(strval($_GET['plan']))) : '';
                $status = isset($_GET['status']) ? strtoupper(trim(strval($_GET['status']))) : '';
                $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 500;
                $offset = isset($_GET['offset']) ? intval($_GET['offset']) : 0;
                if ($limit < 1) $limit = 100;
                if ($limit > 500) $limit = 500;
                if ($offset < 0) $offset = 0;

                $where = [];
                $params = [];
                $includeDeleted = (isset($_GET['includeDeleted']) && strval($_GET['includeDeleted']) === 'true');
                if (!$includeDeleted) {
                    $where[] = 's.deleted_at IS NULL';
                }
                if ($q !== '') {
                    $where[] = '(s.name LIKE ? OR u.email LIKE ? OR s.abbr LIKE ?)';
                    $like = '%' . $q . '%';
                    $params[] = $like;
                    $params[] = $like;
                    $params[] = $like;
                }
                if (in_array($plan, ['LIFETIME','TRIAL','STARTER','PRO'], true)) {
                    $where[] = 's.plan = ?';
                    $params[] = $plan;
                }
                if (in_array($status, ['ACTIVE','SUSPENDED'], true)) {
                    $where[] = 'u.status = ?';
                    $params[] = $status;
                }
                $sql = 'SELECT s.id,s.name,s.abbr,s.plan,s.created_at,u.id AS owner_id,u.email,u.status,u.role,u.force_password_change,u.last_login_at,u.created_at AS owner_created_at FROM schools s JOIN users u ON u.id=s.owner_id';
                if ($where) {
                    $sql .= ' WHERE ' . implode(' AND ', $where);
                }
                $sql .= ' ORDER BY s.created_at DESC LIMIT ? OFFSET ?';
                $stmt = $pdo->prepare($sql);
                $i = 1;
                foreach ($params as $p) {
                    $stmt->bindValue($i++, $p, PDO::PARAM_STR);
                }
                $stmt->bindValue($i++, $limit, PDO::PARAM_INT);
                $stmt->bindValue($i++, $offset, PDO::PARAM_INT);
                $stmt->execute();
                $rows = $stmt->fetchAll();
                $counts = $pdo->query('SELECT school_id, COUNT(*) AS c FROM students GROUP BY school_id')->fetchAll();
                $bySchool = [];
                foreach ($counts as $c) {
                    $bySchool[$c['school_id']] = intval($c['c']);
                }
                $scored = $pdo->query('SELECT school_id, COUNT(*) AS c FROM score_sheets GROUP BY school_id')->fetchAll();
                $byScored = [];
                foreach ($scored as $c) {
                    $byScored[$c['school_id']] = intval($c['c']);
                }
                $out = [];
                foreach ($rows as $r) {
                    $out[] = [
                        'id' => $r['id'],
                        'name' => $r['name'],
                        'abbr' => $r['abbr'],
                        'plan' => $r['plan'],
                        'createdAt' => $r['created_at'],
                        'owner' => [
                            'id' => $r['owner_id'],
                            'email' => $r['email'],
                            'role' => $r['role'],
                            'status' => $r['status'],
                            'forcePasswordChange' => intval($r['force_password_change'] ?? 0) === 1,
                            'lastLoginAt' => $r['last_login_at'],
                            'createdAt' => $r['owner_created_at']
                        ],
                        'studentCount' => $bySchool[$r['id']] ?? 0,
                        'scoredCount' => $byScored[$r['id']] ?? 0
                    ];
                }
                Response::json(200, ['schools' => $out]);
                return;
            }

            if ($method === 'POST' && $path === '/admin/schools/create') {
                Auth::requirePermission('schools.write');
                RateLimit::enforce('admin-create-school:' . $ip, 60, 3600);
                $body = $this->jsonBody();
                $schoolName = Validation::requireString($body, 'schoolName', 2, 160);
                $email = Validation::requireEmail($body, 'email');
                $phone = isset($body['phone']) ? trim(strval($body['phone'])) : null;
                $address = isset($body['address']) ? strval($body['address']) : null;
                $subdomain = isset($body['subdomain']) ? trim(strval($body['subdomain'])) : null;
                $logoUrl = isset($body['logoUrl']) ? trim(strval($body['logoUrl'])) : null;
                $plan = isset($body['plan']) ? strtoupper(trim(strval($body['plan']))) : 'LIFETIME';
                if (!in_array($plan, ['LIFETIME','TRIAL','STARTER','PRO'], true)) {
                    $plan = 'LIFETIME';
                }
                if ($subdomain !== null && $subdomain !== '' && !preg_match('/^[a-z0-9][a-z0-9\\-]{1,62}[a-z0-9]$/', strtolower($subdomain))) {
                    Response::error(400, 'VALIDATION_ERROR', 'Invalid subdomain');
                    return;
                }
                $password = isset($body['password']) ? strval($body['password']) : $this->randomPassword();
                if (mb_strlen($password) < 12) {
                    Response::error(400, 'VALIDATION_ERROR', 'Password must be at least 12 characters');
                    return;
                }
                if ($this->findUserByEmail($email)) {
                    Response::error(400, 'EMAIL_IN_USE', 'An account with this email already exists.');
                    return;
                }
                $uid = $this->id('usr');
                $sid = $this->id('sch');
                $hash = Auth::hashPassword($password);
                $abbr = strtoupper(substr(preg_replace('/[^A-Za-z0-9]/', '', implode('', array_map(fn($w) => mb_substr($w, 0, 1), preg_split('/\s+/', $schoolName) ?: []))), 0, 3));
                if ($abbr === '') {
                    $abbr = 'SCH';
                }
                $subjects = json_encode(["Mathematics","English Language","Basic Science","Social Studies","Business Studies","Civic Education","Agricultural Science","Physical Education"]);
                $grades = json_encode([
                    ['min'=>75,'max'=>100,'grade'=>'A','remark'=>'Distinction','color'=>'#155724'],
                    ['min'=>65,'max'=>74,'grade'=>'B','remark'=>'Credit','color'=>'#0c5460'],
                    ['min'=>50,'max'=>64,'grade'=>'C','remark'=>'Merit','color'=>'#856404'],
                    ['min'=>40,'max'=>49,'grade'=>'D','remark'=>'Pass','color'=>'#884510'],
                    ['min'=>0,'max'=>39,'grade'=>'F','remark'=>'Fail','color'=>'#721c24']
                ]);
                $pdo = Db::pdo();
                $pdo->beginTransaction();
                $stmt = $pdo->prepare('INSERT INTO users (id,email,password_hash,role,status,phone,force_password_change,created_at) VALUES (?,?,?,?,?,?,1,NOW())');
                $stmt->execute([$uid, $email, $hash, 'SCHOOL', 'ACTIVE', $phone]);
                $stmt = $pdo->prepare('INSERT INTO schools (id,owner_id,name,abbr,address,plan,subjects,grades,ca1_max,ca2_max,exam_max,timezone,locale,currency,subdomain,logo_url,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,NOW())');
                $stmt->execute([$sid, $uid, $schoolName, $abbr, $address, $plan, $subjects, $grades, 10, 10, 80, null, null, 'NGN', $subdomain, $logoUrl]);
                $pdo->commit();
                $this->logAudit($_SESSION['user_id'] ?? null, $sid, 'ADMIN_CREATE_SCHOOL', ['schoolName' => $schoolName, 'email' => $email, 'plan' => $plan]);
                Response::json(201, ['schoolId' => $sid, 'ownerUserId' => $uid, 'temporaryPassword' => $password]);
                return;
            }

            if ($method === 'POST' && $path === '/admin/schools/import-csv') {
                Auth::requirePermission('schools.write');
                RateLimit::enforce('admin-import-schools:' . $ip, 10, 3600);
                $body = $this->jsonBody();
                $csv = isset($body['csv']) ? strval($body['csv']) : '';
                if (trim($csv) === '') {
                    Response::error(400, 'VALIDATION_ERROR', 'csv required');
                    return;
                }
                $lines = preg_split("/\\r\\n|\\n|\\r/", trim($csv)) ?: [];
                $lines = array_slice($lines, 0, 1000);
                $created = 0;
                $errors = [];
                foreach ($lines as $idx => $line) {
                    $parts = str_getcsv($line);
                    $schoolName = trim(strval($parts[0] ?? ''));
                    $email = strtolower(trim(strval($parts[1] ?? '')));
                    $plan = strtoupper(trim(strval($parts[2] ?? 'LIFETIME')));
                    $phone = trim(strval($parts[3] ?? ''));
                    $address = trim(strval($parts[4] ?? ''));
                    if ($schoolName === '' || $email === '') {
                        $errors[] = ['line' => $idx + 1, 'error' => 'Missing schoolName/email'];
                        continue;
                    }
                    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                        $errors[] = ['line' => $idx + 1, 'error' => 'Invalid email'];
                        continue;
                    }
                    if (!in_array($plan, ['LIFETIME','TRIAL','STARTER','PRO'], true)) {
                        $plan = 'LIFETIME';
                    }
                    if ($this->findUserByEmail($email)) {
                        $errors[] = ['line' => $idx + 1, 'error' => 'Duplicate email'];
                        continue;
                    }
                    $pwd = $this->randomPassword();
                    $uid = $this->id('usr');
                    $sid = $this->id('sch');
                    $hash = Auth::hashPassword($pwd);
                    $abbr = strtoupper(substr(preg_replace('/[^A-Za-z0-9]/', '', implode('', array_map(fn($w) => mb_substr($w, 0, 1), preg_split('/\s+/', $schoolName) ?: []))), 0, 3));
                    if ($abbr === '') $abbr = 'SCH';
                    $subjects = json_encode(["Mathematics","English Language","Basic Science","Social Studies","Business Studies","Civic Education","Agricultural Science","Physical Education"]);
                    $grades = json_encode([
                        ['min'=>75,'max'=>100,'grade'=>'A','remark'=>'Distinction','color'=>'#155724'],
                        ['min'=>65,'max'=>74,'grade'=>'B','remark'=>'Credit','color'=>'#0c5460'],
                        ['min'=>50,'max'=>64,'grade'=>'C','remark'=>'Merit','color'=>'#856404'],
                        ['min'=>40,'max'=>49,'grade'=>'D','remark'=>'Pass','color'=>'#884510'],
                        ['min'=>0,'max'=>39,'grade'=>'F','remark'=>'Fail','color'=>'#721c24']
                    ]);
                    try {
                        $pdo = Db::pdo();
                        $pdo->beginTransaction();
                        $pdo->prepare('INSERT INTO users (id,email,password_hash,role,status,phone,force_password_change,created_at) VALUES (?,?,?,?,?,?,1,NOW())')->execute([$uid, $email, $hash, 'SCHOOL', 'ACTIVE', $phone !== '' ? $phone : null]);
                        $pdo->prepare('INSERT INTO schools (id,owner_id,name,abbr,address,plan,subjects,grades,ca1_max,ca2_max,exam_max,currency,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,\'NGN\',NOW())')->execute([$sid, $uid, $schoolName, $abbr, $address !== '' ? $address : null, $plan, $subjects, $grades, 10, 10, 80]);
                        $pdo->commit();
                        $created += 1;
                    } catch (Throwable $e) {
                        try { Db::pdo()->rollBack(); } catch (Throwable $e2) {}
                        $errors[] = ['line' => $idx + 1, 'error' => 'Insert failed'];
                        continue;
                    }
                }
                $this->logAudit($_SESSION['user_id'] ?? null, null, 'ADMIN_IMPORT_SCHOOLS', ['created' => $created, 'errors' => count($errors)]);
                Response::json(201, ['created' => $created, 'errors' => $errors]);
                return;
            }

            if ($method === 'GET' && preg_match('#^/admin/schools/([^/]+)$#', $path, $m)) {
                Auth::requirePermission('schools.read');
                $id = $m[1];
                $pdo = Db::pdo();
                $stmt = $pdo->prepare('SELECT s.*,u.email AS owner_email,u.status AS owner_status,u.role AS owner_role,u.force_password_change AS owner_force_password_change,u.last_login_at AS owner_last_login_at,u.created_at AS owner_created_at FROM schools s JOIN users u ON u.id=s.owner_id WHERE s.id=? LIMIT 1');
                $stmt->execute([$id]);
                $r = $stmt->fetch();
                if (!$r) {
                    Response::error(404, 'NOT_FOUND', 'Not found');
                    return;
                }
                $stmt = $pdo->prepare('SELECT COUNT(*) AS c FROM students WHERE school_id=?');
                $stmt->execute([$id]);
                $studentCount = intval(($stmt->fetch()['c'] ?? 0));
                $stmt = $pdo->prepare('SELECT COUNT(*) AS c FROM score_sheets WHERE school_id=?');
                $stmt->execute([$id]);
                $scoredCount = intval(($stmt->fetch()['c'] ?? 0));
                $school = $this->schoolToApi($r);
                $school['require2fa'] = intval($r['require_2fa'] ?? 0) === 1;
                $school['deletedAt'] = $r['deleted_at'] ?? null;
                $school['owner'] = [
                    'id' => $r['owner_id'],
                    'email' => $r['owner_email'],
                    'status' => $r['owner_status'],
                    'role' => $r['owner_role'],
                    'forcePasswordChange' => intval($r['owner_force_password_change'] ?? 0) === 1,
                    'lastLoginAt' => $r['owner_last_login_at'],
                    'createdAt' => $r['owner_created_at']
                ];
                Response::json(200, [
                    'school' => $school,
                    'stats' => ['studentCount' => $studentCount, 'scoredCount' => $scoredCount]
                ]);
                return;
            }

            if ($method === 'PATCH' && preg_match('#^/admin/schools/([^/]+)$#', $path, $m)) {
                Auth::requirePermission('schools.write');
                $id = $m[1];
                $body = $this->jsonBody();
                $plan = $body['plan'] ?? null;
                $status = $body['status'] ?? null;
                $pdo = Db::pdo();
                $school = $pdo->prepare('SELECT id,owner_id FROM schools WHERE id=?');
                $school->execute([$id]);
                $sc = $school->fetch();
                if (!$sc) {
                    Response::error(404, 'NOT_FOUND', 'Not found');
                    return;
                }
                if (is_string($plan)) {
                    $plan = strtoupper(trim($plan));
                    if (!in_array($plan, ['LIFETIME','TRIAL','STARTER','PRO'], true)) {
                        Response::error(400, 'VALIDATION_ERROR', 'Invalid plan');
                        return;
                    }
                    $stmt = $pdo->prepare('UPDATE schools SET plan=? WHERE id=?');
                    $stmt->execute([$plan, $id]);
                    $this->upsertSchoolSubscriptionFromLegacyPlan($id, $plan);
                    $this->logAudit($_SESSION['user_id'] ?? null, $id, 'ADMIN_UPDATE_SCHOOL_PLAN', ['plan' => $plan]);
                }
                if (is_string($status)) {
                    $status = strtoupper(trim($status));
                    if (!in_array($status, ['ACTIVE','SUSPENDED'], true)) {
                        Response::error(400, 'VALIDATION_ERROR', 'Invalid status');
                        return;
                    }
                    $stmt = $pdo->prepare('UPDATE users SET status=? WHERE id=?');
                    $stmt->execute([$status, $sc['owner_id']]);
                    $this->logAudit($_SESSION['user_id'] ?? null, $id, 'ADMIN_UPDATE_SCHOOL_STATUS', ['status' => $status]);
                }
                Response::json(200, ['ok' => true]);
                return;
            }

            if ($method === 'GET' && preg_match('#^/admin/schools/([^/]+)/subscription$#', $path, $m)) {
                Auth::requirePermission('schools.read');
                $id = $m[1];
                $stmt = Db::pdo()->prepare('SELECT ss.*,sp.slug AS plan_slug,sp.name AS plan_name,spv.version AS plan_version,spv.config AS plan_config FROM school_subscriptions ss JOIN subscription_plans sp ON sp.id=ss.plan_id JOIN subscription_plan_versions spv ON spv.id=ss.plan_version_id WHERE ss.school_id=? LIMIT 1');
                $stmt->execute([$id]);
                $row = $stmt->fetch();
                if (!$row) {
                    Response::json(200, ['subscription' => null]);
                    return;
                }
                Response::json(200, ['subscription' => [
                    'id' => $row['id'],
                    'schoolId' => $row['school_id'],
                    'status' => $row['status'],
                    'billingCycle' => $row['billing_cycle'],
                    'currentAmountKobo' => intval($row['current_amount_kobo']),
                    'currency' => $row['currency'],
                    'currentPeriodStart' => $row['current_period_start'],
                    'currentPeriodEnd' => $row['current_period_end'],
                    'trialEnd' => $row['trial_end'],
                    'cancelAtPeriodEnd' => intval($row['cancel_at_period_end'] ?? 0) === 1,
                    'plan' => [
                        'id' => $row['plan_id'],
                        'slug' => $row['plan_slug'],
                        'name' => $row['plan_name'],
                        'version' => intval($row['plan_version']),
                        'config' => json_decode($row['plan_config'] ?? '[]', true) ?: []
                    ],
                    'pending' => ($row['pending_plan_id'] ?? null) ? [
                        'planId' => $row['pending_plan_id'],
                        'planVersionId' => $row['pending_plan_version_id'],
                        'effectiveAt' => $row['pending_effective_at']
                    ] : null
                ]]);
                return;
            }

            if ($method === 'POST' && preg_match('#^/admin/schools/([^/]+)/subscribe$#', $path, $m)) {
                Auth::requirePermission('schools.write');
                RateLimit::enforce('admin-subscribe:' . $ip, 60, 3600);
                $schoolId = $m[1];
                $body = $this->jsonBody();
                $planSlug = strtolower(trim(Validation::requireString($body, 'planSlug', 2, 80)));
                $billingCycle = strtoupper(trim(strval($body['billingCycle'] ?? 'MONTHLY')));
                $changeMode = strtoupper(trim(strval($body['changeMode'] ?? 'IMMEDIATE')));
                $couponCode = isset($body['couponCode']) ? strtoupper(trim(strval($body['couponCode']))) : '';
                if (!in_array($billingCycle, ['MONTHLY','ANNUAL'], true)) {
                    Response::error(400, 'VALIDATION_ERROR', 'Invalid billingCycle');
                    return;
                }
                if (!in_array($changeMode, ['IMMEDIATE','NEXT_PERIOD'], true)) {
                    Response::error(400, 'VALIDATION_ERROR', 'Invalid changeMode');
                    return;
                }
                $plan = $this->getPlanBySlugCurrent($planSlug);
                if (!$plan) {
                    Response::error(404, 'NOT_FOUND', 'Plan not found');
                    return;
                }
                $pdo = Db::pdo();
                $stmt = $pdo->prepare('SELECT id FROM schools WHERE id=? LIMIT 1');
                $stmt->execute([$schoolId]);
                if (!$stmt->fetch()) {
                    Response::error(404, 'NOT_FOUND', 'School not found');
                    return;
                }
                $stmt = $pdo->prepare('SELECT * FROM school_subscriptions WHERE school_id=? LIMIT 1');
                $stmt->execute([$schoolId]);
                $sub = $stmt->fetch();
                $now = gmdate('Y-m-d H:i:s');
                $newAmount = $this->planPriceKobo($plan['config'], $billingCycle);
                $currency = $this->planCurrency($plan['config']);
                $eventType = $sub ? 'SUBSCRIPTION_CHANGE' : 'SUBSCRIPTION_CREATE';
                $data = ['planSlug' => $planSlug, 'billingCycle' => $billingCycle, 'changeMode' => $changeMode];
                $pdo->beginTransaction();
                if (!$sub) {
                    $trialDays = intval($plan['config']['trialDays'] ?? 0);
                    $status = $trialDays > 0 ? 'TRIALING' : 'ACTIVE';
                    $trialEnd = $trialDays > 0 ? gmdate('Y-m-d H:i:s', time() + ($trialDays * 86400)) : null;
                    $start = $now;
                    $end = $this->periodEndUtc($start, $billingCycle);
                    $id = $this->id('sub');
                    $stmt = $pdo->prepare('INSERT INTO school_subscriptions (id,school_id,plan_id,plan_version_id,status,billing_cycle,current_amount_kobo,currency,current_period_start,current_period_end,trial_end,cancel_at_period_end,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,NOW(),NOW())');
                    $stmt->execute([$id, $schoolId, $plan['planId'], $plan['versionId'], $status, $billingCycle, $newAmount, $currency, $start, $end, $trialEnd, 0]);
                    $data['subscriptionId'] = $id;
                    $data['trialEnd'] = $trialEnd;
                } else {
                    if ($changeMode === 'NEXT_PERIOD') {
                        $stmt = $pdo->prepare('UPDATE school_subscriptions SET pending_plan_id=?, pending_plan_version_id=?, pending_effective_at=current_period_end, updated_at=NOW() WHERE school_id=?');
                        $stmt->execute([$plan['planId'], $plan['versionId'], $schoolId]);
                        $data['pendingEffectiveAt'] = $sub['current_period_end'];
                    } else {
                        $oldAmount = intval($sub['current_amount_kobo'] ?? 0);
                        $oldCycle = strval($sub['billing_cycle'] ?? 'MONTHLY');
                        $oldEnd = strval($sub['current_period_end'] ?? $now);
                        $proration = $this->computeProrationKobo($oldAmount, $newAmount, $oldCycle, $oldEnd, $now);
                        $discount = 0;
                        $couponId = null;
                        if ($couponCode !== '' && $proration > 0) {
                            $applied = $this->redeemCoupon($couponCode, $schoolId, $plan['planId'], $proration, $currency, $_SESSION['user_id'] ?? null);
                            $discount = intval($applied['discountKobo'] ?? 0);
                            $couponId = $applied['couponId'] ?? null;
                        }
                        $due = max(0, $proration - $discount);
                        $start = $now;
                        $end = $this->periodEndUtc($start, $billingCycle);
                        $stmt = $pdo->prepare('UPDATE school_subscriptions SET plan_id=?, plan_version_id=?, status=\'ACTIVE\', billing_cycle=?, current_amount_kobo=?, currency=?, current_period_start=?, current_period_end=?, pending_plan_id=NULL, pending_plan_version_id=NULL, pending_effective_at=NULL, last_proration_kobo=?, updated_at=NOW() WHERE school_id=?');
                        $stmt->execute([$plan['planId'], $plan['versionId'], $billingCycle, $newAmount, $currency, $start, $end, $due, $schoolId]);
                        $data['prorationKobo'] = $proration;
                        $data['discountKobo'] = $discount;
                        $data['amountDueKobo'] = $due;
                        $data['couponId'] = $couponId;
                        if ($due > 0) {
                            $pid = $this->id('pay');
                            $ref = $pid;
                            $meta = json_encode(['type' => 'SUBSCRIPTION_PRORATION', 'schoolId' => $schoolId, 'planSlug' => $planSlug, 'billingCycle' => $billingCycle], JSON_UNESCAPED_SLASHES);
                            $stmt = $pdo->prepare("INSERT INTO payments (id,school_id,provider,status,amount_kobo,currency,reference,metadata,created_at) VALUES (?,?,?,?,?,?,?,?,NOW())");
                            $stmt->execute([$pid, $schoolId, 'PAYSTACK', 'PENDING', $due, $currency, $ref, $meta]);
                            $data['paymentId'] = $pid;
                        }
                    }
                }
                $eid = $this->id('sev');
                $pdo->prepare('INSERT INTO subscription_events (id,school_id,type,data,created_at) VALUES (?,?,?,?,NOW())')
                    ->execute([$eid, $schoolId, $eventType, json_encode($data, JSON_UNESCAPED_SLASHES)]);
                $pdo->commit();
                $this->logAudit($_SESSION['user_id'] ?? null, $schoolId, 'ADMIN_SUBSCRIPTION_CHANGE', $data);
                Response::json(200, ['ok' => true, 'result' => $data]);
                return;
            }

            if ($method === 'POST' && preg_match('#^/admin/schools/([^/]+)/reset-password$#', $path, $m)) {
                Auth::requirePermission('schools.write');
                RateLimit::enforce('admin-reset-pass:' . $ip, 30, 3600);
                $id = $m[1];
                $pdo = Db::pdo();
                $stmt = $pdo->prepare('SELECT owner_id FROM schools WHERE id=? LIMIT 1');
                $stmt->execute([$id]);
                $row = $stmt->fetch();
                if (!$row) {
                    Response::error(404, 'NOT_FOUND', 'Not found');
                    return;
                }
                $temp = $this->randomPassword();
                $hash = Auth::hashPassword($temp);
                $stmt = $pdo->prepare('UPDATE users SET password_hash=?, force_password_change=1, updated_at=NOW() WHERE id=?');
                $stmt->execute([$hash, $row['owner_id']]);
                $this->logAudit($_SESSION['user_id'] ?? null, $id, 'ADMIN_RESET_SCHOOL_PASSWORD', ['ownerId' => $row['owner_id']]);
                Response::json(200, ['temporaryPassword' => $temp]);
                return;
            }

            if ($method === 'DELETE' && preg_match('#^/admin/schools/([^/]+)$#', $path, $m)) {
                Auth::requirePermission('schools.write');
                RateLimit::enforce('admin-delete-school:' . $ip, 10, 3600);
                $id = $m[1];
                $pdo = Db::pdo();
                $stmt = $pdo->prepare('SELECT owner_id,name FROM schools WHERE id=? LIMIT 1');
                $stmt->execute([$id]);
                $row = $stmt->fetch();
                if (!$row) {
                    Response::error(404, 'NOT_FOUND', 'Not found');
                    return;
                }
                $body = $this->jsonBody();
                $reason = isset($body['reason']) ? trim(strval($body['reason'])) : '';
                if ($reason !== '' && mb_strlen($reason) > 500) {
                    Response::error(400, 'VALIDATION_ERROR', 'Reason too long');
                    return;
                }
                $ownerId = $row['owner_id'];
                $pdo->beginTransaction();
                $stmt = $pdo->prepare("UPDATE users SET status='SUSPENDED', updated_at=NOW() WHERE id=?");
                $stmt->execute([$ownerId]);
                $purgeExpr = Db::isSqlite() ? "datetime(NOW(), '+30 days')" : "DATE_ADD(NOW(), INTERVAL 30 DAY)";
                $stmt = $pdo->prepare('UPDATE schools SET deleted_at=NOW(), deleted_reason=?, deleted_by_user_id=?, purge_after=' . $purgeExpr . ', updated_at=NOW() WHERE id=?');
                $stmt->execute([$reason !== '' ? $reason : null, $_SESSION['user_id'] ?? null, $id]);
                $pdo->commit();
                if (($_SESSION['impersonate_school_id'] ?? null) === $id) {
                    unset($_SESSION['impersonate_user_id'], $_SESSION['impersonate_school_id']);
                }
                $this->logAudit($_SESSION['user_id'] ?? null, $id, 'ADMIN_SOFT_DELETE_SCHOOL', ['ownerId' => $ownerId, 'schoolName' => $row['name'], 'reason' => $reason]);
                Response::json(200, ['ok' => true, 'recoveryWindowDays' => 30]);
                return;
            }

            if ($method === 'POST' && preg_match('#^/admin/schools/([^/]+)/restore$#', $path, $m)) {
                Auth::requirePermission('schools.write');
                RateLimit::enforce('admin-restore-school:' . $ip, 30, 3600);
                $id = $m[1];
                $pdo = Db::pdo();
                $stmt = $pdo->prepare('SELECT id,owner_id,name,deleted_at,purge_after FROM schools WHERE id=? LIMIT 1');
                $stmt->execute([$id]);
                $row = $stmt->fetch();
                if (!$row) {
                    Response::error(404, 'NOT_FOUND', 'Not found');
                    return;
                }
                if (!$row['deleted_at']) {
                    Response::error(400, 'NOT_DELETED', 'School is not deleted.');
                    return;
                }
                if ($row['purge_after'] && strtotime($row['purge_after']) < time()) {
                    Response::error(400, 'RECOVERY_EXPIRED', 'Recovery window expired.');
                    return;
                }
                $pdo->beginTransaction();
                $pdo->prepare("UPDATE users SET status='ACTIVE', updated_at=NOW() WHERE id=?")->execute([$row['owner_id']]);
                $pdo->prepare('UPDATE schools SET deleted_at=NULL, deleted_reason=NULL, deleted_by_user_id=NULL, purge_after=NULL, updated_at=NOW() WHERE id=?')->execute([$id]);
                $pdo->commit();
                $this->logAudit($_SESSION['user_id'] ?? null, $id, 'ADMIN_RESTORE_SCHOOL', ['ownerId' => $row['owner_id'], 'schoolName' => $row['name']]);
                Response::json(200, ['ok' => true]);
                return;
            }

            if ($method === 'POST' && $path === '/admin/impersonate/start') {
                Auth::requirePermission('impersonate');
                RateLimit::enforce('admin-impersonate:' . $ip, 60, 3600);
                $body = $this->jsonBody();
                $schoolId = Validation::requireString($body, 'schoolId', 3, 60);
                $pdo = Db::pdo();
                $stmt = $pdo->prepare('SELECT id,owner_id FROM schools WHERE id=? LIMIT 1');
                $stmt->execute([$schoolId]);
                $sc = $stmt->fetch();
                if (!$sc) {
                    Response::error(404, 'NOT_FOUND', 'Not found');
                    return;
                }
                $_SESSION['impersonate_user_id'] = $sc['owner_id'];
                $_SESSION['impersonate_school_id'] = $sc['id'];
                $this->logAudit($_SESSION['user_id'] ?? null, $sc['id'], 'ADMIN_IMPERSONATE_START', ['ownerId' => $sc['owner_id']]);
                Response::json(200, ['ok' => true, 'schoolId' => $sc['id'], 'ownerUserId' => $sc['owner_id']]);
                return;
            }

            if ($method === 'POST' && $path === '/admin/impersonate/stop') {
                Auth::requirePermission('impersonate');
                $schoolId = $_SESSION['impersonate_school_id'] ?? null;
                unset($_SESSION['impersonate_user_id'], $_SESSION['impersonate_school_id']);
                $this->logAudit($_SESSION['user_id'] ?? null, is_string($schoolId) ? $schoolId : null, 'ADMIN_IMPERSONATE_STOP', []);
                Response::json(200, ['ok' => true]);
                return;
            }

            if ($method === 'GET' && preg_match('#^/admin/schools/([^/]+)/notes$#', $path, $m)) {
                Auth::requirePermission('schools.read');
                $schoolId = $m[1];
                $stmt = Db::pdo()->prepare('SELECT id,note,author_user_id,created_at FROM admin_notes WHERE school_id=? ORDER BY created_at DESC LIMIT 50');
                $stmt->execute([$schoolId]);
                $rows = $stmt->fetchAll();
                Response::json(200, ['notes' => array_map(fn($r) => [
                    'id' => $r['id'],
                    'note' => $r['note'],
                    'authorUserId' => $r['author_user_id'],
                    'createdAt' => $r['created_at']
                ], $rows)]);
                return;
            }

            if ($method === 'POST' && preg_match('#^/admin/schools/([^/]+)/notes$#', $path, $m)) {
                Auth::requireRole('ADMIN');
                $schoolId = $m[1];
                $body = $this->jsonBody();
                $note = Validation::requireString($body, 'note', 2, 2000);
                $id = $this->id('note');
                $stmt = Db::pdo()->prepare('INSERT INTO admin_notes (id,school_id,author_user_id,note,created_at) VALUES (?,?,?,?,NOW())');
                $stmt->execute([$id, $schoolId, $_SESSION['user_id'] ?? null, $note]);
                $this->logAudit($_SESSION['user_id'] ?? null, $schoolId, 'ADMIN_ADD_NOTE', ['noteId' => $id]);
                Response::json(201, ['id' => $id]);
                return;
            }

            if ($method === 'GET' && $path === '/admin/audit') {
                Auth::requireRole('ADMIN');
                $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 50;
                if ($limit < 1) $limit = 50;
                if ($limit > 200) $limit = 200;
                $action = isset($_GET['action']) ? trim(strval($_GET['action'])) : '';
                $schoolId = isset($_GET['schoolId']) ? trim(strval($_GET['schoolId'])) : '';
                $sql = 'SELECT id,actor_user_id,school_id,action,ip,user_agent,data,created_at FROM audit_logs';
                $params = [];
                $where = [];
                if ($action !== '') {
                    $where[] = 'action = ?';
                    $params[] = $action;
                }
                if ($schoolId !== '') {
                    $where[] = 'school_id = ?';
                    $params[] = $schoolId;
                }
                if ($where) {
                    $sql .= ' WHERE ' . implode(' AND ', $where);
                }
                $sql .= ' ORDER BY created_at DESC LIMIT ?';
                $stmt = Db::pdo()->prepare($sql);
                $i = 1;
                foreach ($params as $p) {
                    $stmt->bindValue($i++, $p, PDO::PARAM_STR);
                }
                $stmt->bindValue($i, $limit, PDO::PARAM_INT);
                $stmt->execute();
                $rows = $stmt->fetchAll();
                $out = [];
                foreach ($rows as $r) {
                    $out[] = [
                        'id' => $r['id'],
                        'actorUserId' => $r['actor_user_id'],
                        'schoolId' => $r['school_id'],
                        'action' => $r['action'],
                        'ip' => $r['ip'],
                        'userAgent' => $r['user_agent'],
                        'data' => json_decode($r['data'], true) ?: [],
                        'createdAt' => $r['created_at']
                    ];
                }
                Response::json(200, ['audit' => $out]);
                return;
            }

            if ($method === 'DELETE' && $path === '/admin/audit') {
                Auth::requireRole('ADMIN');
                $this->logAudit($_SESSION['user_id'] ?? null, null, 'ADMIN_CLEAR_AUDIT_DENIED', []);
                Response::error(405, 'IMMUTABLE_AUDIT', 'Audit log is immutable.');
                return;
            }

            if ($method === 'GET' && $path === '/school') {
                $u = Auth::requireUser();
                if (!in_array($u['role'], ['SCHOOL', 'SCHOOL_ADMIN', 'TEACHER'], true)) {
                    Response::error(403, 'FORBIDDEN', 'Forbidden');
                    return;
                }
                $actorId = ($u['impersonating'] ?? false) ? ($u['adminId'] ?? $u['id']) : $u['id'];
                $school = null;
                if ($u['role'] === 'SCHOOL' || $u['role'] === 'SCHOOL_ADMIN') {
                    $school = $this->getSchoolByOwnerIdOrSchoolId($u['id'], $u['role']);
                }
                if ($u['role'] === 'TEACHER') {
                    $row = $this->getUserById($u['id']);
                    $schoolId = is_array($row) && is_string($row['school_id'] ?? null) ? strval($row['school_id']) : '';
                    if ($schoolId !== '') {
                        $school = $this->getSchoolById($schoolId);
                    }
                }
                if (!$school) {
                    Response::error(404, 'NOT_FOUND', 'Not found');
                    return;
                }
                $act = $u['role'] === 'TEACHER' ? 'TEACHER_SCHOOL_VIEW' : (($u['impersonating'] ?? false) ? 'SCHOOL_VIEW_IMPERSONATED' : 'SCHOOL_VIEW');
                $this->logAudit($actorId, $school['id'], $act, ['effectiveUserId' => $u['id']]);
                Response::json(200, ['school' => $this->schoolToApi($school)]);
                return;
            }

            if ($method === 'PUT' && $path === '/school') {
                $ctx = $this->requireSchoolContext();
                $u = $ctx['u'];
                $school = $ctx['school'];
                $actorId = $ctx['actorId'];
                $body = $this->jsonBody();
                $allowed = ['name','abbr','slug','address','contact','motto','principal','session','term','nextTerm','schoolLevel','classTemplates','ca1Max','ca2Max','examMax','subjects','grades','reportColor','logoUrl'];
                $set = [];
                $vals = [];
                foreach ($allowed as $k) {
                    if (!array_key_exists($k, $body)) {
                        continue;
                    }
                    if ($k === 'schoolLevel') {
                        $v = trim(strval($body[$k]));
                        if (!in_array($v, ['Nursery', 'Primary', 'Secondary'], true)) {
                            Response::error(400, 'VALIDATION_ERROR', 'Invalid schoolLevel');
                            return;
                        }
                        $set[] = 'school_level=?';
                        $vals[] = $v;
                        continue;
                    }
                    if ($k === 'classTemplates') {
                        if (!is_array($body[$k])) {
                            Response::error(400, 'VALIDATION_ERROR', 'classTemplates must be an object');
                            return;
                        }
                        $ct = $body[$k];
                        $out = [
                            'nursery' => trim(strval($ct['nursery'] ?? '')),
                            'primary' => trim(strval($ct['primary'] ?? '')),
                            'secondary' => trim(strval($ct['secondary'] ?? ''))
                        ];
                        $set[] = 'class_templates=?';
                        $vals[] = json_encode($out, JSON_UNESCAPED_SLASHES);
                        continue;
                    }
                    if (in_array($k, ['subjects','grades'], true)) {
                        if (!is_array($body[$k])) {
                            Response::error(400, 'VALIDATION_ERROR', $k . ' must be an array');
                            return;
                        }
                        $set[] = $this->snake($k) . '=?';
                        $vals[] = json_encode($body[$k], JSON_UNESCAPED_SLASHES);
                        continue;
                    }
                    if (in_array($k, ['ca1Max','ca2Max','examMax'], true)) {
                        $set[] = $this->snake($k) . '=?';
                        $vals[] = intval($body[$k]);
                        continue;
                    }
                    if ($k === 'abbr') {
                        $set[] = 'abbr=?';
                        $vals[] = strtoupper(trim(strval($body[$k])));
                        continue;
                    }
                    if ($k === 'reportColor') {
                        $set[] = 'report_color=?';
                        $vals[] = trim(strval($body[$k]));
                        continue;
                    }
                    if ($k === 'slug') {
                        $v = strtolower(trim(strval($body[$k])));
                        $v = preg_replace('/[^a-z0-9-]+/', '-', $v);
                        $v = trim(strval($v ?? ''), '-');
                        if ($v === '' || mb_strlen($v) < 2 || mb_strlen($v) > 60) {
                            Response::error(400, 'VALIDATION_ERROR', 'Invalid slug');
                            return;
                        }
                        $stmt = Db::pdo()->prepare('SELECT id FROM schools WHERE subdomain=? AND id<>? LIMIT 1');
                        $stmt->execute([$v, $school['id']]);
                        if ($stmt->fetch()) {
                            Response::error(400, 'VALIDATION_ERROR', 'Slug already in use');
                            return;
                        }
                        $set[] = 'subdomain=?';
                        $vals[] = $v;
                        continue;
                    }
                    $set[] = $this->snake($k) . '=?';
                    $vals[] = strval($body[$k]);
                }
                if (!$set) {
                    Response::error(400, 'NO_CHANGES', 'No changes specified.');
                    return;
                }
                $vals[] = $school['id'];
                $stmt = Db::pdo()->prepare('UPDATE schools SET ' . implode(',', $set) . ' WHERE id=?');
                $stmt->execute($vals);
                $school = $this->getSchoolByOwnerId($u['id']);
                $this->logAudit($actorId, $school['id'] ?? null, ($u['impersonating'] ?? false) ? 'SCHOOL_UPDATE_CONFIG_IMPERSONATED' : 'SCHOOL_UPDATE_CONFIG', ['keys' => array_keys($body), 'effectiveUserId' => $u['id']]);
                Response::json(200, ['school' => $this->schoolToApi($school)]);
                return;
            }

            if ($method === 'GET' && $path === '/teachers') {
                $ctx = $this->requireSchoolContext();
                $u = $ctx['u'];
                $school = $ctx['school'];
                $actorId = $ctx['actorId'];
                $stmt = Db::pdo()->prepare("SELECT u.id,u.email,u.status,tp.display_name FROM users u JOIN teacher_profiles tp ON tp.user_id=u.id WHERE u.role='TEACHER' AND u.school_id=? ORDER BY tp.display_name ASC");
                $stmt->execute([$school['id']]);
                $rows = $stmt->fetchAll();
                $teacherIds = array_map(fn($r) => strval($r['id']), $rows);
                $assign = [];
                if (count($teacherIds)) {
                    $in = implode(',', array_fill(0, count($teacherIds), '?'));
                    $stmt = Db::pdo()->prepare("SELECT teacher_user_id,class_name FROM teacher_class_assignments WHERE school_id=? AND teacher_user_id IN ($in) ORDER BY class_name ASC");
                    $stmt->execute(array_merge([$school['id']], $teacherIds));
                    foreach ($stmt->fetchAll() as $a) {
                        $tid = strval($a['teacher_user_id']);
                        if (!isset($assign[$tid])) $assign[$tid] = [];
                        $assign[$tid][] = strval($a['class_name']);
                    }
                }
                $out = array_map(fn($r) => [
                    'id' => strval($r['id']),
                    'email' => strval($r['email']),
                    'status' => strval($r['status']),
                    'displayName' => strval($r['display_name']),
                    'classes' => $assign[strval($r['id'])] ?? []
                ], $rows);
                $this->logAudit($actorId, $school['id'], ($u['impersonating'] ?? false) ? 'TEACHERS_LIST_IMPERSONATED' : 'TEACHERS_LIST', ['effectiveUserId' => $u['id']]);
                Response::json(200, ['teachers' => $out]);
                return;
            }

            if ($method === 'POST' && $path === '/teachers') {
                $ctx = $this->requireSchoolContext();
                $u = $ctx['u'];
                $school = $ctx['school'];
                $actorId = $ctx['actorId'];
                $body = $this->jsonBody();
                $email = Validation::requireEmail($body, 'email');
                $displayName = Validation::requireString($body, 'displayName', 2, 160);
                $classes = $body['classes'] ?? [];
                if (!is_array($classes)) {
                    Response::error(400, 'VALIDATION_ERROR', 'classes must be an array');
                    return;
                }
                $classes = array_values(array_unique(array_filter(array_map(fn($x) => trim(strval($x)), $classes), fn($x) => $x !== '')));
                $this->enforceStaffLimit($school['id'], 1);
                if ($this->findUserByEmail($email)) {
                    Response::error(400, 'EMAIL_IN_USE', 'An account with this email already exists.');
                    return;
                }
                $uid = $this->id('usr');
                $tid = $this->id('tpr');
                $password = $this->randomPassword();
                $hash = Auth::hashPassword($password);
                $pdo = Db::pdo();
                $pdo->beginTransaction();
                try {
                    $stmt = $pdo->prepare('INSERT INTO users (id,email,password_hash,role,status,school_id,force_password_change,created_at) VALUES (?,?,?,?,?,?,1,NOW())');
                    $stmt->execute([$uid, $email, $hash, 'TEACHER', 'ACTIVE', $school['id']]);
                    $stmt = $pdo->prepare('INSERT INTO teacher_profiles (id,user_id,school_id,display_name,created_at) VALUES (?,?,?,?,NOW())');
                    $stmt->execute([$tid, $uid, $school['id'], $displayName]);
                    if (count($classes)) {
                        $stmt = $pdo->prepare('INSERT INTO teacher_class_assignments (id,school_id,teacher_user_id,class_name,created_at) VALUES (?,?,?,?,NOW())');
                        foreach ($classes as $cls) {
                            $stmt->execute([$this->id('tca'), $school['id'], $uid, $cls]);
                        }
                    }
                    $pdo->commit();
                } catch (Throwable $e) {
                    try { $pdo->rollBack(); } catch (Throwable $e2) {}
                    throw $e;
                }
                $this->logAudit($actorId, $school['id'], ($u['impersonating'] ?? false) ? 'TEACHER_CREATE_IMPERSONATED' : 'TEACHER_CREATE', ['email' => $email, 'classes' => $classes, 'effectiveUserId' => $u['id']]);
                Response::json(201, ['teacherUserId' => $uid, 'temporaryPassword' => $password]);
                return;
            }

            if ($method === 'PUT' && preg_match('#^/teachers/([^/]+)$#', $path, $m)) {
                $ctx = $this->requireSchoolContext();
                $u = $ctx['u'];
                $school = $ctx['school'];
                $actorId = $ctx['actorId'];
                $teacherUserId = strval($m[1] ?? '');
                $stmt = Db::pdo()->prepare("SELECT id FROM users WHERE id=? AND role='TEACHER' AND school_id=? LIMIT 1");
                $stmt->execute([$teacherUserId, $school['id']]);
                $exists = $stmt->fetch();
                if (!$exists) {
                    Response::error(404, 'NOT_FOUND', 'Not found');
                    return;
                }
                $body = $this->jsonBody();
                $displayName = array_key_exists('displayName', $body) ? trim(strval($body['displayName'])) : null;
                $status = array_key_exists('status', $body) ? trim(strval($body['status'])) : null;
                $classes = array_key_exists('classes', $body) ? $body['classes'] : null;
                if ($classes !== null && !is_array($classes)) {
                    Response::error(400, 'VALIDATION_ERROR', 'classes must be an array');
                    return;
                }
                if ($status !== null && !in_array($status, ['ACTIVE', 'SUSPENDED'], true)) {
                    Response::error(400, 'VALIDATION_ERROR', 'Invalid status');
                    return;
                }
                $pdo = Db::pdo();
                $pdo->beginTransaction();
                try {
                    if (is_string($displayName) && $displayName !== '') {
                        $stmt = $pdo->prepare('UPDATE teacher_profiles SET display_name=?, updated_at=NOW() WHERE user_id=? AND school_id=?');
                        $stmt->execute([$displayName, $teacherUserId, $school['id']]);
                    }
                    if (is_string($status) && $status !== '') {
                        $stmt = $pdo->prepare('UPDATE users SET status=?, updated_at=NOW() WHERE id=? AND school_id=?');
                        $stmt->execute([$status, $teacherUserId, $school['id']]);
                    }
                    if (is_array($classes)) {
                        $classes = array_values(array_unique(array_filter(array_map(fn($x) => trim(strval($x)), $classes), fn($x) => $x !== '')));
                        $stmt = $pdo->prepare('DELETE FROM teacher_class_assignments WHERE school_id=? AND teacher_user_id=?');
                        $stmt->execute([$school['id'], $teacherUserId]);
                        if (count($classes)) {
                            $stmt = $pdo->prepare('INSERT INTO teacher_class_assignments (id,school_id,teacher_user_id,class_name,created_at) VALUES (?,?,?,?,NOW())');
                            foreach ($classes as $cls) {
                                $stmt->execute([$this->id('tca'), $school['id'], $teacherUserId, $cls]);
                            }
                        }
                    }
                    $pdo->commit();
                } catch (Throwable $e) {
                    try { $pdo->rollBack(); } catch (Throwable $e2) {}
                    throw $e;
                }
                $this->logAudit($actorId, $school['id'], ($u['impersonating'] ?? false) ? 'TEACHER_UPDATE_IMPERSONATED' : 'TEACHER_UPDATE', ['teacherUserId' => $teacherUserId, 'keys' => array_keys($body), 'effectiveUserId' => $u['id']]);
                Response::json(200, ['ok' => true]);
                return;
            }

            if ($method === 'DELETE' && preg_match('#^/teachers/([^/]+)$#', $path, $m)) {
                $ctx = $this->requireSchoolContext();
                $u = $ctx['u'];
                $school = $ctx['school'];
                $actorId = $ctx['actorId'];
                $teacherUserId = strval($m[1] ?? '');
                $stmt = Db::pdo()->prepare("UPDATE users SET status='SUSPENDED', updated_at=NOW() WHERE id=? AND role='TEACHER' AND school_id=?");
                $stmt->execute([$teacherUserId, $school['id']]);
                $this->logAudit($actorId, $school['id'], ($u['impersonating'] ?? false) ? 'TEACHER_SUSPEND_IMPERSONATED' : 'TEACHER_SUSPEND', ['teacherUserId' => $teacherUserId, 'effectiveUserId' => $u['id']]);
                Response::json(200, ['ok' => true]);
                return;
            }

            if ($method === 'GET' && $path === '/teacher/api/classes') {
                $u = Auth::requireEffectiveRole('TEACHER');
                $actorId = $u['id'];
                $userRow = $this->getUserById($u['id']);
                $schoolId = is_array($userRow) && is_string($userRow['school_id'] ?? null) ? strval($userRow['school_id']) : '';
                if ($schoolId === '') {
                    Response::error(403, 'FORBIDDEN', 'No school context');
                    return;
                }
                $school = $this->getSchoolById($schoolId);
                if (!$school) {
                    Response::error(404, 'NOT_FOUND', 'Not found');
                    return;
                }
                $classes = $this->getTeacherAssignedClasses($schoolId, $u['id']);
                $this->logAudit($actorId, $schoolId, 'TEACHER_CLASSES_LIST', ['count' => count($classes)]);
                Response::json(200, ['classes' => array_map(fn($c) => ['name' => $c], $classes)]);
                return;
            }

            if ($method === 'GET' && $path === '/teacher/api/students') {
                $u = Auth::requireEffectiveRole('TEACHER');
                $actorId = $u['id'];
                $className = isset($_GET['className']) ? trim(strval($_GET['className'])) : '';
                if ($className === '') {
                    Response::error(400, 'VALIDATION_ERROR', 'className is required');
                    return;
                }
                $userRow = $this->getUserById($u['id']);
                $schoolId = is_array($userRow) && is_string($userRow['school_id'] ?? null) ? strval($userRow['school_id']) : '';
                if ($schoolId === '') {
                    Response::error(403, 'FORBIDDEN', 'No school context');
                    return;
                }
                $allowed = $this->getTeacherAssignedClasses($schoolId, $u['id']);
                if (!in_array($className, $allowed, true)) {
                    Response::error(403, 'FORBIDDEN', 'Access denied');
                    return;
                }
                $stmt = Db::pdo()->prepare('SELECT id,name,admission_no,class_name FROM students WHERE school_id=? AND class_name=? ORDER BY name ASC');
                $stmt->execute([$schoolId, $className]);
                $rows = $stmt->fetchAll();
                $out = array_map(fn($s) => [
                    'id' => strval($s['id']),
                    'name' => strval($s['name']),
                    'admNo' => strval($s['admission_no']),
                    'cls' => strval($s['class_name'])
                ], $rows);
                $this->logAudit($actorId, $schoolId, 'TEACHER_STUDENTS_LIST', ['className' => $className, 'count' => count($out)]);
                Response::json(200, ['students' => $out]);
                return;
            }

            if ($method === 'GET' && preg_match('#^/teacher/api/student/([^/]+)$#', $path, $m)) {
                $u = Auth::requireEffectiveRole('TEACHER');
                $studentId = strval($m[1] ?? '');
                $userRow = $this->getUserById($u['id']);
                $schoolId = is_array($userRow) && is_string($userRow['school_id'] ?? null) ? strval($userRow['school_id']) : '';
                if ($schoolId === '') {
                    Response::error(403, 'FORBIDDEN', 'No school context');
                    return;
                }
                $stmt = Db::pdo()->prepare('SELECT id,name,admission_no,class_name,gender,date_of_birth,house,address FROM students WHERE id=? AND school_id=? LIMIT 1');
                $stmt->execute([$studentId, $schoolId]);
                $s = $stmt->fetch();
                if (!$s) {
                    Response::error(404, 'NOT_FOUND', 'Student not found');
                    return;
                }
                $allowed = $this->getTeacherAssignedClasses($schoolId, $u['id']);
                if (!in_array(strval($s['class_name']), $allowed, true)) {
                    Response::error(403, 'FORBIDDEN', 'Access denied');
                    return;
                }
                Response::json(200, ['student' => [
                    'id' => strval($s['id']),
                    'name' => strval($s['name']),
                    'admNo' => strval($s['admission_no']),
                    'cls' => strval($s['class_name']),
                    'gender' => strval($s['gender'] ?? ''),
                    'dob' => strval($s['date_of_birth'] ?? ''),
                    'house' => strval($s['house'] ?? ''),
                    'address' => strval($s['address'] ?? '')
                ]]);
                return;
            }

            if (($method === 'GET' || $method === 'PUT') && preg_match('#^/teacher/api/scores/([^/]+)$#', $path, $m)) {
                $u = Auth::requireEffectiveRole('TEACHER');
                $actorId = $u['id'];
                $studentId = strval($m[1] ?? '');
                $userRow = $this->getUserById($u['id']);
                $schoolId = is_array($userRow) && is_string($userRow['school_id'] ?? null) ? strval($userRow['school_id']) : '';
                if ($schoolId === '') {
                    Response::error(403, 'FORBIDDEN', 'No school context');
                    return;
                }
                $student = $this->getStudentById($schoolId, $studentId);
                if (!$student) {
                    Response::error(404, 'NOT_FOUND', 'Not found');
                    return;
                }
                $allowed = $this->getTeacherAssignedClasses($schoolId, $u['id']);
                $className = strval($student['class_name'] ?? '');
                if (!in_array($className, $allowed, true)) {
                    Response::error(403, 'FORBIDDEN', 'Access denied');
                    return;
                }
                $school = $this->getSchoolById($schoolId);
                if (!$school) {
                    Response::error(404, 'NOT_FOUND', 'Not found');
                    return;
                }
                $subjects = json_decode($school['subjects'] ?? '[]', true);
                if (!is_array($subjects)) $subjects = [];
                if ($method === 'GET') {
                    $sheet = $this->getScoreSheet($schoolId, $studentId);
                    $this->logAudit($actorId, $schoolId, 'TEACHER_SCORES_VIEW', ['studentId' => $studentId]);
                    Response::json(200, ['scores' => $sheet, 'subjects' => $subjects, 'className' => $className]);
                    return;
                }
                $body = $this->jsonBody();
                $scores = $body['scores'] ?? null;
                if (!is_array($scores)) {
                    Response::error(400, 'VALIDATION_ERROR', 'scores must be an object');
                    return;
                }
                $this->upsertScoreSheet($schoolId, $studentId, $scores);
                $this->logAudit($actorId, $schoolId, 'TEACHER_SCORES_UPDATE', ['studentId' => $studentId, 'className' => $className]);
                Response::json(200, ['ok' => true]);
                return;
            }

            if ($method === 'GET' && $path === '/teacher/api/attendance/session') {
                $u = Auth::requireEffectiveRole('TEACHER');
                $actorId = $u['id'];
                // Feature check: attendance requires attendance feature
                $userRow = $this->getUserById($u['id']);
                $schoolId = is_array($userRow) && is_string($userRow['school_id'] ?? null) ? strval($userRow['school_id']) : '';
                if ($schoolId !== '') {
                    $this->enforceFeatureAccess($schoolId, 'attendance');
                }
                $className = isset($_GET['className']) ? trim(strval($_GET['className'])) : '';
                $date = isset($_GET['date']) ? trim(strval($_GET['date'])) : '';
                if ($className === '') {
                    Response::error(400, 'VALIDATION_ERROR', 'className is required');
                    return;
                }
                if ($date === '') {
                    $date = gmdate('Y-m-d');
                }
                if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
                    Response::error(400, 'VALIDATION_ERROR', 'date must be YYYY-MM-DD');
                    return;
                }
                $userRow = $this->getUserById($u['id']);
                $schoolId = is_array($userRow) && is_string($userRow['school_id'] ?? null) ? strval($userRow['school_id']) : '';
                if ($schoolId === '') {
                    Response::error(403, 'FORBIDDEN', 'No school context');
                    return;
                }
                $allowed = $this->getTeacherAssignedClasses($schoolId, $u['id']);
                if (!in_array($className, $allowed, true)) {
                    Response::error(403, 'FORBIDDEN', 'Access denied');
                    return;
                }
                $session = $this->attendance->getSession($schoolId, $className, $date);
                $marks = [];
                if ($session) {
                    $rows = $this->attendance->getMarks($schoolId, $session['id']);
                    foreach ($rows as $mrow) {
                        $marks[] = ['studentId' => strval($mrow['student_id']), 'mark' => strval($mrow['mark']), 'note' => strval($mrow['note'] ?? '')];
                    }
                }
                $this->logAudit($actorId, $schoolId, 'TEACHER_ATTENDANCE_SESSION_VIEW', ['className' => $className, 'date' => $date]);
                Response::json(200, [
                    'session' => $session ? ['id' => strval($session['id']), 'status' => strval($session['status']), 'date' => $date, 'className' => $className, 'updatedAt' => $session['updated_at']] : null,
                    'marks' => $marks
                ]);
                return;
            }

            if ($method === 'PUT' && $path === '/teacher/api/attendance/session') {
                $u = Auth::requireEffectiveRole('TEACHER');
                $actorId = $u['id'];
                $body = $this->jsonBody();
                $userRow = $this->getUserById($u['id']);
                $schoolId = is_array($userRow) && is_string($userRow['school_id'] ?? null) ? strval($userRow['school_id']) : '';
                if ($schoolId !== '') {
                    $this->enforceFeatureAccess($schoolId, 'attendance');
                }
                $className = Validation::requireString($body, 'className', 1, 80);
                $date = Validation::requireString($body, 'date', 10, 10);
                if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
                    Response::error(400, 'VALIDATION_ERROR', 'date must be YYYY-MM-DD');
                    return;
                }
                $marks = $body['marks'] ?? [];
                if (!is_array($marks)) {
                    Response::error(400, 'VALIDATION_ERROR', 'marks must be an array');
                    return;
                }
                $userRow = $this->getUserById($u['id']);
                $schoolId = is_array($userRow) && is_string($userRow['school_id'] ?? null) ? strval($userRow['school_id']) : '';
                if ($schoolId === '') {
                    Response::error(403, 'FORBIDDEN', 'No school context');
                    return;
                }
                $allowed = $this->getTeacherAssignedClasses($schoolId, $u['id']);
                if (!in_array($className, $allowed, true)) {
                    Response::error(403, 'FORBIDDEN', 'Access denied');
                    return;
                }
                try {
                    $sessionId = $this->attendance->upsertSession($schoolId, $className, $date, $u['id'], $marks);
                    $this->logAudit($actorId, $schoolId, 'TEACHER_ATTENDANCE_SESSION_SAVE', ['className' => $className, 'date' => $date]);
                    Response::json(200, ['ok' => true, 'id' => $sessionId]);
                } catch (InvalidArgumentException $e) {
                    Response::error(409, 'ALREADY_SUBMITTED', $e->getMessage());
                } catch (Throwable $e) {
                    Response::error(500, 'ERROR', 'Failed to save attendance');
                }
                return;
            }

            if ($method === 'POST' && preg_match('#^/teacher/api/attendance/submit/([^/]+)$#', $path, $m)) {
                $u = Auth::requireEffectiveRole('TEACHER');
                $actorId = $u['id'];
                $sessionId = strval($m[1] ?? '');
                $userRow = $this->getUserById($u['id']);
                $schoolId = is_array($userRow) && is_string($userRow['school_id'] ?? null) ? strval($userRow['school_id']) : '';
                if ($schoolId === '') {
                    Response::error(403, 'FORBIDDEN', 'No school context');
                    return;
                }
                
                $this->attendance->submitSession($schoolId, $sessionId);
                $this->logAudit($actorId, $schoolId, 'TEACHER_ATTENDANCE_SESSION_SUBMIT', ['sessionId' => $sessionId]);
                Response::json(200, ['ok' => true]);
                return;
            }

            if ($method === 'GET' && $path === '/teacher/api/attendance/history') {
                $u = Auth::requireEffectiveRole('TEACHER');
                $actorId = $u['id'];
                $className = isset($_GET['className']) ? trim(strval($_GET['className'])) : '';
                $from = isset($_GET['from']) ? trim(strval($_GET['from'])) : '';
                $to = isset($_GET['to']) ? trim(strval($_GET['to'])) : '';
                if ($className === '') {
                    Response::error(400, 'VALIDATION_ERROR', 'className is required');
                    return;
                }
                $userRow = $this->getUserById($u['id']);
                $schoolId = is_array($userRow) && is_string($userRow['school_id'] ?? null) ? strval($userRow['school_id']) : '';
                if ($schoolId === '') {
                    Response::error(403, 'FORBIDDEN', 'No school context');
                    return;
                }
                $allowed = $this->getTeacherAssignedClasses($schoolId, $u['id']);
                if (!in_array($className, $allowed, true)) {
                    Response::error(403, 'FORBIDDEN', 'Access denied');
                    return;
                }
                if ($to === '') $to = gmdate('Y-m-d');
                if ($from === '') {
                    $from = gmdate('Y-m-d', time() - 60 * 60 * 24 * 30);
                }
                if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $from) || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $to)) {
                    Response::error(400, 'VALIDATION_ERROR', 'from/to must be YYYY-MM-DD');
                    return;
                }
                $sessions = $this->attendance->getHistory($schoolId, $className, $from, $to);
                $this->logAudit($actorId, $schoolId, 'TEACHER_ATTENDANCE_HISTORY', ['className' => $className, 'from' => $from, 'to' => $to, 'count' => count($sessions)]);
                Response::json(200, ['sessions' => $sessions]);
                return;
            }

            if ($method === 'PUT' && $path === '/teacher/api/profile') {
                $u = Auth::requireEffectiveRole('TEACHER');
                $body = $this->jsonBody();
                $displayName = isset($body['displayName']) ? trim(strval($body['displayName'])) : '';
                $email = isset($body['email']) ? trim(strval($body['email'])) : '';
                if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
                    Response::error(400, 'VALIDATION_ERROR', 'Invalid email address');
                    return;
                }
                
                $pdo = Db::pdo();
                
                if ($email !== '') {
                    $stmt = $pdo->prepare('SELECT id FROM users WHERE email=? AND id!=? LIMIT 1');
                    $stmt->execute([$email, $u['id']]);
                    if ($stmt->fetch()) {
                        Response::error(400, 'VALIDATION_ERROR', 'Email already in use by another account');
                        return;
                    }
                }
                
                $stmt = $pdo->prepare('UPDATE users SET display_name=?, email=?, updated_at=NOW() WHERE id=?');
                $stmt->execute([$displayName !== '' ? $displayName : null, $email !== '' ? $email : $u['email'], $u['id']]);
                
                $userRow = $this->getUserById($u['id']);
                $schoolId = is_array($userRow) && is_string($userRow['school_id'] ?? null) ? strval($userRow['school_id']) : null;
                $this->logAudit($u['id'], $schoolId, 'TEACHER_PROFILE_UPDATE', ['email' => $email, 'displayName' => $displayName]);
                Response::json(200, ['ok' => true]);
                return;
            }

            if ($method === 'PUT' && $path === '/portal/api/settings') {
                $u = Auth::requireUser();
                if ($u['role'] !== 'PARENT' && $u['role'] !== 'STUDENT') {
                    Response::error(403, 'FORBIDDEN', 'Forbidden');
                    return;
                }
                $body = $this->jsonBody();
                $displayName = isset($body['displayName']) ? trim(strval($body['displayName'])) : '';
                $email = isset($body['email']) ? trim(strval($body['email'])) : '';
                if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
                    Response::error(400, 'VALIDATION_ERROR', 'Invalid email address');
                    return;
                }
                
                $pdo = Db::pdo();
                
                if ($email !== '') {
                    $stmt = $pdo->prepare('SELECT id FROM users WHERE email=? AND id!=? LIMIT 1');
                    $stmt->execute([$email, $u['id']]);
                    if ($stmt->fetch()) {
                        Response::error(400, 'VALIDATION_ERROR', 'Email already in use by another account');
                        return;
                    }
                }
                
                $stmt = $pdo->prepare('UPDATE users SET display_name=?, email=?, updated_at=NOW() WHERE id=?');
                $stmt->execute([$displayName !== '' ? $displayName : null, $email !== '' ? $email : $u['email'], $u['id']]);
                
                $userRow = $this->getUserById($u['id']);
                $schoolId = is_array($userRow) && is_string($userRow['school_id'] ?? null) ? strval($userRow['school_id']) : null;
                $this->logAudit($u['id'], $schoolId, 'PORTAL_SETTINGS_UPDATE', ['email' => $email, 'displayName' => $displayName]);
                Response::json(200, ['ok' => true]);
                return;
            }

            if ($method === 'POST' && $path === '/portal/users') {
                $ctx = $this->requireSchoolContext();
                $u = $ctx['u'];
                $school = $ctx['school'];
                $actorId = $ctx['actorId'];
                $body = $this->jsonBody();
                $role = strtoupper(trim(strval($body['role'] ?? '')));
                if (!in_array($role, ['PARENT', 'STUDENT'], true)) {
                    Response::error(400, 'VALIDATION_ERROR', 'role must be PARENT or STUDENT');
                    return;
                }
                $email = Validation::requireEmail($body, 'email');
                $studentId = Validation::requireString($body, 'studentId', 1, 80);
                $displayName = isset($body['displayName']) ? trim(strval($body['displayName'])) : null;
                if ($this->findUserByEmail($email)) {
                    Response::error(400, 'EMAIL_IN_USE', 'An account with this email already exists.');
                    return;
                }
                $stmt = Db::pdo()->prepare('SELECT id FROM students WHERE school_id=? AND id=? LIMIT 1');
                $stmt->execute([$school['id'], $studentId]);
                if (!$stmt->fetch()) {
                    Response::error(404, 'NOT_FOUND', 'Student not found');
                    return;
                }
                $uid = $this->id('usr');
                $linkId = $this->id('lnk');
                $password = $this->randomPassword();
                $hash = Auth::hashPassword($password);
                $pdo = Db::pdo();
                $pdo->beginTransaction();
                try {
                    $stmt = $pdo->prepare('INSERT INTO users (id,email,display_name,password_hash,role,status,school_id,force_password_change,created_at) VALUES (?,?,?,?,?,?,?,1,NOW())');
                    $stmt->execute([$uid, $email, $displayName, $hash, $role, 'ACTIVE', $school['id']]);
                    $stmt = $pdo->prepare('INSERT INTO student_links (id,school_id,student_id,user_id,link_type,created_at) VALUES (?,?,?,?,?,NOW())');
                    $stmt->execute([$linkId, $school['id'], $studentId, $uid, $role]);
                    $pdo->commit();
                } catch (Throwable $e) {
                    try { $pdo->rollBack(); } catch (Throwable $e2) {}
                    throw $e;
                }
                $this->logAudit($actorId, $school['id'], ($u['impersonating'] ?? false) ? 'PORTAL_USER_CREATE_IMPERSONATED' : 'PORTAL_USER_CREATE', ['role' => $role, 'studentId' => $studentId, 'email' => $email, 'effectiveUserId' => $u['id']]);
                Response::json(201, ['userId' => $uid, 'temporaryPassword' => $password]);
                return;
            }

            if ($method === 'GET' && $path === '/portal/api/me') {
                $u = Auth::requireSessionUser();
                if (!in_array($u['role'], ['PARENT', 'STUDENT'], true)) {
                    Response::error(403, 'FORBIDDEN', 'Forbidden');
                    return;
                }
                $userRow = $this->getUserById($u['id']);
                $schoolId = is_array($userRow) && is_string($userRow['school_id'] ?? null) ? strval($userRow['school_id']) : '';
                if ($schoolId === '') {
                    Response::error(403, 'FORBIDDEN', 'No school context');
                    return;
                }
                $school = $this->getSchoolById($schoolId);
                if (!$school) {
                    Response::error(404, 'NOT_FOUND', 'Not found');
                    return;
                }
                $stmt = Db::pdo()->prepare('SELECT s.id,s.name,s.admission_no,s.class_name,s.gender,s.photo_url FROM student_links l JOIN students s ON s.id=l.student_id WHERE l.school_id=? AND l.user_id=? ORDER BY s.name ASC');
                $stmt->execute([$schoolId, $u['id']]);
                $students = array_map(fn($r) => [
                    'id' => strval($r['id']),
                    'name' => strval($r['name']),
                    'admNo' => strval($r['admission_no']),
                    'cls' => strval($r['class_name'] ?? ''),
                    'gender' => strval($r['gender'] ?? ''),
                    'photoUrl' => $r['photo_url'] ?? null
                ], $stmt->fetchAll());
                Response::json(200, [
                    'user' => ['id' => $u['id'], 'role' => $u['role'], 'email' => $userRow['email'] ?? null, 'displayName' => $userRow['display_name'] ?? null],
                    'school' => ['id' => $school['id'], 'name' => $school['name'], 'abbr' => $school['abbr']],
                    'students' => $students
                ]);
                return;
            }

            if ($method === 'GET' && preg_match('#^/portal/api/student/([^/]+)$#', $path, $m)) {
                $u = Auth::requireSessionUser();
                if (!in_array($u['role'], ['PARENT', 'STUDENT'], true)) {
                    Response::error(403, 'FORBIDDEN', 'Forbidden');
                    return;
                }
                $studentId = strval($m[1] ?? '');
                $userRow = $this->getUserById($u['id']);
                $schoolId = is_array($userRow) && is_string($userRow['school_id'] ?? null) ? strval($userRow['school_id']) : '';
                if ($schoolId === '') {
                    Response::error(403, 'FORBIDDEN', 'No school context');
                    return;
                }
                $stmt = Db::pdo()->prepare('SELECT id FROM student_links WHERE school_id=? AND user_id=? AND student_id=? LIMIT 1');
                $stmt->execute([$schoolId, $u['id'], $studentId]);
                if (!$stmt->fetch()) {
                    Response::error(404, 'NOT_FOUND', 'Not found');
                    return;
                }
                $stmt = Db::pdo()->prepare('SELECT id,name,admission_no,gender,class_name,dob,house,parent,photo_url,address,guardian_name,guardian_phone,guardian_email,emergency_name,emergency_phone,profile_extra FROM students WHERE school_id=? AND id=? LIMIT 1');
                $stmt->execute([$schoolId, $studentId]);
                $s = $stmt->fetch();
                if (!$s) {
                    Response::error(404, 'NOT_FOUND', 'Not found');
                    return;
                }
                $extra = json_decode($s['profile_extra'] ?? '{}', true);
                if (!is_array($extra)) $extra = [];
                Response::json(200, ['student' => [
                    'id' => strval($s['id']),
                    'name' => strval($s['name']),
                    'admNo' => strval($s['admission_no']),
                    'gender' => strval($s['gender'] ?? ''),
                    'cls' => strval($s['class_name'] ?? ''),
                    'dob' => $s['dob'] ? substr(strval($s['dob']), 0, 10) : '',
                    'house' => strval($s['house'] ?? ''),
                    'parent' => strval($s['parent'] ?? ''),
                    'photoUrl' => $s['photo_url'] ?? null,
                    'address' => $s['address'] ?? null,
                    'guardianName' => $s['guardian_name'] ?? null,
                    'guardianPhone' => $s['guardian_phone'] ?? null,
                    'guardianEmail' => $s['guardian_email'] ?? null,
                    'emergencyName' => $s['emergency_name'] ?? null,
                    'emergencyPhone' => $s['emergency_phone'] ?? null,
                    'extra' => $extra
                ]]);
                return;
            }

            if ($method === 'GET' && $path === '/portal/api/attendance/days') {
                $u = Auth::requireSessionUser();
                if (!in_array($u['role'], ['PARENT', 'STUDENT'], true)) {
                    Response::error(403, 'FORBIDDEN', 'Forbidden');
                    return;
                }
                $studentId = isset($_GET['studentId']) ? trim(strval($_GET['studentId'])) : '';
                $from = isset($_GET['from']) ? trim(strval($_GET['from'])) : '';
                $to = isset($_GET['to']) ? trim(strval($_GET['to'])) : '';
                if ($studentId === '') {
                    Response::error(400, 'VALIDATION_ERROR', 'studentId is required');
                    return;
                }
                if ($to === '') $to = gmdate('Y-m-d');
                if ($from === '') $from = gmdate('Y-m-d', time() - 60 * 60 * 24 * 30);
                if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $from) || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $to)) {
                    Response::error(400, 'VALIDATION_ERROR', 'from/to must be YYYY-MM-DD');
                    return;
                }
                $userRow = $this->getUserById($u['id']);
                $schoolId = is_array($userRow) && is_string($userRow['school_id'] ?? null) ? strval($userRow['school_id']) : '';
                if ($schoolId === '') {
                    Response::error(403, 'FORBIDDEN', 'No school context');
                    return;
                }
                $stmt = Db::pdo()->prepare('SELECT id FROM student_links WHERE school_id=? AND user_id=? AND student_id=? LIMIT 1');
                $stmt->execute([$schoolId, $u['id'], $studentId]);
                if (!$stmt->fetch()) {
                    Response::error(404, 'NOT_FOUND', 'Not found');
                    return;
                }
                
                $days = $this->attendance->getStudentDays($schoolId, $studentId, $from, $to);
                Response::json(200, ['days' => $days]);
                return;
            }

            if ($method === 'GET' && $path === '/portal/api/attendance/summary') {
                $u = Auth::requireSessionUser();
                if (!in_array($u['role'], ['PARENT', 'STUDENT'], true)) {
                    Response::error(403, 'FORBIDDEN', 'Forbidden');
                    return;
                }
                $studentId = isset($_GET['studentId']) ? trim(strval($_GET['studentId'])) : '';
                $from = isset($_GET['from']) ? trim(strval($_GET['from'])) : '';
                $to = isset($_GET['to']) ? trim(strval($_GET['to'])) : '';
                if ($studentId === '') {
                    Response::error(400, 'VALIDATION_ERROR', 'studentId is required');
                    return;
                }
                if ($to === '') $to = gmdate('Y-m-d');
                if ($from === '') $from = gmdate('Y-m-d', time() - 60 * 60 * 24 * 30);
                if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $from) || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $to)) {
                    Response::error(400, 'VALIDATION_ERROR', 'from/to must be YYYY-MM-DD');
                    return;
                }
                $userRow = $this->getUserById($u['id']);
                $schoolId = is_array($userRow) && is_string($userRow['school_id'] ?? null) ? strval($userRow['school_id']) : '';
                if ($schoolId === '') {
                    Response::error(403, 'FORBIDDEN', 'No school context');
                    return;
                }
                $stmt = Db::pdo()->prepare('SELECT id FROM student_links WHERE school_id=? AND user_id=? AND student_id=? LIMIT 1');
                $stmt->execute([$schoolId, $u['id'], $studentId]);
                if (!$stmt->fetch()) {
                    Response::error(404, 'NOT_FOUND', 'Not found');
                    return;
                }
                
                $summary = $this->attendance->getStudentSummary($schoolId, $studentId, $from, $to);
                Response::json(200, ['summary' => $summary]);
                return;
            }

            if ($method === 'GET' && $path === '/students') {
                $ctx = $this->requireSchoolContext();
                $u = $ctx['u'];
                $school = $ctx['school'];
                $actorId = $ctx['actorId'];
                $rows = $this->students->listAll($school['id']);
                $out = array_map(fn($s) => [
                    'id' => $s['id'],
                    'name' => $s['name'],
                    'admNo' => $s['admission_no'],
                    'gender' => $s['gender'] ?? '',
                    'cls' => $s['class_name'] ?? '',
                    'dob' => $s['dob'] ? substr($s['dob'], 0, 10) : '',
                    'house' => $s['house'] ?? '',
                    'parent' => $s['parent'] ?? '',
                    'photoUrl' => $s['photo_url'] ?? null,
                    'address' => $s['address'] ?? null,
                    'guardianName' => $s['guardian_name'] ?? null,
                    'guardianPhone' => $s['guardian_phone'] ?? null,
                    'guardianEmail' => $s['guardian_email'] ?? null,
                    'emergencyName' => $s['emergency_name'] ?? null,
                    'emergencyPhone' => $s['emergency_phone'] ?? null,
                    'extra' => json_decode($s['profile_extra'] ?? '{}', true) ?: new stdClass()
                ], $rows);
                $this->logAudit($actorId, $school['id'], ($u['impersonating'] ?? false) ? 'STUDENTS_LIST_IMPERSONATED' : 'STUDENTS_LIST', ['effectiveUserId' => $u['id']]);
                Response::json(200, ['students' => $out]);
                return;
            }

            if ($method === 'POST' && $path === '/students') {
                $ctx = $this->requireSchoolContext();
                $u = $ctx['u'];
                $school = $ctx['school'];
                $actorId = $ctx['actorId'];
                $this->enforceStudentLimit($school['id'], 1);
                $body = $this->jsonBody();
                
                $name = trim(strval($body['name'] ?? ''));
                $admNo = trim(strval($body['admNo'] ?? ''));
                if ($name === '') {
                    Response::error(400, 'VALIDATION_ERROR', 'Student name is required');
                    return;
                }
                if ($admNo === '') {
                    Response::error(400, 'VALIDATION_ERROR', 'Admission number is required');
                    return;
                }
                $body['name'] = $name;
                $body['admNo'] = $admNo;
                
                try {
                    $id = $this->students->create($school['id'], $body);
                    $this->logAudit($actorId, $school['id'], ($u['impersonating'] ?? false) ? 'STUDENT_CREATE_IMPERSONATED' : 'STUDENT_CREATE', ['studentId' => $id, 'admNo' => $body['admNo'] ?? '', 'effectiveUserId' => $u['id']]);
                    
                    $s = $this->students->getById($school['id'], $id);
                    Response::json(201, ['student' => [
                        'id'=>$s['id'],
                        'name'=>$s['name'],
                        'admNo'=>$s['admission_no'],
                        'gender'=>$s['gender'] ?? '',
                        'cls'=>$s['class_name'] ?? '',
                        'dob'=>$s['dob'] ?? '',
                        'house'=>$s['house'] ?? '',
                        'parent'=>$s['parent'] ?? '',
                        'photoUrl' => $s['photo_url'],
                        'address' => $s['address'],
                        'guardianName' => $s['guardian_name'],
                        'guardianPhone' => $s['guardian_phone'],
                        'guardianEmail' => $s['guardian_email'],
                        'emergencyName' => $s['emergency_name'],
                        'emergencyPhone' => $s['emergency_phone'],
                        'extra' => json_decode($s['profile_extra'] ?? '{}', true) ?: new stdClass()
                    ]]);
                } catch (PDOException $e) {
                    if (str_contains($e->getMessage(), 'Duplicate')) {
                        Response::error(400, 'DUPLICATE_ADMISSION_NO', 'Admission number already exists.');
                        return;
                    }
                    throw $e;
                }
                return;
            }

            if ($method === 'PUT' && preg_match('#^/students/([^/]+)$#', $path, $m)) {
                $ctx = $this->requireSchoolContext();
                $u = $ctx['u'];
                $school = $ctx['school'];
                $actorId = $ctx['actorId'];
                $studentId = strval($m[1] ?? '');
                $s = $this->students->getById($school['id'], $studentId);
                if (!$s) {
                    Response::error(404, 'NOT_FOUND', 'Not found');
                    return;
                }
                $body = $this->jsonBody();
                if (!is_array($body)) {
                    Response::error(400, 'VALIDATION_ERROR', 'Invalid body');
                    return;
                }
                
                $data = [];
                foreach ($body as $k => $v) {
                    if ($k === 'extra') {
                        $data['profile_extra'] = is_array($v) ? json_encode($v, JSON_UNESCAPED_SLASHES) : '{}';
                        continue;
                    }
                    $map = [
                        'admNo' => 'admission_no',
                        'cls' => 'class_name',
                        'photoUrl' => 'photo_url',
                        'guardianName' => 'guardian_name',
                        'guardianPhone' => 'guardian_phone',
                        'guardianEmail' => 'guardian_email',
                        'emergencyName' => 'emergency_name',
                        'emergencyPhone' => 'emergency_phone'
                    ];
                    $col = $map[$k] ?? $this->snake($k);
                    $data[$col] = ($v === null) ? null : strval($v);
                }

                $this->students->update($school['id'], $studentId, $data);
                $this->logAudit($actorId, $school['id'], ($u['impersonating'] ?? false) ? 'STUDENT_UPDATE_IMPERSONATED' : 'STUDENT_UPDATE', ['studentId' => $studentId, 'keys' => array_keys($body), 'effectiveUserId' => $u['id']]);
                Response::json(200, ['ok' => true]);
                return;
            }

            if ($method === 'POST' && $path === '/students/bulk') {
                $ctx = $this->requireSchoolContext();
                $u = $ctx['u'];
                $school = $ctx['school'];
                $actorId = $ctx['actorId'];
                $body = $this->jsonBody();
                if (!is_array($body)) {
                    Response::error(400, 'VALIDATION_ERROR', 'Body must be an array');
                    return;
                }
                $body = array_slice($body, 0, 500);
                $allowed = $this->remainingStudentCapacity($school['id'], count($body));
                if ($allowed <= 0) {
                    Response::error(403, 'LIMIT_EXCEEDED', 'Student limit reached for this plan.');
                    return;
                }
                if ($allowed < count($body)) {
                    $body = array_slice($body, 0, $allowed);
                }
                
                $results = $this->students->bulkImport($school['id'], $body);
                $this->logAudit($actorId, $school['id'], ($u['impersonating'] ?? false) ? 'STUDENT_BULK_IMPORT_IMPERSONATED' : 'STUDENT_BULK_IMPORT', ['created' => $results['created'], 'errorCount' => count($results['errors']), 'effectiveUserId' => $u['id']]);
                Response::json(201, $results);
                return;
            }

            if ($method === 'DELETE' && preg_match('#^/students/([^/]+)$#', $path, $m)) {
                $ctx = $this->requireSchoolContext();
                $u = $ctx['u'];
                $school = $ctx['school'];
                $actorId = $ctx['actorId'];
                $id = $m[1];
                $this->students->delete($school['id'], $id);
                $this->logAudit($actorId, $school['id'], ($u['impersonating'] ?? false) ? 'STUDENT_DELETE_IMPERSONATED' : 'STUDENT_DELETE', ['studentId' => $id, 'effectiveUserId' => $u['id']]);
                Response::noContent();
                return;
            }

            if ($method === 'GET' && $path === '/scores') {
                $ctx = $this->requireSchoolContext();
                $u = $ctx['u'];
                $school = $ctx['school'];
                $actorId = $ctx['actorId'];
                $stmt = Db::pdo()->prepare('SELECT student_id,data FROM score_sheets WHERE school_id=?');
                $stmt->execute([$school['id']]);
                $scores = [];
                foreach ($stmt->fetchAll() as $r) {
                    $scores[$r['student_id']] = json_decode($r['data'], true) ?: [];
                }
                $this->logAudit($actorId, $school['id'], ($u['impersonating'] ?? false) ? 'SCORES_LIST_IMPERSONATED' : 'SCORES_LIST', ['effectiveUserId' => $u['id']]);
                Response::json(200, ['scores' => $scores]);
                return;
            }

            if ($method === 'GET' && preg_match('#^/report-extras/([^/]+)$#', $path, $m)) {
                $ctx = $this->requireSchoolContext();
                $u = $ctx['u'];
                $school = $ctx['school'];
                $studentId = $m[1];
                $stmt = Db::pdo()->prepare('SELECT id FROM students WHERE school_id=? AND id=? LIMIT 1');
                $stmt->execute([$school['id'], $studentId]);
                $stu = $stmt->fetch();
                if (!$stu) {
                    Response::error(404, 'NOT_FOUND', 'Not found');
                    return;
                }
                $session = trim(strval($_GET['session'] ?? ($school['session'] ?? '')));
                $term = trim(strval($_GET['term'] ?? ($school['term'] ?? '')));
                if ($session === '') {
                    $session = '2024/2025';
                }
                if ($term === '') {
                    $term = 'First Term';
                }
                $stmt = Db::pdo()->prepare('SELECT attendance,traits FROM report_extras WHERE school_id=? AND student_id=? AND session=? AND term=? LIMIT 1');
                $stmt->execute([$school['id'], $studentId, $session, $term]);
                $row = $stmt->fetch();
                $attendance = ['daysOpened' => null, 'daysPresent' => null, 'timesLate' => null];
                $traits = new stdClass();
                if ($row) {
                    $a = json_decode($row['attendance'] ?? '{}', true);
                    $t = json_decode($row['traits'] ?? '{}', true);
                    if (is_array($a)) {
                        $attendance = array_merge($attendance, $a);
                    }
                    if (is_array($t)) {
                        $traits = $t;
                    }
                }
                Response::json(200, ['extras' => ['session' => $session, 'term' => $term, 'attendance' => $attendance, 'traits' => $traits]]);
                return;
            }

            if ($method === 'PUT' && preg_match('#^/report-extras/([^/]+)$#', $path, $m)) {
                $ctx = $this->requireSchoolContext();
                $u = $ctx['u'];
                $school = $ctx['school'];
                $actorId = $ctx['actorId'];
                $studentId = $m[1];
                $stmt = Db::pdo()->prepare('SELECT id FROM students WHERE school_id=? AND id=? LIMIT 1');
                $stmt->execute([$school['id'], $studentId]);
                $stu = $stmt->fetch();
                if (!$stu) {
                    Response::error(404, 'NOT_FOUND', 'Not found');
                    return;
                }
                $body = $this->jsonBody();
                $session = trim(strval($body['session'] ?? ($school['session'] ?? '')));
                $term = trim(strval($body['term'] ?? ($school['term'] ?? '')));
                if ($session === '' || $term === '') {
                    Response::error(400, 'VALIDATION_ERROR', 'session and term are required');
                    return;
                }

                $attendanceIn = $body['attendance'] ?? null;
                $traitsIn = $body['traits'] ?? null;
                if (!is_array($attendanceIn) || !is_array($traitsIn)) {
                    Response::error(400, 'VALIDATION_ERROR', 'attendance and traits must be objects');
                    return;
                }

                $normInt = function ($v) {
                    if ($v === null || $v === '') return null;
                    $n = intval($v);
                    return $n >= 0 ? $n : null;
                };
                $attendance = [
                    'daysOpened' => $normInt($attendanceIn['daysOpened'] ?? null),
                    'daysPresent' => $normInt($attendanceIn['daysPresent'] ?? null),
                    'timesLate' => $normInt($attendanceIn['timesLate'] ?? null)
                ];
                if ($attendance['daysOpened'] !== null && $attendance['daysPresent'] !== null && $attendance['daysPresent'] > $attendance['daysOpened']) {
                    Response::error(400, 'VALIDATION_ERROR', 'daysPresent cannot exceed daysOpened');
                    return;
                }

                $allowedTraits = ['punctuality','neatness','cooperation','leadership'];
                $traits = [];
                foreach ($allowedTraits as $k) {
                    $v = $traitsIn[$k] ?? null;
                    if (!is_array($v)) {
                        $traits[$k] = ['rating' => null, 'remark' => ''];
                        continue;
                    }
                    $rating = array_key_exists('rating', $v) ? $v['rating'] : null;
                    $rating = ($rating === null || $rating === '') ? null : intval($rating);
                    if ($rating !== null && ($rating < 1 || $rating > 5)) {
                        Response::error(400, 'VALIDATION_ERROR', 'Trait rating must be 1-5');
                        return;
                    }
                    $remark = trim(strval($v['remark'] ?? ''));
                    if (mb_strlen($remark) > 200) {
                        Response::error(400, 'VALIDATION_ERROR', 'Trait remark too long');
                        return;
                    }
                    $traits[$k] = ['rating' => $rating, 'remark' => $remark];
                }

                $comments = [
                    'teacher' => trim(strval($body['comments']['teacher'] ?? '')),
                    'principal' => trim(strval($body['comments']['principal'] ?? ''))
                ];
                $promotion = trim(strval($body['promotion'] ?? ''));

                $id = $this->id('rx');
                $sql = Db::isSqlite()
                    ? 'INSERT INTO report_extras (id,school_id,student_id,session,term,attendance,traits,comments,promotion,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,NOW(),NOW()) ON CONFLICT(school_id,student_id,session,term) DO UPDATE SET attendance=excluded.attendance, traits=excluded.traits, comments=excluded.comments, promotion=excluded.promotion, updated_at=excluded.updated_at'
                    : 'INSERT INTO report_extras (id,school_id,student_id,session,term,attendance,traits,comments,promotion,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,NOW(),NOW()) ON DUPLICATE KEY UPDATE attendance=VALUES(attendance), traits=VALUES(traits), comments=VALUES(comments), promotion=VALUES(promotion), updated_at=VALUES(updated_at)';
                Db::pdo()->prepare($sql)->execute([
                    $id,
                    $school['id'],
                    $studentId,
                    $session,
                    $term,
                    json_encode($attendance, JSON_UNESCAPED_SLASHES),
                    json_encode($traits, JSON_UNESCAPED_SLASHES),
                    json_encode($comments, JSON_UNESCAPED_SLASHES),
                    $promotion
                ]);

                $this->logAudit($actorId, $school['id'], ($u['impersonating'] ?? false) ? 'REPORT_EXTRAS_SAVE_IMPERSONATED' : 'REPORT_EXTRAS_SAVE', ['studentId' => $studentId, 'session' => $session, 'term' => $term, 'effectiveUserId' => $u['id']]);
                Response::json(200, ['ok' => true]);
                return;
            }

            if ($method === 'POST' && preg_match('#^/reports/pdf/student/([^/]+)$#', $path, $m)) {
                $u = Auth::requireUser();
                if (!in_array($u['role'], ['SCHOOL', 'SCHOOL_ADMIN', 'TEACHER', 'PARENT', 'STUDENT'], true)) {
                    Response::error(403, 'FORBIDDEN', 'Access denied');
                    return;
                }
                $actorId = ($u['impersonating'] ?? false) ? ($u['adminId'] ?? $u['id']) : $u['id'];
                RateLimit::enforce('pdf-student:' . $ip, 30, 3600);
                
                if ($u['role'] === 'SCHOOL' || $u['role'] === 'SCHOOL_ADMIN') {
                    $school = $this->getSchoolByOwnerIdOrSchoolId($u['id'], $u['role']);
                } else {
                    $userRow = $this->getUserById($u['id']);
                    $schoolId = is_array($userRow) && is_string($userRow['school_id'] ?? null) ? strval($userRow['school_id']) : '';
                    $school = $schoolId !== '' ? $this->getSchoolById($schoolId) : null;
                }
                
                if (!$school) {
                    Response::error(404, 'NOT_FOUND', 'Not found');
                    return;
                }

                $studentId = $m[1];
                $stmt = Db::pdo()->prepare('SELECT id,name,admission_no,gender,class_name FROM students WHERE school_id=? AND id=? LIMIT 1');
                $stmt->execute([$school['id'], $studentId]);
                $student = $stmt->fetch();
                if (!$student) {
                    Response::error(404, 'NOT_FOUND', 'Not found');
                    return;
                }

                if ($u['role'] === 'TEACHER') {
                    $allowed = $this->getTeacherAssignedClasses($school['id'], $u['id']);
                    if (!in_array($student['class_name'] ?? '', $allowed, true)) {
                        Response::error(403, 'FORBIDDEN', 'Access denied');
                        return;
                    }
                } else if ($u['role'] === 'PARENT' || $u['role'] === 'STUDENT') {
                    $stmt = Db::pdo()->prepare('SELECT id FROM student_links WHERE school_id=? AND user_id=? AND student_id=? LIMIT 1');
                    $stmt->execute([$school['id'], $u['id'], $studentId]);
                    if (!$stmt->fetch()) {
                        Response::error(403, 'FORBIDDEN', 'Access denied');
                        return;
                    }
                }
                $scores = $this->getScoresForStudent($school['id'], $studentId);
                $extras = $this->getReportExtras($school['id'], $studentId, strval($school['session'] ?? ''), strval($school['term'] ?? ''));
                $classStats = $this->buildClassStats($school, strval($student['class_name'] ?? ''));
                $html = ReportPdf::buildStudentHtml($school, $student, $scores, $extras, $classStats);
                try {
                    $pdf = PdfRenderer::htmlToPdf($html);
                    $filename = $this->makeStudentPdfFilename($school, $student);
                    $export = $this->createReportExport($school['id'], $filename, $pdf);
                } catch (Throwable $e) {
                    Response::error(501, 'PDF_RENDERER_UNAVAILABLE', $e->getMessage());
                    return;
                }
                $this->logAudit($actorId, $school['id'], ($u['impersonating'] ?? false) ? 'REPORT_PDF_STUDENT_IMPERSONATED' : 'REPORT_PDF_STUDENT', ['studentId' => $studentId, 'token' => $export['token'], 'effectiveUserId' => $u['id']]);
                Response::json(200, ['downloadUrl' => $export['url'], 'expiresAt' => $export['expiresAt']]);
                return;
            }

            if ($method === 'POST' && $path === '/reports/pdf/class') {
                $ctx = $this->requireSchoolContext();
                $u = $ctx['u'];
                $school = $ctx['school'];
                $actorId = $ctx['actorId'];
                $this->enforceFeatureAccess($school['id'], 'batch_pdf');
                RateLimit::enforce('pdf-class:' . $ip, 20, 3600);
                $body = $this->jsonBody();
                $className = trim(strval($body['className'] ?? ''));
                if ($className === '') {
                    Response::error(400, 'VALIDATION_ERROR', 'className is required');
                    return;
                }
                
                // Create background job
                $jobId = $this->jobs->create($school['id'], $u['id'], 'CLASS_PDF', [
                    'className' => $className,
                    'actorId' => $actorId,
                    'isImpersonated' => ($u['impersonating'] ?? false)
                ]);

                $this->logAudit($actorId, $school['id'], ($u['impersonating'] ?? false) ? 'REPORT_PDF_CLASS_QUEUED_IMPERSONATED' : 'REPORT_PDF_CLASS_QUEUED', ['className' => $className, 'jobId' => $jobId]);
                Response::json(202, ['jobId' => $jobId, 'status' => 'PENDING']);
                return;
            }

            if ($method === 'GET' && preg_match('#^/jobs/([^/]+)$#', $path, $m)) {
                $u = Auth::requireUser();
                $jobId = $m[1];
                $job = $this->jobs->getById($jobId);
                if (!$job) {
                    Response::error(404, 'NOT_FOUND', 'Job not found');
                    return;
                }
                
                // Security check: only the user who created the job or an admin can see it
                if ($u['role'] !== 'ADMIN' && $job['user_id'] !== $u['id']) {
                    // Fallback: check if the job belongs to the user's school (for TEACHER/SCHOOL_ADMIN)
                    $schoolId = null;
                    if ($u['role'] === 'TEACHER' || $u['role'] === 'SCHOOL_ADMIN') {
                        $row = $this->getUserById($u['id']);
                        if (is_array($row) && is_string($row['school_id'] ?? null)) {
                            $schoolId = strval($row['school_id']);
                        }
                    } elseif ($u['role'] === 'SCHOOL') {
                        $school = $this->getSchoolByOwnerId($u['id']);
                        if ($school) {
                            $schoolId = $school['id'];
                        }
                    }
                    if (!$schoolId || $job['school_id'] !== $schoolId) {
                        Response::error(403, 'FORBIDDEN', 'Access denied');
                        return;
                    }
                }

                Response::json(200, [
                    'id' => $job['id'],
                    'status' => $job['status'],
                    'progress' => intval($job['progress']),
                    'resultUrl' => $job['result_url'],
                    'error' => $job['error'],
                    'createdAt' => $job['created_at'],
                    'updatedAt' => $job['updated_at']
                ]);
                return;
            }

            if ($method === 'POST' && $path === '/jobs/worker') {
                $u = Auth::requireUser();
                if ($u['role'] !== 'ADMIN') {
                    $schoolId = null;
                    if ($u['role'] === 'SCHOOL') {
                        $school = $this->getSchoolByOwnerId($u['id']);
                        if ($school) {
                            $schoolId = $school['id'];
                        }
                    } elseif ($u['role'] === 'TEACHER' || $u['role'] === 'SCHOOL_ADMIN') {
                        $row = $this->getUserById($u['id']);
                        if (is_array($row) && is_string($row['school_id'] ?? null)) {
                            $schoolId = strval($row['school_id']);
                        }
                    }
                    if (!$schoolId) {
                        Response::error(403, 'FORBIDDEN', 'Access denied');
                        return;
                    }
                    $processed = $this->processJobs($schoolId);
                } else {
                    $processed = $this->processJobs();
                }
                Response::json(200, ['ok' => true, 'processed' => $processed]);
                return;
            }

            if ($method === 'POST' && $path === '/reports/share/sms') {
                $ctx = $this->requireSchoolContext();
                $u = $ctx['u'];
                $school = $ctx['school'];
                $actorId = $ctx['actorId'];
                RateLimit::enforce('report-sms:' . $ip, 20, 3600);
                $body = $this->jsonBody();
                $studentId = trim(strval($body['studentId'] ?? ''));
                $to = trim(strval($body['to'] ?? ''));
                if ($studentId === '' || $to === '') {
                    Response::error(400, 'VALIDATION_ERROR', 'studentId and to are required');
                    return;
                }
                $stmt = Db::pdo()->prepare('SELECT id,name,admission_no,gender,class_name FROM students WHERE school_id=? AND id=? LIMIT 1');
                $stmt->execute([$school['id'], $studentId]);
                $student = $stmt->fetch();
                if (!$student) {
                    Response::error(404, 'NOT_FOUND', 'Not found');
                    return;
                }
                $scores = $this->getScoresForStudent($school['id'], $studentId);
                $subjects = json_decode($school['subjects'] ?? '[]', true) ?: [];
                $ca1Max = intval($school['ca1_max'] ?? 10);
                $ca2Max = intval($school['ca2_max'] ?? 10);
                $examMax = intval($school['exam_max'] ?? 80);
                $totalMax = max(1, $ca1Max + $ca2Max + $examMax);

                $short = function (string $name): string {
                    $n = strtolower(trim($name));
                    if ($n === 'mathematics' || $n === 'math' || $n === 'maths') return 'Math';
                    if ($n === 'english language' || $n === 'english') return 'Eng';
                    if ($n === 'basic science') return 'Sci';
                    if ($n === 'social studies') return 'Soc';
                    if ($n === 'civic education') return 'Civic';
                    if ($n === 'agricultural science') return 'Agri';
                    if ($n === 'business studies') return 'Bus';
                    $parts = preg_split('/\s+/', trim($name)) ?: [];
                    $abbr = '';
                    foreach ($parts as $p) {
                        $abbr .= mb_strtoupper(mb_substr($p, 0, 1));
                    }
                    $abbr = trim($abbr);
                    if ($abbr !== '' && mb_strlen($abbr) <= 6) return $abbr;
                    return mb_substr($name, 0, 6);
                };

                $pairs = [];
                foreach ($subjects as $sub) {
                    $sv = is_array($scores[$sub] ?? null) ? $scores[$sub] : [];
                    $tot = floatval($sv['ca1'] ?? 0) + floatval($sv['ca2'] ?? 0) + floatval($sv['exam'] ?? 0);
                    $pct = ($tot / $totalMax) * 100.0;
                    $pairs[] = $short(strval($sub)) . ': ' . number_format($pct, 0) . '%';
                }

                $avgPct = ReportPdf::studentAvgPct($subjects, $scores, $totalMax);
                $avgText = $avgPct === null ? '—' : number_format($avgPct, 1) . '%';

                $className = strval($student['class_name'] ?? '');
                $classStats = $this->buildClassStats($school, $className);
                $classAvgs = $classStats['_studentAverages'] ?? [];
                $classCount = intval($classStats['_classCount'] ?? 0);
                $pos = 1;
                if ($avgPct !== null && is_array($classAvgs)) {
                    $pos = 1 + count(array_filter($classAvgs, fn ($v) => floatval($v) > floatval($avgPct)));
                }
                $posText = $classCount > 0 ? ($pos . '/' . $classCount) : strval($pos);

                $maxSubjectsInSms = Config::envInt('SMS_REPORT_MAX_SUBJECTS', 8);
                if ($maxSubjectsInSms < 1) $maxSubjectsInSms = 8;
                $pairsTrim = array_slice($pairs, 0, $maxSubjectsInSms);
                if (count($pairs) > count($pairsTrim)) {
                    $pairsTrim[] = '...';
                }

                $msg = 'ReportSheet Summary' . "\n"
                    . strval($student['name']) . ' (' . $className . ')' . "\n"
                    . strval($school['term'] ?? '') . ' ' . strval($school['session'] ?? '') . "\n"
                    . implode(', ', $pairsTrim) . "\n"
                    . 'Total: ' . $avgText . ' | Pos: ' . $posText;

                try {
                    Sms::send($to, $msg);
                } catch (Throwable $e) {
                    Response::error(501, 'SMS_NOT_CONFIGURED', $e->getMessage(), ['preview' => $msg]);
                    return;
                }

                $this->logAudit($actorId, $school['id'], ($u['impersonating'] ?? false) ? 'REPORT_SMS_IMPERSONATED' : 'REPORT_SMS', ['studentId' => $studentId, 'to' => $to, 'effectiveUserId' => $u['id']]);
                Response::json(200, ['ok' => true, 'preview' => $msg]);
                return;
            }

            if ($method === 'PUT' && preg_match('#^/scores/([^/]+)$#', $path, $m)) {
                $ctx = $this->requireSchoolContext();
                $u = $ctx['u'];
                $school = $ctx['school'];
                $actorId = $ctx['actorId'];
                $studentId = $m[1];
                $stmt = Db::pdo()->prepare('SELECT id FROM students WHERE school_id=? AND id=?');
                $stmt->execute([$school['id'], $studentId]);
                if (!$stmt->fetch()) {
                    Response::error(404, 'NOT_FOUND', 'Not found');
                    return;
                }
                $body = $this->jsonBody();
                if (!is_array($body)) {
                    Response::error(400, 'VALIDATION_ERROR', 'Invalid body');
                    return;
                }
                $data = json_encode($body, JSON_UNESCAPED_SLASHES);
                $pdo = Db::pdo();
                $sql = Db::isSqlite()
                    ? 'INSERT INTO score_sheets (id,school_id,student_id,data,created_at,updated_at) VALUES (?,?,?,?,NOW(),NOW()) ON CONFLICT(school_id,student_id) DO UPDATE SET data=excluded.data, updated_at=NOW()'
                    : 'INSERT INTO score_sheets (id,school_id,student_id,data,created_at,updated_at) VALUES (?,?,?,?,NOW(),NOW()) ON DUPLICATE KEY UPDATE data=VALUES(data),updated_at=NOW()';
                $pdo->prepare($sql)->execute([$this->id('scr'), $school['id'], $studentId, $data]);
                $this->logAudit($actorId, $school['id'], ($u['impersonating'] ?? false) ? 'SCORES_SAVE_IMPERSONATED' : 'SCORES_SAVE', ['studentId' => $studentId, 'effectiveUserId' => $u['id']]);
                Response::json(200, ['ok' => true]);
                return;
            }

            if ($method === 'POST' && $path === '/ai/exam/generate') {
                $ctx = $this->requireSchoolContext();
                $u = $ctx['u'];
                $school = $ctx['school'];
                if (!$school) { Response::error(404, 'NOT_FOUND', 'School not found'); return; }
                
                // Feature check: AI Exam requires ai_exam feature
                $this->enforceFeatureAccess($school['id'], 'ai_exam');
                // Check AI credits
                $credits = $this->getAiCredits($school['id']);
                if ($credits['remaining'] < 2) {
                    Response::error(403, 'INSUFFICIENT_CREDITS', 'Not enough AI credits. You need 2 credits per exam generation. Current balance: ' . $credits['remaining']);
                    return;
                }
                $body = $this->jsonBody();
                $subject = Validation::requireString($body, 'subject', 2, 100);
                $classLevel = Validation::requireString($body, 'classLevel', 2, 50);
                $topic = Validation::requireString($body, 'topic', 5, 2000);
                $questionCount = (int)($body['questionCount'] ?? 10);
                if ($questionCount < 1 || $questionCount > 50) $questionCount = 10;
                
                try {
                    $questions = Ai::generateExamQuestions([
                        'subject' => $subject,
                        'classLevel' => $classLevel,
                        'topic' => $topic,
                        'questionCount' => $questionCount
                    ]);
                    
                    // Deduct credits only on success
                    $this->useAiCredit($school['id'], 2);
                    
                    $id = $this->id('exm');
                    $stmt = Db::pdo()->prepare("INSERT INTO generated_exams (id,school_id,teacher_id,subject,class_level,topic,questions,created_at,updated_at) VALUES (?,?,?,?,?,?,?,NOW(),NOW())");
                    $stmt->execute([$id, $school['id'], $u['id'], $subject, $classLevel, $topic, json_encode($questions, JSON_UNESCAPED_SLASHES)]);
                    
                    Response::json(200, ['id' => $id, 'questions' => $questions, 'creditsRemaining' => $credits['remaining'] - 2]);
                } catch (Throwable $e) {
                    Response::error(500, 'AI_ERROR', $e->getMessage());
                }
                return;
            }

            if ($method === 'GET' && $path === '/ai/exam') {
                $ctx = $this->requireSchoolContext();
                $u = $ctx['u'];
                $school = $ctx['school'];
                if (!$school) { Response::error(404, 'NOT_FOUND', 'School not found'); return; }
                
                $stmt = Db::pdo()->prepare("SELECT id, subject, class_level, topic, created_at FROM generated_exams WHERE school_id=? ORDER BY created_at DESC");
                $stmt->execute([$school['id']]);
                Response::json(200, ['exams' => $stmt->fetchAll()]);
                return;
            }

            if ($method === 'GET' && preg_match('#^/ai/exam/([^/]+)$#', $path, $m)) {
                $ctx = $this->requireSchoolContext();
                $u = $ctx['u'];
                $school = $ctx['school'];
                if (!$school) { Response::error(404, 'NOT_FOUND', 'School not found'); return; }
                
                $stmt = Db::pdo()->prepare("SELECT * FROM generated_exams WHERE id=? AND school_id=?");
                $stmt->execute([$m[1], $school['id']]);
                $exam = $stmt->fetch();
                if (!$exam) { Response::error(404, 'NOT_FOUND', 'Exam not found'); return; }
                
                $exam['questions'] = json_decode($exam['questions'], true);
                Response::json(200, ['exam' => $exam]);
                return;
            }

            if ($method === 'DELETE' && preg_match('#^/ai/exam/([^/]+)$#', $path, $m)) {
                $ctx = $this->requireSchoolContext();
                $u = $ctx['u'];
                $school = $ctx['school'];
                if (!$school) { Response::error(404, 'NOT_FOUND', 'School not found'); return; }
                
                $stmt = Db::pdo()->prepare("DELETE FROM generated_exams WHERE id=? AND school_id=?");
                $stmt->execute([$m[1], $school['id']]);
                Response::json(200, ['ok' => true]);
                return;
            }

            if ($method === 'POST' && preg_match('#^/ai/report/([^/]+)$#', $path, $m)) {
                $ctx = $this->requireSchoolContext();
                $u = $ctx['u'];
                $school = $ctx['school'];
                $actorId = $ctx['actorId'];

                // Feature check: AI Reports requires ai_reports feature
                $this->enforceFeatureAccess($school['id'], 'ai_reports');
                // Check AI credits (costs 1 per report)
                $credits = $this->getAiCredits($school['id']);
                if ($credits['remaining'] < 1) {
                    Response::error(403, 'INSUFFICIENT_CREDITS', 'Not enough AI credits. You need 1 credit per AI report. Current balance: ' . $credits['remaining'] . '. Purchase more credits from the admin.');
                    return;
                }
                $studentId = $m[1];
                $stmt = Db::pdo()->prepare('SELECT name,class_name FROM students WHERE school_id=? AND id=?');
                $stmt->execute([$school['id'], $studentId]);
                $stu = $stmt->fetch();
                if (!$stu) {
                    Response::error(404, 'NOT_FOUND', 'Not found');
                    return;
                }
                $scores = [];
                $stmt = Db::pdo()->prepare('SELECT data FROM score_sheets WHERE school_id=? AND student_id=?');
                $stmt->execute([$school['id'], $studentId]);
                $sheet = $stmt->fetch();
                if ($sheet && is_string($sheet['data'])) {
                    $scores = json_decode($sheet['data'], true) ?: [];
                }
                $subjects = json_decode($school['subjects'], true) ?: [];
                $total = 0.0;
                $count = 0.0;
                $max = intval($school['ca1_max'] ?? 10) + intval($school['ca2_max'] ?? 10) + intval($school['exam_max'] ?? 80);
                if ($max <= 0) {
                    $max = 100;
                }
                foreach ($subjects as $subjectName) {
                    $s = $scores[$subjectName] ?? null;
                    if (!is_array($s)) {
                        continue;
                    }
                    $total += floatval($s['ca1'] ?? 0) + floatval($s['ca2'] ?? 0) + floatval($s['exam'] ?? 0);
                    $count += 1.0;
                }
                $avgRaw = $count > 0 ? $total / $count : null;
                $avg = $avgRaw === null ? null : ($avgRaw / $max) * 100;
                $firstName = trim(explode(' ', $stu['name'])[0] ?? $stu['name']);
                $ctx = [
                    'context' => [
                        'country' => 'Nigeria',
                        'schoolName' => $school['name'],
                        'term' => $school['term'],
                        'session' => $school['session']
                    ],
                    'student' => [
                        'firstName' => $firstName,
                        'className' => $stu['class_name'] ?? ''
                    ],
                    'performance' => [
                        'average' => $avg,
                        'subjects' => array_map(function ($subjectName) use ($scores, $max) {
                            $s = $scores[$subjectName] ?? [];
                            $tot = floatval($s['ca1'] ?? 0) + floatval($s['ca2'] ?? 0) + floatval($s['exam'] ?? 0);
                            $pct = $max > 0 ? ($tot / $max) * 100 : 0;
                            return ['subject' => $subjectName, 'total' => $tot, 'percent' => $pct];
                        }, $subjects)
                    ]
                ];
                $ctx['firstName'] = $firstName;
                $ctx['average'] = $avg;
                $out = Ai::generateReport($ctx);
                // Deduct credit on success
                $this->useAiCredit($school['id'], 1);
                $remainingCredits = $credits['remaining'] - 1;
                $this->logAudit($actorId, $school['id'], ($u['impersonating'] ?? false) ? 'AI_REPORT_IMPERSONATED' : 'AI_REPORT', ['studentId' => $studentId, 'effectiveUserId' => $u['id'], 'creditsRemaining' => $remainingCredits]);
                Response::json(200, array_merge($out, ['creditsRemaining' => $remainingCredits]));
                return;
            }

            if ($method === 'GET' && $path === '/ai/credits') {
                $ctx = $this->requireSchoolContext();
                $credits = $this->getAiCredits($ctx['school']['id']);
                $cfg = $this->getEffectivePlanConfigForSchool($ctx['school']['id']);
                $planLimit = $cfg['limits']['aiCredits'] ?? 0;
                Response::json(200, [
                    'remaining' => $credits['remaining'],
                    'total' => $credits['total'],
                    'planLimit' => $planLimit,
                    'perExamCost' => 2,
                    'perReportCost' => 1
                ]);
                return;
            }

            if ($method === 'POST' && $path === '/ai/credits/purchase') {
                $ctx = $this->requireSchoolContext();
                $u = $ctx['u'];
                $school = $ctx['school'];
                $body = $this->jsonBody();
                $amount = intval($body['amount'] ?? 0);
                if ($amount < 10 || $amount > 10000) {
                    Response::error(400, 'VALIDATION_ERROR', 'Amount must be between 10 and 10,000 credits');
                    return;
                }
                // Check if plan allows AI credits purchase (only lifetime/pro)
                $cfg = $this->getEffectivePlanConfigForSchool($school['id']);
                $planLimit = $cfg['limits']['aiCredits'] ?? 0;
                if ($planLimit === 0 && ($cfg['limits']['aiCredits'] ?? null) !== null) {
                    Response::error(403, 'UPGRADE_REQUIRED', 'Your plan does not support AI features. Please upgrade.');
                    return;
                }
                // Calculate price: ₦100 per 10 credits = ₦10/credit
                $pricePerCredit = 1000; // 1000 kobo = ₦10 per credit
                $totalKobo = $amount * $pricePerCredit;
                // Create a payment for the credits
                $stmt = Db::pdo()->prepare('INSERT INTO payments (id,school_id,amount,currency,status,description,metadata,created_at) VALUES (?,?,?,?,?,?,?,NOW())');
                $payId = $this->id('pay');
                $stmt->execute([$payId, $school['id'], $totalKobo, 'NGN', 'COMPLETED', 'AI Credits x' . $amount, json_encode(['type' => 'ai_credits', 'credits' => $amount])]);
                $this->addAiCredits($school['id'], $amount);
                $this->logAudit($u['id'], $school['id'], 'AI_CREDITS_PURCHASE', ['amount' => $amount, 'totalKobo' => $totalKobo]);
                $credits = $this->getAiCredits($school['id']);
                Response::json(200, ['ok' => true, 'creditsAdded' => $amount, 'creditsRemaining' => $credits['remaining'], 'paymentId' => $payId]);
                return;
            }

            if ($method === 'POST' && $path === '/payments/initialize') {
                $ctx = $this->requireSchoolContext();
                $u = $ctx['u'];
                $school = $ctx['school'];
                $body = $this->jsonBody();
                $gateway = strtoupper(trim(Validation::requireString($body, 'gateway', 2, 50)));
                $planSlug = strtolower(trim(Validation::requireString($body, 'planSlug', 2, 80)));
                $billingCycle = strtoupper(trim(strval($body['billingCycle'] ?? 'MONTHLY')));
                $callbackUrl = isset($body['callbackUrl']) ? strval($body['callbackUrl']) : null;

                if (!in_array($gateway, $this->paymentGateways(), true)) {
                    Response::error(400, 'VALIDATION_ERROR', 'Unsupported gateway');
                    return;
                }

                $plan = $this->getPlanBySlugCurrent($planSlug);
                if (!$plan) {
                    Response::error(404, 'NOT_FOUND', 'Plan not found');
                    return;
                }
                
                // If it's the lifetime or pro plan, force billing cycle to LIFETIME
                if (in_array($planSlug, ['lifetime', 'pro'])) {
                    $billingCycle = 'LIFETIME';
                } else if ($planSlug === 'starter') {
                    $billingCycle = 'ANNUAL'; // Force annual for starter
                }

                $amountKobo = $this->planPriceKobo($plan['config'], $billingCycle);
                $currency = $this->planCurrency($plan['config']);
                
                if ($amountKobo <= 0) {
                    $pdo = Db::pdo();
                    $subStmt = $pdo->prepare('SELECT id FROM school_subscriptions WHERE school_id=? LIMIT 1');
                    $subStmt->execute([$school['id']]);
                    if ($subStmt->fetch()) {
                        Response::error(400, 'ALREADY_SUBSCRIBED', 'School already has a subscription.');
                        return;
                    }

                    $start = gmdate('Y-m-d H:i:s');
                    $end = $this->periodEndUtc($start, $billingCycle);
                    $trialDays = intval($plan['config']['trialDays'] ?? 0);
                    $status = $trialDays > 0 ? 'TRIALING' : 'ACTIVE';
                    $trialEnd = $trialDays > 0 ? gmdate('Y-m-d H:i:s', time() + ($trialDays * 86400)) : null;

                    $pdo->beginTransaction();
                    $stmt = $pdo->prepare('INSERT INTO school_subscriptions (id,school_id,plan_id,plan_version_id,status,billing_cycle,current_amount_kobo,currency,current_period_start,current_period_end,trial_end,cancel_at_period_end,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,NOW(),NOW())');
                    $stmt->execute([$this->id('sub'), $school['id'], $plan['planId'], $plan['versionId'], $status, $billingCycle, 0, $currency, $start, $end, $trialEnd, 0]);
                    $pdo->commit();
                    
                    Response::json(200, ['ok' => true, 'virtualAccount' => null, 'checkoutUrl' => null, 'reference' => null]);
                    return;
                }

                $pid = $this->id('pay');
                $ref = $pid;
                $meta = json_encode(['type' => 'SUBSCRIPTION', 'schoolId' => $school['id'], 'planSlug' => $planSlug, 'billingCycle' => $billingCycle], JSON_UNESCAPED_SLASHES);

                $pdo = Db::pdo();
                $stmt = $pdo->prepare("INSERT INTO payments (id,school_id,provider,status,amount_kobo,currency,reference,metadata,created_at) VALUES (?,?,?,?,?,?,?,?,NOW())");
                $stmt->execute([$pid, $school['id'], $gateway, 'PENDING', $amountKobo, $currency, $ref, $meta]);

                $keys = $pdo->prepare("SELECT key_name, ciphertext FROM payment_gateway_keys WHERE gateway=? AND active=1");
                $keys->execute([$gateway]);
                $keyRows = $keys->fetchAll();
                $creds = [];
                foreach ($keyRows as $kr) {
                    $creds[$kr['key_name']] = Crypto::decrypt($kr['ciphertext']);
                }

                $checkoutData = [
                    'paymentId' => $pid,
                    'reference' => $ref,
                    'amountKobo' => $amountKobo,
                    'currency' => $currency,
                    'gateway' => $gateway
                ];

                if ($gateway === 'PAYVESSEL') {
                    $checkoutData['publicKey'] = $creds['PUBLIC_KEY'] ?? '';
                } elseif ($gateway === 'PAYSTACK') {
                    $checkoutData['publicKey'] = $creds['PUBLIC_KEY'] ?? '';
                } elseif ($gateway === 'PAYMENTPOINT') {
                    $checkoutData['virtualAccount'] = [
                        'bankName' => 'Wema Bank',
                        'accountName' => 'ReportSheet - ' . $school['name'],
                        'accountNumber' => '0123456789'
                    ];
                }

                Response::json(200, $checkoutData);
                return;
            }

            if ($method === 'GET' && preg_match('#^/payments/verify/([^/]+)$#', $path, $m)) {
                $ref = $m[1];
                $pdo = Db::pdo();
                $stmt = $pdo->prepare('SELECT id,school_id,status,metadata FROM payments WHERE reference=? LIMIT 1');
                $stmt->execute([$ref]);
                $payment = $stmt->fetch();
                
                if (!$payment) {
                    Response::error(404, 'NOT_FOUND', 'Payment not found');
                    return;
                }

                if ($payment['status'] === 'SUCCESS') {
                    Response::json(200, ['status' => 'SUCCESS']);
                    return;
                }

                Response::json(200, ['status' => $payment['status']]);
                return;
            }

            if ($method === 'POST' && preg_match('#^/webhooks/([^/]+)$#', $path, $m)) {
                $gateway = strtoupper(trim($m[1]));
                if (!in_array($gateway, $this->paymentGateways(), true)) {
                    Response::error(400, 'VALIDATION_ERROR', 'Unknown gateway');
                    return;
                }
                
                $pdo = Db::pdo();
                $keys = $pdo->prepare("SELECT key_name, ciphertext FROM payment_gateway_keys WHERE gateway=? AND active=1");
                $keys->execute([$gateway]);
                $keyRows = $keys->fetchAll();
                $creds = [];
                foreach ($keyRows as $kr) {
                    $creds[$kr['key_name']] = Crypto::decrypt($kr['ciphertext']);
                }
                
                $rawBody = file_get_contents('php://input');
                $body = json_decode($rawBody, true) ?: [];
                $headers = getallheaders();
                $headersUpper = [];
                foreach ($headers as $k => $v) {
                    $headersUpper[strtoupper($k)] = $v;
                }

                $isValid = false;
                $reference = null;

                if ($gateway === 'PAYSTACK') {
                    $signature = $headersUpper['X-PAYSTACK-SIGNATURE'] ?? '';
                    $secret = $creds['SECRET_KEY'] ?? '';
                    if ($signature === hash_hmac('sha512', $rawBody, $secret)) {
                        $isValid = true;
                        if (($body['event'] ?? '') === 'charge.success') {
                            $reference = $body['data']['reference'] ?? null;
                        }
                    }
                } elseif ($gateway === 'FLUTTERWAVE') {
                    $signature = $headersUpper['VERIF-HASH'] ?? '';
                    $secret = $creds['SECRET_HASH'] ?? '';
                    if ($signature === $secret) {
                        $isValid = true;
                        if (($body['event'] ?? '') === 'charge.completed' && ($body['data']['status'] ?? '') === 'successful') {
                            $reference = $body['data']['tx_ref'] ?? null;
                        }
                    }
                } elseif ($gateway === 'MONNIFY') {
                    $signature = $headersUpper['MONNIFY-SIGNATURE'] ?? '';
                    $secret = $creds['SECRET_KEY'] ?? '';
                    if ($signature === hash_hmac('sha512', $rawBody, $secret)) {
                        $isValid = true;
                        if (($body['eventType'] ?? '') === 'SUCCESSFUL_TRANSACTION') {
                            $reference = $body['eventData']['paymentReference'] ?? null;
                        }
                    }
                } elseif ($gateway === 'PAYVESSEL') {
                    $signature = $headersUpper['PAYVESSEL-HTTP-SIGNATURE'] ?? '';
                    $secret = $creds['SECRET_KEY'] ?? '';
                    if ($signature === hash_hmac('sha512', $rawBody, $secret)) {
                        $isValid = true;
                        $reference = $body['reference'] ?? null;
                    }
                } elseif ($gateway === 'PAYMENTPOINT') {
                    $isValid = true;
                    $reference = $body['reference'] ?? null;
                }

                if (!$isValid) {
                    Response::error(401, 'UNAUTHORIZED', 'Invalid signature');
                    return;
                }

                if ($reference) {
                    $stmt = $pdo->prepare('SELECT id,school_id,status,metadata FROM payments WHERE reference=? AND status=? LIMIT 1');
                    $stmt->execute([$reference, 'PENDING']);
                    $payment = $stmt->fetch();
                    if ($payment) {
                        $pdo->beginTransaction();
                        $stmt = $pdo->prepare("UPDATE payments SET status='SUCCESS', updated_at=NOW() WHERE id=?");
                        $stmt->execute([$payment['id']]);
                        
                        $meta = json_decode($payment['metadata'], true) ?: [];
                        if (($meta['type'] ?? '') === 'SUBSCRIPTION') {
                            $schoolId = $meta['schoolId'];
                            $planSlug = $meta['planSlug'];
                            $billingCycle = $meta['billingCycle'];
                            
                            $plan = $this->getPlanBySlugCurrent($planSlug);
                            if ($plan) {
                                $start = gmdate('Y-m-d H:i:s');
                                if (in_array($planSlug, ['lifetime', 'pro'])) $billingCycle = 'LIFETIME';
                                else if ($planSlug === 'starter') $billingCycle = 'ANNUAL';
                                $end = $this->periodEndUtc($start, $billingCycle);
                                $newAmount = $this->planPriceKobo($plan['config'], $billingCycle);
                                $currency = $this->planCurrency($plan['config']);
                                
                                $subStmt = $pdo->prepare('SELECT id FROM school_subscriptions WHERE school_id=? LIMIT 1');
                                $subStmt->execute([$schoolId]);
                                if ($subStmt->fetch()) {
                                    $stmt = $pdo->prepare('UPDATE school_subscriptions SET plan_id=?, plan_version_id=?, status=\'ACTIVE\', billing_cycle=?, current_amount_kobo=?, currency=?, current_period_start=?, current_period_end=?, pending_plan_id=NULL, pending_plan_version_id=NULL, pending_effective_at=NULL, updated_at=NOW() WHERE school_id=?');
                                    $stmt->execute([$plan['planId'], $plan['versionId'], $billingCycle, $newAmount, $currency, $start, $end, $schoolId]);
                                } else {
                                    $id = $this->id('sub');
                                    $stmt = $pdo->prepare('INSERT INTO school_subscriptions (id,school_id,plan_id,plan_version_id,status,billing_cycle,current_amount_kobo,currency,current_period_start,current_period_end,trial_end,cancel_at_period_end,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,NOW(),NOW())');
                                    $stmt->execute([$id, $schoolId, $plan['planId'], $plan['versionId'], 'ACTIVE', $billingCycle, $newAmount, $currency, $start, $end, null, 0]);
                                }
                            }
                        }
                        $pdo->commit();
                    }
                }

                Response::json(200, ['status' => 'OK']);
                return;
            }

            Response::error(404, 'NOT_FOUND', 'Not found');
        } catch (InvalidArgumentException $e) {
            Response::error(400, 'VALIDATION_ERROR', $e->getMessage());
        } catch (Throwable $e) {
            Response::error(500, 'INTERNAL_ERROR', 'Unexpected error');
        }
    }

    private function paymentGateways(): array
    {
        return ['PAYSTACK', 'FLUTTERWAVE', 'MONNIFY', 'PAYMENTPOINT', 'PAYVESSEL'];
    }

    private function ensureAdminOnce(): void
    {
        if (self::$adminEnsured) {
            return;
        }
        self::$adminEnsured = true;

        $email = Config::env('ADMIN_EMAIL');
        $password = Config::env('ADMIN_PASSWORD');
        if ($email === null || $password === null) {
            return;
        }
        $email = strtolower(trim($email));
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return;
        }
        if (mb_strlen($password) < 12) {
            return;
        }
        try {
            $pdo = Db::pdo();
            $stmt = $pdo->prepare('SELECT id FROM users WHERE email=? LIMIT 1');
            $stmt->execute([$email]);
            $exists = $stmt->fetch() ? true : false;
            $this->ensureDefaultPlansOnce();
            if ($exists) {
                return;
            }
            $id = 'admin_001';
            $hash = Auth::hashPassword($password);
            $stmt = $pdo->prepare('INSERT INTO users (id,email,password_hash,role,status,created_at) VALUES (?,?,?,?,?,NOW())');
            $stmt->execute([$id, $email, $hash, 'ADMIN', 'ACTIVE']);
        } catch (Throwable $e) {
            return;
        }
    }

    private function ensureDefaultPlansOnce(): void
    {
        if (self::$plansEnsured) {
            return;
        }
        self::$plansEnsured = true;
        try {
            $pdo = Db::pdo();
            $pdo->query('SELECT 1 FROM subscription_plans LIMIT 1');
        } catch (Throwable $e) {
            return;
        }
        // Ensure ai_credits columns exist (safe re-run)
        try { $pdo->exec('ALTER TABLE school_subscriptions ADD COLUMN ai_credits_remaining INT NOT NULL DEFAULT 0'); } catch (Throwable $e) {}
        try { $pdo->exec('ALTER TABLE school_subscriptions ADD COLUMN ai_credits_total INT NOT NULL DEFAULT 0'); } catch (Throwable $e) {}
        $defaults = [
            ['slug' => 'starter', 'name' => 'Starter', 'monthlyKobo' => 150000, 'annualKobo' => 1500000, 'lifetimeKobo' => 0, 'trialDays' => 0, 'students' => 100, 'staff' => 3, 'aiCredits' => 0, 'features' => ['scores', 'report_sheet', 'teachers_portal', 'attendance', 'public_page', 'csv_import', 'basic_branding']],
            ['slug' => 'pro', 'name' => 'Pro + AI', 'monthlyKobo' => 0, 'annualKobo' => 0, 'lifetimeKobo' => 3500000, 'trialDays' => 0, 'students' => null, 'staff' => null, 'aiCredits' => 2000, 'features' => ['scores', 'report_sheet', 'batch_pdf', 'teachers_portal', 'attendance', 'parent_portal', 'public_page', 'csv_import', 'school_branding', 'multi_term', 'ai_reports', 'ai_exam', 'sms_reports']],
            ['slug' => 'trial', 'name' => 'Trial', 'monthlyKobo' => 0, 'annualKobo' => 0, 'lifetimeKobo' => 0, 'trialDays' => 7, 'students' => 50, 'staff' => 0, 'aiCredits' => 5, 'features' => ['scores', 'report_sheet', 'csv_import']],
            ['slug' => 'lifetime', 'name' => 'Lifetime', 'monthlyKobo' => 0, 'annualKobo' => 0, 'lifetimeKobo' => 2500000, 'trialDays' => 0, 'students' => null, 'staff' => 10, 'aiCredits' => 200, 'features' => ['scores', 'report_sheet', 'batch_pdf', 'teachers_portal', 'attendance', 'parent_portal', 'public_page', 'csv_import', 'school_branding', 'multi_term', 'ai_reports', 'ai_exam']],
        ];
        foreach ($defaults as $d) {
            try {
                $stmt = $pdo->prepare('SELECT id FROM subscription_plans WHERE slug=? LIMIT 1');
                $stmt->execute([$d['slug']]);
                $row = $stmt->fetch();
                if ($row && is_string($row['id'] ?? null)) {
                    continue;
                }
                $planId = $this->id('pln');
                $verId = $this->id('plv');
                $cfg = [
                    'billing' => [
                        'currency' => 'NGN',
                        'type' => $d['slug'] === 'lifetime' ? 'LIFETIME' : 'RECURRING',
                        'monthlyKobo' => $d['monthlyKobo'],
                        'annualKobo' => $d['annualKobo'],
                        'lifetimeKobo' => $d['lifetimeKobo'],
                        'setupFeeKobo' => 0
                    ],
                    'trialDays' => $d['trialDays'],
                    'features' => $d['features'],
                    'limits' => [
                        'students' => $d['students'],
                        'staff' => $d['staff'],
                        'storageMb' => null,
                        'smsCredits' => $d['slug'] === 'pro' ? 100 : 0,
                        'aiCredits' => $d['aiCredits']
                    ],
                    'proration' => ['mode' => 'NONE']
                ];
                $pdo->beginTransaction();
                $pdo->prepare('INSERT INTO subscription_plans (id,slug,name,description,status,created_at,created_by_user_id) VALUES (?,?,?,?,?,NOW(),NULL)')
                    ->execute([$planId, $d['slug'], $d['name'], null, 'ACTIVE']);
                $pdo->prepare('INSERT INTO subscription_plan_versions (id,plan_id,version,config,is_current,created_at,created_by_user_id) VALUES (?,?,?,?,1,NOW(),NULL)')
                    ->execute([$verId, $planId, 1, json_encode($cfg, JSON_UNESCAPED_SLASHES)]);
                $pdo->commit();
            } catch (Throwable $e) {
                try { Db::pdo()->rollBack(); } catch (Throwable $e2) {}
                continue;
            }
        }
        // Seed AI credits for existing subscriptions that have none
        try {
            $pdo->exec("UPDATE school_subscriptions ss JOIN subscription_plans sp ON sp.id=ss.plan_id
                SET ss.ai_credits_remaining = CASE
                    WHEN sp.slug='pro' THEN GREATEST(ss.ai_credits_remaining, 2000)
                    WHEN sp.slug='lifetime' THEN GREATEST(ss.ai_credits_remaining, 200)
                    WHEN sp.slug='trial' THEN GREATEST(ss.ai_credits_remaining, 5)
                    ELSE ss.ai_credits_remaining END,
                ss.ai_credits_total = CASE
                    WHEN sp.slug='pro' THEN GREATEST(ss.ai_credits_total, 2000)
                    WHEN sp.slug='lifetime' THEN GREATEST(ss.ai_credits_total, 200)
                    WHEN sp.slug='trial' THEN GREATEST(ss.ai_credits_total, 5)
                    ELSE ss.ai_credits_total END
                WHERE ss.ai_credits_total = 0 AND ss.ai_credits_remaining = 0");
        } catch (Throwable $e) {}
    }

    private function jsonBody(): array
    {
        $raw = file_get_contents('php://input');
        if (!is_string($raw) || trim($raw) === '') {
            return [];
        }
        // Require JSON Content-Type for non-empty bodies to prevent CSRF via form submissions
        $ct = strtolower(trim(strval($_SERVER['CONTENT_TYPE'] ?? $_SERVER['HTTP_CONTENT_TYPE'] ?? '')));
        if ($ct !== '' && !str_contains($ct, 'application/json') && !str_contains($ct, 'application/x-json')) {
            throw new InvalidArgumentException('Invalid Content-Type: expected application/json');
        }
        $decoded = json_decode($raw, true);
        if (!is_array($decoded)) {
            throw new InvalidArgumentException('Invalid JSON body');
        }
        return $decoded;
    }

    private function applyCors(): void
    {
        $origin = $_SERVER['HTTP_ORIGIN'] ?? null;
        $origin = is_string($origin) ? trim($origin) : null;
        if (is_string($origin) && $origin !== '') {
            $parsed = @parse_url($origin);
            $scheme = is_array($parsed) ? ($parsed['scheme'] ?? null) : null;
            $host = is_array($parsed) ? ($parsed['host'] ?? null) : null;
            $port = is_array($parsed) ? ($parsed['port'] ?? null) : null;
            $scheme = is_string($scheme) ? strtolower($scheme) : '';
            $host = is_string($host) ? strtolower($host) : '';
            if (($scheme === 'http' || $scheme === 'https') && $host !== '') {
                $normalized = $scheme . '://' . $host;
                if (is_int($port)) {
                    $normalized .= ':' . $port;
                }
                foreach ($this->allowedOrigins as $allowed) {
                    $allowed = trim(strval($allowed));
                    $allowedNorm = rtrim($allowed, '/');
                    if ($allowedNorm === $normalized) {
                        header('Access-Control-Allow-Origin: ' . $origin);
                        header('Access-Control-Allow-Credentials: true');
                        header('Vary: Origin');
                        break;
                    }
                }
            }
        }
        header('Access-Control-Allow-Headers: Content-Type, Authorization');
        header('Access-Control-Allow-Methods: GET,POST,PUT,PATCH,DELETE,OPTIONS');
    }

    private function handlePreflight(): void
    {
        if (strtoupper($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
            http_response_code(204);
            exit;
        }
    }

    private function id(string $prefix): string
    {
        return $prefix . '_' . bin2hex(random_bytes(8));
    }

    private function logAudit($actorUserId, $schoolId, string $action, array $data): void
    {
        try {
            $pdo = Db::pdo();
            $id = $this->id('aud');
            $ip = $_SERVER['REMOTE_ADDR'] ?? null;
            $ua = $_SERVER['HTTP_USER_AGENT'] ?? null;
            $actor = is_string($actorUserId) ? $actorUserId : null;
            $sid = is_string($schoolId) ? $schoolId : null;
            $now = gmdate('Y-m-d H:i:s');
            $prev = $pdo->query('SELECT entry_hash FROM audit_logs ORDER BY created_at DESC LIMIT 1')->fetch();
            $prevHash = is_array($prev) && is_string($prev['entry_hash'] ?? null) ? $prev['entry_hash'] : null;
            $payload = json_encode($data, JSON_UNESCAPED_SLASHES);
            $entryHash = hash('sha256', json_encode([
                'prev' => $prevHash,
                'id' => $id,
                'actor' => $actor,
                'school' => $sid,
                'action' => $action,
                'ip' => $ip,
                'ua' => $ua,
                'data' => $payload,
                'createdAt' => $now
            ], JSON_UNESCAPED_SLASHES));
            $stmt = $pdo->prepare('INSERT INTO audit_logs (id,actor_user_id,school_id,action,ip,user_agent,data,prev_hash,entry_hash,created_at) VALUES (?,?,?,?,?,?,?,?,?,?)');
            $stmt->execute([$id, $actor, $sid, $action, $ip, $ua, $payload, $prevHash, $entryHash, $now]);
        } catch (Throwable $e) {
            return;
        }
    }

    private function findUserByEmail(string $email): ?array
    {
        $stmt = Db::pdo()->prepare('SELECT id,email,password_hash,role,status,force_password_change,totp_enabled,school_id FROM users WHERE email=? LIMIT 1');
        $stmt->execute([$email]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    private function getUserById(string $id): ?array
    {
        $stmt = Db::pdo()->prepare('SELECT id,email,role,status,force_password_change,totp_enabled,school_id FROM users WHERE id=? LIMIT 1');
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    private function randomPassword(): string
    {
        $bytes = bin2hex(random_bytes(6));
        return 'Report' . $bytes . '!';
    }

    private function publicApiUrl(): string
    {
        $env = Config::env('PUBLIC_API_URL');
        if (is_string($env) && trim($env) !== '') {
            return rtrim(trim($env), '/');
        }
        $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
        $host = $_SERVER['SERVER_NAME'] ?? $_SERVER['HTTP_HOST'] ?? '127.0.0.1:3011';
        // Strip port from host for validation
        $hostname = preg_replace('/:\d+$/', '', $host);
        // Basic hostname validation to prevent Host header injection
        if (!preg_match('/^[a-zA-Z0-9]([a-zA-Z0-9.-]*[a-zA-Z0-9])?$/', $hostname)) {
            $host = '127.0.0.1:3011';
        }
        $port = $_SERVER['SERVER_PORT'] ?? '';
        if ($port !== '' && $port !== '80' && $port !== '443' && strpos($host, ':') === false) {
            $host .= ':' . $port;
        }
        return $scheme . '://' . $host;
    }

    private function makeStudentPdfFilename(array $school, array $student): string
    {
        $adm = trim(strval($student['admission_no'] ?? ''));
        $term = trim(strval($school['term'] ?? ''));
        $session = trim(strval($school['session'] ?? ''));
        $base = $adm !== '' ? $adm : strval($student['id'] ?? 'student');
        $name = 'ReportCard_' . $base . '_' . $term . '_' . $session . '.pdf';
        $name = preg_replace('/[^A-Za-z0-9._-]+/', '_', $name);
        return $name ?: 'ReportCard.pdf';
    }

    private function makeClassPdfFilename(array $school, string $className): string
    {
        $term = trim(strval($school['term'] ?? ''));
        $session = trim(strval($school['session'] ?? ''));
        $name = 'ReportCards_' . $className . '_' . $term . '_' . $session . '.pdf';
        $name = preg_replace('/[^A-Za-z0-9._-]+/', '_', $name);
        return $name ?: 'ReportCards.pdf';
    }

    private function createReportExport(string $schoolId, string $filename, string $pdfBytes): array
    {
        $token = rtrim(strtr(base64_encode(random_bytes(24)), '+/', '-_'), '=');
        $pin = strval(random_int(100000, 999999));
        $pinHash = Crypto::encrypt($pin);
        $ttlDays = Config::envInt('REPORT_EXPORT_TTL_DAYS', 30);
        if ($ttlDays < 1) $ttlDays = 30;
        $expiresAt = gmdate('Y-m-d H:i:s', time() + ($ttlDays * 86400));
        $createdAt = gmdate('Y-m-d H:i:s');

        $base = dirname(__DIR__);
        $dir = $base . DIRECTORY_SEPARATOR . 'storage' . DIRECTORY_SEPARATOR . 'reports';
        if (!is_dir($dir)) {
            @mkdir($dir, 0750, true);
        }
        $path = $dir . DIRECTORY_SEPARATOR . $token . '.pdf';
        $ok = file_put_contents($path, $pdfBytes);
        if ($ok === false) {
            throw new RuntimeException('Unable to save PDF');
        }

        $id = $this->id('re');
        Db::pdo()->prepare('INSERT INTO report_exports (id,school_id,token,pin_hash,filename,file_path,created_at,expires_at) VALUES (?,?,?,?,?,?,?,?)')
            ->execute([$id, $schoolId, $token, $pinHash, $filename, $path, $createdAt, $expiresAt]);

        $url = $this->publicApiUrl() . '/public/reports/' . rawurlencode($token);
        return ['token' => $token, 'pin' => $pin, 'expiresAt' => $expiresAt, 'url' => $url];
    }

    private function getReportExportByToken(string $token): ?array
    {
        try {
            $stmt = Db::pdo()->prepare('SELECT token,pin_hash,filename,file_path,expires_at FROM report_exports WHERE token=? AND expires_at > NOW() LIMIT 1');
            $stmt->execute([$token]);
            $row = $stmt->fetch();
            return $row ?: null;
        } catch (Throwable $e) {
            return null;
        }
    }

    private function verifyReportPin(string $pin, string $hash): bool
    {
        try {
            $plain = Crypto::decrypt($hash);
            return hash_equals($plain, $pin);
        } catch (Throwable $e) {
            return false;
        }
    }

    private function getScoresForStudent(string $schoolId, string $studentId): array
    {
        try {
            $stmt = Db::pdo()->prepare('SELECT data FROM score_sheets WHERE school_id=? AND student_id=? LIMIT 1');
            $stmt->execute([$schoolId, $studentId]);
            $row = $stmt->fetch();
            if (!$row) {
                return [];
            }
            $d = json_decode($row['data'] ?? '[]', true);
            return is_array($d) ? $d : [];
        } catch (Throwable $e) {
            return [];
        }
    }

    private function getReportExtras(string $schoolId, string $studentId, string $session, string $term): array
    {
        if ($session === '') {
            $session = '2024/2025';
        }
        if ($term === '') {
            $term = 'First Term';
        }
        try {
            $stmt = Db::pdo()->prepare('SELECT attendance,traits,comments,promotion FROM report_extras WHERE school_id=? AND student_id=? AND session=? AND term=? LIMIT 1');
            $stmt->execute([$schoolId, $studentId, $session, $term]);
            $row = $stmt->fetch();
            if (!$row) {
                return ['session' => $session, 'term' => $term, 'attendance' => [], 'traits' => [], 'comments' => [], 'promotion' => ''];
            }
            $a = json_decode($row['attendance'] ?? '{}', true);
            $t = json_decode($row['traits'] ?? '{}', true);
            $c = json_decode($row['comments'] ?? '{}', true);
            return [
                'session' => $session,
                'term' => $term,
                'attendance' => is_array($a) ? $a : [],
                'traits' => is_array($t) ? $t : [],
                'comments' => is_array($c) ? $c : [],
                'promotion' => strval($row['promotion'] ?? '')
            ];
        } catch (Throwable $e) {
            return ['session' => $session, 'term' => $term, 'attendance' => [], 'traits' => [], 'comments' => [], 'promotion' => ''];
        }
    }

    private function buildClassStats(array $school, string $className): array
    {
        $subjects = json_decode($school['subjects'] ?? '[]', true) ?: [];
        $ca1Max = intval($school['ca1_max'] ?? 10);
        $ca2Max = intval($school['ca2_max'] ?? 10);
        $examMax = intval($school['exam_max'] ?? 80);
        $totalMax = max(1, $ca1Max + $ca2Max + $examMax);

        $out = ['_studentAverages' => [], '_classCount' => 0];
        foreach ($subjects as $sub) {
            $out[$sub] = [];
        }

        $stmt = Db::pdo()->prepare('SELECT s.id AS student_id, ss.data AS data FROM students s LEFT JOIN score_sheets ss ON ss.school_id=s.school_id AND ss.student_id=s.id WHERE s.school_id=? AND s.class_name=?');
        $stmt->execute([$school['id'], $className]);
        $rows = $stmt->fetchAll();
        $out['_classCount'] = is_array($rows) ? count($rows) : 0;
        foreach ($rows as $r) {
            $data = json_decode($r['data'] ?? '[]', true);
            $data = is_array($data) ? $data : [];
            $avg = ReportPdf::studentAvgPct($subjects, $data, $totalMax);
            if ($avg !== null) {
                $out['_studentAverages'][] = $avg;
            }
            foreach ($subjects as $sub) {
                $sv = is_array($data[$sub] ?? null) ? $data[$sub] : [];
                $tot = floatval($sv['ca1'] ?? 0) + floatval($sv['ca2'] ?? 0) + floatval($sv['exam'] ?? 0);
                $pct = ($tot / $totalMax) * 100.0;
                $out[$sub][] = $pct;
            }
        }
        return $out;
    }

    private function getUserTotpSecret(string $userId): ?string
    {
        try {
            $stmt = Db::pdo()->prepare('SELECT secret_ciphertext FROM user_totp_secrets WHERE user_id=? LIMIT 1');
            $stmt->execute([$userId]);
            $row = $stmt->fetch();
            if (!$row || !is_string($row['secret_ciphertext'] ?? null)) {
                return null;
            }
            return Crypto::decrypt($row['secret_ciphertext']);
        } catch (Throwable $e) {
            return null;
        }
    }

    private function isTotpRequiredForLogin(array $userRow, ?array $school): bool
    {
        $userEnabled = intval($userRow['totp_enabled'] ?? 0) === 1;
        if ($userEnabled) {
            return true;
        }
        $cfg = $this->getSystemSetting('twofa') ?? null;
        $global = $cfg ? (($cfg['globalEnforced'] ?? false) === true) : false;
        if ($global) {
            return true;
        }
        if (($userRow['role'] ?? null) === 'SCHOOL' && $school) {
            return intval($school['require_2fa'] ?? 0) === 1;
        }
        return false;
    }

    private function maybeAuthBearer(string $ip): void
    {
        $auth = $_SERVER['HTTP_AUTHORIZATION'] ?? null;
        if (!is_string($auth) || $auth === '') {
            return;
        }
        if (!preg_match('/^Bearer\\s+(.+)$/i', trim($auth), $m)) {
            return;
        }
        RateLimit::enforce('admin-bearer:' . $ip, 600, 60);
        $token = trim($m[1]);
        if ($token === '' || strlen($token) < 20) {
            return;
        }
        $hash = hash('sha256', $token);
        try {
            $stmt = Db::pdo()->prepare("SELECT t.user_id,t.revoked_at,t.expires_at,u.role,u.status FROM admin_api_tokens t JOIN users u ON u.id=t.user_id WHERE t.token_hash=? LIMIT 1");
            $stmt->execute([$hash]);
            $row = $stmt->fetch();
            if (!$row) {
                return;
            }
            if ($row['revoked_at']) {
                return;
            }
            if ($row['expires_at'] && strtotime($row['expires_at']) < time()) {
                return;
            }
            if (($row['role'] ?? null) !== 'ADMIN' || ($row['status'] ?? null) !== 'ACTIVE') {
                return;
            }
            $_SESSION['user_id'] = $row['user_id'];
            $_SESSION['role'] = 'ADMIN';
            $_SESSION['auth_via'] = 'BEARER';
            Db::pdo()->prepare('UPDATE admin_api_tokens SET last_used_at=NOW() WHERE token_hash=?')->execute([$hash]);
        } catch (Throwable $e) {
            return;
        }
    }

    private function base64UrlEncode(string $raw): string
    {
        return rtrim(strtr(base64_encode($raw), '+/', '-_'), '=');
    }

    private function swaggerHtml(): string
    {
        $specUrl = '/admin/openapi.json';
        return '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' .
            '<title>ReportSheet Admin API Docs</title>' .
            '<link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css">' .
            '</head><body><div id="swagger-ui"></div>' .
            '<script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>' .
            '<script>window.ui=SwaggerUIBundle({url:"' . $specUrl . '",dom_id:"#swagger-ui"});</script>' .
            '</body></html>';
    }

    private function openApiSpec(): array
    {
        return [
            'openapi' => '3.0.3',
            'info' => ['title' => 'ReportSheet Admin API', 'version' => '0.1.0'],
            'servers' => [['url' => '/']],
            'components' => [
                'securitySchemes' => [
                    'bearerAuth' => ['type' => 'http', 'scheme' => 'bearer']
                ]
            ],
            'security' => [['bearerAuth' => []]],
            'paths' => [
                '/admin/stats' => ['get' => ['summary' => 'Admin stats', 'responses' => ['200' => ['description' => 'OK']]]],
                '/admin/system/maintenance' => [
                    'get' => ['summary' => 'Get maintenance config', 'responses' => ['200' => ['description' => 'OK']]],
                    'put' => ['summary' => 'Set maintenance config', 'responses' => ['200' => ['description' => 'OK']]]
                ],
                '/admin/system/feature-flags' => [
                    'get' => ['summary' => 'Get feature flags', 'responses' => ['200' => ['description' => 'OK']]],
                    'put' => ['summary' => 'Set feature flags', 'responses' => ['200' => ['description' => 'OK']]]
                ],
                '/admin/system/email-templates' => [
                    'get' => ['summary' => 'Get email templates', 'responses' => ['200' => ['description' => 'OK']]],
                    'put' => ['summary' => 'Set email templates', 'responses' => ['200' => ['description' => 'OK']]]
                ],
                '/admin/payment-gateways' => ['get' => ['summary' => 'List gateways config', 'responses' => ['200' => ['description' => 'OK']]]],
                '/admin/payment-gateways/key' => ['put' => ['summary' => 'Set gateway key', 'responses' => ['200' => ['description' => 'OK']]]],
                '/admin/payment-gateways/webhook' => ['put' => ['summary' => 'Set webhook config', 'responses' => ['200' => ['description' => 'OK']]]],
                '/admin/payment-gateways/webhook/test' => ['post' => ['summary' => 'Test webhook', 'responses' => ['200' => ['description' => 'OK']]]],
                '/admin/transactions' => ['get' => ['summary' => 'List transactions', 'responses' => ['200' => ['description' => 'OK']]]],
                '/admin/plans' => [
                    'get' => ['summary' => 'List plans', 'responses' => ['200' => ['description' => 'OK']]],
                    'post' => ['summary' => 'Create plan', 'responses' => ['201' => ['description' => 'Created']]]
                ],
                '/admin/plans/{id}' => [
                    'get' => [
                        'summary' => 'Get plan',
                        'parameters' => [['name' => 'id', 'in' => 'path', 'required' => true, 'schema' => ['type' => 'string']]],
                        'responses' => ['200' => ['description' => 'OK']]
                    ]
                ],
                '/admin/plans/{id}/versions' => [
                    'post' => [
                        'summary' => 'Create plan version',
                        'parameters' => [['name' => 'id', 'in' => 'path', 'required' => true, 'schema' => ['type' => 'string']]],
                        'responses' => ['201' => ['description' => 'Created']]
                    ]
                ],
                '/admin/plans/{id}/rollback' => [
                    'post' => [
                        'summary' => 'Rollback plan',
                        'parameters' => [['name' => 'id', 'in' => 'path', 'required' => true, 'schema' => ['type' => 'string']]],
                        'responses' => ['200' => ['description' => 'OK']]
                    ]
                ],
                '/admin/schools' => ['get' => ['summary' => 'List schools', 'responses' => ['200' => ['description' => 'OK']]]],
                '/admin/schools/create' => ['post' => ['summary' => 'Create school', 'responses' => ['201' => ['description' => 'Created']]]],
                '/admin/schools/import-csv' => ['post' => ['summary' => 'Import schools CSV', 'responses' => ['200' => ['description' => 'OK']]]],
                '/admin/schools/{id}' => [
                    'delete' => ['summary' => 'Soft-delete school', 'parameters' => [['name' => 'id', 'in' => 'path', 'required' => true, 'schema' => ['type' => 'string']]], 'responses' => ['200' => ['description' => 'OK']]]
                ],
                '/admin/schools/{id}/restore' => [
                    'post' => ['summary' => 'Restore school', 'parameters' => [['name' => 'id', 'in' => 'path', 'required' => true, 'schema' => ['type' => 'string']]], 'responses' => ['200' => ['description' => 'OK']]]
                ],
                '/admin/tokens' => [
                    'get' => ['summary' => 'List admin tokens', 'responses' => ['200' => ['description' => 'OK']]],
                    'post' => ['summary' => 'Create admin token', 'responses' => ['201' => ['description' => 'Created']]]
                ],
                '/admin/tokens/{id}/revoke' => [
                    'post' => ['summary' => 'Revoke admin token', 'parameters' => [['name' => 'id', 'in' => 'path', 'required' => true, 'schema' => ['type' => 'string']]], 'responses' => ['200' => ['description' => 'OK']]]
                ]
            ]
        ];
    }

    private function getSchoolByOwnerId(string $ownerId): ?array
    {
        $stmt = Db::pdo()->prepare('SELECT * FROM schools WHERE owner_id=? LIMIT 1');
        $stmt->execute([$ownerId]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    private function getSchoolByOwnerIdOrSchoolId(string $userId, string $role): ?array
    {
        if ($role === 'SCHOOL') {
            return $this->getSchoolByOwnerId($userId);
        }
        if ($role === 'SCHOOL_ADMIN') {
            $row = $this->getUserById($userId);
            $schoolId = is_array($row) && is_string($row['school_id'] ?? null) ? strval($row['school_id']) : '';
            if ($schoolId !== '') {
                return $this->getSchoolById($schoolId);
            }
        }
        return null;
    }

    private function requireSchoolContext(): array
    {
        $u = Auth::requireUser();
        $role = $u['role'];
        if (!in_array($role, ['SCHOOL', 'SCHOOL_ADMIN'], true)) {
            Response::error(403, 'FORBIDDEN', 'Forbidden');
            exit;
        }
        $school = $this->getSchoolByOwnerIdOrSchoolId($u['id'], $role);
        if (!$school) {
            Response::error(404, 'NOT_FOUND', 'Not found');
            exit;
        }
        $actorId = ($u['impersonating'] ?? false) ? ($u['adminId'] ?? $u['id']) : $u['id'];
        return ['u' => $u, 'school' => $school, 'actorId' => $actorId];
    }

    private function getSchoolById(string $schoolId): ?array
    {
        $stmt = Db::pdo()->prepare('SELECT * FROM schools WHERE id=? LIMIT 1');
        $stmt->execute([$schoolId]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    private function getSchoolBySlug(string $slug): ?array
    {
        $s = strtolower(trim($slug));
        if ($s === '') {
            return null;
        }
        $stmt = Db::pdo()->prepare('SELECT * FROM schools WHERE subdomain=? LIMIT 1');
        $stmt->execute([$s]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    private function schoolPublicToApi(array $s): array
    {
        return [
            'id' => strval($s['id']),
            'slug' => strval($s['subdomain'] ?? ''),
            'name' => strval($s['name'] ?? ''),
            'logoUrl' => is_string($s['logo_url'] ?? null) ? strval($s['logo_url']) : '',
            'publicDescription' => is_string($s['motto'] ?? null) ? strval($s['motto']) : '',
            'address' => is_string($s['address'] ?? null) ? strval($s['address']) : '',
            'contact' => is_string($s['contact'] ?? null) ? strval($s['contact']) : '',
            'motto' => is_string($s['motto'] ?? null) ? strval($s['motto']) : '',
            'principal' => is_string($s['principal'] ?? null) ? strval($s['principal']) : ''
        ];
    }

    private function ensureUniqueSchoolSlug(string $schoolName): string
    {
        $base = $this->slugify($schoolName);
        if ($base === '') {
            $base = 'school';
        }
        $candidate = $base;
        for ($i = 0; $i < 50; $i++) {
            $stmt = Db::pdo()->prepare('SELECT id FROM schools WHERE subdomain=? LIMIT 1');
            $stmt->execute([$candidate]);
            if (!$stmt->fetch()) {
                return $candidate;
            }
            $candidate = $base . '-' . strval($i + 2);
        }
        return $base . '-' . substr($this->id('slg'), -6);
    }

    private function slugify(string $s): string
    {
        $t = strtolower(trim($s));
        $t = preg_replace('/[^a-z0-9]+/', '-', $t);
        $t = trim(strval($t ?? ''), '-');
        if (mb_strlen($t) > 60) {
            $t = mb_substr($t, 0, 60);
            $t = trim($t, '-');
        }
        return $t;
    }

    private function getTeacherAssignedClasses(string $schoolId, string $teacherUserId): array
    {
        $stmt = Db::pdo()->prepare('SELECT class_name FROM teacher_class_assignments WHERE school_id=? AND teacher_user_id=? ORDER BY class_name ASC');
        $stmt->execute([$schoolId, $teacherUserId]);
        $rows = $stmt->fetchAll();
        $out = [];
        foreach ($rows as $r) {
            $c = trim(strval($r['class_name'] ?? ''));
            if ($c !== '') {
                $out[] = $c;
            }
        }
        return $out;
    }

    private function getStudentById(string $schoolId, string $studentId): ?array
    {
        $stmt = Db::pdo()->prepare('SELECT * FROM students WHERE school_id=? AND id=? LIMIT 1');
        $stmt->execute([$schoolId, $studentId]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    private function getScoreSheet(string $schoolId, string $studentId): array
    {
        return $this->getScoresForStudent($schoolId, $studentId);
    }

    private function upsertScoreSheet(string $schoolId, string $studentId, array $scores): void
    {
        $data = json_encode($scores, JSON_UNESCAPED_SLASHES);
        $pdo = Db::pdo();
        $sql = Db::isSqlite()
            ? 'INSERT INTO score_sheets (id,school_id,student_id,data,created_at,updated_at) VALUES (?,?,?,?,NOW(),NOW()) ON CONFLICT(school_id,student_id) DO UPDATE SET data=excluded.data, updated_at=NOW()'
            : 'INSERT INTO score_sheets (id,school_id,student_id,data,created_at,updated_at) VALUES (?,?,?,?,NOW(),NOW()) ON DUPLICATE KEY UPDATE data=VALUES(data),updated_at=NOW()';
        $pdo->prepare($sql)->execute([$this->id('scr'), $schoolId, $studentId, $data]);
    }

    private function getSchoolSubscription(string $schoolId): ?array
    {
        try {
            $stmt = Db::pdo()->prepare('SELECT ss.status, ss.current_period_end, sp.slug AS plan_slug FROM school_subscriptions ss JOIN subscription_plans sp ON sp.id=ss.plan_id WHERE ss.school_id=? LIMIT 1');
            $stmt->execute([$schoolId]);
            $row = $stmt->fetch();
            if ($row && is_string($row['plan_slug'] ?? null)) {
                return [
                    'planSlug' => strval($row['plan_slug']),
                    'status' => strval($row['status'] ?? ''),
                    'currentPeriodEnd' => $row['current_period_end'] ?? null
                ];
            }
        } catch (Throwable $e) {
        }

        try {
            $stmt = Db::pdo()->prepare('SELECT plan FROM schools WHERE id=? LIMIT 1');
            $stmt->execute([$schoolId]);
            $row = $stmt->fetch();
            if ($row) {
                $slug = $this->legacyPlanToSlug(is_string($row['plan'] ?? null) ? strval($row['plan']) : null);
                return ['planSlug' => $slug, 'status' => 'LEGACY', 'currentPeriodEnd' => null];
            }
        } catch (Throwable $e) {
        }

        return null;
    }

    private function legacyPlanToSlug(?string $plan): string
    {
        $p = strtoupper(trim(strval($plan ?? 'LIFETIME')));
        if ($p === 'PRO') return 'pro';
        if ($p === 'STARTER') return 'starter';
        if ($p === 'TRIAL') return 'trial';
        return 'lifetime';
    }

    private function getPlanConfigBySlug(string $slug): ?array
    {
        try {
            $pdo = Db::pdo();
            $stmt = $pdo->prepare('SELECT sp.id AS plan_id, spv.config FROM subscription_plans sp JOIN subscription_plan_versions spv ON spv.plan_id=sp.id WHERE sp.slug=? AND spv.is_current=1 LIMIT 1');
            $stmt->execute([$slug]);
            $row = $stmt->fetch();
            if (!$row) return null;
            $cfg = json_decode($row['config'] ?? '[]', true);
            return is_array($cfg) ? $cfg : null;
        } catch (Throwable $e) {
            return null;
        }
    }

    private function getPlanBySlugCurrent(string $slug): ?array
    {
        try {
            $stmt = Db::pdo()->prepare('SELECT sp.id AS plan_id, sp.name AS plan_name, sp.slug, spv.id AS version_id, spv.version, spv.config FROM subscription_plans sp JOIN subscription_plan_versions spv ON spv.plan_id=sp.id WHERE sp.slug=? AND spv.is_current=1 LIMIT 1');
            $stmt->execute([$slug]);
            $row = $stmt->fetch();
            if (!$row) return null;
            $cfg = json_decode($row['config'] ?? '[]', true);
            if (!is_array($cfg)) $cfg = [];
            return [
                'planId' => $row['plan_id'],
                'versionId' => $row['version_id'],
                'planName' => $row['plan_name'],
                'slug' => $row['slug'],
                'version' => intval($row['version'] ?? 0),
                'config' => $cfg
            ];
        } catch (Throwable $e) {
            return null;
        }
    }

    private function planCurrency(array $config): string
    {
        $c = $config['billing']['currency'] ?? 'NGN';
        $c = trim(strval($c));
        return $c !== '' ? $c : 'NGN';
    }

    private function planPriceKobo(array $config, string $billingCycle): int
    {
        $b = $config['billing'] ?? [];
        if (!is_array($b)) $b = [];
        $monthly = intval($b['monthlyKobo'] ?? 0);
        $annual = intval($b['annualKobo'] ?? 0);
        $lifetime = intval($b['lifetimeKobo'] ?? 0);
        if ($billingCycle === 'LIFETIME') return max(0, $lifetime);
        return $billingCycle === 'ANNUAL' ? max(0, $annual) : max(0, $monthly);
    }

    private function periodEndUtc(string $startUtc, string $billingCycle): string
    {
        $t = strtotime($startUtc . ' UTC');
        if ($t === false) {
            $t = time();
        }
        if ($billingCycle === 'LIFETIME') {
            return gmdate('Y-m-d H:i:s', $t + (100 * 365 * 86400));
        }
        $sec = ($billingCycle === 'ANNUAL') ? (365 * 86400) : (30 * 86400);
        return gmdate('Y-m-d H:i:s', $t + $sec);
    }

    private function computeProrationKobo(int $oldAmount, int $newAmount, string $oldCycle, string $oldEndUtc, string $nowUtc): int
    {
        $end = strtotime($oldEndUtc . ' UTC');
        $now = strtotime($nowUtc . ' UTC');
        if ($end === false || $now === false) {
            return $newAmount - $oldAmount;
        }
        $remaining = max(0, $end - $now);
        $period = (strtoupper($oldCycle) === 'ANNUAL') ? (365 * 86400) : (30 * 86400);
        if ($period <= 0) $period = 30 * 86400;
        $ratio = min(1.0, $remaining / $period);
        $diff = $newAmount - $oldAmount;
        return intval(round($diff * $ratio));
    }

    private function redeemCoupon(string $code, string $schoolId, string $planId, int $amountKobo, string $currency, ?string $userId): array
    {
        $code = strtoupper(trim($code));
        if ($code === '') {
            return ['couponId' => null, 'discountKobo' => 0];
        }
        $pdo = Db::pdo();
        $stmt = $pdo->prepare("SELECT id,discount_type,percent,amount_kobo,currency,applies_plan_id,max_redemptions,redeemed_count,starts_at,ends_at,status FROM coupons WHERE code=? LIMIT 1");
        $stmt->execute([$code]);
        $c = $stmt->fetch();
        if (!$c || ($c['status'] ?? null) !== 'ACTIVE') {
            return ['couponId' => null, 'discountKobo' => 0];
        }
        if ($c['applies_plan_id'] && $c['applies_plan_id'] !== $planId) {
            return ['couponId' => null, 'discountKobo' => 0];
        }
        $now = time();
        if ($c['starts_at'] && strtotime($c['starts_at']) > $now) {
            return ['couponId' => null, 'discountKobo' => 0];
        }
        if ($c['ends_at'] && strtotime($c['ends_at']) < $now) {
            return ['couponId' => null, 'discountKobo' => 0];
        }
        if ($c['max_redemptions'] !== null && intval($c['redeemed_count'] ?? 0) >= intval($c['max_redemptions'])) {
            return ['couponId' => null, 'discountKobo' => 0];
        }
        $stmt = $pdo->prepare('SELECT id FROM coupon_redemptions WHERE coupon_id=? AND school_id=? LIMIT 1');
        $stmt->execute([$c['id'], $schoolId]);
        if ($stmt->fetch()) {
            return ['couponId' => $c['id'], 'discountKobo' => 0];
        }
        $discount = 0;
        if (($c['discount_type'] ?? null) === 'PERCENT') {
            $pct = intval($c['percent'] ?? 0);
            if ($pct > 0) {
                $discount = intval(floor(($amountKobo * $pct) / 100));
            }
        } else {
            $amt = intval($c['amount_kobo'] ?? 0);
            if ($amt > 0) {
                $discount = $amt;
            }
        }
        $discount = max(0, min($amountKobo, $discount));
        if ($discount <= 0) {
            return ['couponId' => $c['id'], 'discountKobo' => 0];
        }
        $rid = $this->id('red');
        $pdo->prepare('INSERT INTO coupon_redemptions (id,coupon_id,school_id,redeemed_by_user_id,created_at) VALUES (?,?,?,?,NOW())')
            ->execute([$rid, $c['id'], $schoolId, $userId]);
        $pdo->prepare('UPDATE coupons SET redeemed_count=redeemed_count+1 WHERE id=?')->execute([$c['id']]);
        return ['couponId' => $c['id'], 'discountKobo' => $discount];
    }

    private function generateRevenueCsv(): string
    {
        $pdo = Db::pdo();
        $rows = $pdo->query("SELECT s.id AS school_id,s.name AS school_name,ss.status,ss.billing_cycle,ss.current_amount_kobo,ss.currency,ss.current_period_end FROM schools s LEFT JOIN school_subscriptions ss ON ss.school_id=s.id WHERE s.deleted_at IS NULL ORDER BY s.created_at DESC LIMIT 5000")->fetchAll();
        $out = "school_id,school_name,status,billing_cycle,amount_kobo,currency,current_period_end\n";
        foreach ($rows as $r) {
            $out .= $this->csvRow([
                $r['school_id'],
                $r['school_name'],
                $r['status'] ?? '',
                $r['billing_cycle'] ?? '',
                strval(intval($r['current_amount_kobo'] ?? 0)),
                $r['currency'] ?? 'NGN',
                $r['current_period_end'] ?? ''
            ]);
        }
        return $out;
    }

    private function csvRow(array $cols): string
    {
        $escaped = [];
        foreach ($cols as $c) {
            $s = strval($c);
            $s = str_replace('"', '""', $s);
            $escaped[] = '"' . $s . '"';
        }
        return implode(',', $escaped) . "\n";
    }

    private function slackWebhookUrl(): ?string
    {
        $cfg = $this->getSystemSetting('slackAlerts');
        if (!$cfg || (($cfg['enabled'] ?? false) !== true)) {
            return null;
        }
        $cipher = $cfg['webhookCiphertext'] ?? null;
        if (!is_string($cipher) || $cipher === '') {
            return null;
        }
        try {
            return Crypto::decrypt($cipher);
        } catch (Throwable $e) {
            return null;
        }
    }

    private function sendSlackAlert(string $message): bool
    {
        $url = $this->slackWebhookUrl();
        if ($url === null) {
            return false;
        }
        $payload = json_encode(['text' => $message], JSON_UNESCAPED_SLASHES);
        $ctx = stream_context_create([
            'http' => [
                'method' => 'POST',
                'header' => "Content-Type: application/json\r\n",
                'content' => $payload,
                'timeout' => 6
            ]
        ]);
        try {
            $res = @file_get_contents($url, false, $ctx);
            return $res !== false;
        } catch (Throwable $e) {
            return false;
        }
    }

    private function runAlerts(): array
    {
        $pdo = Db::pdo();
        $countSql = Db::isSqlite()
            ? "SELECT COUNT(*) AS c FROM payments WHERE status='FAILED' AND created_at >= datetime(NOW(), '-1 hour')"
            : "SELECT COUNT(*) AS c FROM payments WHERE status='FAILED' AND created_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)";
        $count = intval(($pdo->query($countSql)->fetch()['c'] ?? 0));
        $sent = false;
        if ($count > 0) {
            $sent = $this->sendSlackAlert("ReportSheet alert: {$count} failed payments in the last hour.");
            $pdo->prepare('INSERT INTO alert_events (id,type,status,data,created_at) VALUES (?,?,?,?,NOW())')
                ->execute([$this->id('alt'), 'FAILED_PAYMENTS_HOUR', $sent ? 'SENT' : 'FAILED', json_encode(['count' => $count], JSON_UNESCAPED_SLASHES)]);
        }
        return ['failedPaymentsHour' => $count, 'sent' => $sent];
    }

    private function runRenewals(): array
    {
        $pdo = Db::pdo();
        $now = gmdate('Y-m-d H:i:s');
        $stmt = $pdo->prepare("SELECT * FROM school_subscriptions WHERE status='ACTIVE' AND cancel_at_period_end=0 AND current_period_end IS NOT NULL AND current_period_end <= ?");
        $stmt->execute([$now]);
        $subs = $stmt->fetchAll();
        $renewed = 0;
        $appliedPending = 0;
        foreach ($subs as $s) {
            $pdo->beginTransaction();
            $schoolId = $s['school_id'];
            $cycle = strval($s['billing_cycle'] ?? 'MONTHLY');
            $start = strval($s['current_period_end']);
            $planId = $s['plan_id'];
            $versionId = $s['plan_version_id'];
            if ($s['pending_plan_id'] && $s['pending_plan_version_id'] && $s['pending_effective_at'] && strtotime($s['pending_effective_at']) <= strtotime($now)) {
                $planId = $s['pending_plan_id'];
                $versionId = $s['pending_plan_version_id'];
                $appliedPending += 1;
            }
            $stmt2 = $pdo->prepare('SELECT config FROM subscription_plan_versions WHERE id=? LIMIT 1');
            $stmt2->execute([$versionId]);
            $row = $stmt2->fetch();
            $cfg = $row ? (json_decode($row['config'] ?? '[]', true) ?: []) : [];
            $amount = $this->planPriceKobo($cfg, $cycle);
            $currency = $this->planCurrency($cfg);
            $end = $this->periodEndUtc($start, $cycle);
            $pdo->prepare('UPDATE school_subscriptions SET plan_id=?, plan_version_id=?, current_amount_kobo=?, currency=?, current_period_start=?, current_period_end=?, pending_plan_id=NULL, pending_plan_version_id=NULL, pending_effective_at=NULL, updated_at=NOW() WHERE id=?')
                ->execute([$planId, $versionId, $amount, $currency, $start, $end, $s['id']]);
            $pdo->prepare('INSERT INTO subscription_events (id,school_id,type,data,created_at) VALUES (?,?,?,?,NOW())')
                ->execute([$this->id('sev'), $schoolId, 'SUBSCRIPTION_RENEW', json_encode(['cycle' => $cycle, 'periodStart' => $start, 'periodEnd' => $end], JSON_UNESCAPED_SLASHES)]);
            $pdo->commit();
            $renewed += 1;
        }
        return ['checked' => count($subs), 'renewed' => $renewed, 'appliedPending' => $appliedPending];
    }

    private function getEffectivePlanConfigForSchool(string $schoolId): array
    {
        try {
            $pdo = Db::pdo();
            $stmt = $pdo->prepare('SELECT sp.slug, spv.config FROM school_subscriptions ss JOIN subscription_plans sp ON sp.id=ss.plan_id JOIN subscription_plan_versions spv ON spv.id=ss.plan_version_id WHERE ss.school_id=? LIMIT 1');
            $stmt->execute([$schoolId]);
            $row = $stmt->fetch();
            if ($row && is_string($row['config'] ?? null)) {
                $cfg = json_decode($row['config'], true);
                if (is_array($cfg)) {
                    return $cfg;
                }
            }
        } catch (Throwable $e) {
        }
        $stmt = Db::pdo()->prepare('SELECT plan FROM schools WHERE id=? LIMIT 1');
        $stmt->execute([$schoolId]);
        $row = $stmt->fetch();
        $slug = $this->legacyPlanToSlug($row ? strval($row['plan'] ?? 'LIFETIME') : 'LIFETIME');
        $cfg = $this->getPlanConfigBySlug($slug);
        if ($cfg) return $cfg;
        return [
            'billing' => ['currency' => 'NGN', 'type' => 'UNKNOWN', 'monthlyKobo' => 0, 'annualKobo' => 0, 'setupFeeKobo' => 0],
            'trialDays' => 0,
            'features' => [],
            'limits' => ['students' => null, 'staff' => null, 'storageMb' => null, 'smsCredits' => null],
            'proration' => ['mode' => 'NONE']
        ];
    }

    private function remainingStudentCapacity(string $schoolId, int $requested): int
    {
        if ($requested < 1) return 0;
        $cfg = $this->getEffectivePlanConfigForSchool($schoolId);
        $limit = $cfg['limits']['students'] ?? null;
        if ($limit === null) {
            return $requested;
        }
        $limit = intval($limit);
        if ($limit <= 0) {
            return $requested;
        }
        $stmt = Db::pdo()->prepare('SELECT COUNT(*) AS c FROM students WHERE school_id=?');
        $stmt->execute([$schoolId]);
        $current = intval(($stmt->fetch()['c'] ?? 0));
        $remaining = $limit - $current;
        if ($remaining <= 0) return 0;
        return min($requested, $remaining);
    }

    private function enforceStudentLimit(string $schoolId, int $requested): void
    {
        $allowed = $this->remainingStudentCapacity($schoolId, $requested);
        if ($allowed < $requested) {
            Response::error(403, 'LIMIT_EXCEEDED', 'Student limit reached for this plan.');
            exit;
        }
    }

    private function remainingStaffCapacity(string $schoolId, int $requested): int
    {
        if ($requested < 1) return 0;
        $cfg = $this->getEffectivePlanConfigForSchool($schoolId);
        $limit = $cfg['limits']['staff'] ?? null;
        if ($limit === null) return $requested;
        $limit = intval($limit);
        if ($limit <= 0) return 0;
        $stmt = Db::pdo()->prepare("SELECT COUNT(*) AS c FROM users WHERE school_id=? AND role='TEACHER' AND status!='DELETED'");
        $stmt->execute([$schoolId]);
        $current = intval(($stmt->fetch()['c'] ?? 0));
        $remaining = $limit - $current;
        if ($remaining <= 0) return 0;
        return min($requested, $remaining);
    }

    private function enforceStaffLimit(string $schoolId, int $requested): void
    {
        $allowed = $this->remainingStaffCapacity($schoolId, $requested);
        if ($allowed < $requested) {
            Response::error(403, 'LIMIT_EXCEEDED', 'Staff/teacher limit reached for this plan. Please upgrade.');
            exit;
        }
    }

    private function hasFeatureAccess(string $schoolId, string $feature): bool
    {
        $cfg = $this->getEffectivePlanConfigForSchool($schoolId);
        $features = $cfg['features'] ?? [];
        return is_array($features) && in_array($feature, $features, true);
    }

    private function enforceFeatureAccess(string $schoolId, string $feature): void
    {
        if (!$this->hasFeatureAccess($schoolId, $feature)) {
            Response::error(403, 'UPGRADE_REQUIRED', 'This feature requires an upgraded plan.');
            exit;
        }
    }

    private function getAiCredits(string $schoolId): array
    {
        try {
            $stmt = Db::pdo()->prepare('SELECT ai_credits_remaining, ai_credits_total FROM school_subscriptions WHERE school_id=? LIMIT 1');
            $stmt->execute([$schoolId]);
            $row = $stmt->fetch();
            if ($row) {
                return ['remaining' => intval($row['ai_credits_remaining']), 'total' => intval($row['ai_credits_total'])];
            }
        } catch (Throwable $e) {}
        return ['remaining' => 0, 'total' => 0];
    }

    private function useAiCredit(string $schoolId, int $amount = 1): bool
    {
        try {
            $pdo = Db::pdo();
            $stmt = $pdo->prepare('SELECT ai_credits_remaining FROM school_subscriptions WHERE school_id=? LIMIT 1');
            $stmt->execute([$schoolId]);
            $row = $stmt->fetch();
            if (!$row) return false;
            $remaining = intval($row['ai_credits_remaining'] ?? 0);
            $cfg = $this->getEffectivePlanConfigForSchool($schoolId);
            $planLimit = intval($cfg['limits']['aiCredits'] ?? 0);
            // If plan has no limit (null = unlimited), allow without decrementing
            if ($planLimit <= 0 && ($cfg['limits']['aiCredits'] ?? null) === null) {
                return true;
            }
            if ($remaining < $amount) return false;
            $stmt = $pdo->prepare('UPDATE school_subscriptions SET ai_credits_remaining = ai_credits_remaining - ? WHERE school_id=? AND ai_credits_remaining >= ?');
            $stmt->execute([$amount, $schoolId, $amount]);
            return $stmt->rowCount() > 0;
        } catch (Throwable $e) {
            return false;
        }
    }

    private function addAiCredits(string $schoolId, int $amount): void
    {
        try {
            Db::pdo()->prepare('UPDATE school_subscriptions SET ai_credits_remaining = ai_credits_remaining + ?, ai_credits_total = ai_credits_total + ? WHERE school_id=?')
                ->execute([$amount, $amount, $schoolId]);
        } catch (Throwable $e) {}
    }

    private function upsertSchoolSubscriptionFromLegacyPlan(string $schoolId, string $legacyPlan): void
    {
        $slug = $this->legacyPlanToSlug($legacyPlan);
        try {
            $pdo = Db::pdo();
            $stmt = $pdo->prepare('SELECT sp.id AS plan_id, spv.id AS version_id, spv.config FROM subscription_plans sp JOIN subscription_plan_versions spv ON spv.plan_id=sp.id WHERE sp.slug=? AND spv.is_current=1 LIMIT 1');
            $stmt->execute([$slug]);
            $row = $stmt->fetch();
            if (!$row) {
                return;
            }
            $cfg = json_decode($row['config'] ?? '[]', true);
            $trialDays = is_array($cfg) ? intval($cfg['trialDays'] ?? 0) : 0;
            if ($slug === 'trial' && $trialDays <= 0) {
                $trialDays = 7;
            }
            $status = $slug === 'trial' ? 'TRIALING' : 'ACTIVE';
            $trialEnd = null;
            if ($status === 'TRIALING' && $trialDays > 0) {
                $trialEnd = gmdate('Y-m-d H:i:s', time() + ($trialDays * 86400));
            }
            $sql = Db::isSqlite()
                ? 'INSERT INTO school_subscriptions (id,school_id,plan_id,plan_version_id,status,trial_end,created_at,updated_at) VALUES (?,?,?,?,?,?,NOW(),NOW()) ON CONFLICT(school_id) DO UPDATE SET plan_id=excluded.plan_id, plan_version_id=excluded.plan_version_id, status=excluded.status, trial_end=excluded.trial_end, updated_at=excluded.updated_at'
                : 'INSERT INTO school_subscriptions (id,school_id,plan_id,plan_version_id,status,trial_end,created_at,updated_at) VALUES (?,?,?,?,?,?,NOW(),NOW()) ON DUPLICATE KEY UPDATE plan_id=VALUES(plan_id),plan_version_id=VALUES(plan_version_id),status=VALUES(status),trial_end=VALUES(trial_end),updated_at=VALUES(updated_at)';
            $pdo->prepare($sql)->execute([$this->id('sub'), $schoolId, $row['plan_id'], $row['version_id'], $status, $trialEnd]);
        } catch (Throwable $e) {
            return;
        }
    }

    private function schoolToApi(array $s): array
    {
        $ct = json_decode($s['class_templates'] ?? '{}', true);
        if (!is_array($ct) || count($ct) === 0) {
            $ct = ['nursery' => 'Nursery, KG', 'primary' => 'Primary, Grade', 'secondary' => 'JSS, SSS'];
        }
        return [
            'id' => $s['id'],
            'name' => $s['name'],
            'abbr' => $s['abbr'],
            'slug' => $s['subdomain'] ?? '',
            'address' => $s['address'] ?? '',
            'contact' => $s['contact'] ?? '',
            'motto' => $s['motto'] ?? '',
            'principal' => $s['principal'] ?? '',
            'session' => $s['session'] ?? '',
            'term' => $s['term'] ?? '',
            'nextTerm' => $s['next_term'] ?? '',
            'schoolLevel' => is_string($s['school_level'] ?? null) && strval($s['school_level']) !== '' ? strval($s['school_level']) : 'Secondary',
            'classTemplates' => $ct,
            'ca1Max' => intval($s['ca1_max'] ?? 10),
            'ca2Max' => intval($s['ca2_max'] ?? 10),
            'examMax' => intval($s['exam_max'] ?? 80),
            'subjects' => json_decode($s['subjects'] ?? '[]', true) ?: [],
            'grades' => json_decode($s['grades'] ?? '[]', true) ?: [],
            'plan' => $s['plan'],
            'logoUrl' => is_string($s['logo_url'] ?? null) ? strval($s['logo_url']) : ''
        ];
    }

    private function getSystemSetting(string $k): ?array
    {
        try {
            $stmt = Db::pdo()->prepare('SELECT v FROM system_settings WHERE k=? LIMIT 1');
            $stmt->execute([$k]);
            $row = $stmt->fetch();
            if (!$row || !is_string($row['v'] ?? null)) {
                return null;
            }
            $v = json_decode($row['v'], true);
            return is_array($v) ? $v : null;
        } catch (Throwable $e) {
            return null;
        }
    }

    private function setSystemSetting(string $k, array $v, ?string $userId): void
    {
        $sql = Db::isSqlite()
            ? 'INSERT INTO system_settings (k,v,updated_at,updated_by_user_id) VALUES (?,?,NOW(),?) ON CONFLICT(k) DO UPDATE SET v=excluded.v, updated_at=excluded.updated_at, updated_by_user_id=excluded.updated_by_user_id'
            : 'INSERT INTO system_settings (k,v,updated_at,updated_by_user_id) VALUES (?,?,NOW(),?) ON DUPLICATE KEY UPDATE v=VALUES(v),updated_at=VALUES(updated_at),updated_by_user_id=VALUES(updated_by_user_id)';
        Db::pdo()->prepare($sql)->execute([$k, json_encode($v, JSON_UNESCAPED_SLASHES), $userId]);
    }

    private function enforceMaintenance(string $ip, string $path): void
    {
        if ($path === '/healthz' || $path === '/readyz' || str_starts_with($path, '/public/') || str_starts_with($path, '/s/')) {
            return;
        }
        $cfg = $this->getSystemSetting('maintenance');
        if (!$cfg) {
            return;
        }
        $enabled = ($cfg['enabled'] ?? false) === true;
        if (!$enabled) {
            return;
        }
        $allow = $cfg['allowIps'] ?? [];
        $allow = is_array($allow) ? $allow : [];
        if (in_array($ip, $allow, true)) {
            return;
        }
        Response::error(503, 'MAINTENANCE', is_string($cfg['message'] ?? null) ? $cfg['message'] : 'Maintenance in progress');
        exit;
    }

    private function snake(string $camel): string
    {
        $s = preg_replace('/([a-z])([A-Z])/', '$1_$2', $camel);
        return strtolower($s ?? $camel);
    }

    private function processJobs(?string $schoolIdFilter = null): int
    {
        $pending = $schoolIdFilter !== null ? $this->jobs->getPendingBySchool($schoolIdFilter) : $this->jobs->getPending();
        $count = 0;
        foreach ($pending as $job) {
            $this->jobs->updateStatus($job['id'], 'PROCESSING', 5);
            try {
                if ($job['type'] === 'CLASS_PDF') {
                    $this->handleClassPdfJob($job);
                } else {
                    $this->jobs->updateStatus($job['id'], 'FAILED', 0, null, 'Unknown job type: ' . $job['type']);
                }
                $count++;
            } catch (Throwable $e) {
                $this->jobs->updateStatus($job['id'], 'FAILED', 0, null, $e->getMessage());
            }
        }
        return $count;
    }

    private function handleClassPdfJob(array $job): void
    {
        $schoolId = $job['school_id'];
        $payload = $job['payload'];
        $className = $payload['className'] ?? '';
        $actorId = $payload['actorId'] ?? $job['user_id'];
        $isImpersonated = $payload['isImpersonated'] ?? false;

        $school = $this->getSchoolById($schoolId);
        if (!$school) {
            throw new Exception("School not found: " . $schoolId);
        }

        $this->jobs->updateStatus($job['id'], 'PROCESSING', 10);

        $stmt = Db::pdo()->prepare('SELECT id,name,admission_no,gender,class_name FROM students WHERE school_id=? AND class_name=? ORDER BY name ASC');
        $stmt->execute([$school['id'], $className]);
        $students = $stmt->fetchAll();
        if (!$students) {
            throw new Exception("No students in this class: " . $className);
        }

        $classStats = $this->buildClassStats($school, $className);
        $css = '';
        $sheets = [];
        $total = count($students);
        $done = 0;

        foreach ($students as $st) {
            $sid = strval($st['id']);
            $scores = $this->getScoresForStudent($school['id'], $sid);
            $extras = $this->getReportExtras($school['id'], $sid, strval($school['session'] ?? ''), strval($school['term'] ?? ''));
            $doc = ReportPdf::buildStudentHtml($school, $st, $scores, $extras, $classStats);
            if ($css === '') {
                $css = ReportPdf::extractCss($doc);
            }
            $sheets[] = ReportPdf::extractSheet($doc);
            $done++;
            $progress = 10 + intval(($done / $total) * 70); // 10% to 80%
            $this->jobs->updateStatus($job['id'], 'PROCESSING', $progress);
        }

        $joined = implode('<div class="page-break"></div>', array_filter($sheets));
        $docHtml = '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">'
            . '<style>' . $css . '@page{size:A4;margin:12mm;}.page-break{break-after:page;page-break-after:always}</style>'
            . '</head><body>' . $joined . '</body></html>';

        $this->jobs->updateStatus($job['id'], 'PROCESSING', 85);

        $pdf = PdfRenderer::htmlToPdf($docHtml);
        $filename = $this->makeClassPdfFilename($school, $className);
        $export = $this->createReportExport($school['id'], $filename, $pdf);

        $this->logAudit($actorId, $school['id'], $isImpersonated ? 'REPORT_PDF_CLASS_IMPERSONATED' : 'REPORT_PDF_CLASS', ['className' => $className, 'token' => $export['token'], 'effectiveUserId' => $job['user_id'], 'jobId' => $job['id']]);

        $this->jobs->updateStatus($job['id'], 'COMPLETED', 100, $export['url']);
    }
}
