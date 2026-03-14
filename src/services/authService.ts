import supabase from "./supabaseClient"

export async function login(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })

  return { data, error }
}

export async function register(email: string, password: string, name: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name: name
      }
    }
  })

  return { data, error }
}

export async function logout() {
  const { error } = await supabase.auth.signOut()
  return { error }
}