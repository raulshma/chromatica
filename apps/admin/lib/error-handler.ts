// Global error handler for unhandled promise rejections
if (typeof window === 'undefined') {
  // Server-side error handling
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);

    // Check if it's the File URL path error we're tracking
    if (reason instanceof Error && reason.message.includes('File URL path must be absolute')) {
      console.error('File URL Error Details:');
      console.error('- Error code:', (reason as any)?.code);
      console.error('- Error input:', (reason as any)?.input);
      console.error('- Stack trace:', reason?.stack);

      // Try to find where this error is originating
      const stack = reason?.stack || '';
      if (stack.includes('route.ts')) {
        console.error('Error appears to be originating in route.ts');
      }
      if (stack.includes('api-client')) {
        console.error('Error appears to be originating in api-client.ts');
      }
    }
  });
} else {
  // Client-side error handling
  window.addEventListener('unhandledrejection', event => {
    console.error('Unhandled Rejection (client):', event.reason);

    // Check if it's the File URL path error we're tracking
    if (
      event.reason instanceof Error &&
      event.reason.message.includes('File URL path must be absolute')
    ) {
      console.error('File URL Error Details (client):');
      console.error('- Error code:', (event.reason as any)?.code);
      console.error('- Error input:', (event.reason as any)?.input);
      console.error('- Stack trace:', event.reason?.stack);
    }
  });
}

export function setupGlobalErrorHandler() {
  console.log('Global error handler initialized');
}
