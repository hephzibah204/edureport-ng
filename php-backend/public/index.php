<?php

$backendDir = is_dir(dirname(__DIR__, 2) . '/backend/src')
    ? dirname(__DIR__, 2) . '/backend/src'
    : dirname(__DIR__) . '/src';

$storageDir = is_dir(dirname(__DIR__, 2) . '/backend/storage')
    ? dirname(__DIR__, 2) . '/backend/storage'
    : dirname(__DIR__) . '/storage';

require_once $backendDir . '/Config.php';
require_once $backendDir . '/Response.php';
require_once $backendDir . '/Db.php';
require_once $backendDir . '/Validation.php';
require_once $backendDir . '/Auth.php';
require_once $backendDir . '/Crypto.php';
require_once $backendDir . '/Totp.php';
require_once $backendDir . '/RateLimit.php';
require_once $backendDir . '/Ai.php';
require_once $backendDir . '/PdfRenderer.php';
require_once $backendDir . '/ReportPdf.php';
require_once $backendDir . '/Sms.php';
require_once $backendDir . '/AttendanceService.php';
require_once $backendDir . '/StudentService.php';
require_once $backendDir . '/JobService.php';
require_once $backendDir . '/MailService.php';
require_once $backendDir . '/App.php';

Config::loadEnvIfPresent();

ini_set('display_errors', '0');
error_reporting(E_ALL);

if (!is_dir($storageDir)) {
    @mkdir($storageDir, 0750, true);
}

$logFile = $storageDir . '/error.log';
$debug = Config::envBool('DEBUG', false);

$emitError = function (int $code, array $payload) {
    if (!headers_sent()) {
        header('Content-Type: application/json; charset=utf-8');
        http_response_code($code);
    }
    echo json_encode($payload, JSON_UNESCAPED_SLASHES);
};

$logThrowable = function (Throwable $e) use ($logFile) {
    $msg = "[" . gmdate('Y-m-d H:i:s') . "] " . get_class($e) . ': ' . $e->getMessage() . " in " . $e->getFile() . ':' . $e->getLine() . "\n";
    $msg .= $e->getTraceAsString() . "\n\n";
    @error_log($msg, 3, $logFile);
};

set_exception_handler(function (Throwable $e) use ($emitError, $logThrowable, $debug) {
    $logThrowable($e);
    if ($debug) {
        $emitError(500, ['error' => 'INTERNAL_ERROR', 'message' => $e->getMessage()]);
    } else {
        $emitError(500, ['error' => 'INTERNAL_ERROR', 'message' => 'Internal Server Error']);
    }
    exit;
});

set_error_handler(function (int $severity, string $message, string $file, int $line) {
    if (!(error_reporting() & $severity)) {
        return false;
    }
    throw new ErrorException($message, 0, $severity, $file, $line);
});

register_shutdown_function(function () use ($emitError, $logThrowable, $debug) {
    $err = error_get_last();
    if (!is_array($err)) {
        return;
    }
    $type = $err['type'] ?? 0;
    $fatal = in_array($type, [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR], true);
    if (!$fatal) {
        return;
    }
    $e = new ErrorException(strval($err['message'] ?? 'Fatal error'), 0, intval($type), strval($err['file'] ?? ''), intval($err['line'] ?? 0));
    $logThrowable($e);
    if ($debug) {
        $emitError(500, ['error' => 'INTERNAL_ERROR', 'message' => $e->getMessage()]);
    } else {
        $emitError(500, ['error' => 'INTERNAL_ERROR', 'message' => 'Internal Server Error']);
    }
});

(new App())->run();
