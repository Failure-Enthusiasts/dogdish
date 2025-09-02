import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import { ApiResponse, ErrorCodes, HttpStatus, ValidationError } from '@/types/errors';
import { validateRequiredFields, logError, createErrorResponse, createSuccessResponse } from '@/utils/errorUtils';

interface MenuData {
  cuisine: string;
  event_date: string;
  event_date_iso: string;
  menu_items: Array<{
    title: string;
    description: string;
    preferences: string[];
    allergens: string[];
  }>;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  const context = 'POST /api/menu/update';
  
  try {
    // Log the incoming request
    console.log(`[API] ${context} - Updating menu data`);

    // Only allow POST requests
    if (req.method !== 'POST') {
      const errorResponse = createErrorResponse(
        `Method ${req.method} not allowed. Only POST requests are supported.`,
        HttpStatus.METHOD_NOT_ALLOWED,
        ErrorCodes.INVALID_REQUEST,
        { allowedMethods: ['POST'], receivedMethod: req.method }
      );
      return res.status(errorResponse.error!.status).json(errorResponse);
    }

    // Validate request body exists
    if (!req.body) {
      const errorResponse = createErrorResponse(
        'Request body is required',
        HttpStatus.BAD_REQUEST,
        ErrorCodes.VALIDATION_ERROR
      );
      return res.status(errorResponse.error!.status).json(errorResponse);
    }

    // Get the updated menu data from the request body
    const updatedMenuData: MenuData = req.body;

    // Validate required fields
    const requiredFields = ['cuisine', 'event_date', 'event_date_iso', 'menu_items'];
    const validationErrors = validateRequiredFields(updatedMenuData as unknown as Record<string, unknown>, requiredFields);

    if (validationErrors.length > 0) {
      const errorResponse = createErrorResponse(
        'Validation failed. Missing required fields.',
        HttpStatus.BAD_REQUEST,
        ErrorCodes.VALIDATION_ERROR,
        { validationErrors }
      );
      return res.status(errorResponse.error!.status).json(errorResponse);
    }

    // Validate menu items structure
    if (!Array.isArray(updatedMenuData.menu_items) || updatedMenuData.menu_items.length === 0) {
      const errorResponse = createErrorResponse(
        'Menu items must be a non-empty array',
        HttpStatus.BAD_REQUEST,
        ErrorCodes.VALIDATION_ERROR,
        { menuItemsType: typeof updatedMenuData.menu_items, menuItemsLength: updatedMenuData.menu_items?.length }
      );
      return res.status(errorResponse.error!.status).json(errorResponse);
    }

    // Validate each menu item
    const menuItemErrors: ValidationError[] = [];
    updatedMenuData.menu_items.forEach((item, index) => {
      const itemRequiredFields = ['title', 'description', 'preferences', 'allergens'];
      const itemErrors = validateRequiredFields(item, itemRequiredFields);
      
      itemErrors.forEach(error => {
        menuItemErrors.push({
          field: `menu_items[${index}].${error.field}`,
          message: error.message,
          value: error.value
        });
      });

      // Validate arrays
      if (!Array.isArray(item.preferences)) {
        menuItemErrors.push({
          field: `menu_items[${index}].preferences`,
          message: 'preferences must be an array',
          value: item.preferences
        });
      }
      
      if (!Array.isArray(item.allergens)) {
        menuItemErrors.push({
          field: `menu_items[${index}].allergens`,
          message: 'allergens must be an array',
          value: item.allergens
        });
      }
    });

    if (menuItemErrors.length > 0) {
      const errorResponse = createErrorResponse(
        'Menu items validation failed',
        HttpStatus.BAD_REQUEST,
        ErrorCodes.VALIDATION_ERROR,
        { validationErrors: menuItemErrors }
      );
      return res.status(errorResponse.error!.status).json(errorResponse);
    }

    // Path to the menu.json file
    const filePath = path.join(process.cwd(), 'public', 'data', 'menu.json');
    
    // Check if directory exists, create if not
    const dirPath = path.dirname(filePath);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    // Create backup of existing file if it exists
    if (fs.existsSync(filePath)) {
      const backupPath = path.join(dirPath, `menu.backup.${Date.now()}.json`);
      fs.copyFileSync(filePath, backupPath);
      console.log(`[API] Created backup at ${backupPath}`);
    }

    // Write the updated data to the file
    fs.writeFileSync(filePath, JSON.stringify(updatedMenuData, null, 2), 'utf8');
    
    console.log(`[API] Successfully updated menu data with ${updatedMenuData.menu_items.length} items`);
    
    // Return success response
    const successResponse = createSuccessResponse(
      updatedMenuData,
      `Menu updated successfully with ${updatedMenuData.menu_items.length} items`
    );
    return res.status(HttpStatus.OK).json(successResponse);
    
  } catch (error) {
    console.error(`[API] Error in ${context}:`, error);
    logError(error as Error, context);
    
    let errorMessage = 'An unexpected error occurred while updating the menu';
    let errorCode = ErrorCodes.INTERNAL_ERROR;
    
    if (error instanceof Error) {
      if (error.message.includes('ENOENT')) {
        errorMessage = 'Unable to access menu file. Please check file permissions.';
        errorCode = ErrorCodes.FILE_NOT_FOUND;
      } else if (error.message.includes('EACCES')) {
        errorMessage = 'Permission denied. Unable to write to menu file.';
        errorCode = ErrorCodes.FORBIDDEN;
      }
    }
    
    const errorResponse = createErrorResponse(
      errorMessage,
      HttpStatus.INTERNAL_SERVER_ERROR,
      errorCode,
      { originalError: error instanceof Error ? error.message : String(error) }
    );
    
    return res.status(errorResponse.error!.status).json(errorResponse);
  }
}