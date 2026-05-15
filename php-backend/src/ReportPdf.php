<?php

final class ReportPdf
{
    public static function buildStudentHtml(array $school, array $student, array $scores, array $extras, array $classMatesScores): string
    {
        $subjects = json_decode($school['subjects'] ?? '[]', true) ?: [];
        $grades = json_decode($school['grades'] ?? '[]', true) ?: [];

        $ca1Max = intval($school['ca1_max'] ?? 10);
        $ca2Max = intval($school['ca2_max'] ?? 10);
        $examMax = intval($school['exam_max'] ?? 80);
        $totalMax = max(1, $ca1Max + $ca2Max + $examMax);

        $schoolLevel = self::resolveLevel($school, strval($student['class_name'] ?? ''));

        $rows = [];
        $grand = 0.0;

        foreach ($subjects as $sub) {
            $sv = is_array($scores[$sub] ?? null) ? $scores[$sub] : [];
            $ca1 = floatval($sv['ca1'] ?? 0);
            $ca2 = floatval($sv['ca2'] ?? 0);
            $exam = floatval($sv['exam'] ?? 0);
            $tot = $ca1 + $ca2 + $exam;
            $pct = ($tot / $totalMax) * 100.0;
            $g = $tot > 0 ? self::getGrade($pct, $grades) : ['grade' => '—', 'remark' => '—', 'color' => '#666'];

            $vals = $classMatesScores[$sub] ?? [];
            $classAvgPct = 0.0;
            $pos = 1;
            if (is_array($vals) && count($vals) > 0) {
                $myPct = $pct;
                $classAvgPct = array_sum(array_map(fn ($v) => floatval($v), $vals)) / max(1, count($vals));
                $pos = 1 + count(array_filter($vals, fn ($v) => floatval($v) > $myPct));
            }

            $rows[] = [
                'subject' => $sub,
                'ca1' => $ca1,
                'ca2' => $ca2,
                'exam' => $exam,
                'total' => $tot,
                'pct' => $pct,
                'grade' => $g,
                'classAvgPct' => $classAvgPct,
                'pos' => $pos
            ];
            $grand += $tot;
        }

        $avgPct = self::studentAvgPct($subjects, $scores, $totalMax);
        $overall = self::getGrade($avgPct ?? 0.0, $grades);

        $classAvgs = [];
        foreach ($classMatesScores['_studentAverages'] ?? [] as $v) {
            $classAvgs[] = floatval($v);
        }
        $classPos = 1;
        if ($avgPct !== null && count($classAvgs) > 0) {
            $classPos = 1 + count(array_filter($classAvgs, fn ($v) => floatval($v) > $avgPct));
        }

        $att = is_array($extras['attendance'] ?? null) ? $extras['attendance'] : [];
        $traits = is_array($extras['traits'] ?? null) ? $extras['traits'] : [];

        $title = htmlspecialchars(strval($school['name'] ?? 'School'), ENT_QUOTES);
        $abbr = htmlspecialchars(strval($school['abbr'] ?? ''), ENT_QUOTES);
        $term = htmlspecialchars(strval($school['term'] ?? ''), ENT_QUOTES);
        $session = htmlspecialchars(strval($school['session'] ?? ''), ENT_QUOTES);
        $nextTerm = htmlspecialchars(strval($school['next_term'] ?? ''), ENT_QUOTES);

        $stuName = htmlspecialchars(strval($student['name'] ?? ''), ENT_QUOTES);
        $stuClass = htmlspecialchars(strval($student['class_name'] ?? ''), ENT_QUOTES);
        $stuAdm = htmlspecialchars(strval($student['admission_no'] ?? ''), ENT_QUOTES);
        $stuGender = htmlspecialchars(strval($student['gender'] ?? ''), ENT_QUOTES);

        $principal = htmlspecialchars(strval($school['principal'] ?? ''), ENT_QUOTES);
        $motto = htmlspecialchars(strval($school['motto'] ?? ''), ENT_QUOTES);
        $logoUrl = $school['logo_url'] ?? '';
        $reportColor = htmlspecialchars(strval($school['report_color'] ?? '#0d4526'), ENT_QUOTES);

        $classCount = intval($classMatesScores['_classCount'] ?? 0);
        $classCountText = $classCount > 0 ? strval($classCount) : '—';

        $gradeKey = '';
        foreach ($grades as $g) {
            if (!is_array($g)) continue;
            $gradeKey .= '<div class="gk"><b style="color:' . htmlspecialchars(strval($g['color'] ?? '#111'), ENT_QUOTES) . '">' . htmlspecialchars(strval($g['grade'] ?? ''), ENT_QUOTES) . '</b><div class="gk2">' . htmlspecialchars(strval($g['min'] ?? ''), ENT_QUOTES) . '–' . htmlspecialchars(strval($g['max'] ?? ''), ENT_QUOTES) . '%</div><div class="gk3">' . htmlspecialchars(strval($g['remark'] ?? ''), ENT_QUOTES) . '</div></div>';
        }

        $tableHead = '';
        if ($schoolLevel === 'Nursery') {
            $tableHead = '<tr><th>Subject</th><th>Percent</th><th>Grade</th><th>Remark</th></tr>';
        } elseif ($schoolLevel === 'Primary') {
            $tableHead = '<tr><th>Subject</th><th>CA</th><th>Exam</th><th>Total</th><th>Grade</th><th>Remark</th></tr>';
        } else {
            $tableHead = '<tr><th>Subject</th><th>CA1</th><th>CA2</th><th>Exam</th><th>Total</th><th>Grade</th><th>Remark</th><th>Class Avg</th><th>Pos</th></tr>';
        }

        $tableRows = '';
        $chartRows = '';
        foreach ($rows as $r) {
            $sub = htmlspecialchars(strval($r['subject']), ENT_QUOTES);
            $grade = $r['grade'];
            $gTxt = htmlspecialchars(strval($grade['grade'] ?? '—'), ENT_QUOTES);
            $rmk = htmlspecialchars(strval($grade['remark'] ?? '—'), ENT_QUOTES);
            $gColor = htmlspecialchars(strval($grade['color'] ?? '#111'), ENT_QUOTES);

            $myPctVal = $r['pct'];
            $avgPctVal = floatval($r['classAvgPct']);
            $chartRows .= '<div class="chart-row"><div class="chart-label">' . $sub . '</div><div class="chart-bars">'
                . '<div class="bar bar-me" style="width:' . $myPctVal . '%;background:' . $reportColor . '"></div>'
                . '<div class="bar bar-avg" style="width:' . $avgPctVal . '%;background:#e4e0d8"></div>'
                . '</div><div class="chart-val">' . number_format($myPctVal, 0) . '%</div></div>';

            if ($schoolLevel === 'Nursery') {
                $pct = $r['total'] > 0 ? number_format($r['pct'], 1) : '—';
                $tableRows .= "<tr><td>{$sub}</td><td><b>{$pct}</b></td><td style=\"color:{$gColor};font-weight:800;\">{$gTxt}</td><td style=\"color:{$gColor};\">{$rmk}</td></tr>";
            } elseif ($schoolLevel === 'Primary') {
                $ca = ($r['ca1'] + $r['ca2']) > 0 ? strval(intval($r['ca1'] + $r['ca2'])) : '—';
                $exam = $r['exam'] > 0 ? strval(intval($r['exam'])) : '—';
                $tot = $r['total'] > 0 ? strval(intval($r['total'])) : '—';
                $tableRows .= "<tr><td>{$sub}</td><td>{$ca}</td><td>{$exam}</td><td><b>{$tot}</b></td><td style=\"color:{$gColor};font-weight:800;\">{$gTxt}</td><td style=\"color:{$gColor};\">{$rmk}</td></tr>";
            } else {
                $ca1 = $r['ca1'] > 0 ? strval(intval($r['ca1'])) : '—';
                $ca2 = $r['ca2'] > 0 ? strval(intval($r['ca2'])) : '—';
                $exam = $r['exam'] > 0 ? strval(intval($r['exam'])) : '—';
                $tot = $r['total'] > 0 ? strval(intval($r['total'])) : '—';
                $classAvg = number_format(floatval($r['classAvgPct']), 1) . '%';
                $pos = strval(intval($r['pos']));
                $tableRows .= "<tr><td>{$sub}</td><td>{$ca1}</td><td>{$ca2}</td><td>{$exam}</td><td><b>{$tot}</b></td><td style=\"color:{$gColor};font-weight:800;\">{$gTxt}</td><td style=\"color:{$gColor};\">{$rmk}</td><td>{$classAvg}</td><td>{$pos}</td></tr>";
            }
        }

        $daysOpened = $att['daysOpened'] ?? null;
        $daysPresent = $att['daysPresent'] ?? null;
        $timesLate = $att['timesLate'] ?? null;

        $traitRow = function (string $label, array $v): string {
            $rating = $v['rating'] ?? null;
            $remark = trim(strval($v['remark'] ?? ''));
            $stars = "";
            if ($rating) {
                $rInt = max(1, min(5, intval($rating)));
                for ($i = 1; $i <= 5; $i++) { $stars .= $i <= $rInt ? "★" : "☆"; }
            } else { $stars = "☆☆☆☆☆"; }
            $labelH = htmlspecialchars($label, ENT_QUOTES);
            $remarkH = htmlspecialchars($remark !== "" ? $remark : "—", ENT_QUOTES);
            return "<tr><td>{$labelH}</td><td class=\"stars\">{$stars}</td><td>{$remarkH}</td></tr>";
        };

        $tP = is_array($traits['punctuality'] ?? null) ? $traits['punctuality'] : [];
        $tN = is_array($traits['neatness'] ?? null) ? $traits['neatness'] : [];
        $tC = is_array($traits['cooperation'] ?? null) ? $traits['cooperation'] : [];
        $tL = is_array($traits['leadership'] ?? null) ? $traits['leadership'] : [];

        $attOpened = $daysOpened === null ? '—' : htmlspecialchars(strval($daysOpened), ENT_QUOTES);
        $attPresent = $daysPresent === null ? '—' : htmlspecialchars(strval($daysPresent), ENT_QUOTES);
        $attLate = $timesLate === null ? '—' : htmlspecialchars(strval($timesLate), ENT_QUOTES);

        $comments = is_array($extras['comments'] ?? null) ? $extras['comments'] : [];
        $tComm = htmlspecialchars(trim(strval($comments['teacher'] ?? '—')), ENT_QUOTES);
        $pComm = htmlspecialchars(trim(strval($comments['principal'] ?? '—')), ENT_QUOTES);
        $promotion = htmlspecialchars(trim(strval($extras['promotion'] ?? '—')), ENT_QUOTES);

        $avgText = $avgPct === null ? '—' : number_format($avgPct, 1) . '%';
        $grandText = strval(intval($grand));
        $totalPoss = strval(intval(count($subjects) * $totalMax));

        $posSuffix = self::suffix($classPos);
        $posText = $classCount > 0 ? ($classPos . $posSuffix . ' of ' . $classCountText) : ($classPos . $posSuffix);

        $qrData = "https://reportsheet.com.ng/v/" . ($student['id'] ?? 'unknown');
        $qrUrl = "https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=" . urlencode($qrData);

        $html = '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">'
            . '<style>'
            . '@page{size:A4;margin:0;}'
            . 'body{font-family:"Inter",-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;color:#1a1a17;background:#fff;margin:0;padding:0;}'
            . '.pdf-page{width:210mm;height:297mm;position:relative;background:#fff;}'
            . '.watermark{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-30deg);font-size:120px;opacity:0.03;color:#000;font-weight:900;z-index:0;pointer-events:none;white-space:nowrap;}'
            . '.sheet{position:relative;z-index:1;padding:12mm;height:100%;box-sizing:border-box;display:flex;flex-direction:column;}'
            . '.hdr{display:flex;gap:20px;align-items:center;margin-bottom:20px;}'
            . '.hdr .logo{width:80px;height:80px;border-radius:16px;background:' . $reportColor . ';display:flex;align-items:center;justify-content:center;color:#fff;font-weight:900;font-size:24px;overflow:hidden;flex-shrink:0;}'
            . '.hdr .logo img{width:100%;height:100%;object-fit:cover;}'
            . '.hdr .t{flex:1;}'
            . '.hdr .t .n{font-weight:900;font-size:22px;letter-spacing:-0.03em;color:' . $reportColor . ';line-height:1.1;}'
            . '.hdr .t .m{font-size:13px;opacity:0.7;font-style:italic;margin-top:4px;}'
            . '.hdr .t .s{background:#f0f0eb;display:inline-block;padding:4px 10px;border-radius:6px;font-size:12px;margin-top:8px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;}'
            . '.badge{background:' . $reportColor . ';color:#fff;padding:6px 12px;border-radius:20px;font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:0.1em;}'
            . '.stu-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:15px;margin-bottom:20px;padding:15px;background:#f9f9f6;border-radius:14px;border:1px solid #e5e5e0;}'
            . '.stu-k{font-size:10px;text-transform:uppercase;color:#7c7a76;font-weight:800;letter-spacing:0.05em;}'
            . '.stu-v{font-weight:800;font-size:14px;margin-top:2px;}'
            . '.tbl{width:100%;border-collapse:separate;border-spacing:0;font-size:12px;margin-bottom:20px;border:1px solid #e5e5e0;border-radius:12px;overflow:hidden;}'
            . '.tbl th{background:#f9f9f6;color:#7c7a76;font-size:10px;letter-spacing:0.05em;text-transform:uppercase;text-align:left;padding:12px;border-bottom:1px solid #e5e5e0;}'
            . '.tbl td{padding:10px 12px;border-bottom:1px solid #f0f0eb;}'
            . '.tbl tr:last-child td{border-bottom:0;}'
            . '.stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px;}'
            . '.stat-card{background:#fff;border:1px solid #e5e5e0;border-radius:12px;padding:12px;text-align:center;}'
            . '.stat-l{font-size:10px;color:#7c7a76;font-weight:800;text-transform:uppercase;margin-bottom:4px;}'
            . '.stat-v{font-size:20px;font-weight:900;color:#1a1a17;}'
            . '.stat-s{font-size:11px;color:#7c7a76;margin-top:2px;}'
            . '.dual-sect{display:grid;grid-template-columns:1.2fr 1fr;gap:20px;margin-bottom:20px;}'
            . '.chart-box{background:#f9f9f6;border-radius:14px;padding:15px;border:1px solid #e5e5e0;}'
            . '.chart-row{display:flex;align-items:center;gap:10px;margin-bottom:8px;}'
            . '.chart-label{width:80px;font-size:10px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}'
            . '.chart-bars{flex:1;height:8px;background:#e5e5e0;border-radius:4px;position:relative;overflow:hidden;}'
            . '.bar{height:100%;border-radius:4px;position:absolute;top:0;left:0;}'
            . '.bar-avg{z-index:1;opacity:0.3;}'
            . '.bar-me{z-index:2;}'
            . '.chart-val{font-size:10px;font-weight:800;width:30px;text-align:right;}'
            . '.mini-tbl{width:100%;border-collapse:collapse;font-size:11px;}'
            . '.mini-tbl th{text-align:left;font-size:10px;color:#7c7a76;text-transform:uppercase;padding:8px 0;border-bottom:1px solid #e5e5e0;}'
            . '.mini-tbl td{padding:8px 0;border-bottom:1px solid #f0f0eb;}'
            . '.stars{color:#f59e0b;font-size:12px;letter-spacing:2px;}'
            . '.comm-grid{display:grid;grid-template-columns:1fr 1fr;gap:15px;margin-bottom:20px;}'
            . '.comm-box{border:1px solid #e5e5e0;border-radius:12px;padding:12px;background:#fff;}'
            . '.comm-l{font-size:10px;font-weight:800;color:#7c7a76;text-transform:uppercase;margin-bottom:8px;}'
            . '.comm-v{font-size:12px;line-height:1.5;color:#444;font-style:italic;}'
            . '.sig-area{display:grid;grid-template-columns:1fr 1fr 1fr;gap:30px;margin-top:auto;padding-top:20px;border-top:1px solid #e5e5e0;}'
            . '.sig-box{text-align:center;}'
            . '.sig-line{border-top:1px solid #1a1a17;margin-top:40px;padding-top:8px;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:0.05em;}'
            . '.verify-area{display:flex;align-items:center;gap:15px;background:#f9f9f6;padding:10px;border-radius:10px;border:1px solid #e5e5e0;margin-top:20px;}'
            . '.qr-code{width:60px;height:60px;background:#fff;padding:4px;border-radius:6px;border:1px solid #e5e5e0;}'
            . '.qr-code img{width:100%;height:100%;}'
            . '.verify-t{font-size:10px;color:#7c7a76;line-height:1.4;}'
            . '.ftr{display:flex;justify-content:space-between;font-size:10px;color:#999;margin-top:15px;}'
            . '</style></head><body>'
            . '<div class="pdf-page">'
            . '<div class="sheet">'
            . '<div class="watermark">' . $abbr . '</div>'
            . '<div class="hdr">'
            . '<div class="logo">' . ($logoUrl !== '' ? '<img src="' . htmlspecialchars($logoUrl, ENT_QUOTES) . '" alt="Logo">' : ($abbr !== '' ? $abbr : 'SCH')) . '</div>'
            . '<div class="t"><div class="n">' . $title . '</div>' . ($motto !== '' ? '<div class="m">' . $motto . '</div>' : '') . '<div class="s">' . $term . ' · ' . $session . '</div></div>'
            . '<div class="badge">Official Report</div></div>'
            . '<div class="stu-grid">'
            . '<div><div class="stu-k">Student Name</div><div class="stu-v">' . $stuName . '</div></div>'
            . '<div><div class="stu-k">Class</div><div class="stu-v">' . $stuClass . '</div></div>'
            . '<div><div class="stu-k">Admission No</div><div class="stu-v">' . $stuAdm . '</div></div>'
            . '<div><div class="stu-k">Gender</div><div class="stu-v">' . $stuGender . '</div></div>'
            . '<div><div class="stu-k">Total Students</div><div class="stu-v">' . $classCountText . '</div></div>'
            . '<div><div class="stu-k">Next Term</div><div class="stu-v">' . ($nextTerm !== '' ? $nextTerm : '—') . '</div></div>'
            . '</div>'
            . '<table class="tbl"><thead>' . $tableHead . '</thead><tbody>' . $tableRows . '</tbody></table>'
            . '<div class="stats-grid">'
            . '<div class="stat-card"><div class="stat-l">Total Score</div><div class="stat-v">' . $grandText . '</div><div class="stat-s">out of ' . $totalPoss . '</div></div>'
            . '<div class="stat-card"><div class="stat-l">Average</div><div class="stat-v">' . htmlspecialchars($avgText, ENT_QUOTES) . '</div><div class="stat-s">Percentage</div></div>'
            . '<div class="stat-card"><div class="stat-l">Grade</div><div class="stat-v" style="color:' . htmlspecialchars(strval($overall['color'] ?? '#111'), ENT_QUOTES) . '">' . htmlspecialchars(strval($overall['grade'] ?? '—'), ENT_QUOTES) . '</div><div class="stat-s">' . htmlspecialchars(strval($overall['remark'] ?? '—'), ENT_QUOTES) . '</div></div>'
            . '<div class="stat-card"><div class="stat-l">Position</div><div class="stat-v">' . htmlspecialchars($posText, ENT_QUOTES) . '</div><div class="stat-s">in class</div></div>'
            . '</div>'
            . '<div class="dual-sect">'
            . '<div class="chart-box"><div class="comm-l" style="margin-bottom:12px">Subject Performance Analysis</div>' . $chartRows . '<div style="display:flex;justify-content:flex-end;gap:15px;margin-top:10px;font-size:9px;color:#7c7a76;"><span style="display:flex;align-items:center;gap:4px;"><span style="width:8px;height:8px;background:' . $reportColor . ';border-radius:2px;"></span> Student</span><span style="display:flex;align-items:center;gap:4px;"><span style="width:8px;height:8px;background:#e4e0d8;border-radius:2px;"></span> Class Avg</span></div></div>'
            . '<div><table class="mini-tbl"><thead><tr><th>Trait / Skill</th><th>Rating</th><th>Remark</th></tr></thead><tbody>'
            . $traitRow('Punctuality', $tP)
            . $traitRow('Neatness', $tN)
            . $traitRow('Cooperation', $tC)
            . $traitRow('Leadership', $tL)
            . '</tbody></table>'
            . '<table class="mini-tbl" style="margin-top:15px"><thead><tr><th colspan="2">Attendance</th></tr></thead><tbody>'
            . '<tr><td>Days School Opened</td><td style="text-align:right;font-weight:800;">' . $attOpened . '</td></tr>'
            . '<tr><td>Days Present</td><td style="text-align:right;font-weight:800;">' . $attPresent . '</td></tr>'
            . '<tr><td>Times Late</td><td style="text-align:right;font-weight:800;">' . $attLate . '</td></tr>'
            . '</tbody></table></div>'
            . '</div>'
            . '<div class="comm-grid">'
            . '<div class="comm-box"><div class="comm-l">Teacher\'s Comment</div><div class="comm-v">' . $tComm . '</div></div>'
            . '<div class="comm-box"><div class="comm-l">Principal\'s Comment</div><div class="comm-v">' . $pComm . '</div></div>'
            . '</div>'
            . '<div class="sig-area">'
            . '<div class="sig-box"><div class="sig-line">Class Teacher</div></div>'
            . '<div class="sig-box"><div class="comm-l">Promotion Status</div><div style="font-weight:900;font-size:16px;color:' . $reportColor . ';margin-top:5px;">' . $promotion . '</div></div>'
            . '<div class="sig-box"><div style="font-size:12px;font-weight:900;margin-bottom:2px;">' . $principal . '</div><div class="sig-line">Principal / Head Teacher</div></div>'
            . '</div>'
            . '<div class="verify-area">'
            . '<div class="qr-code"><img src="' . $qrUrl . '" alt="QR"></div>'
            . '<div class="verify-t"><b>Secure Verification</b><br>Scan this QR code to verify the authenticity of this report card on our official portal. Altering this document is a punishable offense.</div>'
            . '</div>'
            . '<div class="ftr"><div>System Generated: ' . htmlspecialchars(gmdate('Y-m-d H:i'), ENT_QUOTES) . ' UTC</div><div>ReportSheet · World-Class Education Management</div></div>'
            . '</div></div></body></html>';

        return $html;
    }

