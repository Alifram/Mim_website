'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { signOut } from '@/lib/services/auth/auth-server-service'

export async function logout() {
  await signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}
