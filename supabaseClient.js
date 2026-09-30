import { createClient } from '@supabase/supabase-js';

// Tus credenciales reales de Inmoviral
const supabaseUrl = 'https://egzxyullgyiuqghxuguh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnenh5dWxsZ3lpdXFnaHh1Z3VoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4Nzc2NzUsImV4cCI6MjA5NjQ1MzY3NX0._7XURcRZ_zGR7e7FstEIzAnbTEWcebYySy5oO5ThZpM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);