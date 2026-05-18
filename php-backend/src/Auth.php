<?php

final class Auth
{
    public static function startSession(): void
    {
        ini_set('session.use_strict_mode', '1');
        ini_set('session.use_only_cookies', '1');
        ini_set('session.use_trans_sid', '0');
        ini_set('session.cookie_httponly', '1');
        ini_set('session.cookie_samesite', 'Lax');
        $secure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off');
        if (Config::envBool('FORCE_HTTPS', false)) {
            $secure = true;
        }
        ini_set('session.cookie_secure', $secure ? '1' : '0');
        $name = Config::env('SESSION_NAME', 'ReportSheetSESSID');
        if (is_string($name) && $name !== '') {
            session_name($name);
        }
        session_set_cookie_params([
            'lifetime' => 0,
            'path' => '/',
            'domain' => '',
            'secure' => $secure,
            'httponly' => true,
            'samesite' => 'Lax'
        ]);
        if (session_status() !== PHP_SESSION_ACTIVE) {
            session_start();
        }
    }

    public static function rotateSessionId(): void
    {
        if (session_status() !== PHP_SESSION_ACTIVE) {
            return;
        }
        @session_regenerate_id(true);
    }

    public static function requireSessionUser(): array
    {
        $uid = $_SESSION['user_id'] ?? null;
        $role = $_SESSION['role'] ?? null;
        if (!is_string($uid) || !is_string($role)) {
            Response::error(401, 'UNAUTHENTICATED', 'Unauthenticated');
            exit;
        }
        return ['id' => $uid, 'role' => $role];
    }

    public static function requireUser(): array
    {
        $s = self::requireSessionUser();
        $uid = $s['id'];
        $role = $s['role'];
        $impUser = $_SESSION['impersonate_user_id'] ?? null;
        $impSchool = $_SESSION['impersonate_school_id'] ?? null;
        if ($role === 'ADMIN' && is_string($impUser) && $impUser !== '') {
            return ['id' => $impUser, 'role' => 'SCHOOL', 'impersonating' => true, 'adminId' => $uid, 'schoolId' => is_string($impSchool) ? $impSchool : null];
        }
        return ['id' => $uid, 'role' => $role, 'impersonating' => false, 'adminId' => null, 'schoolId' => null];
    }

    public static function requireRole(string $role): array
    {
        $u = self::requireSessionUser();
        if ($u['role'] !== $role) {
            Response::error(403, 'FORBIDDEN', 'Forbidden');
            exit;
        }
        return $u;
    }

    public static function requireAnyRole(array $roles): array
    {
        $u = self::requireSessionUser();
        if (!in_array($u['role'], $roles, true)) {
            Response::error(403, 'FORBIDDEN', 'Forbidden');
            exit;
        }
        return $u;
    }

    public static function requireEffectiveRole(string $role): array
    {
        $u = self::requireUser();
        if ($u['role'] !== $role) {
            Response::error(403, 'FORBIDDEN', 'Forbidden');
            exit;
        }
        return $u;
    }

    public static function requirePermission(string $permission): array
    {
        $u = self::requireSessionUser();
        if (($u['role'] ?? null) === 'ADMIN') {
            return $u;
        }
        if (($u['role'] ?? null) !== 'STAFF') {
            Response::error(403, 'FORBIDDEN', 'Forbidden');
            exit;
        }
        $perms = self::getUserPermissions($u['id']);
        if (!in_array($permission, $perms, true)) {
            Response::error(403, 'FORBIDDEN', 'Forbidden');
            exit;
        }
        return $u;
    }

    private static function getUserPermissions(string $userId): array
    {
        try {
            $stmt = Db::pdo()->prepare('SELECT r.permissions FROM user_roles ur JOIN roles r ON r.id=ur.role_id WHERE ur.user_id=?');
            $stmt->execute([$userId]);
            $out = [];
            foreach ($stmt->fetchAll() as $row) {
                $p = json_decode($row['permissions'] ?? '[]', true);
                if (!is_array($p)) {
                    continue;
                }
                foreach ($p as $perm) {
                    if (is_string($perm) && $perm !== '') {
                        $out[$perm] = true;
                    }
                }
            }
            return array_keys($out);
        } catch (Throwable $e) {
            return [];
        }
    }

    public static function logout(): void
    {
        $_SESSION = [];
        if (session_status() === PHP_SESSION_ACTIVE) {
            $params = session_get_cookie_params();
            setcookie(session_name(), '', [
                'expires' => time() - 3600,
                'path' => $params['path'] ?? '/',
                'domain' => $params['domain'] ?? '',
                'secure' => ($params['secure'] ?? false) === true,
                'httponly' => ($params['httponly'] ?? true) === true,
                'samesite' => $params['samesite'] ?? 'Lax'
            ]);
            session_destroy();
        }
    }

    public static function hashPassword(string $password): string
    {
        $hash = password_hash($password, PASSWORD_DEFAULT);
        if (!is_string($hash)) {
            throw new RuntimeException('Hash failed');
        }
        return $hash;
    }

    public static function verifyPassword(string $hash, string $password): bool
    {
        return password_verify($password, $hash);
    }
}
