// client/cater-me-up/src/app/api/upload-menu/route.test.ts
import { POST } from './route'; // Adjust path as needed
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { spawn } from 'child_process';
import fs from 'fs/promises';
import { Pool } from 'pg';
import os from 'os'; // For os.tmpdir() if it's used in mocks

// Mock Clerk's auth()
jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn(),
  clerkClient: { users: { getUser: jest.fn() } } // Mock if clerkClient is used
}));

// Mock child_process.spawn
const mockSpawnOn = jest.fn();
const mockSpawnStderrOn = jest.fn();
const mockSpawnStdoutOn = jest.fn();
jest.mock('child_process', () => ({
  spawn: jest.fn(() => ({
    stdout: { on: mockSpawnStdoutOn, pipe: jest.fn() },
    stderr: { on: mockSpawnStderrOn, pipe: jest.fn() },
    on: mockSpawnOn,
  })),
}));

// Mock fs/promises
jest.mock('fs/promises', () => ({
  mkdir: jest.fn().mockResolvedValue(undefined),
  writeFile: jest.fn().mockResolvedValue(undefined),
  unlink: jest.fn().mockResolvedValue(undefined),
  access: jest.fn().mockResolvedValue(undefined), // Default to script found
}));

// Mock os.tmpdir (if needed, though direct string like '/tmp' can also be used in mocks)
jest.mock('os', () => ({
    tmpdir: jest.fn(() => '/tmp'), // Mock temporary directory
    platform: jest.fn(() => 'linux'), // Or any other needed os functions
}));


// Mock pg.Pool
const mockPoolQuery = jest.fn();
jest.mock('pg', () => ({
  Pool: jest.fn(() => ({
    query: mockPoolQuery,
    connect: jest.fn().mockResolvedValue({ // If using client.query()
        query: mockPoolQuery,
        release: jest.fn(),
    }),
  })),
}));

describe('/api/upload-menu POST handler', () => {
  let mockRequest: Request;
  const mockAuth = auth as jest.Mock; // Typed mock

  beforeEach(() => {
    jest.clearAllMocks();
    // Default to authenticated user
    mockAuth.mockReturnValue({ userId: 'test-user-id' });
    // Default to Python script found
    (fs.access as jest.Mock).mockResolvedValue(undefined);

    // Reset spawn mocks for each test
    mockSpawnOn.mockReset();
    mockSpawnStdoutOn.mockReset();
    mockSpawnStderrOn.mockReset();
    mockPoolQuery.mockReset();

  });

  it('should return 401 if user is not authenticated', async () => {
    mockAuth.mockReturnValue({ userId: null });
    mockRequest = new Request('http://localhost/api/upload-menu', { method: 'POST' });

    const response = await POST(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.error).toBe('Unauthorized');
  });

  it('should return 400 if no PDF file is provided', async () => {
    const formData = new FormData(); // Empty form data
    mockRequest = new Request('http://localhost/api/upload-menu', { method: 'POST', body: formData });

    const response = await POST(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe('No PDF file provided.');
  });

  it('should return 400 if file is not a PDF', async () => {
    const formData = new FormData();
    const mockFile = new File(['content'], 'test.txt', { type: 'text/plain' });
    formData.append('pdfFile', mockFile);
    mockRequest = new Request('http://localhost/api/upload-menu', { method: 'POST', body: formData });

    const response = await POST(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe('Invalid file type. Only PDF is allowed.');
  });

  it('should process PDF and store data successfully', async () => {
    const mockPdfFile = new File(['pdf content'], 'menu.pdf', { type: 'application/pdf' });
    const formData = new FormData();
    formData.append('pdfFile', mockPdfFile);
    mockRequest = new Request('http://localhost/api/upload-menu', { method: 'POST', body: formData });

    // Simulate Python script success
    mockSpawnStdoutOn.mockImplementation((event, callback) => {
      if (event === 'data') callback(JSON.stringify({ success: true, data: "menu data" }));
    });
    mockSpawnOn.mockImplementation((event, callback) => {
      if (event === 'close') callback(0); // Exit code 0
    });

    // Simulate DB success
    mockPoolQuery.mockResolvedValue({ rows: [{ id: 123 }] });

    const response = await POST(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.message).toContain('PDF processed and data stored successfully with ID: 123');
    expect(json.dbSuccess).toBe(true);
    expect(fs.writeFile).toHaveBeenCalled();
    expect(spawn).toHaveBeenCalled();
    expect(mockPoolQuery).toHaveBeenCalled();
    expect(fs.unlink).toHaveBeenCalled(); // Check temp file cleanup
  });

  it('should return 500 if Python script is not found', async () => {
    (fs.access as jest.Mock).mockRejectedValue(new Error('File not found'));
    const mockPdfFile = new File(['pdf content'], 'menu.pdf', { type: 'application/pdf' });
    const formData = new FormData();
    formData.append('pdfFile', mockPdfFile);
    mockRequest = new Request('http://localhost/api/upload-menu', { method: 'POST', body: formData });

    const response = await POST(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toBe('PDF processing script not found on server.');
  });


  it('should return 500 if Python script fails', async () => {
    const mockPdfFile = new File(['pdf content'], 'menu.pdf', { type: 'application/pdf' });
    const formData = new FormData();
    formData.append('pdfFile', mockPdfFile);
    mockRequest = new Request('http://localhost/api/upload-menu', { method: 'POST', body: formData });

    mockSpawnStderrOn.mockImplementation((event, callback) => {
      if (event === 'data') callback('Python error');
    });
    mockSpawnOn.mockImplementation((event, callback) => {
      if (event === 'close') callback(1); // Non-zero exit code
    });

    const response = await POST(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toBe('Failed to process PDF.');
    expect(json.details).toBe('Python error');
  });

  it('should return 500 if database insertion fails', async () => {
    const mockPdfFile = new File(['pdf content'], 'menu.pdf', { type: 'application/pdf' });
    const formData = new FormData();
    formData.append('pdfFile', mockPdfFile);
    mockRequest = new Request('http://localhost/api/upload-menu', { method: 'POST', body: formData });

    mockSpawnStdoutOn.mockImplementation((event, callback) => {
      if (event === 'data') callback(JSON.stringify({ success: true }));
    });
    mockSpawnOn.mockImplementation((event, callback) => {
      if (event === 'close') callback(0);
    });

    mockPoolQuery.mockRejectedValue(new Error('DB connection error'));

    const response = await POST(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.message).toBe('PDF processed but database storage failed.');
    expect(json.error).toBe('DB connection error');
  });

});
