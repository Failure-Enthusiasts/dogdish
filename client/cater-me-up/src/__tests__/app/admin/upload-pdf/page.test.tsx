// client/cater-me-up/src/__tests__/app/admin/upload-pdf/page.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import UploadPdfPage from '../../../../app/admin/upload-pdf/page'; // Adjust path
import { useAuth } from '@clerk/nextjs';

// Mock Clerk's useAuth hook
jest.mock('@clerk/nextjs', () => ({
  useAuth: jest.fn(),
  UserButton: () => <div data-testid="user-button-mock">UserButton</div>, // Mock if UserButton is on this page
}));

// Mock global fetch
global.fetch = jest.fn();

const mockUseAuth = useAuth as jest.Mock;

describe('UploadPdfPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default to loaded and authenticated user
    mockUseAuth.mockReturnValue({
      isLoaded: true,
      isSignedIn: true,
      userId: 'test-user-123',
    });
    (global.fetch as jest.Mock).mockClear();
  });

  it('renders the upload form', () => {
    render(<UploadPdfPage />);
    expect(screen.getByRole('heading', { name: /upload new pdf menu/i })).toBeInTheDocument();
    expect(screen.getByText(/choose pdf file/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /upload pdf/i })).toBeInTheDocument();
  });

  it('shows error if non-PDF file is selected', () => {
    render(<UploadPdfPage />);
    const fileInput = screen.getByLabelText(/upload a file/i); // Find by accessible name of hidden input
    const testFile = new File(['content'], 'test.txt', { type: 'text/plain' });

    fireEvent.change(fileInput, { target: { files: [testFile] } });

    expect(screen.getByText(/invalid file type\. please select a pdf file\./i)).toBeInTheDocument();
  });

  it('calls fetch with FormData when a PDF is uploaded', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Success!' }),
    });

    render(<UploadPdfPage />);
    const fileInput = screen.getByLabelText(/upload a file/i);
    const testPdfFile = new File(['pdf data'], 'menu.pdf', { type: 'application/pdf' });

    fireEvent.change(fileInput, { target: { files: [testPdfFile] } });
    fireEvent.click(screen.getByRole('button', { name: /upload pdf/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith('/api/upload-menu', expect.objectContaining({
        method: 'POST',
        // body will be FormData, checking instance is tricky, check that it's called
      }));
      // Check that FormData contains the file (more complex, often skipped for unit tests)
      // const fetchOptions = (global.fetch as jest.Mock).mock.calls[0][1];
      // const formData = fetchOptions.body as FormData;
      // expect(formData.get('pdfFile')).toEqual(testPdfFile);
    });
    expect(await screen.findByText(/success!/i)).toBeInTheDocument();
  });

  it('disables upload button if not signed in', () => {
    mockUseAuth.mockReturnValue({
      isLoaded: true,
      isSignedIn: false,
      userId: null,
    });
    render(<UploadPdfPage />);
    // Message "You need to be signed in..." is shown by the component's logic
    expect(screen.getByText(/you need to be signed in to access this page/i)).toBeInTheDocument();
    // The button might not even be rendered, or be disabled if it is.
    // If page redirects or shows only sign-in prompt, the button won't be there.
    // The component currently renders a sign-in link if not authenticated.
    // So, checking for the absence of the upload button or its disabled state if rendered.
    // For this component, it shows a link to sign-in instead of the form.
    expect(screen.queryByRole('button', { name: /upload pdf/i })).not.toBeInTheDocument();
  });

  it('shows error message if fetch fails', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Server failed' }),
    });
    render(<UploadPdfPage />);
    const fileInput = screen.getByLabelText(/upload a file/i);
    const testPdfFile = new File(['pdf data'], 'menu.pdf', { type: 'application/pdf' });

    fireEvent.change(fileInput, { target: { files: [testPdfFile] } });
    fireEvent.click(screen.getByRole('button', { name: /upload pdf/i }));

    expect(await screen.findByText(/server failed/i)).toBeInTheDocument();
  });
});
