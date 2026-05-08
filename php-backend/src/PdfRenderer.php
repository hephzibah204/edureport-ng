<?php

final class PdfRenderer
{
    public static function htmlToPdf(string $html): string
    {
        $renderer = strtolower(trim(strval(Config::env('PDF_RENDERER', 'edge'))));
        if ($renderer === 'chrome') {
            return self::renderWithBrowser(strval(Config::env('PDF_BROWSER_BIN', 'chrome')), $html);
        }
        if ($renderer === 'edge' || $renderer === 'msedge') {
            return self::renderWithBrowser(strval(Config::env('PDF_BROWSER_BIN', 'msedge')), $html);
        }
        if ($renderer === 'browser') {
            $bin = strval(Config::env('PDF_BROWSER_BIN', 'msedge'));
            return self::renderWithBrowser($bin, $html);
        }
        return self::renderWithBrowser(strval(Config::env('PDF_BROWSER_BIN', 'msedge')), $html);
    }

    private static function renderWithBrowser(string $bin, string $html): string
    {
        $base = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'storage' . DIRECTORY_SEPARATOR . 'tmp';
        if (!is_dir($base)) {
            @mkdir($base, 0750, true);
        }
        $id = bin2hex(random_bytes(8));
        $dir = $base . DIRECTORY_SEPARATOR . 'pdf_' . $id;
        if (!@mkdir($dir, 0750, true) && !is_dir($dir)) {
            throw new RuntimeException('Unable to create temp directory');
        }
        $htmlFile = $dir . DIRECTORY_SEPARATOR . 'doc.html';
        $pdfFile = $dir . DIRECTORY_SEPARATOR . 'out.pdf';
        $ok = file_put_contents($htmlFile, $html);
        if ($ok === false) {
            self::rrmdir($dir);
            throw new RuntimeException('Unable to write temp HTML');
        }

        $cmd = $bin
            . ' --headless'
            . ' --disable-gpu'
            . ' --no-first-run'
            . ' --no-default-browser-check'
            . ' --disable-extensions'
            . ' --disable-dev-shm-usage'
            . ' --print-to-pdf=' . escapeshellarg($pdfFile)
            . ' --print-to-pdf-no-header'
            . ' ' . escapeshellarg($htmlFile);

        $descriptors = [
            0 => ['pipe', 'r'],
            1 => ['pipe', 'w'],
            2 => ['pipe', 'w']
        ];
        $proc = proc_open($cmd, $descriptors, $pipes, $dir);
        if (!is_resource($proc)) {
            self::rrmdir($dir);
            throw new RuntimeException('PDF renderer not available');
        }

        try {
            fclose($pipes[0]);
            stream_set_timeout($pipes[1], 30);
            stream_set_timeout($pipes[2], 30);
            $stdout = stream_get_contents($pipes[1]);
            $stderr = stream_get_contents($pipes[2]);
            fclose($pipes[1]);
            fclose($pipes[2]);
            $code = proc_close($proc);
            if ($code !== 0) {
                self::rrmdir($dir);
                throw new RuntimeException('PDF renderer failed: ' . trim($stderr !== '' ? $stderr : $stdout));
            }
            $pdf = @file_get_contents($pdfFile);
            self::rrmdir($dir);
            if (!is_string($pdf) || $pdf === '') {
                throw new RuntimeException('PDF renderer returned empty output');
            }
            return $pdf;
        } catch (Throwable $e) {
            try {
                proc_terminate($proc);
            } catch (Throwable $e2) {
            }
            self::rrmdir($dir);
            throw $e;
        }
    }

    private static function rrmdir(string $dir): void
    {
        if (!is_dir($dir)) {
            return;
        }
        $items = @scandir($dir);
        if (!is_array($items)) {
            @rmdir($dir);
            return;
        }
        foreach ($items as $it) {
            if ($it === '.' || $it === '..') {
                continue;
            }
            $p = $dir . DIRECTORY_SEPARATOR . $it;
            if (is_dir($p)) {
                self::rrmdir($p);
            } else {
                @unlink($p);
            }
        }
        @rmdir($dir);
    }
}
