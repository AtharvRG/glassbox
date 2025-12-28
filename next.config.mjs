/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable x-powered-by header for security
  poweredByHeader: false,
  
  // Enable strict mode for better React debugging
  reactStrictMode: true,
  
  // Compress responses
  compress: true,
};

export default nextConfig;
