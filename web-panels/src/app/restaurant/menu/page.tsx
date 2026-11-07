'use client';

import React from 'react';
import RestaurantMenuManager from '../../../restaurant/MenuManager';

export default function RestaurantMenuRoute() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zciujeihkvleehhqbeat.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjaXVqZWloa3ZsZWVoaHFiZWF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxMjgyMzMsImV4cCI6MjEwNTcwNDIzM30.OLauEB8NwNxVb8hMzK9X8cJPXVKkpwzoh6FmrHnQ55w';

  const defaultRestaurantId = 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d';

  return (
    <RestaurantMenuManager
      restaurantId={defaultRestaurantId}
      supabaseUrl={supabaseUrl}
      supabaseAnonKey={supabaseAnonKey}
    />
  );
}
