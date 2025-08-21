        <link rel="manifest" href="/manifest.json" />
        <body className="antialiased">
          {children}
          <script
            dangerouslySetInnerHTML={{
              __html: `
                if ('serviceWorker' in navigator) {
                  window.addEventListener('load', () => {
                    navigator.serviceWorker.register('/service-worker.js')
                      .then((registration) => {
                        console.log('Service worker registered with scope:', registration.scope);

                        // Listen for changes in the service worker controller
                        navigator.serviceWorker.addEventListener('controllerchange', () => {
                          console.log('Controller changed. New service worker is active.');
                          // Prompt the user to refresh the page to use the new version
                          if (window.confirm('A new version of the app is available. Refresh to update?')) {
                            window.location.reload();
                          }
                        });

                        // Attempt to update the service worker registration
                        registration.update();
                      })
                      .catch((error) => {
                        console.error('Service worker registration failed:', error);
                      });
                  });
                }
              `,
            }}
          />
        </body>
      </html>
    </NetworkStatusProvider>
  );
}
