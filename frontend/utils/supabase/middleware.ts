import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
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
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
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

  const pathname = request.nextUrl.pathname
  const isAuthRoute = pathname.startsWith('/login')
  const isProtected = pathname.startsWith('/admin') || 
                      pathname.startsWith('/recepcion') ||
                      pathname.startsWith('/socios') && !pathname.startsWith('/socio/')

  if (!user && isProtected) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user) {
    if (isAuthRoute) {
      const url = request.nextUrl.clone()
      url.pathname = '/admin/socios'
      return NextResponse.redirect(url)
    }

    // Intercept admin-only routes for employees
    const isAdminOnlyRoute = pathname.startsWith('/admin/dashboard') || 
                             pathname.startsWith('/admin/empleados') ||
                             pathname.startsWith('/admin/pagos') ||
                             pathname.startsWith('/admin/analiticas')

    if (isAdminOnlyRoute) {
      try {
        const { data: empleado } = await supabase
          .from('empleados')
          .select('rol')
          .eq('id', user.id)
          .single()
        
        // Safe fallback to 'admin' if table/record is not found to prevent lockout/crashes
        const role = empleado?.rol || 'admin'
        
        if (role === 'empleado') {
          const url = request.nextUrl.clone()
          url.pathname = '/admin/socios'
          return NextResponse.redirect(url)
        }
      } catch (err) {
        console.error('Error in middleware role check, falling back to admin:', err)
      }
    }
  }

  return supabaseResponse
}
