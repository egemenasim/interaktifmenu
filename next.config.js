/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '**.supabase.co',
            },
        ],
    },
    experimental: {
        serverActions: {
            bodySizeLimit: '30mb',
        },
    },
    typescript: {
        // Temporary workaround for Supabase type inference issues
        ignoreBuildErrors: true,
    },
}

module.exports = nextConfig
