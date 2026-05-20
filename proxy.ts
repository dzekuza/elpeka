import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  // Unauthenticated → login
  if (
    !user &&
    (pathname.startsWith('/admin') || pathname.startsWith('/portal'))
  ) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (user) {
    const role = user.user_metadata?.role as string | undefined

    // Admin trying to access portal → redirect to admin
    if (role === 'admin' && pathname.startsWith('/portal')) {
      return NextResponse.redirect(new URL('/admin/estates', request.url))
    }

    // Owner trying to access admin → redirect to portal
    if (role === 'owner' && pathname.startsWith('/admin')) {
      return NextResponse.redirect(new URL('/portal/pagrindinis', request.url))
    }

    // Authenticated user at /login → redirect to their home
    if (pathname === '/login') {
      if (role === 'admin') {
        return NextResponse.redirect(new URL('/admin/estates', request.url))
      }
      if (role === 'owner') {
        return NextResponse.redirect(
          new URL('/portal/pagrindinis', request.url)
        )
      }
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
