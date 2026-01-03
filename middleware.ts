import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
    const res = NextResponse.next()
    const supabase = createMiddlewareClient({ req, res })

    const {
        data: { session },
    } = await supabase.auth.getSession()

    // Protected routes that require authentication
    const protectedRoutes = ['/dashboard', '/digital-menu', '/pos', '/pdf-menu', '/settings']
    const isProtectedRoute = protectedRoutes.some(route => req.nextUrl.pathname.startsWith(route))

    // Redirect to login if accessing protected route without session
    if (isProtectedRoute && !session) {
        const redirectUrl = req.nextUrl.clone()
        redirectUrl.pathname = '/login'
        redirectUrl.searchParams.set('redirectedFrom', req.nextUrl.pathname)
        return NextResponse.redirect(redirectUrl)
    }

    // Redirect to dashboard if accessing auth pages with active session
    if ((req.nextUrl.pathname.startsWith('/login') || req.nextUrl.pathname.startsWith('/register')) && session) {
        return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    return res
}

export const config = {
    matcher: ['/dashboard/:path*', '/digital-menu/:path*', '/pos/:path*', '/pdf-menu/:path*', '/settings/:path*', '/login', '/register'],
}
