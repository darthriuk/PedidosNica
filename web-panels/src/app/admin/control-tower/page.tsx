'use client';

import React from 'react';
import ControlTowerMap from '../../../admin/ControlTowerMap';

export default function ControlTowerRoute() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zciujeihkvleehhqbeat.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjaXVqZWloa3ZsZWVoaHFiZWF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxMjgyMzMsImV4cCI6MjEwNTcwNDIzM30.OLauEB8NwNxVb8hMzK9X8cJPXVKkpwzoh6FmrHnQ55w';

  return (
    <ControlTowerMap
      supabaseUrl={supabaseUrl}
      supabaseAnonKey={supabaseAnonKey}
    />
  );
}
