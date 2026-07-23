import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname;

  // Proteger rutas de admin de cada gimnasio
  if (path.startsWith('/admin')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Verificar que tenga gimnasio_id en JWT o que esté activo
    const jwtData = user.app_metadata as { gimnasio_id?: string; estado?: string };
    if (!jwtData?.gimnasio_id || jwtData?.estado === 'pendiente_activacion') {
      return NextResponse.redirect(new URL('/pendiente-activacion', request.url))
    }
  }

  // Proteger rutas del backoffice global del SaaS
  if (path.startsWith('/backoffice')) {
     if (!user) {
        return NextResponse.redirect(new URL('/login', request.url))
     }

     const jwtData = user.app_metadata as { rol?: string };
     if (jwtData?.rol !== 'system_admin') {
         return NextResponse.redirect(new URL('/', request.url))
     }
  }

  return response
}

export const config = {
  matcher: ['/admin/:path*', '/backoffice/:path*'],
}
