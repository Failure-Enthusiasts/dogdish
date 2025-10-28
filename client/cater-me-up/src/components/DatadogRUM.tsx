'use client';
import { useEffect } from 'react';
import { datadogRum } from '@datadog/browser-rum';
// import { reactPlugin } from '@datadog/browser-rum-react';

export default function DatadogRUM() {
  useEffect(() => {
    // Ensure we're in the browser
    if (typeof window === 'undefined') {
      return;
    }

    try {
      // Only initialize if not already initialized
      if (!datadogRum.getInitConfiguration()) {
        console.log('[DatadogRUM] Initializing...');
        
        datadogRum.init({
          applicationId: 'fcd383c6-6b4b-4be8-80e7-3d2ce0bcf517',
          clientToken: 'pubcb25b34dccf53b78a53446b71c641bcf',
          site: 'datadoghq.com',
          service: 'dogdish',
          env: process.env.NODE_ENV === 'production' ? 'prod' : 'dev',
          version: '0.1.0',
          sessionSampleRate: 100,
          sessionReplaySampleRate: 100,
          trackUserInteractions: true,
          trackResources: true,
          trackLongTasks: true,
          // trackViewsManually: false,
          defaultPrivacyLevel: 'mask-user-input',
          allowedTracingUrls: [
            { match: 'http://localhost:3000', propagatorTypes: ['datadog'] },
            { match: /^https?:\/\/.*\.dogdish\.cc/, propagatorTypes: ['datadog'] }
          ],
          enableExperimentalFeatures: ['feature_flags'],
          // Explicitly set the intake URL
          proxy: undefined,
          // React plugin - React plugin seems to be causing issues with the tracking and/or is not 
          // plugins: [reactPlugin({ router: true })],
          // Debug callback
          beforeSend: (event) => {
            // Only log in development
            if (process.env.NODE_ENV !== 'production') {
              console.log('[DatadogRUM] 📤 Sending event:', event.type);
            }
            return true;
          },
        });
        
        console.log('[DatadogRUM] ✅ Initialized successfully');
        
        // Verify initialization
        const config = datadogRum.getInitConfiguration();
        if (config) {
          console.log('[DatadogRUM] Config verified:', {
            applicationId: config.applicationId,
            service: config.service,
            env: config.env,
          });
        }
        
        // Start session replay
        datadogRum.startSessionReplayRecording();
        console.log('[DatadogRUM] 🎥 Session replay started');
        
        // Send initialization action
        datadogRum.addAction('datadog_rum_initialized', {
          timestamp: new Date().toISOString(),
          version: '0.1.0',
          userAgent: navigator.userAgent,
        });
        console.log('[DatadogRUM] 📤 Test action sent');
        
        // Verify session after a short delay
        setTimeout(() => {
          const internalContext = datadogRum.getInternalContext();
          if (internalContext?.session_id) {
            console.log('[DatadogRUM] ✅ Active session:', internalContext.session_id);
          } else {
            console.error('[DatadogRUM] ❌ No active session! RUM may not be tracking.');
          }
          
          // Send another test event
          datadogRum.addError(new Error('Test error for Datadog verification'), {
            test: true,
            timestamp: Date.now(),
          });
          console.log('[DatadogRUM] 🧪 Test error sent for verification');
          
          // Add custom timing
          datadogRum.addTiming('rum_verification_check');
          console.log('[DatadogRUM] ⏱️ Custom timing added');
        }, 1000);
        
      } else {
        console.log('[DatadogRUM] Already initialized, skipping');
      }
    } catch (error) {
      console.error('[DatadogRUM] ❌ Failed to initialize:', error);
    }
  }, []);

  return null; // This component doesn't render anything
}