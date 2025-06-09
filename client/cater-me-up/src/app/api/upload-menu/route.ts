import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server'; // For route protection
import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { Pool } from 'pg';

// Initialize connection pool (outside the POST handler, at module scope)
// Ensure your environment variables are set (e.g., POSTGRES_URL or PGHOST, PGUSER, PGDATABASE, PGPASSWORD, PGPORT)
// The Vercel Postgres integration sets POSTGRES_URL.
let pool: Pool | null = null;
try {
    if (!process.env.POSTGRES_URL) {
        console.warn("POSTGRES_URL environment variable is not set. Database operations will be skipped.");
    } else {
        pool = new Pool({
            connectionString: process.env.POSTGRES_URL,
            // ssl: { rejectUnauthorized: false } // Add if connecting to some DBs that need it and you understand implications
        });
        console.log("PostgreSQL pool initialized.");
    }
} catch (err) {
    console.error("Failed to initialize PostgreSQL pool:", err);
    // Pool remains null, database operations will be skipped or fail gracefully.
}


export async function POST(request: Request) {
  const { userId } = auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Optional: Load user details if needed for logging or other purposes
  // const user = await clerkClient.users.getUser(userId);
  // console.log(`User ${user.firstName} (${userId}) is uploading a menu.`);

  let tempFilePath: string | null = null;

  try {
    const formData = await request.formData();
    const file = formData.get('pdfFile') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No PDF file provided.' }, { status: 400 });
    }
    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Invalid file type. Only PDF is allowed.' }, { status: 400 });
    }

    const tempDir = path.join(os.tmpdir(), 'cater-me-up-uploads');
    await fs.mkdir(tempDir, { recursive: true });
    tempFilePath = path.join(tempDir, `${Date.now()}-${file.name}`);
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(tempFilePath, fileBuffer);


    // Path to the Python script
    const projectRoot = process.cwd();
    const pythonScriptPath = path.resolve(projectRoot, '../../pdf_handler/pdf_handler.py');
    const pythonExecutable = 'python3';

    try {
        await fs.access(pythonScriptPath);
    } catch (e) {
        console.error(`Python script not found at: ${pythonScriptPath}`);
        return NextResponse.json({ error: 'PDF processing script not found on server.' }, { status: 500 });
    }

    const pythonProcess = spawn(pythonExecutable, [pythonScriptPath, tempFilePath]);
    let scriptOutput = '';
    let scriptError = '';
    pythonProcess.stdout.on('data', (data) => { scriptOutput += data.toString(); });
    pythonProcess.stderr.on('data', (data) => { scriptError += data.toString(); });
    const exitCode = await new Promise<number | null>((resolve) => { pythonProcess.on('close', resolve); pythonProcess.on('error', (err) => { console.error("Python process error:", err); resolve(null);})});


    if (exitCode !== 0) {
      console.error(`Python script error (Exit Code: ${exitCode}): ${scriptError}`);
      return NextResponse.json({ error: 'Failed to process PDF.', details: scriptError }, { status: 500 });
    }

    let jsonData;
    try {
      jsonData = JSON.parse(scriptOutput);
    } catch (parseError) {
      console.error('Error parsing JSON from Python script:', parseError);
      return NextResponse.json({ error: 'Failed to parse processing script output.', rawOutput: scriptOutput }, { status: 500 });
    }

    // Database insertion logic
    let dbMessage = 'PDF processed. Database operation skipped (not configured or error during init).';
    let dbSuccess = false;

    if (pool) {
        try {
            // Example: INSERT into a table named 'menus_json' with columns 'clerk_user_id' and 'menu_data' (JSONB)
            // Adjust table and column names as per your actual schema.
            const queryText = 'INSERT INTO uploaded_menus (clerk_user_id, file_name, menu_data, processed_at) VALUES ($1, $2, $3, NOW()) RETURNING id';
            const queryValues = [userId, file.name, jsonData]; // Store jsonData directly if column is JSON/JSONB

            const result = await pool.query(queryText, queryValues);
            const newMenuId = result.rows[0]?.id;

            dbMessage = `PDF processed and data stored successfully with ID: ${newMenuId}.`;
            dbSuccess = true;
            console.log(dbMessage);

        } catch (dbError: any) {
            console.error('Database insertion error:', dbError);
            dbMessage = `PDF processed, but failed to store data in database: ${dbError.message}`;
            // Return a more specific error if needed, or just log and proceed with a general success for PDF processing
            // For now, let client know about DB issue
            return NextResponse.json({
                message: 'PDF processed but database storage failed.',
                error: dbError.message,
                fileName: file.name,
                jsonData: jsonData // Still send jsonData for debugging if DB fails
              }, { status: 500 });
        }
    } else {
        console.warn("PostgreSQL pool is not available. Skipping database insertion.");
        // dbMessage is already set
    }

    return NextResponse.json({
      message: dbMessage,
      dbSuccess: dbSuccess,
      fileName: file.name,
      // jsonData: jsonData // Optionally remove jsonData from successful response if large
    }, { status: 200 });

  } catch (error: any) {
    // ... (general error handling as before) ...
    console.error('Error in PDF upload/processing API:', error);
    return NextResponse.json({ error: 'Failed to upload or process PDF.', details: error.message || 'An unexpected error occurred.' }, { status: 500 });
  } finally {
    // ... (temp file cleanup as before) ...
    if (tempFilePath) {
      try {
        await fs.unlink(tempFilePath);
        console.log(`Temporary file ${tempFilePath} deleted.`);
      } catch (cleanupError) {
        console.error(`Error deleting temporary file ${tempFilePath}:`, cleanupError);
      }
    }
  }
}
