<?php

require_once dirname(__DIR__, 3) . '/src/Config.php';
Config::loadEnvIfPresent();

$ui = Config::env('ADMIN_UI_URL', 'http://127.0.0.1:3000/admin.html');
$schoolUi = Config::env('SCHOOL_UI_URL', 'http://127.0.0.1:3000/app.html');

header('Content-Type: text/html; charset=utf-8');

?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin Login — EduReport NG</title>
  <style>
    :root { color-scheme: light; }
    body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; background: #faf8f3; color:#141412; margin:0; min-height:100vh; display:flex; align-items:center; justify-content:center; padding:28px 14px; }
    .card { width:min(520px, 92vw); background:#fff; border:1px solid #e4e0d8; border-radius:14px; box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.06); padding:18px 18px; }
    h1 { margin:0; font-size:1.35rem; }
    p { margin:6px 0 0; color:#7c7a76; }
    label { display:block; margin-top:12px; font-size:0.75rem; font-weight:800; letter-spacing:0.08em; text-transform:uppercase; color:#7c7a76; }
    input { width:100%; padding:11px 12px; border-radius:10px; border:1.5px solid #e4e0d8; outline:none; font-size:0.95rem; margin-top:6px; }
    input:focus { border-color:#1a6b3c; box-shadow: 0 0 0 3px rgba(26,107,60,0.1); }
    button { margin-top:14px; width:100%; padding:11px 12px; border:0; border-radius:10px; background:#1a6b3c; color:#fff; font-weight:800; cursor:pointer; }
    button:disabled { opacity:0.6; cursor:not-allowed; }
    .err { margin-top:10px; padding:10px 12px; border-radius:10px; border:1px solid #e4e0d8; background:#fdecea; color:#c0392b; display:none; }
    .muted { margin-top:10px; color:#7c7a76; font-size:0.9rem; text-align:center; }
    a { color:#1a6b3c; text-decoration:none; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Admin Login</h1>
    <p>Sign in to manage the platform</p>

    <label>Email</label>
    <input id="email" type="email" autocomplete="email" placeholder="admin@domain.com" />

    <label>Password</label>
    <input id="password" type="password" autocomplete="current-password" placeholder="Your password" />

    <label>2FA Code (if enabled)</label>
    <input id="totp" inputmode="numeric" autocomplete="one-time-code" placeholder="123456" />

    <button id="btn">Sign In</button>
    <div id="err" class="err"></div>
    <div class="muted">After login you will be redirected to <a href="<?php echo htmlspecialchars($ui, ENT_QUOTES); ?>">dashboard</a>.</div>
  </div>

  <script>
    const UI_URL = <?php echo json_encode($ui, JSON_UNESCAPED_SLASHES); ?>;
    const SCHOOL_UI_URL = <?php echo json_encode($schoolUi, JSON_UNESCAPED_SLASHES); ?>;
    const btn = document.getElementById('btn');
    const err = document.getElementById('err');
    async function login() {
      err.style.display = 'none';
      err.textContent = '';
      btn.disabled = true;
      btn.textContent = 'Signing in…';
      try {
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const totp = document.getElementById('totp').value.trim();
        const res = await fetch('/auth/login', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, totp: totp || undefined })
        });
        const text = await res.text();
        let data = null;
        try { data = JSON.parse(text); } catch {}
        if (!res.ok) {
          const msg = data?.error?.message || 'Sign in failed.';
          throw new Error(msg);
        }
        const role = data?.user?.role;
        if (role === 'SCHOOL') {
          location.replace(SCHOOL_UI_URL);
          return;
        }
        if (role !== 'ADMIN' && role !== 'STAFF') {
          throw new Error('Not an admin account. Use the regular login page.');
        }
        location.replace(UI_URL);
      } catch (e) {
        err.textContent = e?.message || 'Sign in failed.';
        err.style.display = 'block';
        btn.disabled = false;
        btn.textContent = 'Sign In';
      }
    }
    btn.addEventListener('click', login);
    document.addEventListener('keydown', (e) => { if (e.key === 'Enter') login(); });
  </script>
</body>
</html>
