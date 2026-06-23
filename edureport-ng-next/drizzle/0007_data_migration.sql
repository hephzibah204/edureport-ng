UPDATE score_sheets 
SET session = (SELECT session FROM schools WHERE id = score_sheets.school_id), 
    term = (SELECT term FROM schools WHERE id = score_sheets.school_id) 
WHERE session = '';
