import { NextResponse } from 'next/server';

export async function GET() {
  // Here you would fetch the data from your database or other source
  const menus = [
    {
      cuisineSlug: 'olive-and-basil',
      dateSlug: '2024-03-17',
      cuisineName: 'Olive & Basil',
      eventDate: 'Monday, March 17'
    },
    // Add more menus
  ];

  return NextResponse.json(menus);
} 