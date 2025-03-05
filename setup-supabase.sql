-- Create the logo_searches table
CREATE TABLE IF NOT EXISTS logo_searches (
  id UUID PRIMARY KEY,
  search_term TEXT NOT NULL,
  file_name TEXT NOT NULL,
  source TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  logo_found BOOLEAN NOT NULL DEFAULT FALSE,
  object_url TEXT,
  content_hash TEXT,
  visual_signature JSONB
);

-- Create indexes for faster searches
CREATE INDEX IF NOT EXISTS idx_logo_searches_search_term ON logo_searches(search_term);
CREATE INDEX IF NOT EXISTS idx_logo_searches_content_hash ON logo_searches(content_hash);
CREATE INDEX IF NOT EXISTS idx_logo_searches_logo_found ON logo_searches(logo_found);
