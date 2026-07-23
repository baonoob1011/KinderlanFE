// Google Authentication utility for handling Google Sign-In

declare global {
  interface Window {
    google: any;
  }
}

export class GoogleAuthService {
  private static instance: GoogleAuthService;
  private isInitialized = false;
  private clientId: string;

  private pendingResolve: ((credential: string) => void) | null = null;
  private pendingReject: ((error: Error) => void) | null = null;

  private constructor() {
    this.clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!this.clientId) {
      console.error('VITE_GOOGLE_CLIENT_ID is not defined in .env file');
    }
  }

  public static getInstance(): GoogleAuthService {
    if (!GoogleAuthService.instance) {
      GoogleAuthService.instance = new GoogleAuthService();
    }
    return GoogleAuthService.instance;
  }

  /**
   * Load the Google Identity Services script.
   */
  private loadScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (window.google?.accounts?.id) {
        resolve();
        return;
      }

      const existing = document.getElementById('google-sdk');
      if (existing) {
        existing.addEventListener('load', () => resolve());
        existing.addEventListener('error', () =>
          reject(new Error('Failed to load Google SDK')),
        );
        return;
      }

      const script = document.createElement('script');
      script.id = 'google-sdk';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Google SDK'));
      document.head.appendChild(script);
    });
  }

  /**
   * Initialize Google Sign-In SDK (called once).
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    await this.loadScript();

    window.google.accounts.id.initialize({
      client_id: this.clientId,
      callback: (response: any) => {
        if (response.credential && this.pendingResolve) {
          this.pendingResolve(response.credential);
        } else if (this.pendingReject) {
          this.pendingReject(new Error('No credential received from Google'));
        }
        this.pendingResolve = null;
        this.pendingReject = null;
      },
    });

    this.isInitialized = true;
  }

  /**
   * Sign in with Google — opens the Google login form directly.
   */
  public async signIn(): Promise<string> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    return new Promise<string>((resolve, reject) => {
      this.pendingResolve = resolve;
      this.pendingReject = reject;

      // Create a hidden container, render the Google button, and auto-click it
      // to open the Google login popup directly.
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'fixed';
      tempDiv.style.top = '-9999px';
      tempDiv.style.left = '-9999px';
      tempDiv.style.opacity = '0';
      tempDiv.style.pointerEvents = 'none';
      document.body.appendChild(tempDiv);

      window.google.accounts.id.renderButton(tempDiv, {
        theme: 'outline',
        size: 'large',
        width: 300,
      });

      // Wait for the button to render, then click it to open Google's login form
      setTimeout(() => {
        const iframe = tempDiv.querySelector('iframe');
        const button =
          tempDiv.querySelector('[role="button"]') as HTMLElement ??
          tempDiv.querySelector('div[style]') as HTMLElement;

        if (button) {
          button.click();
        } else if (iframe) {
          // GIS sometimes renders inside an iframe — try clicking that
          iframe.click();
        } else {
          document.body.removeChild(tempDiv);
          reject(new Error('Could not trigger Google Sign-In popup'));
          return;
        }

        // Clean up the hidden container after a short delay
        setTimeout(() => {
          if (tempDiv.parentNode) {
            document.body.removeChild(tempDiv);
          }
        }, 1000);
      }, 200);
    });
  }
}

export default GoogleAuthService;