-- Google Sheet tab that holds this assignment's form responses.
-- Empty/NULL means the first tab of the configured spreadsheet.
ALTER TABLE assignment ADD COLUMN IF NOT EXISTS sheet_tab TEXT;
