import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nazhdcijmldlykjzkxxg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hemhkY2lqbWxkbHlranpreHhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjUyNjMzNjEsImV4cCI6MjA0MDgzOTM2MX0.ufpj-r9h2bHwe2Ctqe1gd1032-X0vyYMIHvhD-2C7y8';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;