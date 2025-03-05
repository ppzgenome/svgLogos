# Supabase Setup Instructions

This document provides instructions for setting up the Supabase database and storage bucket required for the internal logo repository functionality.

## Prerequisites

- Access to the Supabase dashboard for your project
- The Supabase URL and API key (available in the `.env` file)

## Setup Steps

### 1. Create the Storage Bucket

1. Log in to your Supabase dashboard at https://app.supabase.com
2. Navigate to the "Storage" section in the left sidebar
3. Click "Create bucket"
4. Enter the bucket name: `internal-logo-repo`
5. Enable "Public bucket" option
6. Click "Create bucket" to finish

### 2. Create the Database Table

1. Navigate to the "SQL Editor" section in the left sidebar
2. Click "New query"
3. Copy and paste the following SQL script:

```sql
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
```

4. Click "Run" to execute the SQL script

### 3. Set Up Row-Level Security (RLS) Policies

1. Navigate to the "Authentication" section in the left sidebar
2. Click on "Policies"
3. Find the `logo_searches` table in the list
4. Click "Add policy" for each of the following operations:

#### For SELECT operations:
- Policy name: `Enable read access for all users`
- Policy definition: `true`

#### For INSERT operations:
- Policy name: `Enable insert access for all users`
- Policy definition: `true`

#### For UPDATE operations:
- Policy name: `Enable update access for all users`
- Policy definition: `true`

#### For DELETE operations:
- Policy name: `Enable delete access for all users`
- Policy definition: `true`

### 4. Set Up Storage Bucket Policies

1. Navigate to the "Storage" section in the left sidebar
2. Click on "Policies"
3. Find the `internal-logo-repo` bucket in the list
4. Click "Add policy" for each of the following operations:

#### For SELECT operations:
- Policy name: `Enable read access for all users`
- Policy definition: `true`

#### For INSERT operations:
- Policy name: `Enable insert access for all users`
- Policy definition: `true`

#### For UPDATE operations:
- Policy name: `Enable update access for all users`
- Policy definition: `true`

#### For DELETE operations:
- Policy name: `Enable delete access for all users`
- Policy definition: `true`

## Verification

After completing the setup, you can verify that everything is working correctly by:

1. Running the application
2. Searching for a logo
3. Checking the Supabase dashboard to confirm that:
   - The logo file was uploaded to the `internal-logo-repo` storage bucket
   - A record was created in the `logo_searches` table

## Troubleshooting

If you encounter any issues:

1. Check the browser console for error messages
2. Verify that the Supabase URL and API key in the `.env` file are correct
3. Ensure that all the RLS policies are properly set up
4. Check that the storage bucket is publicly accessible