    public static function getGrade(float $pct, array $grades): array
    {
        foreach ($grades as $g) {
            if (!is_array($g)) {
                continue;
            }
            $min = floatval($g['min'] ?? -INF);
            $max = floatval($g['max'] ?? INF);
            if ($pct >= $min && $pct <= $max) {
                return [
                    'grade' => strval($g['grade'] ?? '—'),
                    'remark' => strval($g['remark'] ?? '—'),
                    'color' => strval($g['color'] ?? '#111')
                ];
            }
        }
        return ['grade' => '—', 'remark' => '—', 'color' => '#111'];
    }

    public static function studentAvgPct(array $subjects, array $scores, int $totalMax): ?float
    {
        if (count($subjects) === 0) {
            return null;
        }
        $sum = 0.0;
        foreach ($subjects as $sub) {
            $sv = is_array($scores[$sub] ?? null) ? $scores[$sub] : [];
            $tot = floatval($sv['ca1'] ?? 0) + floatval($sv['ca2'] ?? 0) + floatval($sv['exam'] ?? 0);
            $sum += ($tot / max(1, $totalMax)) * 100.0;
        }
        return $sum / max(1, count($subjects));
    }

    private static function suffix(int $n): string
    {
        $n = abs($n);
        $mod100 = $n % 100;
        if ($mod100 >= 11 && $mod100 <= 13) {
            return 'th';
        }
        return match ($n % 10) {
            1 => 'st',
            2 => 'nd',
            3 => 'rd',
            default => 'th'
        };
    }

