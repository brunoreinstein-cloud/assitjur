import React from 'react';
import { Outlet } from 'react-router-dom';

export default function RelatoriosLayout() {
  return <Outlet />;
}

export async function loader() {
  return null;
}
