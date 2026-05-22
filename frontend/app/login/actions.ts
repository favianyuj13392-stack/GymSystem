"use server"

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function iniciarSesion(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Por favor, completa todos los campos.' }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    console.error('Error login:', error)
    return { error: 'Correo o contraseña incorrectos. Verifica tus credenciales.' }
  }

  redirect('/admin/socios')
}

export async function cerrarSesion() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
