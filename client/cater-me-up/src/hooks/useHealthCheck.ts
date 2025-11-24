'use client';
import { useState, useEffect, useCallback } from 'react';

interface HealthStatus {
  isOnline: boolean;
  version?: string;
  lastChecked: Date;
  error?: string;
  responseTime?: number;
}

interface UseHealthCheckResult {
  status: HealthStatus;
  checkHealth: () => Promise<void>;
  isChecking: boolean;
}

interface UseHealthCheckOptions {
  endpoint: string;
  serviceName?: string;
  checkInterval?: number;
  timeout?: number;
}

const DEFAULT_CHECK_INTERVAL = 60000; // 1 minute in milliseconds
const DEFAULT_TIMEOUT_DURATION = 10000; // 10 seconds timeout

export const useHealthCheck = (options: UseHealthCheckOptions): UseHealthCheckResult => {
  const { 
    endpoint, 
    serviceName = 'Service',
    checkInterval = DEFAULT_CHECK_INTERVAL, 
    timeout = DEFAULT_TIMEOUT_DURATION 
  } = options;
  const [status, setStatus] = useState<HealthStatus>({
    isOnline: false,
    lastChecked: new Date(),
    error: undefined,
    responseTime: undefined,
  });
  const [isChecking, setIsChecking] = useState(false);

  const checkHealth = useCallback(async (): Promise<void> => {
    console.log(`[HealthCheck:${serviceName}] Starting health check...`);
    setIsChecking(true);
    const startTime = Date.now();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      console.log(`[HealthCheck:${serviceName}] Fetching:`, endpoint);
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;
      console.log(`[HealthCheck:${serviceName}] Response received:`, response.status, response.statusText);

      if (response.ok) {
        try {
          // Check if response is JSON
          const contentType = response.headers.get('content-type');
          console.log(`[HealthCheck:${serviceName}] Content-Type:`, contentType);
          
          if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            console.log(`[HealthCheck:${serviceName}] ✅ Parsed JSON:`, data);
            setStatus({
              isOnline: true,
              version: data.version || 'Unknown',
              lastChecked: new Date(),
              error: undefined,
              responseTime,
            });
          } else {
            // Response is not JSON (might be HTML)
            console.warn(`[HealthCheck:${serviceName}] ⚠️ Non-JSON response:`, contentType);
            setStatus({
              isOnline: false,
              lastChecked: new Date(),
              error: 'Invalid response format (expected JSON)',
              responseTime,
            });
          }
        } catch (parseError) {
          // JSON parsing failed
          console.error(`[HealthCheck:${serviceName}] ❌ Parse error:`, parseError);
          setStatus({
            isOnline: false,
            lastChecked: new Date(),
            error: `Failed to parse response: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`,
            responseTime,
          });
        }
      } else {
        console.error(`[HealthCheck:${serviceName}] ❌ HTTP error:`, response.status, response.statusText);
        setStatus({
          isOnline: false,
          lastChecked: new Date(),
          error: `HTTP ${response.status}: ${response.statusText}`,
          responseTime,
        });
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      let errorMessage = 'Unknown error';

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = 'Request timeout';
          console.warn(`[HealthCheck:${serviceName}] ⏱️ Request timed out`);
        } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          errorMessage = 'Network error - service unreachable';
          console.error(`[HealthCheck:${serviceName}] 🌐 Network error:`, error.message);
        } else {
          errorMessage = error.message;
          console.error(`[HealthCheck:${serviceName}] ❌ Error:`, error);
        }
      }

      setStatus({
        isOnline: false,
        lastChecked: new Date(),
        error: errorMessage,
        responseTime: responseTime > timeout ? undefined : responseTime,
      });
    } finally {
      console.log(`[HealthCheck:${serviceName}] Check completed`);
      setIsChecking(false);
    }
  }, [endpoint, serviceName, timeout]);

  useEffect(() => {
    // Initial check
    checkHealth();

    // Set up interval for periodic checks
    const intervalId = setInterval(checkHealth, checkInterval);

    // Cleanup interval on unmount
    return () => {
      clearInterval(intervalId);
    };
  }, [checkHealth, checkInterval]);

  return {
    status,
    checkHealth,
    isChecking,
  };
};
