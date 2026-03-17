import supabase from './supabaseClient'
import type { Category } from '../models/Category'

export async function getCategories() {
  try {
    const { data, error } = await supabase.from('categories').select('*')
    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}

export async function getCategoryById(id: string) {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}

export async function createCategory(category: Partial<Category>) {
  try {
    const { data, error } = await supabase
      .from('categories')
      .insert(category)
      .select()
      .single()
    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}

export async function updateCategory(id: string, category: Partial<Category>) {
  try {
    const { data, error } = await supabase
      .from('categories')
      .update(category)
      .eq('id', id)
      .select()
      .single()
    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}

export async function deleteCategory(id: string) {
  try {
    const { data, error } = await supabase.from('categories').delete().eq('id', id)
    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}
