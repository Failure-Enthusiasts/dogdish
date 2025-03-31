import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import { MenuData } from '../../../types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  
  try {
    // Get the updated menu data from the request body
    const updatedMenuData: MenuData = req.body;
    
    // In a real application, you would validate the data here
    
    // Path to the menu.json file
    const filePath = path.join(process.cwd(), 'public', 'data', 'menu.json');
    
    // Write the updated data to the file
    fs.writeFileSync(filePath, JSON.stringify(updatedMenuData, null, 2), 'utf8');
    
    // Return success response
    return res.status(200).json({ message: 'Menu updated successfully' });
  } catch (error) {
    console.error('Error updating menu:', error);
    return res.status(500).json({ message: 'Error updating menu' });
  }
}