declare module './actions' {
  export function registerOrganisation(formData: FormData): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }>;
}
