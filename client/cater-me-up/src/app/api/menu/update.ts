import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import { z } from 'zod';
import { validateMenuData, formatValidationError, MenuData } from '../../../lib/validation';
import { checkRateLimit, getRateLimitKey, createRateLimitedResponse, RATE_LIMITS } from '../../../lib/security';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Rate limiting
  const rateLimitKey = getRateLimitKey(req as any, ':menu-update');
  const rateLimit = checkRateLimit(rateLimitKey, RATE_LIMITS.api);
  
  if (!rateLimit.allowed) {
    return createRateLimitedResponse(rateLimit.resetTime);
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      allowedMethods: ['POST']
    });
  }

  // Content-Type validation
  const contentType = req.headers['content-type'];
  if (!contentType || !contentType.includes('application/json')) {
    return res.status(400).json({ 
      error: 'Invalid Content-Type. Expected application/json' 
    });
  }

  try {
    // Validate request body exists
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ 
        error: 'Invalid request body. Expected JSON object' 
      });
    }

    // Validate menu data structure and content
    let validatedMenuData: MenuData;
    try {
      validatedMenuData = validateMenuData(req.body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: 'Validation failed',
          details: formatValidationError(error)
        });
      }
      throw error;
    }

    // Additional business logic validation
    const today = new Date();
    const eventDate = new Date(validatedMenuData.event_date_iso);
    if (eventDate < today) {
      return res.status(400).json({ 
        error: 'Cannot update menu for past events' 
      });
    }

    // Validate file path to prevent directory traversal
    const fileName = 'menu.json';
    if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
      return res.status(400).json({ 
        error: 'Invalid file operation' 
      });
    }

    // Path to the menu.json file
    const filePath = path.join(process.cwd(), 'public', 'data', fileName);
    
    // Ensure directory exists
    const dirPath = path.dirname(filePath);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    // Create backup before updating
    if (fs.existsSync(filePath)) {
      const backupPath = path.join(dirPath, `menu-backup-${Date.now()}.json`);
      fs.copyFileSync(filePath, backupPath);
    }

    // Write the updated data to the file with atomic operation
    const tempPath = filePath + '.tmp';
    const jsonData = JSON.stringify(validatedMenuData, null, 2);
    
    fs.writeFileSync(tempPath, jsonData, 'utf8');
    fs.renameSync(tempPath, filePath);
    
    // Set security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'no-store');
    
    // Return success response
    return res.status(200).json({ 
      success: true,
      message: 'Menu updated successfully',
      itemCount: validatedMenuData.menu_items.length,
      eventDate: validatedMenuData.event_date
    });
    
  } catch (error) {
    console.error('Error updating menu:', error);
    
    // Don't expose internal errors to client
    return res.status(500).json({ 
      error: 'Internal server error. Please try again later.' 
    });
  }
}