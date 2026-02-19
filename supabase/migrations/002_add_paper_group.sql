-- Add paper_group column to papers table
-- Papers in the same group are interchangeable (pick exactly one)
-- e.g. Paper 5 (Practical) and Paper 6 (Alternative to Practical) share group "practical"
alter table papers add column if not exists paper_group text;