    private static function resolveLevel(array $school, string $className): string
    {
        $cls = strtolower(trim($className));
        $raw = $school['class_templates'] ?? '{}';
        $cfg = [];
        if (is_string($raw) && trim($raw) !== '') {
            $decoded = json_decode($raw, true);
            if (is_array($decoded)) {
                $cfg = $decoded;
            }
        }

        $parse = function ($v): array {
            $s = strtolower(trim(strval($v ?? '')));
            if ($s === '') return [];
            $parts = array_map('trim', explode(',', $s));
            return array_values(array_filter($parts, fn ($x) => $x !== ''));
        };
        $nur = $parse($cfg['nursery'] ?? '');
        $pri = $parse($cfg['primary'] ?? '');
        $sec = $parse($cfg['secondary'] ?? '');
        $starts = function (array $arr) use ($cls): bool {
            foreach ($arr as $p) {
                if ($p !== '' && str_starts_with($cls, $p)) return true;
            }
            return false;
        };

        if (count($nur) && $starts($nur)) return 'Nursery';
        if (count($pri) && $starts($pri)) return 'Primary';
        if (count($sec) && $starts($sec)) return 'Secondary';

        if (str_starts_with($cls, 'nur') || str_contains($cls, 'nursery') || str_contains($cls, 'kg')) return 'Nursery';
        if (str_contains($cls, 'primary') || str_starts_with($cls, 'pri') || str_contains($cls, 'grade')) return 'Primary';
        if (str_contains($cls, 'jss') || str_contains($cls, 'sss') || str_contains($cls, 'junior') || str_contains($cls, 'senior')) return 'Secondary';

        $fallback = strval($school['school_level'] ?? 'Secondary');
        if ($fallback !== 'Nursery' && $fallback !== 'Primary' && $fallback !== 'Secondary') {
            $fallback = 'Secondary';
        }
        return $fallback;
    }

    public static function extractCss(string $html): string
    {
        $a = strpos($html, '<style>');
        $b = strpos($html, '</style>');
        if ($a === false || $b === false || $b <= $a) {
            return '';
        }
        return substr($html, $a + 7, $b - ($a + 7));
    }

    public static function extractSheet(string $html): string
    {
        $a = strpos($html, '<div class="pdf-page">');
        if ($a === false) {
            $a = strpos($html, '<div class="sheet">');
        }
        $b = strpos($html, '</body>');
        if ($a === false || $b === false || $b <= $a) {
            return '';
        }
        $chunk = substr($html, $a, $b - $a);
        $end = strrpos($chunk, '</div>');
        if ($end === false) {
            return $chunk;
        }
        return substr($chunk, 0, $end + 6);
    }
}
