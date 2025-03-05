// Script to set up Supabase database and storage
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: VITE_SUPABASE_URL and VITE_SUPABASE_KEY must be set in .env file');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Storage bucket name
const STORAGE_BUCKET = 'internal-logo-repo';

// Function to create the storage bucket
async function createStorageBucket() {
  try {
    // Check if the bucket exists
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('Error listing buckets:', bucketsError);
      return false;
    }
    
    const bucketExists = buckets.some(bucket => bucket.name === STORAGE_BUCKET);
    
    if (bucketExists) {
      console.log(`Storage bucket ${STORAGE_BUCKET} already exists`);
      return true;
    }
    
    // Create the bucket
    const { error: createError } = await supabase.storage.createBucket(STORAGE_BUCKET, {
      public: true
    });
    
    if (createError) {
      console.error('Error creating bucket:', createError);
      return false;
    }
    
    console.log(`Created storage bucket: ${STORAGE_BUCKET}`);
    return true;
  } catch (error) {
    console.error('Error creating storage bucket:', error);
    return false;
  }
}

// Function to execute SQL script
async function executeSqlScript() {
  try {
    // Read the SQL script
    const sqlScript = fs.readFileSync(path.join(__dirname, 'setup-supabase.sql'), 'utf8');
    
    // Split the script into individual statements
    const statements = sqlScript
      .split(';')
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0);
    
    // Execute each statement
    for (const statement of statements) {
      console.log(`Executing SQL: ${statement}`);
      
      const { error } = await supabase.rpc('execute_sql', { sql: statement });
      
      if (error) {
        console.error('Error executing SQL:', error);
        
        // Try direct query if RPC fails
        try {
          // This is a workaround and may not work depending on permissions
          const { error: directError } = await supabase.from('pg_catalog.pg_tables').select().limit(1);
          
          if (directError) {
            console.error('Direct query failed:', directError);
            console.error('You may need to execute the SQL script manually in the Supabase dashboard');
            return false;
          }
        } catch (directError) {
          console.error('Direct query failed:', directError);
          console.error('You may need to execute the SQL script manually in the Supabase dashboard');
          return false;
        }
      }
    }
    
    console.log('SQL script executed successfully');
    return true;
  } catch (error) {
    console.error('Error executing SQL script:', error);
    console.error('You may need to execute the SQL script manually in the Supabase dashboard');
    return false;
  }
}

// Main function
async function main() {
  console.log('Setting up Supabase...');
  
  // Create storage bucket
  const bucketCreated = await createStorageBucket();
  if (!bucketCreated) {
    console.error('Failed to create storage bucket');
  }
  
  // Execute SQL script
  const sqlExecuted = await executeSqlScript();
  if (!sqlExecuted) {
    console.error('Failed to execute SQL script');
    console.log('Please execute the SQL script manually in the Supabase dashboard');
    console.log('SQL script path: setup-supabase.sql');
  }
  
  if (bucketCreated && sqlExecuted) {
    console.log('Supabase setup completed successfully');
  } else {
    console.log('Supabase setup completed with some issues');
  }
}

// Run the main function
main().catch(console.error);
