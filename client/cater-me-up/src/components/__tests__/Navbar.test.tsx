import React from 'react';
import { render, screen } from '@testing-library/react';
import Navbar from '../Navbar'; // Adjust path as necessary if Navbar.tsx is elsewhere
import '@testing-library/jest-dom';

describe('Navbar Component', () => {
  it('renders correctly and displays the brand name', () => {
    render(<Navbar />);
    // Check for the brand name
    expect(screen.getByText('Cater Me Up')).toBeInTheDocument();
  });

  it('contains a link to the About page', () => {
    render(<Navbar />);
    // Check for the "About" link
    // We can find it by its text content
    const aboutLink = screen.getByRole('link', { name: /about/i });
    expect(aboutLink).toBeInTheDocument();
    expect(aboutLink).toHaveAttribute('href', '/about');
  });

  it('contains a link to the Previous Events page', () => {
    render(<Navbar />);
    const prevEventsLink = screen.getByRole('link', { name: /previous events/i });
    expect(prevEventsLink).toBeInTheDocument();
    expect(prevEventsLink).toHaveAttribute('href', '/prev-events');
  });

  it('contains a link to the Admin page', () => {
    render(<Navbar />);
    const adminLink = screen.getByRole('link', { name: /admin/i });
    expect(adminLink).toBeInTheDocument();
    expect(adminLink).toHaveAttribute('href', '/admin');
  });
});
