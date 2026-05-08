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
        foreach ($rows as $r) {
            $sub = htmlspecialchars(strval($r['subject']), ENT_QUOTES);
            $grade = $r['grade'];
            $gTxt = htmlspecialchars(strval($grade['grade'] ?? '—'), ENT_QUOTES);
            $rmk = htmlspecialchars(strval($grade['remark'] ?? '—'), ENT_QUOTES);
            $gColor = htmlspecialchars(strval($grade['color'] ?? '#111'), ENT_QUOTES);
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
            $stars = $rating ? str_repeat('★', max(1, min(5, intval($rating)))) : '—';
            $labelH = htmlspecialchars($label, ENT_QUOTES);
            $remarkH = htmlspecialchars($remark !== '' ? $remark : '—', ENT_QUOTES);
            return "<tr><td>{$labelH}</td><td>{$stars}</td><td>{$remarkH}</td></tr>";
        };

        $tP = is_array($traits['punctuality'] ?? null) ? $traits['punctuality'] : [];
        $tN = is_array($traits['neatness'] ?? null) ? $traits['neatness'] : [];
        $tC = is_array($traits['cooperation'] ?? null) ? $traits['cooperation'] : [];
        $tL = is_array($traits['leadership'] ?? null) ? $traits['leadership'] : [];

        $attOpened = $daysOpened === null ? '—' : htmlspecialchars(strval($daysOpened), ENT_QUOTES);
        $attPresent = $daysPresent === null ? '—' : htmlspecialchars(strval($daysPresent), ENT_QUOTES);
        $attLate = $timesLate === null ? '—' : htmlspecialchars(strval($timesLate), ENT_QUOTES);

        $avgText = $avgPct === null ? '—' : number_format($avgPct, 1) . '%';
        $grandText = strval(intval($grand));
        $totalPoss = strval(intval(count($subjects) * $totalMax));

        $posSuffix = self::suffix($classPos);
        $posText = $classCount > 0 ? ($classPos . $posSuffix . ' of ' . $classCountText) : ($classPos . $posSuffix);

        $html = '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">'
            . '<style>'
            . '@page{size:A4;margin:0;}'
            . 'body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#141412;background:#fff;}'
            . '.pdf-page{width:210mm;height:297mm;overflow:hidden;}'
            . '.pdf-a3{width:297mm;height:420mm;transform:scale(0.7071);transform-origin:top left;}'
            . '.sheet{width:100%;border:1px solid #e4e0d8;border-radius:14px;overflow:hidden;}'
            . '.hdr{background:#0d4526;color:#fff;padding:14px 16px;display:flex;gap:12px;align-items:center;}'
            . '.hdr .logo{width:42px;height:42px;border-radius:12px;background:rgba(255,255,255,0.14);display:flex;align-items:center;justify-content:center;font-weight:900;}'
            . '.hdr .t{flex:1;}'
            . '.hdr .t .n{font-weight:900;font-size:1.05rem;letter-spacing:-0.01em;}'
            . '.hdr .t .s{opacity:0.9;font-size:0.86rem;margin-top:2px;}'
            . '.grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;padding:12px 16px;background:#faf8f3;border-bottom:1px solid #e4e0d8;}'
            . '.k{font-size:0.72rem;letter-spacing:0.08em;text-transform:uppercase;color:#7c7a76;font-weight:900;}'
            . '.v{font-weight:800;margin-top:2px;}'
            . '.tbl{width:100%;border-collapse:collapse;font-size:0.88rem;}'
            . '.tbl th{background:#faf8f3;color:#7c7a76;font-size:0.72rem;letter-spacing:0.08em;text-transform:uppercase;text-align:left;padding:10px 10px;border-bottom:1px solid #e4e0d8;}'
            . '.tbl td{padding:9px 10px;border-bottom:1px solid #f0ede6;vertical-align:top;}'
            . '.tbl tr:last-child td{border-bottom:0;}'
            . '.sum{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;padding:12px 16px;border-top:1px solid #e4e0d8;background:#fff;}'
            . '.box{border:1px solid #e4e0d8;border-radius:12px;padding:10px 10px;}'
            . '.lbl{font-size:0.72rem;letter-spacing:0.08em;text-transform:uppercase;color:#7c7a76;font-weight:900;}'
            . '.val{font-weight:900;font-size:1.05rem;margin-top:4px;}'
            . '.gkey{display:flex;gap:8px;flex-wrap:wrap;padding:10px 16px;border-top:1px solid #e4e0d8;background:#faf8f3;}'
            . '.gk{border:1px solid #e4e0d8;background:#fff;border-radius:12px;padding:8px 10px;min-width:92px;}'
            . '.gk2{font-size:0.78rem;color:#7c7a76;margin-top:3px;}'
            . '.gk3{font-size:0.78rem;color:#7c7a76;margin-top:2px;}'
            . '.two{display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:12px 16px;border-top:1px solid #e4e0d8;background:#fff;}'
            . '.mini{width:100%;border-collapse:collapse;font-size:0.86rem;border:1px solid #e4e0d8;border-radius:12px;overflow:hidden;}'
            . '.mini th{background:#faf8f3;color:#7c7a76;font-size:0.72rem;letter-spacing:0.08em;text-transform:uppercase;text-align:left;padding:10px 10px;border-bottom:1px solid #e4e0d8;}'
            . '.mini td{padding:9px 10px;border-bottom:1px solid #f0ede6;}'
            . '.mini tr:last-child td{border-bottom:0;}'
            . '.ftr{display:flex;gap:10px;justify-content:space-between;padding:10px 16px;border-top:1px solid #e4e0d8;background:#faf8f3;color:#7c7a76;font-size:0.82rem;}'
            . '</style></head><body>'
            . '<div class="pdf-page"><div class="pdf-a3"><div class="sheet">'
            . '<div class="hdr"><div class="logo">' . ($abbr !== '' ? $abbr : 'SCH') . '</div><div class="t"><div class="n">' . $title . '</div><div class="s">' . $term . ' · ' . $session . '</div></div></div>'
            . '<div class="grid">'
            . '<div><div class="k">Student</div><div class="v">' . $stuName . '</div></div>'
            . '<div><div class="k">Class</div><div class="v">' . $stuClass . '</div></div>'
            . '<div><div class="k">Adm No</div><div class="v">' . $stuAdm . '</div></div>'
            . '<div><div class="k">Gender</div><div class="v">' . $stuGender . '</div></div>'
            . '<div><div class="k">Next Term Begins</div><div class="v">' . ($nextTerm !== '' ? $nextTerm : '—') . '</div></div>'
            . '<div><div class="k">No. of Students</div><div class="v">' . $classCountText . '</div></div>'
            . '</div>'
            . '<table class="tbl"><thead>' . $tableHead . '</thead><tbody>' . $tableRows . '</tbody></table>'
            . '<div class="sum">'
            . '<div class="box"><div class="lbl">Grand Total</div><div class="val">' . $grandText . '</div><div style="color:#7c7a76;font-size:0.82rem;">/ ' . $totalPoss . '</div></div>'
            . '<div class="box"><div class="lbl">Average</div><div class="val">' . htmlspecialchars($avgText, ENT_QUOTES) . '</div></div>'
            . '<div class="box"><div class="lbl">Overall Grade</div><div class="val" style="color:' . htmlspecialchars(strval($overall['color'] ?? '#111'), ENT_QUOTES) . '">' . htmlspecialchars(strval($overall['grade'] ?? '—'), ENT_QUOTES) . '</div></div>'
            . '<div class="box"><div class="lbl">Class Position</div><div class="val">' . htmlspecialchars($posText, ENT_QUOTES) . '</div></div>'
            . '</div>'
            . '<div class="gkey">' . $gradeKey . '</div>'
            . '<div class="two">'
            . '<table class="mini"><thead><tr><th colspan="2">Attendance</th></tr></thead><tbody>'
            . '<tr><td>Days School Opened</td><td>' . $attOpened . '</td></tr>'
            . '<tr><td>Days Present</td><td>' . $attPresent . '</td></tr>'
            . '<tr><td>Times Late</td><td>' . $attLate . '</td></tr>'
            . '</tbody></table>'
            . '<table class="mini"><thead><tr><th>Trait</th><th>Rating</th><th>Remark</th></tr></thead><tbody>'
            . $traitRow('Punctuality', $tP)
            . $traitRow('Neatness', $tN)
            . $traitRow('Cooperation', $tC)
            . $traitRow('Leadership', $tL)
            . '</tbody></table>'
            . '</div>'
            . '<div class="ftr"><div>Generated: ' . htmlspecialchars(gmdate('Y-m-d H:i'), ENT_QUOTES) . ' UTC</div><div>EduReport NG</div></div>'
            . '</div></div></div></body></html>';

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
        $a = strpos($html, '<div class="sheet">');
        if ($a === false) {
            $a = strpos($html, "<div class=\"sheet\">");
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
